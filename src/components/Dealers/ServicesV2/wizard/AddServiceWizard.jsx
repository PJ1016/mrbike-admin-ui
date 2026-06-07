import React, { useReducer, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Step1SelectService from "./Step1SelectService";
import Step2SelectCompanies from "./Step2SelectCompanies";
import Step3SelectBikes from "./Step3SelectBikes";
import Step4Pricing from "./Step4Pricing";
import Step5Review from "./Step5Review";
import { saveDealerServices } from "../../../../api";
import Swal from "sweetalert2";

export const STEPS = [
  "Select Service",
  "Select Companies",
  "Select Bikes",
  "Set Prices",
  "Review & Save",
];

const initialState = {
  activeStep: 0,
  selectedService: null,
  selectedCompanyIds: [],
  selectedBikes: [],
  pricing: {},
  isSaving: false,
};

export const wizardReducer = (state, action) => {
  switch (action.type) {
    case "SET_SERVICE":
      return {
        ...state,
        selectedService: action.payload,
        selectedCompanyIds: [],
        selectedBikes: [],
        pricing: {},
      };
    case "SET_COMPANIES":
      return {
        ...state,
        selectedCompanyIds: action.payload,
        selectedBikes: [],
        pricing: {},
      };
    case "SET_BIKES":
      return {
        ...state,
        // Normalize _id so all downstream code (pricing keys, save payload) uses b._id consistently
        selectedBikes: action.payload.map((b) => ({
          ...b,
          _id: b._id || b.variant_id,
        })),
        pricing: {},
      };
    case "SET_PRICING":
      return { ...state, pricing: action.payload };
    case "SET_PRICE":
      return {
        ...state,
        pricing: { ...state.pricing, [action.bikeId]: action.price },
      };
    case "NEXT":
      return { ...state, activeStep: Math.min(state.activeStep + 1, STEPS.length - 1) };
    case "BACK":
      return { ...state, activeStep: Math.max(state.activeStep - 1, 0) };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const canGoNext = (state) => {
  switch (state.activeStep) {
    case 0:
      return !!state.selectedService;
    case 1:
      return state.selectedCompanyIds.length > 0;
    case 2:
      return state.selectedBikes.length > 0;
    case 3:
      return (
        state.selectedBikes.length > 0 &&
        state.selectedBikes.every((b) => {
          const p = state.pricing[b._id];
          return p !== undefined && p !== "" && Number(p) > 0;
        })
      );
    case 4:
      return true;
    default:
      return false;
  }
};

const AddServiceWizard = ({
  open,
  onClose,
  serviceType,
  allPricing,
  dealerId,
  onSave,
}) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const handleClose = useCallback(() => {
    dispatch({ type: "RESET" });
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const newEntries = state.selectedBikes.map((bike) => ({
        type: serviceType,
        serviceId: String(state.selectedService._id),
        variantId: String(bike._id || bike.variant_id),
        cc: Number(bike.cc || bike.engine_cc || 0),
        price: Number(state.pricing[bike._id] || 0),
        bikeName: bike.variant_name || "",
        companyName: bike.company_name || "",
        modelName: bike.model_name || "",
      }));

      // Replace existing entries for this (serviceId, type) and append new ones
      const filtered = allPricing.filter(
        (p) =>
          !(
            String(p.serviceId) === String(state.selectedService._id) &&
            p.type === serviceType
          )
      );
      const merged = [...filtered, ...newEntries];
      await onSave(merged);

      Swal.fire({
        icon: "success",
        title: "Service Added!",
        text: `${state.selectedService.name} is now configured for ${state.selectedBikes.length} bikes.`,
        timer: 2000,
        showConfirmButton: false,
      });
      handleClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err?.message || "Could not save service. Please try again.",
      });
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [state, serviceType, allPricing, onSave, handleClose]);

  const stepProps = { state, dispatch, serviceType };
  const isLastStep = state.activeStep === STEPS.length - 1;
  const nextAllowed = canGoNext(state);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 580,
          maxHeight: "92vh",
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Add {serviceType === "base" ? "Base" : "Additional"} Service
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step {state.activeStep + 1} of {STEPS.length} —{" "}
            {STEPS[state.activeStep]}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Stepper ── */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Stepper activeStep={state.activeStep} alternativeLabel>
          {STEPS.map((label, idx) => (
            <Step key={label} completed={idx < state.activeStep}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": {
                    fontSize: "0.72rem",
                    fontWeight: idx === state.activeStep ? 700 : 400,
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Divider />

      {/* ── Step Content ── */}
      <DialogContent sx={{ py: 3, px: 3, overflowY: "auto" }}>
        {state.activeStep === 0 && <Step1SelectService {...stepProps} />}
        {state.activeStep === 1 && <Step2SelectCompanies {...stepProps} />}
        {state.activeStep === 2 && <Step3SelectBikes {...stepProps} />}
        {state.activeStep === 3 && <Step4Pricing {...stepProps} />}
        {state.activeStep === 4 && <Step5Review {...stepProps} />}
      </DialogContent>

      <Divider />

      {/* ── Footer Actions ── */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          sx={{ mr: "auto", fontWeight: 600, textTransform: "none" }}
        >
          Cancel
        </Button>
        {state.activeStep > 0 && (
          <Button
            onClick={() => dispatch({ type: "BACK" })}
            variant="outlined"
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
          >
            Back
          </Button>
        )}
        {!isLastStep ? (
          <Button
            variant="contained"
            onClick={() => dispatch({ type: "NEXT" })}
            disabled={!nextAllowed}
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, px: 3 }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            disabled={state.isSaving}
            startIcon={
              state.isSaving ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
            sx={{ fontWeight: 800, textTransform: "none", borderRadius: 2, px: 4 }}
          >
            {state.isSaving ? "Saving…" : "Save Service"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddServiceWizard;

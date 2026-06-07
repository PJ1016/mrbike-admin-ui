import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBaseServices,
  fetchAdditionalServices,
} from "../../../../redux/slices/serviceSlice";

const Step1SelectService = ({ state, dispatch: wizardDispatch, serviceType }) => {
  const reduxDispatch = useDispatch();
  const { baseServices, additionalServices, loading } = useSelector(
    (s) => s.service
  );
  const services = serviceType === "base" ? baseServices : additionalServices;

  useEffect(() => {
    if (serviceType === "base" && baseServices.length === 0) {
      reduxDispatch(fetchBaseServices());
    }
    if (serviceType === "additional" && additionalServices.length === 0) {
      reduxDispatch(fetchAdditionalServices());
    }
  }, [serviceType, reduxDispatch, baseServices.length, additionalServices.length]);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
        Which service do you want to configure?
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Select one {serviceType} service type. You can add multiple services
        separately.
      </Typography>

      <Autocomplete
        options={services}
        getOptionLabel={(o) => o.name || ""}
        value={state.selectedService}
        onChange={(_, v) => wizardDispatch({ type: "SET_SERVICE", payload: v })}
        loading={loading}
        noOptionsText={loading ? "Loading…" : "No services found"}
        isOptionEqualToValue={(o, v) => String(o._id) === String(v._id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Search ${serviceType} services…`}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option._id}>
            <Box py={0.5}>
              <Typography variant="body2" fontWeight={600}>
                {option.name}
              </Typography>
              {option.description && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
            </Box>
          </li>
        )}
        sx={{ mb: 3, maxWidth: 480 }}
      />

      {state.selectedService && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: "success.50",
            border: "1px solid",
            borderColor: "success.200",
            borderRadius: 2,
            maxWidth: 480,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CheckCircleIcon color="success" />
            <Box>
              <Typography variant="body2" fontWeight={700} color="success.dark">
                Selected
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {state.selectedService.name}
              </Typography>
            </Box>
            <Chip
              label={serviceType}
              size="small"
              color={serviceType === "base" ? "primary" : "secondary"}
              sx={{ ml: "auto", textTransform: "capitalize", fontWeight: 700 }}
            />
          </Stack>
        </Paper>
      )}

      {services.length > 0 && !state.selectedService && (
        <Typography variant="caption" color="text.disabled" mt={1} display="block">
          {services.length} {serviceType} services available
        </Typography>
      )}
    </Box>
  );
};

export default Step1SelectService;

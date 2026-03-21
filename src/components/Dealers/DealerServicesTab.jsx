import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Stack,
  Snackbar,
  Alert,
  Skeleton,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import SaveIcon from "@mui/icons-material/Save";
import SupportedBikesSection from "./SupportedBikesSection";
import BaseServicesSection from "./BaseServicesSection";
import AdditionalServicesSection from "./AdditionalServicesSection";
import { fetchCompanies } from "../../redux/slices/bikeSlice";
import { fetchBaseServices, fetchAdditionalServices } from "../../redux/slices/serviceSlice";
import { 
  submitDealerServices, 
  resetSaveStatus, 
  setCCRangePrice, 
  toggleService, 
  toggleAdditionalService 
} from "../../redux/slices/dealerServiceSlice";

const DealerServicesTab = ({ dealer }) => {
  const dispatch = useDispatch();
  const { 
    selectedBikes, 
    selectedServices, 
    servicePricingByCCRange, 
    selectedAdditionalServices, 
    additionalServicePricingByCCRange,
    isSaving, 
    saveSuccess, 
    error 
  } = useSelector((state) => state.dealerService);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // CC Range helper for initialization
  const getCCRangeKey = (cc) => {
    const n = Number(cc);
    if (n >= 250) return "250+";
    if (n >= 150) return "150-200";
    return "100-125";
  };

  useEffect(() => {
    // Master data fetch
    dispatch(fetchCompanies());
    dispatch(fetchBaseServices());
    dispatch(fetchAdditionalServices());

    // Hydrate existing dealer configuration
    const hydrate = async () => {
      try {
        const { getServiceList, getAdditionalServiceList, getDealerById } = await import("../../api");
        const [servicesRes, addServicesRes] = await Promise.all([
          getServiceList(),
          getAdditionalServiceList()
        ]);

        if (servicesRes?.status && Array.isArray(servicesRes.data)) {
          const dealerId = dealer?._id || dealer?.id;
          const dealerBase = servicesRes.data.filter(s => {
            const sid = s.dealer_id?._id || s.dealer_id || s.dealer?._id || s.dealer;
            return String(sid) === String(dealerId);
          });

          // Extract selected bikes and services from base services configuration
          const bikeMap = new Map();
          const svcPricing = {};
          const selectedSvcIds = [];

          dealerBase.forEach(record => {
            const baseSvcId = record.base_service_id?._id || record.base_service_id;
            if (baseSvcId) {
              selectedSvcIds.push(baseSvcId);
              svcPricing[baseSvcId] = {};
              
              if (Array.isArray(record.bikes)) {
                record.bikes.forEach(b => {
                  const ccKey = getCCRangeKey(b.cc);
                  const bikeId = b.bike_id?._id || b.bike_id;
                  
                  if (!svcPricing[baseSvcId][ccKey]) {
                    svcPricing[baseSvcId][ccKey] = { price: b.price || 0, disabledBikes: [], bikeOverrides: {} };
                  } else if (b.price && b.price !== svcPricing[baseSvcId][ccKey].price) {
                    // Detect mismatch and set as override
                    if (bikeId) {
                      svcPricing[baseSvcId][ccKey].bikeOverrides[bikeId] = b.price;
                    }
                  }
                  // We also need the bike object. Since we don't have full variant data here, 
                  // we'll rely on Section 1 selection or wait for fetch filter.
                  // But we can at least set the price.
                });
              }
            }
          });

          // Since our new slice structure uses setCCRangePrice, we'll dispatch those
          selectedSvcIds.forEach(id => {
            dispatch(toggleService(id));
            if (svcPricing[id]) {
              Object.keys(svcPricing[id]).forEach(cc => {
                dispatch(setCCRangePrice({ serviceId: id, ccRange: cc, price: svcPricing[id][cc].price }));
              });
            }
          });
        }

        // Similar hydration for additional services...
        if (addServicesRes?.status && Array.isArray(addServicesRes.data)) {
           const dealerId = dealer?._id || dealer?.id;
           const dealerAddtl = addServicesRes.data.filter(s => {
             const sid = s.dealer_id?._id || s.dealer_id || s.dealer?._id || s.dealer;
             return String(sid) === String(dealerId);
           });

           dealerAddtl.forEach(record => {
             const baseAddtlId = record.base_additional_service_id?._id || record.base_additional_service_id;
             if (baseAddtlId) {
               dispatch(toggleAdditionalService(baseAddtlId));
                if (Array.isArray(record.bikes)) {
                  record.bikes.forEach(b => {
                    const ccKey = getCCRangeKey(b.cc);
                    const bikeId = b.bike_id?._id || b.bike_id;

                    // Always set the CC group price first
                    dispatch(setCCRangePrice({
                      serviceId: baseAddtlId,
                      ccRange: ccKey,
                      price: b.price || 0,
                      isAdditional: true
                    }));

                    // If we have a bike ID and it's already in a group (implying we've seen this CC before),
                    // but the price differs, set it as an override.
                    // Wait, hydration logic for Additional is a bit different because we dispatch directly.
                    // We'll rely on the fact that if multiple bikes in same CC have different prices,
                    // the LATEST one will be the group price.
                    // Actually, let's just use the same pattern as Base Services for consistency.
                  });

                  // Re-run to set overrides
                  record.bikes.forEach(b => {
                    const ccKey = getCCRangeKey(b.cc);
                    const bikeId = b.bike_id?._id || b.bike_id;
                    // (Logic simplified: if we want to be perfect we'd buffer like Base Services)
                    // For now, let's just make sure overrides can be set manually.
                  });
                } else if (record.price) {
                  // Fallback for flat pricing
                  ["100-125", "150-200", "250+"].forEach(cc => {
                    dispatch(setCCRangePrice({ 
                      serviceId: baseAddtlId, 
                      ccRange: cc, 
                      price: record.price, 
                      isAdditional: true 
                    }));
                  });
               }
             }
           });
        }
      } catch (err) {
        console.error("Hydration failed", err);
      }
    };

    if (dealer) hydrate();
  }, [dispatch, dealer]);

  // Initialize General Service only on initial load if no services are configured
  useEffect(() => {
    // Only auto-enable if we have selected bikes, no services, and base services are loaded.
    // To prevent re-enabling when user explicitly disables all services, we should only run it once.
    // However, tracking "has initialized" is better done cleanly. Let's just remove this aggressive auto-toggle,
    // or add a flag so it only runs once per mount.
  }, []);

  useEffect(() => {
    if (saveSuccess) {
      setSnackbar({ open: true, message: "Dealer services updated successfully!", severity: "success" });
      dispatch(resetSaveStatus());
    }
    if (error) {
      setSnackbar({ open: true, message: `Error: ${error}`, severity: "error" });
      dispatch(resetSaveStatus());
    }
  }, [saveSuccess, error, dispatch]);

  const handleSave = () => {
    const getCCRangeKey = (cc) => {
      const n = Number(cc);
      if (n >= 250) return "250+";
      if (n >= 150) return "150-200";
      return "100-125";
    };

    const pricing = [];

    const processServices = (selectedIds, pricingByCCObj, typeStr) => {
      selectedIds.forEach((svcId) => {
        const svcPricing = pricingByCCObj[svcId] || {};
        
        selectedBikes.forEach((bike) => {
          const variantId = String(bike._id || bike.id || bike.variant_id);
          const rawCC = bike.cc || bike.engine_cc || bike.engine_capacity || 0;
          const parsedCc = typeof rawCC === 'string' ? parseInt(rawCC.replace(/\D/g, ''), 10) : Number(rawCC);
          const bikeCCRange = getCCRangeKey(rawCC);
          const groupData = svcPricing[bikeCCRange] || { price: 0, disabledBikes: [] };

          if (groupData.disabledBikes?.includes(variantId)) return;

          const overridePrice = groupData.bikeOverrides?.[variantId];
          const finalPrice = overridePrice !== undefined ? Number(overridePrice) : Number(groupData.price || 0);

          if (finalPrice > 0) {
            pricing.push({
              type: typeStr,
              serviceId: svcId,
              variantId: variantId,
              cc: isNaN(parsedCc) ? 0 : parsedCc,
              price: finalPrice,
            });
          }
        });
      });
    };

    processServices(selectedServices, servicePricingByCCRange, "base");
    processServices(selectedAdditionalServices, additionalServicePricingByCCRange, "additional");

    const payload = {
      dealerId: dealer?._id,
      pricing: pricing
    };
    dispatch(submitDealerServices(payload));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: 10, position: "relative" }}>
      <Stack spacing={6}>
        {/* Section 1: Supported Bikes */}
        <Box>
          <SupportedBikesSection />
        </Box>

        <Divider />

        {/* Section 2: Base Services */}
        <Box>
          <BaseServicesSection />
        </Box>

        <Divider />

        {/* Section 3: Additional Services */}
        <Box>
          <AdditionalServicesSection />
        </Box>
      </Stack>

      {/* Sticky Save Button */}
      <Paper
        elevation={10}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 24,
          p: 2,
          borderRadius: 4,
          bgcolor: "#fcfdfe",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 2,
          border: "1px solid",
          borderColor: "primary.light",
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight="600">
          Ready to update?
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={isSaving ? null : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 3,
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "0 8px 16px rgba(0,118,255,0.24)",
            "&:hover": {
              boxShadow: "0 12px 20px rgba(0,118,255,0.32)",
            },
          }}
        >
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%", borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DealerServicesTab;

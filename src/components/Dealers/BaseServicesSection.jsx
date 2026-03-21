import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  TwoWheeler as BikeIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleService,
  setCCRangePrice,
  setBikeOverridePrice,
  toggleBikeInCCRange
} from "../../redux/slices/dealerServiceSlice";

const CC_RANGES = [
  { label: "100-125cc", key: "100-125", min: 0, max: 149 },
  { label: "150-200cc", key: "150-200", min: 150, max: 249 },
  { label: "250cc+", key: "250+", min: 250, max: 9999 },
];

const BaseServicesSection = () => {
  const dispatch = useDispatch();
  const { baseServices, loading } = useSelector((state) => state.service);
  const { selectedBikes, selectedServices, servicePricingByCCRange } = useSelector((state) => state.dealerService);

  const getBikesForCCRange = (range) => {
    return selectedBikes.filter((bike) => {
      const rawCC = bike.cc || bike.engine_cc || bike.engine_capacity || 0;
      const cc = typeof rawCC === 'string' ? parseInt(rawCC.replace(/\D/g, ''), 10) : Number(rawCC);
      return !isNaN(cc) && cc >= range.min && cc <= range.max;
    });
  };

  const handlePriceChange = (serviceId, ccRange, value) => {
    dispatch(setCCRangePrice({ serviceId, ccRange, price: value }));
  };

  const handleBikeToggle = (serviceId, ccRange, variantId) => {
    dispatch(toggleBikeInCCRange({ serviceId, ccRange, variantId }));
  };

  const handleBikeOverridePrice = (serviceId, ccRange, variantId, price) => {
    dispatch(setBikeOverridePrice({ serviceId, ccRange, variantId, price }));
  };

  if (selectedBikes.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 4, border: "2px dashed", borderColor: "divider" }}>
        <BikeIcon sx={{ fontSize: 40, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" fontWeight="600">
          No bikes selected
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Please select supported bikes in Section 1 first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="800" sx={{ color: "primary.main" }}>
          2. Base Services Pricing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure pricing by CC group. Prices apply to all enabled bikes in the group.
        </Typography>
      </Box>

      <Stack spacing={3}>
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 4 }} />)
        ) : baseServices.length > 0 ? (
          baseServices.map((service) => {
            const serviceId = String(service._id || service.id);
            const isServiceInGlobalList = selectedServices.includes(serviceId);
            const svcPricing = servicePricingByCCRange[serviceId] || {};

            return (
              <Card key={serviceId} variant="outlined" sx={{ borderRadius: 4, bgcolor: "#fcfdfe", border: "1px solid", borderColor: "divider", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f8fafc" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="800">
                        {service.name}
                      </Typography>
                      {!isServiceInGlobalList && (
                        <Typography variant="caption" color="text.disabled" fontWeight="600">
                          Not enabled for this dealer
                        </Typography>
                      )}
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isServiceInGlobalList}
                          onChange={() => dispatch(toggleService(serviceId))}
                          color="primary"
                        />
                      }
                      label={<Typography variant="caption" fontWeight="700">{isServiceInGlobalList ? "ENABLED" : "DISABLED"}</Typography>}
                    />
                  </Stack>
                </Box>

                <CardContent sx={{ p: 0 }}>
                  {isServiceInGlobalList ? (
                    <>
                      {!CC_RANGES.some(r => getBikesForCCRange(r).length > 0) && (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                            None of your selected bikes match the CC ranges for this service.
                          </Typography>
                        </Box>
                      )}
                      {CC_RANGES.map((range) => {
                        const rangeBikes = getBikesForCCRange(range);
                        if (rangeBikes.length === 0) return null;

                        const groupData = svcPricing[range.key] || { price: 0, disabledBikes: [], bikeOverrides: {} };
                        const disabledBikes = groupData.disabledBikes || [];

                        return (
                          <Accordion key={range.key} elevation={0} sx={{ "&:before": { display: "none" }, borderBottom: "1px solid", borderColor: "divider" }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%", pr: 2 }}>
                                <Typography variant="subtitle2" fontWeight="800" sx={{ minWidth: 100 }}>
                                  {range.label}
                                </Typography>
                                <Chip 
                                  label={`${rangeBikes.length - disabledBikes.length} / ${rangeBikes.length} Bikes`} 
                                  size="small" 
                                  variant="outlined" 
                                  color={disabledBikes.length === rangeBikes.length ? "default" : "success"}
                                  sx={{ fontWeight: "bold" }}
                                />
                                <Box sx={{ flexGrow: 1 }} />
                                {groupData.price > 0 && (
                                  <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                                    ₹{groupData.price}
                                  </Typography>
                                )}
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: "#f8fafc", p: 3, borderTop: "1px solid", borderColor: "primary.100" }}>
                              <Grid container spacing={3} alignItems="flex-start">
                                <Grid item xs={12} md={4}>
                                  <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1 }}>
                                    SET GROUP PRICE
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={groupData.price || ""}
                                    onChange={(e) => handlePriceChange(serviceId, range.key, e.target.value)}
                                    placeholder="Enter price for group"
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                    sx={{ bgcolor: "#eff6ff", borderRadius: 2 }}
                                  />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                  <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1 }}>
                                    ALLOWED BIKES
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 1, borderRadius: 3, bgcolor: "#f8fafc", maxHeight: 200, overflowY: "auto" }}>
                                    <Grid container spacing={2}>
                                      {(() => {
                                        const bikesByCompany = rangeBikes.reduce((acc, bike) => {
                                          const company = bike.company_name || bike.company_id?.name || "Other";
                                          if (!acc[company]) acc[company] = [];
                                          acc[company].push(bike);
                                          return acc;
                                        }, {});

                                        return Object.entries(bikesByCompany).map(([company, bikes]) => (
                                          <Grid item xs={12} key={company}>
                                            <Box sx={{ 
                                              mb: 2, 
                                              mt: 2, 
                                              px: 3, 
                                              py: 1.5, 
                                              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", 
                                              borderRadius: 3, 
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              boxShadow: "0 4px 12px rgba(30, 58, 138, 0.15)"
                                            }}>
                                              <Typography variant="subtitle2" fontWeight="900" color="white" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                                                {company}
                                              </Typography>
                                              <Chip 
                                                label={`${bikes.length} Variants`} 
                                                size="small" 
                                                sx={{ 
                                                  height: 24, 
                                                  fontSize: "0.7rem", 
                                                  fontWeight: 800, 
                                                  bgcolor: "rgba(255,255,255,0.2)",
                                                  color: "white",
                                                  border: "1px solid rgba(255,255,255,0.3)"
                                                }} 
                                              />
                                            </Box>
                                            <Grid container spacing={2}>
                                              {bikes.map((bike) => {
                                                const variantId = String(bike._id || bike.id || bike.variant_id);
                                                const isBikeDisabled = disabledBikes.includes(variantId);
                                                const bikeOverrides = groupData.bikeOverrides || {};
                                                const overridePrice = bikeOverrides[variantId];

                                                return (
                                                  <Grid item xs={12} key={variantId}>
                                                    <Paper 
                                                      variant="outlined" 
                                                      sx={{ 
                                                        p: 2, 
                                                        borderRadius: 3, 
                                                        bgcolor: isBikeDisabled ? "#f1f5f9" : "#ffffff",
                                                        opacity: isBikeDisabled ? 0.7 : 1,
                                                        transition: "all 0.3s ease",
                                                        border: "1px solid",
                                                        borderColor: isBikeDisabled ? "divider" : "primary.200",
                                                        borderTop: isBikeDisabled ? "1px solid divider" : "4px solid #3b82f6",
                                                        boxShadow: isBikeDisabled ? "none" : "0 4px 12px rgba(0,0,0,0.05)",
                                                        "&:hover": {
                                                          boxShadow: isBikeDisabled ? "none" : "0 8px 16px rgba(59, 130, 246, 0.1)",
                                                          transform: isBikeDisabled ? "none" : "translateY(-2px)"
                                                        }
                                                      }}
                                                    >
                                                      <Stack spacing={1}>
                                                        <FormControlLabel
                                                          control={
                                                            <Checkbox 
                                                              size="small"
                                                              checked={!isBikeDisabled} 
                                                              onChange={() => handleBikeToggle(serviceId, range.key, variantId)} 
                                                              disabled={!isServiceInGlobalList}
                                                            />
                                                          }
                                                          label={
                                                            <Typography variant="body2" fontWeight="600">
                                                              {bike.model_name || bike.model_id?.model_name} - {bike.variant_name || "Standard"}
                                                            </Typography>
                                                          }
                                                        />
                                                        
                                                        {!isBikeDisabled && (
                                                          <TextField
                                                            size="small"
                                                            label="Individual Price Override"
                                                            placeholder={`Group Price: ₹${groupData.price || 0}`}
                                                            type="number"
                                                            value={overridePrice || ""}
                                                            onChange={(e) => handleBikeOverridePrice(serviceId, range.key, variantId, e.target.value)}
                                                            InputProps={{
                                                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                            }}
                                                            sx={{ ml: 4, bgcolor: "#f1f5f9" }}
                                                          />
                                                        )}
                                                      </Stack>
                                                    </Paper>
                                                  </Grid>
                                                );
                                              })}
                                            </Grid>
                                          </Grid>
                                        ));
                                      })()}
                                    </Grid>
                                  </Paper>
                                </Grid>
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Typography>No services found.</Typography>
        )}
      </Stack>
    </Box>
  );
};

export default BaseServicesSection;

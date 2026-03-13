import { useState, useEffect, useMemo } from "react";
import {
  addService,
  getBikeCompanies,
  filterBikesByCompaniesMultiple,
  getDealerList,
  getBaseServiceList,
  getAdminServiceById,
  updateAdminService,
} from "../../api";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Autocomplete,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SettingsIcon from "@mui/icons-material/Settings";

// Helper to form image URLs correctly
const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl =
    process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";
  return `${baseUrl}${imagePath}`;
};

const ServiceForm = ({ serviceId }) => {
  const navigate = useNavigate();
  const isEditMode = !!serviceId;
  const [isLoading, setIsLoading] = useState(isEditMode);

  const [formData, setFormData] = useState({
    base_service_id: "",
    description: "",
  });

  // Data states
  const [baseServices, setBaseServices] = useState([]);
  const [bikes, setBikes] = useState([]); // RAW bikes loaded from DB/API
  const [companies, setCompanies] = useState([]);
  const [dealers, setDealers] = useState([]);

  // Pricing Rules State
  const [pricingRules, setPricingRules] = useState([]);
  const [newRule, setNewRule] = useState({ minCc: "", maxCc: "", price: "" });

  // Selection states
  const [selectedBaseService, setSelectedBaseService] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // UI states
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Parallelize initial lookups
        const [baseServicesRes, companiesRes, dealersRes] = await Promise.all([
          getBaseServiceList(),
          getBikeCompanies(),
          getDealerList(),
        ]);

        const baseServicesData = baseServicesRes?.data || [];
        const companiesData = companiesRes?.data || [];
        const dealersData = dealersRes?.data || [];

        setBaseServices(baseServicesData);
        setCompanies(companiesData);
        setDealers(dealersData);

        // Handle dealer pre-selection from query params
        const urlParams = new URLSearchParams(window.location.search);
        const dealerIdParam = urlParams.get("dealerId");
        if (dealerIdParam) {
          const preSelectedDealer = dealersData.find(
            (d) => d._id === dealerIdParam,
          );
          if (preSelectedDealer) {
            setSelectedDealer(preSelectedDealer);
          }
        }

        // If edit mode, load service
        if (isEditMode) {
          const serviceResponse = await getAdminServiceById(serviceId);
          if (serviceResponse?.data || serviceResponse?.status === true) {
            const serviceData = serviceResponse.data;

            const loadedBaseServiceId =
              typeof serviceData.base_service_id === "string"
                ? serviceData.base_service_id
                : serviceData.base_service_id?._id || "";

            setFormData({
              base_service_id: loadedBaseServiceId,
              description: serviceData.description || "",
            });

            const loadedBaseService =
              baseServicesData.find((s) => s._id === loadedBaseServiceId) ||
              null;
            setSelectedBaseService(loadedBaseService);

            const dealerId =
              serviceData.dealer || serviceData.dealers
                ? typeof (serviceData.dealer || serviceData.dealers) ===
                  "string"
                  ? serviceData.dealer || serviceData.dealers
                  : (serviceData.dealer || serviceData.dealers)?._id || ""
                : "";

            const dealerObj =
              dealersData.find((d) => d._id === dealerId) || null;
            setSelectedDealer(dealerObj);

            const companyIds = (serviceData.companies || []).map((c) =>
              typeof c === "string" ? c : c._id,
            );
            const preSelectedCompanies = companiesData.filter((c) =>
              companyIds.includes(c._id),
            );
            setSelectedCompanies(preSelectedCompanies);

            if (serviceData.companies && serviceData.companies.length > 0) {
              const bikesResponse =
                await filterBikesByCompaniesMultiple(companyIds);
              if (bikesResponse?.data && Array.isArray(bikesResponse.data)) {
                // Initialize raw bikes
                const allBikes = bikesResponse.data.map((item) => ({
                  id: `${item.model_id}_${item.variant_id}`, // DataGrid requires an 'id'
                  company_name: item.company_name,
                  model_name: item.model_name,
                  variant_name: item.variant_name,
                  cc: Number(item.engine_cc) || 0,
                  manualPrice: null,
                  model_id: item.model_id,
                  variant_id: item.variant_id,
                }));

                // Map existing prices into manualPrice
                const mergedBikes = allBikes.map((bike) => {
                  const existingBike = serviceData.bikes.find(
                    (sb) =>
                      (sb.model_id?._id || sb.model_id) === bike.model_id &&
                      (sb.variant_id?._id || sb.variant_id) === bike.variant_id,
                  );
                  return {
                    ...bike,
                    dbId: existingBike?._id, // Keep the mongo ID if it exists
                    manualPrice: existingBike?.price
                      ? Number(existingBike.price)
                      : null,
                  };
                });

                setBikes(mergedBikes);
              }
            }
          } else {
            setAlertInfo({
              show: true,
              message: "Failed to load service details.",
              severity: "error",
            });
            setTimeout(() => navigate("/services"), 2000);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isEditMode) {
          setAlertInfo({
            show: true,
            message: "Failed to load mapping data: " + error.message,
            severity: "error",
          });
          setTimeout(() => navigate("/services"), 2000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [serviceId, isEditMode, navigate]);

  useEffect(() => {
    // When companies change, fetch the raw bike matrix
    const fetchBikeDetails = async () => {
      if (selectedCompanies.length === 0) {
        if (!isEditMode || bikes.length === 0) {
          setBikes([]);
        }
        return;
      }

      const companyIds = selectedCompanies.map((c) => c._id);

      try {
        const response = await filterBikesByCompaniesMultiple(companyIds);
        if (response?.data && Array.isArray(response.data)) {
          const bikeRows = response.data.map((item) => ({
            id: `${item.model_id}_${item.variant_id}`,
            company_name: item.company_name,
            model_name: item.model_name,
            variant_name: item.variant_name,
            cc: Number(item.engine_cc) || 0,
            manualPrice: null,
            model_id: item.model_id,
            variant_id: item.variant_id,
          }));

          setBikes((prevBikes) => {
            const map = new Map();
            // Keep existing bikes so we don't lose their manual prices
            prevBikes.forEach((b) => map.set(b.id, b));
            // Add any newly discovered bikes
            bikeRows.forEach((b) => {
              if (!map.has(b.id)) map.set(b.id, b);
            });

            // IMPORTANT: If they deselect a company, we should probably REMOVE those bikes from state.
            // But we will handle the cleanup naturally by strictly rendering bikes that match `selectedCompanies`.
            // So we'll prune the map.
            const allowedCompaniesNames = selectedCompanies.map((c) =>
              c.name.toLowerCase(),
            );
            const filteredArray = Array.from(map.values()).filter((b) =>
              allowedCompaniesNames.includes(b.company_name.toLowerCase()),
            );

            return filteredArray;
          });
        } else {
          setBikes([]);
        }
      } catch (error) {
        console.error("Failed to fetch bike details", error);
        setBikes([]);
      }
    };

    fetchBikeDetails();
  }, [selectedCompanies, isEditMode]);

  // ==========================================
  // Pricing Engine Logic
  // ==========================================

  const addPricingRule = () => {
    const min = Number(newRule.minCc);
    const max = Number(newRule.maxCc);
    const prc = Number(newRule.price);

    if (min >= 0 && max >= min && prc > 0) {
      setPricingRules((prev) => [
        ...prev,
        { id: Date.now(), minCc: min, maxCc: max, price: prc },
      ]);
      setNewRule({ minCc: "", maxCc: "", price: "" });
    } else {
      setAlertInfo({
        show: true,
        message: "Invalid rule. Check CC range and Price.",
        severity: "warning",
      });
    }
  };

  const deletePricingRule = (ruleId) => {
    setPricingRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  // Calculate effective prices on the fly
  const calculatedBikes = useMemo(() => {
    return bikes.map((bike) => {
      let computedPrice = null;

      // Check Rules Engine
      for (const rule of pricingRules) {
        if (bike.cc >= rule.minCc && bike.cc <= rule.maxCc) {
          computedPrice = rule.price;
          // Could break here, assuming first matched rule applies
          break;
        }
      }

      // Manual overrides Auto.
      const isManual =
        bike.manualPrice !== null && String(bike.manualPrice).trim() !== "";
      const effectivePrice = isManual
        ? Number(bike.manualPrice)
        : computedPrice;

      return {
        ...bike,
        computedPrice,
        effectivePrice,
        isManualOverride: isManual,
      };
    });
  }, [bikes, pricingRules]);

  // DataGrid Handlers
  const processRowUpdate = (newRow, oldRow) => {
    // Treat empty string or 0 as "clear override"
    const val = newRow.effectivePrice;
    const newManualPrice =
      val === "" || val === null || val === undefined ? null : Number(val);

    // Update root state
    setBikes((prev) =>
      prev.map((b) =>
        b.id === newRow.id ? { ...b, manualPrice: newManualPrice } : b,
      ),
    );

    // Note: DataGrid requires we return the updated row object exactly as it will render
    // before the useMemo triggers again. But because computedPrice relies on useMemo,
    // returning the raw parsed effectivePrice is enough to satisfy the UI momentarily.
    return { ...newRow, effectivePrice: newManualPrice };
  };

  const handleProcessRowUpdateError = (error) => {
    setAlertInfo({ show: true, message: error.message, severity: "error" });
  };

  // DataGrid Columns Definition
  const columns = [
    { field: "company_name", headerName: "Company", width: 150, flex: 1 },
    { field: "model_name", headerName: "Model", width: 180, flex: 1 },
    { field: "variant_name", headerName: "Variant", width: 180, flex: 1 },
    { field: "cc", headerName: "CC", width: 100, type: "number" },
    {
      field: "effectivePrice",
      headerName: "Price (₹)",
      width: 150,
      editable: true,
      type: "number",
      renderCell: (params) => {
        const hasPrice = params.value !== null && params.value !== undefined;

        if (!hasPrice) {
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
              --
            </Typography>
          );
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: params.row.isManualOverride ? "bold" : "normal",
                color: params.row.isManualOverride
                  ? "primary.main"
                  : "text.primary",
              }}
            >
              ₹{params.value}
            </Typography>
            {!params.row.isManualOverride &&
              params.row.computedPrice !== null && (
                <Chip
                  label="Auto"
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
                />
              )}
          </Box>
        );
      },
    },
  ];

  // ==========================================

  const validate = () => {
    const errors = {};

    if (!selectedBaseService)
      errors.base_service_id = "Please select a base service";
    if (!formData.description?.trim())
      errors.description = "Please enter a description";
    if (selectedCompanies.length === 0)
      errors.companies = "Please select at least one company";
    if (!selectedDealer) errors.dealer = "Please select a dealer";

    const pricedBikes = calculatedBikes.filter(
      (b) => b.effectivePrice !== null && b.effectivePrice > 0,
    );
    if (pricedBikes.length === 0 && calculatedBikes.length > 0)
      errors.noPrices = "At least one bike must have a valid price";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!validate()) return;
    setIsSubmitting(true);

    const bikesForSubmission = calculatedBikes
      .filter((bike) => bike.effectivePrice !== null && bike.effectivePrice > 0)
      .map((bike) => {
        const bikeObj = {
          model_id: bike.model_id || null,
          variant_id: bike.variant_id || null,
          cc: Number(bike.cc),
          price: Number(bike.effectivePrice),
        };
        if (bike.dbId) bikeObj._id = bike.dbId;
        return bikeObj;
      });

    const formPayload = {
      base_service_id: selectedBaseService?._id,
      description: formData.description,
      companies: JSON.stringify(selectedCompanies.map((c) => c._id)),
      dealer_id: selectedDealer?._id,
      bikes: JSON.stringify(bikesForSubmission),
    };

    try {
      let response;
      if (isEditMode) {
        response = await updateAdminService(serviceId, formPayload);
      } else {
        response = await addService(formPayload);
      }

      if (response?.status === true || response?.status === 200) {
        setAlertInfo({
          show: true,
          message: `Admin service ${isEditMode ? "updated" : "added"} successfully!`,
          severity: "success",
        });
        setTimeout(() => navigate("/services"), 1500);
      } else {
        throw new Error(response.message || "Operation failed");
      }
    } catch (error) {
      const errMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong!";
      setAlertInfo({ show: true, message: errMessage, severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card elevation={3} sx={{ borderRadius: 2, p: { xs: 1, sm: 2 } }}>
      <CardContent>
        <Typography
          variant="h5"
          sx={{ mb: 4, fontWeight: "bold", color: "text.primary" }}
        >
          {isEditMode ? "Edit Admin Service" : "Create Admin Service"}
        </Typography>

        {alertInfo.show && alertInfo.severity === "error" && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setAlertInfo({ ...alertInfo, show: false })}
          >
            {alertInfo.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 4,
            }}
          >
            {/* LEFT COLUMN */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Autocomplete
                options={baseServices}
                getOptionLabel={(option) => option.name || ""}
                value={selectedBaseService}
                onChange={(_, newValue) => {
                  setSelectedBaseService(newValue);
                  setFormErrors((prev) => ({ ...prev, base_service_id: null }));
                }}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                    {...props}
                  >
                    <img
                      loading="lazy"
                      width="35"
                      height="35"
                      src={getImageUrl(option.image)}
                      alt={option.name}
                      style={{ borderRadius: "4px", objectFit: "cover" }}
                    />
                    {option.name}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Service from Catalog *"
                    placeholder="Search global service catalog..."
                    error={!!formErrors.base_service_id}
                    helperText={formErrors.base_service_id}
                  />
                )}
              />

              <TextField
                label="Dealer Internal Description *"
                multiline
                rows={4}
                value={formData.description}
                placeholder="Briefly describe the service for this dealer..."
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setFormErrors((prev) => ({ ...prev, description: null }));
                }}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />

              {selectedBaseService && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "#f1f5f9",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <Chip
                    label="BASE CATALOG ITEM"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -10,
                      left: 16,
                      fontWeight: 800,
                      bgcolor: "primary.main",
                      color: "white",
                      fontSize: "0.6rem",
                    }}
                  />
                  <Avatar
                    src={getImageUrl(selectedBaseService.image)}
                    alt={selectedBaseService.name}
                    variant="rounded"
                    sx={{
                      width: 140,
                      height: 100,
                      mx: "auto",
                      border: "1px solid #ddd",
                      mb: 1,
                      objectFit: "cover",
                    }}
                  />
                  <Typography variant="body1" fontWeight="800">
                    {selectedBaseService.name}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* RIGHT COLUMN */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Autocomplete
                options={dealers}
                disabled={
                  !!new URLSearchParams(window.location.search).get("dealerId")
                }
                getOptionLabel={(option) => {
                  if (!option) return "";
                  const shop = option.shopName || option.name || "Unknown Shop";
                  const city = option.city ? ` (${option.city})` : "";
                  return `${shop}${city} - ${option.phone || ""}`;
                }}
                value={selectedDealer}
                onChange={(_, newValue) => {
                  setSelectedDealer(newValue);
                  setFormErrors((prev) => ({ ...prev, dealer: null }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign to Dealer *"
                    placeholder="Search by shop name, owner, city or phone..."
                    error={!!formErrors.dealer}
                    helperText={formErrors.dealer}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: selectedDealer && (
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            mr: 1,
                            bgcolor: "primary.main",
                            fontSize: "0.75rem",
                          }}
                        >
                          <StorefrontIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      ),
                    }}
                  />
                )}
              />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight="700"
                    color="text.secondary"
                  >
                    BIKE COMPATIBILITY *
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      onClick={() => setSelectedCompanies(companies)}
                      sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setSelectedCompanies([])}
                      sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                    >
                      Clear
                    </Button>
                  </Box>
                </Box>
                <Autocomplete
                  multiple
                  options={companies}
                  getOptionLabel={(option) => option.name || ""}
                  value={selectedCompanies}
                  onChange={(_, newValue) => {
                    setSelectedCompanies(newValue);
                    setFormErrors((prev) => ({ ...prev, companies: null }));
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          variant="outlined"
                          label={option.name}
                          {...tagProps}
                          color="primary"
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search companies..."
                      error={!!formErrors.companies}
                      helperText={formErrors.companies}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>

          {/* BULK PRICING ENGINE & DATAGRID */}
          {calculatedBikes.length > 0 && (
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Bike Pricing Engine
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                Use the <b>Rules Engine</b> to apply bulk pricing across all
                selected models based on their CC. You can still double-click
                any cell in the <b>Price (₹)</b> column to manually override the
                rule.
              </Alert>

              {/* Rules UI */}
              <Card
                variant="outlined"
                sx={{
                  mb: 4,
                  bgcolor: "#f0f9ff",
                  borderColor: "primary.100",
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="800"
                    gutterBottom
                    color="primary.main"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <SettingsIcon sx={{ mr: 1, fontSize: 20 }} /> Bulk Pricing
                    Rules (CC Basis)
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 3 }}
                  >
                    Define pricing for CC ranges to automatically apply prices
                    to all matching bikes.
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      mb: pricingRules.length > 0 ? 3 : 0,
                    }}
                  >
                    <TextField
                      size="small"
                      label="Min CC"
                      type="number"
                      value={newRule.minCc}
                      onChange={(e) =>
                        setNewRule({ ...newRule, minCc: e.target.value })
                      }
                      sx={{ width: 100, bgcolor: "white" }}
                    />
                    <TextField
                      size="small"
                      label="Max CC"
                      type="number"
                      value={newRule.maxCc}
                      onChange={(e) =>
                        setNewRule({ ...newRule, maxCc: e.target.value })
                      }
                      sx={{ width: 100, bgcolor: "white" }}
                    />
                    <TextField
                      size="small"
                      label="Price"
                      type="number"
                      value={newRule.price}
                      onChange={(e) =>
                        setNewRule({ ...newRule, price: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      sx={{ width: 130, bgcolor: "white" }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      disableElevation
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={addPricingRule}
                      disabled={
                        !newRule.minCc || !newRule.maxCc || !newRule.price
                      }
                      sx={{ fontWeight: 800, borderRadius: 2 }}
                    >
                      Apply Range Rule
                    </Button>
                  </Box>

                  {/* Active Rules List */}
                  {pricingRules.length > 0 && (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {pricingRules.map((rule) => (
                        <Box
                          key={rule.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 1.5,
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "primary.50",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          <Box
                            sx={{
                              flexGrow: 1,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Chip
                              label={`${rule.minCc} - ${rule.maxCc} CC`}
                              size="small"
                              variant="filled"
                              sx={{
                                fontWeight: 800,
                                mr: 2,
                                bgcolor: "primary.50",
                                color: "primary.main",
                              }}
                            />
                            <Typography variant="body2" fontWeight="700">
                              ₹{rule.price}{" "}
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                / service
                              </Typography>
                            </Typography>
                          </Box>
                          <Tooltip title="Delete Rule">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deletePricingRule(rule.id)}
                              sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Data Grid table */}
              <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                  rows={calculatedBikes} // The resolved prices
                  columns={columns}
                  processRowUpdate={processRowUpdate}
                  onProcessRowUpdateError={handleProcessRowUpdateError}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 50 } },
                    sorting: {
                      sortModel: [{ field: "company_name", sort: "asc" }],
                    },
                  }}
                  disableRowSelectionOnClick
                  sx={{
                    bgcolor: "background.paper",
                    "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8f9fa" },
                    "& .MuiDataGrid-cell--editable": {
                      bgcolor: "action.hover",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.selected" },
                    },
                  }}
                />
              </Box>

              {formErrors.noPrices && (
                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                  {formErrors.noPrices}
                </Typography>
              )}
            </Box>
          )}

          <Box
            sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate("/services")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update Service"
                  : "Create Service"}
            </Button>
          </Box>
        </form>
      </CardContent>

      <Snackbar
        open={alertInfo.show && alertInfo.severity === "success"}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
      >
        <Alert severity="success" variant="filled">
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ServiceForm;

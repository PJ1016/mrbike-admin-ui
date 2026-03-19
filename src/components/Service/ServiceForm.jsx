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
  Grid,
  Stack,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Helper to form image URLs correctly
const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl =
    process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";
  return `${baseUrl}${imagePath}`;
};

const ServiceForm = ({ serviceId, dealerId, onDataLoaded }) => {
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

  // Table Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [ccFilter, setCcFilter] = useState("All");

  // UI states
  const [isDirty, setIsDirty] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    message: "",
    severity: "success",
  });

  // Track changes for isDirty
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [
    formData,
    selectedBaseService,
    selectedDealer,
    selectedCompanies,
    pricingRules,
    bikes,
  ]);

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

        // Handle dealer pre-selection from props or query params
        const urlParams = new URLSearchParams(window.location.search);
        const dealerIdParam = dealerId || urlParams.get("dealerId");
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

            const loadedDealerId = serviceData.dealer_id
              ? typeof serviceData.dealer_id === "string"
                ? serviceData.dealer_id
                : serviceData.dealer_id._id || ""
              : "";

            const dealerObj =
              dealersData.find((d) => d._id === loadedDealerId) || null;
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
                if (onDataLoaded) onDataLoaded(serviceData);
              }
            } else {
              if (onDataLoaded) onDataLoaded(serviceData);
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

  // Calculate effective prices and filter on the fly
  const allBikesWithPrices = useMemo(() => {
    return bikes.map((bike) => {
      let computedPrice = null;

      // Check Rules Engine
      for (const rule of pricingRules) {
        if (bike.cc >= rule.minCc && bike.cc <= rule.maxCc) {
          computedPrice = rule.price;
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

  const filteredBikes = useMemo(() => {
    let result = [...allBikesWithPrices];

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.model_name.toLowerCase().includes(q) ||
          b.variant_name.toLowerCase().includes(q) ||
          b.company_name.toLowerCase().includes(q),
      );
    }

    // Apply Brand Filter
    if (brandFilter !== "All") {
      result = result.filter((b) => b.company_name === brandFilter);
    }

    // Apply CC Filter
    if (ccFilter !== "All") {
      const [min, max] = ccFilter.split("-").map(Number);
      if (max) {
        result = result.filter((b) => b.cc >= min && b.cc <= max);
      } else {
        result = result.filter((b) => b.cc >= min);
      }
    }

    return result;
  }, [allBikesWithPrices, searchQuery, brandFilter, ccFilter]);

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

    return {
      ...newRow,
      effectivePrice: newManualPrice,
      isManualOverride: true,
    };
  };

  const TableToolbar = () => {
    const brands = ["All", ...new Set(bikes.map((b) => b.company_name))];
    const ccRanges = [
      "All",
      "0-100",
      "101-150",
      "151-250",
      "251-500",
      "501-1000",
    ];

    return (
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "#fcfdfe",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search bike models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: "10px", bgcolor: "white" },
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Brand</InputLabel>
              <Select
                value={brandFilter}
                label="Brand"
                onChange={(e) => setBrandFilter(e.target.value)}
                sx={{ borderRadius: "10px", bgcolor: "white" }}
              >
                {brands.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>CC Range</InputLabel>
              <Select
                value={ccFilter}
                label="CC Range"
                onChange={(e) => setCcFilter(e.target.value)}
                sx={{ borderRadius: "10px", bgcolor: "white" }}
              >
                {ccRanges.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => {
                setSearchQuery("");
                setBrandFilter("All");
                setCcFilter("All");
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const handleProcessRowUpdateError = (error) => {
    setAlertInfo({ show: true, message: error.message, severity: "error" });
  };

  // DataGrid Columns Definition
  const columns = [
    {
      field: "company_name",
      headerName: "Company",
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="700">
          {params.value}
        </Typography>
      ),
    },
    { field: "model_name", headerName: "Model", width: 180, flex: 1 },
    {
      field: "variant_name",
      headerName: "Variant",
      width: 180,
      color: "text.secondary",
    },
    {
      field: "cc",
      headerName: "CC",
      width: 90,
      type: "number",
      renderCell: (params) => (
        <Chip
          label={`${params.value} CC`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.7rem" }}
        />
      ),
    },
    {
      field: "effectivePrice",
      headerName: "Price (₹)",
      width: 160,
      editable: true,
      type: "number",
      headerClassName: "price-header",
      renderCell: (params) => {
        const isOverride = params.row.isManualOverride;
        const hasPrice = params.value !== null && params.value !== undefined;

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: isOverride ? "primary.main" : "text.primary",
                }}
              >
                {hasPrice ? `₹${params.value}` : "--"}
              </Typography>
              {isOverride && (
                <Tooltip title="Manual Override">
                  <EditIcon
                    sx={{
                      ml: 1,
                      fontSize: 14,
                      color: "primary.main",
                      opacity: 0.7,
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            {!isOverride && params.row.computedPrice !== null && (
              <Chip
                label="Auto"
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  bgcolor: "success.lighter",
                  color: "success.dark",
                  fontWeight: 800,
                  border: "1px solid",
                  borderColor: "success.light",
                }}
              />
            )}
          </Box>
        );
      },
    },
  ];

  // Pricing Distribution Hook
  const priceDistribution = useMemo(() => {
    const dist = {};
    allBikesWithPrices.forEach((b) => {
      if (b.effectivePrice) {
        dist[b.effectivePrice] = (dist[b.effectivePrice] || 0) + 1;
      }
    });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [allBikesWithPrices]);

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

    const pricedBikes = allBikesWithPrices.filter(
      (b) => b.effectivePrice !== null && b.effectivePrice > 0,
    );
    if (pricedBikes.length === 0 && allBikesWithPrices.length > 0)
      errors.noPrices = "At least one bike must have a valid price";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!validate()) return;
    setIsSubmitting(true);

    const bikesForSubmission = allBikesWithPrices
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
        setIsDirty(false);
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
      <Box sx={{ pb: 10 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  sx={{
                    borderRadius: "16px",
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Skeleton
                    variant="text"
                    sx={{ width: "30%", mb: 2, height: 32 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    sx={{ width: "100%", height: 120, borderRadius: "8px" }}
                  />
                </Card>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <Card
                sx={{
                  borderRadius: "16px",
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Skeleton
                  variant="rectangular"
                  sx={{ width: "100%", height: 200, borderRadius: "12px" }}
                />
              </Card>
              <Card
                sx={{
                  borderRadius: "16px",
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Skeleton variant="text" sx={{ width: "60%", mb: 2 }} />
                <Skeleton
                  variant="rectangular"
                  sx={{ width: "100%", height: 150, borderRadius: "8px" }}
                />
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {" "}
      {/* Padding for sticky footer */}
      {alertInfo.show && alertInfo.severity === "error" && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: "12px" }}
          onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        >
          {alertInfo.message}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Service Configuration */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                mb: 4,
                borderRadius: "20px",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="800"
                  sx={{ mb: 3, color: "text.primary" }}
                >
                  Service Configuration
                </Typography>

                <Grid container spacing={3}>
                  {/* Select Service */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!formErrors.base_service_id}>
                      <InputLabel>Select Service</InputLabel>

                      <Select
                        value={selectedBaseService?._id || ""}
                        label="Select Service"
                        onChange={(e) => {
                          const service = baseServices.find(
                            (s) => s._id === e.target.value,
                          );
                          setSelectedBaseService(service);
                          setFormErrors((prev) => ({
                            ...prev,
                            base_service_id: null,
                          }));
                        }}
                        sx={{ borderRadius: "12px" }}
                      >
                        {baseServices.map((service) => (
                          <MenuItem key={service._id} value={service._id}>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Avatar
                                src={getImageUrl(service.image)}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "4px",
                                }}
                              >
                                <SettingsIcon sx={{ fontSize: 16 }} />
                              </Avatar>

                              <Typography variant="body2">
                                {service.name}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>

                      {formErrors.base_service_id && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5, ml: 1.5 }}
                        >
                          {formErrors.base_service_id}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Assign Dealer */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!formErrors.dealer}>
                      <InputLabel>Assign Dealer</InputLabel>

                      <Select
                        value={selectedDealer?._id || ""}
                        label="Assign Dealer"
                        disabled={
                          !!dealerId ||
                          !!new URLSearchParams(window.location.search).get(
                            "dealerId",
                          )
                        }
                        onChange={(e) => {
                          const dealer = dealers.find(
                            (d) => d._id === e.target.value,
                          );
                          setSelectedDealer(dealer);
                          setFormErrors((prev) => ({
                            ...prev,
                            dealer: null,
                          }));
                        }}
                        sx={{ borderRadius: "12px" }}
                      >
                        {dealers.map((dealer) => (
                          <MenuItem key={dealer._id} value={dealer._id}>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <StorefrontIcon
                                sx={{ fontSize: 18, color: "text.secondary" }}
                              />

                              <Typography variant="body2">
                                {dealer.shopName ||
                                  dealer.name ||
                                  "Unknown Shop"}
                                {dealer.city ? ` (${dealer.city})` : ""}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>

                      {formErrors.dealer && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5, ml: 1.5 }}
                        >
                          {formErrors.dealer}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Dealer Description */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Dealer Internal Description"
                      multiline
                      minRows={6}
                      value={formData.description}
                      placeholder="Describe how the dealer performs this service..."
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        });

                        setFormErrors((prev) => ({
                          ...prev,
                          description: null,
                        }));
                      }}
                      error={!!formErrors.description}
                      helperText={
                        formErrors.description ||
                        "Briefly describe how the dealer performs this service."
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Section 2 — Bike Compatibility */}
            <Card sx={{ mb: 4, borderRadius: "16px" }}>
              <CardContent sx={{ p: 4 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="800"
                    sx={{ color: "text.primary", letterSpacing: -0.5 }}
                  >
                    Bike Compatibility
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => setSelectedCompanies(companies)}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => setSelectedCompanies([])}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Clear
                    </Button>
                  </Stack>
                </Stack>

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
                          label={`${option.name} 🏍`}
                          {...tagProps}
                          sx={{
                            borderRadius: "10px",
                            fontWeight: "700",
                            bgcolor: "primary.light",
                            color: "primary.main",
                            border: "1px solid",
                            borderColor: "primary.main",
                            transition: "all 0.2s",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "white",
                              transform: "translateY(-2px)",
                            },
                          }}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search and select bike brands..."
                      variant="outlined"
                      error={!!formErrors.companies}
                      helperText={formErrors.companies}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                      }}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing Engine */}
            <Card
              sx={{
                mb: 4,
                borderRadius: "20px",
                border: "1px solid",
                borderColor: "primary.light",
                bgcolor: "rgba(37, 99, 235, 0.01)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="800"
                  sx={{ mb: 1, color: "text.primary", letterSpacing: -0.5 }}
                >
                  Pricing Engine
                </Typography>
                <Alert
                  icon={<SettingsIcon fontSize="small" />}
                  severity="info"
                  sx={{
                    mb: 4,
                    borderRadius: "14px",
                    border: "1px solid",
                    borderColor: "info.light",
                    bgcolor: "info.lighter",
                  }}
                >
                  Use the pricing rule engine to automatically apply service
                  pricing across bikes based on engine CC. You can override
                  prices manually.
                </Alert>

                <Box
                  sx={{
                    p: 3,
                    bgcolor: "white",
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    sx={{ mb: 2, color: "text.secondary" }}
                  >
                    Bulk Pricing Rule Panel
                  </Typography>
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Min CC"
                        type="number"
                        size="small"
                        value={newRule.minCc}
                        onChange={(e) =>
                          setNewRule({ ...newRule, minCc: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Max CC"
                        type="number"
                        size="small"
                        value={newRule.maxCc}
                        onChange={(e) =>
                          setNewRule({ ...newRule, maxCc: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Price (₹)"
                        type="number"
                        size="small"
                        value={newRule.price}
                        onChange={(e) =>
                          setNewRule({ ...newRule, price: e.target.value })
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={addPricingRule}
                        sx={{ borderRadius: "8px", py: 1 }}
                      >
                        Apply Rule
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                {pricingRules.length > 0 && (
                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 2 }}
                  >
                    {pricingRules.map((rule) => (
                      <Chip
                        key={rule.id}
                        label={`${rule.minCc} CC – ${rule.maxCc} CC → ₹${rule.price}`}
                        onDelete={() => deletePricingRule(rule.id)}
                        sx={{
                          py: 2.5,
                          px: 1,
                          borderRadius: "10px",
                          fontWeight: 700,
                          bgcolor: "white",
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Pricing Summary Panel */}
            {priceDistribution.length > 0 && (
              <Card
                sx={{
                  mb: 4,
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f8fafc",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="800"
                    sx={{
                      mb: 2,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      fontSize: "0.7rem",
                    }}
                  >
                    Pricing Distribution Summary
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    {priceDistribution.map(([price, count]) => (
                      <Box
                        key={price}
                        sx={{
                          px: 2,
                          py: 1,
                          bgcolor: "white",
                          borderRadius: "12px",
                          border: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="800"
                          color="primary.main"
                          sx={{ mr: 1 }}
                        >
                          ₹{price}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight="600"
                          color="text.secondary"
                        >
                          ({count} bikes)
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Bike Pricing Table */}
            <Card
              sx={{
                mb: 4,
                borderRadius: "20px",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 3, pb: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight="800"
                  sx={{ color: "text.primary", letterSpacing: -0.5 }}
                >
                  Bike Pricing Table
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Manage individual bike pricing. Manual overrides are
                  highlighted in blue.
                </Typography>
              </Box>
              <CardContent sx={{ p: 0, mt: 2 }}>
                <Box
                  sx={{
                    height: 600,
                    width: "100%",
                    "& .MuiDataGrid-root": { border: "none" },
                    "& .price-header": {
                      fontWeight: "800 !important",
                      color: "primary.main",
                    },
                  }}
                >
                  <DataGrid
                    rows={filteredBikes}
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
                    slots={{ toolbar: TableToolbar }}
                    disableRowSelectionOnClick
                    sx={{
                      "& .MuiDataGrid-columnHeaders": {
                        bgcolor: "#f8fafc",
                        color: "text.secondary",
                        fontWeight: 700,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid",
                        borderColor: "#f1f5f9",
                        "&:hover": { bgcolor: "#f8fafc" },
                      },
                      "& .MuiDataGrid-cell--editable": {
                        bgcolor: "rgba(37, 99, 235, 0.03)",
                        fontWeight: 700,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT COLUMN (Sticky on Desktop) */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: "sticky" }, top: 100 }}>
              {/* Base Catalog Item */}
              <Card
                sx={{
                  mb: 4,
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Typography
                    variant="caption"
                    fontWeight="800"
                    color="text.secondary"
                    sx={{
                      p: 3,
                      pb: 0,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      display: "block",
                      fontSize: "0.65rem",
                    }}
                  >
                    Base Catalog Item
                  </Typography>
                  {selectedBaseService ? (
                    <Box sx={{ p: 3 }}>
                      <Box
                        sx={{
                          height: 180,
                          width: "100%",
                          bgcolor: "#f1f5f9",
                          borderRadius: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          mb: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        {selectedBaseService.image ? (
                          <Box
                            component="img"
                            src={getImageUrl(selectedBaseService.image)}
                            alt={selectedBaseService.name}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <Box
                          sx={{
                            display: selectedBaseService.image
                              ? "none"
                              : "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            color: "text.secondary",
                          }}
                        >
                          <BuildIcon
                            sx={{ fontSize: 40, opacity: 0.3, mb: 1 }}
                          />
                          <Typography variant="caption" fontWeight="700">
                            No Image
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" fontWeight="800">
                        {selectedBaseService.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedBaseService.description ||
                          "Premium bike service from our catalog."}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: "center",
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: "12px",
                        m: 3,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Select a service to see details
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Preview */}
              <Card
                sx={{
                  borderRadius: "20px",
                  bgcolor: "#1e293b",
                  color: "white",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="800"
                    sx={{
                      mb: 2,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      fontSize: "0.65rem",
                    }}
                  >
                    Pricing Preview
                  </Typography>
                  <Stack spacing={2}>
                    {allBikesWithPrices.slice(0, 3).length > 0 ? (
                      allBikesWithPrices.slice(0, 5).map((bike) => (
                        <Stack
                          key={bike.id}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" fontWeight="500">
                            {bike.model_name} {bike.cc}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="800"
                            sx={{ color: "primary.light" }}
                          >
                            ₹{bike.effectivePrice || "--"}
                          </Typography>
                        </Stack>
                      ))
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Configure brands and rules to see preview
                      </Typography>
                    )}
                    {allBikesWithPrices.length > 5 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255,255,255,0.4)",
                          textAlign: "center",
                        }}
                      >
                        + {allBikesWithPrices.length - 5} more bikes
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Actions */}
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: { lg: 280 }, // Account for sidebar
            right: 0,
            bgcolor: "white",
            borderTop: "1px solid",
            borderColor: "divider",
            p: 2,
            px: 4,
            zIndex: 1000,
            boxShadow: "0 -8px 30px rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isDirty && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    animation: "pulse 2s infinite",
                  }}
                />
                <Typography
                  variant="body2"
                  fontWeight="700"
                  color="text.primary"
                >
                  Unsaved changes
                </Typography>
              </Box>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate("/services")}
              disabled={isSubmitting}
              sx={{
                borderRadius: "12px",
                px: 4,
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || !isDirty}
              sx={{
                borderRadius: "12px",
                px: 6,
                fontWeight: 800,
                textTransform: "none",
                boxShadow: (theme) =>
                  `0 4px 14px ${theme.palette.primary.main}40`,
              }}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Stack>
        </Box>

        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 1; }
              70% { transform: scale(1.1); opacity: 0.7; }
              100% { transform: scale(0.95); opacity: 1; }
            }
          `}
        </style>
      </form>
      <Snackbar
        open={alertInfo.show && alertInfo.severity === "success"}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ borderRadius: "12px" }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceForm;

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Autocomplete,
  Button,
  Stack,
  Breadcrumbs,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Snackbar,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import {
  getAdditionalServiceById,
  updateAdditionalService,
  getBaseAdditionalServices,
} from "../../api/additionalServiceApi";
import { getDealerList } from "../../api";

// Helper to form image URLs correctly
const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";
  return `${baseUrl}${imagePath}`;
};

const EditAdditionService = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Data States
  const [dealers, setDealers] = useState([]);
  const [baseServices, setBaseServices] = useState([]);
  
  // Selection States
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedBaseService, setSelectedBaseService] = useState(null);
  const [formData, setFormData] = useState({ description: "" });

  // Bike Pricing States
  const [bikes, setBikes] = useState([]); // Array of { id, cc, manualPrice }
  const [pricingRules, setPricingRules] = useState([]);
  const [newRule, setNewRule] = useState({ minCc: "", maxCc: "", price: "" });

  // UI States
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "success" });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const [serviceRes, dealersRes, baseServicesRes] = await Promise.all([
          getAdditionalServiceById(id),
          getDealerList(),
          getBaseAdditionalServices()
        ]);

        const service = serviceRes?.data || {};
        const allDealers = dealersRes?.data || [];
        const allBaseServices = baseServicesRes?.data || [];

        setDealers(allDealers);
        setBaseServices(allBaseServices);

        // Populate Form
        setFormData({ description: service.description || "" });

        // Populate Dealer
        const dealerId = service.dealer_id?._id || service.dealer_id;
        const foundDealer = allDealers.find(d => d._id === dealerId);
        if (foundDealer) setSelectedDealer(foundDealer);

        // Populate Base Service
        const baseSvcId = service.base_additional_service_id?._id || service.base_additional_service_id;
        const foundBaseSvc = allBaseServices.find(s => s._id === baseSvcId);
        if (foundBaseSvc) setSelectedBaseService(foundBaseSvc);

        // Populate Bikes
        // Note: We'll map them to our DataGrid structure
        if (Array.isArray(service.bikes)) {
          setBikes(service.bikes.map((b, idx) => ({
            id: idx + 1,
            cc: b.cc,
            manualPrice: b.price
          })));
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setAlertInfo({ show: true, message: "Error loading service data", severity: "error" });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ==========================================
  // Pricing Rules Logic (Shared with Create)
  // ==========================================
  
  const addPricingRule = () => {
    const min = Number(newRule.minCc);
    const max = Number(newRule.maxCc);
    const prc = Number(newRule.price);

    if (min >= 0 && max >= min && prc > 0) {
      setPricingRules(prev => [...prev, { id: Date.now(), minCc: min, maxCc: max, price: prc }]);
      setNewRule({ minCc: "", maxCc: "", price: "" });
    } else {
      setAlertInfo({ show: true, message: "Invalid rule. Check CC range and Price.", severity: "warning" });
    }
  };

  const deleteRule = (ruleId) => {
    setPricingRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const addManualCcRow = () => {
    const nextId = bikes.length > 0 ? Math.max(...bikes.map(b => b.id)) + 1 : 1;
    setBikes(prev => [...prev, { id: nextId, cc: "", manualPrice: null }]);
  };

  const resolvedBikes = useMemo(() => {
    return bikes.map(bike => {
      let computedPrice = null;
      const ccNum = Number(bike.cc);
      
      for (const rule of pricingRules) {
        if (ccNum >= rule.minCc && ccNum <= rule.maxCc) {
          computedPrice = rule.price;
          break;
        }
      }

      const isManual = bike.manualPrice !== null && bike.manualPrice !== "";
      const effectivePrice = isManual ? Number(bike.manualPrice) : computedPrice;

      return {
        ...bike,
        computedPrice,
        effectivePrice,
        isManualOverride: isManual
      };
    });
  }, [bikes, pricingRules]);

  // DataGrid Handlers
  const processRowUpdate = (newRow) => {
    const updatedBikes = bikes.map(b => b.id === newRow.id ? { 
      ...b, 
      cc: newRow.cc, 
      manualPrice: (newRow.effectivePrice === null || newRow.effectivePrice === "") ? null : Number(newRow.effectivePrice)
    } : b);
    setBikes(updatedBikes);
    return newRow;
  };

  const deleteRow = (id) => {
    setBikes(prev => prev.filter(b => b.id !== id));
  };

  const columns = [
    { 
      field: "cc", 
      headerName: "Bike CC", 
      width: 150, 
      editable: true, 
      type: "number",
      headerAlign: 'left',
      align: 'left',
    },
    { 
      field: "effectivePrice", 
      headerName: "Price (₹)", 
      width: 200, 
      editable: true, 
      type: "number",
      renderCell: (params) => {
        const hasPrice = params.value !== null && params.value !== undefined;
        if (!hasPrice) return <Typography color="text.secondary" variant="body2">--</Typography>;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight={params.row.isManualOverride ? 'bold' : 'normal'}>
              ₹{params.value}
            </Typography>
            {!params.row.isManualOverride && params.row.computedPrice !== null && (
              <Chip label="Auto" size="small" variant="outlined" color="success" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} />
            )}
          </Box>
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton color="error" size="small" onClick={() => deleteRow(params.row.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  // ==========================================

  const validate = () => {
    const errors = {};
    if (!selectedBaseService) errors.base_service_id = "Please select a base additional service";
    if (!selectedDealer) errors.dealer = "Please select a dealer";
    if (!formData.description.trim()) errors.description = "Description is required";
    
    const pricedBikes = resolvedBikes.filter(b => b.cc && b.effectivePrice > 0);
    if (pricedBikes.length === 0) errors.bikes = "At least one bike CC & Price is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        base_additional_service_id: selectedBaseService._id,
        dealer_id: selectedDealer._id,
        description: formData.description,
        bikes: resolvedBikes
          .filter(b => b.cc && b.effectivePrice > 0)
          .map(b => ({
            cc: Number(b.cc),
            price: Number(b.effectivePrice)
          })),
      };

      await updateAdditionalService(id, payload);
      setAlertInfo({ show: true, message: "Additional Service updated successfully!", severity: "success" });
      setTimeout(() => navigate("/additionalservices"), 1500);
    } catch (error) {
      console.error("Error updating service:", error);
      setAlertInfo({ 
        show: true, 
        message: error.response?.data?.message || "Failed to update additional service", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Box>
                <Typography variant="h4" fontWeight="700" color="text.primary">
                  Edit Additional Service
                </Typography>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
                  <Typography color="text.secondary" variant="body2">Dashboard</Typography>
                  <Link to="/additionalservices" style={{ textDecoration: "none", color: "inherit" }}>
                    <Typography color="text.secondary" variant="body2" sx={{ "&:hover": { color: "primary.main" } }}>
                      Additional Services
                    </Typography>
                  </Link>
                  <Typography color="text.primary" variant="body2" fontWeight="500">Edit</Typography>
                </Breadcrumbs>
              </Box>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ fontWeight: "bold", borderColor: "divider", "&:hover": { bgcolor: "grey.100" } }}
              >
                Back
              </Button>
            </Stack>
          </Box>

          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                  
                  {/* LEFT COLUMN */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                      options={baseServices}
                      getOptionLabel={(option) => option.name || ""}
                      value={selectedBaseService}
                      isOptionEqualToValue={(option, value) => option._id === value?._id}
                      onChange={(_, newValue) => {
                        setSelectedBaseService(newValue);
                        setFormErrors(prev => ({ ...prev, base_service_id: null }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Base Additional Service *"
                          error={!!formErrors.base_service_id}
                          helperText={formErrors.base_service_id}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                          <Box component="li" key={key} {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={getImageUrl(option.image)}
                              variant="rounded"
                              sx={{ width: 40, height: 40 }}
                            />
                            {option.name}
                          </Box>
                        );
                      }}
                    />

                    <TextField
                      label="Description *"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        setFormErrors(prev => ({ ...prev, description: null }));
                      }}
                      error={!!formErrors.description}
                      helperText={formErrors.description}
                    />

                    {selectedBaseService && (
                      <Box sx={{ mt: 1, p: 2, bgcolor: "#f8f9fa", borderRadius: 2, border: "1px dashed #ccc", textAlign: "center" }}>
                         <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Service Preview</Typography>
                         <Avatar
                            src={getImageUrl(selectedBaseService.image)}
                            sx={{ width: 120, height: 120, mx: "auto", borderRadius: 2 }}
                         />
                         <Typography variant="subtitle1" fontWeight="600" sx={{ mt: 1 }}>{selectedBaseService.name}</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* RIGHT COLUMN */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                      options={dealers}
                      getOptionLabel={(option) => option.shopName || option.name || ""}
                      value={selectedDealer}
                      isOptionEqualToValue={(option, value) => option._id === value?._id}
                      onChange={(_, newValue) => {
                        setSelectedDealer(newValue);
                        setFormErrors(prev => ({ ...prev, dealer: null }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Assign to Dealer *"
                          placeholder="Select dealer"
                          error={!!formErrors.dealer}
                          helperText={formErrors.dealer}
                        />
                      )}
                    />
                  </Box>
                </Box>

                {/* PRICING SECTION */}
                <Box sx={{ mt: 6 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Bike pricing & Rules</Typography>
                  
                  <Card variant="outlined" sx={{ mb: 3, bgcolor: "grey.50" }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" fontWeight="600" gutterBottom>
                        Pricing Rules Engine
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Define rules to automatically apply prices to your CC entries below.
                      </Typography>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: pricingRules.length > 0 ? 3 : 0 }}>
                        <TextField
                          size="small"
                          label="Min CC"
                          type="number"
                          value={newRule.minCc}
                          onChange={(e) => setNewRule({ ...newRule, minCc: e.target.value })}
                        />
                        <TextField
                          size="small"
                          label="Max CC"
                          type="number"
                          value={newRule.maxCc}
                          onChange={(e) => setNewRule({ ...newRule, maxCc: e.target.value })}
                        />
                        <TextField
                          size="small"
                          label="Price"
                          type="number"
                          value={newRule.price}
                          onChange={(e) => setNewRule({ ...newRule, price: e.target.value })}
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={addPricingRule}
                          disabled={!newRule.minCc || !newRule.maxCc || !newRule.price}
                        >
                          Add Rule
                        </Button>
                      </Stack>

                      {pricingRules.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {pricingRules.map((rule) => (
                            <Box key={rule.id} sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="body2" sx={{ flexGrow: 1, ml: 1 }}>
                                between <b>{rule.minCc}</b> and <b>{rule.maxCc} CC</b> = <b>₹{rule.price}</b>
                              </Typography>
                              <IconButton size="small" color="error" onClick={() => deleteRule(rule.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  <Box sx={{ height: 400, width: '100%', mb: 2 }}>
                    <DataGrid
                      rows={resolvedBikes}
                      columns={columns}
                      processRowUpdate={processRowUpdate}
                      hideFooterPagination={bikes.length <= 10}
                      disableRowSelectionOnClick
                      sx={{
                        '& .MuiDataGrid-cell--editable': { bgcolor: 'action.hover', cursor: 'pointer' }
                      }}
                    />
                  </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                      variant="outlined"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={addManualCcRow}
                    >
                      Add New CC Row
                    </Button>
                    {formErrors.bikes && <Typography color="error" variant="caption">{formErrors.bikes}</Typography>}
                  </Stack>
                </Box>

                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button variant="outlined" color="inherit" onClick={() => navigate(-1)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  >
                    {loading ? "Updating..." : "Update Service"}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      </div>

      <Snackbar
        open={alertInfo.show}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={() => setAlertInfo({ ...alertInfo, show: false })}
      >
        <Alert severity={alertInfo.severity} variant="filled" sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditAdditionService;

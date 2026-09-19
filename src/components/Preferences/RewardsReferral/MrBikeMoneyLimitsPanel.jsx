import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment,
  Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getMrBikeMoneyServiceLimits,
  updateMrBikeMoneyServiceLimit,
} from "../../../api/preferences/referralSettingsApi";

const MrBikeMoneyLimitsPanel = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [amount, setAmount] = useState("");

  const configuredServices = useMemo(
    () => services.filter((service) => Number(service.mrBikeMoneyMaxRedeem) > 0),
    [services],
  );

  const availableServices = useMemo(
    () => services.filter(
      (service) => Number(service.mrBikeMoneyMaxRedeem) <= 0 && service.isActive !== false,
    ),
    [services],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMrBikeMoneyServiceLimits();
      setServices(res?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load service limits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const replaceService = (updatedService) => {
    setServices((current) => current.map(
      (service) => service._id === updatedService._id ? updatedService : service,
    ));
  };

  const openAddDialog = () => {
    setEditingService(null);
    setSelectedService(null);
    setAmount("");
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setSelectedService(service);
    setAmount(String(service.mrBikeMoneyMaxRedeem || ""));
    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const saveLimit = async () => {
    const value = Number(amount);
    if (!selectedService) {
      setError("Please search and select a service.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Maximum redeemable amount must be greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await updateMrBikeMoneyServiceLimit(selectedService._id, value);
      replaceService(res.data);
      setDialogOpen(false);
      setMessage(editingService ? "Service limit updated." : "Service added successfully.");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save this service limit.");
    } finally {
      setSaving(false);
    }
  };

  const removeService = async (service) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Remove service?",
      text: `MR Bike Money will no longer be usable on ${service.name}.`,
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await updateMrBikeMoneyServiceLimit(service._id, 0);
      replaceService(res.data);
      setMessage("Service removed from MR Bike Money.");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not remove this service.");
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>Service redemption limits</Typography>
          <Typography variant="body2" color="text.secondary">
            Add services and define the maximum MR Bike Money customers can use on each one.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          disabled={!availableServices.length}
          sx={{ borderRadius: 2.5, px: 2.5, py: 1, fontWeight: 700, boxShadow: "none" }}
        >
          Add Service
        </Button>
      </Box>

      {error && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#475569" }}>Maximum Redeemable</TableCell>
              <TableCell align="right" sx={{ width: 120, fontWeight: 800, color: "#475569" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configuredServices.map((service) => (
              <TableRow key={service._id} hover>
                <TableCell><Typography variant="body2" fontWeight={700}>{service.name}</Typography></TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={service.isActive === false ? "Inactive" : "Active"}
                    color={service.isActive === false ? "default" : "success"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={800} color="success.main">
                    ₹{Number(service.mrBikeMoneyMaxRedeem).toLocaleString("en-IN")}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit limit">
                    <IconButton size="small" color="primary" onClick={() => openEditDialog(service)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove service">
                    <IconButton size="small" color="error" onClick={() => removeService(service)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!configuredServices.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ py: 7, textAlign: "center" }}>
                    <Typography fontWeight={750} color="text.primary">No service added yet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                      Add a service to configure its MR Bike Money redemption limit.
                    </Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={openAddDialog}>
                      Add Service
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingService ? "Edit service limit" : "Add service"}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Autocomplete
              options={editingService ? [editingService] : availableServices}
              value={selectedService}
              onChange={(_, value) => setSelectedService(value)}
              getOptionLabel={(option) => option?.name || ""}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              disabled={!!editingService}
              noOptionsText="No service found"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search and select service"
                  placeholder="Type service name"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              fullWidth
              type="number"
              label="Maximum redeemable amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputProps={{ min: 0.01, step: "0.01" }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              helperText="Maximum MR Bike Money a customer can use on this service."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveLimit} disabled={saving} sx={{ minWidth: 110, boxShadow: "none" }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editingService ? "Update" : "Add Service"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage("")} message={message} />
    </Box>
  );
};

export default MrBikeMoneyLimitsPanel;

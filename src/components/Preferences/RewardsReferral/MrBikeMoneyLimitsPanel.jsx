import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  getMrBikeMoneyServiceLimits,
  updateMrBikeMoneyServiceLimit,
} from "../../../api/preferences/referralSettingsApi";

const MrBikeMoneyLimitsPanel = () => {
  const [services, setServices] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMrBikeMoneyServiceLimits()
      .then((res) => {
        const rows = res?.data || [];
        setServices(rows);
        setValues(Object.fromEntries(rows.map((row) => [row._id, row.mrBikeMoneyMaxRedeem ?? 0])));
      })
      .catch((e) => setError(e?.response?.data?.message || "Could not load service limits."))
      .finally(() => setLoading(false));
  }, []);

  const save = async (serviceId) => {
    const value = Number(values[serviceId]);
    if (!Number.isFinite(value) || value < 0) {
      setError("Limit must be zero or a positive amount.");
      return;
    }
    setSavingId(serviceId);
    setError("");
    try {
      const res = await updateMrBikeMoneyServiceLimit(serviceId, value);
      setServices((current) => current.map((row) => row._id === serviceId ? res.data : row));
      setMessage("Service redemption limit saved.");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save this limit.");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={800}>Service redemption limits</Typography>
        <Typography variant="body2" color="text.secondary">
          Set the maximum MR Bike Money a customer may use on each service. Set 0 to disable it.
        </Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
        {services.map((service) => (
          <Card key={service._id} variant="outlined" sx={{ p: 2.25, borderRadius: 3, opacity: service.isActive === false ? 0.65 : 1 }}>
            <Typography fontWeight={750}>{service.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {service.isActive === false ? "Inactive service" : "Active service"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, mt: 2, alignItems: "flex-start" }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Maximum redeemable"
                value={values[service._id] ?? 0}
                onChange={(e) => setValues((current) => ({ ...current, [service._id]: e.target.value }))}
                inputProps={{ min: 0, step: "0.01" }}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
              <Button
                variant="contained"
                onClick={() => save(service._id)}
                disabled={savingId === service._id}
                sx={{ minWidth: 88, height: 40, boxShadow: "none" }}
              >
                {savingId === service._id ? <CircularProgress size={20} color="inherit" /> : "Save"}
              </Button>
            </Box>
          </Card>
        ))}
      </Box>
      {!services.length && <Alert severity="info">No services are available yet.</Alert>}
      <Snackbar open={!!message} autoHideDuration={3000} onClose={() => setMessage("")} message={message} />
    </Box>
  );
};

export default MrBikeMoneyLimitsPanel;

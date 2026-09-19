import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import { getAppSettings, updateAppSettings } from "../../api/preferences/appContentApi";

const emptyForm = {
  platformFeeEnabled: false,
  platformFeeAmount: "",
  platformFeeLabel: "Platform Fee",
  commissionTaxRate: "18",
};

const PlatformCharges = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAppSettings();
        const data = res?.data || res?.settings || res || {};
        setForm({
          platformFeeEnabled: Boolean(data.platformFeeEnabled),
          platformFeeAmount:
            data.platformFeeAmount === undefined || data.platformFeeAmount === null
              ? ""
              : String(data.platformFeeAmount),
          platformFeeLabel: data.platformFeeLabel || "Platform Fee",
          commissionTaxRate:
            data.commissionTaxRate === undefined || data.commissionTaxRate === null
              ? "18"
              : String(data.commissionTaxRate),
        });
      } catch (error) {
        setLoadError(error?.response?.data?.message || "Could not load platform charge settings.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleToggle = (event) => {
    setForm((previous) => ({ ...previous, platformFeeEnabled: event.target.checked }));
  };

  const handleSave = async () => {
    const feeAmount = form.platformFeeAmount === "" ? 0 : Number(form.platformFeeAmount);
    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid platform fee",
        text: "Platform fee must be a non-negative amount.",
      });
      return;
    }
    if (form.platformFeeEnabled && feeAmount <= 0) {
      Swal.fire({
        icon: "error",
        title: "Platform fee is empty",
        text: "Enter an amount greater than ₹0, or switch the platform fee off.",
      });
      return;
    }

    const commissionTax = form.commissionTaxRate === "" ? 0 : Number(form.commissionTaxRate);
    if (!Number.isFinite(commissionTax) || commissionTax < 0 || commissionTax > 100) {
      Swal.fire({
        icon: "error",
        title: "Invalid GST rate",
        text: "GST on commission must be a percentage between 0 and 100.",
      });
      return;
    }

    setSaving(true);
    try {
      await updateAppSettings({
        ...form,
        platformFeeAmount: feeAmount,
        commissionTaxRate: commissionTax,
      });
      setSnackbar({ open: true, message: "Platform charge settings saved successfully" });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: error?.response?.data?.message || "Something went wrong while saving the settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <PrefHeader
        title="Platform Charges"
        subtitle="Configure customer platform fees and GST charged on dealer commission"
      />

      {loadError && <Alert severity="error" sx={{ mb: 2.5 }}>{loadError}</Alert>}

      <Card sx={{ borderRadius: "14px", border: "1px solid #f1f5f9" }} elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  Platform / Convenience Fee
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  This flat fee is added to every new booking and shown separately to the customer.
                  Dealer earnings and commission are not affected. Existing bookings keep their
                  original fee.
                </Typography>
              </Box>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={form.platformFeeEnabled} onChange={handleToggle} />}
                    label={
                      <Typography sx={{ fontWeight: 600 }}>
                        {form.platformFeeEnabled ? "Fee is charged on new bookings" : "Fee is off"}
                      </Typography>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fee Amount"
                    value={form.platformFeeAmount}
                    onChange={handleChange("platformFeeAmount")}
                    type="number"
                    size="small"
                    placeholder="20"
                    disabled={!form.platformFeeEnabled}
                    inputProps={{ min: 0, step: 1 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    InputLabelProps={{ shrink: true }}
                    helperText="Flat amount per booking"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Label Shown to Customer"
                    value={form.platformFeeLabel}
                    onChange={handleChange("platformFeeLabel")}
                    size="small"
                    placeholder="Platform Fee"
                    disabled={!form.platformFeeEnabled}
                    InputLabelProps={{ shrink: true }}
                    helperText="e.g. Platform Fee, Convenience Fee"
                  />
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  GST on Commission
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                  Tax charged on the commission MR Bike earns from a garage. It is recovered from
                  the dealer along with the commission and does not change what the customer pays.
                  Existing bookings keep the rate they were created with.
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GST Rate on Commission"
                      value={form.commissionTaxRate}
                      onChange={handleChange("commissionTaxRate")}
                      type="number"
                      size="small"
                      placeholder="18"
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      InputLabelProps={{ shrink: true }}
                      helperText="Set 0 to charge no GST on commission"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "10px",
                        bgcolor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#475569",
                      }}
                    >
                      <strong>Example:</strong> on a ₹1,000 booking with 10% commission, MR Bike
                      earns ₹100. At {form.commissionTaxRate || 0}% GST that is ₹
                      {((100 * (Number(form.commissionTaxRate) || 0)) / 100).toFixed(2)} tax, so ₹
                      {(100 + (100 * (Number(form.commissionTaxRate) || 0)) / 100).toFixed(2)} is
                      deducted from the dealer's wallet.
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ fontWeight: 700, minWidth: 160, borderRadius: "10px", boxShadow: "none" }}
                >
                  {saving ? <CircularProgress size={22} color="inherit" /> : "Save Changes"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlatformCharges;

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
import { getAppSettings, updateAppSettings } from "../../../api/preferences/appContentApi";

const emptyForm = {
  supportEmail: "",
  supportPhone: "",
  whatsappNumber: "",
  supportHours: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  websiteUrl: "",
  playStoreUrl: "",
  appStoreUrl: "",
  platformFeeEnabled: false,
  platformFeeAmount: "",
  platformFeeLabel: "Platform Fee",
  commissionTaxRate: "18",
};

// Single settings form (not a table) for customer-support details, the
// platform/convenience fee, and the social/store links shown inside the
// customer app. Loaded via getAppSettings() and saved as one blob via
// updateAppSettings(). A load failure does not block the form — it just
// starts from empty defaults so the admin can fill it in and save for the
// first time.
//
// Two fields here reach further than the customer app's Help screen:
// `supportPhone` is the number printed on every invoice in place of the
// dealer's, and the platform-fee fields are read by the backend's pricing
// engine when a booking is created.
const AppSettingsPanel = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getAppSettings();
      const data = res?.data || res?.settings || res || {};
      setForm({
        supportEmail: data.supportEmail || "",
        supportPhone: data.supportPhone || "",
        whatsappNumber: data.whatsappNumber || "",
        supportHours: data.supportHours || "",
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        twitterUrl: data.twitterUrl || "",
        youtubeUrl: data.youtubeUrl || "",
        linkedinUrl: data.linkedinUrl || "",
        websiteUrl: data.websiteUrl || "",
        playStoreUrl: data.playStoreUrl || "",
        appStoreUrl: data.appStoreUrl || "",
        platformFeeEnabled: Boolean(data.platformFeeEnabled),
        // Kept as a string so the field can be cleared while typing; it is
        // converted back to a number in handleSave().
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
    } catch (e) {
      setLoadError(
        e?.response?.data?.message ||
          "Could not load existing settings. This module needs its backend endpoint connected — you can still fill in and save the form below."
      );
      setForm(emptyForm);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleToggle = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.checked }));
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
      // Both go to the backend as numbers, never as the raw strings the text
      // fields hold while the admin is typing.
      await updateAppSettings({
        ...form,
        platformFeeAmount: feeAmount,
        commissionTaxRate: commissionTax,
      });
      setSnackbar({ open: true, message: "Settings saved successfully" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Save failed", text: e?.response?.data?.message || "Something went wrong. Backend endpoint may not be connected yet." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {loadError && (
        <Box sx={{ mb: 2.5, p: 2, borderRadius: "12px", bgcolor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600 }}>
          {loadError}
        </Box>
      )}

      <Card sx={{ borderRadius: "14px", border: "1px solid #f1f5f9" }} elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Customer Support Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Support Email"
                    value={form.supportEmail}
                    onChange={handleChange("supportEmail")}
                    type="email"
                    size="small"
                    placeholder="support@mrbikedoctor.com"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Support Phone"
                    value={form.supportPhone}
                    onChange={handleChange("supportPhone")}
                    size="small"
                    placeholder="+91 98765 43210"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="WhatsApp Number"
                    value={form.whatsappNumber}
                    onChange={handleChange("whatsappNumber")}
                    size="small"
                    placeholder="+91 98765 43210"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Support Hours"
                    value={form.supportHours}
                    onChange={handleChange("supportHours")}
                    size="small"
                    placeholder="Mon–Sat, 9 AM – 7 PM"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Platform / convenience fee — MR Bike's own flat charge on top of
                the garage's amount. Shown as its own line in the customer app's
                payment breakdown and on the invoice; it never enters the
                dealer's commission or payout. Changing it only affects NEW
                bookings — every existing booking keeps the fee it was created
                with (see services/pricingEngine.js on the backend). */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                Platform / Convenience Fee
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                A flat fee added to every new booking, shown to the customer as its own line after
                taxes. Dealer earnings and commission are not affected. Existing bookings keep the
                fee they were created with.
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.platformFeeEnabled}
                        onChange={handleToggle("platformFeeEnabled")}
                      />
                    }
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
            </Box>

            <Divider />

            {/* GST on MR Bike's commission. Charged BY the platform TO the
                dealer — it comes out of the dealer's payout and never touches
                what the customer pays. Entirely separate from the dealer's own
                tax %, which is the customer's tax on the garage's service. */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                GST on Commission
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                Tax charged on the commission MR Bike earns from a garage. It is recovered from the
                dealer along with the commission and does not change what the customer pays.
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
                    <strong>Example:</strong> on a ₹1,000 booking with 10% commission, MR Bike earns
                    ₹100. At {form.commissionTaxRate || 0}% GST that is ₹
                    {((100 * (Number(form.commissionTaxRate) || 0)) / 100).toFixed(2)} tax, so ₹
                    {(100 + (100 * (Number(form.commissionTaxRate) || 0)) / 100).toFixed(2)} is
                    deducted from the dealer's wallet.
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Social Media & Links
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Facebook URL"
                    value={form.facebookUrl}
                    onChange={handleChange("facebookUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Instagram URL"
                    value={form.instagramUrl}
                    onChange={handleChange("instagramUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Twitter / X URL"
                    value={form.twitterUrl}
                    onChange={handleChange("twitterUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="YouTube URL"
                    value={form.youtubeUrl}
                    onChange={handleChange("youtubeUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="LinkedIn URL"
                    value={form.linkedinUrl}
                    onChange={handleChange("linkedinUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website URL"
                    value={form.websiteUrl}
                    onChange={handleChange("websiteUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Play Store Link"
                    value={form.playStoreUrl}
                    onChange={handleChange("playStoreUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="App Store Link"
                    value={form.appStoreUrl}
                    onChange={handleChange("appStoreUrl")}
                    type="url"
                    size="small"
                    helperText="Optional"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{ fontWeight: 700, minWidth: 160, borderRadius: "10px", boxShadow: "none", "&:hover": { boxShadow: "none" } }}
              >
                {saving ? <CircularProgress size={22} color="inherit" /> : "Save Changes"}
              </Button>
            </Box>
          </Box>
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

export default AppSettingsPanel;

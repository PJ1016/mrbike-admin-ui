import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
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
};

// Single settings form (not a table) for customer-support details and
// social/store links shown inside the customer app. Loaded via
// getAppSettings() and saved as one blob via updateAppSettings(). A load
// failure does not block the form — it just starts from empty defaults so
// the admin can fill it in and save for the first time (these endpoints
// don't exist on the backend yet).
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAppSettings(form);
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

import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Grid,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import { getAppSettings, updateAppSettings } from "../../api/preferences/appContentApi";

const emptyForm = {
  customerAppUpdateEnabled: false,
  customerAppForceUpdate: false,
  customerAppLatestVersion: "",
  customerAppUpdateMessage: "",
  customerAppPlayStoreUrl: "",
  customerAppStoreUrl: "",
  providerAppUpdateEnabled: false,
  providerAppForceUpdate: false,
  providerAppLatestVersion: "",
  providerAppUpdateMessage: "",
  providerAppPlayStoreUrl: "",
  providerAppStoreUrl: "",
};

const AppUpdateCard = ({ title, prefix, form, onChange, onToggle }) => {
  const enabled = form[`${prefix}UpdateEnabled`];

  return (
    <Box sx={{ p: 2.5, border: "1px solid #e2e8f0", borderRadius: "12px", bgcolor: "#f8fafc" }}>
      <Typography fontWeight={700} sx={{ mb: 1 }}>{title}</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={onToggle(`${prefix}UpdateEnabled`)} />}
            label={enabled ? "Update prompt enabled" : "Update prompt disabled"}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={form[`${prefix}ForceUpdate`]}
                onChange={onToggle(`${prefix}ForceUpdate`)}
                disabled={!enabled}
              />
            }
            label="Force update (cannot dismiss)"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required={enabled}
            label="Latest Version"
            value={form[`${prefix}LatestVersion`]}
            onChange={onChange(`${prefix}LatestVersion`)}
            size="small"
            placeholder="1.1.0"
            helperText="Users below this version see Update available"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Update Message"
            value={form[`${prefix}UpdateMessage`]}
            onChange={onChange(`${prefix}UpdateMessage`)}
            size="small"
            placeholder="A new version with improvements is available."
            helperText="Optional; a default message is used when blank"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Play Store URL"
            value={form[`${prefix}PlayStoreUrl`]}
            onChange={onChange(`${prefix}PlayStoreUrl`)}
            type="url"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="App Store URL"
            value={form[`${prefix}StoreUrl`]}
            onChange={onChange(`${prefix}StoreUrl`)}
            type="url"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

const MobileAppUpdates = () => {
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
          customerAppUpdateEnabled: Boolean(data.customerAppUpdateEnabled),
          customerAppForceUpdate: Boolean(data.customerAppForceUpdate),
          customerAppLatestVersion: data.customerAppLatestVersion || "",
          customerAppUpdateMessage: data.customerAppUpdateMessage || "",
          customerAppPlayStoreUrl: data.customerAppPlayStoreUrl || "",
          customerAppStoreUrl: data.customerAppStoreUrl || "",
          providerAppUpdateEnabled: Boolean(data.providerAppUpdateEnabled),
          providerAppForceUpdate: Boolean(data.providerAppForceUpdate),
          providerAppLatestVersion: data.providerAppLatestVersion || "",
          providerAppUpdateMessage: data.providerAppUpdateMessage || "",
          providerAppPlayStoreUrl: data.providerAppPlayStoreUrl || "",
          providerAppStoreUrl: data.providerAppStoreUrl || "",
        });
      } catch (error) {
        setLoadError(error?.response?.data?.message || "Could not load mobile app update settings.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleToggle = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.checked }));
  };

  const handleSave = async () => {
    const versionPattern = /^\d+(?:\.\d+){0,3}$/;
    for (const [enabled, version, label] of [
      [form.customerAppUpdateEnabled, form.customerAppLatestVersion, "Customer app"],
      [form.providerAppUpdateEnabled, form.providerAppLatestVersion, "Provider app"],
    ]) {
      if (enabled && !versionPattern.test(version.trim())) {
        Swal.fire({
          icon: "error",
          title: `${label} version required`,
          text: "Enter a numeric version such as 1.1.0 before enabling updates.",
        });
        return;
      }
    }

    setSaving(true);
    try {
      await updateAppSettings(form);
      setSnackbar({ open: true, message: "Mobile app update settings saved successfully" });
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
        title="Mobile App Updates"
        subtitle="Manage update prompts and store links for the customer and provider apps"
      />

      {loadError && <Alert severity="error" sx={{ mb: 2.5 }}>{loadError}</Alert>}

      <Card sx={{ borderRadius: "14px", border: "1px solid #f1f5f9" }} elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Set each app's released version. Older builds show an update prompt. Enable force
                update when users must install the new version before continuing.
              </Typography>
              <AppUpdateCard
                title="Customer App"
                prefix="customerApp"
                form={form}
                onChange={handleChange}
                onToggle={handleToggle}
              />
              <AppUpdateCard
                title="Provider App"
                prefix="providerApp"
                form={form}
                onChange={handleChange}
                onToggle={handleToggle}
              />
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

export default MobileAppUpdates;

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
import { getReferralSettings, updateReferralSettings } from "../../../api/preferences/referralSettingsApi";

const emptyForm = {
  enableReferralSystem: false,
  showRewardsReferralsMenu: false,
  allowReferralCodeDuringRegistration: false,
  enableReferrerReward: false,
  enableNewUserReward: false,
  referrerRewardAmount: "",
  newUserRewardAmount: "",
  minimumBookingAmount: "",
  firstBookingOnly: false,
};

// Phase 1 settings form (not a table) for the referral module's global
// toggles and amounts. Loaded via getReferralSettings() and saved as one
// blob via updateReferralSettings(). Referral codes, rewards, transactions,
// wallet and notifications are handled in later phases.
const ReferralSettingsPanel = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getReferralSettings();
      const data = res?.data || res?.settings || res || {};
      setForm({
        enableReferralSystem: !!data.enableReferralSystem,
        showRewardsReferralsMenu: !!data.showRewardsReferralsMenu,
        allowReferralCodeDuringRegistration: !!data.allowReferralCodeDuringRegistration,
        enableReferrerReward: !!data.enableReferrerReward,
        enableNewUserReward: !!data.enableNewUserReward,
        referrerRewardAmount: data.referrerRewardAmount ?? "",
        newUserRewardAmount: data.newUserRewardAmount ?? "",
        minimumBookingAmount: data.minimumBookingAmount ?? "",
        firstBookingOnly: !!data.firstBookingOnly,
      });
    } catch (e) {
      setLoadError(e?.response?.data?.message || "Could not load existing referral settings.");
      setForm(emptyForm);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const handleNumberChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReferralSettings({
        ...form,
        referrerRewardAmount: Number(form.referrerRewardAmount) || 0,
        newUserRewardAmount: Number(form.newUserRewardAmount) || 0,
        minimumBookingAmount: Number(form.minimumBookingAmount) || 0,
      });
      setSnackbar({ open: true, message: "Referral settings saved successfully" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Save failed", text: e?.response?.data?.message || "Something went wrong." });
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
                General
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.enableReferralSystem} onChange={handleToggle("enableReferralSystem")} color="success" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Enable Referral System</Typography>
                        <Typography variant="caption" color="text.secondary">Turns the referral feature on or off across the platform.</Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.showRewardsReferralsMenu} onChange={handleToggle("showRewardsReferralsMenu")} color="success" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Show Rewards & Referrals Menu</Typography>
                        <Typography variant="caption" color="text.secondary">Controls visibility of the Rewards & Referrals menu in the user app.</Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.allowReferralCodeDuringRegistration} onChange={handleToggle("allowReferralCodeDuringRegistration")} color="success" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Allow Referral Code During Registration</Typography>
                        <Typography variant="caption" color="text.secondary">Lets new users enter a referral code while signing up.</Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.firstBookingOnly} onChange={handleToggle("firstBookingOnly")} color="success" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>First Booking Only</Typography>
                        <Typography variant="caption" color="text.secondary">Restricts referral rewards to a referee's first booking.</Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Rewards
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.enableReferrerReward} onChange={handleToggle("enableReferrerReward")} color="success" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Enable Referrer Reward</Typography>
                        <Typography variant="caption" color="text.secondary">Rewards the user who shared the referral.</Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch checked={form.enableNewUserReward} onChange={handleToggle("enableNewUserReward")} color="success" />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Enable New User Reward</Typography>
                        <Typography variant="caption" color="text.secondary">Rewards the newly referred user.</Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Referrer Reward Amount"
                    value={form.referrerRewardAmount}
                    onChange={handleNumberChange("referrerRewardAmount")}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="New User Reward Amount"
                    value={form.newUserRewardAmount}
                    onChange={handleNumberChange("newUserRewardAmount")}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Booking Amount"
                    value={form.minimumBookingAmount}
                    onChange={handleNumberChange("minimumBookingAmount")}
                    size="small"
                    helperText="Minimum booking value required for rewards to apply"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
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

export default ReferralSettingsPanel;

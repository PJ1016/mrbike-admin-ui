import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";

// Mandatory-reason confirmation used before
// updateServiceableAreaStatus(id, { status: "paused", pausedReason }) — the
// backend 400s a paused-status call without a reason, so this is required,
// not optional. The reason is surfaced to customers in the app (e.g. "Paused
// due to heavy rain"), so it should read like a public-facing message.
const PauseAreaDialog = ({ open, areaName, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("A reason is required to pause this area.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      reset();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to pause area. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}>
        <PauseCircleFilledIcon color="warning" />
        Pause Area
      </DialogTitle>
      <DialogContent dividers>
        {areaName && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {areaName}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          label="Reason"
          required
          placeholder="e.g. Paused due to heavy rain in the area."
          multiline
          minRows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          helperText="Shown to customers in the app while this area is paused."
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <PauseCircleFilledIcon />}
        >
          Pause Area
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PauseAreaDialog;

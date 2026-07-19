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
import CancelIcon from "@mui/icons-material/Cancel";

// Mandatory-reason confirmation used before verifyDealerDocument(..., "rejected", reason) —
// the backend 400s a rejected-status call without a reason, so this is required, not optional.
const DocumentRejectDialog = ({ open, docLabel, onClose, onConfirm }) => {
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
      setError("A reason is required to reject this document.");
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
        err?.response?.data?.message || "Failed to reject document. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}>
        <CancelIcon color="error" />
        Reject Document
      </DialogTitle>
      <DialogContent dividers>
        {docLabel && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {docLabel}
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
          placeholder="e.g. Image is blurry, please re-upload a clearer photo."
          multiline
          minRows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
        >
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentRejectDialog;

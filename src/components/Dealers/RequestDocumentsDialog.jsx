import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import RequestDocIcon from "@mui/icons-material/RequestPage";

export const DEFAULT_DOC_OPTIONS = [
  { key: "aadharFront", label: "Aadhar Card (Front)" },
  { key: "aadharBack", label: "Aadhar Card (Back)" },
  { key: "pan", label: "PAN Card" },
  { key: "shop", label: "Shop Certificate" },
  { key: "face", label: "Face Verification" },
  { key: "passbook", label: "Passbook / Cheque" },
];

// Multi-select document checklist + reason textbox, submitted via requestDealerDocuments
// (PUT /dealerAuth/verify-document/:id, status: "requested") which notifies the dealer's device.
const RequestDocumentsDialog = ({
  open,
  onClose,
  onSubmit,
  docOptions = DEFAULT_DOC_OPTIONS,
}) => {
  const [selected, setSelected] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setSelected([]);
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const toggleDoc = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError("Select at least one document to request.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required so the dealer knows what to fix.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(selected, reason.trim());
      reset();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to request documents. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}>
        <RequestDocIcon color="warning" />
        Request Documents
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the documents the dealer needs to re-upload and explain why. The dealer
          will be notified.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <FormGroup sx={{ mb: 2 }}>
          {docOptions.map((doc) => (
            <FormControlLabel
              key={doc.key}
              control={
                <Checkbox
                  checked={selected.includes(doc.key)}
                  onChange={() => toggleDoc(doc.key)}
                  disabled={submitting}
                />
              }
              label={doc.label}
            />
          ))}
        </FormGroup>

        <TextField
          label="Reason"
          placeholder="e.g. PAN card image is blurry, please re-upload a clearer photo."
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
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <RequestDocIcon />}
        >
          Send Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestDocumentsDialog;

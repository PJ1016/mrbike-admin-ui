import React from "react";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

// Reusable confirm dialog for delete / bulk-delete / destructive status
// changes across the Preferences module (avoids duplicating a Dialog in
// every module for the same "are you sure?" prompt).
const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  confirmColor = "error",
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2, pt: 0 }}>
      <Button onClick={onCancel} disabled={loading} sx={{ fontWeight: 700 }}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        disabled={loading}
        variant="contained"
        color={confirmColor}
        sx={{ fontWeight: 700, minWidth: 100 }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;

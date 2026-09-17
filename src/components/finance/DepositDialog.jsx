import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createDealerWalletDeposit } from "../../services/financeService";
import { createIdempotencyKey } from "../../utils/depositHelpers";

const emptyForm = (walletId) => ({
  amount: "",
  reason: "",
  reference: "",
  idempotencyKey: createIdempotencyKey(walletId),
});

const DepositDialog = ({ open, walletId, dealerName, onClose, onDeposited }) => {
  const [form, setForm] = useState(() => emptyForm(walletId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(emptyForm(walletId));
      setError("");
    }
  }, [open, walletId]);

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const valid = Boolean(Number(form.amount) > 0 && form.reason.trim() && form.reference.trim() && form.idempotencyKey.trim());

  const submit = async () => {
    if (!valid || !walletId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await createDealerWalletDeposit({
        walletId,
        amount: Number(form.amount),
        reason: form.reason.trim(),
        reference: form.reference.trim(),
        idempotencyKey: form.idempotencyKey.trim(),
      });
      onDeposited?.(result);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || e?.userMessage || e?.message || "Unable to deposit money");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Deposit to Dealer Wallet</DialogTitle>
      <DialogContent>
        <Stack spacing={2.25} sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Dealer: <strong>{dealerName || "Selected dealer"}</strong>
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Amount (₹)" type="number" required value={form.amount} onChange={setField("amount")} inputProps={{ min: 0.01, step: 0.01 }} />
          <TextField label="Reason" required multiline minRows={2} value={form.reason} onChange={setField("reason")} />
          <TextField label="Reference" required value={form.reference} onChange={setField("reference")} helperText="Your receipt, bank, or internal reference" />
          <TextField label="Idempotency key" required value={form.idempotencyKey} onChange={setField("idempotencyKey")} helperText="Reuse this exact key when retrying the same deposit; it prevents a second credit." />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" color="success" onClick={submit} disabled={!valid || submitting}>
          {submitting ? "Depositing…" : "Deposit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepositDialog;

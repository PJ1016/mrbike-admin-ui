import React, { useEffect, useState } from "react";
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import FormDrawer from "../shared/FormDrawer";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscount: "",
  minOrder: "",
  usageLimit: "",
  perUserLimit: "",
  validFrom: "",
  validTo: "",
  isActive: true,
};

// Create/Edit drawer for a single promo code. `promo` is null for create,
// or the row object (already normalized by PromoCodes.jsx) for edit.
const PromoCodeFormDrawer = ({ open, promo, saving, onClose, onSave }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        promo
          ? {
              code: promo.code || "",
              name: promo.name || "",
              description: promo.description || "",
              discountType: promo.discountType || "percentage",
              discountValue: promo.discountValue ?? "",
              maxDiscount: promo.maxDiscount ?? "",
              minOrder: promo.minOrder ?? "",
              usageLimit: promo.usageLimit ?? "",
              perUserLimit: promo.perUserLimit ?? "",
              validFrom: promo.validFrom ? promo.validFrom.slice(0, 10) : "",
              validTo: promo.validTo ? promo.validTo.slice(0, 10) : "",
              isActive: promo.isActive ?? true,
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, promo]);

  const handleChange = (field) => (e) => {
    const value = field === "code" ? e.target.value.toUpperCase().replace(/\s+/g, "") : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const generateCode = () => {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    setForm((prev) => ({ ...prev, code: `MRBD${random}` }));
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Promo code is required";
    if (!form.name.trim()) e.name = "Promo name is required";
    if (!form.discountValue || Number(form.discountValue) <= 0) e.discountValue = "Enter a valid discount value";
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) e.discountValue = "Percentage cannot exceed 100";
    if (!form.usageLimit || Number(form.usageLimit) <= 0) e.usageLimit = "Enter a valid usage limit";
    if (!form.perUserLimit || Number(form.perUserLimit) <= 0) e.perUserLimit = "Enter a valid per-user limit";
    if (!form.validFrom) e.validFrom = "Required";
    if (!form.validTo) e.validTo = "Required";
    if (form.validFrom && form.validTo && form.validTo < form.validFrom) e.validTo = "Must be after Valid From";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...form,
      discountValue: Number(form.discountValue),
      maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      minOrder: form.minOrder === "" ? null : Number(form.minOrder),
      usageLimit: Number(form.usageLimit),
      perUserLimit: Number(form.perUserLimit),
    });
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={promo ? "Edit Promo Code" : "Create Promo Code"}
      subtitle="PROMO CODES"
      saving={saving}
      onSave={handleSave}
      saveLabel={promo ? "Update" : "Create"}
      accentColor="#7c3aed"
    >
      <Stack spacing={2.5}>
        <Box>
          <TextField
            fullWidth
            label="Promo Code"
            value={form.code}
            onChange={handleChange("code")}
            error={!!errors.code}
            helperText={errors.code || "Shown to customers at checkout"}
            placeholder="e.g. WELCOME50"
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: { fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 } }}
          />
          <Typography
            variant="caption"
            onClick={generateCode}
            sx={{ color: "#7c3aed", fontWeight: 700, cursor: "pointer", mt: 0.5, display: "inline-block" }}
          >
            Generate random code
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Name"
          value={form.name}
          onChange={handleChange("name")}
          error={!!errors.name}
          helperText={errors.name || "Internal label for this campaign"}
          placeholder="e.g. Welcome Offer"
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Description"
          value={form.description}
          onChange={handleChange("description")}
          placeholder="Optional notes about this promo"
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel shrink>Discount Type</InputLabel>
            <Select value={form.discountType} onChange={handleChange("discountType")} label="Discount Type">
              <MenuItem value="percentage">Percentage (%)</MenuItem>
              <MenuItem value="flat">Flat Amount (₹)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Discount Value"
            value={form.discountValue}
            onChange={handleChange("discountValue")}
            error={!!errors.discountValue}
            helperText={errors.discountValue}
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: <InputAdornment position="end">{form.discountType === "percentage" ? "%" : "₹"}</InputAdornment>,
            }}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="number"
            label="Maximum Discount"
            value={form.maxDiscount}
            onChange={handleChange("maxDiscount")}
            placeholder="No cap"
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            helperText="Optional cap on percentage discounts"
          />
          <TextField
            fullWidth
            type="number"
            label="Minimum Order Value"
            value={form.minOrder}
            onChange={handleChange("minOrder")}
            placeholder="No minimum"
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
          />
        </Stack>

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="number"
            label="Total Usage Limit"
            value={form.usageLimit}
            onChange={handleChange("usageLimit")}
            error={!!errors.usageLimit}
            helperText={errors.usageLimit || "Total times this code can be redeemed"}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="number"
            label="Per User Limit"
            value={form.perUserLimit}
            onChange={handleChange("perUserLimit")}
            error={!!errors.perUserLimit}
            helperText={errors.perUserLimit || "Redemptions allowed per customer"}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="date"
            label="Valid From"
            value={form.validFrom}
            onChange={handleChange("validFrom")}
            error={!!errors.validFrom}
            helperText={errors.validFrom}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="date"
            label="Valid To"
            value={form.validTo}
            onChange={handleChange("validTo")}
            error={!!errors.validTo}
            helperText={errors.validTo}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Stack>

        <Divider />

        <FormControlLabel
          control={<Switch checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} color="success" />}
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>Active Status</Typography>
              <Typography variant="caption" color="text.secondary">Inactive codes cannot be redeemed by customers</Typography>
            </Box>
          }
        />
      </Stack>
    </FormDrawer>
  );
};

export default PromoCodeFormDrawer;

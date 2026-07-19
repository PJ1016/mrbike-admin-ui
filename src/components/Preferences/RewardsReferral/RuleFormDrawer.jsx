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

// One generic create/edit drawer reused by all five reward-rule tables
// (Referral Bonus, Reward Point Rules, Redemption Rules, Signup Bonus,
// Cashback Rules). Each tab passes its own `fields` config — an array of
// { key, label, type: 'text'|'number'|'select'|'switch', required, adornment, options,
// placeholder, helperText } — and this component renders + validates them
// generically instead of duplicating a near-identical form five times.
const buildEmptyForm = (fields) => {
  const form = {};
  fields.forEach((f) => {
    form[f.key] = f.type === "switch" ? f.defaultValue ?? true : f.defaultValue ?? "";
  });
  return form;
};

const RuleFormDrawer = ({ open, title, fields = [], record, saving, accentColor = "#059669", onClose, onSave }) => {
  const hasStatusField = fields.some((f) => f.type === "switch");

  const [form, setForm] = useState(() => {
    const base = buildEmptyForm(fields);
    if (!hasStatusField) base.isActive = true;
    return base;
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (record) {
      const next = {};
      fields.forEach((f) => {
        const v = record[f.key];
        next[f.key] = v ?? (f.type === "switch" ? true : "");
      });
      if (!hasStatusField) next.isActive = record.isActive ?? true;
      setForm(next);
    } else {
      const base = buildEmptyForm(fields);
      if (!hasStatusField) base.isActive = true;
      setForm(base);
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record, fields]);

  const handleChange = (field) => (e) => {
    const value = field.type === "switch" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field.key]: value }));
    if (errors[field.key]) setErrors((prev) => ({ ...prev, [field.key]: null }));
  };

  const validate = () => {
    const e = {};
    fields.forEach((f) => {
      if (!f.required) return;
      const v = form[f.key];
      if (f.type === "number") {
        if (v === "" || v === null || v === undefined || Number.isNaN(Number(v))) {
          e[f.key] = `${f.label} is required`;
        }
      } else if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
        e[f.key] = `${f.label} is required`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form });
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle="REWARDS & REFERRAL"
      saving={saving}
      onSave={handleSave}
      saveLabel={record ? "Update" : "Create"}
      accentColor={accentColor}
    >
      <Stack spacing={2.5}>
        {fields.map((f) => {
          if (f.type === "switch") {
            return (
              <FormControlLabel
                key={f.key}
                control={<Switch checked={!!form[f.key]} onChange={handleChange(f)} color="success" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {f.label}
                    </Typography>
                    {f.helperText && (
                      <Typography variant="caption" color="text.secondary">
                        {f.helperText}
                      </Typography>
                    )}
                  </Box>
                }
              />
            );
          }

          if (f.type === "select") {
            return (
              <FormControl fullWidth size="small" key={f.key} error={!!errors[f.key]}>
                <InputLabel shrink>{f.label}</InputLabel>
                <Select value={form[f.key] ?? ""} onChange={handleChange(f)} label={f.label} displayEmpty>
                  <MenuItem value="" disabled>
                    Select {f.label.toLowerCase()}
                  </MenuItem>
                  {(f.options || []).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          return (
            <TextField
              key={f.key}
              fullWidth
              type={f.type === "number" ? "number" : "text"}
              label={f.label}
              value={form[f.key] ?? ""}
              onChange={handleChange(f)}
              error={!!errors[f.key]}
              helperText={errors[f.key] || f.helperText}
              placeholder={f.placeholder}
              size="small"
              InputLabelProps={{ shrink: true }}
              InputProps={
                f.adornment ? { startAdornment: <InputAdornment position="start">{f.adornment}</InputAdornment> } : undefined
              }
            />
          );
        })}

        {!hasStatusField && (
          <>
            <Divider />
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Active Status
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Inactive rules are not applied to new transactions
                  </Typography>
                </Box>
              }
            />
          </>
        )}
      </Stack>
    </FormDrawer>
  );
};

export default RuleFormDrawer;

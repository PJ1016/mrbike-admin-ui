import React from "react";
import { Checkbox, ListItemText, MenuItem, Select } from "@mui/material";

// Generic pill-style Select filter — same visual language as
// TransactionFilters/SupportFilters. Supports single or multi-select via the
// `multiple` prop so every module's filter row can be built from one component.
const FilterSelect = ({ label, value, onChange, options, multiple = false, minWidth = 150 }) => (
  <Select
    displayEmpty
    multiple={multiple}
    size="small"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    renderValue={(selected) => {
      if (multiple) {
        return selected.length ? `${label} (${selected.length})` : label;
      }
      const match = options.find((o) => o.value === selected);
      return selected ? `${label}: ${match?.label || selected}` : label;
    }}
    sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth, "& fieldset": { borderColor: "#e2e8f0" } }}
  >
    {!multiple && <MenuItem value="">All {label.toLowerCase()}</MenuItem>}
    {options.map((opt) => (
      <MenuItem key={opt.value} value={opt.value} dense={multiple}>
        {multiple && <Checkbox checked={value.indexOf(opt.value) > -1} size="small" />}
        {multiple ? <ListItemText primary={opt.label} /> : opt.label}
      </MenuItem>
    ))}
  </Select>
);

export default FilterSelect;

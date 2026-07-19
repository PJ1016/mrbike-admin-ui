import React from "react";
import { Chip, MenuItem, Select, Stack } from "@mui/material";

// Mirrors SupportFilters' dumb-controlled-Select pattern, scoped to the one
// filter Dealer Wallets needs (status options are derived from the loaded
// data, since wallet status values aren't a fixed enum in this codebase yet).
const DealerWalletFilters = ({ status, onStatusChange, statusOptions, hasActiveFilters, onClearAll }) => (
  <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
    <Select
      displayEmpty
      size="small"
      value={status}
      onChange={(e) => onStatusChange(e.target.value)}
      renderValue={(selected) => (selected ? `Status: ${selected}` : "Status")}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 150, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      <MenuItem value="">All statuses</MenuItem>
      {statusOptions.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </Select>

    {hasActiveFilters && (
      <Chip label="Clear all" size="small" onClick={onClearAll} onDelete={onClearAll} sx={{ bgcolor: "#f1f5f9", fontWeight: 600, color: "#475569" }} />
    )}
  </Stack>
);

export default DealerWalletFilters;

import React from "react";
import { Checkbox, Chip, ListItemText, MenuItem, Select, Stack } from "@mui/material";
import { STATUS_OPTIONS } from "../../utils/ticketHelpers";

const DATE_PRESETS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

// Scoped to what the ticket payload actually supports (status + created_at) —
// no category/priority filters since those fields don't exist on a ticket.
const SupportFilters = ({ status, onStatusChange, dateRange, onDateRangeChange, hasActiveFilters, onClearAll }) => (
  <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
    <Select
      multiple
      displayEmpty
      size="small"
      value={status}
      onChange={(e) => onStatusChange(e.target.value)}
      renderValue={(selected) => (selected.length ? `Status (${selected.length})` : "Status")}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 150, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <MenuItem key={opt} value={opt} dense>
          <Checkbox checked={status.indexOf(opt) > -1} size="small" />
          <ListItemText primary={opt} />
        </MenuItem>
      ))}
    </Select>

    <Select
      size="small"
      value={dateRange}
      onChange={(e) => onDateRangeChange(e.target.value)}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 140, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      {DATE_PRESETS.map((p) => (
        <MenuItem key={p.value} value={p.value}>
          {p.label}
        </MenuItem>
      ))}
    </Select>

    {hasActiveFilters && (
      <Chip label="Clear all" size="small" onClick={onClearAll} onDelete={onClearAll} sx={{ bgcolor: "#f1f5f9", fontWeight: 600, color: "#475569" }} />
    )}
  </Stack>
);

export default SupportFilters;

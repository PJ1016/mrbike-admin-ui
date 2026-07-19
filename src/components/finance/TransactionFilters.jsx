import React from "react";
import { Chip, MenuItem, Select, Stack } from "@mui/material";

const DATE_PRESETS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

// Same dumb-controlled-Select pattern as SupportFilters, extended with the
// Dealer / Payment Method dimensions Transactions needs. Options for dealer,
// status and payment method are derived from the loaded transaction list
// (no fixed enum exists for any of these fields in the backend today).
const TransactionFilters = ({
  dealer,
  onDealerChange,
  dealerOptions,
  status,
  onStatusChange,
  statusOptions,
  paymentMethod,
  onPaymentMethodChange,
  paymentMethodOptions,
  dateRange,
  onDateRangeChange,
  hasActiveFilters,
  onClearAll,
}) => (
  <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
    <Select
      displayEmpty
      size="small"
      value={dealer}
      onChange={(e) => onDealerChange(e.target.value)}
      renderValue={(selected) => (selected ? `Dealer: ${selected}` : "Dealer")}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 140, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      <MenuItem value="">All dealers</MenuItem>
      {dealerOptions.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </Select>

    <Select
      displayEmpty
      size="small"
      value={status}
      onChange={(e) => onStatusChange(e.target.value)}
      renderValue={(selected) => (selected ? `Status: ${selected}` : "Status")}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 140, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      <MenuItem value="">All statuses</MenuItem>
      {statusOptions.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </Select>

    <Select
      displayEmpty
      size="small"
      value={paymentMethod}
      onChange={(e) => onPaymentMethodChange(e.target.value)}
      renderValue={(selected) => (selected ? `Method: ${selected}` : "Payment Method")}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 160, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      <MenuItem value="">All methods</MenuItem>
      {paymentMethodOptions.map((opt) => (
        <MenuItem key={opt} value={opt}>
          {opt}
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

export default TransactionFilters;

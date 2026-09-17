import React from "react";
import { Chip, MenuItem, Select, Stack, TextField } from "@mui/material";

const DepositFilters = ({ dealers, dealerId, onDealerChange, status, onStatusChange, from, to, onFromChange, onToChange, hasActiveFilters, onClearAll }) => (
  <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
    <Select
      displayEmpty
      size="small"
      value={dealerId}
      onChange={(event) => onDealerChange(event.target.value)}
      renderValue={(selected) => selected ? `Dealer: ${dealers.find((dealer) => dealer.id === selected)?.name || selected}` : "Dealer"}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 180, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      <MenuItem value="">All dealers</MenuItem>
      {dealers.map((dealer) => <MenuItem key={dealer.id} value={dealer.id}>{dealer.name}</MenuItem>)}
    </Select>
    <Select
      displayEmpty
      size="small"
      value={status}
      onChange={(event) => onStatusChange(event.target.value)}
      renderValue={(selected) => selected ? `Status: ${selected}` : "Status"}
      sx={{ borderRadius: "999px", bgcolor: "#f8fafc", minWidth: 150, "& fieldset": { borderColor: "#e2e8f0" } }}
    >
      <MenuItem value="">All statuses</MenuItem>
      {["APPROVED", "PAID", "COMPLETED", "PENDING", "FAILED", "EXPIRED", "REJECTED"].map((option) => (
        <MenuItem key={option} value={option}>{option}</MenuItem>
      ))}
    </Select>
    <TextField label="From" type="date" size="small" value={from} onChange={(event) => onFromChange(event.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
    <TextField label="To" type="date" size="small" value={to} onChange={(event) => onToChange(event.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
    {hasActiveFilters && <Chip label="Clear all" size="small" onClick={onClearAll} onDelete={onClearAll} sx={{ bgcolor: "#f1f5f9", fontWeight: 600, color: "#475569" }} />}
  </Stack>
);

export default DepositFilters;

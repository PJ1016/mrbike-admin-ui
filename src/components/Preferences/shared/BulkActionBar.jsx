import React from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";

// Contextual bar shown above the table once one or more rows are selected.
// `actions` is [{ label, icon, color, onClick }] — kept generic so each
// module can wire whatever bulk operations make sense for it
// (bulk activate/deactivate, bulk delete, etc.).
const BulkActionBar = ({ selectedCount, onClear, actions = [] }) => {
  if (!selectedCount) return null;
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ mb: 2, p: 1.5, borderRadius: "12px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}
    >
      <Chip
        label={`${selectedCount} selected`}
        size="small"
        onDelete={onClear}
        sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700 }}
      />
      <Typography variant="body2" sx={{ color: "#1d4ed8", flex: 1 }}>
        Bulk actions apply to all selected rows
      </Typography>
      {actions.map((a) => (
        <Button
          key={a.label}
          size="small"
          variant="outlined"
          color={a.color || "primary"}
          startIcon={a.icon}
          onClick={a.onClick}
          sx={{ fontWeight: 700, bgcolor: "#fff" }}
        >
          {a.label}
        </Button>
      ))}
    </Stack>
  );
};

export default BulkActionBar;

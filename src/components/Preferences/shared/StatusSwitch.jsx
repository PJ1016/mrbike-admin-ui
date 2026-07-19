import React from "react";
import { Stack, Switch, Typography } from "@mui/material";

// Reusable Active/Inactive toggle used in every Preferences data table's
// Status column. Stops propagation so it can sit inside a clickable table row
// without also opening the row's view drawer.
const StatusSwitch = ({
  checked,
  onChange,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  disabled = false,
  size = "small",
}) => (
  <Stack
    direction="row"
    spacing={0.75}
    alignItems="center"
    onClick={(e) => e.stopPropagation()}
    sx={{ display: "inline-flex" }}
  >
    <Switch
      checked={!!checked}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
      size={size}
      color="success"
    />
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, color: checked ? "#059669" : "#94a3b8", minWidth: 52 }}
    >
      {checked ? activeLabel : inactiveLabel}
    </Typography>
  </Stack>
);

export default StatusSwitch;

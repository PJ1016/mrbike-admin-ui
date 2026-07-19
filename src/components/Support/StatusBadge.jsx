import React from "react";
import { Chip } from "@mui/material";
import { STATUS_COLOR } from "../../utils/ticketHelpers";

const StatusBadge = ({ status, size = "small" }) => (
  <Chip label={status || "Unknown"} color={STATUS_COLOR[status] || "default"} size={size} sx={{ fontWeight: 700, fontSize: "0.72rem", height: 22 }} />
);

export default StatusBadge;

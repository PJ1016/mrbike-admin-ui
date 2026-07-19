import React from "react";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";

// Standard header for every Preferences module page — title + live count on
// the left, Refresh + primary "Add" action on the right. Mirrors the inline
// header pattern established by Transactions.jsx (no breadcrumbs — these are
// flat, tab-like feature pages reached from the sidebar, not nested drilldowns).
const PrefHeader = ({
  title,
  subtitle,
  count,
  countLabel = "record",
  onRefresh,
  onAdd,
  addLabel = "Add New",
  addDisabled = false,
  extraActions,
}) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", sm: "center" }}
    sx={{ mb: 3 }}
    spacing={1.5}
  >
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
        {subtitle || (typeof count === "number" ? `${count} ${countLabel}${count === 1 ? "" : "s"}` : "")}
      </Typography>
    </Box>
    <Stack direction="row" spacing={1.25} alignItems="center">
      {extraActions}
      {onRefresh && (
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} sx={{ bgcolor: "white", border: "1px solid #f1f5f9", "&:hover": { bgcolor: "#f8fafc" } }}>
            <Refresh sx={{ fontSize: 18, color: "#64748b" }} />
          </IconButton>
        </Tooltip>
      )}
      {onAdd && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
          disabled={addDisabled}
          sx={{ borderRadius: "10px", fontWeight: 700, boxShadow: "none", "&:hover": { boxShadow: "none" } }}
        >
          {addLabel}
        </Button>
      )}
    </Stack>
  </Stack>
);

export default PrefHeader;

import React from "react";
import { Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import Drawer from "@mui/material/Drawer";

// Generic right-side drawer shell for every Create/Edit form in the
// Preferences module. Matches the accent-bar + sticky-footer pattern from
// TicketDrawer / TransactionDrawer so Add/Edit forms feel identical to the
// existing read-only detail drawers.
//
// `fullScreen` and `footer` are additive, opt-in props (both default to the
// original behavior) so every other module's drawer usage is unaffected —
// they exist for surfaces like the Legal editor that need the full viewport
// and more than a single Cancel/Save action pair.
const FormDrawer = ({
  open,
  onClose,
  title,
  subtitle,
  width = 520,
  fullScreen = false,
  accentColor = "#2563eb",
  loading = false,
  saving = false,
  onSave,
  saveLabel = "Save",
  saveDisabled = false,
  hideFooter = false,
  footer,
  children,
}) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: fullScreen
        ? { width: "100vw", maxWidth: "100vw", height: "100vh", display: "flex", flexDirection: "column" }
        : { width: { xs: "100%", sm: width }, display: "flex", flexDirection: "column" },
    }}
  >
    <Box sx={{ height: 4, bgcolor: accentColor, flexShrink: 0 }} />

    <Box sx={{ p: 2.5, borderBottom: "1px solid #f1f5f9", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <Box sx={{ minWidth: 0 }}>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {subtitle}
          </Typography>
        )}
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }} noWrap>
          {title}
        </Typography>
      </Box>
      <IconButton onClick={onClose} aria-label="Close drawer">
        <Close />
      </IconButton>
    </Box>

    <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, display: "flex", flexDirection: "column" }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : fullScreen ? (
        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", flex: 1, display: "flex", flexDirection: "column" }}>{children}</Box>
      ) : (
        children
      )}
    </Box>

    {!hideFooter && !loading && (
      <Box sx={{ p: 2, borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
        {footer || (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
            <Button variant="outlined" onClick={onClose} disabled={saving} sx={{ fontWeight: 700, minWidth: 96 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={onSave} disabled={saving || saveDisabled} sx={{ fontWeight: 700, minWidth: 120 }}>
              {saving ? <CircularProgress size={22} color="inherit" /> : saveLabel}
            </Button>
          </Box>
        )}
      </Box>
    )}
  </Drawer>
);

export default FormDrawer;

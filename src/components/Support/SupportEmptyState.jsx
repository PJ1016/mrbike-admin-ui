import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { CheckCircleOutline, ForumOutlined } from "@mui/icons-material";

const SupportEmptyState = ({ filtered, accentColor = "#2563eb", onClearFilters }) => (
  <Box sx={{ textAlign: "center", py: 7, px: 3 }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        bgcolor: filtered ? `${accentColor}12` : "#ecfdf5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: 2,
      }}
    >
      {filtered ? (
        <ForumOutlined sx={{ color: accentColor, fontSize: 26 }} />
      ) : (
        <CheckCircleOutline sx={{ color: "#10b981", fontSize: 26 }} />
      )}
    </Box>
    <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>
      {filtered ? "No tickets match your filters" : "You're all caught up"}
    </Typography>
    <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.5, mb: filtered ? 2 : 0 }}>
      {filtered ? "Try adjusting your filters or search term." : "No tickets here right now."}
    </Typography>
    {filtered && (
      <Button size="small" onClick={onClearFilters} sx={{ color: accentColor, fontWeight: 700 }}>
        Clear all filters
      </Button>
    )}
  </Box>
);

export default SupportEmptyState;

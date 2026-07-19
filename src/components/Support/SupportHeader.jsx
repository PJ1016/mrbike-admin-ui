import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { FileDownload } from "@mui/icons-material";

const SupportHeader = ({ title, accentColor = "#2563eb", countLabel, onExport }) => (
  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 3 }}>
    <Stack direction="row" alignItems="center" spacing={1.2}>
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: accentColor }} />
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          {title}
        </Typography>
        {countLabel && (
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
            {countLabel}
          </Typography>
        )}
      </Box>
    </Stack>
    {onExport && (
      <Button
        variant="outlined"
        size="small"
        startIcon={<FileDownload fontSize="small" />}
        onClick={onExport}
        sx={{ borderColor: "#e2e8f0", color: "#334155" }}
      >
        Export
      </Button>
    )}
  </Stack>
);

export default SupportHeader;

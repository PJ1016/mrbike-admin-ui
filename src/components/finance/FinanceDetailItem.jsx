import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import Swal from "sweetalert2";
import { naFallback } from "../../utils/financeHelpers";

// Mirrors PaymentDetailsDrawer's local DetailItem — extracted here so it can
// be shared across the new Finance drawers without duplicating the same
// label/value/copy layout in two files. Never renders blank: falls back to "N/A".
const FinanceDetailItem = ({ label, value, copyable = false }) => {
  const display = naFallback(value);
  return (
    <Box mb={2}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Typography variant="body2" fontWeight={500} sx={{ wordBreak: "break-all", flex: 1 }}>
          {display}
        </Typography>
        {copyable && display !== "N/A" && (
          <IconButton
            size="small"
            onClick={() => {
              navigator.clipboard?.writeText(String(value));
              Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Copied!", showConfirmButton: false, timer: 1200 });
            }}
            sx={{ mt: -0.5 }}
          >
            <ContentCopy sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
};

export default FinanceDetailItem;

import React from "react";
import { Box, IconButton, MenuItem, Select, Stack, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const SupportPagination = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderTop: "1px solid #f1f5f9" }}>
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
        Showing {from}–{to} of {total}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Select size="small" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} sx={{ borderRadius: "8px", fontSize: "0.8rem" }}>
          {[10, 20, 50].map((n) => (
            <MenuItem key={n} value={n} sx={{ fontSize: "0.8rem" }}>
              {n} / page
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", minWidth: 48, textAlign: "center" }}>
            {page} / {totalPages}
          </Typography>
          <IconButton size="small" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
      </Stack>
    </Stack>
  );
};

export default SupportPagination;

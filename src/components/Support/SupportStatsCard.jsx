import React from "react";
import { Card, CardContent, Stack, Avatar, Typography, Chip } from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";

// Doubles as the dashboard's "overview card" — one component covers both
// roles from the spec (SupportStatsCard / SupportOverviewCard) since they
// render identically; keeping a single implementation avoids two near-
// duplicate card components.
const SupportStatsCard = ({ title, value, subtitle, icon, color = "#2563eb", bg, tag, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      borderRadius: "16px",
      border: "1px solid #f1f5f9",
      bgcolor: "#ffffff",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      height: "100%",
      "&:hover": onClick
        ? {
            transform: "translateY(-3px)",
            boxShadow: `0 12px 24px -8px ${color}30`,
            borderColor: `${color}40`,
          }
        : {},
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Avatar sx={{ bgcolor: bg || `${color}15`, color, width: 44, height: 44, borderRadius: "12px" }}>
          {icon}
        </Avatar>
        {tag && (
          <Chip
            label={tag.label}
            size="small"
            sx={{
              bgcolor: tag.bg,
              color: tag.color,
              fontWeight: 700,
              fontSize: "0.6rem",
              height: 20,
              border: `1px solid ${tag.color}30`,
            }}
          />
        )}
        {onClick && !tag && <ArrowForwardIos sx={{ fontSize: 13, color: "#cbd5e1", mt: 0.5 }} />}
      </Stack>

      <Typography
        variant="caption"
        sx={{
          mt: 2,
          display: "block",
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "0.6rem",
        }}
      >
        {title}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.3, fontSize: "1.45rem", lineHeight: 1.2 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "#94a3b8", fontSize: "0.7rem", fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default SupportStatsCard;

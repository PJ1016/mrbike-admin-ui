import React from "react";
import { Box, Chip, Typography } from "@mui/material";

// The `icon` string on ServiceCategory is rendered by the user-facing React
// Native app via `react-native-vector-icons/MaterialCommunityIcons` — a
// completely different icon system from this admin app's @mui/icons-material.
// There's no MaterialCommunityIcons web font installed here, so this picker
// is a curated list of valid glyph names rendered as plain text chips rather
// than a visual icon grid. Do NOT swap this for @mui/icons-material — those
// names won't mean anything to the mobile app's icon renderer.
export const CATEGORY_ICON_OPTIONS = [
  "wrench",
  "oil",
  "car-brake-alert",
  "link-variant",
  "battery-charging",
  "tire",
  "truck-fast",
  "car-wash",
  "tools",
  "hammer-wrench",
  "car-battery",
  "shopping",
  "ambulance",
  "shield-check",
  "cog",
  "engine",
  "speedometer",
  "moped",
  "motorbike",
  "car-wrench",
  "oil-level",
  "battery-charging-100",
  "car-tire-alert",
  "wrench-clock",
];

const IconPicker = ({ value, onChange, error }) => (
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", mb: 1 }}>
      Icon *
    </Typography>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {CATEGORY_ICON_OPTIONS.map((name) => {
        const selected = value === name;
        return (
          <Chip
            key={name}
            label={name}
            clickable
            onClick={() => onChange(name)}
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "8px",
              backgroundColor: selected ? "#2563eb" : "#f1f5f9",
              color: selected ? "#fff" : "#475569",
              border: selected ? "1px solid #2563eb" : "1px solid #e2e8f0",
              "&:hover": {
                backgroundColor: selected ? "#1d4ed8" : "#e2e8f0",
              },
            }}
          />
        );
      })}
    </Box>
    {error && (
      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
        {error}
      </Typography>
    )}
    <Typography variant="caption" sx={{ color: "#94a3b8", mt: 1, display: "block" }}>
      This must be a valid MaterialCommunityIcons glyph name — the mobile app renders it directly.
    </Typography>
  </Box>
);

export default IconPicker;

import React from "react";
import { Chip } from "@mui/material";
import { TwoWheeler as BikeIcon } from "@mui/icons-material";

/**
 * Optimized Chip component for rendering a single bike.
 * Wrapped in React.memo to prevent unnecessary re-renders when the list scrolls.
 */
const BikeChipItem = React.memo(({ bike, onDelete, style }) => {
  const bikeId = bike._id || bike.id || bike.variant_id;
  const label =
    `${bike.company_name || bike.company_id?.name || ""} ${bike.model_name || bike.model_id?.model_name || ""} ${bike.variant_name || ""}`.trim() ||
    `Bike ${bike.cc}cc`;

  return (
    <div style={style}>
      <Chip
        icon={<BikeIcon fontSize="small" />}
        label={label}
        onDelete={() => onDelete(String(bikeId))}
        color="primary"
        variant="filled"
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          bgcolor: "primary.main",
          color: "white",
          m: 0.5,
          maxWidth: "95%",
          "& .MuiChip-deleteIcon": {
            color: "rgba(255,255,255,0.7)",
            "&:hover": { color: "white" },
          },
        }}
      />
    </div>
  );
});

export default BikeChipItem;

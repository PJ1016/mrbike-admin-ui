import React, { useState, useCallback } from "react";
import { Box, Typography, Button, Chip, Stack } from "@mui/material";
import { TwoWheeler as BikeIcon, Edit as EditIcon } from "@mui/icons-material";
import SelectedBikesModal from "./SelectedBikesModal";
import { useDispatch } from "react-redux";
import { removeSelectedBike } from "../../../redux/slices/dealerServiceSlice";

/**
 * Summary component for Selected Bikes.
 * Shows first 3-5 chips and an "Edit/View All" button.
 */
const SelectedBikesSummary = React.memo(({ bikes }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = useCallback((bikeId) => {
    dispatch(removeSelectedBike(bikeId));
  }, [dispatch]);

  const visibleBikes = bikes.slice(0, 5);
  const remainingCount = bikes.length - visibleBikes.length;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
          SELECTED BIKES ({bikes.length})
        </Typography>
        {bikes.length > 0 && (
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setIsModalOpen(true)}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Manage All
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          borderRadius: 4,
          bgcolor: "#fcfdfe",
          border: "1px solid",
          borderColor: "#e1e8ef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}
      >
        {bikes.length > 0 ? (
          <>
            {visibleBikes.map((bike, index) => {
              const bikeId = bike._id || bike.id || bike.variant_id;
              const label = `${bike.company_name || bike.company_id?.name || ""} ${bike.model_name || bike.model_id?.model_name || ""} ${bike.variant_name || ""}`.trim() || `Bike ${bike.cc}cc`;
              
              return (
                <Chip
                  key={bikeId || `summary-${index}`}
                  icon={<BikeIcon fontSize="small" />}
                  label={label}
                  onDelete={() => handleDelete(String(bikeId))}
                  color="primary"
                  variant="filled"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    bgcolor: "primary.main",
                    color: "white",
                    "& .MuiChip-deleteIcon": {
                      color: "rgba(255,255,255,0.7)",
                      "&:hover": { color: "white" },
                    },
                  }}
                />
              );
            })}
            
            {remainingCount > 0 && (
              <Chip
                label={`+${remainingCount} more`}
                onClick={() => setIsModalOpen(true)}
                variant="outlined"
                color="primary"
                sx={{ borderRadius: 2, fontWeight: 700, cursor: 'pointer' }}
              />
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No bikes selected yet.
          </Typography>
        )}
      </Box>

      <SelectedBikesModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bikes={bikes}
        onDelete={handleDelete}
      />
    </Box>
  );
});

export default SelectedBikesSummary;

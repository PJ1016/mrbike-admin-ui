import React, { useState } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  Grid,
  Stack,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Paper,
  Skeleton,
} from "@mui/material";
import { Search as SearchIcon, TwoWheeler as BikeIcon } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { fetchBikesByCompany } from "../../redux/slices/bikeSlice";
import { addSelectedBike, removeSelectedBike } from "../../redux/slices/dealerServiceSlice";

const SupportedBikesSection = () => {
  const dispatch = useDispatch();
  const { companies, bikes, loading: bikesLoading } = useSelector((state) => state.bike);
  const { selectedBikes } = useSelector((state) => state.dealerService);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCompanyChange = (event, newValue) => {
    setSelectedCompany(newValue);
    if (newValue) {
      const companyId = newValue._id || newValue.id;
      if (companyId) {
        dispatch(fetchBikesByCompany([companyId]));
      }
    }
  };

  const filteredBikes = bikes.filter((bike) => {
    const modelName = bike.model_name || bike.model_id?.model_name || "";
    const variantName = bike.variant_name || "";
    const companyName = bike.company_name || bike.company_id?.name || selectedCompany?.name || "";
    const fullName = `${companyName} ${modelName} ${variantName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleToggleBike = (bike) => {
    const bikeId = bike._id || bike.id || bike.variant_id;
    if (!bikeId) {
      console.warn("BikeDoctor: Selected bike has no ID", bike);
      return;
    }
    const isSelected = selectedBikes.find((b) => String(b._id || b.id || b.variant_id) === String(bikeId));
    if (isSelected) {
      dispatch(removeSelectedBike(String(bikeId)));
    } else {
      dispatch(addSelectedBike(bike));
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="800" sx={{ color: "primary.main", mb: 3 }}>
        1. Supported Bikes
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ mb: 1 }}>
                COMPANY
              </Typography>
              <Autocomplete
                options={companies}
                getOptionLabel={(option) => option.name || ""}
                value={selectedCompany}
                onChange={handleCompanyChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select a company..."
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        bgcolor: "#fcfdfe",
                      },
                    }}
                  />
                )}
              />
            </Box>

            {selectedCompany && (
              <Box>
                <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ mb: 1 }}>
                  SEARCH VARIANTS
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Filter by model or variant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: "#fcfdfe",
                    },
                  }}
                />
              </Box>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={7}>
          {selectedCompany ? (
            <Box>
              <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ mb: 1 }}>
                VARIANTS ({filteredBikes.length} available)
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 300,
                  overflowY: "auto",
                  borderRadius: 3,
                  bgcolor: "#fcfcfc",
                  p: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {bikesLoading ? (
                  <Stack spacing={1} sx={{ p: 1 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1.5 }} />
                    ))}
                  </Stack>
                ) : filteredBikes.length > 0 ? (
                  <Grid container>
                    {filteredBikes.map((bike, index) => {
                      const bikeId = bike._id || bike.id || bike.variant_id;
                      const isSelected = !!selectedBikes.find((b) => String(b._id || b.id || b.variant_id) === String(bikeId));
                      return (
                        <Grid item xs={12} key={bikeId || `variant-${index}`}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleBike(bike)}
                                color="primary"
                              />
                            }
                            label={
                              <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                                {bike.model_name || bike.model_id?.model_name || "Unknown Model"} - {bike.variant_name || "Standard"} ({bike.cc} CC)
                              </Typography>
                            }
                            sx={{
                              width: "100%",
                              m: 0,
                              px: 1,
                              py: 0.5,
                              borderRadius: 2,
                              "&:hover": { bgcolor: "primary.50" },
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No matching models found.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          ) : (
            <Box
              sx={{
                height: "100%",
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 4,
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Select a company to view models
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Selected Items */}
      {selectedBikes.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" fontWeight="700" color="text.secondary" sx={{ mb: 1.5 }}>
            SELECTED BIKES ({selectedBikes.length})
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              p: 2,
              borderRadius: 4,
              bgcolor: "#fcfdfe",
              border: "1px solid",
              borderColor: "#e1e8ef",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}
          >
            {selectedBikes.map((bike, index) => (
              <Chip
                key={bike._id || bike.id || bike.variant_id || `selected-${index}`}
                icon={<BikeIcon fontSize="small" />}
                label={`${bike.company_name || bike.company_id?.name || selectedCompany?.name || ""} ${bike.model_name || bike.model_id?.model_name || ""} ${bike.variant_name || ""}`.trim() || `Bike ${bike.cc}cc`}
                onDelete={() => dispatch(removeSelectedBike(String(bike._id || bike.id || bike.variant_id)))}
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
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SupportedBikesSection;

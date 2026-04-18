import React, { useState } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Grid,
  Stack,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Paper,
  Skeleton,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { fetchBikesByCompany } from "../../redux/slices/bikeSlice";
import {
  addSelectedBike,
  removeSelectedBike,
  setSelectedCompanies,
  setSelectedBikes,
} from "../../redux/slices/dealerServiceSlice";
import SelectedBikesSummary from "./SelectedBikes/SelectedBikesSummary";

const SupportedBikesSection = () => {
  const dispatch = useDispatch();
  const {
    companies,
    bikes,
    loading: bikesLoading,
  } = useSelector((state) => state.bike);
  const { selectedBikes, selectedCompanies } = useSelector(
    (state) => state.dealerService,
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-fetch bikes when companies are pre-filled/selected
  React.useEffect(() => {
    if (selectedCompanies.length > 0) {
      const companyIds = selectedCompanies
        .map((c) => c._id || c.id)
        .filter(Boolean);
      if (companyIds.length > 0) {
        dispatch(fetchBikesByCompany(companyIds));
      }
    }
  }, [dispatch, selectedCompanies]);

  const handleCompanyChange = (event, newValue) => {
    dispatch(setSelectedCompanies(newValue));
  };

  const filteredBikes = React.useMemo(() => {
    return bikes.filter((bike) => {
      const modelName = bike.model_name || bike.model_id?.model_name || "";
      const variantName = bike.variant_name || "";
      const companyName = bike.company_name || bike.company_id?.name || "";
      const fullName =
        `${companyName} ${modelName} ${variantName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [bikes, searchTerm]);

  const handleToggleBike = (bike) => {
    const bikeId = bike._id || bike.id || bike.variant_id;
    if (!bikeId) {
      console.warn("BikeDoctor: Selected bike has no ID", bike);
      return;
    }
    const isSelected = selectedBikes.find(
      (b) => String(b._id || b.id || b.variant_id) === String(bikeId),
    );
    if (isSelected) {
      dispatch(removeSelectedBike(String(bikeId)));
    } else {
      dispatch(addSelectedBike(bike));
    }
  };

  const isAllSelected =
    filteredBikes.length > 0 &&
    filteredBikes.every((bike) =>
      selectedBikes.some(
        (sb) =>
          String(sb._id || sb.id || sb.variant_id) ===
          String(bike._id || bike.id || bike.variant_id),
      ),
    );

  const isSomeSelected =
    !isAllSelected &&
    filteredBikes.some((bike) =>
      selectedBikes.some(
        (sb) =>
          String(sb._id || sb.id || sb.variant_id) ===
          String(bike._id || bike.id || bike.variant_id),
      ),
    );

  const handleSelectAll = (checked) => {
    if (checked) {
      // Add all filtered bikes that are not already selected
      const newBikes = [...selectedBikes];
      filteredBikes.forEach((bike) => {
        const bikeId = String(bike._id || bike.id || bike.variant_id);
        if (
          !newBikes.some(
            (sb) => String(sb._id || sb.id || sb.variant_id) === bikeId,
          )
        ) {
          newBikes.push(bike);
        }
      });
      dispatch(setSelectedBikes(newBikes));
    } else {
      // Remove all filtered bikes from selectedBikes
      const filteredIds = filteredBikes.map((bike) =>
        String(bike._id || bike.id || bike.variant_id),
      );
      const newBikes = selectedBikes.filter(
        (sb) => !filteredIds.includes(String(sb._id || sb.id || sb.variant_id)),
      );
      dispatch(setSelectedBikes(newBikes));
    }
  };

  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight="800"
        sx={{ color: "primary.main", mb: 3 }}
      >
        1. Supported Bikes
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="700"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                COMPANY
              </Typography>
              <Autocomplete
                multiple
                options={companies}
                getOptionLabel={(option) => option.name || ""}
                value={selectedCompanies}
                onChange={handleCompanyChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={
                      selectedCompanies.length > 0 ? "" : "Select companies..."
                    }
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

            {selectedCompanies.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight="700"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
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
          {selectedCompanies.length > 0 ? (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                  pr: 1,
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="700"
                  color="text.secondary"
                >
                  VARIANTS ({filteredBikes.length} available)
                </Typography>
                {filteredBikes.length > 0 && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={isAllSelected}
                        indeterminate={isSomeSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        sx={{ py: 0 }}
                      />
                    }
                    label={
                      <Typography
                        variant="caption"
                        fontWeight="600"
                        color="text.secondary"
                      >
                        Select All
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                )}
              </Box>
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
                      <Skeleton
                        key={i}
                        variant="rectangular"
                        height={40}
                        sx={{ borderRadius: 1.5 }}
                      />
                    ))}
                  </Stack>
                ) : filteredBikes.length > 0 ? (
                  <Grid container>
                    {filteredBikes.map((bike, index) => {
                      const bikeId = bike._id || bike.id || bike.variant_id;
                      const isSelected = !!selectedBikes.find(
                        (b) =>
                          String(b._id || b.id || b.variant_id) ===
                          String(bikeId),
                      );
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
                              <Typography
                                variant="body2"
                                fontWeight={isSelected ? 600 : 400}
                              >
                                {bike.model_name ||
                                  bike.model_id?.model_name ||
                                  "Unknown Model"}{" "}
                                - {bike.variant_name || "Standard"} ({bike.cc}{" "}
                                CC)
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Select companies to view models
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Optimized Selected Items */}
      <SelectedBikesSummary bikes={selectedBikes} />
    </Box>
  );
};

export default SupportedBikesSection;

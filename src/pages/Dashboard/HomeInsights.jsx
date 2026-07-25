import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/Global/PageHeader";
import { getMostBookedForCity, getTopGaragesForCity } from "../../api";

const API_IMAGE_BASE = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";

const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_IMAGE_BASE}${path}`;
};

const HomeInsights = () => {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostBooked, setMostBooked] = useState(null);
  const [topGarages, setTopGarages] = useState(null);

  const handleSearch = async () => {
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [mostBookedRes, topGaragesRes] = await Promise.all([
        getMostBookedForCity(city.trim(), 7),
        getTopGaragesForCity(city.trim()),
      ]);
      setMostBooked(mostBookedRes);
      setTopGarages(topGaragesRes);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load insights for this city");
      setMostBooked(null);
      setTopGarages(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <PageHeader
            title="Home Insights"
            breadcrumbs={[
              { label: "Dashboard", path: "/" },
              { label: "Home Insights", path: "#" },
            ]}
          />

          <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
            Read-only sanity check — mirrors exactly what the live user-app Home screen algorithm
            would surface for a city. There's no manual pin/feature override here by design.
          </Alert>

          <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <Stack direction="row" spacing={2}>
              <TextField
                placeholder="Enter a city, e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                size="small"
                fullWidth
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading || !city.trim()}
                sx={{ textTransform: "none", fontWeight: 600, backgroundColor: "#2563eb", whiteSpace: "nowrap" }}
              >
                View
              </Button>
            </Stack>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#2563eb" }} />
            </Box>
          )}

          {mostBooked && (
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Typography sx={{ fontWeight: 800, color: "#0f172a", mb: 2 }}>
                Most Booked This Week
              </Typography>
              {mostBooked.data?.length ? (
                <Stack spacing={1.5}>
                  {mostBooked.data.map((item) => (
                    <Stack key={item.serviceId} direction="row" alignItems="center" spacing={2}>
                      <Avatar src={getImageUrl(item.image)} variant="rounded" sx={{ width: 40, height: 40 }}>
                        {item.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, color: "#1e293b" }}>{item.name}</Typography>
                        {item.isFallback ? (
                          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                            No bookings yet — estimated from dealer coverage ({item.dealerCount} garages)
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                            {item.bookingCount} bookings this week
                          </Typography>
                        )}
                      </Box>
                      {!item.isFallback && (
                        <Chip
                          label={`${item.bookingCount} bookings`}
                          size="small"
                          sx={{ fontWeight: 700, backgroundColor: "#eff6ff", color: "#2563eb" }}
                        />
                      )}
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  No booking activity found for this city yet.
                </Typography>
              )}
            </Paper>
          )}

          {topGarages && (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Typography sx={{ fontWeight: 800, color: "#0f172a", mb: 2 }}>
                Top Rated Garages
              </Typography>
              {topGarages.data?.length ? (
                <Stack spacing={1.5}>
                  {topGarages.data.map((garage) => (
                    <Stack key={garage.dealerId} direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, color: "#1e293b" }}>{garage.shopName}</Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          {garage.locality || garage.city}
                        </Typography>
                      </Box>
                      <Chip
                        label={`★ ${garage.averageRating} (${garage.ratingCount})`}
                        size="small"
                        sx={{ fontWeight: 700, backgroundColor: "#fffbeb", color: "#b45309" }}
                      />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  No garages found in this city yet.
                </Typography>
              )}
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HomeInsights;

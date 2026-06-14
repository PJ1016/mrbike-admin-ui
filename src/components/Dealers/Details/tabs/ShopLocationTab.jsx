import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Typography,
  Paper,
  Chip,
  Stack,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import DescriptionIcon from "@mui/icons-material/Description";
import { InfoField, ImagePreview, SectionHeader } from "../DealerShared";

const ShopLocationTab = ({ dealer }) => {
  const lat = dealer.latitude || dealer.liveVerification?.latitude;
  const lng = dealer.longitude || dealer.liveVerification?.longitude;
  const hasCoords = lat && lng;

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Grid container spacing={3}>

        {/* Store Info */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<DescriptionIcon />} title="Store Information" />
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="700"
                      sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Opening Time
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: "success.main" }} />
                      <Typography variant="body1" fontWeight="600">
                        {dealer.businessHours?.open || "N/A"}
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="700"
                      sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Closing Time
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: "error.main" }} />
                      <Typography variant="body1" fontWeight="600">
                        {dealer.businessHours?.close || "N/A"}
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>

                {dealer.holiday && (
                  <Grid item xs={12}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight="700"
                        sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                      >
                        Holiday
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.8}>
                        <EventBusyIcon sx={{ fontSize: 16, color: "warning.main" }} />
                        <Typography variant="body1" fontWeight="600">
                          {dealer.holiday}
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {dealer.storeDescription && (
                  <Grid item xs={12}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight="700"
                        sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                      >
                        Store Description
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.75 }}>
                        {dealer.storeDescription}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Address & Coordinates */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<LocationOnIcon />} title="Address" />
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <InfoField
                    label="Full Address"
                    value={dealer.permanentAddress?.address || dealer.fullAddress}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="City"
                    value={dealer.permanentAddress?.city || dealer.shopCity || dealer.city}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="State"
                    value={dealer.permanentAddress?.state || dealer.shopState || dealer.state}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="Pincode"
                    value={dealer.shopPincode || dealer.shopPinCode}
                    mono
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {/* empty cell for alignment */}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="700"
                      sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Latitude
                    </Typography>
                    <Typography variant="body1" fontWeight="600" fontFamily="monospace">
                      {lat ?? "N/A"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="700"
                      sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Longitude
                    </Typography>
                    <Typography variant="body1" fontWeight="600" fontFamily="monospace">
                      {lng ?? "N/A"}
                    </Typography>
                  </Box>
                </Grid>

                {hasCoords && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MyLocationIcon />}
                      component="a"
                      href={`https://maps.google.com/?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
                    >
                      Open in Google Maps
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Shop Gallery */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5} pb={1.5} sx={{ borderBottom: "2px solid", borderColor: "primary.main" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PhotoLibraryIcon sx={{ color: "primary.main" }} />
                  <Typography variant="subtitle1" fontWeight="800" color="primary.main">
                    Shop Gallery
                  </Typography>
                </Stack>
                {Array.isArray(dealer.shopImages) && dealer.shopImages.length > 0 && (
                  <Chip
                    label={`${dealer.shopImages.length} photo${dealer.shopImages.length !== 1 ? "s" : ""}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Stack>

              {Array.isArray(dealer.shopImages) && dealer.shopImages.length > 0 ? (
                <Grid container spacing={2}>
                  {dealer.shopImages.slice(0, 8).map((img, i) => (
                    <Grid item xs={6} sm={4} md={3} key={i}>
                      <ImagePreview src={img} label={`Photo ${i + 1}`} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 5,
                    textAlign: "center",
                    borderStyle: "dashed",
                    bgcolor: "grey.50",
                    borderRadius: 2,
                  }}
                >
                  <PhotoLibraryIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    No shop images have been uploaded yet.
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShopLocationTab;

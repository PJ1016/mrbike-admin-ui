import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, TextField, Button, Card, CardContent, Divider,
  Typography, Stack, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Snackbar, Alert, InputAdornment, IconButton,
} from "@mui/material";
import {
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import PageHeader from "../Global/PageHeader";
import {
  getLocationFeaturedCategoryById,
  createLocationFeaturedCategory,
  updateLocationFeaturedCategory,
} from "../../api";

const MapPreview = ({ locationName, lat, lng, radius }) => {
  const radiusSize = Math.min(Math.max(Number(radius) * 15, 40), 160);
  return (
    <Box
      sx={{
        width: "100%",
        height: 240,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "#e8f0d8",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px, 40px 40px, 10px 10px, 10px 10px",
        }}
      />
      {[30, 48, 65].map((pct) => (
        <Box
          key={pct}
          sx={{
            position: "absolute",
            top: `${pct}%`,
            left: 0,
            right: 0,
            height: pct === 48 ? 7 : 4,
            bgcolor: "rgba(255,255,255,0.85)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        />
      ))}
      {[25, 50, 72].map((pct) => (
        <Box
          key={pct}
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${pct}%`,
            width: pct === 50 ? 7 : 4,
            bgcolor: "rgba(255,255,255,0.85)",
            boxShadow: "1px 0 3px rgba(0,0,0,0.08)",
          }}
        />
      ))}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${radiusSize}px`,
          height: `${radiusSize}px`,
          borderRadius: "50%",
          border: "2px dashed #2563eb",
          bgcolor: "rgba(37, 99, 235, 0.1)",
          transition: "all 0.4s ease",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, 2px)",
          width: 20,
          height: 6,
          borderRadius: "50%",
          bgcolor: "rgba(0,0,0,0.15)",
          filter: "blur(3px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -100%)",
        }}
      >
        <LocationOnIcon
          sx={{
            color: "#ef4444",
            fontSize: 40,
            filter: "drop-shadow(0 2px 6px rgba(239,68,68,0.4))",
          }}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "rgba(255,255,255,0.92)",
          borderTop: "1px solid rgba(226,232,240,0.8)",
          px: 2,
          py: 1,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: 260 }}>
              {locationName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lat}, {lng}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "primary.light",
              color: "primary.main",
              px: 1.5,
              py: 0.5,
              borderRadius: 10,
              fontSize: "0.75rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {radius} KM radius
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

const GOOGLE_MAPS_KEY = 'AIzaSyB_Lz_b22Sf5eKRSHhgxOnoZ8InrtXkpSM';

const loadGoogleMapsScript = (onReady) => {
  if (window.google?.maps?.places) { onReady(); return; }
  if (document.querySelector("script[data-gmaps]")) {
    const wait = setInterval(() => {
      if (window.google?.maps?.places) { clearInterval(wait); onReady(); }
    }, 100);
    return;
  }
  window.__gmapsCallback = () => { delete window.__gmapsCallback; onReady(); };
  const script = document.createElement("script");
  script.setAttribute("data-gmaps", "1");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=__gmapsCallback`;
  script.async = true;
  document.head.appendChild(script);
};

const LocationFeaturedCategoryForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(!!window.google?.maps?.places);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    categoryName: "",
    locationName: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: "",
    status: "active",
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [locationQuery, setLocationQuery] = useState("");
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    loadGoogleMapsScript(() => setGoogleReady(true));
  }, []);

  useEffect(() => {
    if (!googleReady || !searchInputRef.current || autocompleteRef.current) return;
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      { fields: ["geometry", "name", "formatted_address"] }
    );
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (!place?.geometry) return;
      const name = place.name || searchInputRef.current.value;
      setLocationQuery(name);
      setFormData((prev) => ({
        ...prev,
        locationName: name,
        address: place.formatted_address || "",
        latitude: String(place.geometry.location.lat()),
        longitude: String(place.geometry.location.lng()),
      }));
      setFormErrors((prev) => ({ ...prev, locationName: null }));
    });
  }, [googleReady]);

  useEffect(() => {
    if (isEdit && id) {
      setIsLoading(true);
      getLocationFeaturedCategoryById(id)
        .then((response) => {
          if (response?.success && response.data) {
            const item = response.data;
            setFormData({
              categoryName: item.categoryName || "",
              locationName: item.locationName || "",
              address: item.address || "",
              latitude: item.latitude ? String(item.latitude) : "",
              longitude: item.longitude ? String(item.longitude) : "",
              radius: item.radius ? String(item.radius) : "",
              status: item.status || "active",
            });
            setLocationQuery(item.locationName || "");
            if (item.categoryImage) setExistingImage(item.categoryImage);
          }
        })
        .catch((error) => {
          console.error("Error fetching category:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (!image) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleLocationQueryChange = (e) => {
    const val = e.target.value;
    setLocationQuery(val);
    if (!val.trim()) {
      setFormData((prev) => ({ ...prev, locationName: "", address: "", latitude: "", longitude: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
      setFormErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.categoryName.trim()) errors.categoryName = "Category name is required";
    if (!formData.locationName) errors.locationName = "Please select a location from the suggestions";
    if (!formData.radius || isNaN(Number(formData.radius)) || Number(formData.radius) <= 0)
      errors.radius = "Please enter a valid radius (greater than 0)";
    if (!isEdit && !image && !existingImage) errors.image = "Category image is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("categoryName", formData.categoryName.trim());
      payload.append("locationName", formData.locationName);
      payload.append("address", formData.address);
      payload.append("latitude", formData.latitude);
      payload.append("longitude", formData.longitude);
      payload.append("radius", formData.radius);
      payload.append("status", formData.status);
      if (image) payload.append("categoryImage", image);

      if (isEdit) {
        await updateLocationFeaturedCategory(id, payload);
        setSnackbar({
          open: true,
          message: "Location featured category updated successfully!",
          severity: "success",
        });
      } else {
        await createLocationFeaturedCategory(payload);
        setSnackbar({
          open: true,
          message: "Location featured category created successfully!",
          severity: "success",
        });
      }

      setTimeout(() => navigate("/location-featured-categories"), 1200);
    } catch (error) {
      // error Swal already shown by API function
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasLocation = !!formData.latitude && !!formData.longitude;
  const hasImage = previewUrl || existingImage;

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ py: 1 }}>
          <PageHeader
            title={isEdit ? "Edit Location Featured Category" : "Add Location Featured Category"}
            breadcrumbs={[
              { label: "Dashboard", path: "/" },
              { label: "Location Based Featured Categories", path: "/location-featured-categories" },
              { label: isEdit ? "Edit" : "Add", path: "#" },
            ]}
          />

          <Box sx={{ maxWidth: 900 }}>
            <Card sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

                    {/* Image Upload */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                        Category Image {!isEdit && "*"}
                      </Typography>
                      <Box
                        sx={{
                          width: "100%",
                          height: hasImage ? "auto" : 130,
                          minHeight: hasImage ? 200 : 130,
                          borderRadius: 2,
                          border: `1px dashed ${formErrors.image ? "#d32f2f" : "#d1d5db"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          bgcolor: "#fafafa",
                        }}
                      >
                        {hasImage ? (
                          <Box sx={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", p: 2 }}>
                            <img
                              src={previewUrl || existingImage}
                              alt="Preview"
                              style={{ maxHeight: 250, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }}
                            />
                            <IconButton
                              onClick={() => { setImage(null); setPreviewUrl(null); if (isEdit) setExistingImage(null); }}
                              sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" } }}
                              size="small"
                            >
                              <DeleteIcon color="error" fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Button
                            component="label"
                            fullWidth
                            sx={{ height: "100%", flexDirection: "column", gap: 1, color: "text.secondary", textTransform: "none" }}
                          >
                            <AddPhotoAlternateIcon sx={{ fontSize: 32, color: "#9ca3af" }} />
                            <Typography variant="body2" fontWeight={500}>Upload Category Image</Typography>
                            <Typography variant="caption" color="text.disabled">JPG, PNG, WEBP (Max 5MB)</Typography>
                            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                          </Button>
                        )}
                      </Box>
                      {formErrors.image && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: "block" }}>
                          {formErrors.image}
                        </Typography>
                      )}
                    </Box>

                    <Divider />

                    {/* Category Name & Status */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        fullWidth
                        label="Category Name"
                        name="categoryName"
                        value={formData.categoryName}
                        onChange={handleChange}
                        error={!!formErrors.categoryName}
                        helperText={formErrors.categoryName}
                        required
                        placeholder="e.g. Bike Wash, Oil Change..."
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                      <FormControl fullWidth size="small">
                        <InputLabel shrink>Status</InputLabel>
                        <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>

                    <Divider />

                    {/* Location Section */}
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocationOnIcon color="error" />
                        Location Settings
                      </Typography>

                      {/* Location Search — native Google Places Autocomplete */}
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          fullWidth
                          inputRef={searchInputRef}
                          label="Search Location"
                          value={locationQuery}
                          onChange={handleLocationQueryChange}
                          placeholder={googleReady ? "Type to search (e.g. Vijay Nagar, Palasia...)" : "Loading Google Maps..."}
                          disabled={!googleReady}
                          variant="outlined"
                          size="small"
                          error={!!formErrors.locationName}
                          helperText={formErrors.locationName || (googleReady ? "Search and select a location" : "Please wait...")}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon color="action" fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>

                      {/* Selected Address */}
                      <TextField
                        fullWidth
                        label="Selected Address"
                        value={formData.address}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: true }}
                        placeholder="Address will be auto-filled after selecting location"
                        helperText="Auto-filled from location selection"
                      />


                      {/* Radius */}
                      <TextField
                        fullWidth
                        label="Radius (KM)"
                        name="radius"
                        value={formData.radius}
                        onChange={handleChange}
                        type="number"
                        inputProps={{ min: 0.1, step: 0.5 }}
                        error={!!formErrors.radius}
                        helperText={formErrors.radius || "Coverage radius in kilometers"}
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        placeholder="e.g. 8"
                        sx={{ mb: 2, maxWidth: 300 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="text.secondary">KM</Typography>
                            </InputAdornment>
                          ),
                        }}
                      />

                      {/* Map Preview */}
                      {hasLocation && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                            Map Preview
                          </Typography>
                          <MapPreview
                            locationName={formData.locationName}
                            lat={formData.latitude}
                            lng={formData.longitude}
                            radius={formData.radius || "1"}
                          />
                        </Box>
                      )}
                    </Box>

                    <Divider />

                    {/* Actions */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate("/location-featured-categories")}
                        disabled={isSubmitting}
                        sx={{ fontWeight: "bold", minWidth: 100 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{ fontWeight: "bold", minWidth: 140 }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : isEdit ? (
                          "Update"
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </Box>

                  </Box>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LocationFeaturedCategoryForm;

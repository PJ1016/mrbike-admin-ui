import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PageHeader from "../../components/Global/PageHeader";
import PauseAreaDialog from "../../components/ServiceableAreas/PauseAreaDialog";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  loadGoogleMapsPlaces,
  selectedPlaceDetails,
} from "../../utils/googleMaps";
import {
  getServiceableAreas,
  createServiceableArea,
  updateServiceableArea,
  updateServiceableAreaStatus,
  deleteServiceableArea,
} from "../../api";

const MapPreview = ({ label, lat, lng, radiusKm, showRadius }) => {
  const mapElementRef = useRef(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (!mapElementRef.current || !window.google?.maps) return;

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    try {
      const center = { lat: latitude, lng: longitude };
      const map = new window.google.maps.Map(mapElementRef.current, {
        center,
        zoom: showRadius ? 12 : 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      const marker = new window.google.maps.Marker({
        map,
        position: center,
        title: label,
      });
      const radius = Number(radiusKm);
      const circle = showRadius && Number.isFinite(radius) && radius > 0
        ? new window.google.maps.Circle({
            map,
            center,
            radius: radius * 1000,
            fillColor: "#2563eb",
            fillOpacity: 0.12,
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 2,
          })
        : null;

      setMapError(null);
      return () => {
        marker.setMap(null);
        circle?.setMap(null);
      };
    } catch (error) {
      setMapError("Map preview could not be rendered.");
      return undefined;
    }
  }, [label, lat, lng, radiusKm, showRadius]);

  return (
    <Box
      sx={{
        width: "100%",
        height: 180,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        border: "1px solid #e2e8f0",
      }}
    >
      <Box ref={mapElementRef} sx={{ position: "absolute", inset: 0 }} />
      {mapError && (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "#f8fafc" }}>
          <Typography variant="caption" color="error">{mapError}</Typography>
        </Box>
      )}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "rgba(255,255,255,0.92)",
          borderTop: "1px solid rgba(226,232,240,0.8)",
          px: 1.5,
          py: 0.75,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" fontWeight={700} noWrap sx={{ maxWidth: 180 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

const STATUS_CONFIG = {
  live: { label: "Live", color: "success" },
  coming_soon: { label: "Coming Soon", color: "info" },
  paused: { label: "Paused", color: "warning" },
};

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "coming_soon", label: "Coming Soon" },
  { id: "paused", label: "Paused" },
];

const emptyForm = {
  name: "",
  type: "city",
  cityName: "",
  latitude: "",
  longitude: "",
  radiusKm: "",
  status: "coming_soon",
  pausedReason: "",
  estimatedLiveDate: "",
};

const AreaRow = ({ area, onEdit, onDeleteClick, onStatusChange, statusUpdatingId }) => {
  const statusInfo = STATUS_CONFIG[area.status] || STATUS_CONFIG.coming_soon;
  const isRadius = area.type === "radius";
  const coords = area.location?.coordinates;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "10px",
            backgroundColor: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isRadius ? (
            <MyLocationIcon sx={{ color: "#2563eb", fontSize: 20 }} />
          ) : (
            <LocationCityIcon sx={{ color: "#2563eb", fontSize: 20 }} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>{area.name}</Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            {isRadius
              ? `${area.radiusKm ?? "?"} km radius${coords ? ` · ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}` : ""}`
              : area.cityName}
          </Typography>
          {area.status === "paused" && area.pausedReason && (
            <Typography variant="caption" sx={{ color: "#b45309", display: "block", mt: 0.25 }}>
              Paused: {area.pausedReason}
            </Typography>
          )}
          {area.status === "coming_soon" && area.estimatedLiveDate && (
            <Typography variant="caption" sx={{ color: "#0369a1", display: "block", mt: 0.25 }}>
              Expected live {new Date(area.estimatedLiveDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        <Chip label={statusInfo.label} color={statusInfo.color} size="small" sx={{ fontWeight: 700, height: 24 }} />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={area.status}
            disabled={statusUpdatingId === area._id}
            onChange={(e) => onStatusChange(area, e.target.value)}
          >
            <MenuItem value="live">Live</MenuItem>
            <MenuItem value="coming_soon">Coming Soon</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Edit">
          <IconButton onClick={() => onEdit(area)} sx={{ color: "#64748b" }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton onClick={() => onDeleteClick(area)} sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

const ServiceableAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [locationQuery, setLocationQuery] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [pauseTarget, setPauseTarget] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [googleReady, setGoogleReady] = useState(!!window.google?.maps?.places);
  const [googleError, setGoogleError] = useState(null);
  const searchInputRef = useRef(null);

  const loadAreas = async () => {
    try {
      setLoading(true);
      setListError(null);
      // Global request validation and this endpoint both cap pagination at
      // 100. Sending 200 is rejected before auth/controller/database work.
      const res = await getServiceableAreas({ limit: 100 });
      if (!Array.isArray(res?.data)) {
        throw new Error("The serviceable areas API returned an invalid response.");
      }
      setAreas(res.data);
    } catch (error) {
      console.error("Error fetching serviceable areas:", error);
      setListError(getApiErrorMessage(error, "Could not load serviceable areas."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    let active = true;
    const handleGoogleAuthFailure = () => {
      if (!active) return;
      setGoogleReady(false);
      setGoogleError(
        "Google Maps rejected the configured key. Check billing, Maps JavaScript API, Places API, and the production referrer allowlist.",
      );
    };
    window.addEventListener("mrbike-google-maps-auth-failure", handleGoogleAuthFailure);
    loadGoogleMapsPlaces()
      .then(() => {
        if (!active) return;
        setGoogleReady(true);
        setGoogleError(null);
      })
      .catch((error) => {
        if (!active) return;
        setGoogleReady(false);
        setGoogleError(error.message);
      });
    return () => {
      active = false;
      window.removeEventListener("mrbike-google-maps-auth-failure", handleGoogleAuthFailure);
    };
  }, []);

  // Both area types use Places: city mode lists Indian cities, while radius
  // mode accepts any geocoded location and persists its selected coordinates.
  useEffect(() => {
    if (!dialogOpen || !googleReady || !searchInputRef.current) return;
    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ["geometry", "name", "formatted_address", "address_components"],
      componentRestrictions: { country: "in" },
      types: form.type === "city" ? ["(cities)"] : ["geocode"],
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const selection = selectedPlaceDetails(place);
      if (!selection) {
        setFormErrors((prev) => ({
          ...prev,
          [form.type === "city" ? "cityName" : "location"]:
            "Select a location from the suggestions.",
        }));
        return;
      }

      if (form.type === "city") {
        setForm((current) => ({
          ...current,
          cityName: selection.cityName,
          latitude: String(selection.latitude),
          longitude: String(selection.longitude),
        }));
        setFormErrors((prev) => ({ ...prev, cityName: null }));
      } else {
        setLocationQuery(selection.label);
        setForm((current) => ({
          ...current,
          latitude: String(selection.latitude),
          longitude: String(selection.longitude),
        }));
        setFormErrors((prev) => ({ ...prev, location: null }));
      }
    });
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, form.type, googleReady]);

  const statusCounts = useMemo(
    () => ({
      all: areas.length,
      live: areas.filter((a) => a.status === "live").length,
      coming_soon: areas.filter((a) => a.status === "coming_soon").length,
      paused: areas.filter((a) => a.status === "paused").length,
    }),
    [areas]
  );

  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      if (statusTab !== "all" && a.status !== statusTab) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${a.name || ""} ${a.cityName || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [areas, statusTab, typeFilter, search]);

  const handleLocationQueryChange = (e) => {
    const val = e.target.value;
    setLocationQuery(val);
    // Typed text is not a selected place. Clear stale coordinates until the
    // user chooses a fresh Google suggestion.
    setForm((f) => ({ ...f, latitude: "", longitude: "" }));
    setFormErrors((prev) => ({ ...prev, location: null }));
  };

  const openCreate = () => {
    setEditingArea(null);
    setForm(emptyForm);
    setLocationQuery("");
    setFormErrors({});
    setGlobalError(null);
    setDialogOpen(true);
  };

  const openEdit = (area) => {
    const isRadius = area.type === "radius";
    const coords = area.location?.coordinates;
    setEditingArea(area);
    setForm({
      name: area.name || "",
      type: area.type,
      cityName: area.cityName || "",
      latitude: isRadius && coords ? String(coords[1]) : "",
      longitude: isRadius && coords ? String(coords[0]) : "",
      radiusKm: area.radiusKm != null ? String(area.radiusKm) : "",
      status: area.status || "coming_soon",
      pausedReason: area.pausedReason || "",
      estimatedLiveDate: area.estimatedLiveDate ? area.estimatedLiveDate.substring(0, 10) : "",
    });
    setLocationQuery(isRadius ? area.name || "" : "");
    setFormErrors({});
    setGlobalError(null);
    setDialogOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";

    if (form.type === "city") {
      if (!form.cityName.trim()) errors.cityName = "City name is required";
    } else {
      if (!form.latitude || !form.longitude) errors.location = "Please search and select a location";
      if (!form.radiusKm || isNaN(Number(form.radiusKm)) || Number(form.radiusKm) <= 0)
        errors.radiusKm = "Please enter a valid radius (greater than 0)";
    }

    if (form.status === "paused" && !form.pausedReason.trim())
      errors.pausedReason = "A reason is required when pausing an area";

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = { name: form.name.trim(), type: form.type, status: form.status };
    if (form.type === "city") {
      payload.cityName = form.cityName.trim();
    } else {
      payload.latitude = Number(form.latitude);
      payload.longitude = Number(form.longitude);
      payload.radiusKm = Number(form.radiusKm);
    }
    if (form.status === "paused") {
      payload.pausedReason = form.pausedReason.trim();
    }
    if (form.status === "coming_soon" && form.estimatedLiveDate) {
      payload.estimatedLiveDate = form.estimatedLiveDate;
    }

    setSubmitting(true);
    setGlobalError(null);
    try {
      if (editingArea) {
        await updateServiceableArea(editingArea._id, payload);
      } else {
        await createServiceableArea(payload);
      }
      setDialogOpen(false);
      loadAreas();
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteServiceableArea(deleteTarget._id);
      setDeleteTarget(null);
      loadAreas();
    } catch (error) {
      setDeleteError(error?.response?.data?.message || "Could not delete area");
    } finally {
      setDeleting(false);
    }
  };

  // "Live" / "Coming Soon" fire immediately (optimistic, revert on error).
  // "Paused" always routes through PauseAreaDialog — never fires without a
  // reason from the UI side, matching the backend's hard requirement.
  const handleStatusChange = async (area, newStatus) => {
    if (newStatus === area.status) return;
    if (newStatus === "paused") {
      setPauseTarget(area);
      return;
    }
    const previous = areas;
    setStatusUpdatingId(area._id);
    setAreas((list) => list.map((a) => (a._id === area._id ? { ...a, status: newStatus } : a)));
    try {
      await updateServiceableAreaStatus(area._id, { status: newStatus });
      loadAreas();
    } catch (error) {
      console.error("Error updating area status:", error);
      setAreas(previous);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handlePauseConfirm = async (reason) => {
    await updateServiceableAreaStatus(pauseTarget._id, { status: "paused", pausedReason: reason });
    loadAreas();
  };

  const hasLocation = !!form.latitude && !!form.longitude;

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <PageHeader
            title="Serviceable Areas"
            breadcrumbs={[
              { label: "Dashboard", path: "/" },
              { label: "Serviceable Areas", path: "#" },
            ]}
            action={{ label: "New Area", icon: <AddIcon />, onClick: openCreate }}
          />

          <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
            Control which cities/areas the customer app is live in — pause an area temporarily
            (rain, festival, staff shortage) with a reason customers will see.
          </Typography>

          <Paper elevation={0} sx={{ mb: 2, borderRadius: 3, border: "1px solid #edf2f7", overflow: "hidden" }}>
            <Tabs
              value={statusTab}
              onChange={(_, v) => setStatusTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 48,
                  fontSize: "0.875rem",
                  color: "#64748b",
                },
                "& .Mui-selected": { color: "#2563eb" },
                "& .MuiTabs-indicator": { backgroundColor: "#2563eb" },
              }}
            >
              {FILTER_TABS.map((tab) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      {tab.label}
                      <Chip
                        label={statusCounts[tab.id]}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: statusTab === tab.id ? "#2563eb" : "#f1f5f9",
                          color: statusTab === tab.id ? "white" : "#64748b",
                          "& .MuiChip-label": { px: 0.75 },
                        }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Paper>

          <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: "100%", sm: 340 }, backgroundColor: "white", borderRadius: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160, backgroundColor: "white", borderRadius: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="city">City</MenuItem>
                <MenuItem value="radius">Radius</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {filteredAreas.length} {filteredAreas.length === 1 ? "area" : "areas"} found
            </Typography>
          </Box>

          {listError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={loadAreas}>
                  Retry
                </Button>
              }
            >
              {listError}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress size={40} sx={{ color: "#2563eb" }} />
            </Box>
          ) : listError ? null : filteredAreas.length === 0 ? (
            <Paper elevation={0} sx={{ py: 10, textAlign: "center", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>No serviceable areas found</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
                {areas.length === 0 ? "Add one to control where the customer app is live." : "Try a different search or filter."}
              </Typography>
            </Paper>
          ) : (
            filteredAreas.map((area) => (
              <AreaRow
                key={area._id}
                area={area}
                onEdit={openEdit}
                onDeleteClick={setDeleteTarget}
                onStatusChange={handleStatusChange}
                statusUpdatingId={statusUpdatingId}
              />
            ))
          )}
        </Box>
      </Container>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingArea ? "Edit Area" : "New Serviceable Area"}</DialogTitle>
        <DialogContent>
          {globalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {globalError}
            </Alert>
          )}
          <Stack spacing={3} sx={{ mt: 1 }}>
            {googleError && (
              <Alert severity="error">
                {googleError} Production must allow https://admin.mrbikedoctor.cloud/*.
              </Alert>
            )}
            <TextField
              label="Area Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={!!formErrors.name}
              helperText={formErrors.name}
              placeholder="e.g. Indore, Vijay Nagar Ring Road..."
              fullWidth
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel shrink>Area Type</InputLabel>
              <Select
                label="Area Type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                displayEmpty
              >
                <MenuItem value="city">City</MenuItem>
                <MenuItem value="radius">Radius (point + km)</MenuItem>
              </Select>
            </FormControl>

            {form.type === "city" && (
              <TextField
                inputRef={searchInputRef}
                label="City Name"
                value={form.cityName}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    cityName: e.target.value,
                    latitude: "",
                    longitude: "",
                  }));
                  setFormErrors((prev) => ({ ...prev, cityName: null }));
                }}
                error={!!formErrors.cityName}
                helperText={formErrors.cityName || (googleReady ? "Search and select an Indian city" : "Google Places is loading")}
                placeholder="Search city, e.g. Indore"
                disabled={!googleReady}
                fullWidth
                size="small"
              />
            )}

            {form.type === "radius" && (
              <>
                <TextField
                  inputRef={searchInputRef}
                  label="Search Location"
                  value={locationQuery}
                  onChange={handleLocationQueryChange}
                  placeholder={googleReady ? "Type to search (e.g. Vijay Nagar, Palasia...)" : "Loading Google Maps..."}
                  disabled={!googleReady}
                  error={!!formErrors.location}
                  helperText={formErrors.location || (googleReady ? "Search and select a location to set lat/lng" : "Please wait...")}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Radius (KM)"
                  type="number"
                  value={form.radiusKm}
                  onChange={(e) => setForm((f) => ({ ...f, radiusKm: e.target.value }))}
                  error={!!formErrors.radiusKm}
                  helperText={formErrors.radiusKm || "Coverage radius in kilometers"}
                  inputProps={{ min: 0.1, step: 0.5 }}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">KM</Typography>
                      </InputAdornment>
                    ),
                  }}
                />

                {hasLocation && (
                  <MapPreview
                    label={form.name || locationQuery || "Selected location"}
                    lat={form.latitude}
                    lng={form.longitude}
                    radiusKm={form.radiusKm || "1"}
                    showRadius
                  />
                )}
              </>
            )}

            {form.type === "city" && hasLocation && (
              <MapPreview
                label={form.cityName || form.name || "Selected city"}
                lat={form.latitude}
                lng={form.longitude}
                showRadius={false}
              />
            )}

            <FormControl fullWidth size="small">
              <InputLabel shrink>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                displayEmpty
              >
                <MenuItem value="live">Live</MenuItem>
                <MenuItem value="coming_soon">Coming Soon</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
              </Select>
            </FormControl>

            {form.status === "paused" && (
              <TextField
                label="Paused Reason"
                required
                multiline
                minRows={2}
                value={form.pausedReason}
                onChange={(e) => setForm((f) => ({ ...f, pausedReason: e.target.value }))}
                error={!!formErrors.pausedReason}
                helperText={formErrors.pausedReason || "Shown to customers in the app while paused."}
                placeholder="e.g. Paused due to heavy rain in the area."
                fullWidth
                size="small"
              />
            )}

            {form.status === "coming_soon" && (
              <TextField
                label="Estimated Live Date"
                type="date"
                value={form.estimatedLiveDate}
                onChange={(e) => setForm((f) => ({ ...f, estimatedLiveDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                helperText="Optional — shown to customers as an ETA"
                fullWidth
                size="small"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: "none", fontWeight: 600, backgroundColor: "#2563eb" }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : editingArea ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete area?</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Are you sure you want to delete <b>"{deleteTarget?.name}"</b>? This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 600, backgroundColor: "#ef4444" }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mandatory-reason pause dialog */}
      <PauseAreaDialog
        open={!!pauseTarget}
        areaName={pauseTarget?.name}
        onClose={() => setPauseTarget(null)}
        onConfirm={handlePauseConfirm}
      />
    </Box>
  );
};

export default ServiceableAreas;

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
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PageHeader from "../../components/Global/PageHeader";
import PauseAreaDialog from "../../components/ServiceableAreas/PauseAreaDialog";
import {
  getServiceableAreas,
  createServiceableArea,
  updateServiceableArea,
  updateServiceableAreaStatus,
  deleteServiceableArea,
} from "../../api";

// Same raw Google Maps JS API + Places pattern used by
// LocationFeaturedCategoryForm — no interactive map, just Autocomplete to
// fill lat/lng plus a static preview box.
const GOOGLE_MAPS_KEY = "AIzaSyCM15ry8lewwj6YZ-04_m7Z58dsQo_hBBA";

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

const MapPreview = ({ label, lat, lng, radiusKm }) => {
  const radiusSize = Math.min(Math.max(Number(radiusKm) * 12, 40), 140);
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
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "#e8f0d8",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
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
          transition: "all 0.3s ease",
        }}
      />
      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)" }}>
        <LocationOnIcon sx={{ color: "#ef4444", fontSize: 34, filter: "drop-shadow(0 2px 6px rgba(239,68,68,0.4))" }} />
      </Box>
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
  const searchInputRef = useRef(null);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const res = await getServiceableAreas({ limit: 200 });
      if (res?.status) setAreas(res.data || []);
    } catch (error) {
      console.error("Error fetching serviceable areas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    loadGoogleMapsScript(() => setGoogleReady(true));
  }, []);

  // Attach Places Autocomplete only while the location search box is
  // actually mounted (dialog open + type === "radius"); re-attaches fresh
  // each time since the input remounts.
  useEffect(() => {
    if (!dialogOpen || form.type !== "radius" || !googleReady || !searchInputRef.current) return;
    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ["geometry", "name", "formatted_address"],
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place?.geometry) return;
      const name = place.name || searchInputRef.current.value;
      setLocationQuery(name);
      setForm((f) => ({
        ...f,
        latitude: String(place.geometry.location.lat()),
        longitude: String(place.geometry.location.lng()),
      }));
      setFormErrors((prev) => ({ ...prev, location: null }));
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
    if (!val.trim()) {
      setForm((f) => ({ ...f, latitude: "", longitude: "" }));
    }
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

  const hasLocation = form.type === "radius" && !!form.latitude && !!form.longitude;

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

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress size={40} sx={{ color: "#2563eb" }} />
            </Box>
          ) : filteredAreas.length === 0 ? (
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
                label="City Name"
                value={form.cityName}
                onChange={(e) => setForm((f) => ({ ...f, cityName: e.target.value }))}
                error={!!formErrors.cityName}
                helperText={formErrors.cityName}
                placeholder="e.g. Indore"
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
                  />
                )}
              </>
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

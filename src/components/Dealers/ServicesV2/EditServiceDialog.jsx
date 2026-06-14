import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import BusinessIcon from "@mui/icons-material/Business";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCompanies,
  fetchBikesByCompany,
} from "../../../redux/slices/bikeSlice";
import Swal from "sweetalert2";

// Isolated price cell — only re-renders when its own value changes
const PriceInput = React.memo(({ bikeId, value, onChange }) => (
  <TextField
    size="small"
    type="number"
    value={value ?? ""}
    onChange={(e) => onChange(bikeId, e.target.value)}
    error={value !== undefined && value !== "" && Number(value) <= 0}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <CurrencyRupeeIcon sx={{ fontSize: 13, color: "text.secondary" }} />
        </InputAdornment>
      ),
      inputProps: { min: 0, step: 10 },
    }}
    sx={{ width: 130 }}
  />
));

const ADD_BIKE_COLUMNS = [
  {
    field: "variant_name",
    headerName: "Bike Name",
    flex: 2,
    renderCell: ({ value }) => (
      <Typography variant="body2" fontWeight={600} noWrap>
        {value}
      </Typography>
    ),
  },
  { field: "company_name", headerName: "Company", flex: 1 },
  {
    field: "cc",
    headerName: "CC",
    width: 90,
    renderCell: ({ value }) => (
      <Chip label={`${value}cc`} size="small" variant="outlined" />
    ),
  },
];

const EditServiceDialog = ({
  open,
  onClose,
  serviceType,
  serviceRow,
  allPricing,
  dealerId,
  onSave,
}) => {
  const dispatch = useDispatch();
  const { companies, bikes, loading: bikesLoading } = useSelector(
    (s) => s.bike
  );

  // ── Derive initial state from existing entries ──
  const existingEntries = useMemo(
    () =>
      allPricing.filter(
        (p) =>
          String(p.serviceId) === serviceRow.serviceId &&
          p.type === serviceType
      ),
    [allPricing, serviceRow.serviceId, serviceType]
  );

  const [currentBikes, setCurrentBikes] = useState(() =>
    existingEntries.map((e) => ({
      _id: e.variantId,
      variant_name: e.bikeName || e.variantId,
      company_name: e.companyName || "",
      model_name: e.modelName || "",
      cc: Number(e.cc || 0),
    }))
  );

  const [pricing, setPricing] = useState(() => {
    const map = {};
    existingEntries.forEach((e) => {
      map[e.variantId] = String(e.price);
    });
    return map;
  });

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [addSelection, setAddSelection] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const prevCompanyRef = useRef(null);

  useEffect(() => {
    if (companies.length === 0) dispatch(fetchCompanies());
  }, [companies.length, dispatch]);

  useEffect(() => {
    if (selectedCompanyIds.length === 0) return;
    const key = [...selectedCompanyIds].sort().join(",");
    if (prevCompanyRef.current === key) return;
    prevCompanyRef.current = key;
    dispatch(fetchBikesByCompany(selectedCompanyIds));
  }, [selectedCompanyIds, dispatch]);

  // ── Company mapping — which companies are currently represented ──
  const companyMappings = useMemo(() => {
    const map = {};
    currentBikes.forEach((b) => {
      const name = b.company_name;
      if (name) {
        if (!map[name]) map[name] = 0;
        map[name]++;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentBikes]);

  // ── CC mapping — which CC values are currently represented ──
  const ccMappings = useMemo(() => {
    const map = {};
    currentBikes.forEach((b) => {
      const cc = Number(b.cc || 0);
      if (!map[cc]) map[cc] = 0;
      map[cc]++;
    });
    return Object.entries(map)
      .map(([cc, count]) => ({ cc: Number(cc), count }))
      .sort((a, b) => a.cc - b.cc);
  }, [currentBikes]);

  const filteredCurrent = useMemo(() => {
    if (!search.trim()) return currentBikes;
    const q = search.toLowerCase();
    return currentBikes.filter(
      (b) =>
        b.variant_name?.toLowerCase().includes(q) ||
        b.company_name?.toLowerCase().includes(q)
    );
  }, [currentBikes, search]);

  const availableToAdd = useMemo(() => {
    const currentIds = new Set(currentBikes.map((b) => b._id));
    return bikes
      .filter((b) => !currentIds.has(b._id || b.variant_id))
      .map((b) => ({
        ...b,
        id: b._id || b.variant_id,
        cc: Number(b.cc || b.engine_cc || 0),
      }));
  }, [bikes, currentBikes]);

  const handlePriceChange = useCallback((bikeId, price) => {
    setPricing((prev) => ({ ...prev, [bikeId]: price }));
  }, []);

  const handleRemoveBike = useCallback((bikeId) => {
    setCurrentBikes((prev) => prev.filter((b) => b._id !== bikeId));
    setPricing((prev) => {
      const copy = { ...prev };
      delete copy[bikeId];
      return copy;
    });
  }, []);

  // Remove all bikes from a given company
  const handleRemoveByCompany = useCallback(
    (companyName) => {
      const toRemove = new Set(
        currentBikes
          .filter((b) => b.company_name === companyName)
          .map((b) => b._id)
      );
      setCurrentBikes((prev) => prev.filter((b) => !toRemove.has(b._id)));
      setPricing((prev) => {
        const copy = { ...prev };
        toRemove.forEach((id) => delete copy[id]);
        return copy;
      });
    },
    [currentBikes]
  );

  // Remove all bikes with a given CC value
  const handleRemoveByCC = useCallback(
    (cc) => {
      const toRemove = new Set(
        currentBikes
          .filter((b) => Number(b.cc || 0) === cc)
          .map((b) => b._id)
      );
      setCurrentBikes((prev) => prev.filter((b) => !toRemove.has(b._id)));
      setPricing((prev) => {
        const copy = { ...prev };
        toRemove.forEach((id) => delete copy[id]);
        return copy;
      });
    },
    [currentBikes]
  );

  const handleToggleCompany = useCallback((id) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleAddSelectedBikes = useCallback(() => {
    const toAdd = bikes
      .filter((b) => addSelection.includes(b._id || b.variant_id))
      .map((b) => ({
        ...b,
        _id: b._id || b.variant_id,
        cc: Number(b.cc || b.engine_cc || 0),
      }));
    setCurrentBikes((prev) => [...prev, ...toAdd]);
    setAddSelection([]);
    setActiveTab(0);
  }, [bikes, addSelection]);

  const handleSave = useCallback(async () => {
    const invalid = currentBikes.filter(
      (b) =>
        pricing[b._id] === undefined ||
        pricing[b._id] === "" ||
        Number(pricing[b._id]) <= 0
    );
    if (invalid.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing Prices",
        text: `${invalid.length} bike(s) need a valid price.`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const newEntries = currentBikes.map((bike) => ({
        type: serviceType,
        serviceId: serviceRow.serviceId,
        variantId: String(bike._id),
        cc: Number(bike.cc || 0),
        price: Number(pricing[bike._id] || 0),
        bikeName: bike.variant_name,
        companyName: bike.company_name,
        modelName: bike.model_name,
      }));

      const filtered = allPricing.filter(
        (p) =>
          !(
            String(p.serviceId) === serviceRow.serviceId &&
            p.type === serviceType
          )
      );
      await onSave([...filtered, ...newEntries]);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `${serviceRow.serviceName} updated with ${currentBikes.length} bike${currentBikes.length !== 1 ? "s" : ""}.`,
        timer: 1800,
        showConfirmButton: false,
      });
      onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err?.message || "Could not save changes.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    currentBikes,
    pricing,
    serviceType,
    serviceRow,
    allPricing,
    onSave,
    onClose,
  ]);

  const filledCount = useMemo(
    () =>
      currentBikes.filter((b) => {
        const p = pricing[b._id];
        return p !== undefined && p !== "" && Number(p) > 0;
      }).length,
    [currentBikes, pricing]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: 540, maxHeight: "92vh" },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {serviceRow.serviceName}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
            <Chip
              label={serviceType}
              size="small"
              color={serviceType === "base" ? "primary" : "secondary"}
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
            />
            <Typography variant="body2" color="text.secondary">
              {currentBikes.length} bikes · {filledCount} priced
            </Typography>
          </Stack>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none" },
          }}
        >
          <Tab label={`Current Bikes (${currentBikes.length})`} />
          <Tab
            label="Add More Bikes"
            icon={<AddIcon fontSize="small" />}
            iconPosition="end"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ py: 2, overflow: "auto" }}>
        {/* ── Tab 0: Current bikes + prices ── */}
        {activeTab === 0 && (
          <Box>
            {/* ── Company mapping chips ── */}
            {companyMappings.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "grey.50",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  mb={0.75}
                  flexWrap="wrap"
                >
                  <BusinessIcon
                    sx={{ fontSize: 15, color: "text.secondary" }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}
                  >
                    Companies
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    (click × to remove all bikes from that company)
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75}>
                  {companyMappings.map(({ name, count }) => (
                    <Chip
                      key={name}
                      label={`${name} (${count})`}
                      size="small"
                      onDelete={() => handleRemoveByCompany(name)}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              </Paper>
            )}

            {/* ── CC mapping chips ── */}
            {ccMappings.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "grey.50",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  mb={0.75}
                  flexWrap="wrap"
                >
                  <FilterListIcon
                    sx={{ fontSize: 15, color: "text.secondary" }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}
                  >
                    CC Ranges
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    (click × to remove all bikes with that CC)
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75}>
                  {ccMappings.map(({ cc, count }) => (
                    <Chip
                      key={cc}
                      label={`${cc} cc (${count} bike${count !== 1 ? "s" : ""})`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => handleRemoveByCC(cc)}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              </Paper>
            )}

            {/* ── Search + price count ── */}
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <TextField
                size="small"
                placeholder="Search current bikes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "text.disabled" }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 260 }}
              />
              <Typography variant="body2" color="text.secondary">
                {filledCount}/{currentBikes.length} prices filled
              </Typography>
            </Stack>

            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                maxHeight: 320,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        bgcolor: "grey.50",
                        fontWeight: 700,
                        fontSize: "0.76rem",
                        color: "text.secondary",
                        textTransform: "uppercase",
                      },
                    }}
                  >
                    <TableCell>Bike Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell align="center">CC</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell align="center">Remove</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCurrent.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ py: 4, color: "text.disabled" }}
                      >
                        {currentBikes.length === 0
                          ? 'No bikes added yet. Use "Add More Bikes" tab.'
                          : "No bikes match your search."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCurrent.map((bike) => (
                      <TableRow
                        key={bike._id}
                        hover
                        sx={{ "&:last-child td": { borderBottom: 0 } }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {bike.variant_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {bike.company_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${bike.cc}cc`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <PriceInput
                            bikeId={bike._id}
                            value={pricing[bike._id]}
                            onChange={handlePriceChange}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Remove bike from this service">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveBike(bike._id)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── Tab 1: Add more bikes ── */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select companies to load their bikes, then pick which ones to add
              to this service.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Stack
                direction="row"
                spacing={0.5}
                flexWrap="wrap"
                alignItems="center"
              >
                <BusinessIcon
                  sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }}
                />
                <Typography variant="body2" fontWeight={600} mr={1}>
                  Filter by company:
                </Typography>
                {companies.map((c) => (
                  <Chip
                    key={c._id}
                    label={c.name}
                    clickable
                    size="small"
                    color={
                      selectedCompanyIds.includes(c._id) ? "primary" : "default"
                    }
                    variant={
                      selectedCompanyIds.includes(c._id) ? "filled" : "outlined"
                    }
                    onClick={() => handleToggleCompany(c._id)}
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Stack>
            </Box>

            {selectedCompanyIds.length === 0 ? (
              <Alert severity="info">
                Select one or more companies above to load available bikes.
              </Alert>
            ) : bikesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : availableToAdd.length === 0 ? (
              <Alert severity="warning">
                All bikes from the selected companies are already added, or no
                bikes were found.
              </Alert>
            ) : (
              <Box>
                <Box sx={{ height: 300 }}>
                  <DataGrid
                    rows={availableToAdd}
                    columns={ADD_BIKE_COLUMNS}
                    checkboxSelection
                    disableRowSelectionOnClick
                    rowSelectionModel={{
                      type: "include",
                      ids: new Set(addSelection),
                    }}
                    onRowSelectionModelChange={(newModel) =>
                      setAddSelection(Array.from(newModel.ids))
                    }
                    pageSizeOptions={[25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    density="compact"
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.50" },
                    }}
                  />
                </Box>
                {addSelection.length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddSelectedBikes}
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                    }}
                  >
                    Add {addSelection.length} Bike
                    {addSelection.length > 1 ? "s" : ""} to Service
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />

      {/* Footer */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ mr: "auto", fontWeight: 600, textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || currentBikes.length === 0}
          startIcon={
            isSaving ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            fontWeight: 800,
            textTransform: "none",
            borderRadius: 2,
            px: 4,
          }}
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditServiceDialog;

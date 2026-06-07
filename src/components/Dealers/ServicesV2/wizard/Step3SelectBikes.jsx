import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useDispatch, useSelector } from "react-redux";
import { fetchBikesByCompany } from "../../../../redux/slices/bikeSlice";

const CC_COLUMNS = [
  {
    field: "variant_name",
    headerName: "Bike Name",
    flex: 2,
    sortable: true,
    renderCell: ({ value }) => (
      <Typography variant="body2" fontWeight={600} noWrap>
        {value}
      </Typography>
    ),
  },
  { field: "company_name", headerName: "Company", flex: 1, sortable: true },
  { field: "model_name", headerName: "Model", flex: 1, sortable: true },
  {
    field: "cc",
    headerName: "CC",
    width: 90,
    type: "number",
    sortable: true,
    renderCell: ({ value }) => (
      <Chip label={`${value} cc`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
    ),
  },
];

const Step3SelectBikes = ({ state, dispatch: wizardDispatch }) => {
  const reduxDispatch = useDispatch();
  const { bikes, loading } = useSelector((s) => s.bike);

  const [search, setSearch] = useState("");
  const [ccFilter, setCcFilter] = useState("");
  // Controlled selection — array of bike id strings
  const [selectionModel, setSelectionModel] = useState(
    () => state.selectedBikes.map((b) => b._id || b.variant_id)
  );

  // Fetch bikes whenever selected companies change
  const prevCompanyIdsRef = useRef(null);
  useEffect(() => {
    const ids = state.selectedCompanyIds;
    if (ids.length === 0) return;
    const key = [...ids].sort().join(",");
    if (prevCompanyIdsRef.current === key) return;
    prevCompanyIdsRef.current = key;
    reduxDispatch(fetchBikesByCompany(ids));
  }, [state.selectedCompanyIds, reduxDispatch]);

  const filteredBikes = useMemo(() => {
    let result = bikes;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.variant_name?.toLowerCase().includes(q) ||
          b.model_name?.toLowerCase().includes(q) ||
          b.company_name?.toLowerCase().includes(q)
      );
    }

    if (ccFilter.trim()) {
      const cc = Number(ccFilter);
      if (!isNaN(cc) && cc > 0) {
        result = result.filter(
          (b) => Number(b.cc || b.engine_cc || 0) === cc
        );
      }
    }

    // DataGrid requires a unique `id` field — bikes use variant_id, not _id
    return result.map((b) => ({
      ...b,
      id: b._id || b.variant_id,
      cc: Number(b.cc || b.engine_cc || 0),
    }));
  }, [bikes, search, ccFilter]);

  const handleSelectionChange = useCallback(
    (newIds) => {
      setSelectionModel(newIds);
      const selectedMap = new Map(bikes.map((b) => [b._id || b.variant_id, b]));
      const selected = newIds
        .map((id) => selectedMap.get(id))
        .filter(Boolean);
      wizardDispatch({ type: "SET_BIKES", payload: selected });
    },
    [bikes, wizardDispatch]
  );

  const handleSelectAllVisible = useCallback(() => {
    const ids = filteredBikes.map((b) => b.id);
    // Merge with already-selected (outside current filter)
    const merged = Array.from(new Set([...selectionModel, ...ids]));
    setSelectionModel(merged);
    const selectedMap = new Map(bikes.map((b) => [b._id || b.variant_id, b]));
    wizardDispatch({
      type: "SET_BIKES",
      payload: merged.map((id) => selectedMap.get(id)).filter(Boolean),
    });
  }, [filteredBikes, selectionModel, bikes, wizardDispatch]);

  const handleClearAll = useCallback(() => {
    setSelectionModel([]);
    wizardDispatch({ type: "SET_BIKES", payload: [] });
  }, [wizardDispatch]);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
        Select Bikes
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Choose the bikes this service will cover. Only bikes from your selected
        companies are shown. Use search and CC filter to narrow down.
      </Typography>

      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={2}
        flexWrap="wrap"
      >
        <TextField
          size="small"
          placeholder="Search by name, model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 2, minWidth: 180 }}
        />
        <TextField
          size="small"
          placeholder="CC filter (e.g. 125)"
          value={ccFilter}
          onChange={(e) => setCcFilter(e.target.value)}
          type="number"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FilterListIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 140, maxWidth: 180 }}
        />
        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
          <Button
            size="small"
            onClick={handleSelectAllVisible}
            disabled={filteredBikes.length === 0}
            sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            Select All ({filteredBikes.length})
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={handleClearAll}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Clear
          </Button>
          <Chip
            label={`${selectionModel.length} selected`}
            size="small"
            color={selectionModel.length > 0 ? "primary" : "default"}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Stack>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <Stack alignItems="center" spacing={1.5}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary">
              Loading bikes…
            </Typography>
          </Stack>
        </Box>
      ) : bikes.length === 0 ? (
        <Alert severity="info">
          No bikes loaded yet. Go back and select at least one company.
        </Alert>
      ) : filteredBikes.length === 0 ? (
        <Alert severity="warning">
          No bikes match your search. Try clearing the filters.
        </Alert>
      ) : (
        <Box sx={{ height: 380 }}>
          <DataGrid
            rows={filteredBikes}
            columns={CC_COLUMNS}
            checkboxSelection
            disableRowSelectionOnClick
            // MUI X v8: rowSelectionModel is { type, ids: Set } not string[]
            rowSelectionModel={{ type: "include", ids: new Set(selectionModel) }}
            onRowSelectionModelChange={(newModel) =>
              handleSelectionChange(Array.from(newModel.ids))
            }
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            density="compact"
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.50" },
              "& .MuiDataGrid-row.Mui-selected": {
                bgcolor: "primary.50",
                "&:hover": { bgcolor: "primary.100" },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Step3SelectBikes;

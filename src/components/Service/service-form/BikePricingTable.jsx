import {
  Card,
  Box,
  Typography,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";

const BikePricingTable = ({
  filteredBikes,
  processRowUpdate,
  handleProcessRowUpdateError,
  searchQuery,
  setSearchQuery,
  brandFilter,
  setBrandFilter,
  ccFilter,
  setCcFilter,
  bikes,
}) => {
  const TableToolbar = () => {
    const brands = ["All", ...new Set(bikes.map((b) => b.company_name))];
    const ccRanges = [
      "All",
      "0-100",
      "101-150",
      "151-250",
      "251-500",
      "501-1000",
    ];

    return (
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "#fcfdfe",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search bike models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: "10px", bgcolor: "white" },
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Brand</InputLabel>
              <Select
                value={brandFilter}
                label="Brand"
                onChange={(e) => setBrandFilter(e.target.value)}
                sx={{ borderRadius: "10px", bgcolor: "white" }}
              >
                {brands.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>CC Range</InputLabel>
              <Select
                value={ccFilter}
                label="CC Range"
                onChange={(e) => setCcFilter(e.target.value)}
                sx={{ borderRadius: "10px", bgcolor: "white" }}
              >
                {ccRanges.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => {
                setSearchQuery("");
                setBrandFilter("All");
                setCcFilter("All");
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const columns = [
    {
      field: "company_name",
      headerName: "Company",
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="700">
          {params.value}
        </Typography>
      ),
    },
    { field: "model_name", headerName: "Model", width: 180, flex: 1 },
    {
      field: "variant_name",
      headerName: "Variant",
      width: 180,
      color: "text.secondary",
    },
    {
      field: "cc",
      headerName: "CC",
      width: 90,
      type: "number",
      renderCell: (params) => (
        <Chip
          label={`${params.value} CC`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.7rem" }}
        />
      ),
    },
    {
      field: "effectivePrice",
      headerName: "Price (₹)",
      width: 160,
      editable: true,
      type: "number",
      headerClassName: "price-header",
      renderCell: (params) => {
        const isOverride = params.row.isManualOverride;
        const hasPrice = params.value !== null && params.value !== undefined;

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: isOverride ? "primary.main" : "text.primary",
                }}
              >
                {hasPrice ? `₹${params.value}` : "--"}
              </Typography>
              {isOverride && (
                <Tooltip title="Manual Override">
                  <EditIcon
                    sx={{
                      ml: 1,
                      fontSize: 14,
                      color: "primary.main",
                      opacity: 0.7,
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            {!isOverride && params.row.computedPrice !== null && (
              <Chip
                label="Auto"
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  bgcolor: "success.lighter",
                  color: "success.dark",
                  fontWeight: 800,
                  border: "1px solid",
                  borderColor: "success.light",
                }}
              />
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 3, pb: 0 }}>
        <Typography
          variant="h6"
          fontWeight="800"
          sx={{ color: "text.primary", letterSpacing: -0.5 }}
        >
          Bike Pricing Table
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage individual bike pricing. Manual overrides are highlighted in
          blue.
        </Typography>
      </Box>
      <CardContent sx={{ p: 0, mt: 2 }}>
        <Box
          sx={{
            height: 600,
            width: "100%",
            "& .MuiDataGrid-root": { border: "none" },
            "& .price-header": {
              fontWeight: "800 !important",
              color: "primary.main",
            },
          }}
        >
          <DataGrid
            rows={filteredBikes}
            columns={columns}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
              sorting: {
                sortModel: [{ field: "company_name", sort: "asc" }],
              },
            }}
            slots={{ toolbar: TableToolbar }}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f8fafc",
                color: "text.secondary",
                fontWeight: 700,
                borderBottom: "1px solid",
                borderColor: "divider",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid",
                borderColor: "#f1f5f9",
                "&:hover": { bgcolor: "#f8fafc" },
              },
              "& .MuiDataGrid-cell--editable": {
                bgcolor: "rgba(37, 99, 235, 0.03)",
                fontWeight: 700,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default BikePricingTable;

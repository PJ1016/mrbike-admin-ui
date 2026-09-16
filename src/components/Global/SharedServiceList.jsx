import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  TextField,
  Avatar,
  Divider,
  Paper,
  InputAdornment,
  Container,
  Breadcrumbs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
  MenuItem,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";

const API_IMAGE_BASE = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SharedServiceList = ({
  title,
  icon,
  createPath,
  editPathPrefix,
  fetchServices,
  deleteService,
  searchPlaceholder,
  emptyMessageTitle,
  emptyMessageDesc,
  itemName = "service",
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Row action menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuService, setMenuService] = useState(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [isReferencedError, setIsReferencedError] = useState(false);
  const [canDeactivateError, setCanDeactivateError] = useState(false);
  const [referencingDetails, setReferencingDetails] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const response = await fetchServices();
        if (response?.status) setData(response.data || []);
      } catch (error) {
        console.error(`Error fetching ${itemName}s:`, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, [refresh, fetchServices, itemName]);

  const handleRefresh = () => setRefresh((prev) => !prev);

  const detailPath = (service) => `${editPathPrefix}/${service._id}`;

  const handleMenuOpen = (e, service) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuService(service);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuService(null);
  };

  const handleViewClick = () => {
    if (menuService) navigate(detailPath(menuService));
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setServiceToDelete(menuService);
    setDeleteDialogOpen(true);
    setActionError(null);
    setIsReferencedError(false);
    setCanDeactivateError(false);
    setReferencingDetails([]);
    setAnchorEl(null);
  };

  const handleConfirmDelete = async (force = false, deactivate = false) => {
    if (!serviceToDelete) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const response = await deleteService(serviceToDelete._id, force, deactivate);
      if (response && response.status === true) {
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
        handleRefresh();
      }
    } catch (error) {
      const errorData = error?.response?.data;
      const msg = errorData?.message || `Could not delete ${itemName}`;
      setActionError(msg);

      if (errorData?.isReferenced) {
        setIsReferencedError(true);
        setReferencingDetails(errorData.referencingDetails || []);
      } else if (errorData?.canDeactivate) {
        setCanDeactivateError(true);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const search = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    });
  }, [data, searchTerm]);

  // Keep the viewport inside the result set when the search narrows it.
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const pagedData = useMemo(
    () => filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage]
  );

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${API_IMAGE_BASE}${path}`;
  };

  const hasMeta = (service) =>
    service.categoryId || service.basePrice || service.duration || service.pickupAvailable || service.warranty;

  const renderMetaChips = (service) => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 0.75 }}>
      {service.categoryId?.name && (
        <Chip label={service.categoryId.name} size="small" sx={{ backgroundColor: "#eff6ff", color: "#2563eb", fontWeight: 600 }} />
      )}
      {!!service.basePrice && (
        <Chip label={`₹${service.basePrice}`} size="small" sx={{ backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600 }} />
      )}
      {!!service.duration && (
        <Chip label={`${service.duration} min`} size="small" sx={{ backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600 }} />
      )}
      {service.pickupAvailable && (
        <Chip label="Pickup" size="small" sx={{ backgroundColor: "#ecfdf5", color: "#059669", fontWeight: 600 }} />
      )}
      {service.warranty && (
        <Chip label="Warranty" size="small" sx={{ backgroundColor: "#fffbeb", color: "#b45309", fontWeight: 600 }} />
      )}
    </Stack>
  );

  const serviceNameLink = (service, fontSize) => (
    <Typography
      component={Link}
      to={detailPath(service)}
      sx={{
        fontWeight: 700,
        color: "#1e293b",
        fontSize,
        textDecoration: "none",
        display: "block",
        cursor: "pointer",
        "&:hover": { color: "#2563eb", textDecoration: "underline" },
      }}
    >
      {service.name}
    </Typography>
  );

  const emptyState = (
    <Paper
      elevation={0}
      sx={{
        py: { xs: 8, md: 12 },
        px: 3,
        textAlign: "center",
        borderRadius: "20px",
        border: "1px dashed #cbd5e1",
        backgroundColor: "transparent",
      }}
    >
      <Typography variant="h6" sx={{ color: "#64748b", fontWeight: 600 }}>
        {emptyMessageTitle}
      </Typography>
      <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
        {emptyMessageDesc}
      </Typography>
    </Paper>
  );

  const loadingState = (
    <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
      <CircularProgress size={40} thickness={4} sx={{ color: "#2563eb" }} />
    </Box>
  );

  const pagination = (
    <TablePagination
      rowsPerPageOptions={[10, 25, 50]}
      component="div"
      count={filteredData.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={(e, newPage) => setPage(newPage)}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      sx={{
        borderTop: "1px solid #e2e8f0",
        "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1 },
      }}
    />
  );

  return (
    <Box
      sx={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        pb: 8,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Header Section */}
        <Box sx={{ py: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={3}
          >
            <Box>
              <Breadcrumbs
                separator={<Typography sx={{ mx: 0.5, color: "text.disabled" }}>/</Typography>}
                sx={{
                  mb: 1,
                  "& .MuiBreadcrumbs-ol": { alignItems: "center" },
                }}
              >
                <Link to="/" style={{ textDecoration: "none", color: "inherit", fontSize: "0.875rem", fontWeight: 500 }}>
                  Dashboard
                </Link>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "text.primary" }}>
                  Services
                </Typography>
              </Breadcrumbs>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: "12px",
                    backgroundColor: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                  }}
                >
                  {icon}
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.025em",
                    fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  }}
                >
                  {title}
                </Typography>
              </Stack>
            </Box>

            <Button
              component={Link}
              to={createPath}
              variant="contained"
              disableElevation
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: "#2563eb",
                "&:hover": { backgroundColor: "#1d4ed8" },
                borderRadius: "10px",
                px: 3,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                whiteSpace: "nowrap",
                alignSelf: { xs: "stretch", sm: "center" },
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              }}
            >
              Add New {itemName}
            </Button>
          </Stack>
        </Box>

        {/* Toolbar Section */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.disabled", mr: 1 }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiInputBase-input": {
                fontSize: "0.95rem",
                py: 1,
              },
            }}
          />
          <Divider
            orientation={isMobile ? "horizontal" : "vertical"}
            flexItem
            sx={{ mx: { xs: 0, sm: 1 } }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap", fontWeight: 500 }}>
            {filteredData.length} total {itemName}s
          </Typography>
        </Paper>

        {/* List Section */}
        {loading ? (
          loadingState
        ) : filteredData.length === 0 ? (
          emptyState
        ) : isMobile ? (
          /* Mobile: stacked cards carrying the same columns */
          <Box>
            <Stack spacing={1.5}>
              {pagedData.map((service) => (
                <Paper
                  key={service._id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar
                      src={getImageUrl(service.image)}
                      variant="rounded"
                      sx={{
                        width: 52,
                        height: 52,
                        flexShrink: 0,
                        borderRadius: "12px",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      {service.name?.charAt(0)}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {serviceNameLink(service, "1rem")}
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748b",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.5,
                          mt: 0.25,
                        }}
                      >
                        {service.description || "No description provided"}
                      </Typography>

                      {hasMeta(service) && <Box sx={{ mt: 1 }}>{renderMetaChips(service)}</Box>}

                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, display: "block", mt: 1 }}>
                        Created {formatDate(service.createdAt)}
                      </Typography>
                    </Box>

                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, service)} sx={{ color: "#64748b" }}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
            </Stack>
            <Paper elevation={0} sx={{ mt: 1.5, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              {pagination}
            </Paper>
          </Box>
        ) : (
          /* Desktop: table */
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", overflowX: "auto" }}
          >
            <Table sx={{ minWidth: 820 }}>
              <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                <TableRow>
                  {["#", itemName, "Details", "Created", "Actions"].map((label, idx) => (
                    <TableCell
                      key={label}
                      align={idx === 4 ? "center" : "left"}
                      sx={{
                        fontWeight: 700,
                        color: "#475569",
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {pagedData.map((service, index) => (
                  <TableRow
                    key={service._id}
                    hover
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell sx={{ color: "#94a3b8", fontWeight: 600, width: 60 }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>

                    <TableCell sx={{ minWidth: 280 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={getImageUrl(service.image)}
                          variant="rounded"
                          sx={{
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            borderRadius: "12px",
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          {service.name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          {serviceNameLink(service, "0.95rem")}
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#64748b",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              maxWidth: 380,
                            }}
                          >
                            {service.description || "No description provided"}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ minWidth: 200 }}>
                      {hasMeta(service) ? (
                        renderMetaChips(service)
                      ) : (
                        <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                          —
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
                        {formatDate(service.createdAt)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center" sx={{ width: 80 }}>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, service)} sx={{ color: "#64748b" }}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagination}
          </TableContainer>
        )}
      </Container>

      {/* Row action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { borderRadius: "12px", minWidth: 170, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
        }}
      >
        <MenuItem onClick={handleViewClick}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" sx={{ color: "#2563eb" }} />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={600}>
            View
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "#ef4444" }} />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={600} sx={{ color: "#ef4444" }}>
            Delete
          </Typography>
        </MenuItem>
      </Menu>

      {/* Industrial Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !actionLoading && setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { borderRadius: "20px", p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1e293b" }}>
          Delete {itemName}?
        </DialogTitle>
        <DialogContent>
          {actionError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
              {actionError}
            </Alert>
          )}

          {isReferencedError ? (
            <Box>
              <Typography variant="body2" sx={{ color: "#64748b", mb: 2, lineHeight: 1.6 }}>
                This {itemName} is currently used by <b>{referencingDetails.length} dealers</b>. Deleting it will remove it from their profiles.
              </Typography>
              <Box
                sx={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  p: 2,
                  border: "1px solid #e2e8f0",
                }}
              >
                {referencingDetails.map((ref, idx) => (
                  <Typography key={idx} variant="caption" display="block" sx={{ color: "#475569", mb: 0.5 }}>
                    • {ref.dealerName}
                  </Typography>
                ))}
              </Box>
            </Box>
          ) : canDeactivateError ? (
            <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.6 }}>
              This {itemName} has active bookings and cannot be permanently deleted. Would you like to <b>Deactivate</b> it instead? This will hide it from new customers while preserving history.
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.6 }}>
              Are you sure you want to delete <b>"{serviceToDelete?.name}"</b>? This action is permanent and cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5, flexWrap: "wrap" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={actionLoading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#64748b",
              borderRadius: "10px",
              px: 3,
            }}
          >
            Cancel
          </Button>

          {canDeactivateError ? (
            <Button
              onClick={() => handleConfirmDelete(false, true)}
              variant="contained"
              disableElevation
              disabled={actionLoading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#f59e0b",
                "&:hover": { backgroundColor: "#d97706" },
                borderRadius: "10px",
                px: 3,
              }}
            >
              {actionLoading ? <CircularProgress size={20} color="inherit" /> : `Deactivate ${itemName}`}
            </Button>
          ) : (
            <Button
              onClick={() => handleConfirmDelete(isReferencedError, false)}
              variant="contained"
              disableElevation
              disabled={actionLoading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#ef4444",
                "&:hover": { backgroundColor: "#dc2626" },
                borderRadius: "10px",
                px: 3,
              }}
            >
              {actionLoading ? <CircularProgress size={20} color="inherit" /> : isReferencedError ? "Force Delete" : `Delete ${itemName}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SharedServiceList;

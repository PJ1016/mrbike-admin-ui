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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";

const API_IMAGE_BASE = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refresh, setRefresh] = useState(false);

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

  const handleDeleteClick = (e, service) => {
    e.stopPropagation(); // Prevent row click navigation
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
    setActionError(null);
    setIsReferencedError(false);
    setCanDeactivateError(false);
    setReferencingDetails([]);
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

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${API_IMAGE_BASE}${path}`;
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        pb: 8,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ py: 4 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
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
            alignItems: "center",
            gap: 2,
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
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap", fontWeight: 500 }}>
            {filteredData.length} total {itemName}s
          </Typography>
        </Paper>

        {/* List Section */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress size={40} thickness={4} sx={{ color: "#2563eb" }} />
            </Box>
          ) : filteredData.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                py: 12,
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
          ) : (
            filteredData.map((service) => (
              <Paper
                key={service._id}
                onClick={() => navigate(`${editPathPrefix}/${service._id}`)}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  transition: "all 0.2s ease-in-out",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "#2563eb",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <Avatar
                    src={getImageUrl(service.image)}
                    variant="rounded"
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "12px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {service.name?.charAt(0)}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#1e293b",
                        fontSize: "1.1rem",
                        mb: 0.5,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {service.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.5,
                      }}
                    >
                      {service.description || "No description provided"}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right", px: 2 }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, display: "block", mb: 0.5 }}>
                      CREATED
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
                      {new Date(service.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Typography>
                  </Box>

                  <Tooltip title={`Delete ${itemName}`}>
                    <IconButton
                      onClick={(e) => handleDeleteClick(e, service)}
                      sx={{
                        color: "#94a3b8",
                        "&:hover": { color: "#ef4444", backgroundColor: "#fee2e2" },
                        transition: "all 0.2s",
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            ))
          )}
        </Box>
      </Container>

      {/* Industrial Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !actionLoading && setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: "20px", p: 1, maxWidth: "450px" },
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
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
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

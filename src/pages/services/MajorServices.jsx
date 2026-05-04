import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBaseServiceList, deleteBaseService } from "../../api";
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
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const API_IMAGE_BASE = "https://api.mrbikedoctor.cloud/";

const MajorServices = () => {
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
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await getBaseServiceList();
        if (response?.status) setData(response.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [refresh]);

  const handleRefresh = () => setRefresh((prev) => !prev);

  const handleDeleteClick = (service) => {
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
      const response = await deleteBaseService(
        serviceToDelete._id,
        force,
        deactivate,
      );
      if (response && response.status === true) {
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
        handleRefresh();
      }
    } catch (error) {
      const errorData = error?.response?.data;
      const msg = errorData?.message || "Could not delete major service";
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

  const getImageUrl = (path) =>
    path?.startsWith("http") ? path : `${API_IMAGE_BASE}${path}`;

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      {/* Industry Standard Header */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          pt: 4,
          pb: 4,
          mb: 4,
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                sx={{
                  mb: 1,
                  "& .MuiTypography-root": {
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "text.secondary",
                  },
                }}
              >
                <Link
                  to="/"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Dashboard
                </Link>
                <Typography color="text.primary">Services</Typography>
              </Breadcrumbs>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.025em",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Major Services
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/create-base-service"
              sx={{
                bgcolor: "#2563eb",
                color: "#fff",
                borderRadius: "10px",
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                "&:hover": {
                  bgcolor: "#1d4ed8",
                  color: "#fff",
                  boxShadow: "0 4px 6px rgba(37, 99, 235, 0.2)",
                },
              }}
            >
              Add New Service
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Search Bar - Professional Format */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            mb: 4,
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
            display: "flex",
            alignItems: "center",
          }}
        >
          <TextField
            placeholder="Search by service name or description..."
            variant="standard"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 2 }}>
                  <SearchIcon sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
              disableUnderline: true,
            }}
            sx={{
              "& input": { py: 1.5, fontSize: "0.95rem", fontWeight: 500 },
            }}
          />
        </Paper>

        {/* List Content */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          {/* Table Header Style Labeling */}
          <Box
            sx={{
              px: 4,
              py: 2,
              bgcolor: "#f1f5f9",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Stack direction="row" spacing={4} alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  width: 100,
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.05em",
                }}
              >
                IMAGE
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.05em",
                }}
              >
                SERVICE DETAILS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  width: 120,
                  textAlign: "right",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.05em",
                }}
              >
                ACTIONS
              </Typography>
            </Stack>
          </Box>

          <Stack spacing={0}>
            {filteredData.length > 0 ? (
              filteredData.map((service) => (
                <Box
                  key={service._id}
                  onClick={() => navigate(`/edit-base-service/${service._id}`)}
                  sx={{
                    px: 4,
                    py: 3,
                    borderBottom: "1px solid #f1f5f9",
                    transition: "all 0.2s ease-in-out",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "#f8fafc",
                    },
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={4}>
                    <Avatar
                      variant="rounded"
                      src={getImageUrl(service.image)}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        bgcolor: "#fff",
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#1e293b",
                          fontSize: "1.1rem",
                          fontFamily: "'Inter', sans-serif",
                          mb: 0.5,
                        }}
                      >
                        {service.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748b",
                          lineHeight: 1.6,
                          fontSize: "0.9rem",
                          fontWeight: 400,
                          maxWidth: "800px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {service.description ||
                          "No description provided for this service."}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="Delete Service">
                        <IconButton
                          onClick={() => handleDeleteClick(service)}
                          sx={{
                            color: "#94a3b8",
                            "&:hover": { color: "#ef4444", bgcolor: "#fef2f2" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              ))
            ) : (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Typography color="text.secondary" variant="body1">
                  No services found matching your search.
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Container>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog 
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        service={serviceToDelete}
        loading={actionLoading}
        error={actionError}
        isReferenced={isReferencedError}
        canDeactivate={canDeactivateError}
        details={referencingDetails}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default MajorServices;

/* --- Internal Components --- */

const DeleteDialog = ({
  open,
  onClose,
  service,
  loading,
  error,
  isReferenced,
  canDeactivate,
  details,
  onConfirm,
}) => (
  <Dialog
    open={open}
    onClose={() => !loading && onClose()}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: "16px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
      },
    }}
  >
    <DialogTitle
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        color: "#1e293b",
        fontWeight: 800,
        pt: 3,
      }}
    >
      <Box
        sx={{ p: 1, bgcolor: "#fee2e2", borderRadius: "10px", display: "flex" }}
      >
        <DeleteIcon sx={{ color: "#ef4444" }} />
      </Box>
      Delete Service
    </DialogTitle>
    <DialogContent sx={{ mt: 1 }}>
      {error && (
        <Alert
          severity={isReferenced || canDeactivate ? "warning" : "error"}
          sx={{ mb: 3, borderRadius: "10px", fontWeight: 500 }}
        >
          {error}
        </Alert>
      )}
      
      {isReferenced && details.length > 0 && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "#64748b",
              display: "block",
              mb: 1,
              letterSpacing: "0.05em",
            }}
          >
            CASCADING IMPACT:
          </Typography>
          <Box sx={{ maxHeight: 100, overflowY: "auto" }}>
            {details.map((ref, idx) => (
              <Typography
                key={idx}
                variant="caption"
                sx={{
                  display: "block",
                  color: "#1e293b",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                • {ref.dealerName} ({ref.serviceId})
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.6 }}>
        {canDeactivate
          ? "This service has active dependencies. We recommend deactivating it instead of deleting to preserve historical data."
          : isReferenced
            ? `Force deleting will remove this from ${details.length} dealers. This is ONLY possible if there are zero bookings.`
            : `Are you sure you want to delete "${service?.name}"? This will permanently remove all associated service data.`}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 3, gap: 1 }}>
      <Button
        variant="text"
        onClick={onClose}
        disabled={loading}
        sx={{ borderRadius: "10px", fontWeight: 700, color: "#64748b", px: 2 }}
      >
        Cancel
      </Button>
      
      {canDeactivate ? (
        <Button
          variant="contained"
          onClick={() => onConfirm(false, true)}
          disabled={loading}
          sx={{
            bgcolor: "#2563eb",
            borderRadius: "10px",
            fontWeight: 700,
            px: 3,
            "&:hover": { bgcolor: "#1d4ed8" },
          }}
        >
          Deactivate Instead
        </Button>
      ) : isReferenced ? (
        <Button
          variant="contained"
          color="warning"
          onClick={() => onConfirm(true)}
          disabled={loading}
          sx={{ borderRadius: "10px", fontWeight: 700, px: 3 }}
        >
          Force Delete
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={() => onConfirm(false)}
          disabled={loading}
          sx={{
            bgcolor: "#ef4444",
            borderRadius: "10px",
            fontWeight: 700,
            px: 3,
            "&:hover": { bgcolor: "#dc2626" },
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Delete Permanently"
          )}
        </Button>
      )}
    </DialogActions>
  </Dialog>
);

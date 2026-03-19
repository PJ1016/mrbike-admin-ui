import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { deleteBaseService } from "../../api";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  TablePagination,
  IconButton,
  Box,
  Typography,
  Avatar,
  Tooltip,
  Skeleton,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";

const API_IMAGE_BASE = "https://api.mrbikedoctor.cloud/";

const BaseServiceTable = ({
  datas,
  onServiceDeleted,
  loading,
  tableHeaders,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [isReferencedError, setIsReferencedError] = useState(false);
  const [referencingDetails, setReferencingDetails] = useState([]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) {
      if (path.includes("localhost:8001")) {
        return path.replace(/http:\/\/localhost:8001\//, API_IMAGE_BASE);
      }
      return path;
    }
    return `${API_IMAGE_BASE}${path}`;
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
    setActionError(null);
    setIsReferencedError(false);
    setReferencingDetails([]);
  };

  const handleConfirmDelete = async (force = false) => {
    if (!serviceToDelete) return;
    setActionLoading(true);
    setActionError(null);
    if (!force) {
      setIsReferencedError(false);
      setReferencingDetails([]);
    }
    
    try {
      const response = await deleteBaseService(serviceToDelete._id, force);
      if (response && response.status === true) {
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
        setIsReferencedError(false);
        setReferencingDetails([]);
        if (onServiceDeleted) onServiceDeleted();
      }
    } catch (error) {
      const errorData = error?.response?.data;
      const msg = errorData?.message || "Could not delete base service";
      setActionError(msg);
      
      if (errorData?.isReferenced) {
        setIsReferencedError(true);
        setReferencingDetails(errorData.referencingDetails || []);
      } else {
        setIsReferencedError(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let dataList = Array.isArray(datas) ? [...datas] : [];

    if (searchTerm.trim()) {
      dataList = dataList.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    dataList.sort((a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];

      if (orderBy === "createdAt") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    return dataList;
  }, [datas, searchTerm, order, orderBy]);

  const currentData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      {/* Search Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by service name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
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
          sx={{ width: { xs: "100%", sm: 340 } }}
        />
        <Typography variant="body2" color="text.secondary">
          {filteredData.length} service{filteredData.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Styled Table container */}
      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          borderRadius: 2,
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: "8px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: "10px" },
        }}
      >
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {tableHeaders.map((header) => {
                const isSortable = header === "Service Name" || header === "Created At";
                const property = header === "Service Name" ? "name" : "createdAt";

                return (
                  <TableCell
                    key={header}
                    align={header === "Actions" ? "center" : "left"}
                    sx={{ fontWeight: "bold", py: 1.5, whiteSpace: "nowrap", color: "white" }}
                  >
                    {isSortable ? (
                      <TableSortLabel
                        active={orderBy === property}
                        direction={orderBy === property ? order : "asc"}
                        onClick={() => handleRequestSort(property)}
                        sx={{
                          color: "white !important",
                          "& .MuiTableSortLabel-icon": { color: "white !important" },
                        }}
                      >
                        {header}
                      </TableSortLabel>
                    ) : (
                      header
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading services…
                  </Typography>
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 6 }}>
                  <Box sx={{ opacity: 0.3, mb: 1 }}>
                    <InventoryIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    No services found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((service, index) => (
                <TableRow key={service._id} hover sx={{ "&:hover": { bgcolor: "#f8faff" } }}>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                    {page * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={getImageUrl(service.image)}
                      variant="rounded"
                      sx={{
                        width: 44,
                        height: 44,
                        border: "1px solid #eee",
                        bgcolor: "#fcfcfc",
                        fontSize: "1rem",
                      }}
                    >
                      {service.name?.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                      {service.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(service.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                      <Tooltip title="Edit Service" arrow>
                        <IconButton
                          size="small"
                          sx={{ color: "primary.main", "&:hover": { bgcolor: "primary.lighter" } }}
                          onClick={() => navigate(`/edit-base-service/${service._id}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Service" arrow>
                        <IconButton
                          size="small"
                          sx={{ color: "error.main", "&:hover": { bgcolor: "error.lighter" } }}
                          onClick={() => handleDeleteClick(service)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { if (!actionLoading) setDeleteDialogOpen(false); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main", pb: 1 }}>
          <DeleteIcon /> Delete Base Service?
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {actionError && (
            <Alert severity={isReferencedError ? "warning" : "error"} sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}
          
          {isReferencedError && referencingDetails.length > 0 && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: "#fff8f0", borderRadius: 1, border: "1px solid #ffe7cc" }}>
              <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 1, color: "#995a00" }}>
                REFERENCED BY:
              </Typography>
              <Box sx={{ maxHeight: 120, overflowY: "auto" }}>
                {referencingDetails.map((ref, idx) => (
                  <Typography key={idx} variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    • {ref.dealerName} ({ref.serviceId})
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary">
            {isReferencedError 
              ? `Note: Force deleting will also remove this service from the ${referencingDetails.length} dealers listed above. This is only possible if there are NO bookings.`
              : `Are you sure you want to permanently delete the service "${serviceToDelete?.name}"? This action cannot be undone.`
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={actionLoading}
            sx={{ fontWeight: "bold" } }
          >
            Cancel
          </Button>
          
          {isReferencedError ? (
            <Button
              variant="contained"
              size="small"
              color="warning"
              onClick={() => handleConfirmDelete(true)}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ fontWeight: "bold" }}
            >
              Force Cascading Delete
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={() => handleConfirmDelete(false)}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ fontWeight: "bold" }}
            >
              Yes, Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaseServiceTable;

import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { deleteBaseAdditionalService } from "../../api/additionalServiceApi";
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  TableSortLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const API_IMAGE_BASE = "https://api.mrbikedoctor.cloud/";

const BaseAdditionalServiceTable = ({
  tableHeaders,
  datas,
  onServiceDeleted,
  loading,
}) => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${API_IMAGE_BASE}${path}`;
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleMenuOpen = (event, service) => {
    setAnchorEl(event.currentTarget);
    setSelectedService(service);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedService) {
      navigate(`/edit-base-additional-service/${selectedService._id}`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setActionError(null);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await deleteBaseAdditionalService(selectedService._id);

      if (response && response.status === true) {
        setDeleteDialogOpen(false);
        if (onServiceDeleted) onServiceDeleted();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Could not delete service";
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Search & Filter
  const filteredData = useMemo(() => {
    let dataList = Array.isArray(datas) ? [...datas] : [];

    if (searchTerm.trim()) {
      dataList = dataList.filter((item) => {
        const search = searchTerm.toLowerCase();
        return item.name?.toLowerCase().includes(search) ?? false;
      });
    }

    dataList.sort((a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];

      if (orderBy === "createdAt" || orderBy === "updatedAt") {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

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
        <Table id="base-additional-service-mui-table" ref={tableRef} size="small" sx={{ minWidth: 800 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {tableHeaders.map((header) => {
                const isSortable = header === "Service Name" || header === "Created At";
                let property = "";
                if (header === "Service Name") property = "name";
                else if (header === "Created At") property = "createdAt";

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
                    Loading base additional services…
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
                    No base additional services found
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
                      sx={{ width: 44, height: 44, border: "1px solid #eee", bgcolor: "#fcfcfc" }}
                    >
                      {service.name?.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                      {service.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(service.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, service)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
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

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ elevation: 3, sx: { minWidth: 150, borderRadius: 2 } }}
      >
        <MenuItem onClick={handleEdit} sx={{ fontSize: "0.875rem" }}>
          <ListItemIcon><EditIcon fontSize="small" color="info" /></ListItemIcon> Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ fontSize: "0.875rem", color: "error.main" }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { if (!actionLoading) setDeleteDialogOpen(false); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main", pb: 1 }}>
          <DeleteIcon /> Delete Service?
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete <b>"{selectedService?.name}"</b>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" size="small" color="inherit" onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading} sx={{ fontWeight: "bold" }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" color="error" onClick={handleConfirmDelete} disabled={actionLoading} startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null} sx={{ fontWeight: "bold" }}>
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaseAdditionalServiceTable;

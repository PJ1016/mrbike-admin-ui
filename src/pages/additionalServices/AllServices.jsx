import React, { useState, useMemo, useRef } from "react";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  Chip,
  TableSortLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const API_IMAGE_BASE = "https://api.mrbikedoctor.cloud/";

const AllServices = ({
  triggerDownloadExcel,
  triggerDownloadPDF,
  tableHeaders,
  datas,
  text,
  onServiceDeleted,
  loading,
  error,
}) => {
  const tableRef = useRef(null);
  const navigate = useNavigate();

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

  const getServiceName = (data) => data?.base_additional_service_id?.name || "N/A";
  const getServiceImage = (data) => data?.base_additional_service_id?.image || null;

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

  const handleView = () => {
    if (selectedService) {
      navigate(`/additional-services/view/${selectedService._id}`, {
        state: { serviceData: selectedService },
      });
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedService) {
      navigate(`/additional-services/edit/${selectedService._id}`, {
        state: { serviceData: selectedService },
      });
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
      const response = await axios.delete(
        `https://api.mrbikedoctor.cloud/bikedoctor/service/deleteAdditionalService/${selectedService._id}`
      );

      if (response.data.status === 200 || response.status === 200) {
        setDeleteDialogOpen(false);
        if (onServiceDeleted) onServiceDeleted();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not delete additional service";
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Export Integrations
  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Additional_Service_List",
    sheet: "Additional Services",
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Additional Service List", 14, 10);
    const table = tableRef.current;
    if (!table) return;
    doc.autoTable({ html: "#additional-service-mui-table", startY: 20, theme: "striped" });
    doc.save(`${text}.pdf`);
  };

  if (triggerDownloadExcel) triggerDownloadExcel.current = onDownload;
  if (triggerDownloadPDF) triggerDownloadPDF.current = exportToPDF;

  // Search & Filter
  const filteredData = useMemo(() => {
    let dataList = Array.isArray(datas) ? [...datas] : [];

    if (searchTerm.trim()) {
      dataList = dataList.filter((item) => {
        const search = searchTerm.toLowerCase();
        return getServiceName(item).toLowerCase().includes(search);
      });
    }

    dataList.sort((a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];

      if (orderBy === "name") {
        valA = getServiceName(a);
        valB = getServiceName(b);
      } else if (orderBy === "createdAt" || orderBy === "updatedAt") {
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
        <Table id="additional-service-mui-table" ref={tableRef} size="small" sx={{ minWidth: 1000 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {tableHeaders.map((header) => {
                const isSortable = header === "Service Name" || header === "Created At" || header === "Updated At";
                let property = "";
                if (header === "Service Name") property = "name";
                else if (header === "Created At") property = "createdAt";
                else if (header === "Updated At") property = "updatedAt";

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
                    Loading additional services…
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="error">{error}</Typography>
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableHeaders.length} align="center" sx={{ py: 6 }}>
                  <Box sx={{ opacity: 0.3, mb: 1 }}>
                    <InventoryIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    No additional services found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((service, index) => (
                <TableRow key={service._id} hover sx={{ "&:hover": { bgcolor: "#f8faff" } }}>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                    {page * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", color: "#2e83ff", fontWeight: "bold" }}>
                    {service.serviceId || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                      {getServiceName(service)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={getImageUrl(getServiceImage(service))}
                      variant="rounded"
                      sx={{ width: 40, height: 40, border: "1px solid #eee", bgcolor: "#fcfcfc" }}
                    >
                      {getServiceName(service)?.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <Typography variant="body2" color="text.secondary">
                      {service.description || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {service.dealer_id ? (
                      <Chip
                        size="small"
                        label={typeof service.dealer_id === "object" ? service.dealer_id.shopName || "N/A" : "N/A"}
                        color="success"
                        sx={{ fontSize: "0.7rem", height: 24 }}
                      />
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    {service.bikes && service.bikes.length > 0 ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {service.bikes.slice(0, 2).map((bike, idx) => (
                          <Typography key={idx} variant="caption" sx={{ bgcolor: "#f1f5f9", p: 0.5, borderRadius: 1, border: "1px solid #e2e8f0", display: "inline-block" }}>
                            <b>{bike.cc} CC</b> — <span style={{ color: "#16a34a", fontWeight: "bold" }}>₹{bike.price}</span>
                          </Typography>
                        ))}
                        {service.bikes.length > 2 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", ml: 0.5 }}>
                            +{service.bikes.length - 2} more...
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(service.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(service.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
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
        <MenuItem onClick={handleView} sx={{ fontSize: "0.875rem" }}>
          <ListItemIcon><VisibilityIcon fontSize="small" color="primary" /></ListItemIcon> View Profile
        </MenuItem>
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
            Are you sure you want to permanently delete <b>"{getServiceName(selectedService)}"</b>? This action cannot be undone.
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

export default AllServices;

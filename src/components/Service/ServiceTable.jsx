import { useState, useMemo, useRef } from "react";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { deleteAdminService } from "../../api";
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
  Chip,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";

const API_IMAGE_BASE = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";

const ServiceTable = ({
  triggerDownloadExcel,
  triggerDownloadPDF,
  tableHeaders,
  datas,
  text,
  onServiceDeleted,
  loading,
  error,
}) => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    _id: "",
    base_service_id: {},
    companies: [],
    dealer_id: {},
    bikes: [],
  });

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // Dialog State
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

  const handleView = () => {
    if (selectedService) {
      setEditFormData({
        _id: selectedService._id,
        base_service_id: selectedService.base_service_id || {},
        companies: selectedService.companies || [],
        dealer_id: selectedService.dealer_id || {},
        bikes: selectedService.bikes || [],
      });
      setShowEditModal(true);
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
      const response = await deleteAdminService(selectedService._id);
      if (response && response.status === true) {
        setDeleteDialogOpen(false);
        if (onServiceDeleted) onServiceDeleted();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not delete service";
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Export integrations
  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Service_List",
    sheet: "Services",
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Service List", 14, 10);
    const table = tableRef.current;
    if (!table) return;
    doc.autoTable({ html: "#service-mui-table", startY: 20, theme: "striped" });
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
        const serviceNameMatch = item.base_service_id?.name?.toLowerCase().includes(search) ?? false;
        const companiesMatch = item.companies?.some((company) => company.name?.toLowerCase().includes(search)) ?? false;
        return serviceNameMatch || companiesMatch;
      });
    }

    dataList.sort((a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];

      if (orderBy === "name") {
        valA = a.base_service_id?.name || "";
        valB = b.base_service_id?.name || "";
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
          placeholder="Search service name or company..."
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
        <Table id="service-mui-table" ref={tableRef} size="small" sx={{ minWidth: 1000 }}>
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
                    align={header === "Action" ? "center" : "left"}
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
                  <TableCell sx={{ fontFamily: "monospace", color: "#2e83ff", fontWeight: "bold" }}>
                    {service.serviceId || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={getImageUrl(service.base_service_id?.image)}
                      variant="rounded"
                      sx={{ width: 40, height: 40, border: "1px solid #eee", bgcolor: "#fcfcfc" }}
                    >
                      {service.base_service_id?.name?.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                      {service.base_service_id?.name || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: "200px" }}>
                    {service.companies && service.companies.length > 0 ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {service.companies.map((company, idx) => (
                          <Chip key={idx} size="small" label={company.name} sx={{ fontSize: "0.7rem", bgcolor: "#e0f2fe", color: "#0284c7" }} />
                        ))}
                      </Box>
                    ) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {service.dealer_id ? (
                      <Chip size="small" label={typeof service.dealer_id === "object" ? service.dealer_id.shopName || "N/A" : "N/A"} color="success" sx={{ fontSize: "0.7rem", height: 24 }} />
                    ) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {service.dealer_id ? (
                      <Chip size="small" label={typeof service.dealer_id === "object" ? service.dealer_id.dealerId || "N/A" : "N/A"} color="default" sx={{ fontSize: "0.7rem", height: 24 }} />
                    ) : "N/A"}
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
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/edit-services/${selectedService?._id}`); }} sx={{ fontSize: "0.875rem" }}>
          <ListItemIcon><EditIcon fontSize="small" color="info" /></ListItemIcon> Edit Pricing
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
            Are you sure you want to permanently delete <b>"{selectedService?.base_service_id?.name}"</b>? This action cannot be undone.
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

      {/* View Details Dialog */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
          <SettingsIcon sx={{ color: "primary.main" }} /> 
          <Typography variant="h6" fontWeight="bold">Service Details</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">SERVICE NAME</Typography>
              <Typography variant="body1" sx={{ mt: 0.5, p: 1.5, bgcolor: "#f8f9fa", borderRadius: 1 }}>
                {editFormData.base_service_id?.name || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">COMPANIES</Typography>
              <Box sx={{ mt: 0.5, p: 1.5, bgcolor: "#f8f9fa", borderRadius: 1, minHeight: "48px" }}>
                {editFormData.companies && editFormData.companies.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {editFormData.companies.map((company, idx) => (
                      <Chip key={idx} size="small" label={company.name} sx={{ bgcolor: "#e0f2fe", color: "#0284c7", fontWeight: "bold" }} />
                    ))}
                  </Box>
                ) : <Typography variant="body2" color="text.secondary">No companies</Typography>}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">DEALER NAME</Typography>
              <Typography variant="body1" sx={{ mt: 0.5, p: 1.5, bgcolor: "#f8f9fa", borderRadius: 1 }}>
                {editFormData.dealer_id && typeof editFormData.dealer_id === "object" ? editFormData.dealer_id.shopName || "N/A" : "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">DEALER ID</Typography>
              <Typography variant="body1" sx={{ mt: 0.5, p: 1.5, bgcolor: "#f8f9fa", borderRadius: 1, fontFamily: "monospace", color: "#2e83ff", fontWeight: "bold" }}>
                {editFormData.dealer_id && typeof editFormData.dealer_id === "object" ? editFormData.dealer_id.dealerId || "N/A" : "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">BIKES & PRICING</Typography>
              <Box sx={{ mt: 1, border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
                {editFormData.bikes && editFormData.bikes.length > 0 ? (
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>CC</TableCell>
                        <TableCell sx={{ fontWeight: "bold", color: "text.secondary", align: "right" }}>PRICE (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editFormData.bikes.sort((a, b) => a.cc - b.cc).map((bike, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{bike.cc} CC</TableCell>
                          <TableCell sx={{ fontWeight: "bold", color: "success.main" }}>₹{bike.price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">No bikes or pricing found</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button variant="outlined" onClick={() => setShowEditModal(false)} sx={{ fontWeight: "bold" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ServiceTable;

import React, { useEffect, useState, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { deleteDealer } from "../../api";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Avatar,
  TablePagination,
  TextField,
  InputAdornment,
  TableSortLabel,
  Stack,
  Switch,
  Tooltip,
  Menu,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  AccountBalance as BankIcon,
  Description as DocIcon,
  Verified as VerifiedIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

const UserTable = ({
  triggerDownloadExcel,
  triggerDownloadPDF,
  datas = [],
  text,
  onDealerDeleted,
  loading: parentLoading,
}) => {
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuDealer, setMenuDealer] = useState(null);

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: `${text}_List`,
    sheet: text,
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`${text} List`, 14, 10);
    doc.autoTable({ html: "#dealer-table-mui", startY: 20, theme: "striped" });
    doc.save(`${text}_List.pdf`);
  };

  useEffect(() => {
    if (triggerDownloadExcel) triggerDownloadExcel.current = onDownload;
    if (triggerDownloadPDF) triggerDownloadPDF.current = exportToPDF;
  }, [onDownload]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredData = useMemo(() => {
    let result = datas;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.shopName?.toLowerCase().includes(term) ||
          item.ownerName?.toLowerCase().includes(term) ||
          item.dealerId?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.phone?.toLowerCase().includes(term) ||
          item.city?.toLowerCase().includes(term)
      );
    }

    return [...result].sort((a, b) => {
      let valueA, valueB;
      if (orderBy === "createdAt" || orderBy === "updatedAt") {
        valueA = new Date(a[orderBy] || 0).getTime();
        valueB = new Date(b[orderBy] || 0).getTime();
      } else {
        valueA = String(a[orderBy] || "").toLowerCase();
        valueB = String(b[orderBy] || "").toLowerCase();
      }

      if (order === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
      }
    });
  }, [datas, searchTerm, order, orderBy]);

  const currentData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, dealer) => {
    setAnchorEl(event.currentTarget);
    setMenuDealer(dealer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuDealer(null);
  };

  const handleDelete = async (dealerId) => {
    handleMenuClose();
    Swal.fire({
      title: "Delete Dealer?",
      text: "This action will remove the dealer permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await deleteDealer(dealerId);
          if (response.status === 200) {
            onDealerDeleted();
            Swal.fire("Deleted!", "Dealer removed successfully.", "success");
          }
        } catch (error) {
          Swal.fire("Error", "Failed to delete dealer.", "error");
        }
      }
    });
  };

  const handleToggleStatus = async (dealerId, newStatus) => {
    try {
      const response = await fetch(`https://api.mrbikedoctor.cloud/bikedoctor/dealer/${dealerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (response.ok) {
        onDealerDeleted();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "approved") return { color: "#38a169", bgColor: "#f0fff4", icon: <VerifiedIcon fontSize="inherit" /> };
    if (s === "pending") return { color: "#d69e2e", bgColor: "#fffaf0", icon: <PendingIcon fontSize="inherit" /> };
    if (s === "rejected") return { color: "#e53e3e", bgColor: "#fff5f5", icon: <CancelIcon fontSize="inherit" /> };
    return { color: "#4a5568", bgColor: "#f7fafc", icon: <DocIcon fontSize="inherit" /> };
  };

  const headers = [
    { id: "id", label: "#", sortable: false },
    { id: "shopName", label: "Shop Details", sortable: true },
    { id: "ownerName", label: "Owner Name", sortable: true },
    { id: "contact", label: "Contact Info", sortable: false },
    { id: "location", label: "Location", sortable: true },
    { id: "status", label: "Reg. Status", sortable: true },
    { id: "active", label: "Active", sortable: false },
    { id: "actions", label: "Actions", sortable: false },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {/* Search Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by Shop, Owner, ID, City..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: "100%", sm: 400 }, backgroundColor: "white" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #edf2f7",
        }}
      >
        <Table id="dealer-table-mui" ref={tableRef} sx={{ minWidth: 1200 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{ color: "white", fontWeight: "bold", py: 2.5 }}
                >
                  {header.sortable ? (
                    <TableSortLabel
                      active={orderBy === header.id}
                      direction={orderBy === header.id ? order : "asc"}
                      onClick={() => handleRequestSort(header.id)}
                      sx={{
                        color: "white !important",
                        "&.MuiTableSortLabel-active": { color: "white !important" },
                        "& .MuiTableSortLabel-icon": { color: "white !important" },
                      }}
                    >
                      {header.label}
                    </TableSortLabel>
                  ) : (
                    header.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {parentLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">Modernizing dealer view...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                    No dealers found matching your criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((dealer, index) => {
                const regStatus = getStatusConfig(dealer.registrationStatus);
                return (
                  <TableRow key={dealer._id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar sx={{ bgcolor: "#eef5ff", color: "#2e83ff", mr: 2, fontWeight: 700 }}>
                          {dealer.shopName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Button 
                            variant="text" 
                            size="small" 
                            onClick={() => setSelectedDealer(dealer)}
                            sx={{ 
                              p: 0, 
                              textTransform: "none", 
                              fontWeight: 700, 
                              color: "#2d3748",
                              minWidth: "unset",
                              justifyContent: "flex-start",
                              "&:hover": { color: "#2e83ff", backgroundColor: "transparent" }
                            }}
                          >
                            {dealer.shopName}
                          </Button>
                          <Typography 
                            variant="caption" 
                            display="block" 
                            color="primary" 
                            sx={{ fontWeight: 600, mt: 0.5, cursor: "pointer" }}
                            onClick={() => setSelectedDealer(dealer)}
                          >
                            {dealer.dealerId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, color: "#4a5568" }}>
                      {dealer.ownerName || "N/A"}
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <EmailIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                          <Typography variant="caption">{dealer.email}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                          <Typography variant="caption">{dealer.phone}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{dealer.city || "N/A"}</Typography>
                        <Typography variant="caption" color="text.secondary">{dealer.state || "N/A"}</Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={regStatus.icon}
                        label={dealer.registrationStatus || "Unknown"}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: regStatus.color,
                          backgroundColor: regStatus.bgColor,
                          border: `1px solid ${regStatus.color}33`,
                          borderRadius: 1,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Tooltip title={dealer.isActive ? "Deactivate" : "Activate"}>
                          <Switch
                            size="small"
                            checked={dealer.isActive}
                            onChange={() => handleToggleStatus(dealer._id, !dealer.isActive)}
                            color="success"
                          />
                        </Tooltip>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            ml: 0.5, 
                            fontWeight: 700, 
                            color: dealer.isActive ? "#38a169" : "#718096" 
                          }}
                        >
                          {dealer.isActive ? "ON" : "OFF"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, dealer)}>
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: "1px solid #edf2f7" }}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { handleMenuClose(); setSelectedDealer(menuDealer); }}>
          <VisibilityIcon sx={{ mr: 1.5, color: "info.main", fontSize: 18 }} /> View Profile
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/updateDealer/${menuDealer._id}`); }}>
          <EditIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 18 }} /> Edit Dealer
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => handleDelete(menuDealer?._id)}>
          <DeleteIcon sx={{ mr: 1.5, color: "error.main", fontSize: 18 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Dealer Business Profile Dialog */}
      <Dialog 
        open={Boolean(selectedDealer)} 
        onClose={() => setSelectedDealer(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ bgcolor: "#2e83ff", color: "white", py: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {selectedDealer?.shopName || "Business Profile"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Dealer ID: {selectedDealer?.dealerId} • Since {selectedDealer?.createdAt ? new Date(selectedDealer.createdAt).getFullYear() : "N/A"}
              </Typography>
            </Box>
            <Chip 
              label={selectedDealer?.registrationStatus} 
              size="small" 
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700, borderRadius: 1 }} 
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {selectedDealer && (
            <Grid container spacing={4}>
              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" sx={{ color: "#2e83ff", fontWeight: 700 }}>Basic Information</Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {[
                    { label: "Owner Name", value: selectedDealer.ownerName, icon: <PersonIcon sx={{ fontSize: 18 }} /> },
                    { label: "Phone", value: selectedDealer.phone, icon: <PhoneIcon sx={{ fontSize: 18 }} /> },
                    { label: "Email", value: selectedDealer.email, icon: <EmailIcon sx={{ fontSize: 18 }} /> },
                    { label: "Shop Contact", value: selectedDealer.shopContact, icon: <PhoneIcon sx={{ fontSize: 18 }} /> },
                  ].map((row, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ color: "text.secondary" }}>{row.icon}</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.value || "N/A"}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Grid>

              {/* Bank Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" sx={{ color: "#2e83ff", fontWeight: 700 }}>Bank Details</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: "#f8fafc" }}>
                  <Stack spacing={1.5}>
                    {[
                      { label: "Bank Name", value: selectedDealer.bankDetails?.bankName },
                      { label: "Account Holder", value: selectedDealer.bankDetails?.accountHolderName },
                      { label: "Account No.", value: selectedDealer.bankDetails?.accountNumber },
                      { label: "IFSC Code", value: selectedDealer.bankDetails?.ifscCode },
                    ].map((row, i) => (
                      <Box key={i} sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.value || "N/A"}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              {/* Location */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" sx={{ color: "#2e83ff", fontWeight: 700 }}>Shop Location</Typography>
                <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
                  <LocationIcon color="primary" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedDealer.fullAddress || "Address not provided"}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedDealer.city}, {selectedDealer.state} - {selectedDealer.shopPincode}</Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Document Status */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" sx={{ color: "#2e83ff", fontWeight: 700 }}>Document Verification</Typography>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {[
                    { label: "Aadhar", ok: selectedDealer.documentVerification?.aadhar },
                    { label: "PAN", ok: selectedDealer.documentVerification?.pan },
                    { label: "Shop Cert", ok: selectedDealer.documentVerification?.shop },
                    { label: "Bank", ok: selectedDealer.documentVerification?.bank },
                  ].map((doc, i) => (
                    <Grid item key={i}>
                      <Chip 
                        label={doc.label} 
                        size="small" 
                        color={doc.ok ? "success" : "default"}
                        variant={doc.ok ? "filled" : "outlined"}
                        icon={doc.ok ? <VerifiedIcon /> : <CancelIcon />}
                        sx={{ fontWeight: 600, fontSize: "0.65rem" }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f8fafc" }}>
          <Button 
            onClick={() => {
              const id = selectedDealer?._id;
              setSelectedDealer(null);
              navigate(`/updateDealer/${id}`);
            }} 
            variant="text" 
            startIcon={<EditIcon />}
          >
            Edit Profile
          </Button>
          <Button onClick={() => setSelectedDealer(null)} variant="contained" sx={{ px: 4, borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserTable;
import React, { useMemo, useState } from "react";
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
  Chip,
  IconButton,
  TablePagination,
  TextField,
  InputAdornment,
  TableSortLabel,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  DeleteOutline as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AccountCircle as AccountCircleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  EmojiEvents as RewardIcon,
  DirectionsBike as BikeIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { deleteCustomer } from "../../api";

const API_IMAGE_BASE = "https://api.mrbikedoctor.cloud/";

const CustomerTable = ({ datas, loading, onRefresh }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredData = useMemo(() => {
    let result = datas || [];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.first_name?.toLowerCase().includes(term) ||
          item.last_name?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.phone?.toString().includes(term) ||
          item.customerId?.toLowerCase().includes(term)
      );
    }
    return [...result].sort((a, b) => {
      let valueA = a[orderBy] || "";
      let valueB = b[orderBy] || "";
      if (orderBy === "createdAt") {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }
      return order === "asc"
        ? valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        : valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
    });
  }, [datas, searchTerm, order, orderBy]);

  const currentData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const getAvatarUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_IMAGE_BASE}${imagePath}`;
  };

  const getInitials = (customer) => {
    const f = customer?.first_name?.[0] || "";
    const l = customer?.last_name?.[0] || "";
    return (f + l).toUpperCase() || "C";
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleActionClick = (event, customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleActionClose = () => setAnchorEl(null);

  const handleOpenProfile = () => {
    setProfileDialogOpen(true);
    setActionError(null);
    setConfirmDelete(false);
    handleActionClose();
  };

  const handleCloseDialog = () => {
    setProfileDialogOpen(false);
    setConfirmDelete(false);
    setActionError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteCustomer(selectedCustomer._id);
      setProfileDialogOpen(false);
      setConfirmDelete(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to delete customer.";
      setActionError(msg);
      setConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
  };

  const headers = [
    { id: "id", label: "#", sortable: false },
    { id: "first_name", label: "Customer (ID)", sortable: true },
    { id: "email", label: "Email", sortable: true },
    { id: "phone", label: "Phone", sortable: false },
    { id: "address", label: "Location", sortable: false },
    { id: "isProfile", label: "Profile", sortable: false },
    { id: "reward_points", label: "Rewards", sortable: true },
    { id: "createdAt", label: "Joined", sortable: true },
    { id: "actions", label: "Action", sortable: false },
  ];

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      {/* Search bar */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by name, email, phone or ID…"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 340 }}
        />
        <Typography variant="body2" color="text.secondary">
          {filteredData.length} customer{filteredData.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

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
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {headers.map((h) => (
                <TableCell key={h.id} sx={{ fontWeight: "bold", py: 1.5, whiteSpace: "nowrap", color: "white" }}>
                  {h.sortable ? (
                    <TableSortLabel
                      active={orderBy === h.id}
                      direction={orderBy === h.id ? order : "asc"}
                      onClick={() => handleRequestSort(h.id)}
                      sx={{
                        color: "white !important",
                        "& .MuiTableSortLabel-icon": { color: "white !important" },
                      }}
                    >
                      {h.label}
                    </TableSortLabel>
                  ) : h.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={headers.length} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading customers…
                  </Typography>
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} align="center" sx={{ py: 6 }}>
                  <PersonIcon sx={{ fontSize: 40, color: "#ccc", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No customers found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((customer, index) => (
                <TableRow key={customer._id} hover sx={{ "&:hover": { bgcolor: "#f8faff" } }}>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                    {page * rowsPerPage + index + 1}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={getAvatarUrl(customer.image)}
                        sx={{ width: 34, height: 34, bgcolor: "#2e83ff", fontSize: "0.8rem" }}
                      >
                        {getInitials(customer)}
                      </Avatar>
                      <Box>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setProfileDialogOpen(true);
                            setActionError(null);
                            setConfirmDelete(false);
                          }}
                          sx={{ textTransform: "none", fontWeight: "bold", p: 0, justifyContent: "flex-start", lineHeight: 1.2 }}
                        >
                          {customer.first_name} {customer.last_name}
                        </Button>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {customer.customerId || "ID: N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{customer.email || "N/A"}</Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption">{customer.phone || "N/A"}</Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[customer.address, customer.city, customer.state].filter(Boolean).join(", ") || "N/A"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={customer.isProfile ? "Complete" : "Incomplete"}
                      color={customer.isProfile ? "success" : "default"}
                      size="small"
                      variant={customer.isProfile ? "filled" : "outlined"}
                      icon={customer.isProfile ? <CheckCircleIcon fontSize="small" /> : undefined}
                      sx={{ fontWeight: "bold", fontSize: "0.65rem" }}
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <RewardIcon sx={{ fontSize: 14, color: "#f5a623" }} />
                      <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                        {customer.reward_points ?? 0}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{formatDate(customer.createdAt)}</Typography>
                  </TableCell>

                  <TableCell>
                    <IconButton size="small" onClick={(e) => handleActionClick(e, customer)}>
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
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Action dropdown menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleActionClose}>
        <MenuItem onClick={handleOpenProfile}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
          View Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleActionClose();
            setProfileDialogOpen(true);
            setConfirmDelete(true);
            setActionError(null);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Customer
        </MenuItem>
      </Menu>

      {/* Customer Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => { if (!actionLoading) handleCloseDialog(); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8faff", pb: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={getAvatarUrl(selectedCustomer?.image)}
              sx={{ width: 52, height: 52, bgcolor: "#2e83ff", fontSize: "1.1rem" }}
            >
              {getInitials(selectedCustomer)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
                {selectedCustomer?.first_name} {selectedCustomer?.last_name}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#2e83ff", fontWeight: "bold" }}>
                {selectedCustomer?.customerId}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={selectedCustomer?.isProfile ? "Profile Complete" : "Incomplete"}
              color={selectedCustomer?.isProfile ? "success" : "default"}
              size="small"
            />
            <IconButton size="small" onClick={handleCloseDialog} disabled={actionLoading}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        {actionError && (
          <Alert severity="error" onClose={() => setActionError(null)} sx={{ mx: 3, mt: 2, borderRadius: 2 }}>
            {actionError}
          </Alert>
        )}

        <DialogContent dividers sx={{ p: 3 }}>
          {selectedCustomer && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

              {/* Contact Info */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <PhoneIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "primary.main" }}>CONTACT DETAILS</Typography>
                </Box>
                {[
                  { icon: <EmailIcon sx={{ fontSize: 14, color: "text.secondary" }} />, label: "Email", value: selectedCustomer.email },
                  { icon: <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />, label: "Phone", value: selectedCustomer.phone?.toString() },
                  { icon: <LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />, label: "Address", value: selectedCustomer.address },
                  { icon: <LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />, label: "City / State", value: [selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(", ") || null },
                  { icon: <LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />, label: "Pincode", value: selectedCustomer.pincode },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: "flex", alignItems: "flex-start", mb: 0.75, gap: 0.75 }}>
                    {item.icon}
                    <Typography variant="caption" sx={{ fontWeight: "bold", minWidth: 90, color: "text.secondary" }}>{item.label}:</Typography>
                    <Typography variant="caption">{item.value || "N/A"}</Typography>
                  </Box>
                ))}
              </Box>

              <Divider />

              {/* Account Info */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <AccountCircleIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "primary.main" }}>ACCOUNT INFO</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <RewardIcon sx={{ fontSize: 18, color: "#f5a623" }} />
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>{selectedCustomer.reward_points ?? 0}</Typography>
                    <Typography variant="caption" color="text.secondary">reward pts</Typography>
                  </Box>
                </Box>
                {[
                  { label: "Customer ID", value: selectedCustomer.customerId },
                  { label: "Profile Complete", value: selectedCustomer.isProfile ? "Yes" : "No" },
                  { label: "Joined", value: formatDate(selectedCustomer.createdAt) },
                  { label: "Last Updated", value: formatDate(selectedCustomer.updatedAt) },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: "flex", mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: "bold", minWidth: 110, color: "text.secondary" }}>{item.label}:</Typography>
                    <Typography variant="caption">{item.value || "N/A"}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Bikes */}
              {selectedCustomer.userBike && selectedCustomer.userBike.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <BikeIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "primary.main" }}>
                        REGISTERED BIKES ({selectedCustomer.userBike.length})
                      </Typography>
                    </Box>
                    {selectedCustomer.userBike.map((bike, i) => (
                      <Paper key={i} elevation={0} sx={{ p: 1.5, mb: 1, border: "1px solid #e8edf3", borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                          {bike.brand} {bike.model} — {bike.registrationNumber || "No Reg."}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 0, flexDirection: "column", alignItems: "stretch", bgcolor: "#f8faff" }}>
          {confirmDelete && (
            <Box
              sx={{
                px: 3, py: 2,
                bgcolor: "#fdecea",
                borderTop: "1px solid #ef9a9a",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, color: "#c62828" }}>
                Permanently delete "{selectedCustomer?.first_name} {selectedCustomer?.last_name}"? This cannot be undone.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                <Button size="small" variant="outlined" color="inherit" onClick={() => setConfirmDelete(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button
                  size="small" variant="contained" color="error"
                  onClick={handleConfirmDelete} disabled={actionLoading}
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  Yes, Delete
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", p: 2, gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" color="inherit" onClick={handleCloseDialog} disabled={actionLoading}>
              Close
            </Button>
            <Button
              variant="contained" color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
              disabled={actionLoading || confirmDelete}
            >
              Delete Customer
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerTable;

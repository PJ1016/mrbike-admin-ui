import React, { useEffect, useState, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getAllBookings, updateDealerStatus, deleteDealer } from "../../api";
import { notifyDealerStatusChanged } from "../../redux/dealerNotify";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  TablePagination,
  TextField,
  InputAdornment,
  TableSortLabel,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  Analytics as AnalyticsIcon,
  Block as BlockIcon,
  LockOpen as LockOpenIcon,
  PowerSettingsNew as PowerIcon,
  TwoWheeler as TwoWheelerIcon,
  LocalShipping as DropIcon,
  CalendarToday as CalendarIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";

const FILTER_TABS = [
  { id: "all",      label: "All" },
  { id: "pending",  label: "Pending Approval" },
  { id: "approved", label: "Approved" },
  { id: "active",   label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "blocked",  label: "Blocked" },
];

const TABLE_HEADERS = [
  { id: "id",        label: "#",           sortable: false },
  { id: "shopName",  label: "Shop Details", sortable: true },
  { id: "ownerName", label: "Owner",        sortable: true },
  { id: "contact",   label: "Contact Info", sortable: false },
  { id: "location",  label: "Location",     sortable: true },
  { id: "services",  label: "Services",     sortable: false },
  { id: "status",    label: "Status",       sortable: false },
  { id: "cancelRate",label: "Perf.",        sortable: true },
  { id: "createdAt", label: "Created",      sortable: true },
  { id: "actions",   label: "Actions",      sortable: false },
];

const getRegStatusConfig = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "approved") return { color: "#38a169", bgColor: "#f0fff4", icon: <VerifiedIcon fontSize="inherit" />, label: "Approved" };
  if (s === "rejected") return { color: "#e53e3e", bgColor: "#fff5f5", icon: <CancelIcon fontSize="inherit" />, label: "Rejected" };
  return { color: "#d69e2e", bgColor: "#fffaf0", icon: <PendingIcon fontSize="inherit" />, label: "Pending" };
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const DealerTable = ({
  triggerDownloadExcel,
  triggerDownloadPDF,
  datas = [],
  text,
  onDealerDeleted,
  loading: parentLoading,
}) => {
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = !user?.role || user?.role?.toLowerCase() === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuDealer, setMenuDealer] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        const response = await getAllBookings();
        if (response.status === 200) setAllBookings(response.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, []);

  const dealerCancellationRates = useMemo(() => {
    if (!allBookings.length) return {};
    const stats = {};
    allBookings.forEach(b => {
      if (b.dealer_id?._id) {
        const dId = b.dealer_id._id;
        if (!stats[dId]) stats[dId] = { total: 0, cancelled: 0 };
        stats[dId].total++;
        if (b.status?.toLowerCase().includes("cancel")) stats[dId].cancelled++;
      }
    });
    const rates = {};
    Object.keys(stats).forEach(id => {
      rates[id] = ((stats[id].cancelled / stats[id].total) * 100).toFixed(1);
    });
    return rates;
  }, [allBookings]);

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

  const filterCounts = useMemo(() => ({
    all:      datas.length,
    pending:  datas.filter(d => (d.registrationStatus || "").toLowerCase() === "pending").length,
    approved: datas.filter(d => (d.registrationStatus || "").toLowerCase() === "approved").length,
    active:   datas.filter(d => d.isActive === true).length,
    inactive: datas.filter(d => !d.isActive).length,
    blocked:  datas.filter(d => !!d.isBlocked).length,
  }), [datas]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredData = useMemo(() => {
    let result = datas;

    if (activeFilter !== "all") {
      result = result.filter(d => {
        const rs = (d.registrationStatus || "").toLowerCase();
        switch (activeFilter) {
          case "pending":  return rs === "pending";
          case "approved": return rs === "approved";
          case "active":   return d.isActive === true;
          case "inactive": return !d.isActive;
          case "blocked":  return !!d.isBlocked;
          default:         return true;
        }
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d =>
        (d.shopName || "").toLowerCase().includes(term) ||
        (d.ownerName || "").toLowerCase().includes(term) ||
        (d.shopContact || d.phone || "").toLowerCase().includes(term) ||
        (d.shopEmail || d.email || d.personalEmail || "").toLowerCase().includes(term)
      );
    }

    return [...result].sort((a, b) => {
      let vA, vB;
      if (orderBy === "cancelRate") {
        vA = parseFloat(dealerCancellationRates[a._id] || 0);
        vB = parseFloat(dealerCancellationRates[b._id] || 0);
      } else if (orderBy === "createdAt" || orderBy === "updatedAt") {
        vA = new Date(a[orderBy] || 0).getTime();
        vB = new Date(b[orderBy] || 0).getTime();
      } else {
        vA = String(a[orderBy] || "").toLowerCase();
        vB = String(b[orderBy] || "").toLowerCase();
      }
      return order === "asc" ? (vA < vB ? -1 : vA > vB ? 1 : 0) : (vB < vA ? -1 : vB > vA ? 1 : 0);
    });
  }, [datas, searchTerm, activeFilter, order, orderBy, dealerCancellationRates]);

  const currentData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
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

  const handleMenuActivate = async (dealer) => {
    handleMenuClose();
    const next = !dealer.isActive;
    const label = next ? "Activate" : "Deactivate";
    const result = await Swal.fire({
      title: `${label} Dealer?`,
      text: `This will ${label.toLowerCase()} ${dealer.shopName}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: label,
      confirmButtonColor: next ? "#38a169" : "#e53e3e",
    });
    if (!result.isConfirmed) return;
    try {
      await updateDealerStatus(dealer._id, { isActive: next });
      notifyDealerStatusChanged(dispatch);
      await onDealerDeleted();
      Swal.fire("Done", `Dealer ${label.toLowerCase()}d successfully.`, "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  const handleMenuBlock = async (dealer) => {
    handleMenuClose();
    const isCurrentlyBlocked = !!dealer.isBlocked;
    if (!isCurrentlyBlocked) {
      const result = await Swal.fire({
        title: "Block Dealer?",
        text: `Provide a reason for blocking ${dealer.shopName}.`,
        icon: "warning",
        input: "textarea",
        inputPlaceholder: "Enter reason for blocking...",
        showCancelButton: true,
        confirmButtonText: "Block",
        confirmButtonColor: "#e53e3e",
        inputValidator: (v) => (!v?.trim() ? "A reason is required." : undefined),
      });
      if (!result.isConfirmed) return;
      try {
        await updateDealerStatus(dealer._id, { isBlocked: true, blockedReason: result.value.trim() });
        notifyDealerStatusChanged(dispatch);
        await onDealerDeleted();
        Swal.fire("Blocked", `${dealer.shopName} has been blocked.`, "success");
      } catch (e) {
        Swal.fire("Error", e.message, "error");
      }
    } else {
      const result = await Swal.fire({
        title: "Unblock Dealer?",
        text: `This will restore access for ${dealer.shopName}.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Unblock",
        confirmButtonColor: "#38a169",
      });
      if (!result.isConfirmed) return;
      try {
        await updateDealerStatus(dealer._id, { isBlocked: false, blockedReason: "" });
        notifyDealerStatusChanged(dispatch);
        await onDealerDeleted();
        Swal.fire("Unblocked", `${dealer.shopName} has been unblocked.`, "success");
      } catch (e) {
        Swal.fire("Error", e.message, "error");
      }
    }
  };

  const handleMenuDelete = async (dealer) => {
    handleMenuClose();
    const { value: typed } = await Swal.fire({
      title: "Delete Dealer Permanently?",
      html: `<p style="color:#e53e3e;font-weight:600;margin-bottom:12px">This action cannot be undone.</p>
             <p style="margin-bottom:8px">Type <strong>DELETE</strong> to confirm:</p>`,
      input: "text",
      inputPlaceholder: "Type DELETE here",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete Permanently",
      confirmButtonColor: "#e53e3e",
      inputValidator: (value) => {
        if (value !== "DELETE") return 'You must type exactly "DELETE" to confirm.';
      },
    });
    if (typed !== "DELETE") return;
    try {
      await deleteDealer(dealer._id);
      onDealerDeleted();
    } catch (e) {
      Swal.fire("Error", e.message, "error");
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Quick Filter Tabs */}
      <Paper
        elevation={0}
        sx={{ mb: 2, borderRadius: 3, border: "1px solid #edf2f7", overflow: "hidden" }}
      >
        <Tabs
          value={activeFilter}
          onChange={(_, v) => { setActiveFilter(v); setPage(0); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
              fontSize: "0.875rem",
              color: "#64748b",
            },
            "& .Mui-selected": { color: "#2e83ff" },
            "& .MuiTabs-indicator": { backgroundColor: "#2e83ff" },
          }}
        >
          {FILTER_TABS.map(tab => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {tab.label}
                  <Chip
                    label={filterCounts[tab.id]}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      bgcolor: activeFilter === tab.id ? "#2e83ff" : "#f1f5f9",
                      color: activeFilter === tab.id ? "white" : "#64748b",
                      "& .MuiChip-label": { px: 0.75 },
                      transition: "all 0.2s",
                    }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Search + Result Count */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by Dealer Name, Shop Name, Phone, Email..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          sx={{ width: { xs: "100%", sm: 460 }, backgroundColor: "white", borderRadius: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
          {filteredData.length} {filteredData.length === 1 ? "dealer" : "dealers"} found
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={3}
        sx={{ borderRadius: 3, overflow: "auto", border: "1px solid #edf2f7" }}
      >
        <Table id="dealer-table-mui" ref={tableRef} sx={{ minWidth: 1100 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {TABLE_HEADERS.map(h => (
                <TableCell
                  key={h.id}
                  sx={{ color: "white", fontWeight: 700, py: 2, whiteSpace: "nowrap" }}
                >
                  {h.sortable ? (
                    <TableSortLabel
                      active={orderBy === h.id}
                      direction={orderBy === h.id ? order : "asc"}
                      onClick={() => handleRequestSort(h.id)}
                      sx={{
                        color: "white !important",
                        "&.MuiTableSortLabel-active": { color: "white !important" },
                        "& .MuiTableSortLabel-icon": { color: "white !important" },
                      }}
                    >
                      {h.label}
                    </TableSortLabel>
                  ) : (
                    h.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {parentLoading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading dealers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    No dealers found matching your criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((dealer, index) => {
                const regStatus = getRegStatusConfig(dealer.registrationStatus);
                const cancelRate = dealerCancellationRates[dealer._id] || "0.0";
                const isHighCancel = parseFloat(cancelRate) > 15;
                const isBlocked = !!dealer.isBlocked;

                return (
                  <TableRow
                    key={dealer._id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "#f8fafc" },
                      bgcolor: isBlocked ? "#fff8f8" : "inherit",
                    }}
                  >
                    {/* # */}
                    <TableCell sx={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.8rem", width: 48 }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>

                    {/* Shop Details */}
                    <TableCell sx={{ minWidth: 200 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: "#eef5ff",
                            color: "#2e83ff",
                            fontWeight: 800,
                            width: 44,
                            height: 44,
                            fontSize: "1.1rem",
                            flexShrink: 0,
                            border: "2px solid #dbeafe",
                          }}
                        >
                          {(dealer.shopName || "?").charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "#1e293b",
                              cursor: "pointer",
                              "&:hover": { color: "#2e83ff" },
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 160,
                            }}
                            onClick={() => navigate(`/view-dealer/${dealer._id}`)}
                          >
                            {dealer.shopName || "N/A"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#2e83ff", fontWeight: 600, fontFamily: "monospace" }}
                          >
                            {dealer.dealerId || dealer._id?.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Owner */}
                    <TableCell sx={{ minWidth: 120 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#4a5568" }}>
                        {dealer.ownerName || "N/A"}
                      </Typography>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell sx={{ minWidth: 180 }}>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <EmailIcon sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: "#4a5568" }}>
                            {dealer.shopEmail || dealer.email || "N/A"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <PhoneIcon sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: "#4a5568" }}>
                            {dealer.shopContact || dealer.phone || "N/A"}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Location */}
                    <TableCell sx={{ minWidth: 110 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#2d3748" }}>
                        {dealer.permanentAddress?.city || dealer.city || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dealer.permanentAddress?.state || dealer.state || "N/A"}
                      </Typography>
                    </TableCell>

                    {/* Services: Pickup / Drop */}
                    <TableCell sx={{ minWidth: 90 }}>
                      <Stack spacing={0.5}>
                        <Tooltip title={dealer.providesPickup ? "Pickup available" : "Pickup not available"}>
                          <Chip
                            icon={<TwoWheelerIcon sx={{ fontSize: "12px !important" }} />}
                            label="Pickup"
                            size="small"
                            variant={dealer.providesPickup ? "filled" : "outlined"}
                            color={dealer.providesPickup ? "primary" : "default"}
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              opacity: dealer.providesPickup ? 1 : 0.45,
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                        </Tooltip>
                        <Tooltip title={dealer.providesDrop ? "Drop available" : "Drop not available"}>
                          <Chip
                            icon={<DropIcon sx={{ fontSize: "12px !important" }} />}
                            label="Drop"
                            size="small"
                            variant={dealer.providesDrop ? "filled" : "outlined"}
                            color={dealer.providesDrop ? "secondary" : "default"}
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              opacity: dealer.providesDrop ? 1 : 0.45,
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                        </Tooltip>
                      </Stack>
                    </TableCell>

                    {/* Status chips */}
                    <TableCell sx={{ minWidth: 110 }}>
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Chip
                          icon={regStatus.icon}
                          label={regStatus.label}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: regStatus.color,
                            bgcolor: regStatus.bgColor,
                            border: `1px solid ${regStatus.color}44`,
                            borderRadius: 1,
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                        <Chip
                          label={dealer.isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: dealer.isActive ? "#38a169" : "#718096",
                            bgcolor: dealer.isActive ? "#f0fff4" : "#f7fafc",
                            border: `1px solid ${dealer.isActive ? "#38a16944" : "#71809644"}`,
                            borderRadius: 1,
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                        {isBlocked && (
                          <Chip
                            icon={<BlockIcon sx={{ fontSize: "11px !important" }} />}
                            label="Blocked"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: "#e53e3e",
                              bgcolor: "#fff5f5",
                              border: "1px solid #e53e3e44",
                              borderRadius: 1,
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>

                    {/* Performance */}
                    <TableCell sx={{ minWidth: 80 }}>
                      {loadingBookings ? (
                        <CircularProgress size={14} />
                      ) : (
                        <Tooltip title={isHighCancel ? "High cancellation rate detected!" : "Dealer performance"}>
                          <Chip
                            label={`${cancelRate}%`}
                            size="small"
                            color={isHighCancel ? "error" : "success"}
                            variant="outlined"
                            icon={<AnalyticsIcon sx={{ fontSize: "14px !important" }} />}
                            sx={{ fontWeight: 700, height: 24 }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>

                    {/* Created Date */}
                    <TableCell sx={{ minWidth: 110 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#4a5568", whiteSpace: "nowrap" }}>
                          {formatDate(dealer.createdAt)}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Actions */}
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

      {/* Quick Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 190, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
        }}
      >
        <MenuItem
          onClick={() => { handleMenuClose(); navigate(`/view-dealer/${menuDealer?._id}`); }}
        >
          <VisibilityIcon sx={{ mr: 1.5, color: "info.main", fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600}>View Profile</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => { handleMenuClose(); navigate(`/updateDealer/${menuDealer?._id}`); }}
        >
          <EditIcon sx={{ mr: 1.5, color: "primary.main", fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600}>Edit Dealer</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={() => menuDealer && handleMenuActivate(menuDealer)}>
          <PowerIcon
            sx={{
              mr: 1.5,
              fontSize: 18,
              color: menuDealer?.isActive ? "error.main" : "success.main",
            }}
          />
          <Typography
            variant="body2"
            fontWeight={600}
            color={menuDealer?.isActive ? "error.main" : "success.main"}
          >
            {menuDealer?.isActive ? "Deactivate" : "Activate"}
          </Typography>
        </MenuItem>

        <MenuItem onClick={() => menuDealer && handleMenuBlock(menuDealer)}>
          {menuDealer?.isBlocked ? (
            <LockOpenIcon sx={{ mr: 1.5, color: "success.main", fontSize: 18 }} />
          ) : (
            <BlockIcon sx={{ mr: 1.5, color: "error.main", fontSize: 18 }} />
          )}
          <Typography
            variant="body2"
            fontWeight={600}
            color={menuDealer?.isBlocked ? "success.main" : "error.main"}
          >
            {menuDealer?.isBlocked ? "Unblock" : "Block"}
          </Typography>
        </MenuItem>

        {isSuperAdmin && [
          <Divider key="delete-divider" sx={{ my: 0.5 }} />,
          <MenuItem
            key="delete-permanently"
            onClick={() => menuDealer && handleMenuDelete(menuDealer)}
            sx={{ bgcolor: "#fff5f5", "&:hover": { bgcolor: "#fed7d7" } }}
          >
            <DeleteForeverIcon sx={{ mr: 1.5, color: "error.main", fontSize: 18 }} />
            <Typography variant="body2" fontWeight={700} color="error.main">
              Delete Permanently
            </Typography>
          </MenuItem>,
        ]}
      </Menu>
    </Box>
  );
};

export default DealerTable;

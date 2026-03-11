import React, { useMemo, useRef, useState } from "react";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FileDownload as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

const BookingTable = ({
  triggerDownloadExcel,
  triggerDownloadPDF,
  datas,
  loading,
  error,
}) => {
  const tableRef = useRef(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("pickupDate");

  // ✅ Professional Date Formatter (e.g., 13 Mar 2026)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
          (item.user_id?.first_name + " " + item.user_id?.last_name || "")
            .toLowerCase()
            .includes(term) ||
          item.bookingId?.toLowerCase().includes(term) ||
          item.dealer_id?.shopName?.toLowerCase().includes(term) ||
          item.user_id?.customerId?.toLowerCase().includes(term) || // ✅ Added Search by Customer ID
          item.dealer_id?.dealerId?.toLowerCase().includes(term)   // ✅ Added Search by Dealer ID
      );
    }

    // ✅ Robust Sorting Logic (Non-mutative)
    return [...result].sort((a, b) => {
      let valueA, valueB;
      
      if (orderBy === "customer") {
        valueA = (a.user_id?.first_name || "").toLowerCase();
        valueB = (b.user_id?.first_name || "").toLowerCase();
      } else if (orderBy === "amount") {
        valueA = a.totalBill || a.services?.[0]?.bikes?.[0]?.price || 0;
        valueB = b.totalBill || b.services?.[0]?.bikes?.[0]?.price || 0;
      } else if (orderBy === "pickupDate") {
        valueA = new Date(a.pickupDate || 0).getTime();
        valueB = new Date(b.pickupDate || 0).getTime();
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

  // ✅ Excel & PDF Export
  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Booking_List",
    sheet: "Bookings",
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Booking List", 14, 10);
    doc.autoTable({ html: "#booking-table-mui", startY: 20, theme: "striped" });
    doc.save("Bookings.pdf");
  };

  if (triggerDownloadExcel) triggerDownloadExcel.current = onDownload;
  if (triggerDownloadPDF) triggerDownloadPDF.current = exportToPDF;

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase() || "";
    if (["confirmed", "completed", "pickedup", "arrived"].includes(s)) {
      return { color: "success", icon: <CheckCircleIcon fontSize="small" /> };
    }
    if (s.includes("cancel")) {
      return { color: "error", icon: <CancelIcon fontSize="small" /> };
    }
    if (["pending", "waiting"].includes(s)) {
      return { color: "warning", icon: <PendingIcon fontSize="small" /> };
    }
    return { color: "default", icon: <InfoIcon fontSize="small" /> };
  };

  const headers = [
    { id: "id", label: "#", sortable: false },
    { id: "bookingId", label: "Booking ID", sortable: true },
    { id: "customer", label: "Customer (ID)", sortable: true },
    { id: "dealer", label: "Dealer (ID)", sortable: false },
    { id: "service", label: "Services", sortable: false },
    { id: "amount", label: "Amount", sortable: true },
    { id: "pickupDate", label: "Date", sortable: true },
    { id: "status", label: "Status", sortable: true },
  ];

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by Customer, ID, or Shop..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: "100%", sm: 350 } }}
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
          borderRadius: 2,
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: "8px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: "10px" },
        }}
      >
        <Table id="booking-table-mui" ref={tableRef} sx={{ minWidth: 1200 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{ color: "white", fontWeight: "bold", whiteSpace: "nowrap" }}
                  sortDirection={orderBy === header.id ? order : false}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1">Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="error">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                    No bookings found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((booking, index) => {
                const amount = booking.totalBill || booking.services[0]?.bikes[0]?.price || 0;
                const serviceNames = booking.services
                  ?.map((s) => s.description?.substring(0, 20) || s.serviceId || "N/A")
                  .join(", ") || "N/A";

                return (
                  <TableRow key={booking._id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "text.primary", whiteSpace: "nowrap" }}>
                      {booking.bookingId || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Box>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setSelectedUser(booking.user_id)}
                          sx={{ textTransform: "none", fontWeight: "bold", p: 0, justifyContent: "flex-start" }}
                        >
                          {booking.user_id?.first_name} {booking.user_id?.last_name}
                        </Button>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {booking.user_id?.customerId || "ID: N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Box>
                        <Button
                          variant="text"
                          size="small"
                          color="info"
                          onClick={() => setSelectedDealer(booking.dealer_id)}
                          sx={{ textTransform: "none", fontWeight: "bold", p: 0, justifyContent: "flex-start" }}
                        >
                          {booking.dealer_id?.shopName || "N/A"}
                        </Button>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {booking.dealer_id?.dealerId || "ID: N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {serviceNames}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#2e7d32", whiteSpace: "nowrap" }}>
                      ₹{amount.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(booking.pickupDate)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {(() => {
                        const { color, icon } = getStatusConfig(booking.status);
                        return (
                          <Chip
                            label={(booking.status || "N/A").replace("_", " ")}
                            color={color}
                            icon={icon}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontWeight: "bold", 
                              textTransform: "capitalize",
                              borderRadius: "6px",
                              px: 0.5,
                              "& .MuiChip-icon": { marginLeft: "4px" }
                            }}
                          />
                        );
                      })()}
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
        />
      </TableContainer>

      {/* ✅ User Details Dialog */}
      <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", mb: 2 }}>
          Customer Dashboard
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pt: 2 }}>
              <Avatar
                src={selectedUser.image}
                sx={{ width: 100, height: 100, mb: 1, border: "4px solid #f8f9fa" }}
              >
                {selectedUser.first_name?.[0]}
              </Avatar>
              <Box sx={{ width: "100%" }}>
                <Typography variant="h6" align="center" sx={{ fontWeight: "bold" }}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" align="center" gutterBottom>
                  {selectedUser.customerId || "No ID"} • {selectedUser.reward_points || 0} Reward Points
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fcfcfc", borderRadius: 2, mt: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold", color: "primary.main", mb: 1, display: "block" }}>
                    CONTACT & LOCATION
                  </Typography>
                  {[
                    { label: "Email", value: selectedUser.email },
                    { label: "Phone", value: selectedUser.phone },
                    { label: "Address", value: selectedUser.address },
                    { label: "City/State", value: `${selectedUser.city || "N/A"}, ${selectedUser.state || "N/A"}` },
                    { label: "Pincode", value: selectedUser.pincode },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: "flex", mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold", width: 100 }}>{row.label}:</Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>{row.value || "N/A"}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedUser(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Dealer Details Dialog */}
      <Dialog open={Boolean(selectedDealer)} onClose={() => setSelectedDealer(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "info.main", color: "white", mb: 2 }}>
          Dealer Business Profile
        </DialogTitle>
        <DialogContent>
          {selectedDealer && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }} align="center">
                {selectedDealer.shopName || "N/A"}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" align="center" gutterBottom>
                {selectedDealer.dealerId || "No ID"} • {selectedDealer.registrationStatus || "Unknown"} Status
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: "#fcfcfc", borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: "bold", color: "info.main", mb: 1, display: "block" }}>
                  BUSINESS DETAILS
                </Typography>
                {[
                  { label: "Owner", value: selectedDealer.ownerName },
                  { label: "Phone", value: selectedDealer.shopContact || selectedDealer.phone },
                  { label: "Support Email", value: selectedDealer.shopEmail || selectedDealer.personalEmail },
                  { label: "Full Address", value: selectedDealer.fullAddress },
                  { label: "City", value: selectedDealer.city || selectedDealer.permanentAddress?.city },
                  { label: "Registration", value: selectedDealer.registrationStatus },
                ].map((row) => (
                  <Box key={row.label} sx={{ display: "flex", mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", width: 110 }}>{row.label}:</Typography>
                    <Typography variant="body2" sx={{ flex: 1 }}>{row.value || "N/A"}</Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedDealer(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingTable;

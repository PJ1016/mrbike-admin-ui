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
  Grid,
  Stack,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FileDownload as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  TwoWheeler as TwoWheelerIcon,
  Storefront as StorefrontIcon,
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
  const [selectedBooking, setSelectedBooking] = useState(null);
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

  // ✅ Relative Date Formatter (Today, Yesterday, etc.)
  const formatRelativeDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays === -1) return "Tomorrow";
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;

    return formatDate(dateString);
  };

  // ✅ Helper to calculate estimated price based on bike CC and services
  const calculateEstimatedPrice = (booking) => {
    if (booking.totalBill && booking.totalBill > 0) return booking.totalBill;
    if (!booking.services || booking.services.length === 0) return 0;

    const bikeCC = parseInt(booking.userBike_id?.bike_cc || 0);
    return booking.services.reduce((total, service) => {
      // Handle both cases where service might be an ID or a populated object
      const bikes = service.bikes || [];
      const matchingBike = bikes.find((b) => b.cc === bikeCC);
      return total + (matchingBike?.price || 0);
    }, 0);
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
          item.dealer_id?.dealerId?.toLowerCase().includes(term) || // ✅ Added Search by Dealer ID
          item.userBike_id?.name?.toLowerCase().includes(term) || // ✅ Added Search by Bike Brand
          item.userBike_id?.model?.toLowerCase().includes(term), // ✅ Added Search by Bike Model
      );
    }

    // ✅ Robust Sorting Logic (Non-mutative)
    return [...result].sort((a, b) => {
      let valueA, valueB;

      if (orderBy === "customer") {
        valueA = (a.user_id?.first_name || "").toLowerCase();
        valueB = (b.user_id?.first_name || "").toLowerCase();
      } else if (orderBy === "amount") {
        valueA = calculateEstimatedPrice(a);
        valueB = calculateEstimatedPrice(b);
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
    if (["confirmed", "pickedup", "arrived"].includes(s)) {
      return { color: "success", icon: <CheckCircleIcon fontSize="small" /> };
    }
    if (s === "completed") {
      return { color: "primary", icon: <CheckCircleIcon fontSize="small" /> };
    }
    if (s.includes("cancel") || s.includes("reject")) {
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
    { id: "customer", label: "Customer", sortable: true },
    { id: "dealer", label: "Dealer", sortable: false },
    { id: "bike", label: "Bike", sortable: false },
    { id: "service", label: "Services", sortable: false },
    { id: "mode", label: "Mode", sortable: false },
    { id: "amount", label: "Amount", sortable: true },
    { id: "pickupDate", label: "Date", sortable: true },
    { id: "status", label: "Status", sortable: true },
    { id: "action", label: "Action", sortable: false },
  ];

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
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
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#ccc",
            borderRadius: "10px",
          },
        }}
      >
        <Table id="booking-table-mui" ref={tableRef} sx={{ minWidth: 1200 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                  sortDirection={orderBy === header.id ? order : false}
                >
                  {header.sortable ? (
                    <TableSortLabel
                      active={orderBy === header.id}
                      direction={orderBy === header.id ? order : "asc"}
                      onClick={() => handleRequestSort(header.id)}
                      sx={{
                        color: "white !important",
                        "&.MuiTableSortLabel-active": {
                          color: "white !important",
                        },
                        "& .MuiTableSortLabel-icon": {
                          color: "white !important",
                        },
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
                const amount = calculateEstimatedPrice(booking);
                const services = booking.services || [];
                const firstService = services[0]?.description || services[0]?.serviceId || "N/A";
                const displayServices = services.length > 1 
                  ? `${firstService.substring(0, 15)}... +${services.length - 1}` 
                  : firstService.substring(0, 20);

                return (
                  <TableRow 
                    key={booking._id} 
                    hover 
                    onClick={() => setSelectedBooking(booking)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "text.primary",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {booking.bookingId || "N/A"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Box>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setSelectedUser(booking.user_id)}
                          sx={{
                            textTransform: "none",
                            fontWeight: "bold",
                            p: 0,
                            justifyContent: "flex-start",
                          }}
                        >
                          {booking.user_id?.first_name}{" "}
                          {booking.user_id?.last_name}
                        </Button>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
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
                          sx={{
                            textTransform: "none",
                            fontWeight: "bold",
                            p: 0,
                            justifyContent: "flex-start",
                          }}
                        >
                          {booking.dealer_id?.shopName || "N/A"}
                        </Button>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {booking.dealer_id?.dealerId || "ID: N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {booking.userBike_id?.name || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.userBike_id?.model || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Chip 
                        label={displayServices} 
                        size="small" 
                        variant="soft" 
                        color="secondary"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {booking.pickupAndDropId ? (
                          <TwoWheelerIcon fontSize="small" color="primary" />
                        ) : (
                          <StorefrontIcon fontSize="small" color="info" />
                        )}
                        <Typography variant="body2">
                          {booking.pickupAndDropId ? "Pickup" : "Visit"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#2e7d32",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₹{amount.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: formatRelativeDate(booking.pickupDate) === "Today" ? "bold" : "normal",
                        color: formatRelativeDate(booking.pickupDate) === "Today" ? "primary.main" : "text.primary"
                      }}>
                        {formatRelativeDate(booking.pickupDate)}
                      </Typography>
                    </TableCell>
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
                              "& .MuiChip-icon": { marginLeft: "4px" },
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedBooking(booking)}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
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
        />
      </TableContainer>

      {/* ✅ User Details Dialog */}
      <Dialog
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", mb: 2 }}>
          Customer Dashboard
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                pt: 2,
              }}
            >
              <Avatar
                src={selectedUser.image}
                sx={{
                  width: 100,
                  height: 100,
                  mb: 1,
                  border: "4px solid #f8f9fa",
                }}
              >
                {selectedUser.first_name?.[0]}
              </Avatar>
              <Box sx={{ width: "100%" }}>
                <Typography
                  variant="h6"
                  align="center"
                  sx={{ fontWeight: "bold" }}
                >
                  {selectedUser.first_name} {selectedUser.last_name}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  align="center"
                  gutterBottom
                >
                  {selectedUser.customerId || "No ID"} •{" "}
                  {selectedUser.reward_points || 0} Reward Points
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, bgcolor: "#fcfcfc", borderRadius: 2, mt: 2 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: "bold",
                      color: "primary.main",
                      mb: 1,
                      display: "block",
                    }}
                  >
                    CONTACT & LOCATION
                  </Typography>
                  {[
                    { label: "Email", value: selectedUser.email },
                    { label: "Phone", value: selectedUser.phone },
                    { label: "Address", value: selectedUser.address },
                    {
                      label: "City/State",
                      value: `${selectedUser.city || "N/A"}, ${selectedUser.state || "N/A"}`,
                    },
                    { label: "Pincode", value: selectedUser.pincode },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: "flex", mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", width: 100 }}
                      >
                        {row.label}:
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {row.value || "N/A"}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedUser(null)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Dealer Details Dialog */}
      <Dialog
        open={Boolean(selectedDealer)}
        onClose={() => setSelectedDealer(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "info.main", color: "white", mb: 2 }}>
          Dealer Business Profile
        </DialogTitle>
        <DialogContent>
          {selectedDealer && (
            <Box sx={{ pt: 1 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold" }}
                align="center"
              >
                {selectedDealer.shopName || "N/A"}
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                align="center"
                gutterBottom
              >
                {selectedDealer.dealerId || "No ID"} •{" "}
                {selectedDealer.registrationStatus || "Unknown"} Status
              </Typography>

              <Paper
                variant="outlined"
                sx={{ p: 2, mt: 3, bgcolor: "#fcfcfc", borderRadius: 2 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    color: "info.main",
                    mb: 1,
                    display: "block",
                  }}
                >
                  BUSINESS DETAILS
                </Typography>
                {[
                  { label: "Owner", value: selectedDealer.ownerName },
                  {
                    label: "Phone",
                    value: selectedDealer.shopContact || selectedDealer.phone,
                  },
                  {
                    label: "Support Email",
                    value:
                      selectedDealer.shopEmail || selectedDealer.personalEmail,
                  },
                  { label: "Full Address", value: selectedDealer.fullAddress },
                  {
                    label: "City",
                    value:
                      selectedDealer.city ||
                      selectedDealer.permanentAddress?.city,
                  },
                  {
                    label: "Registration",
                    value: selectedDealer.registrationStatus,
                  },
                ].map((row) => (
                  <Box key={row.label} sx={{ display: "flex", mb: 1.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", width: 110 }}
                    >
                      {row.label}:
                    </Typography>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {row.value || "N/A"}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedDealer(null)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Booking Details Dialog */}
      <Dialog
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "success.main",
            color: "white",
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Booking Details - {selectedBooking?.bookingId}
          <Chip
            label={selectedBooking?.status?.replace("_", " ")}
            size="small"
            sx={{
              bgcolor: "white",
              fontWeight: "bold",
              textTransform: "capitalize",
            }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={3} sx={{ pt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, height: "100%", borderRadius: 2 }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}
                  >
                    CUSTOMER & BIKE INFO
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Customer:
                      </Typography>
                      <Typography variant="body2">
                        {selectedBooking.user_id?.first_name}{" "}
                        {selectedBooking.user_id?.last_name}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Phone:
                      </Typography>
                      <Typography variant="body2">
                        {selectedBooking.user_id?.phone || "N/A"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Email:
                      </Typography>
                      <Typography variant="body2">
                        {selectedBooking.user_id?.email || "N/A"}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>Bike Company:</Typography>
                      <Typography variant="body2">{selectedBooking.userBike_id?.name || "N/A"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>Bike Model:</Typography>
                      <Typography variant="body2">{selectedBooking.userBike_id?.model || "N/A"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>Plate Number:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold", color: "error.main" }}>{selectedBooking.userBike_id?.plate_number || "N/A"}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, height: "100%", borderRadius: 2 }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}
                  >
                    SERVICE DETAILS
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Service Mode:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          color: selectedBooking.pickupAndDropId
                            ? "secondary.main"
                            : "success.main",
                        }}
                      >
                        {selectedBooking.pickupAndDropId
                          ? "Pickup & Drop"
                          : "Self Visit"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Pickup/Visit Date:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(selectedBooking.pickupDate)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Amount:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", color: "success.main" }}
                      >
                        ₹{calculateEstimatedPrice(selectedBooking).toLocaleString()}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", mb: 0.5 }}
                      >
                        Service Type:
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedBooking.services
                          ?.map((s) => s.description)
                          .join(", ") || "N/A"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, bgcolor: "#f8f9fa" }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}
                  >
                    VERIFICATION & TIMELINE
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: "bold", display: "block" }}
                      >
                        Pickup OTP
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "primary.main", fontWeight: "bold" }}
                      >
                        {selectedBooking.pickupOtp || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: "bold", display: "block" }}
                      >
                        Delivery OTP
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "success.main", fontWeight: "bold" }}
                      >
                        {selectedBooking.deliveryOtp || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: "bold", display: "block" }}
                      >
                        Booked On
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(selectedBooking.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: "bold", display: "block" }}
                      >
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(selectedBooking.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedBooking(null)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingTable;

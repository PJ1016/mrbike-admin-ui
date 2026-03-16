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
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  TwoWheeler as TwoWheelerIcon,
  Storefront as StorefrontIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Map as MapIcon,
  DirectionsBike as BikeIcon,
  EditNote as NoteIcon,
  VerifiedUser as SecurityIcon,
  Update as UpdateIcon,
  EventNote as CalendarIcon,
  Payments as PaymentIcon,
  Description,
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
    const diffTime =
      now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0);
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
          item.userBike_id?.model?.toLowerCase().includes(term) || // ✅ Added Search by Bike Model
          item.services?.[0]?.base_service_id?.name
            ?.toLowerCase()
            .includes(term), // ✅ Added Search by Service Name
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

    if (s.includes("completed") || s.includes("paid"))
      return { color: "success", icon: <CheckCircleIcon fontSize="small" /> };
    if (s.includes("cancelled") || s.includes("rejected"))
      return { color: "error", icon: <CancelIcon fontSize="small" /> };
    if (s.includes("pending") || s.includes("waiting") || s.includes("created"))
      return { color: "warning", icon: <PendingIcon fontSize="small" /> };

    // Default or other progressive statuses
    return { color: "info", icon: <InfoIcon fontSize="small" /> };
  };

  const getActiveStep = (booking) => {
    if (!booking) return 0;
    const s = (booking.vehicleLifecycleStatus || "").toLowerCase();
    if (s.includes("payment completed")) return 6;
    if (s.includes("bill generated")) return 5;
    if (s.includes("service completed")) return 4;
    if (s.includes("service in progress")) return 3;
    if (s.includes("pickup scheduled") || s.includes("awaiting")) return 2;
    if (booking.status === "confirmed") return 1;
    return 0;
  };

  const lifecycleSteps = [
    "Booking Created",
    "Confirmed",
    "Awaiting/Scheduled",
    "In Service",
    "Service Done",
    "Billed",
    "Paid",
  ];

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
  ];

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "var(--shadow-card)",
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: "8px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: "10px",
          },
        }}
      >
        <Table id="booking-table-mui" ref={tableRef} sx={{ minWidth: 1200 }}>
          <TableHead sx={{ backgroundColor: "#f8fafc" }}>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    color: "neutral.600",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 2,
                    borderBottom: "1px solid #e2e8f0",
                  }}
                  sortDirection={orderBy === header.id ? order : false}
                >
                  {header.sortable ? (
                    <TableSortLabel
                      active={orderBy === header.id}
                      direction={orderBy === header.id ? order : "asc"}
                      onClick={() => handleRequestSort(header.id)}
                      sx={{
                        "&.MuiTableSortLabel-active": { color: "primary.main" },
                        "& .MuiTableSortLabel-icon": {
                          color: "primary.main !important",
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
                <TableCell colSpan={10} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1">Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="error">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                    No bookings found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((booking, index) => {
                const amount = calculateEstimatedPrice(booking);
                const services = booking.services || [];
                const firstService =
                  services[0]?.base_service_id?.name ||
                  services[0]?.description ||
                  services[0]?.serviceId ||
                  "N/A";
                const displayServices =
                  services.length > 1
                    ? `${firstService.substring(0, 15)}... +${services.length - 1}`
                    : firstService.substring(0, 20);

                return (
                  <TableRow
                    key={booking._id}
                    hover
                    onClick={() => setSelectedBooking(booking)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "neutral.50" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell
                      sx={{ color: "neutral.500", fontSize: "0.875rem" }}
                    >
                      {page * rowsPerPage + index + 1}
                    </TableCell>
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
                          {booking.dealer_id?.shopName || (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                fontStyle: "italic",
                              }}
                            >
                              Unassigned
                            </Typography>
                          )}
                        </Button>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {booking.dealer_id?.dealerId || ""}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Stack spacing={0}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: "bold" }}
                        >
                          {booking.userBike_id?.name || (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.disabled",
                                fontStyle: "italic",
                              }}
                            >
                              Unassigned
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.userBike_id?.model || ""}
                        </Typography>
                      </Stack>
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
                        sx={{ fontSize: "0.7rem", height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
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
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight:
                            formatRelativeDate(booking.pickupDate) === "Today"
                              ? "bold"
                              : "normal",
                          color:
                            formatRelativeDate(booking.pickupDate) === "Today"
                              ? "primary.main"
                              : "text.primary",
                        }}
                      >
                        {formatRelativeDate(booking.pickupDate)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {(() => {
                        const displayStatus =
                          booking.vehicleLifecycleStatus ||
                          booking.status ||
                          "N/A";
                        const { color, icon } = getStatusConfig(displayStatus);
                        return (
                          <Chip
                            label={displayStatus.replace("_", " ")}
                            color={color}
                            icon={icon}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              textTransform: "capitalize",
                              borderRadius: "8px",
                              fontSize: "0.75rem",
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

      {/* ✅ Modernized Booking Details Dialog */}
      <Dialog
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#f8f9fa",
            borderBottom: "1px solid #eee",
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              <NoteIcon />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#1a1a1a" }}
              >
                Booking {selectedBooking?.bookingId}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  fontFamily: "Monospace",
                }}
              >
                ID: {selectedBooking?._id?.substring(0, 12).toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={(
              selectedBooking?.vehicleLifecycleStatus ||
              selectedBooking?.status ||
              ""
            ).replace("_", " ")}
            size="medium"
            sx={{
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: 1,
              borderRadius: "8px",
              px: 1,
              bgcolor: `${getStatusConfig(selectedBooking?.vehicleLifecycleStatus || selectedBooking?.status).color}15`,
              color: `${getStatusConfig(selectedBooking?.vehicleLifecycleStatus || selectedBooking?.status).color}.dark`,
              border: `1px solid ${getStatusConfig(selectedBooking?.vehicleLifecycleStatus || selectedBooking?.status).color}30`,
            }}
          />
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "#fff" }}>
          {selectedBooking && (
            <>
              {/* Lifecycle Stepper */}
              <Box
                sx={{
                  width: "100%",
                  py: 5,
                  mb: 4,
                  bgcolor: "#f8fafc",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <Stepper
                  activeStep={getActiveStep(selectedBooking)}
                  alternativeLabel
                  sx={{
                    "& .MuiStepConnector-line": {
                      borderTopWidth: "2px",
                      borderRadius: "1px",
                    },
                    "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line":
                      {
                        borderColor: "primary.main",
                      },
                    "& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line":
                      {
                        borderColor: "success.main",
                      },
                  }}
                >
                  {lifecycleSteps.map((label, index) => {
                    const stepStatus = getActiveStep(selectedBooking);
                    const isCompleted = index < stepStatus;
                    const isActive = index === stepStatus;

                    return (
                      <Step key={label} completed={isCompleted}>
                        <StepLabel
                          error={selectedBooking.status
                            ?.toLowerCase()
                            .includes("cancel")}
                          StepIconComponent={
                            selectedBooking.status
                              ?.toLowerCase()
                              .includes("cancel") && isActive
                              ? CancelIcon
                              : undefined
                          }
                          StepIconProps={{
                            sx: {
                              width: 32,
                              height: 32,
                              "&.Mui-active": {
                                color: "primary.main",
                                transform: "scale(1.1)",
                                transition:
                                  "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                              },
                              "&.Mui-completed": { color: "success.main" },
                              "&.Mui-error": { color: "error.main" },
                              "& .MuiStepIcon-text": {
                                fontSize: "0.75rem",
                                fontWeight: 800,
                              },
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: isActive || isCompleted ? 800 : 600,
                              color:
                                selectedBooking.status
                                  ?.toLowerCase()
                                  .includes("cancel") && isActive
                                  ? "error.main"
                                  : isActive
                                    ? "primary.main"
                                    : isCompleted
                                      ? "success.main"
                                      : "text.disabled",
                              fontSize: "0.75rem",
                              mt: 1,
                              display: "block",
                            }}
                          >
                            {label}
                          </Typography>
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              </Box>

              <Grid container spacing={3}>
                {/* Section 1: Customer & Bike */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: "primary.soft", width: 32, height: 32 }}
                    >
                      <PersonIcon
                        sx={{ color: "primary.main", fontSize: 18 }}
                      />
                    </Avatar>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "#4a5568",
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                      }}
                    >
                      Customer & Vehicle
                    </Typography>
                  </Box>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#fff",
                      height: "calc(100% - 48px)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack spacing={2.5}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: 32,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Customer Name
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {selectedBooking.user_id?.first_name}{" "}
                          {selectedBooking.user_id?.last_name}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: 32,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Contact Number
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <PhoneIcon
                            sx={{
                              fontSize: 16,
                              color: "primary.main",
                              mb: "2px",
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {selectedBooking.user_id?.phone || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ borderStyle: "dashed" }} />
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: "#f0f7ff",
                            borderRadius: 2,
                            width: 44,
                            height: 44,
                          }}
                        >
                          <BikeIcon sx={{ color: "primary.main" }} />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 800, color: "neutral.900" }}
                          >
                            {selectedBooking.user_id?.customerId || "ID: ----"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: "text.secondary",
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            {selectedBooking.userBike_id?.name}{" "}
                            {selectedBooking.userBike_id?.model}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "info.main",
                              fontWeight: 800,
                              bgcolor: "info.soft",
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {selectedBooking.userBike_id?.plate_number ||
                              "No Plate"}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Section 2: Service Plan */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: "primary.soft", width: 32, height: 32 }}
                    >
                      <CalendarIcon
                        sx={{ color: "primary.main", fontSize: 18 }}
                      />
                    </Avatar>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "#4a5568",
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                      }}
                    >
                      Service Details
                    </Typography>
                  </Box>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#fff",
                      height: "calc(100% - 48px)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: 32,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Fulfillment Mode
                        </Typography>
                        <Chip
                          icon={
                            selectedBooking.pickupAndDropId ? (
                              <TwoWheelerIcon
                                sx={{ fontSize: "1rem !important" }}
                              />
                            ) : (
                              <StorefrontIcon
                                sx={{ fontSize: "1rem !important" }}
                              />
                            )
                          }
                          label={
                            selectedBooking.pickupAndDropId
                              ? "Pick & Drop"
                              : "In-Shop Visit"
                          }
                          size="small"
                          color={
                            selectedBooking.pickupAndDropId
                              ? "secondary"
                              : "info"
                          }
                          sx={{
                            fontWeight: 700,
                            borderRadius: 1.5,
                            height: 24,
                            "& .MuiChip-label": { px: 1, py: 0 },
                            alignSelf: "center",
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: 32,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Scheduled For
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatDate(selectedBooking.pickupDate)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: 32,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Total Estimate
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 900,
                            color: "success.main",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="span"
                            sx={{ fontWeight: 700, mt: 0.5 }}
                          >
                            ₹
                          </Typography>
                          {calculateEstimatedPrice(
                            selectedBooking,
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                      <Divider sx={{ borderStyle: "dashed" }} />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: "text.secondary",
                            mb: 1,
                            display: "block",
                          }}
                        >
                          ENROLLED SERVICES
                        </Typography>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selectedBooking.services?.map((s, idx) => (
                            <Chip
                              key={idx}
                              label={
                                s.base_service_id?.name || s.serviceId || "N/A"
                              }
                              size="small"
                              variant="soft"
                              sx={{
                                color: "primary.main",
                                bgcolor: "#f0f7ff",
                                fontWeight: 700,
                                fontSize: "0.7rem",
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Section 3: Verification & Security */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{ bgcolor: "primary.soft", width: 32, height: 32 }}
                    >
                      <SecurityIcon
                        sx={{ color: "primary.main", fontSize: 18 }}
                      />
                    </Avatar>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "#4a5568",
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                      }}
                    >
                      Security & Verification
                    </Typography>
                  </Box>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3.5,
                      borderRadius: 4,
                      bgcolor: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Grid container spacing={4} alignItems="center">
                      <Grid item xs={6} sm={3}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontWeight: 700,
                            mb: 1,
                            display: "block",
                            textTransform: "uppercase",
                            fontSize: "0.65rem",
                          }}
                        >
                          PICKUP OTP
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 900,
                              color: "primary.main",
                              letterSpacing: 2,
                              fontFamily: "Monospace",
                              bgcolor: "primary.soft",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 2,
                              display: "inline-block",
                            }}
                          >
                            {selectedBooking.pickupOtp || "----"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontWeight: 700,
                            mb: 1,
                            display: "block",
                            textTransform: "uppercase",
                            fontSize: "0.65rem",
                          }}
                        >
                          DELIVERY OTP
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 900,
                            color: "success.main",
                            letterSpacing: 2,
                            fontFamily: "Monospace",
                            bgcolor: "success.soft",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            display: "inline-block",
                          }}
                        >
                          {selectedBooking.deliveryOtp || "----"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontWeight: 700,
                            mb: 1,
                            display: "block",
                            textTransform: "uppercase",
                            fontSize: "0.65rem",
                          }}
                        >
                          BOOKED ON
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CalendarIcon
                            sx={{ fontSize: 16, color: "#64748b" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 800, color: "#1e293b" }}
                          >
                            {formatDate(selectedBooking.createdAt)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontWeight: 700,
                            mb: 1,
                            display: "block",
                            textTransform: "uppercase",
                            fontSize: "0.65rem",
                          }}
                        >
                          BILL STATUS
                        </Typography>
                        <Chip
                          label={
                            selectedBooking.status
                              ?.toLowerCase()
                              .includes("cancel") &&
                            (selectedBooking.billStatus === "pending" ||
                              !selectedBooking.billStatus)
                              ? "VOIDED"
                              : selectedBooking.billStatus?.toUpperCase() ||
                                "UNPAID"
                          }
                          size="small"
                          color={
                            selectedBooking.status
                              ?.toLowerCase()
                              .includes("cancel") &&
                            (selectedBooking.billStatus === "pending" ||
                              !selectedBooking.billStatus)
                              ? "default"
                              : selectedBooking.billStatus === "paid"
                                ? "success"
                                : "warning"
                          }
                          sx={{
                            fontWeight: 900,
                            fontSize: "0.65rem",
                            borderRadius: 1.5,
                            px: 1,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 3, bgcolor: "#fff", borderTop: "1px solid #eee" }}
        >
          <Button
            onClick={() => setSelectedBooking(null)}
            variant="contained"
            disableElevation
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.2,
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            Close Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingTable;

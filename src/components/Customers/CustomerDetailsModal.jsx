import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Paper,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  DirectionsBike as BikeIcon,
  EventNote as BookingIcon,
  ReportProblem as ComplaintIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  DeleteOutline as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  EmojiEvents as RewardIcon,
} from "@mui/icons-material";
import {
  useGetCustomerByIdQuery,
  useDeleteCustomerMutation,
} from "../../redux/services/customerApi";
import { getAllBookings } from "../../api";
import BookingDetailsDialog from "../Booking/BookingDetailsDialog";
import { calculateEstimatedPrice, getStatusConfig } from "../Booking/bookingHelpers";

const API_IMAGE_BASE = "https://api.mrbikedoctor.cloud/";

const TABS = [
  { label: "Profile", icon: <PersonIcon fontSize="small" /> },
  { label: "Bikes", icon: <BikeIcon fontSize="small" /> },
  { label: "Bookings", icon: <BookingIcon fontSize="small" /> },
  { label: "Complaints", icon: <ComplaintIcon fontSize="small" /> },
];

const formatDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// userBike entries follow the same company_name/model_name/variant_name/engine_cc
// convention used for bike data everywhere else in this app (see BikeTable, BookingTable,
// SupportedBikesSection, etc.), with populated-ref (company_id/model_id) and legacy-shape
// fallbacks kept for resilience.
const normalizeBike = (bike = {}) => ({
  company:
    bike.company_name ||
    bike.company_id?.name ||
    bike.brand ||
    bike.bike_name ||
    bike.company ||
    null,
  model:
    bike.model_name ||
    bike.model_id?.model_name ||
    bike.model ||
    (bike.bike_name && bike.brand ? bike.bike_name : null) ||
    null,
  variant: bike.variant_name || bike.variant_id?.variant_name || bike.variant || null,
  engineCc:
    bike.engine_cc ||
    bike.cc ||
    bike.bike_cc ||
    bike.model_id?.engine_cc ||
    null,
  registrationNumber:
    bike.registration_number ||
    bike.registrationNumber ||
    bike.bike_number ||
    bike.plate_number ||
    null,
  isDefault: Boolean(bike.is_default ?? bike.isDefault ?? bike.default ?? false),
});

const normalizeBooking = (booking) => {
  const services = booking.services || [];
  const firstService =
    services[0]?.base_service_id?.name ||
    services[0]?.description ||
    services[0]?.serviceId ||
    "N/A";
  const serviceName =
    services.length > 1 ? `${firstService} +${services.length - 1} more` : firstService;

  const vehicle =
    [booking.bike?.company_name, booking.bike?.model_name].filter(Boolean).join(" ") ||
    "Unassigned";
  const plate =
    booking.bike?.plate_number || booking.userBike_id?.plate_number || null;

  return {
    raw: booking,
    bookingId: booking.bookingId || booking._id,
    bookingDate: booking.pickupDate || booking.createdAt,
    status: booking.vehicleLifecycleStatus || booking.status || "N/A",
    serviceName,
    dealerName: booking.dealer_id?.shopName || "Unassigned",
    totalAmount: calculateEstimatedPrice(booking),
    paymentStatus: booking.billStatus || "unpaid",
    vehicleUsed: plate ? `${vehicle} (${plate})` : vehicle,
  };
};

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
    </div>
  );
}

const SectionLoading = ({ label }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 1 }}>
    <CircularProgress size={32} />
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

const EmptyState = ({ text }) => (
  <Box sx={{ textAlign: "center", py: 5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
      {text}
    </Typography>
  </Box>
);

const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1, gap: 0.75 }}>
    {icon}
    <Typography variant="caption" sx={{ fontWeight: "bold", minWidth: 110, color: "text.secondary" }}>
      {label}:
    </Typography>
    <Typography variant="caption">{value || "N/A"}</Typography>
  </Box>
);

const CustomerDetailsModal = ({ open, customer, onClose }) => {
  const [tab, setTab] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);

  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation();

  const customerId = customer?._id;

  // Reuses the existing GET /customers/view/:id endpoint (already wired via RTK Query)
  // to refresh full profile + registered-bike data instead of relying only on the stale list row.
  const { data: fullCustomer, isFetching: profileLoading } = useGetCustomerByIdQuery(customerId, {
    skip: !open || !customerId,
  });

  const activeCustomer = fullCustomer || customer;

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);

  useEffect(() => {
    if (!open) {
      setTab(0);
      setConfirmDelete(false);
      setActionError(null);
      setBookings([]);
      setBookingsLoaded(false);
      setViewingBooking(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !customerId || bookingsLoaded) return;
    let cancelled = false;
    setBookingsLoading(true);
    setBookingsError(null);

    // No customer-scoped booking endpoint exists yet — reuses the existing
    // GET /bookings/getallbookings list and filters client-side by customer.
    getAllBookings()
      .then((response) => {
        if (cancelled) return;
        const all = response?.data || [];
        const mine = all.filter(
          (b) =>
            b.user_id?._id === customerId ||
            (customer?.customerId && b.user_id?.customerId === customer.customerId),
        );
        setBookings(mine);
        setBookingsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setBookingsError("Failed to load bookings for this customer.");
      })
      .finally(() => {
        if (!cancelled) setBookingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, customerId, customer?.customerId, bookingsLoaded]);

  const handleCloseDialog = () => {
    if (deleting) return;
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!customerId) return;
    setActionError(null);
    try {
      await deleteCustomer(customerId).unwrap();
      onClose();
    } catch (error) {
      setActionError(error?.data?.message || "Failed to delete customer.");
      setConfirmDelete(false);
    }
  };

  const getAvatarUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_IMAGE_BASE}${imagePath}`;
  };

  const getInitials = (c) => {
    const f = c?.first_name?.[0] || "";
    const l = c?.last_name?.[0] || "";
    return (f + l).toUpperCase() || "C";
  };

  const bikes = (activeCustomer?.userBike || []).map(normalizeBike);
  const normalizedBookings = bookings.map(normalizeBooking);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            m: { xs: 1, sm: 2 },
            width: { xs: "calc(100% - 16px)", sm: "calc(100% - 32px)" },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f8faff",
            pb: 2,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={getAvatarUrl(activeCustomer?.image)}
              sx={{ width: 52, height: 52, bgcolor: "#2e83ff", fontSize: "1.1rem" }}
            >
              {getInitials(activeCustomer)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
                {activeCustomer?.first_name} {activeCustomer?.last_name}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#2e83ff", fontWeight: "bold" }}>
                {activeCustomer?.customerId}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={activeCustomer?.isProfile ? "Profile Complete" : "Incomplete"}
              color={activeCustomer?.isProfile ? "success" : "default"}
              size="small"
            />
            <IconButton size="small" onClick={handleCloseDialog} disabled={deleting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 1, sm: 3 }, bgcolor: "#f8faff" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                minHeight: 48,
                gap: 0.5,
              },
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.label} icon={t.icon} iconPosition="start" label={t.label} />
            ))}
          </Tabs>
        </Box>

        {actionError && (
          <Alert severity="error" onClose={() => setActionError(null)} sx={{ mx: 3, mt: 2, borderRadius: 2 }}>
            {actionError}
          </Alert>
        )}

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto" }}>
          {/* Profile */}
          <TabPanel value={tab} index={0}>
            {profileLoading && !activeCustomer ? (
              <SectionLoading label="Loading profile…" />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "primary.main", mb: 1.5 }}>
                    CONTACT DETAILS
                  </Typography>
                  <InfoRow icon={<EmailIcon sx={{ fontSize: 14, color: "text.secondary" }} />} label="Email" value={activeCustomer?.email} />
                  <InfoRow icon={<PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />} label="Phone" value={activeCustomer?.phone?.toString()} />
                  <InfoRow icon={<LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />} label="Address" value={activeCustomer?.address} />
                  <InfoRow icon={<LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />} label="City" value={activeCustomer?.city} />
                  <InfoRow icon={<LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />} label="State" value={activeCustomer?.state} />
                  <InfoRow icon={<LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />} label="Pincode" value={activeCustomer?.pincode} />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "primary.main", mb: 1.5 }}>
                    ACCOUNT INFO
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
                    <RewardIcon sx={{ fontSize: 18, color: "#f5a623" }} />
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {activeCustomer?.reward_points ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">reward pts</Typography>
                  </Box>
                  <InfoRow label="Customer ID" value={activeCustomer?.customerId} />
                  <InfoRow label="Joined Date" value={formatDate(activeCustomer?.createdAt)} />
                  <InfoRow label="Last Updated" value={formatDate(activeCustomer?.updatedAt)} />
                  <InfoRow label="Profile Status" value={activeCustomer?.isProfile ? "Complete" : "Incomplete"} />
                </Box>
              </Box>
            )}
          </TabPanel>

          {/* Bikes */}
          <TabPanel value={tab} index={1}>
            {profileLoading && !activeCustomer ? (
              <SectionLoading label="Loading bikes…" />
            ) : bikes.length === 0 ? (
              <EmptyState text="No bikes registered." />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {bikes.map((bike, i) => (
                  <Paper key={i} elevation={0} sx={{ p: 2, border: "1px solid #e8edf3", borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        {[bike.company, bike.model].filter(Boolean).join(" ") || "Unknown Bike"}
                        {bike.variant ? ` (${bike.variant})` : ""}
                      </Typography>
                      {bike.isDefault && (
                        <Chip
                          label="Default"
                          size="small"
                          color="primary"
                          icon={<CheckCircleIcon fontSize="small" />}
                          sx={{ fontWeight: "bold", fontSize: "0.65rem" }}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(5, auto)" },
                        columnGap: 3,
                        rowGap: 1,
                      }}
                    >
                      <InfoRow label="Company" value={bike.company} />
                      <InfoRow label="Model" value={bike.model} />
                      <InfoRow label="Variant" value={bike.variant} />
                      <InfoRow label="Engine CC" value={bike.engineCc ? `${bike.engineCc} CC` : null} />
                      <InfoRow label="Reg. No" value={bike.registrationNumber} />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Bookings */}
          <TabPanel value={tab} index={2}>
            {bookingsLoading ? (
              <SectionLoading label="Loading bookings…" />
            ) : bookingsError ? (
              <Alert severity="error">{bookingsError}</Alert>
            ) : normalizedBookings.length === 0 ? (
              <EmptyState text="No bookings found." />
            ) : (
              <TableContainer sx={{ border: "1px solid #e8edf3", borderRadius: 2, overflowX: "auto" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8faff" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Booking ID</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Dealer</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Vehicle</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Payment</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {normalizedBookings.map((b) => {
                      const { color } = getStatusConfig(b.status);
                      return (
                        <TableRow key={b.raw._id} hover>
                          <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>{b.bookingId}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(b.bookingDate)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip label={b.status.replace(/_/g, " ")} color={color} size="small" sx={{ textTransform: "capitalize", fontSize: "0.7rem" }} />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{b.serviceName}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{b.dealerName}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{b.vehicleUsed}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold", color: "#2e7d32" }}>
                            ₹{b.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", textTransform: "capitalize" }}>{b.paymentStatus}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon fontSize="small" />}
                              onClick={() => setViewingBooking(b.raw)}
                              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              View Booking
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Complaints */}
          <TabPanel value={tab} index={3}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Complaint tracking isn't available yet — no complaints API exists in the backend for this feature.
            </Alert>
            <EmptyState text="No complaints found." />
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ p: 0, flexDirection: "column", alignItems: "stretch", bgcolor: "#f8faff" }}>
          {confirmDelete && (
            <Box
              sx={{
                px: 3,
                py: 2,
                bgcolor: "#fdecea",
                borderTop: "1px solid #ef9a9a",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, color: "#c62828" }}>
                Permanently delete "{activeCustomer?.first_name} {activeCustomer?.last_name}"? This cannot be undone.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                <Button size="small" variant="outlined" color="inherit" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  Yes, Delete
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", p: 2, gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" color="inherit" onClick={handleCloseDialog} disabled={deleting}>
              Close
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
              disabled={deleting || confirmDelete}
            >
              Delete Customer
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <BookingDetailsDialog
        open={Boolean(viewingBooking)}
        booking={viewingBooking}
        onClose={() => setViewingBooking(null)}
      />
    </>
  );
};

export default CustomerDetailsModal;

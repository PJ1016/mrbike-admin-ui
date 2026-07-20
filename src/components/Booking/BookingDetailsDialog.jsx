import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Avatar,
  Grid,
  Stack,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  TwoWheeler as TwoWheelerIcon,
  Storefront as StorefrontIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  DirectionsBike as BikeIcon,
  EditNote as NoteIcon,
  VerifiedUser as SecurityIcon,
  EventNote as CalendarIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  formatDate,
  getBookingAmount,
  getStatusConfig,
  getActiveStep,
  lifecycleSteps,
} from "./bookingHelpers";

// Reusable booking details view — used by the Bookings table and the Customer Details modal's
// "View Booking" action so both surfaces share the exact same booking view.
const BookingDetailsDialog = ({ open, booking, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          maxHeight: "90vh",
          m: { xs: 1, sm: 2, md: 3 },
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#f8f9fa",
          borderBottom: "1px solid #eee",
          p: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
            <NoteIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a" }}>
              Booking {booking?.bookingId}
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
              ID: {booking?._id?.substring(0, 12).toUpperCase()}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={(booking?.vehicleLifecycleStatus || booking?.status || "").replace(
            /_/g,
            " ",
          )}
          size="medium"
          sx={{
            fontWeight: 800,
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: 1,
            borderRadius: "8px",
            px: 1,
            bgcolor: `${getStatusConfig(booking?.vehicleLifecycleStatus || booking?.status).color}15`,
            color: `${getStatusConfig(booking?.vehicleLifecycleStatus || booking?.status).color}.dark`,
            border: `1px solid ${getStatusConfig(booking?.vehicleLifecycleStatus || booking?.status).color}30`,
          }}
        />
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#fff", overflowY: "auto" }}>
        {booking && (
          <>
            {/* Lifecycle Stepper */}
            <Box
              sx={{
                width: "100%",
                py: { xs: 2, sm: 5 },
                mb: 4,
                bgcolor: "#f8fafc",
                borderRadius: "16px",
                border: "1px solid #f1f5f9",
                overflowX: "auto",
              }}
            >
              <Stepper
                activeStep={getActiveStep(booking)}
                alternativeLabel
                sx={{
                  "& .MuiStepConnector-line": {
                    borderTopWidth: "2px",
                    borderRadius: "1px",
                  },
                  "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line": {
                    borderColor: "primary.main",
                  },
                  "& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
                    borderColor: "success.main",
                  },
                }}
              >
                {lifecycleSteps.map((label, index) => {
                  const stepStatus = getActiveStep(booking);
                  const isCompleted = index < stepStatus;
                  const isActive = index === stepStatus;

                  return (
                    <Step key={label} completed={isCompleted}>
                      <StepLabel
                        error={booking.status?.toLowerCase().includes("cancel")}
                        StepIconComponent={
                          booking.status?.toLowerCase().includes("cancel") && isActive
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
                              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
                            color: booking.status?.toLowerCase().includes("cancel") && isActive
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: "primary.soft", width: 32, height: 32 }}>
                    <PersonIcon sx={{ color: "primary.main", fontSize: 18 }} />
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 32 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Customer Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {booking.user_id?.first_name} {booking.user_id?.last_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 32 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Contact Number
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: "primary.main", mb: "2px" }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {booking.user_id?.phone || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ borderStyle: "dashed" }} />
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Avatar sx={{ bgcolor: "#f0f7ff", borderRadius: 2, width: 44, height: 44 }}>
                        <BikeIcon sx={{ color: "primary.main" }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "neutral.900" }}>
                          {booking.user_id?.customerId || "ID: ----"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5 }}
                        >
                          {[booking.bike?.company_name, booking.bike?.model_name]
                            .filter(Boolean)
                            .join(" ") || "Unassigned"}
                          {booking.bike?.variant_name ? ` (${booking.bike.variant_name})` : ""}
                          {booking.bike?.engine_cc ? ` · ${booking.bike.engine_cc} CC` : ""}
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
                          {booking.bike?.plate_number || booking.userBike_id?.plate_number || "No Plate"}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Section 2: Service Plan */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: "primary.soft", width: 32, height: 32 }}>
                    <CalendarIcon sx={{ color: "primary.main", fontSize: 18 }} />
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 32 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Fulfillment Mode
                      </Typography>
                      <Chip
                        icon={
                          booking.pickupAndDropId ? (
                            <TwoWheelerIcon sx={{ fontSize: "1rem !important" }} />
                          ) : (
                            <StorefrontIcon sx={{ fontSize: "1rem !important" }} />
                          )
                        }
                        label={booking.pickupAndDropId ? "Pick & Drop" : "In-Shop Visit"}
                        size="small"
                        color={booking.pickupAndDropId ? "secondary" : "info"}
                        sx={{
                          fontWeight: 700,
                          borderRadius: 1.5,
                          height: 24,
                          "& .MuiChip-label": { px: 1, py: 0 },
                          alignSelf: "center",
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 32 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Scheduled For
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatDate(booking.pickupDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 32 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Total Estimate
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 900, color: "success.main", display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Typography variant="h6" component="span" sx={{ fontWeight: 700, mt: 0.5 }}>
                          ₹
                        </Typography>
                        {getBookingAmount(booking).toLocaleString()}
                      </Typography>
                    </Box>
                    <Divider sx={{ borderStyle: "dashed" }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: "text.secondary", mb: 1, display: "block" }}
                      >
                        ENROLLED SERVICES
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {booking.services?.map((s, idx) => (
                          <Chip
                            key={idx}
                            label={s.base_service_id?.name || s.serviceId || "N/A"}
                            size="small"
                            variant="soft"
                            sx={{ color: "primary.main", bgcolor: "#f0f7ff", fontWeight: 700, fontSize: "0.7rem" }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Section 3: Verification & Security */}
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: "primary.soft", width: 32, height: 32 }}>
                    <SecurityIcon sx={{ color: "primary.main", fontSize: 18 }} />
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
                  sx={{ p: 3.5, borderRadius: 4, bgcolor: "#f1f5f9", border: "1px solid #e2e8f0" }}
                >
                  <Grid container spacing={4} alignItems="center">
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 700, mb: 1, display: "block", textTransform: "uppercase", fontSize: "0.65rem" }}
                      >
                        PICKUP OTP
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                          {booking.pickupOtp || "----"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 700, mb: 1, display: "block", textTransform: "uppercase", fontSize: "0.65rem" }}
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
                        {booking.deliveryOtp || "----"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 700, mb: 1, display: "block", textTransform: "uppercase", fontSize: "0.65rem" }}
                      >
                        BOOKED ON
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: "#64748b" }} />
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#1e293b" }}>
                          {formatDate(booking.createdAt)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 700, mb: 1, display: "block", textTransform: "uppercase", fontSize: "0.65rem" }}
                      >
                        BILL STATUS
                      </Typography>
                      <Chip
                        label={
                          booking.status?.toLowerCase().includes("cancel") &&
                          (booking.billStatus === "pending" || !booking.billStatus)
                            ? "VOIDED"
                            : booking.billStatus?.toUpperCase() || "UNPAID"
                        }
                        size="small"
                        color={
                          booking.status?.toLowerCase().includes("cancel") &&
                          (booking.billStatus === "pending" || !booking.billStatus)
                            ? "default"
                            : booking.billStatus === "paid"
                              ? "success"
                              : booking.billStatus === "cancelled"
                                ? "error"
                                : "warning"
                        }
                        sx={{ fontWeight: 900, fontSize: "0.65rem", borderRadius: 1.5, px: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, bgcolor: "#fff", borderTop: "1px solid #eee" }}>
        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          sx={{ borderRadius: 2, px: 4, py: 1.2, fontWeight: 800, textTransform: "none" }}
        >
          Close Dashboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDetailsDialog;

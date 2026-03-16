import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Container,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAllBookings } from "../../api";
import moment from "moment";

const BookingTrack = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllBookings();
      if (response.status === 200) {
        // Sort by date descending
        const sortedData = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setData(sortedData);
      } else {
        setError("Failed to fetch tracking data.");
      }
    } catch (error) {
      console.error("Error fetching bookings for tracking:", error);
      setError("An error occurred while fetching tracking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusChip = (status) => {
    const s = status?.toLowerCase() || "pending";
    let color = "default";
    let bgcolor = "neutral.100";
    let textColor = "neutral.600";

    if (s.includes("cancel") || s.includes("reject")) {
      bgcolor = "error.light";
      textColor = "error.main";
    } else if (["confirmed", "arrived", "pickedup"].includes(s)) {
      bgcolor = "info.light";
      textColor = "info.main";
    } else if (s === "completed") {
      bgcolor = "success.light";
      textColor = "success.main";
    } else if (s === "pending" || s === "waiting" || s.includes("created")) {
      bgcolor = "warning.light";
      textColor = "warning.main";
    }

    return (
      <Chip
        label={status || "Unknown"}
        size="small"
        sx={{ 
          fontWeight: 700, 
          textTransform: "capitalize",
          bgcolor: bgcolor,
          color: textColor,
          borderRadius: "20px",
          fontSize: "0.7rem",
          border: "none"
        }}
      />
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "#1e293b",
                    mb: 1,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Booking Tracking
                </Typography>
                <Breadcrumbs
                  separator={<NavigateNextIcon fontSize="small" />}
                  aria-label="breadcrumb"
                >
                  <Link
                    underline="hover"
                    color="inherit"
                    onClick={() => navigate("/")}
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                    Dashboard
                  </Link>
                  <Typography
                    color="text.primary"
                    sx={{ fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    Live Operations
                  </Typography>
                </Breadcrumbs>
              </Box>

              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchBookings} color="primary" sx={{ bgcolor: "white", boxShadow: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            {error && (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            )}

            <TableContainer sx={{ minHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>#</TableCell>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date & Time</TableCell>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Booking ID</TableCell>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Service</TableCell>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</TableCell>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dealer</TableCell>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</TableCell>
                    <TableCell sx={{ bgcolor: "#f1f5f9", color: "neutral.600", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                        <CircularProgress thickness={5} size={40} />
                        <Typography variant="body2" sx={{ mt: 2, color: "neutral.500", fontWeight: 500 }}>Loading live operations...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                        <Typography color="text.secondary">No bookings found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((booking, index) => (
                      <TableRow 
                        key={booking._id} 
                        hover
                        sx={{ "&:hover": { bgcolor: "neutral.50" }, transition: "background-color 0.2s" }}
                      >
                        <TableCell sx={{ color: "neutral.500", fontSize: "0.875rem" }}>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "neutral.800" }}>
                            {moment(booking.createdAt).format("DD MMM YYYY")}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "neutral.500", fontWeight: 500 }}>
                            {moment(booking.createdAt).format("hh:mm A")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.bookingId} 
                            size="small" 
                            sx={{ 
                              fontWeight: 700, 
                              bgcolor: "primary.light", 
                              color: "primary.main",
                              borderRadius: "6px",
                              fontSize: "0.75rem"
                            }} 
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                          {booking.services?.[0]?.base_service_id?.name || "General Service"}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "neutral.800" }}>
                            {booking.user_id?.first_name} {booking.user_id?.last_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "neutral.500" }}>
                            {booking.user_id?.phone}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {booking.dealer_id?.shopName ? (
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{booking.dealer_id.shopName}</Typography>
                          ) : (
                            <Chip 
                              label="Unassigned" 
                              size="small" 
                              variant="outlined"
                              color="error" 
                              sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20 }} 
                            />
                          )}
                        </TableCell>
                        <TableCell>{getStatusChip(booking.status)}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: "primary.main",
                                bgcolor: "primary.light",
                                "&:hover": { bgcolor: "primary.main", color: "white" }
                              }}
                              onClick={() => navigate(`/bookings`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>
      </div>
    </div>
  );
};

export default BookingTrack;
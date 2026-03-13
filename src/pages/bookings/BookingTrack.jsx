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
    if (s.includes("cancel")) color = "error";
    if (["confirmed", "arrived", "pickedup"].includes(s)) color = "primary";
    if (s === "completed") color = "success";
    if (s === "pending" || s === "waiting") color = "warning";

    return (
      <Chip
        label={status || "Unknown"}
        size="small"
        color={color}
        variant="filled"
        sx={{ fontWeight: "bold", textTransform: "capitalize" }}
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
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>Date & Time</TableCell>
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>Booking ID</TableCell>
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>Service</TableCell>
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>Customer</TableCell>
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>Dealer</TableCell>
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading live operations...</Typography>
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
                      <TableRow key={booking._id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {moment(booking.createdAt).format("DD MMM YYYY")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {moment(booking.createdAt).format("hh:mm A")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.bookingId} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: "bold", bgcolor: "#f1f5f9" }} 
                          />
                        </TableCell>
                        <TableCell>
                          {booking.services?.[0]?.base_service_id?.name || "General Service"}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {booking.user_id?.first_name} {booking.user_id?.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.user_id?.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {booking.dealer_id?.shopName || (
                            <Typography variant="caption" color="error" sx={{ fontWeight: "bold" }}>
                              Unassigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{getStatusChip(booking.status)}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => navigate(`/bookings`)} // In a real app, this would go to a detail page
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
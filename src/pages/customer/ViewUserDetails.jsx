import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Chip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  DirectionsBike as BikeIcon,
  Person as PersonIcon,
  EmojiEvents as RewardIcon,
  CardGiftcard as ReferralIcon,
  ConfirmationNumber as CodeIcon,
  Groups as ReferralsIcon,
  CheckCircle as CheckCircleIcon,
  CurrencyRupee as EarningsIcon,
} from "@mui/icons-material";
import {
  useGetCustomerByIdQuery,
  useGetReferredCustomersQuery,
} from "../../redux/services/customerApi";
import { getStatusConfig, formatDate } from "../../components/Booking/bookingHelpers";

// Reward status comes from ReferralTransaction ("credited"/"reversed") or the
// synthetic "Pending" value returned when no reward has been credited yet
// (see mrbike-backend getReferredCustomers) — not a booking status, so this
// stays separate from bookingHelpers' getStatusConfig.
const getRewardStatusConfig = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "credited") return { color: "success" };
  if (s === "reversed") return { color: "error" };
  return { color: "warning" };
};

const ViewUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";

  const { data: user, isLoading: loading } = useGetCustomerByIdQuery(id);
  const { data: referredCustomersData, isFetching: referredLoading, isError: referredError } =
    useGetReferredCustomersQuery(id, { skip: !id });
  const referredCustomers = referredCustomersData || [];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrapper">
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            User Details Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The requested customer information could not be retrieved.
          </Typography>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Box>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Customer Profile
          </Typography>
        </Box>

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <Avatar
              src={user.image ? `${IMAGE_BASE_URL}${user.image}` : ""}
              sx={{ width: 120, height: 120, mx: "auto", mb: 2, border: "4px solid #2e83ff" }}
            />
            <Typography variant="h6" fontWeight="bold">
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Customer ID: {user.customerId || "N/A"}
            </Typography>
            <Chip
              label={`Rewards: ${user.reward_points || 0}`}
              color="primary"
              variant="outlined"
              icon={<RewardIcon fontSize="small" />}
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>

        {/* Contact & Address Details */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ pt: 0 }}>
              <ListItem>
                <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Email Address" secondary={user.email || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Phone Number" secondary={user.phone || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocationIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Address" secondary={user.address || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Pincode" secondary={user.pincode || "N/A"} />
              </ListItem>
            </List>
          </Paper>

          {/* User Bikes */}
          <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Registered Bikes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {user.userBike && user.userBike.length > 0 ? (
              <Grid container spacing={2}>
                {user.userBike.map((bike, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                      <BikeIcon color="action" />
                      <Box>
                        <Typography variant="body1" fontWeight="600">
                          {bike.bike_name || "Unknown Bike"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Model: {bike.model_id?.model_name || "N/A"} | No: {bike.bike_number || "N/A"}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No bikes registered for this customer.
              </Typography>
            )}
          </Paper>

          {/* Referral Information */}
          <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Referral Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ pt: 0 }}>
              <ListItem>
                <ListItemIcon><ReferralIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Joined Via Referral" secondary={user.joinedViaReferral ? "Yes" : "No"} />
              </ListItem>
              {user.joinedViaReferral && (
                <>
                  <ListItem>
                    <ListItemIcon><CodeIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Referral Code Used" secondary={user.referralCodeUsed || "N/A"} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary="Referred By"
                      secondary={
                        user.referredBy
                          ? `${user.referredBy.name}${user.referredBy.referralCode ? ` (${user.referredBy.referralCode})` : ""}`
                          : "N/A"
                      }
                    />
                  </ListItem>
                </>
              )}
              <ListItem>
                <ListItemIcon><CodeIcon color="primary" /></ListItemIcon>
                <ListItemText primary="My Referral Code" secondary={user.myReferralCode || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemIcon><ReferralsIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Total Referrals" secondary={user.totalReferrals ?? 0} />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Successful Referrals" secondary={user.successfulReferrals ?? 0} />
              </ListItem>
              <ListItem>
                <ListItemIcon><EarningsIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Referral Earnings" secondary={`₹${(user.referralEarnings ?? 0).toLocaleString()}`} />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Referred Customers
            </Typography>
            {referredLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : referredError ? (
              <Typography variant="body2" color="error">
                Failed to load referred customers.
              </Typography>
            ) : referredCustomers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                This customer hasn't referred anyone yet.
              </Typography>
            ) : (
              <TableContainer sx={{ border: "1px solid #e8edf3", borderRadius: 2, overflowX: "auto" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8faff" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Customer ID</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Joined Date</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>First Booking Status</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Reward Amount</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Reward Status</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Booking ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {referredCustomers.map((r, i) => {
                      const { color: bookingColor } = getStatusConfig(r.firstBookingStatus);
                      const { color: rewardColor } = getRewardStatusConfig(r.rewardStatus);
                      return (
                        <TableRow key={r.customerId || i} hover>
                          <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold" }}>{r.customerName}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", fontFamily: "monospace" }}>{r.customerId || "N/A"}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(r.joinedDate)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip label={r.firstBookingStatus} color={bookingColor} size="small" sx={{ fontSize: "0.7rem" }} />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", fontWeight: "bold", color: "#2e7d32" }}>
                            ₹{(r.rewardAmount ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip label={r.rewardStatus} color={rewardColor} size="small" sx={{ textTransform: "capitalize", fontSize: "0.7rem" }} />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{r.bookingId || "N/A"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      </div>
    </div>
  );
};

export default ViewUserDetails;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  DirectionsBike as BikeIcon,
  Person as PersonIcon,
  EmojiEvents as RewardIcon,
} from "@mui/icons-material";
import { getCustomerById, getCustomerList } from "../../api";
import { selectUserById, fetchGlobalSearchData } from "../../redux/slices/searchSlice";

const ViewUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Use Redux state as primary source
  const userFromStore = useSelector((state) => selectUserById(state, id));
  
  const [user, setUser] = useState(userFromStore || null);
  const [loading, setLoading] = useState(!userFromStore);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";

  useEffect(() => {
    // If we already have the user from store, we're good
    if (userFromStore) {
      setUser(userFromStore);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      try {
        console.log("Fetching user with ID:", id);
        
        // Try direct fetch first
        try {
          const response = await getCustomerById(id);
          if (response.status === 200 || response.success) {
            setUser(response.data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Direct fetch failed, trying list fallback...");
        }

        // Fallback: Fetch everything and find (in case single-view is missing)
        const listRes = await getCustomerList();
        const found = (listRes.data || listRes).find(u => u._id === id || u.customerId === id);
        
        if (found) {
          setUser(found);
          // Also trigger search data refresh to populate store for next time
          dispatch(fetchGlobalSearchData());
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, userFromStore, dispatch]);

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
        </Grid>
      </Grid>
      </div>
    </div>
  );
};

export default ViewUserDetails;

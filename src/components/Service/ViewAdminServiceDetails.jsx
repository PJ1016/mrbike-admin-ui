import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Build as BuildIcon,
  Store as StoreIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { getAdminServiceById, getServiceList } from "../../api";
import { selectServiceById, fetchGlobalSearchData } from "../../redux/slices/searchSlice";

const ViewAdminServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const IMAGE_BASE_URL = "https://api.mrbikedoctor.cloud/";

  // Use Redux state as primary source
  const serviceFromStore = useSelector((state) => selectServiceById(state, id));

  const [service, setService] = useState(serviceFromStore || null);
  const [loading, setLoading] = useState(!serviceFromStore);

  useEffect(() => {
    // If we already have it in store
    if (serviceFromStore) {
      setService(serviceFromStore);
      setLoading(false);
      return;
    }

    const fetchService = async () => {
      setLoading(true);
      try {
        console.log("Fetching service with ID:", id);
        
        // Try direct fetch
        try {
          const response = await getAdminServiceById(id);
          if (response.status === 200 || response.success) {
            setService(response.data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Direct service fetch failed, trying list fallback...");
        }

        // Fallback
        const listRes = await getServiceList();
        const found = (listRes.data || listRes).find(s => s._id === id || s.serviceId === id);
        
        if (found) {
          setService(found);
          dispatch(fetchGlobalSearchData());
        }
      } catch (error) {
        console.error("Error fetching admin service details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, serviceFromStore, dispatch]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="page-wrapper">
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            Service Details Not Found
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
            Admin Service Details
          </Typography>
        </Box>

      <Grid container spacing={3}>
        {/* Core Service Info */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                src={service.base_service_id?.image ? `${IMAGE_BASE_URL}${service.base_service_id.image}` : ""}
                variant="rounded"
                sx={{ width: 64, height: 64, bgcolor: "primary.main" }}
              >
                <BuildIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {service.base_service_id?.name || "N/A"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Service ID: {service.serviceId || "N/A"}
                </Typography>
              </Box>
            </Box>

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <DescriptionIcon fontSize="small" /> Description
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
              {service.description || "No description provided."}
            </Typography>

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 4, display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon fontSize="small" /> Bike Pricing Grid
            </Typography>
            <Divider sx={{ my: 1 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>CC Range</TableCell>
                    <TableCell align="right">Price (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {service.bikes && service.bikes.length > 0 ? (
                    service.bikes.map((bike, index) => (
                      <TableRow key={index}>
                        <TableCell>{bike.cc} CC</TableCell>
                        <TableCell align="right">₹{bike.price}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center">No pricing data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Dealer & Meta info */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StoreIcon color="primary" /> Dealer Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List sx={{ pt: 0 }}>
              <ListItem>
                <ListItemText primary="Shop Name" secondary={service.dealer_id?.shopName || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Dealer ID" secondary={service.dealer_id?.dealerId || "N/A"} />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Created At: {new Date(service.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Last Updated: {new Date(service.updatedAt).toLocaleString()}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 4 }}
              onClick={() => navigate(`/edit-services/${service._id}`)}
            >
              Edit Service
            </Button>
          </Paper>
        </Grid>
      </Grid>
      </div>
    </div>
  );
};

export default ViewAdminServiceDetails;

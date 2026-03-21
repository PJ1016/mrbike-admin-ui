import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { getDealerServices } from "../../api";

const DealerServicesView = ({ dealerId }) => {
  const [loading, setLoading] = useState(true);
  const [pricingData, setPricingData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getDealerServices(dealerId);
        if (res?.status && Array.isArray(res.pricing)) {
          setPricingData(res.pricing);
        }
      } catch (err) {
        console.error("Failed to fetch dealer services", err);
        setError("Could not load service information.");
      } finally {
        setLoading(false);
      }
    };

    if (dealerId) {
      fetchData();
    }
  }, [dealerId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: "error.main" }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (pricingData.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">No active services configured for this dealer.</Typography>
      </Box>
    );
  }

  // Helper to get CC range display name
  const getCCDisplayName = (cc) => {
    if (cc >= 250) return "250+ CC";
    if (cc >= 150) return "150-200 CC";
    return "100-125 CC";
  };

  // Group by serviceId
  const grouped = pricingData.reduce((acc, item) => {
    const key = item.serviceId;
    if (!acc[key]) {
      acc[key] = {
        name: item.serviceName || `Service (${String(item.serviceId).slice(-4)})`,
        image: item.serviceImage,
        type: item.type,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${process.env.REACT_APP_API_IMAGE_URL || "https://api.mrbikedoctor.cloud"}/${image}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={4}>
        {Object.values(grouped).map((group, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper"
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Avatar
                src={getImageUrl(group.image)}
                variant="rounded"
                sx={{ width: 56, height: 56, bgcolor: "primary.light" }}
              />
              <Box>
                <Typography variant="h6" fontWeight="800">
                  {group.name}
                </Typography>
                <Chip
                  label={group.type === "base" ? "BASE SERVICE" : "ADDITIONAL SERVICE"}
                  size="small"
                  color={group.type === "base" ? "primary" : "secondary"}
                  sx={{ fontWeight: 700, mt: 0.5 }}
                />
              </Box>
            </Stack>

            <Divider sx={{ mb: 2, borderStyle: "dashed" }} />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>CC Range / Bike Class</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Service Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Correctly group by display name instead of raw CC number */}
                  {(() => {
                    const rangeMap = group.items.reduce((ranges, item) => {
                      const rangeName = getCCDisplayName(item.cc);
                      const price = item.price;
                      const compositeKey = `${rangeName}-${price}`;
                      
                      if (!ranges[compositeKey]) {
                         ranges[compositeKey] = { 
                           rangeName,
                           price,
                           bikes: []
                         };
                      }
                      ranges[compositeKey].bikes.push(item.bikeName);
                      return ranges;
                    }, {});

                    return Object.values(rangeMap).map((data, rIdx) => {
                      const uniqueBikes = Array.from(new Set(data.bikes));

                      return (
                        <TableRow key={rIdx}>
                          <TableCell sx={{ verticalAlign: "top", py: 2 }}>
                            <Typography variant="body2" fontWeight="700" color="primary.main">
                              {data.rangeName}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {uniqueBikes.map((bike, bIdx) => (
                                <Box 
                                  key={bIdx} 
                                  sx={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: 1,
                                    mb: 0.5 
                                  }}
                                >
                                  <Box 
                                    sx={{ 
                                      width: 4, 
                                      height: 4, 
                                      borderRadius: "50%", 
                                      bgcolor: "text.disabled" 
                                    }} 
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {bike}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ verticalAlign: "top", py: 2 }}>
                            <Typography variant="subtitle1" fontWeight="900" color="success.main">
                              ₹{data.price}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default DealerServicesView;

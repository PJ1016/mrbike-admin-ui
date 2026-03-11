import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AllServices from "./AllServices";
import { getAdditionalServices } from "../../api/additionalServiceApi";
import {
  Box,
  Typography,
  Button,
  Stack,
  Breadcrumbs,
} from "@mui/material";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DownloadIcon from "@mui/icons-material/Download";

const AServices = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tableHeaders = [
    "#",
    "Service ID",
    "Service Name",
    "Image",
    "Description",
    "Dealer Name",
    "Bike Details",
    "Created At",
    "Updated At",
    "Actions",
  ];

  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);

  const fetchServices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdditionalServices();
      setData(response?.data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("Failed to fetch additional services");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ py: 1 }}>
          {/* Header Layout Stack replacing old page-header */}
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <LibraryAddIcon sx={{ color: "#2e83ff", fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight="700" color="text.primary">
                    Additional Services
                  </Typography>
                  <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
                    <Typography color="text.secondary" variant="body2">
                      Dashboard
                    </Typography>
                    <Typography
                      color="text.primary"
                      variant="body2"
                      fontWeight="500"
                    >
                      Additional Services
                    </Typography>
                  </Breadcrumbs>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<DownloadIcon />}
                  onClick={() => triggerDownloadExcel.current?.()}
                  sx={{ color: "text.secondary", borderColor: "#e0e0e0", fontWeight: "bold" }}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<DownloadIcon />}
                  onClick={() => triggerDownloadPDF.current?.()}
                  sx={{ color: "text.secondary", borderColor: "#e0e0e0", fontWeight: "bold" }}
                >
                  PDF
                </Button>
                <Button
                  component={Link}
                  to="/create-additional-service"
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ fontWeight: "bold" }}
                >
                  Add New Services
                </Button>
              </Box>
            </Stack>
          </Box>

          <AllServices
            datas={data}
            loading={loading}
            error={error}
            triggerDownloadExcel={triggerDownloadExcel}
            triggerDownloadPDF={triggerDownloadPDF}
            tableHeaders={tableHeaders}
            text={"Additional Services"}
            onServiceDeleted={fetchServices}
          />
        </Box>
      </div>
    </div>
  );
};

export default AServices;

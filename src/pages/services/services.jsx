import { useRef, useState, useEffect } from "react";
import ServiceTable from "../../components/Service/ServiceTable";
import { Link } from "react-router-dom";
import { getServiceList } from "../../api";
import {
  Box,
  Typography,
  Button,
  Stack,
  Breadcrumbs,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import DownloadIcon from "@mui/icons-material/Download";

const Services = () => {
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  const tableHeaders = [
    "#",
    "Service ID",
    "Image",
    "Service Name",
    "Companies",
    "Dealer Name",
    "Dealer ID",
    "Created At",
    "Updated At",
    "Action",
  ];

  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await getServiceList();
        if (response && response.status === true) {
          setData(response.data || []);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <MiscellaneousServicesIcon sx={{ color: "#2e83ff", fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight="700" color="text.primary">
                    Services
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
                      Services
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
              </Box>
            </Stack>
          </Box>

          <ServiceTable
            datas={data}
            triggerDownloadExcel={triggerDownloadExcel}
            triggerDownloadPDF={triggerDownloadPDF}
            tableHeaders={tableHeaders}
            text="Services"
            onServiceDeleted={handleRefresh}
            loading={loading}
          />
        </Box>
      </div>
    </div>
  );
};

export default Services;

"use client";

import { useRef, useState, useEffect } from "react";
import BaseServiceTable from "../../components/Service/BaseServiceTable";
import { Link } from "react-router-dom";
import { getBaseServiceList } from "../../api";

import {
  Box,
  Typography,
  Button,
  Container,
  Stack,
  Breadcrumbs,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const BaseServices = () => {
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  const tableHeaders = [
    "#",
    "Service Image",
    "Service Name",
    "Created At",
    "Actions",
  ];

  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await getBaseServiceList();
        if (response && response.status === true) {
          setData(response.data || []);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching base services:", error);
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
              <Box>
                <Typography variant="h4" fontWeight="700" color="text.primary">
                  Base Services
                </Typography>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
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
              <Button
                component={Link}
                to="/create-base-service"
                variant="contained"
                color="primary"
                startIcon={<AddCircleOutlineIcon />}
              >
                Add Base Service
              </Button>
            </Stack>
          </Box>

          <BaseServiceTable
            datas={data}
            triggerDownloadExcel={triggerDownloadExcel}
            triggerDownloadPDF={triggerDownloadPDF}
            tableHeaders={tableHeaders}
            text="Base Services"
            onServiceDeleted={handleRefresh}
            loading={loading}
          />
        </Box>
      </div>
    </div>
  );
};

export default BaseServices;

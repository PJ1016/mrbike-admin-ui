import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Paper,
  Divider,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  FileDownload as DownloadIcon,
  Description as PdfIcon,
  TableChart as ExcelIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import BookingTable from "../../components/Booking/BookingTable";
import { getAllBookings } from "../../api";

const Bookings = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await getAllBookings();
        if (response.status === 200) {
          setData(response.data);
          setFilteredData(response.data);
        } else {
          setError("Failed to fetch bookings.");
        }
      } catch (error) {
        console.error("Error fetching booking list:", error);
        setError("An error occurred while fetching bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // ✅ Filter Logic
  useEffect(() => {
    if (statusFilter === "All") {
      setFilteredData(data);
    } else {
      setFilteredData(
        data.filter((b) => {
          const s = b.status?.toLowerCase() || "";
          if (statusFilter === "Cancelled") return s.includes("cancel");
          if (statusFilter === "Confirmed") return s === "confirmed" || s === "pickedup" || s === "arrived";
          if (statusFilter === "Pending") return s === "pending" || s === "waiting";
          return s === statusFilter.toLowerCase();
        })
      );
    }
  }, [statusFilter, data]);

  // ✅ Calculate Stats
  const stats = useMemo(() => {
    const total = data.length;
    const confirmed = data.filter((b) => {
      const s = b.status?.toLowerCase() || "";
      return ["confirmed", "completed", "pickedup", "arrived"].includes(s);
    }).length;
    const pending = data.filter((b) => {
      const s = b.status?.toLowerCase() || "";
      return ["pending", "waiting"].includes(s);
    }).length;
    const cancelled = data.filter((b) => b.status?.toLowerCase().includes("cancel")).length;
    const revenue = data.reduce((acc, curr) => acc + (curr.totalBill || curr.services[0]?.bikes[0]?.price || 0), 0);

    return [
      { label: "Total Bookings", value: total, color: "#2e83ff" },
      { label: "Confirmed/Active", value: confirmed, color: "#2e7d32" },
      { label: "Pending", value: pending, color: "#ed6c02" },
      { label: "Cancelled", value: cancelled, color: "#d32f2f" },
      { label: "Est. Revenue", value: `₹${revenue.toLocaleString()}`, color: "#9c27b0" },
    ];
  }, [data]);

  const statuses = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ minHeight: "100vh", pb: 5 }}>
          {/* Page Header */}
          <Box sx={{ mb: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
              <Link underline="hover" color="inherit" href="/" sx={{ display: "flex", alignItems: "center" }}>
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </Link>
              <Typography color="text.primary">Bookings</Typography>
            </Breadcrumbs>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
                mt: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    color: "primary.main",
                    fontSize: { xs: "1.75rem", sm: "2.125rem" },
                  }}
                >
                  Bookings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage and monitor all customer service bookings.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  width: { xs: "100%", sm: "auto" },
                  justifyContent: { xs: "flex-start", sm: "flex-end" },
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  onClick={() => triggerDownloadExcel.current?.()}
                  sx={{ borderRadius: 2, textTransform: "none", flex: { xs: 1, sm: "none" }, px: 3 }}
                >
                  Excel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  onClick={() => triggerDownloadPDF.current?.()}
                  sx={{ borderRadius: 2, textTransform: "none", flex: { xs: 1, sm: "none" }, px: 3 }}
                >
                  PDF
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Stats Overview */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 3, mb: 4 }}>
            {stats.map((stat, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  borderLeft: `6px solid ${stat.color}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                  {stat.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: stat.color }}>
                  {stat.value}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Status Filters */}
          <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {statuses.map((status) => (
              <Chip
                key={status}
                label={status}
                onClick={() => setStatusFilter(status)}
                color={statusFilter === status ? "primary" : "default"}
                variant={statusFilter === status ? "filled" : "outlined"}
                sx={{
                  px: 1,
                  fontWeight: statusFilter === status ? "bold" : "normal",
                  "&:hover": { bgcolor: statusFilter === status ? "primary.dark" : "grey.200" },
                }}
              />
            ))}
          </Box>

          {/* Main Table Section */}
          <Paper elevation={0} sx={{ p: 0, borderRadius: 2, bgcolor: "transparent" }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <BookingTable
              datas={filteredData}
              loading={loading}
              error={error}
              triggerDownloadExcel={triggerDownloadExcel}
              triggerDownloadPDF={triggerDownloadPDF}
            />
          </Paper>
        </Box>
      </div>
    </div>
  );
};

export default Bookings;

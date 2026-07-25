import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Chip,
  Alert,
} from "@mui/material";
import PageHeader from "../../components/Global/PageHeader";
import {
  getBaseServiceList,
  getBikeCompanies,
  getBikeCompatibilityByService,
  getBikeCompatibilityByBrand,
} from "../../api";

const BikeCompatibility = () => {
  const [tab, setTab] = useState("byService");

  const [services, setServices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [servicesRes, companiesRes] = await Promise.all([getBaseServiceList(), getBikeCompanies()]);
        setServices(servicesRes?.data || []);
        setCompanies(companiesRes?.data || []);
      } catch (err) {
        console.error("Error loading services/companies:", err);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const loadRows = async () => {
      setError(null);
      if (tab === "byService" && selectedServiceId) {
        setLoadingRows(true);
        try {
          const res = await getBikeCompatibilityByService(selectedServiceId);
          setRows(res?.data || []);
        } catch (err) {
          setError(err?.response?.data?.message || "Could not load compatibility data");
          setRows([]);
        } finally {
          setLoadingRows(false);
        }
      } else if (tab === "byBrand" && selectedCompanyId) {
        setLoadingRows(true);
        try {
          const res = await getBikeCompatibilityByBrand(selectedCompanyId);
          setRows(res?.data || []);
        } catch (err) {
          setError(err?.response?.data?.message || "Could not load compatibility data");
          setRows([]);
        } finally {
          setLoadingRows(false);
        }
      } else {
        setRows([]);
      }
    };
    loadRows();
  }, [tab, selectedServiceId, selectedCompanyId]);

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <PageHeader
            title="Bike Compatibility"
            breadcrumbs={[
              { label: "Dashboard", path: "/" },
              { label: "Bikes", path: "/bikes" },
              { label: "Compatibility", path: "#" },
            ]}
          />

          <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
            This is a read-only cross-reference of what dealers have configured — it reflects
            live <code>AdminService</code> data across every dealer, not an editable master mapping.
            To change which brands a service applies to, edit the service's bike settings from a
            dealer's own service configuration.
          </Alert>

          <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", p: 3 }}>
            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              sx={{ mb: 3, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
            >
              <Tab label="By Service" value="byService" />
              <Tab label="By Brand" value="byBrand" />
            </Tabs>

            {tab === "byService" ? (
              <Select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                displayEmpty
                size="small"
                fullWidth
                sx={{ mb: 3 }}
              >
                <MenuItem value="">
                  <em>Select a service…</em>
                </MenuItem>
                {services.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                displayEmpty
                size="small"
                fullWidth
                sx={{ mb: 3 }}
              >
                <MenuItem value="">
                  <em>Select a brand…</em>
                </MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loadingRows ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={32} sx={{ color: "#2563eb" }} />
              </Box>
            ) : rows.length === 0 ? (
              <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 4 }}>
                {tab === "byService"
                  ? selectedServiceId
                    ? "No dealer has configured a brand for this service yet."
                    : "Pick a service to see which brands it's compatible with."
                  : selectedCompanyId
                  ? "No dealer has configured this brand for any service yet."
                  : "Pick a brand to see which services apply to it."}
              </Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>
                      {tab === "byService" ? "Bike Brand" : "Service"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b" }} align="right">
                      Dealers Offering
                    </TableCell>
                    {tab === "byBrand" && (
                      <TableCell sx={{ fontWeight: 700, color: "#64748b" }} align="right">
                        Status
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.companyId || row.serviceId}>
                      <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{row.name}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={row.dealerCount}
                          size="small"
                          sx={{ fontWeight: 700, backgroundColor: "#eff6ff", color: "#2563eb" }}
                        />
                      </TableCell>
                      {tab === "byBrand" && (
                        <TableCell align="right">
                          <Chip
                            label={row.isActive ? "Active" : "Inactive"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              backgroundColor: row.isActive ? "#ecfdf5" : "#fef2f2",
                              color: row.isActive ? "#059669" : "#dc2626",
                            }}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default BikeCompatibility;

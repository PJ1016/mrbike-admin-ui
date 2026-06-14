import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ServiceListTab from "./ServiceListTab";
import {
  getDealerServices,
  saveDealerServices,
  clearDealerServicesCache,
} from "../../../api";

const SectionHeader = ({ icon, title, subtitle, color, borderColor, bgColor }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.5}
    sx={{
      px: 3,
      py: 2,
      bgcolor: bgColor,
      borderBottom: "1px solid",
      borderColor,
      borderRadius: "8px 8px 0 0",
    }}
  >
    <Box sx={{ color, display: "flex", alignItems: "center" }}>{icon}</Box>
    <Box>
      <Typography variant="subtitle1" fontWeight={800} sx={{ color }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  </Stack>
);

const DealerServicesManager = ({ dealer }) => {
  const dealerId = dealer?._id || dealer?.id;

  const [allPricing, setAllPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPricing = useCallback(async () => {
    if (!dealerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getDealerServices(dealerId);
      setAllPricing(Array.isArray(res?.pricing) ? res.pricing : []);
    } catch {
      setError("Failed to load dealer services. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [dealerId]);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  const handleSave = useCallback(
    async (newPricing) => {
      await saveDealerServices({ dealerId, pricing: newPricing });
      setAllPricing(newPricing);
      clearDealerServicesCache(dealerId);
    },
    [dealerId]
  );

  const basePricing = useMemo(
    () => allPricing.filter((p) => p.type === "base"),
    [allPricing]
  );
  const additionalPricing = useMemo(
    () => allPricing.filter((p) => p.type === "additional"),
    [allPricing]
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 10,
        }}
      >
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }} color="text.secondary" fontWeight={600}>
          Loading dealer services…
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: 480,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Base Services ── */}
      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <SectionHeader
          icon={<BuildIcon sx={{ fontSize: 20 }} />}
          title="Base Services"
          subtitle={`${new Set(basePricing.map((p) => p.serviceId)).size} services · ${basePricing.length} bike mappings`}
          color="#1565c0"
          borderColor="#bbdefb"
          bgColor="#e3f2fd"
        />
        <Box sx={{ p: 3 }}>
          <ServiceListTab
            key="base"
            serviceType="base"
            currentPricing={basePricing}
            allPricing={allPricing}
            dealerId={dealerId}
            onSave={handleSave}
          />
        </Box>
      </Paper>

      {/* ── Additional Services ── */}
      <Paper
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <SectionHeader
          icon={<AddCircleOutlineIcon sx={{ fontSize: 20 }} />}
          title="Additional Services"
          subtitle={`${new Set(additionalPricing.map((p) => p.serviceId)).size} services · ${additionalPricing.length} bike mappings`}
          color="#6a1b9a"
          borderColor="#e1bee7"
          bgColor="#f3e5f5"
        />
        <Box sx={{ p: 3 }}>
          <ServiceListTab
            key="additional"
            serviceType="additional"
            currentPricing={additionalPricing}
            allPricing={allPricing}
            dealerId={dealerId}
            onSave={handleSave}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default DealerServicesManager;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ServiceListTab from "./ServiceListTab";
import { getDealerServices, saveDealerServices, clearDealerServicesCache } from "../../../api";

const DealerServicesManager = ({ dealer }) => {
  const dealerId = dealer?._id || dealer?.id;

  const [tabIndex, setTabIndex] = useState(0);
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

  // Called by ServiceListTab / Wizard on every add / edit / delete
  const handleSave = useCallback(
    async (newPricing) => {
      await saveDealerServices({ dealerId, pricing: newPricing });
      // Update local state immediately — no need to re-fetch
      setAllPricing(newPricing);
      // Invalidate api-level cache so next full-page load gets fresh data
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
    <Box sx={{ bgcolor: "background.default", minHeight: 480 }}>
      {error && (
        <Alert severity="error" sx={{ mx: 3, mt: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "white",
          px: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          py={2}
          spacing={1}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Services Editor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure service pricing per bike for this dealer.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {basePricing.length + additionalPricing.length} total pricing records
            </Typography>
          </Stack>
        </Stack>

        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none", minWidth: 160 },
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          <Tab
            icon={<BuildIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Base Services (${new Set(basePricing.map((p) => p.serviceId)).size})`}
          />
          <Tab
            icon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Additional Services (${new Set(additionalPricing.map((p) => p.serviceId)).size})`}
          />
        </Tabs>
      </Paper>

      <Box sx={{ p: 3 }}>
        {tabIndex === 0 && (
          <ServiceListTab
            key="base"
            serviceType="base"
            currentPricing={basePricing}
            allPricing={allPricing}
            dealerId={dealerId}
            onSave={handleSave}
          />
        )}
        {tabIndex === 1 && (
          <ServiceListTab
            key="additional"
            serviceType="additional"
            currentPricing={additionalPricing}
            allPricing={allPricing}
            dealerId={dealerId}
            onSave={handleSave}
          />
        )}
      </Box>
    </Box>
  );
};

export default DealerServicesManager;

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Alert,
  Snackbar,
  Grid,
  Stack,
  Card,
  Skeleton,
} from "@mui/material";

// API Imports
import {
  addService,
  getBikeCompanies,
  filterBikesByCompaniesMultiple,
  getDealerList,
  getBaseServiceList,
  getAdminServiceById,
  updateAdminService,
} from "../../api";

// Modular Components
import ServiceConfigurationSection from "./service-form/ServiceConfigurationSection";
import BikeCompatibilitySection from "./service-form/BikeCompatibilitySection";
import PricingEngineSection from "./service-form/PricingEngineSection";
import PricingDistributionSummary from "./service-form/PricingDistributionSummary";
import BikePricingTable from "./service-form/BikePricingTable";
import BaseCatalogPreview from "./service-form/BaseCatalogPreview";
import PricingPreviewPanel from "./service-form/PricingPreviewPanel";
import FooterActions from "./service-form/FooterActions";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl =
    process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";
  return `${baseUrl}${imagePath}`;
};

const ServiceForm = ({ serviceId, dealerId, onDataLoaded }) => {
  const navigate = useNavigate();
  const isEditMode = !!serviceId;
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ base_service_id: "", description: "" });
  const [pricingRules, setPricingRules] = useState([]);
  const [newRule, setNewRule] = useState({ minCc: "", maxCc: "", price: "" });
  const [formErrors, setFormErrors] = useState({});

  // Data/Selection State
  const [baseServices, setBaseServices] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [selectedBaseService, setSelectedBaseService] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [ccFilter, setCcFilter] = useState("All");

  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "success" });

  useEffect(() => { if (!isLoading) setIsDirty(true); }, [formData, selectedBaseService, selectedDealer, selectedCompanies, pricingRules, bikes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [bsRes, cRes, dRes] = await Promise.all([getBaseServiceList(), getBikeCompanies(), getDealerList()]);
        const bsData = bsRes?.data || [];
        const cData = cRes?.data || [];
        const dData = dRes?.data || [];
        setBaseServices(bsData); setCompanies(cData); setDealers(dData);

        const urlParams = new URLSearchParams(window.location.search);
        const dIdParam = dealerId || urlParams.get("dealerId");
        if (dIdParam) {
          const preD = dData.find(d => d._id === dIdParam);
          if (preD) setSelectedDealer(preD);
        }

        if (isEditMode) {
          const res = await getAdminServiceById(serviceId);
          if (res?.data || res?.status === true) {
            const data = res.data;
            const bId = typeof data.base_service_id === "string" ? data.base_service_id : data.base_service_id?._id || "";
            setFormData({ base_service_id: bId, description: data.description || "" });
            setSelectedBaseService(bsData.find(s => s._id === bId) || null);

            const dIdLoaded = data.dealer_id ? (typeof data.dealer_id === "string" ? data.dealer_id : data.dealer_id._id) : "";
            setSelectedDealer(dData.find(d => d._id === dIdLoaded) || null);

            const cIds = (data.companies || []).map(c => typeof c === "string" ? c : c._id);
            setSelectedCompanies(cData.filter(c => cIds.includes(c._id)));

            if (data.companies?.length > 0) {
              const bRes = await filterBikesByCompaniesMultiple(cIds);
              if (bRes?.data) {
                const merged = bRes.data.map(item => {
                  const existing = data.bikes.find(sb => (sb.model_id?._id || sb.model_id) === item.model_id && (sb.variant_id?._id || sb.variant_id) === item.variant_id);
                  return { id: `${item.model_id}_${item.variant_id}`, company_name: item.company_name, model_name: item.model_name, variant_name: item.variant_name, cc: Number(item.engine_cc) || 0, manualPrice: existing?.price ? Number(existing.price) : null, model_id: item.model_id, variant_id: item.variant_id, dbId: existing?._id };
                });
                setBikes(merged); if (onDataLoaded) onDataLoaded(data);
              }
            } else if (onDataLoaded) onDataLoaded(data);
          } else { setAlertInfo({ show: true, message: "Failed to load service.", severity: "error" }); setTimeout(() => navigate("/services"), 2000); }
        }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchData();
  }, [serviceId, isEditMode, navigate]);

  useEffect(() => {
    const fetchBikes = async () => {
      if (selectedCompanies.length === 0) { if (!isEditMode || bikes.length === 0) setBikes([]); return; }
      try {
        const res = await filterBikesByCompaniesMultiple(selectedCompanies.map(c => c._id));
        if (res?.data) {
          const rows = res.data.map(i => ({ id: `${i.model_id}_${i.variant_id}`, company_name: i.company_name, model_name: i.model_name, variant_name: i.variant_name, cc: Number(i.engine_cc) || 0, manualPrice: null, model_id: i.model_id, variant_id: i.variant_id }));
          setBikes(prev => {
            const map = new Map(); prev.forEach(b => map.set(b.id, b));
            rows.forEach(b => { if (!map.has(b.id)) map.set(b.id, b); });
            const cNames = selectedCompanies.map(c => c.name.toLowerCase());
            return Array.from(map.values()).filter(b => cNames.includes(b.company_name.toLowerCase()));
          });
        }
      } catch (err) { console.error(err); }
    };
    fetchBikes();
  }, [selectedCompanies, isEditMode]);

  const addPricingRule = () => {
    const min = Number(newRule.minCc), max = Number(newRule.maxCc), prc = Number(newRule.price);
    if (min >= 0 && max >= min && prc > 0) {
      setPricingRules(prev => [...prev, { id: Date.now(), minCc: min, maxCc: max, price: prc }]);
      setNewRule({ minCc: "", maxCc: "", price: "" });
    } else setAlertInfo({ show: true, message: "Invalid rule.", severity: "warning" });
  };

  const allBikesWithPrices = useMemo(() => bikes.map(bike => {
    let computed = null;
    for (const r of pricingRules) { if (bike.cc >= r.minCc && bike.cc <= r.maxCc) { computed = r.price; break; } }
    const isManual = bike.manualPrice !== null && String(bike.manualPrice).trim() !== "";
    return { ...bike, computedPrice: computed, effectivePrice: isManual ? Number(bike.manualPrice) : computed, isManualOverride: isManual };
  }), [bikes, pricingRules]);

  const filteredBikes = useMemo(() => {
    let res = [...allBikesWithPrices];
    if (searchQuery) { const q = searchQuery.toLowerCase(); res = res.filter(b => b.model_name.toLowerCase().includes(q) || b.variant_name.toLowerCase().includes(q) || b.company_name.toLowerCase().includes(q)); }
    if (brandFilter !== "All") res = res.filter(b => b.company_name === brandFilter);
    if (ccFilter !== "All") { const [min, max] = ccFilter.split("-").map(Number); res = max ? res.filter(b => b.cc >= min && b.cc <= max) : res.filter(b => b.cc >= min); }
    return res;
  }, [allBikesWithPrices, searchQuery, brandFilter, ccFilter]);

  const priceDistribution = useMemo(() => {
    const dist = {}; allBikesWithPrices.forEach(b => { if (b.effectivePrice) dist[b.effectivePrice] = (dist[b.effectivePrice] || 0) + 1; });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [allBikesWithPrices]);

  const validate = () => {
    const errors = {};
    if (!selectedBaseService) errors.base_service_id = "Please select a base service";
    if (!formData.description?.trim()) errors.description = "Please enter a description";
    if (selectedCompanies.length === 0) errors.companies = "Please select at least one company";
    if (!selectedDealer) errors.dealer = "Please select a dealer";
    if (allBikesWithPrices.length > 0 && !allBikesWithPrices.some(b => b.effectivePrice > 0)) errors.noPrices = "At least one bike must have a price";
    setFormErrors(errors); return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!validate()) return; setIsSubmitting(true);
    const bikesPayload = allBikesWithPrices.filter(b => b.effectivePrice > 0).map(b => ({ model_id: b.model_id, variant_id: b.variant_id, cc: Number(b.cc), price: Number(b.effectivePrice), ... (b.dbId ? { _id: b.dbId } : {}) }));
    const payload = { base_service_id: selectedBaseService?._id, description: formData.description, companies: JSON.stringify(selectedCompanies.map(c => c._id)), dealer_id: selectedDealer?._id, bikes: JSON.stringify(bikesPayload) };
    try {
      const res = isEditMode ? await updateAdminService(serviceId, payload) : await addService(payload);
      if (res?.status === true || res?.status === 200) {
        setIsDirty(false); setAlertInfo({ show: true, message: `Success!`, severity: "success" });
        setTimeout(() => navigate("/services"), 1500);
      } else throw new Error(res.message || "Failed");
    } catch (err) { setAlertInfo({ show: true, message: err.message, severity: "error" }); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return (
    <Box sx={{ pb: 10 }}><Grid container spacing={3}><Grid item xs={12} lg={8}><Stack spacing={3}>{[1, 2, 3].map(i => <Card key={i} sx={{ borderRadius: "16px", p: 3, border: "1px solid", borderColor: "divider" }}><Skeleton variant="text" sx={{ width: "30%", mb: 2, height: 32 }} /><Skeleton variant="rectangular" sx={{ width: "100%", height: 120, borderRadius: "8px" }} /></Card>)}</Stack></Grid><Grid item xs={12} lg={4}><Stack spacing={3}><Card sx={{ borderRadius: "16px", p: 3, border: "1px solid", borderColor: "divider" }}><Skeleton variant="rectangular" sx={{ width: "100%", height: 200, borderRadius: "12px" }} /></Card><Card sx={{ borderRadius: "16px", p: 3, border: "1px solid", borderColor: "divider" }}><Skeleton variant="text" sx={{ width: "60%", mb: 2 }} /><Skeleton variant="rectangular" sx={{ width: "100%", height: 150, borderRadius: "8px" }} /></Card></Stack></Grid></Grid></Box>
  );

  return (
    <Box sx={{ pb: 10 }}>
      {alertInfo.show && alertInfo.severity === "error" && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlertInfo({ ...alertInfo, show: false })}>{alertInfo.message}</Alert>}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <ServiceConfigurationSection {...{ selectedBaseService, setSelectedBaseService, baseServices, selectedDealer, setSelectedDealer, dealers, formData, setFormData, formErrors, setFormErrors, dealerId, getImageUrl }} />
            <BikeCompatibilitySection {...{ selectedCompanies, setSelectedCompanies, companies, formErrors, setFormErrors }} />
            <PricingEngineSection {...{ pricingRules, setPricingRules, newRule, setNewRule, addPricingRule, deletePricingRule: id => setPricingRules(p => p.filter(r => r.id !== id)) }} />
            <PricingDistributionSummary priceDistribution={priceDistribution} />
            <BikePricingTable {...{ filteredBikes, processRowUpdate: (nR) => { const nMP = nR.effectivePrice === "" || nR.effectivePrice === null ? null : Number(nR.effectivePrice); setBikes(p => p.map(b => b.id === nR.id ? { ...b, manualPrice: nMP } : b)); return { ...nR, effectivePrice: nMP, isManualOverride: true }; }, handleProcessRowUpdateError: e => setAlertInfo({ show: true, message: e.message, severity: "error" }), searchQuery, setSearchQuery, brandFilter, setBrandFilter, ccFilter, setCcFilter, bikes }} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: "sticky" }, top: 100 }}>
              <BaseCatalogPreview selectedBaseService={selectedBaseService} getImageUrl={getImageUrl} />
              <PricingPreviewPanel allBikesWithPrices={allBikesWithPrices} />
            </Box>
          </Grid>
        </Grid>
        <FooterActions isDirty={isDirty} isSubmitting={isSubmitting} navigate={navigate} />
      </form>
      <Snackbar open={alertInfo.show && alertInfo.severity === "success"} autoHideDuration={3000} onClose={() => setAlertInfo({ ...alertInfo, show: false })} message={alertInfo.message} />
    </Box>
  );
};

export default ServiceForm;

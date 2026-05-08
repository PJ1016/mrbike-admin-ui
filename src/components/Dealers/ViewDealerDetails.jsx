"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Modal,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Breadcrumbs,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Rating,
} from "@mui/material";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFileAlt,
  FaUniversity,
  FaTools,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VerifiedIcon from "@mui/icons-material/Verified";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { getServiceList, getAdditionalServiceList } from "../../api";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import BusinessIcon from "@mui/icons-material/Business";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DealerServicesTab from "./DealerServicesTab";
import DealerServicesView from "./DealerServicesView";

// Helper to form image URLs correctly
const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = process.env.REACT_APP_IMAGE_BASE_URL || "";
  return `${baseUrl}${imagePath}`;
};

// Tab Panel Helper
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dealer-tabpanel-${index}`}
      aria-labelledby={`dealer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ImagePreview = ({ src, label }) => {
  const [open, setOpen] = useState(false);
  const BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "";
  const imageUrl = src
    ? src.startsWith("http")
      ? src
      : `${BASE_URL}${src}`
    : null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        gutterBottom
        color="text.secondary"
      >
        {label}
      </Typography>

      {src ? (
        <>
          <Box
            component="img"
            src={imageUrl || "/placeholder.svg"}
            alt={label}
            onClick={() => setOpen(true)}
            sx={{
              width: "100%",
              maxWidth: 240,
              height: 140,
              objectFit: "cover",
              cursor: "pointer",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
                borderColor: "primary.main",
              },
            }}
          />

          <Modal
            open={open}
            onClose={() => setOpen(false)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
            }}
          >
            <Box
              component="img"
              src={imageUrl || "/placeholder.svg"}
              sx={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                m: "auto",
                outline: "none",
                borderRadius: 2,
                boxShadow: 24,
                bgcolor: "background.paper",
              }}
            />
          </Modal>
        </>
      ) : (
        <Chip
          label="Not Uploaded"
          size="small"
          variant="outlined"
          color="default"
          sx={{ borderRadius: 1 }}
        />
      )}
    </Box>
  );
};

const VendorDealerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [dealerServices, setDealersServices] = useState([]);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const token = localStorage.getItem("token");

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const downloadDealerPDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF();

    const convertImageToBase64 = async (url) => {
      try {
        const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}cache_bust=${Date.now()}`;
        const res = await fetch(fetchUrl, {
          mode: "cors",
          credentials: "omit",
        });

        if (!res.ok) return null;
        const blob = await res.blob();

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        return null;
      }
    };

    doc.setFillColor(46, 131, 255);
    doc.rect(0, 0, 210, 40, "F");

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(dealer.shopName || "Dealer Profile", 15, 25);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 33);

    let yPos = 50;
    const addSection = (title) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(46, 131, 255);
      doc.setFont("helvetica", "bold");
      doc.text(title, 15, yPos);
      yPos += 2;
      doc.setDrawColor(46, 131, 255);
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 195, yPos);
      yPos += 8;
    };

    const addInfo = (label, value, xOffset = 15) => {
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, xOffset, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50);

      const splitValue = doc.splitTextToSize(String(value || "N/A"), 130);
      doc.text(splitValue, xOffset + 45, yPos);
      yPos += splitValue.length * 6 + 1;
    };

    addSection("Shop Information");
    addInfo("Shop Name", dealer.shopName || "N/A");
    addInfo("Shop Email", dealer.shopEmail || dealer.email || "N/A");
    addInfo("Shop Contact", dealer.shopContact || dealer.phone || "N/A");
    addInfo(
      "Full Address",
      dealer.permanentAddress?.address || dealer.fullAddress || "N/A",
    );
    addInfo(
      "City / State",
      `${dealer.permanentAddress?.city || dealer.city || "N/A"} / ${dealer.permanentAddress?.state || dealer.state || "N/A"}`,
    );
    addInfo("Pincode", dealer.shopPincode || "N/A");
    addInfo(
      "Commission / Tax / Pickup",
      `${dealer.commission || 0}% / ${dealer.tax || 0}% / Rs. ${dealer.pickupCharges || 0}`,
    );
    addInfo("Status", dealer.isActive ? "Active" : "Inactive");
    yPos += 5;

    if (Array.isArray(dealer.shopImages) && dealer.shopImages.length > 0) {
      addSection("Shop Images");
      const imgWidth = 40;
      const imgHeight = 30;
      let xOffset = 15;

      for (let i = 0; i < Math.min(dealer.shopImages.length, 4); i++) {
        const imgUrl = `${process.env.REACT_APP_IMAGE_BASE_URL}${dealer.shopImages[i]}`;
        const base64Img = await convertImageToBase64(imgUrl);

        if (base64Img) {
          try {
            const format = base64Img.split(";")[0].split("/")[1].toUpperCase();
            doc.addImage(
              base64Img,
              format === "JPEG" ? "JPEG" : "PNG",
              xOffset,
              yPos,
              imgWidth,
              imgHeight,
            );
            xOffset += imgWidth + 5;
          } catch (e) {}
        }
      }
      yPos += imgHeight + 10;
    }

    addSection("Owner Details");
    addInfo("Owner Name", dealer.ownerName || "N/A");
    addInfo("Owner Email", dealer.personalEmail || dealer.email || "N/A");
    addInfo("Owner Phone", dealer.phone || "N/A");
    addInfo("Alternate Phone", dealer.alternatePhone || "N/A");
    addInfo("Aadhar No.", dealer.aadharCardNo || "N/A");
    addInfo("PAN No.", (dealer.panCardNo || "N/A").toUpperCase());
    yPos += 10;

    addSection("KYC Documents");
    const docItems = [
      { label: "Aadhar Front", key: dealer.documents?.aadharFront },
      { label: "Aadhar Back", key: dealer.documents?.aadharBack },
      { label: "PAN Card", key: dealer.documents?.panCardFront },
      { label: "Passbook", key: dealer.bankDetails?.passbookImage },
    ];

    let docXOffset = 15;
    for (const docItem of docItems) {
      if (docItem.key) {
        const imgUrl = getImageUrl(docItem.key);
        const base64Img = await convertImageToBase64(imgUrl);

        if (base64Img) {
          try {
            const format = base64Img.split(";")[0].split("/")[1].toUpperCase();
            doc.setFontSize(8);
            doc.text(docItem.label, docXOffset, yPos);
            doc.addImage(
              base64Img,
              format === "JPEG" ? "JPEG" : "PNG",
              docXOffset,
              yPos + 2,
              40,
              30,
            );
            docXOffset += 45;
          } catch (e) {}
        }
      }
    }
    yPos += 45;

    addSection("Banking Details");
    addInfo("Account Holder", dealer.bankDetails?.accountHolderName);
    addInfo("Bank Name", dealer.bankDetails?.bankName);
    addInfo("Account Number", dealer.bankDetails?.accountNumber);
    addInfo("IFSC Code", dealer.bankDetails?.ifscCode);
    yPos += 5;

    addSection("Document Status");
    const docStatus = [
      ["Document Type", "Status"],
      [
        "Aadhar Card Front",
        dealer.documents?.aadharFront ? "Uploaded" : "Pending",
      ],
      [
        "Aadhar Card Back",
        dealer.documents?.aadharBack ? "Uploaded" : "Pending",
      ],
      [
        "PAN Card Front",
        dealer.documents?.panCardFront ? "Uploaded" : "Pending",
      ],
      ["Passbook", dealer.bankDetails?.passbookImage ? "Uploaded" : "Pending"],
      ["Shop Profile", dealer.isProfile ? "Completed" : "Incomplete"],
      ["Verification", dealer.isVerify ? "Verified" : "Unverified"],
    ];

    doc.autoTable({
      body: docStatus,
      startY: yPos,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });
    yPos = doc.lastAutoTable.finalY + 15;

    if (dealerServices.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(46, 131, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Service & Pricing Information", 15, yPos);
      yPos += 5;

      const serviceRows = [];
      dealerServices.forEach((service, sIdx) => {
        if (service.bikes && service.bikes.length > 0) {
          service.bikes.forEach((bike, bIdx) => {
            serviceRows.push([
              bIdx === 0 ? sIdx + 1 : "",
              bIdx === 0 ? service.name : "",
              `${bike.cc} CC`,
              `Rs. ${bike.price}`,
              bIdx === 0
                ? new Date(service.createdAt).toLocaleDateString()
                : "",
            ]);
          });
        }
      });

      doc.autoTable({
        head: [
          ["#", "Service Name", "Bike Capacity", "Service Price", "Listed On"],
        ],
        body: serviceRows,
        startY: yPos,
        theme: "grid",
        headStyles: { fillColor: [46, 131, 255], textColor: 255 },
        styles: { fontSize: 9 },
      });
    }

      doc.save(`${dealer.shopName.replace(/\s/g, "_")}_Full_Profile.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      Swal.fire('Error', 'Failed to generate PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    const fetchDealer = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor"}/dealer/view/${id}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load dealer");
        setDealer(data);
      } catch (err) {
        Swal.fire("Error", err.message, "error");
        navigate("/dealers");
      } finally {
        setLoading(false);
      }
    };

    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const [servicesRes, addServicesRes] = await Promise.all([
          getServiceList(),
          getAdditionalServiceList(),
        ]);

        if (
          servicesRes &&
          servicesRes.status === true &&
          Array.isArray(servicesRes.data)
        ) {
          const dealerAssignedServices = servicesRes.data.filter((service) => {
            const serviceDealerId =
              service.dealer_id?._id ||
              service.dealer_id ||
              service.dealer?._id ||
              service.dealer;
            return serviceDealerId === id;
          });
          setDealersServices(dealerAssignedServices);
        } else {
          setDealersServices([]);
        }

        if (
          addServicesRes &&
          addServicesRes.status === true &&
          Array.isArray(addServicesRes.data)
        ) {
          const dealerAddServices = addServicesRes.data.filter((service) => {
            const serviceDealerId =
              service.dealer_id?._id ||
              service.dealer_id ||
              service.dealer?._id ||
              service.dealer;
            return serviceDealerId === id;
          });
          setAdditionalServices(dealerAddServices);
        } else {
          setAdditionalServices([]);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setDealersServices([]);
        setAdditionalServices([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
    fetchDealer();
  }, [id, navigate, token]);

  // Group services by base_service_id
  const groupedServices = React.useMemo(() => {
    const groups = {};
    dealerServices.forEach((service) => {
      const baseId =
        service.base_service_id?._id || service.base_service_id || "unknown";
      if (!groups[baseId]) {
        groups[baseId] = {
          details: service.base_service_id || {
            name: service.name || "Unknown Service",
          },
          instances: [],
        };
      }
      groups[baseId].instances.push(service);
    });
    return Object.values(groups);
  }, [dealerServices]);

  const groupedAdditionalServices = React.useMemo(() => {
    const groups = {};
    additionalServices.forEach((service) => {
      const baseId =
        service.base_additional_service_id?._id ||
        service.base_additional_service_id ||
        "unknown";
      if (!groups[baseId]) {
        groups[baseId] = {
          details: service.base_additional_service_id || {
            name: service.name || "Unknown Service",
          },
          instances: [],
        };
      }
      groups[baseId].instances.push(service);
    });
    return Object.values(groups);
  }, [additionalServices]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ mt: 2, fontWeight: 500 }} color="text.secondary">
          Loading Dealer Profile...
        </Typography>
      </Box>
    );
  }

  if (!dealer) return <Alert severity="error">Dealer not found.</Alert>;

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 64,
                  height: 64,
                  boxShadow: "0 4px 12px rgba(46, 131, 255, 0.2)",
                }}
              >
                <StorefrontIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight="800"
                  color="text.primary"
                  sx={{ letterSpacing: -0.5 }}
                >
                  {dealer.shopName}
                </Typography>
                <Breadcrumbs aria-label="breadcrumb">
                  <Typography color="text.secondary" variant="body2">
                    Operations
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Dealers
                  </Typography>
                  <Typography
                    color="text.primary"
                    variant="body2"
                    fontWeight="600"
                  >
                    Profile
                  </Typography>
                </Breadcrumbs>
              </Box>
              <Chip
                label={dealer.isActive ? "ACTIVE" : "INACTIVE"}
                color={dealer.isActive ? "success" : "error"}
                size="small"
                sx={{
                  ml: 1,
                  fontWeight: "800",
                  height: 24,
                  fontSize: "0.65rem",
                }}
              />
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={pdfLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={downloadDealerPDF}
              disabled={pdfLoading}
              sx={{ fontWeight: "700", borderRadius: 2, px: 3 }}
            >
              {pdfLoading ? 'Generating...' : 'Export'}
            </Button>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                fontWeight: "700",
                bgcolor: "white",
                color: "text.primary",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 3,
                "&:hover": { bgcolor: "grey.50" },
              }}
            >
              Back
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content Card */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            bgcolor: "white",
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="dealer profile tabs"
            sx={{
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
              "& .MuiTab-root": {
                fontWeight: "700",
                minWidth: 120,
                py: 3,
                fontSize: "0.9rem",
                color: "text.secondary",
                "&.Mui-selected": { color: "primary.main" },
              },
            }}
          >
            <Tab
              icon={<StorefrontIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Overview"
            />
            <Tab
              icon={<BusinessIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="KYC & Docs"
            />
            <Tab
              icon={<SettingsIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Active Pricing"
            />
            <Tab
              icon={<AccountBalanceIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Banking"
            />
            <Tab
              icon={<FaTools style={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Services Editor"
            />
          </Tabs>
        </Box>

        <Box sx={{ bgcolor: "#f8fafc" }}>
          <CardContent sx={{ p: 0 }}>
            {/* TAB 1: OVERVIEW */}
            <CustomTabPanel value={tabIndex} index={0}>
              <Box sx={{ px: 4, pb: 5 }}>
                <Grid container spacing={5}>
                  <Grid item xs={12} md={7}>
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="800"
                        gutterBottom
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: "primary.main",
                        }}
                      >
                        <StorefrontIcon sx={{ mr: 1, fontSize: 20 }} /> SHOP
                        DETAILS
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            EMAIL ADDRESS
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {dealer.shopEmail || dealer.email || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            CONTACT NUMBER
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {dealer.shopContact || dealer.phone || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            SHOP ADDRESS
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {dealer.permanentAddress?.address ||
                              dealer.fullAddress ||
                              "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            CITY / STATE
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {dealer.permanentAddress?.city ||
                              dealer.city ||
                              "N/A"}{" "}
                            /{" "}
                            {dealer.permanentAddress?.state ||
                              dealer.state ||
                              "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            COMMISSION RATE
                          </Typography>
                          <Chip
                            label={`${dealer.commission || 0}%`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: "primary.50",
                              color: "primary.main",
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            PICKUP CHARGES
                          </Typography>
                          <Typography variant="body1" fontWeight="600" color="primary.main">
                            ₹{dealer.pickupCharges || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            MIN WALLET AMOUNT
                          </Typography>
                          <Typography variant="body1" fontWeight="600" color={dealer.minWalletAmount ? "success.main" : "text.secondary"}>
                            ₹{dealer.minWalletAmount || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="800"
                        gutterBottom
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: "primary.main",
                        }}
                      >
                        <PhotoLibraryIcon sx={{ mr: 1, fontSize: 20 }} /> SHOP
                        GALLERY
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={2}>
                        {Array.isArray(dealer.shopImages) &&
                        dealer.shopImages.length > 0 ? (
                          dealer.shopImages.slice(0, 6).map((img, i) => (
                            <Grid item xs={6} sm={4} key={i}>
                              <ImagePreview
                                src={img}
                                label={`Image ${i + 1}`}
                              />
                            </Grid>
                          ))
                        ) : (
                          <Grid item xs={12}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 4,
                                textAlign: "center",
                                borderStyle: "dashed",
                                bgcolor: "grey.50",
                              }}
                            >
                              <Typography
                                color="text.secondary"
                                variant="body2"
                              >
                                No shop images have been uploaded yet.
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Box
                      sx={{
                        mb: 4,
                        p: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                        bgcolor: "#fafafa",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="800"
                        gutterBottom
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: "primary.main",
                        }}
                      >
                        <FaUser style={{ marginRight: 8 }} /> OWNER INFO
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Stack spacing={2.5}>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            FULL NAME
                          </Typography>
                          <Typography variant="body1" fontWeight="700">
                            {dealer.ownerName || "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            EMAIL
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {dealer.personalEmail || dealer.email || "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            PHONE
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {dealer.phone || "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            AADHAR CARD NO.
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {dealer.aadharCardNo || "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="700"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            PAN CARD NO.
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight="600"
                            sx={{ textTransform: "uppercase" }}
                          >
                            {dealer.panCardNo || "N/A"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CustomTabPanel>

            {/* TAB 2: DOCUMENTS */}
            <CustomTabPanel value={tabIndex} index={1}>
              <Box sx={{ px: 4, pb: 5 }}>
                <Typography
                  variant="h6"
                  fontWeight="800"
                  gutterBottom
                  color="primary.main"
                >
                  AADHAR & PAN DOCUMENTS
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Verified identity documents for this merchant outlet.
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6} md={4}>
                    <ImagePreview
                      src={dealer.documents?.aadharFront}
                      label="Aadhar Card (Front)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <ImagePreview
                      src={dealer.documents?.aadharBack}
                      label="Aadhar Card (Back)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <ImagePreview
                      src={dealer.documents?.panCardFront}
                      label="PAN Card (Front)"
                    />
                  </Grid>
                </Grid>
              </Box>
            </CustomTabPanel>

            {/* TAB 3: SERVICES */}
            <CustomTabPanel value={tabIndex} index={2}>
              <Box sx={{ px: 4, pb: 5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight="800"
                      color="primary.main"
                    >
                      ACTIVE DEALER SERVICES
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Currently active pricing that is visible to customers in
                      the marketplace.
                    </Typography>
                  </Box>
                </Box>

                {servicesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <DealerServicesView dealerId={id} />
                )}
              </Box>
            </CustomTabPanel>

            {/* TAB 4: BANKING */}
            <CustomTabPanel value={tabIndex} index={3}>
              <Box sx={{ px: 4, pb: 5 }}>
                <Typography
                  variant="h6"
                  fontWeight="800"
                  gutterBottom
                  color="primary.main"
                >
                  SETTLEMENT ACCOUNT
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Primary bank account for automated payouts and refunds.
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    maxWidth: 640,
                  }}
                >
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight="700"
                        sx={{ display: "block", mb: 1 }}
                      >
                        ACCOUNT HOLDER NAME
                      </Typography>
                      <Typography variant="h6" fontWeight="700">
                        {dealer?.bankDetails?.accountHolderName ||
                          "UNSPECIFIED"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight="700"
                        sx={{ display: "block", mb: 1 }}
                      >
                        BANK NAME
                      </Typography>
                      <Typography variant="body1" fontWeight="700">
                        {dealer?.bankDetails?.bankName || "UNSPECIFIED"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight="700"
                        sx={{ display: "block", mb: 1 }}
                      >
                        ACCOUNT NUMBER
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="800"
                        sx={{ letterSpacing: 1.5, color: "text.primary" }}
                      >
                        {dealer?.bankDetails?.accountNumber || "UNSPECIFIED"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight="700"
                        sx={{ display: "block", mb: 1 }}
                      >
                        IFSC CODE
                      </Typography>
                      <Chip
                        label={dealer?.bankDetails?.ifscCode || "N/A"}
                        sx={{ fontWeight: 800, bgcolor: "grey.100", px: 1 }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4 }}>
                    <ImagePreview
                      src={dealer?.bankDetails?.passbookImage}
                      label="Passbook / Cancelled Cheque Image"
                    />
                  </Box>

                  <Alert
                    severity="info"
                    variant="outlined"
                    icon={<AccountBalanceIcon />}
                    sx={{ mt: 5, borderRadius: 2, borderStyle: "dashed" }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="700"
                      sx={{ display: "block" }}
                    >
                      AUDIT NOTE
                    </Typography>
                    <Typography variant="caption">
                      Ensure the account name matches the identity documents
                      provided in the KYC tab.
                    </Typography>
                  </Alert>
                </Paper>
              </Box>
            </CustomTabPanel>

            {/* TAB 5: REPORTS */}
            <CustomTabPanel value={tabIndex} index={4}>
              {dealer ? (
                <DealerServicesTab dealer={dealer} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}
            </CustomTabPanel>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
};

export default VendorDealerDetails;

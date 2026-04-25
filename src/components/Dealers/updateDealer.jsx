"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Stack,
  Button,
  FormControlLabel,
  Checkbox,
  IconButton,
  Divider,
  CircularProgress,
  InputAdornment,
  Chip,
} from "@mui/material";
import {
  Storefront as ShopIcon,
  Person as PersonIcon,
  AccountBalance as BankIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AddPhotoAlternate as AddIcon,
  CheckCircle as SuccessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import StateCitySelect from "../Global/StateCitySelect";
import Swal from "sweetalert2";
import { addDealer, updateDealer } from "../../api";
import { useNavigate } from "react-router-dom";

const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "";
const getImageUrl = (path) => !path ? null : path.startsWith("http") ? path : `${IMAGE_BASE_URL}${path}`;

const DealerForm = ({ dealerData, dealerId, isEdit }) => {
  const navigate = useNavigate();
  const [shopImages, setShopImages] = useState([]);
  const [existingShopImages, setExistingShopImages] = useState([]);
  const [existingImages, setExistingImages] = useState({
    panCardFront: null,
    aadharFront: null,
    aadharBack: null,
  });

  const initializeFormData = () => {
    if (isEdit && dealerData) {
      return {
        shopName: dealerData.shopName || "",
        email: dealerData.shopEmail || dealerData.email || "",
        phone: dealerData.phone || "",
        shopPincode: dealerData.shopPincode || "",
        ownerName: dealerData.ownerName || "",
        fullAddress: dealerData.permanentAddress?.address || "",
        city: dealerData.permanentAddress?.city || "",
        state: dealerData.permanentAddress?.state || "",
        comission: dealerData.commission || "",
        tax: dealerData.tax || "",
        latitude: dealerData.latitude || "",
        longitude: dealerData.longitude || "",
        personalEmail: dealerData.personalEmail || "",
        personalPhone: dealerData.phone || "",
        alternatePhone: dealerData.phone || "",
        shopState: dealerData.shopState || "Madhya Pradesh",
        shopCity: dealerData.shopCity || "Indore",
        shopPinCode: dealerData.shopPinCode || "",
        accountHolderName: dealerData.bankDetails?.accountHolderName || "",
        ifscCode: dealerData.bankDetails?.ifscCode || "",
        bankName: dealerData.bankDetails?.bankName || "",
        accountNumber: dealerData.bankDetails?.accountNumber || "",
        permanentAddress: dealerData.permanentAddress?.address || "",
        presentAddress: dealerData.presentAddress?.address || "",
        permanentState: dealerData.permanentAddress?.state || "",
        permanentCity: dealerData.permanentAddress?.city || "",
        presentState: dealerData.presentAddress?.state || "",
        presentCity: dealerData.presentAddress?.city || "",
        aadharCardNo: dealerData.aadharCardNo || "",
        panCardNo: dealerData.panCardNo || "",
      };
    }
    return {
      shopName: "",
      email: "",
      phone: "",
      shopPincode: "",
      ownerName: "",
      fullAddress: "",
      city: "",
      state: "",
      comission: "",
      tax: "",
      latitude: "",
      longitude: "",
      personalEmail: "",
      personalPhone: "",
      alternatePhone: "",
      shopState: "Madhya Pradesh",
      shopCity: "Indore",
      shopPinCode: "",
      accountHolderName: "",
      ifscCode: "",
      bankName: "",
      accountNumber: "",
      permanentAddress: "",
      presentAddress: "",
      permanentState: "",
      permanentCity: "",
      presentState: "",
      presentCity: "",
      aadharCardNo: "",
      panCardNo: "",
    };
  };

  const [formData, setFormData] = useState(initializeFormData());
  const [errors, setErrors] = useState({});
  const [previewUrls, setPreviewUrls] = useState([]);
  const [panCardFront, setPanCardFront] = useState(null);
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAadhar = (number) => /^\d{12}$/.test(number);
  const validatePAN = (number) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(number);

  useEffect(() => {
    if (isEdit && dealerData) {
      setFormData(initializeFormData());
      setExistingShopImages(
        dealerData.shopImages?.length > 0
          ? dealerData.shopImages.map((img) => getImageUrl(img))
          : []
      );
      setExistingImages({
        panCardFront: getImageUrl(dealerData.documents?.panCardFront || dealerData.panCardFront),
        aadharFront: getImageUrl(dealerData.documents?.aadharFront || dealerData.aadharFront),
        aadharBack: getImageUrl(dealerData.documents?.aadharBack || dealerData.aadharBack),
      });
      setSameAsPermanent(
        dealerData.presentAddress?.address === dealerData.permanentAddress?.address &&
        dealerData.presentAddress?.state === dealerData.permanentAddress?.state &&
        dealerData.presentAddress?.city === dealerData.permanentAddress?.city
      );
    }
  }, [dealerData, isEdit]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "sameAsPermanent") {
      setSameAsPermanent(checked);
      if (checked) {
        setFormData((prev) => ({
          ...prev,
          presentAddress: prev.permanentAddress,
          presentState: prev.permanentState,
          presentCity: prev.permanentCity,
        }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    if (name === "aadharCardNo") {
      if (value && !validateAadhar(value)) {
        setErrors((prev) => ({ ...prev, aadharCardNo: "Aadhar must be 12 digits" }));
      } else {
        setErrors((prev) => ({ ...prev, aadharCardNo: "" }));
      }
    }

    if (name === "panCardNo") {
      if (value && !validatePAN(value)) {
        setErrors((prev) => ({ ...prev, panCardNo: "Invalid PAN format" }));
      } else {
        setErrors((prev) => ({ ...prev, panCardNo: "" }));
      }
    }

    if (errors[name] && name !== "aadharCardNo" && name !== "panCardNo") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileUpload = (e, setter, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      setExistingImages((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleMultipleImages = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingShopImages.length + shopImages.length + files.length;
    if (totalImages > 5) {
      Swal.fire("Limit Exceeded", "You can upload a maximum of 5 shop images.", "warning");
      return;
    }
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setShopImages((prev) => [...prev, ...files]);
  };

  const handleRemoveImage = (index, isExisting = false) => {
    if (isExisting) {
      setExistingShopImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
      setShopImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData();
    if (isEdit && dealerId) form.append("id", dealerId);

    Object.keys(formData).forEach((key) => {
      form.append(key, formData[key]);
    });

    if (panCardFront) form.append("panCardFront", panCardFront);
    if (aadharFront) form.append("aadharFront", aadharFront);
    if (aadharBack) form.append("aadharBack", aadharBack);
    existingShopImages.forEach((url) => form.append("existingShopImages", url));
    shopImages.forEach((file) => form.append("shopImages", file));

    try {
      const response = isEdit ? await updateDealer(form) : await addDealer(form);
      if (response.success) {
        Swal.fire("Success!", response.message, "success");
        navigate("/dealers");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to save dealer", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 5 }, borderRadius: 4, border: "1px solid #edf2f7" }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: "#2e83ff", fontWeight: 700, mb: 1 }}>
              Shop Information
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Shop Name" name="shopName" value={formData.shopName} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Shop Email" name="email" value={formData.email} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Shop Contact" name="phone" value={formData.phone} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Shop Pincode" name="shopPincode" value={formData.shopPincode} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Full Shop Address" name="fullAddress" value={formData.fullAddress} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12}>
            <StateCitySelect value={formData} onChange={handleChange} stateName="state" cityName="city" errors={errors} stateLabel="Shop State" cityLabel="Shop City" />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}><Chip label="Owner & Contacts" size="small" /></Divider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Personal Email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Aadhar Card No." 
              name="aadharCardNo" 
              value={formData.aadharCardNo} 
              onChange={handleChange} 
              error={!!errors.aadharCardNo}
              helperText={errors.aadharCardNo || "12-digit Aadhaar number"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="PAN Card No." 
              name="panCardNo" 
              value={formData.panCardNo} 
              onChange={handleChange} 
              error={!!errors.panCardNo}
              helperText={errors.panCardNo || "10-character alphanumeric PAN"}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}><Chip label="Bank & Economics" size="small" /></Divider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}><Chip label="Documents" size="small" /></Divider>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Shop Images</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {existingShopImages.map((url, idx) => (
                <Box key={`ext-${idx}`} sx={{ position: "relative", width: 120, height: 120 }}>
                  <img src={url} alt="Shop" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                  <IconButton size="small" onClick={() => handleRemoveImage(idx, true)} sx={{ position: "absolute", top: 4, right: 4, bgcolor: "white" }}><DeleteIcon color="error" fontSize="small" /></IconButton>
                </Box>
              ))}
              {previewUrls.map((url, idx) => (
                <Box key={`pre-${idx}`} sx={{ position: "relative", width: 120, height: 120 }}>
                  <img src={url} alt="Shop" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                  <IconButton size="small" onClick={() => handleRemoveImage(idx, false)} sx={{ position: "absolute", top: 4, right: 4, bgcolor: "white" }}><DeleteIcon color="error" fontSize="small" /></IconButton>
                </Box>
              ))}
              <Button component="label" variant="outlined" sx={{ width: 120, height: 120, borderStyle: "dashed" }}>
                <AddIcon />
                <input type="file" hidden multiple accept="image/*" onChange={handleMultipleImages} />
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="caption" display="block">PAN FRONT</Typography>
            {existingImages.panCardFront && <img src={existingImages.panCardFront} alt="PAN" style={{ width: "100%", height: 100, objectFit: "cover", marginBottom: 8 }} />}
            <Button fullWidth component="label" variant="outlined" startIcon={<UploadIcon />}>
              Upload PAN
              <input type="file" hidden onChange={(e) => handleFileUpload(e, setPanCardFront, "panCardFront")} />
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" display="block">AADHAR FRONT</Typography>
            {existingImages.aadharFront && <img src={existingImages.aadharFront} alt="AADHAR" style={{ width: "100%", height: 100, objectFit: "cover", marginBottom: 8 }} />}
            <Button fullWidth component="label" variant="outlined" startIcon={<UploadIcon />}>
              Upload Front
              <input type="file" hidden onChange={(e) => handleFileUpload(e, setAadharFront, "aadharFront")} />
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" display="block">AADHAR BACK</Typography>
            {existingImages.aadharBack && <img src={existingImages.aadharBack} alt="AADHAR BACK" style={{ width: "100%", height: 100, objectFit: "cover", marginBottom: 8 }} />}
            <Button fullWidth component="label" variant="outlined" startIcon={<UploadIcon />}>
              Upload Back
              <input type="file" hidden onChange={(e) => handleFileUpload(e, setAadharBack, "aadharBack")} />
            </Button>
          </Grid>

          <Grid item xs={12} sx={{ mt: 4 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="text" onClick={() => navigate("/dealers")}>Cancel</Button>
              <Button variant="contained" type="submit" disabled={isSubmitting} sx={{ px: 4, bgcolor: "#2e83ff" }}>
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEdit ? "Update Dealer" : "Create Dealer")}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default DealerForm;

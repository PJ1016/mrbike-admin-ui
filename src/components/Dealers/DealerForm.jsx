import React, { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
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
  Lock as LockIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { addDealer } from "../../api";
import { useNavigate } from "react-router-dom";

const steps = [
  "Shop Details",
  "Owner, Bank & Documents",
];

const STATE_CITY_DATA = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh"],
  Bihar: ["Patna", "Gaya", "Bhagalpur"],
  Chhattisgarh: ["Raipur", "Bilaspur", "Durg"],
  Goa: ["Panaji", "Margao", "Mapusa"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Haryana: ["Gurgaon", "Faridabad", "Panipat", "Ambala"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Manipur: ["Imphal"],
  Meghalaya: ["Shillong"],
  Mizoram: ["Aizawl"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Sikkim: ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  Tripura: ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
  Uttarakhand: ["Dehradun", "Haridwar", "Nainital"],
  "West Bengal": ["Kolkata", "Asansol", "Siliguri"],
};

const DealerForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [panCardFront, setPanCardFront] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharFrontPreview, setAadharFrontPreview] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [aadharBackPreview, setAadharBackPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Shop Details
    shopName: "",
    email: "",
    phone: "",
    password: "",
    shopPincode: "",
    fullAddress: "",
    state: "Telangana",
    city: "Hyderabad",
    comission: "",
    tax: "",
    latitude: "",
    longitude: "",
    // Personal Details
    ownerName: "",
    aadharCardNo: "",
    panCardNo: "",
    // Bank Details
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "state") updated.city = "";
      return updated;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve({
                file: compressedFile,
                preview: URL.createObjectURL(compressedFile),
              });
            },
            "image/jpeg",
            0.7,
          );
        };
      };
    });
  };

  const [shopImages, setShopImages] = useState([]); // Real files for submission

  const handleMultipleImages = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - previewUrls.length);
    for (const file of files) {
      const { file: optimized, preview } = await compressImage(file);
      setShopImages((prev) => [...prev, optimized]);
      setPreviewUrls((prev) => [...prev, preview]);
    }
  };

  const handleRemoveImage = (index) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setShopImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = async (e, fileSetter, previewSetter) => {
    const file = e.target.files[0];
    if (file) {
      const { file: optimized, preview } = await compressImage(file);
      fileSetter(optimized);
      previewSetter(preview);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const apiData = new FormData();
    Object.keys(formData).forEach((key) => apiData.append(key, formData[key]));

    // Use compressed shop images
    shopImages.forEach((file) => apiData.append("shopImages", file));

    if (panCardFront) apiData.append("panCardFront", panCardFront);
    if (aadharFront) apiData.append("aadharFront", aadharFront);
    if (aadharBack) apiData.append("aadharBack", aadharBack);

    try {
      const res = await addDealer(apiData);
      if (res.success) {
        Swal.fire("Success", "Dealer added successfully", "success");
        navigate("/dealers");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGridRow = (items) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, 1fr)",
        },
        gap: 3,
        mb: 3,
        alignItems: "start",
      }}
    >
      {items.map((item, idx) => (
        <Box key={idx} sx={{ width: "100%" }}>
          {item}
        </Box>
      ))}
    </Box>
  );

  const renderStep0 = () => (
    <Box>
      <Typography
        variant="h5"
        sx={{
          color: "#2e83ff",
          fontWeight: 800,
          mb: 3,
          pb: 1,
          borderBottom: "2px solid #eef2f6",
        }}
      >
        Shop Information
      </Typography>
      {renderGridRow([
        <TextField
          fullWidth
          label="Shop Name"
          name="shopName"
          value={formData.shopName}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ShopIcon color="action" />
              </InputAdornment>
            ),
          }}
        />,
        <TextField
          fullWidth
          label="Shop Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
        />,
        <TextField
          fullWidth
          label="Shop Contact"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
          }}
        />,
      ])}
      {renderGridRow([
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
          }}
        />,
        <TextField
          fullWidth
          label="Shop Pincode"
          name="shopPincode"
          value={formData.shopPincode}
          onChange={handleChange}
          required
        />,
        <TextField
          fullWidth
          label="Full Shop Address"
          name="fullAddress"
          value={formData.fullAddress}
          onChange={handleChange}
          required
        />,
      ])}
      {renderGridRow([
        <FormControl fullWidth required>
          <InputLabel>Shop State</InputLabel>
          <Select
            name="state"
            value={formData.state}
            label="Shop State"
            onChange={handleChange}
          >
            {Object.keys(STATE_CITY_DATA).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>,
        <FormControl fullWidth required disabled={!formData.state}>
          <InputLabel>Shop City</InputLabel>
          <Select
            name="city"
            value={formData.city}
            label="Shop City"
            onChange={handleChange}
          >
            {(STATE_CITY_DATA[formData.state] || []).map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>,
        <TextField
          fullWidth
          label="Commission (%)"
          name="comission"
          value={formData.comission}
          onChange={handleChange}
          required
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
        />,
      ])}
      <Divider sx={{ mb: 3 }}>
        <Chip label="Economics & Location" size="small" />
      </Divider>
      {renderGridRow([
        <TextField
          fullWidth
          label="Tax (%)"
          name="tax"
          value={formData.tax}
          onChange={handleChange}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
        />,
        <TextField
          fullWidth
          label="Latitude"
          name="latitude"
          value={formData.latitude}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
          }}
        />,
        <TextField
          fullWidth
          label="Longitude"
          name="longitude"
          value={formData.longitude}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
          }}
        />,
      ])}
    </Box>
  );

  const renderStep1 = () => (
    <Box>
      {/* Owner Information */}
      <Typography
        variant="h5"
        sx={{
          color: "#2e83ff",
          fontWeight: 800,
          mb: 3,
          pb: 1,
          borderBottom: "2px solid #eef2f6",
        }}
      >
        Owner Information
      </Typography>
      {renderGridRow([
        <TextField
          fullWidth
          label="Owner Name"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
        />,
        <TextField
          fullWidth
          label="Aadhar Card No."
          name="aadharCardNo"
          value={formData.aadharCardNo}
          onChange={handleChange}
          required
        />,
        <TextField
          fullWidth
          label="PAN Card No."
          name="panCardNo"
          value={formData.panCardNo}
          onChange={handleChange}
          required
        />,
      ])}

      {/* Bank Information */}
      <Typography
        variant="h5"
        sx={{
          color: "#2e83ff",
          fontWeight: 800,
          mb: 3,
          mt: 5,
          pb: 1,
          borderBottom: "2px solid #eef2f6",
        }}
      >
        Bank Information
      </Typography>
      {renderGridRow([
        <TextField
          fullWidth
          label="Account Number"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleChange}
          required
        />,
        <TextField
          fullWidth
          label="IFSC Code"
          name="ifscCode"
          value={formData.ifscCode}
          onChange={handleChange}
          required
        />,
        <TextField
          fullWidth
          label="Account Holder Name"
          name="accountHolderName"
          value={formData.accountHolderName}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
        />,
      ])}
      {renderGridRow([
        <TextField
          fullWidth
          label="Bank Name"
          name="bankName"
          value={formData.bankName}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BankIcon color="action" />
              </InputAdornment>
            ),
          }}
        />,
        <div />,
        <div />,
      ])}

      {/* Documents & Verification */}
      <Typography
        variant="h5"
        sx={{
          color: "#2e83ff",
          fontWeight: 800,
          mb: 3,
          mt: 5,
          pb: 1,
          borderBottom: "2px solid #eef2f6",
        }}
      >
        Documents & Verification
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#475467",
          }}
        >
          <ShopIcon color="primary" /> Shop Images (Max 5)
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {previewUrls.map((url, idx) => (
            <Paper
              key={idx}
              sx={{
                position: "relative",
                width: 120,
                height: 120,
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                size="small"
                onClick={() => handleRemoveImage(idx)}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "rgba(255,255,255,0.8)",
                }}
              >
                <DeleteIcon color="error" fontSize="small" />
              </IconButton>
            </Paper>
          ))}
          {previewUrls.length < 5 && (
            <Button
              component="label"
              variant="outlined"
              sx={{
                width: 120,
                height: 120,
                borderStyle: "dashed",
                borderRadius: 2,
                flexDirection: "column",
              }}
            >
              <AddIcon color="disabled" sx={{ mb: 1 }} />
              <Typography variant="caption">Add</Typography>
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleMultipleImages}
              />
            </Button>
          )}
        </Stack>
      </Box>

      {renderGridRow([
        <Box>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, mb: 1, display: "block", color: "#475467" }}
          >
            PAN CARD FRONT
          </Typography>
          {panPreview && (
            <Paper
              sx={{
                mb: 1.5,
                height: 140,
                overflow: "hidden",
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <img
                src={panPreview}
                alt="PAN Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Paper>
          )}
          <Button
            fullWidth
            component="label"
            variant="outlined"
            startIcon={
              panCardFront ? <SuccessIcon color="success" /> : <UploadIcon />
            }
            sx={{ borderRadius: 2, py: 1 }}
          >
            {panCardFront ? "Regenerate" : "Upload PAN"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) =>
                handleFileChange(e, setPanCardFront, setPanPreview)
              }
            />
          </Button>
        </Box>,
        <Box>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, mb: 1, display: "block", color: "#475467" }}
          >
            AADHAR FRONT
          </Typography>
          {aadharFrontPreview && (
            <Paper
              sx={{
                mb: 1.5,
                height: 140,
                overflow: "hidden",
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <img
                src={aadharFrontPreview}
                alt="Aadhar Front Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Paper>
          )}
          <Button
            fullWidth
            component="label"
            variant="outlined"
            startIcon={
              aadharFront ? <SuccessIcon color="success" /> : <UploadIcon />
            }
            sx={{ borderRadius: 2, py: 1 }}
          >
            {aadharFront ? "Regenerate" : "Upload Aadhar Front"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) =>
                handleFileChange(e, setAadharFront, setAadharFrontPreview)
              }
            />
          </Button>
        </Box>,
        <Box>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, mb: 1, display: "block", color: "#475467" }}
          >
            AADHAR BACK
          </Typography>
          {aadharBackPreview && (
            <Paper
              sx={{
                mb: 1.5,
                height: 140,
                overflow: "hidden",
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <img
                src={aadharBackPreview}
                alt="Aadhar Back Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Paper>
          )}
          <Button
            fullWidth
            component="label"
            variant="outlined"
            startIcon={
              aadharBack ? <SuccessIcon color="success" /> : <UploadIcon />
            }
            sx={{ borderRadius: 2, py: 1 }}
          >
            {aadharBack ? "Regenerate" : "Upload Aadhar Back"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) =>
                handleFileChange(e, setAadharBack, setAadharBackPreview)
              }
            />
          </Button>
        </Box>,
      ])}
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: "1px solid #eef2f6" }}
    >
      <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel sx={{ "& .MuiStepLabel-label": { fontWeight: 600 } }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && renderStep0()}
      {activeStep === 1 && renderStep1()}

      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-end"
        sx={{ mt: 5 }}
      >
        {activeStep > 0 && (
          <Button onClick={handleBack} variant="outlined" size="large">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          disabled={isSubmitting}
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          sx={{ minWidth: 150 }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : activeStep === steps.length - 1 ? (
            "Submit"
          ) : (
            "Next"
          )}
        </Button>
      </Stack>
    </Paper>
  );
};

export default DealerForm;

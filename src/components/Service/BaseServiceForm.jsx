import { useState, useEffect } from "react";
import {
  createBaseService,
  getBaseServiceById,
  updateBaseService,
} from "../../api";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Breadcrumbs,
  Stack,
  Snackbar,
} from "@mui/material";
import { BsStars } from "react-icons/bs";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import SettingsIcon from "@mui/icons-material/Settings";
import PageHeader from "../Global/PageHeader";

const AI_API_URL =
  process.env.REACT_APP_AI_API_URL || "/ai/generate";

const BaseServiceForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (isEdit && id) {
      const fetchService = async () => {
        try {
          setIsLoading(true);
          const response = await getBaseServiceById(id);
          if (response && response.data) {
            const service = response.data;
            setFormData({
              name: service.name || "",
              description: service.description || "",
            });
            setExistingImage(service.image || null);
          }
        } catch (error) {
          console.error("Error fetching service:", error);
          setGlobalError("Failed to load service details. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchService();
    }
  }, [isEdit, id]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Service name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!isEdit && !image) {
      errors.image = "Service image is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
      setFormErrors((prev) => ({ ...prev, image: null })); // clear image error
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) return;

    setIsGenerating(true);
    setGlobalError(null);
    try {
      const { data } = await axios.post(AI_API_URL, {
        prompt: `Write a clear, professional description for a bike service called "${formData.name}". Please provide the description ONLY as a short list of bullet points using standard dashes (-). Do not use any markdown formatting like asterisks (**) for bolding. Do not include any introductory text, conversational filler, or concluding remarks.`,
      });

      if (data?.result) {
        setFormData((prev) => ({ ...prev, description: data.result }));
      }
    } catch (error) {
      console.error("Failed to generate description:", error);
      setSnackbar({ open: true, message: "Failed to generate AI description", severity: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGlobalError(null);

    const isValid = validate();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      if (image) form.append("image", image);

      let response;
      if (isEdit) {
        response = await updateBaseService(id, form);
      } else {
        response = await createBaseService(form);
      }

      if (response?.status === true || response?.status === 200 || response?.message) {
        setSnackbar({
          open: true,
          message: `Service successfully ${isEdit ? "updated" : "created"}.`,
          severity: "success"
        });
        
        // Wait a brief moment before navigating back to let the snackbar show
        setTimeout(() => {
          navigate("/MajorServices");
        }, 1200);
      }
    } catch (error) {
      const err = error.response?.data;
      if (err?.field) {
        setFormErrors((prev) => ({ ...prev, [err.field]: err.message }));
      } else {
        setGlobalError(err?.message || "An unexpected error occurred during submission");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common props for standard TextFields
  const fieldProps = {
    fullWidth: true,
    variant: "outlined",
    size: "small",
    onChange: handleChange,
    InputLabelProps: { shrink: true },
  };

  const renderImageSection = () => {
    const hasImage = previewUrl || existingImage;

    return (
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: hasImage ? "auto" : "120px",
            minHeight: hasImage ? "200px" : "120px",
            borderRadius: 2,
            border: `1px dashed ${formErrors.image ? "#d32f2f" : "#d1d5db"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {hasImage ? (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                p: 2,
              }}
            >
              <img
                src={previewUrl || existingImage}
                alt="Preview"
                style={{
                  maxHeight: "250px",
                  maxWidth: "100%",
                  borderRadius: "4px",
                }}
              />
              <IconButton
                onClick={() => {
                  setImage(null);
                  setPreviewUrl(null);
                  if (isEdit) setExistingImage(null);
                }}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "rgba(255,255,255,0.9)",
                  "&:hover": { bgcolor: "#fff" },
                }}
                size="small"
              >
                <DeleteIcon color="error" fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Button
              component="label"
              fullWidth
              sx={{
                height: "100%",
                flexDirection: "column",
                gap: 1,
                color: "text.secondary",
                textTransform: "none",
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 32, color: "#9ca3af" }} />
              <Typography variant="body2" fontWeight={500}>
                Upload Service Image {!isEdit && "*"}
              </Typography>
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
          )}
        </Box>

        {formErrors.image && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 0.5, ml: 1, display: "block" }}
          >
            {formErrors.image}
          </Typography>
        )}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ py: 1 }}>
          <PageHeader
            title={isEdit ? "Edit Base Service" : "Add Base Service"}
            breadcrumbs={[
              { label: "Dashboard", path: "/" },
              { label: "Services", path: "/MajorServices" },
              { label: isEdit ? "Edit" : "Add", path: "#" },
            ]}
          />

          <Box sx={{ width: "100%", maxWidth: "800px" }}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 2,
                width: "100%",
                border: "1px solid #e0e0e0",
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    
                    {globalError && (
                      <Alert severity="error" sx={{ mb: 1 }}>
                        {globalError}
                      </Alert>
                    )}

                    <TextField
                      {...fieldProps}
                      label="Service Name"
                      name="name"
                      value={formData.name}
                      error={!!formErrors.name}
                      helperText={formErrors.name}
                      required
                      placeholder="e.g. General Service"
                    />

                    <TextField
                      {...fieldProps}
                      label="Service Description"
                      name="description"
                      value={formData.description}
                      multiline
                      rows={6}
                      required
                      error={!!formErrors.description}
                      helperText={formErrors.description}
                      placeholder="Enter description..."
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end" sx={{ alignSelf: "flex-end", mb: 1, mr: -1 }}>
                            <Tooltip title="Generate description with AI">
                              <IconButton
                                color="primary"
                                onClick={handleGenerateDescription}
                                disabled={!formData.name.trim() || isGenerating}
                              >
                                {isGenerating ? <CircularProgress size={24} /> : <BsStars />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {renderImageSection()}

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate("/MajorServices")}
                        disabled={isSubmitting}
                        sx={{ fontWeight: "bold" }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{ fontWeight: "bold", minWidth: 140 }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : isEdit ? (
                          "Update Service"
                        ) : (
                          "Create Service"
                        )}
                      </Button>
                    </Box>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </div>
      
      {/* Snackbar for Success messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BaseServiceForm;

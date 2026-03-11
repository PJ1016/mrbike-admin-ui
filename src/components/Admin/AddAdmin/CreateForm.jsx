import React, { useState, useMemo } from "react";
import { createUser } from "../../../api";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Badge as RoleIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

function CreateForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    role: "Admin", // Default role set to Admin
  });

  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const roleOptions = useMemo(
    () => ["Telecaller", "Manager", "Admin", "Subadmin", "Executive"],
    []
  );

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email = "Invalid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.mobile.trim()) {
      errors.mobile = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = "Phone number must be 10 digits";
    }

    if (!formData.role) {
      errors.role = "Role is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await createUser(formData);

      if (response.status === 200 && response.success) {
        setFormData({ name: "", email: "", password: "", mobile: "", role: "" });
        navigate("/admins");
      } else {
        console.error("User creation failed", response.message);
      }
    } catch (error) {
      console.error("User creation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ name: "", email: "", password: "", mobile: "", role: "" });
    setFormErrors({});
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        border: "1px solid #edf2f7",
        maxWidth: 800,
        mx: "auto",
      }}
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a202c", mb: 4 }}>
          Admin Information
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              placeholder="Secure Password"
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobile"
              placeholder="10 digit number"
              value={formData.mobile}
              onChange={handleChange}
              error={!!formErrors.mobile}
              helperText={formErrors.mobile}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!formErrors.role} required>
              <InputLabel id="role-select-label" sx={{ fontWeight: 600, fontSize: "1rem" }}>Assign Role</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                name="role"
                value={formData.role}
                label="Assign Role"
                onChange={handleChange}
                sx={{ 
                  borderRadius: 2,
                  backgroundColor: "white",
                  "& .MuiSelect-select": {
                    py: 2, // Even larger padding
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center"
                  },
                  height: 60, // Explicit height to match or exceed standard TextField
                }}
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <RoleIcon color="primary" />
                  </InputAdornment>
                }
              >
                <MenuItem value="" disabled sx={{ fontStyle: 'italic' }}>
                  Select a Role
                </MenuItem>
                {roleOptions.map((role) => (
                  <MenuItem 
                    key={role} 
                    value={role}
                    sx={{ py: 2, fontWeight: 500, fontSize: "1rem" }}
                  >
                    {role}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {formErrors.role}
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>

        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 5, justifyContent: "flex-end" }}
        >
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<ClearIcon />}
            sx={{
              px: 4,
              borderColor: "#e2e8f0",
              color: "#4a5568",
              "&:hover": {
                borderColor: "#cbd5e0",
                backgroundColor: "#f7fafc",
              },
            }}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              px: 4,
              backgroundColor: "#2e83ff",
              "&:hover": {
                backgroundColor: "#1a6fed",
              },
            }}
          >
            {loading ? "Creating..." : "Create Admin"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}

export default CreateForm;

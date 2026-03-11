import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CreateForm from '../../components/Admin/AddAdmin/CreateForm';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
} from "@mui/material";
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

const AddAdmin = () => {
  const navigate = useNavigate();
  
  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ pb: 4 }}>
          {/* Premium Header Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              mb: 4,
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a202c", mb: 1 }}>
                Create Admin
              </Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <MuiLink
                  component={Link}
                  underline="hover"
                  color="inherit"
                  to="/"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Dashboard
                </MuiLink>
                <MuiLink
                  component={Link}
                  underline="hover"
                  color="inherit"
                  to="/admins"
                >
                  Admins
                </MuiLink>
                <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                  Create Admin
                </Typography>
              </Breadcrumbs>
            </Box>

            <Button
              variant="contained"
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
              sx={{
                backgroundColor: "#1a202c",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#2d3748",
                },
              }}
            >
              Back
            </Button>
          </Box>

          {/* Form Content */}
          <CreateForm />
        </Box>
      </div>
    </div>
  );
};

export default AddAdmin;
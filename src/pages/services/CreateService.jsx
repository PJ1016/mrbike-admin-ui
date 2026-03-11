import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ServiceForm from "../../components/Service/ServiceForm";
import { Box, Stack, Typography, Breadcrumbs, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const CreateService = () => {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h4" fontWeight="700" color="text.primary">
                  Service Management
                </Typography>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
                  <Typography color="text.secondary" variant="body2">
                    Dashboard
                  </Typography>
                  <Link
                    to="/services"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Typography
                      color="text.secondary"
                      variant="body2"
                      sx={{ "&:hover": { color: "primary.main" } }}
                    >
                      Base Services
                    </Typography>
                  </Link>
                  <Typography
                    color="text.primary"
                    variant="body2"
                    fontWeight="500"
                  >
                    Manage Service
                  </Typography>
                </Breadcrumbs>
              </Box>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{
                  fontWeight: "bold",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "grey.100" },
                  boxShadow: 1,
                }}
              >
                Back to Services
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 2 }}>
            <ServiceForm />
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default CreateService;

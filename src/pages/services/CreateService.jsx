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
          <Box sx={{ mt: 2 }}>
            <ServiceForm />
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default CreateService;

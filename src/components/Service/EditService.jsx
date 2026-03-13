"use client"
import { useNavigate, useParams } from "react-router-dom"
import ServiceForm from "./ServiceForm"
import { Box, Typography, Button, Stack, Breadcrumbs } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

const EditService = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ letterSpacing: -0.5 }}>
              Edit Dealer Service
            </Typography>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
              <Typography color="text.secondary" variant="body2">Operations</Typography>
              <Typography color="text.secondary" variant="body2">Services</Typography>
              <Typography color="text.primary" variant="body2" fontWeight="600">Edit Configuration</Typography>
            </Breadcrumbs>
          </Box>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ 
              fontWeight: '700', 
              bgcolor: 'white', 
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              px: 3,
              '&:hover': { bgcolor: 'grey.50' } 
            }}
          >
            Back
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
        <ServiceForm serviceId={id} />
      </Box>
    </Box>
  )
}

export default EditService

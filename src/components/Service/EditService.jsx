import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import moment from "moment"
import ServiceForm from "./ServiceForm"
import {
  Box,
  Typography,
  Button,
  Stack,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Grid,
  Divider,
  Skeleton,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import BusinessIcon from "@mui/icons-material/Business"
import SettingsIcon from "@mui/icons-material/Settings"
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike"
import BuildIcon from "@mui/icons-material/Build"

const EditService = () => {
  const navigate = useNavigate()
  const { id, dealerId } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [summaryData, setSummaryData] = useState({
    serviceName: "",
    dealerName: "",
    brandsCount: 0,
    bikesCount: 0,
    lastUpdate: "",
  })

  const handleDataLoaded = (data) => {
    if (!data) {
      setIsLoading(false)
      return
    }

    setSummaryData({
      serviceName: data.base_service_id?.name || "---",
      dealerName: data.dealer_id?.shopName || "Unassigned",
      brandsCount: data.companies?.length || 0,
      bikesCount: data.bikes?.length || 0,
      lastUpdate: data.updatedAt ? moment(data.updatedAt).fromNow() : "Never",
    })
    setIsLoading(false)
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#f4f7fa", minHeight: "100vh" }}>
      {/* Page Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight="900"
              color="text.primary"
              sx={{ letterSpacing: -1, mb: 0.5 }}
            >
              Edit Dealer Service
            </Typography>
            <Breadcrumbs
              aria-label="breadcrumb"
              sx={{
                "& .MuiBreadcrumbs-separator": { mx: 1 },
                "& .MuiTypography-root": { fontSize: "0.85rem", fontWeight: 600, color: 'text.secondary' },
              }}
            >
              <Link
                underline="hover"
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/")
                }}
              >
                Dashboard
              </Link>
              <Link
                underline="hover"
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  navigate("/services")
                }}
              >
                Services
              </Link>
              <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>Edit Configuration</Typography>
            </Breadcrumbs>
          </Box>

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
              borderRadius: "12px",
              px: 3,
              py: 1,
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              textTransform: 'none',
              "&:hover": { bgcolor: "#f8fafc", boxShadow: "0 4px 8px rgba(0,0,0,0.04)" },
            }}
          >
            Back to List
          </Button>
        </Stack>

        {/* Improved Service Summary Card */}
        <Card
          sx={{
            borderRadius: "20px",
            border: "1px solid",
            borderColor: "white",
            background: 'linear-gradient(135deg, #ffffff 0%, #fcfdfe 100%)',
            boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
            overflow: "hidden",
            mb: 4,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Grid container>
              <Grid item xs={12} md={3} sx={{ p: 3, borderRight: { md: "1px solid" }, borderColor: "divider" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "14px",
                      bgcolor: "primary.light",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "primary.main",
                      opacity: isLoading ? 0.5 : 1,
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.1)'
                    }}
                  >
                    <BuildIcon />
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: '0.65rem' }}>
                      Service Name
                    </Typography>
                    {isLoading ? (
                      <Skeleton variant="text" sx={{ fontSize: '1.1rem', width: '80%' }} />
                    ) : (
                      <Typography variant="h6" fontWeight="800" sx={{ color: 'text.primary' }}>
                        {summaryData.serviceName}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={3} sx={{ p: 3, borderRight: { md: "1px solid" }, borderColor: "divider" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "14px",
                      bgcolor: "success.light",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "success.main",
                      opacity: isLoading ? 0.5 : 1,
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.1)'
                    }}
                  >
                    <BusinessIcon />
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: '0.65rem' }}>
                      Dealer
                    </Typography>
                    {isLoading ? (
                      <Skeleton variant="text" sx={{ fontSize: '1.1rem', width: '90%' }} />
                    ) : (
                      <Typography variant="h6" fontWeight="800" color={summaryData.dealerName === "Unassigned" ? "error.main" : "text.primary"}>
                        {summaryData.dealerName}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={2} sx={{ p: 3, borderRight: { md: "1px solid" }, borderColor: "divider" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
                    Brands
                  </Typography>
                  {isLoading ? (
                    <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '40%' }} />
                  ) : (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" fontWeight="800">
                        {summaryData.brandsCount}
                      </Typography>
                      <DirectionsBikeIcon sx={{ fontSize: 18, color: 'primary.main', opacity: 0.7 }} />
                    </Stack>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={2} sx={{ p: 3, borderRight: { md: "1px solid" }, borderColor: "divider" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
                    Configured Bikes
                  </Typography>
                  {isLoading ? (
                    <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '40%' }} />
                  ) : (
                    <Typography variant="h6" fontWeight="800">
                      {summaryData.bikesCount}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={2} sx={{ p: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: '0.65rem', mb: 0.5, display: 'block' }}>
                    Last Updated
                  </Typography>
                  {isLoading ? (
                    <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '60%' }} />
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="subtitle2" fontWeight="800" color="success.main">
                        {summaryData.lastUpdate}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 2 }}>
        <ServiceForm serviceId={id} dealerId={dealerId} onDataLoaded={handleDataLoaded} />
      </Box>
    </Box>
  )
}

export default EditService

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
      <Box>

        {/* Improved Service Summary Card */}
      </Box>

      <Box sx={{ mt: 2 }}>
        <ServiceForm serviceId={id} dealerId={dealerId} onDataLoaded={handleDataLoaded} />
      </Box>
    </Box>
  )
}

export default EditService

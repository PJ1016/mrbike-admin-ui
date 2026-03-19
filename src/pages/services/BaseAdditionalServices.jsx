import { useRef, useState, useEffect } from 'react'
import BaseAdditionalServiceTable from '../../components/Additional/BaseAdditionalServiceTable'
import { Link } from 'react-router-dom'
import { getBaseAdditionalServices } from '../../api/additionalServiceApi'
import {
  Box,
  Typography,
  Button,
  Stack,
  Breadcrumbs,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";

const BaseAdditionalServices = () => {
  const [data, setData] = useState([])
  const [refresh, setRefresh] = useState(false)
  const [loading, setLoading] = useState(true)

  const tableHeaders = ['#', 'Service Image', 'Service Name', 'Created At', 'Actions']

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const response = await getBaseAdditionalServices()
        if (response && response.status === true) {
          setData(response.data || [])
        } else {
          setData([])
        }
      } catch (error) {
        console.error('Error fetching base additional services:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [refresh])

  const handleRefresh = () => {
    setRefresh((prev) => !prev)
  }

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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <LibraryAddIcon sx={{ color: "#2e83ff", fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight="700" color="text.primary">
                    Additional Services
                  </Typography>
                  <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
                    <Typography color="text.secondary" variant="body2">
                      Dashboard
                    </Typography>
                    <Typography
                      color="text.primary"
                      variant="body2"
                      fontWeight="500"
                    >
                      Additional Services
                    </Typography>
                  </Breadcrumbs>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  component={Link}
                  to="/create-base-additional-service"
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ fontWeight: "bold" }}
                >
                  Add Additional Service
                </Button>
              </Box>
            </Stack>
          </Box>

          <BaseAdditionalServiceTable
            datas={data}
            tableHeaders={tableHeaders}
            onServiceDeleted={handleRefresh}
            loading={loading}
          />
        </Box>
      </div>
    </div>
  )
}

export default BaseAdditionalServices

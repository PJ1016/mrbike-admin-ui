import React, { useRef, useState, useEffect } from "react";
import UserTable from "../../components/Dealers/DealerTable";
import { Link, useNavigate } from "react-router-dom";
import { getDealerList } from "../../api";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Stack,
  Container,
} from "@mui/material";
import {
  Add as AddIcon,
  FileDownload as DownloadIcon,
  NavigateNext as NavigateNextIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import DealerStats from "../../components/Dealers/DealerStats";

const Dealer = () => {
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDealers = async () => {
      setLoading(true);
      try {
        const response = await getDealerList();
        if (response.status === 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching dealer list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Container maxWidth="xl">
          {/* MUI Header */}
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "#1e293b",
                    mb: 1,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Dealers
                </Typography>
                <Breadcrumbs
                  separator={<NavigateNextIcon fontSize="small" />}
                  aria-label="breadcrumb"
                >
                  <MuiLink
                    underline="hover"
                    color="inherit"
                    onClick={() => navigate("/")}
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Dashboard
                  </MuiLink>
                  <Typography
                    color="text.primary"
                    sx={{ fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    Dealers List
                  </Typography>
                </Breadcrumbs>
              </Box>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => triggerDownloadExcel.current?.()}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#e2e8f0",
                    color: "#4a5568",
                    "&:hover": {
                      backgroundColor: "#f7fafc",
                      borderColor: "#cbd5e0",
                    },
                  }}
                >
                  Export
                </Button>
                <Button
                  component={Link}
                  to="/add-dealer-ai"
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                    "&:hover": { 
                      background: "linear-gradient(45deg, #1976D2 30%, #0288D1 90%)"
                    },
                    boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                  }}
                >
                  AI Create
                </Button>
                <Button
                  component={Link}
                  to="/add-dealer"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#2e83ff",
                    "&:hover": { backgroundColor: "#1a6fed" },
                    boxShadow: "0 4px 12px rgba(46, 131, 255, 0.25)",
                  }}
                >
                  Add Dealer
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Stats Section */}
          <DealerStats datas={data} />

          {/* Table Section */}
          <UserTable
            datas={data}
            loading={loading}
            triggerDownloadExcel={triggerDownloadExcel}
            triggerDownloadPDF={triggerDownloadPDF}
            text={"Dealers"}
            onDealerDeleted={handleRefresh}
          />
        </Container>
      </div>
    </div>
  );
};

export default Dealer;

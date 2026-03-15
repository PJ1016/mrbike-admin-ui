import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DealerForm from '../../components/Dealers/updateDealer';
import { getDealerById } from "../../api"
import Swal from 'sweetalert2';
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
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

const DealerUpdate = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dealerData, setDealerData] = useState(null);

    useEffect(() => {
        const fetchDealer = async () => {
            try {
                const res = await getDealerById(id)
                if (res) {
                    setDealerData(res)
                } else {
                    Swal.fire("Error", "Failed to fetch dealer data", "error")
                }
            } catch (err) {
                console.error("Fetch error:", err);
                Swal.fire("Error", "Something went wrong while fetching dealer data", "error")
            }
        }
        fetchDealer()
    }, [id])

    return (
        <div className="page-wrapper">
            <div className="content container-fluid">
                <Container maxWidth="lg">
                    {/* MUI Header */}
                    <Box sx={{ mb: 4 }}>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={2}
                        >
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: "#1e293b", mb: 1, letterSpacing: "-0.025em" }}>
                                    Edit Dealer Profile
                                </Typography>
                                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                                    <MuiLink underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontSize: "0.875rem", fontWeight: 500 }}>
                                        Dashboard
                                    </MuiLink>
                                    <MuiLink underline="hover" color="inherit" onClick={() => navigate('/dealers')} sx={{ cursor: 'pointer', fontSize: "0.875rem", fontWeight: 500 }}>
                                        Dealers
                                    </MuiLink>
                                    <Typography color="text.primary" sx={{ fontSize: "0.875rem", fontWeight: 600 }}>Update Profile</Typography>
                                </Breadcrumbs>
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate(-1)}
                                sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "#e2e8f0",
                                    color: "#475569",
                                    backgroundColor: "white",
                                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                    "&:hover": { backgroundColor: "#f1f5f9", borderColor: "#cbd5e0" },
                                }}
                            >
                                Back to List
                            </Button>
                        </Stack>
                    </Box>

                    {dealerData ? (
                        <DealerForm dealerData={dealerData} dealerId={dealerData._id} isEdit={true} />
                    ) : (
                        <Box sx={{ textAlign: "center", py: 5 }}>
                            <Typography color="text.secondary">Loading dealer data...</Typography>
                        </Box>
                    )}
                </Container>
            </div>
        </div>
    );
};

export default DealerUpdate;
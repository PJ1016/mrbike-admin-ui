import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Alert,
  Fade,
  TextField,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice";
import { API_BASE_URL } from "../../api";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/adminauth/suadminLogin`,
        { email, password },
      );
      if (data.status) {
        // suadminLogin's response body only carries {status, message, token} -
        // _id/role aren't in the JSON, but they're in the JWT payload itself
        // (see generateUserToken in the backend), same as ProtectedRoute
        // already decodes to read user_type.
        const decoded = jwtDecode(data.token);
        dispatch(
          setCredentials({
            user: {
              _id: decoded.user_id,
              name: data.name,
              email: data.email,
              role: "Admin",
            },
            token: data.token,
          }),
        );
        navigate("/");
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", // Dark blue to Indigo
        padding: isMobile ? 2 : 4,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-10%",
          right: "-10%",
          width: "40%",
          height: "40%",
          background:
            "radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: "40%",
          height: "40%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
        },
      }}
    >
      <Container maxWidth="xs">
        <Fade in={true} timeout={1000}>
          <Box>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(10px)",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "visible",
              }}
            >
              <CardContent
                sx={{
                  px: isMobile ? 3 : 5,
                  py: isMobile ? 4 : 6,
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    p: 2,
                    borderRadius: "16px",
                    bgcolor: "primary.light",
                    color: "primary.main",
                    mb: 3,
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                  }}
                >
                  <TwoWheelerIcon sx={{ fontSize: 40 }} />
                </Box>

                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: "#1e293b",
                    mb: 1,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Mr Bike Doctor
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    mb: 4,
                    fontWeight: 500,
                    color: "#64748b",
                    fontSize: "1.1rem",
                  }}
                >
                  Admin Control Center
                </Typography>

                {error && (
                  <Fade in={true}>
                    <Alert
                      severity="error"
                      variant="filled"
                      sx={{
                        mb: 3,
                        textAlign: "left",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      onClose={() => setError("")}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ textAlign: "left" }}
                >
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    sx={{ mb: 3 }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: "12px",
                      fontSize: "1rem",
                      fontWeight: 700,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 4,
                color: "rgba(255, 255, 255, 0.5)",
                fontWeight: 500,
              }}
            >
              &copy; {new Date().getFullYear()} Mr Bike Doctor. All rights
              reserved.
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;

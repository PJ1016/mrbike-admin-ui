import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Container, 
  Alert,
  Fade,
  Avatar,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

const allowedAdmins = [
  "admin@mrbikedoctor.cloud",
  "praveen.jayanth.1111@gmail.com"
];

const LoginPage = () => {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email;

      if (allowedAdmins.includes(email)) {
        login(decoded, credentialResponse.credential);
        navigate("/");
      } else {
        setError("Access denied. You are not authorized to access this portal.");
      }
    } catch (err) {
      setError("Failed to decode login information. Please try again.");
    }
  };

  const handleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Dark blue to Indigo
        padding: isMobile ? 2 : 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }
      }}
    >
      <Container maxWidth="xs">
        <Fade in={true} timeout={1000}>
          <Box>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 4, 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'visible'
              }}
            >
              <CardContent sx={{ px: isMobile ? 3 : 5, py: isMobile ? 4 : 6, textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: '16px',
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    mb: 3,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                  }}
                >
                  <TwoWheelerIcon sx={{ fontSize: 40 }} />
                </Box>
                
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 800,
                    color: '#1e293b',
                    mb: 1,
                    letterSpacing: '-0.025em',
                  }}
                >
                  Mr Bike Doctor
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 4, 
                    fontWeight: 500, 
                    color: '#64748b',
                    fontSize: '1.1rem'
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
                        textAlign: 'left',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      onClose={() => setError("")}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    mt: 1,
                    mb: 4,
                    '& > div': {
                      width: '100% !important',
                      display: 'flex',
                      justifyContent: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }
                  }}
                >
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap
                    theme="filled_blue"
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="100%"
                  />
                </Box>

                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#94a3b8',
                    fontWeight: 400,
                    lineHeight: 1.6
                  }}
                >
                  Use your authorized Google account to access the admin portal
                </Typography>
              </CardContent>
            </Card>
            
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                textAlign: 'center', 
                mt: 4, 
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 500
              }}
            >
              &copy; {new Date().getFullYear()} Mr Bike Doctor. All rights reserved.
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;

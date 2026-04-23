import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

/**
 * A production-ready Location Input component using MUI and Geolocation API (JSX Version)
 */
const LocationPicker = ({
  value,
  onChange,
  label = "Coordinates",
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches current coordinates using Browser Geolocation API
   */
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
        });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Please enable permissions.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("Request to get location timed out.");
            break;
          default:
            setError("An unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  /**
   * Clears the current location values
   */
  const handleClearLocation = () => {
    onChange({ lat: '', lng: '' });
    setError(null);
  };

  /**
   * Handles manual input changes
   */
  const handleInputChange = (e) => {
    const { name, value: inputValue } = e.target;
    // Allow only numbers, decimals, and negative signs
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      onChange({
        ...value,
        [name]: inputValue,
      });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>

      <Stack spacing={2}>
        {/* Input Fields Row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Latitude"
            name="lat"
            variant="outlined"
            value={value.lat || ''}
            onChange={handleInputChange}
            disabled={disabled || loading}
            placeholder="e.g. 17.3850"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Longitude"
            name="lng"
            variant="outlined"
            value={value.lng || ''}
            onChange={handleInputChange}
            disabled={disabled || loading}
            placeholder="e.g. 78.4867"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Action Buttons Row */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MyLocationIcon />}
            onClick={handleGetCurrentLocation}
            disabled={disabled || loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 4px 12px rgba(46, 131, 255, 0.2)' },
            }}
          >
            {loading ? 'Fetching...' : 'Use Current Location'}
          </Button>

          {(value.lat || value.lng) && (
            <Tooltip title="Clear Coordinates">
              <IconButton 
                onClick={handleClearLocation} 
                disabled={disabled || loading}
                color="error"
                sx={{ border: '1px solid', borderColor: 'error.light' }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Error Feedback */}
        {error && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default LocationPicker;

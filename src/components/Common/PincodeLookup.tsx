import React, { useState, useEffect } from 'react';
import {
  TextField,
  Stack,
  Typography,
  CircularProgress,
  InputAdornment,
  Alert,
  Box,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';

/**
 * Interface for Pincode API Response
 */
interface PostOffice {
  Name: string;
  District: string;
  State: string;
}

interface ApiResponse {
  Status: 'Success' | 'Error';
  Message: string;
  PostOffice: PostOffice[] | null;
}

/**
 * Props for the PincodeLookup component
 */
interface PincodeLookupProps {
  pincode: string;
  city: string;
  state: string;
  onPincodeChange: (value: string) => void;
  onLocationFound: (city: string, state: string) => void;
  onManualCityChange: (value: string) => void;
  onManualStateChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * A production-ready Pincode Lookup component for India
 * Uses India Post API: https://api.postalpincode.in/
 */
const PincodeLookup: React.FC<PincodeLookupProps> = ({
  pincode,
  city,
  state,
  onPincodeChange,
  onLocationFound,
  onManualCityChange,
  onManualStateChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutofilled, setIsAutofilled] = useState<boolean>(false);

  useEffect(() => {
    // Only call API if pincode is exactly 6 digits
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      fetchPincodeDetails(pincode);
    } else {
      setError(null);
      setIsAutofilled(false);
    }
  }, [pincode]);

  const fetchPincodeDetails = async (pin: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<ApiResponse[]>(`https://api.postalpincode.in/pincode/${pin}`);
      
      if (response.data[0].Status === 'Success') {
        const postOffice = response.data[0].PostOffice?.[0];
        if (postOffice) {
          onLocationFound(postOffice.District, postOffice.State);
          setIsAutofilled(true);
        }
      } else {
        setError("Invalid pincode or no data found.");
      }
    } catch (err) {
      setError("Failed to fetch location data. Please enter manually.");
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numbers and max length 6
    if (/^\d*$/.test(val) && val.length <= 6) {
      onPincodeChange(val);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Pincode Input */}
        <TextField
          fullWidth
          label="Pincode"
          value={pincode}
          onChange={handlePincodeInput}
          disabled={disabled}
          placeholder="6-digit PIN"
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon color={error ? "error" : "primary"} />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
        />

        {/* City & State Row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="City"
            value={city}
            onChange={(e) => onManualCityChange(e.target.value)}
            disabled={disabled || (isAutofilled && !error)}
            helperText={isAutofilled ? "Autofilled from Pincode" : ""}
            InputProps={{
              endAdornment: isAutofilled && !error && (
                <InputAdornment position="end">
                  <SuccessIcon color="success" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="State"
            value={state}
            onChange={(e) => onManualStateChange(e.target.value)}
            disabled={disabled || (isAutofilled && !error)}
            helperText={isAutofilled ? "Autofilled from Pincode" : ""}
            InputProps={{
              endAdornment: isAutofilled && !error && (
                <InputAdornment position="end">
                  <SuccessIcon color="success" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {isAutofilled && !error && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Tip: You can manually override City/State if the lookup is incorrect.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default PincodeLookup;

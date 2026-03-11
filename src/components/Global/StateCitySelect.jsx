import React, { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
} from "@mui/material";

const STATE_CITY_DATA = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg"],
  "Goa": ["Panaji", "Margao", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital"],
  "West Bengal": ["Kolkata", "Asansol", "Siliguri"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Silvassa"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Puducherry": ["Puducherry", "Karaikal"]
};

const StateCitySelect = ({
  value,
  onChange,
  stateName,
  cityName,
  errors = {},
  disabled = false,
  stateLabel,
  cityLabel,
  gridProps = { md: 6 }
}) => {
  const selectedState = value?.[stateName] || "";
  const selectedCity = value?.[cityName] || "";
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (selectedState) {
      setCities(STATE_CITY_DATA[selectedState] || []);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const handleStateChange = (e) => {
    onChange({
      target: {
        name: stateName,
        value: e.target.value
      }
    });
    
    onChange({
      target: {
        name: cityName,
        value: ""
      }
    });
  };

  const handleCityChange = (e) => {
    onChange({
      target: {
        name: cityName,
        value: e.target.value
      }
    });
  };

  // Determine labels if not provided
  const finalStateLabel = stateLabel || (stateName.includes('permanent') ? 'Permanent State' : stateName.includes('present') ? 'Present State' : 'State');
  const finalCityLabel = cityLabel || (cityName.includes('permanent') ? 'Permanent City' : cityName.includes('present') ? 'Present City' : 'City');

  return (
    <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
      <Grid item xs={12} {...gridProps}>
        <FormControl fullWidth error={!!errors[stateName]} disabled={disabled} variant="outlined">
          <InputLabel id={`${stateName}-label`}>{finalStateLabel}</InputLabel>
          <Select
            labelId={`${stateName}-label`}
            id={`${stateName}-select`}
            value={selectedState}
            label={finalStateLabel}
            onChange={handleStateChange}
            required
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">
              <em>Select State</em>
            </MenuItem>
            {Object.keys(STATE_CITY_DATA).map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
          {errors[stateName] && <FormHelperText>{errors[stateName]}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid item xs={12} {...gridProps}>
        <FormControl fullWidth error={!!errors[cityName]} disabled={!selectedState || disabled} variant="outlined">
          <InputLabel id={`${cityName}-label`}>{finalCityLabel}</InputLabel>
          <Select
            labelId={`${cityName}-label`}
            id={`${cityName}-select`}
            value={selectedCity}
            label={finalCityLabel}
            onChange={handleCityChange}
            required
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="" disabled>
              <em>{selectedState ? "Select City" : "Select a State First"}</em>
            </MenuItem>
            {cities.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
          </Select>
          {errors[cityName] && <FormHelperText>{errors[cityName]}</FormHelperText>}
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default StateCitySelect;
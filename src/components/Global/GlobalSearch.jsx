import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { selectAllSearchOptions } from "../../redux/slices/searchSlice";

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const allOptions = useSelector(selectAllSearchOptions);
  const loading = useSelector((state) => state.search.loading);

  const filteredOptions = useMemo(() => {
    if (inputValue.length < 2) return [];
    
    return allOptions.filter(option => 
      option.name.toLowerCase().includes(inputValue.toLowerCase()) || 
      option.id.toLowerCase().includes(inputValue.toLowerCase()) ||
      (option.targetId && option.targetId.toLowerCase().includes(inputValue.toLowerCase()))
    ).slice(0, 50); // Limit to 50 results for performance
  }, [allOptions, inputValue]);

  const handleSelect = (event, value) => {
    if (!value) return;

    // Redirection Logic based on Entity Type
    switch (value.type) {
      case "User":
        navigate(`/customers`); 
        break;
      case "Dealer":
        navigate(`/view-dealer/${value.targetId}`);
        break;
      case "Service":
        navigate(`/edit-services/${value.targetId}`);
        break;
      default:
        console.warn("Unknown entity type:", value.type);
    }
  };

  return (
    <Autocomplete
      id="global-search"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => `${option.name} (${option.id})`}
      options={filteredOptions}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      onChange={handleSelect}
      filterOptions={(x) => x} // Disable built-in filtering as we do it in useMemo
      PaperComponent={(props) => (
        <Paper {...props} elevation={8} sx={{ borderRadius: 2, mt: 1 }} />
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search ID, Dealer, or Service..."
          size="small"
          sx={{
            width: { xs: 200, sm: 300, md: 400 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "inherit",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.25)",
              },
              "& fieldset": { border: "none" },
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "inherit", opacity: 0.7 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box component="li" key={key} {...optionProps} sx={{ px: 2, py: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body1" fontWeight="600">
                  {option.name}
                </Typography>
                <Chip
                  label={option.type}
                  size="small"
                  color={
                    option.type === "User"
                      ? "primary"
                      : option.type === "Dealer"
                      ? "secondary"
                      : "success"
                  }
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.65rem" }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                ID: {option.id}
              </Typography>
            </Box>
          </Box>
        );
      }}
    />
  );
};

export default GlobalSearch;

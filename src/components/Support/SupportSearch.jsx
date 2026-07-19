import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const SupportSearch = ({ value, onChange, placeholder = "Search by subject, message, ticket no…" }) => (
  <TextField
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    size="small"
    fullWidth
    inputProps={{ "aria-label": "Search tickets" }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        </InputAdornment>
      ),
    }}
    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#fff" } }}
  />
);

export default SupportSearch;

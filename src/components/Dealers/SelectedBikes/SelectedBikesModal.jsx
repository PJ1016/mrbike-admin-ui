import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import VirtualizedBikeList from "./VirtualizedBikeList";

/**
 * Modal to view and edit all selected bikes.
 * Optimized with search and virtualization.
 */
const SelectedBikesModal = ({ open, onClose, bikes, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Memoize filtered results to prevent re-filtering on every render
  const filteredBikes = useMemo(() => {
    if (!searchTerm) return bikes;
    const lowerSearch = searchTerm.toLowerCase();
    return bikes.filter((bike) => {
      const modelName = bike.model_name || bike.model_id?.model_name || "";
      const variantName = bike.variant_name || "";
      const companyName = bike.company_name || bike.company_id?.name || "";
      const fullName = `${companyName} ${modelName} ${variantName}`.toLowerCase();
      return fullName.includes(lowerSearch);
    });
  }, [bikes, searchTerm]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 4, height: '80vh' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="800">
          Selected Bikes ({bikes.length})
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search within selected bikes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
        </Box>

        <Box sx={{ height: 'calc(100% - 70px)', overflow: 'hidden' }}>
          <VirtualizedBikeList bikes={filteredBikes} onDelete={onDelete} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectedBikesModal;

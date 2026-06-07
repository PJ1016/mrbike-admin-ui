import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";

// Isolated price input — only re-renders when its own value changes
const PriceInput = React.memo(({ bikeId, value, onChange }) => {
  const isError =
    value !== undefined && value !== "" && Number(value) <= 0;
  return (
    <TextField
      size="small"
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(bikeId, e.target.value)}
      error={isError}
      helperText={isError ? "Must be > 0" : ""}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CurrencyRupeeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          </InputAdornment>
        ),
        inputProps: { min: 0, step: 10 },
      }}
      sx={{ width: 140 }}
    />
  );
});

const Step4Pricing = ({ state, dispatch: wizardDispatch }) => {
  const [bulkPrice, setBulkPrice] = useState("");

  const handlePriceChange = useCallback(
    (bikeId, price) => {
      wizardDispatch({ type: "SET_PRICE", bikeId, price });
    },
    [wizardDispatch]
  );

  const handleApplyBulk = useCallback(() => {
    const p = Number(bulkPrice);
    if (!bulkPrice || p <= 0) return;
    const newPricing = {};
    state.selectedBikes.forEach((b) => {
      newPricing[b._id] = bulkPrice;
    });
    wizardDispatch({ type: "SET_PRICING", payload: newPricing });
  }, [bulkPrice, state.selectedBikes, wizardDispatch]);

  const { filledCount, isAllValid } = useMemo(() => {
    let filled = 0;
    state.selectedBikes.forEach((b) => {
      const p = state.pricing[b._id];
      if (p !== undefined && p !== "" && Number(p) > 0) filled++;
    });
    return {
      filledCount: filled,
      isAllValid: filled === state.selectedBikes.length,
    };
  }, [state.selectedBikes, state.pricing]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography variant="subtitle1" fontWeight={700}>
          Set Service Prices
        </Typography>
        <Chip
          label={`${filledCount} / ${state.selectedBikes.length} filled`}
          color={isAllValid ? "success" : "warning"}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Set a price for this service for each selected bike. All prices are
        required and must be greater than 0.
      </Typography>

      {/* Bulk price tool */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          bgcolor: "grey.50",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" fontWeight={700} mb={1.5}>
          Bulk Apply — Same Price for All Bikes
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            type="number"
            placeholder="Enter price"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CurrencyRupeeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                </InputAdornment>
              ),
              inputProps: { min: 0 },
            }}
            sx={{ width: 200 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleApplyBulk}
            disabled={!bulkPrice || Number(bulkPrice) <= 0}
            sx={{ fontWeight: 700, textTransform: "none" }}
          >
            Apply to All {state.selectedBikes.length} Bikes
          </Button>
          <Typography variant="caption" color="text.secondary">
            You can still override individual prices below.
          </Typography>
        </Stack>
      </Paper>

      {/* Per-bike price table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          maxHeight: 300,
          overflow: "auto",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  bgcolor: "grey.50",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                },
              }}
            >
              <TableCell>#</TableCell>
              <TableCell>Bike Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell align="center">CC</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.selectedBikes.map((bike, idx) => (
              <TableRow
                key={bike._id}
                hover
                sx={{ "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell sx={{ color: "text.disabled", width: 36 }}>
                  {idx + 1}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {bike.variant_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {bike.company_name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${Number(bike.cc || bike.engine_cc || 0)} cc`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <PriceInput
                    bikeId={bike._id}
                    value={state.pricing[bike._id]}
                    onChange={handlePriceChange}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!isAllValid && state.selectedBikes.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {state.selectedBikes.length - filledCount} bike(s) still need a
          valid price before you can proceed.
        </Alert>
      )}

      {isAllValid && (
        <Alert severity="success" sx={{ mt: 2 }}>
          All {state.selectedBikes.length} bikes have prices set. Ready to
          review!
        </Alert>
      )}
    </Box>
  );
};

export default React.memo(Step4Pricing);

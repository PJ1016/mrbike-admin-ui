import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
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
} from "@mui/material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { groupBikesByCC } from "./utils/ccGrouping";

// Isolated price input — only re-renders when its own value changes
const PriceInput = React.memo(({ id, value, onChange, width = 140 }) => {
  const isError =
    value !== undefined && value !== "" && Number(value) <= 0;
  return (
    <TextField
      size="small"
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(id, e.target.value)}
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
      sx={{ width }}
    />
  );
});

const Step4Pricing = ({ state, dispatch: wizardDispatch }) => {
  // Controlled values for the per-CC price inputs, keyed by cc — local only,
  // the source of truth for actual bike prices stays in state.pricing
  const [ccPriceInputs, setCcPriceInputs] = useState({});

  // Only price bikes whose CC is in the selected CC ranges
  const pricedBikes = useMemo(
    () =>
      state.selectedBikes.filter((b) =>
        state.selectedCCRanges.includes(Number(b.cc || b.engine_cc || 0))
      ),
    [state.selectedBikes, state.selectedCCRanges]
  );

  // Bikes excluded because their CC was not selected
  const excludedBikes = useMemo(
    () =>
      state.selectedBikes.filter(
        (b) =>
          !state.selectedCCRanges.includes(Number(b.cc || b.engine_cc || 0))
      ),
    [state.selectedBikes, state.selectedCCRanges]
  );

  // Reuse the same CC grouping used in Step4SelectCCRanges — one row per CC
  const ccGroups = useMemo(() => groupBikesByCC(pricedBikes), [pricedBikes]);

  const handlePriceChange = useCallback(
    (bikeId, price) => {
      wizardDispatch({ type: "SET_PRICE", bikeId, price });
    },
    [wizardDispatch]
  );

  // Applying a price for one CC only ever touches bikes of that CC — each
  // bike's price is merged into state.pricing via the existing SET_PRICE
  // action, so bikes of every other CC are left untouched.
  const handleCcPriceChange = useCallback(
    (cc, price) => {
      setCcPriceInputs((prev) => ({ ...prev, [cc]: price }));
      const group = ccGroups.find((g) => g.cc === cc);
      if (!group) return;
      group.bikes.forEach((bike) => {
        wizardDispatch({ type: "SET_PRICE", bikeId: bike._id, price });
      });
    },
    [ccGroups, wizardDispatch]
  );

  const { filledCount, isAllValid } = useMemo(() => {
    let filled = 0;
    pricedBikes.forEach((b) => {
      const p = state.pricing[b._id];
      if (p !== undefined && p !== "" && Number(p) > 0) filled++;
    });
    return {
      filledCount: filled,
      isAllValid: filled === pricedBikes.length,
    };
  }, [pricedBikes, state.pricing]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={0.5}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Set Service Prices
        </Typography>
        <Chip
          label={`${filledCount} / ${pricedBikes.length} filled`}
          color={isAllValid ? "success" : "warning"}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Set a price for each bike in your selected CC ranges. All prices are
        required and must be greater than 0.
      </Typography>

      {/* Info about excluded bikes */}
      {excludedBikes.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>{excludedBikes.length} bike(s)</strong> were excluded because
          their CC range was not selected in the previous step.
        </Alert>
      )}

      {/* Apply price by CC */}
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
          Apply Price by CC
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
              }}
            >
              <TableCell>CC</TableCell>
              <TableCell>Bikes</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ccGroups.map((group) => (
              <TableRow
                key={group.cc}
                sx={{ "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell>
                  <Chip
                    label={`${group.cc} cc`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {group.bikes.length} bike
                    {group.bikes.length !== 1 ? "s" : ""}
                  </Typography>
                </TableCell>
                <TableCell>
                  <PriceInput
                    id={group.cc}
                    value={ccPriceInputs[group.cc]}
                    onChange={handleCcPriceChange}
                    width={160}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          Entering a price for a CC applies it to every bike of that CC only.
          You can still override individual prices below.
        </Typography>
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
            {pricedBikes.map((bike, idx) => (
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
                    id={bike._id}
                    value={state.pricing[bike._id]}
                    onChange={handlePriceChange}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!isAllValid && pricedBikes.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {pricedBikes.length - filledCount} bike(s) still need a valid price
          before you can proceed.
        </Alert>
      )}

      {isAllValid && pricedBikes.length > 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          All {pricedBikes.length} bikes have prices set. Ready to review!
        </Alert>
      )}
    </Box>
  );
};

export default React.memo(Step4Pricing);

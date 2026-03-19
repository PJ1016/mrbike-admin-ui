import {
  Card,
  CardContent,
  Typography,
  Alert,
  Box,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

const PricingEngineSection = ({
  pricingRules,
  newRule,
  setNewRule,
  addPricingRule,
  deletePricingRule,
}) => {
  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "primary.light",
        bgcolor: "rgba(37, 99, 235, 0.01)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography
          variant="h6"
          fontWeight="800"
          sx={{ mb: 1, color: "text.primary", letterSpacing: -0.5 }}
        >
          Pricing Engine
        </Typography>
        <Alert
          icon={<SettingsIcon fontSize="small" />}
          severity="info"
          sx={{
            mb: 4,
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "info.light",
            bgcolor: "info.lighter",
          }}
        >
          Use the pricing rule engine to automatically apply service pricing
          across bikes based on engine CC. You can override prices manually.
        </Alert>

        <Box
          sx={{
            p: 3,
            bgcolor: "white",
            borderRadius: "12px",
            border: "1px solid",
            borderColor: "divider",
            mb: 3,
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight="700"
            sx={{ mb: 2, color: "text.secondary" }}
          >
            Bulk Pricing Rule Panel
          </Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Min CC"
                type="number"
                size="small"
                value={newRule.minCc}
                onChange={(e) =>
                  setNewRule({ ...newRule, minCc: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Max CC"
                type="number"
                size="small"
                value={newRule.maxCc}
                onChange={(e) =>
                  setNewRule({ ...newRule, maxCc: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Price (₹)"
                type="number"
                size="small"
                value={newRule.price}
                onChange={(e) =>
                  setNewRule({ ...newRule, price: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={addPricingRule}
                sx={{ borderRadius: "8px", py: 1 }}
              >
                Apply Rule
              </Button>
            </Grid>
          </Grid>
        </Box>

        {pricingRules.length > 0 && (
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 2 }}
          >
            {pricingRules.map((rule) => (
              <Chip
                key={rule.id}
                label={`${rule.minCc} CC – ${rule.maxCc} CC → ₹${rule.price}`}
                onDelete={() => deletePricingRule(rule.id)}
                sx={{
                  py: 2.5,
                  px: 1,
                  borderRadius: "10px",
                  fontWeight: 700,
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                }}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingEngineSection;

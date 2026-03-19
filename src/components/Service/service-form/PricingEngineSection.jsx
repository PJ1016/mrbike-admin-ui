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
  useTheme,
  alpha,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";

const PricingEngineSection = ({
  pricingRules,
  newRule,
  setNewRule,
  addPricingRule,
  deletePricingRule,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.1),
        bgcolor: alpha(theme.palette.primary.main, 0.01),
        boxShadow: "0 8px 30px rgba(0,0,0,0.02)",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            <SettingsIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight="800"
            sx={{ color: "text.primary", letterSpacing: -0.5 }}
          >
            Pricing Engine
          </Typography>
        </Stack>

        <Alert
          icon={<InfoOutlinedIcon fontSize="small" />}
          severity="info"
          sx={{
            mb: 4,
            borderRadius: "16px",
            border: "1px solid",
            borderColor: alpha(theme.palette.info.main, 0.2),
            bgcolor: alpha(theme.palette.info.main, 0.05),
            "& .MuiAlert-message": { fontWeight: 500 }
          }}
        >
          Use the pricing rule engine to automatically apply service pricing
          across bikes based on engine CC. You can override prices manually.
        </Alert>

        <Box
          sx={{
            p: 3,
            bgcolor: "white",
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            mb: 3,
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight="700"
            sx={{ mb: 2.5, color: "text.secondary", textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Bulk Pricing Rule Panel
          </Typography>
          <Grid container spacing={2.5} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Min CC"
                type="number"
                variant="outlined"
                value={newRule.minCc}
                onChange={(e) =>
                  setNewRule({ ...newRule, minCc: e.target.value })
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Max CC"
                type="number"
                variant="outlined"
                value={newRule.maxCc}
                onChange={(e) =>
                  setNewRule({ ...newRule, maxCc: e.target.value })
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                variant="outlined"
                value={newRule.price}
                onChange={(e) =>
                  setNewRule({ ...newRule, price: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={addPricingRule}
                startIcon={<AddIcon />}
                sx={{ 
                  borderRadius: "12px", 
                  py: 1.5,
                  fontWeight: 800,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                Apply Rule
              </Button>
            </Grid>
          </Grid>
        </Box>

        {pricingRules.length > 0 ? (
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 2 }}
          >
            {pricingRules.map((rule) => (
              <Chip
                key={rule.id}
                label={`${rule.minCc} – ${rule.maxCc} CC → ₹${rule.price}`}
                onDelete={() => deletePricingRule(rule.id)}
                sx={{
                  py: 2.5,
                  px: 1,
                  borderRadius: "12px",
                  fontWeight: 700,
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                  "&:hover": { borderColor: "primary.main" }
                }}
              />
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: "16px",
              bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No pricing rules defined yet. Use the panel above to add bulk rules.
            </Typography>
          </Box>
        )}

        {/* Future Extensions Placeholder */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
           <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, color: "text.secondary", opacity: 0.6 }}>
             FUTURE EXTENSIONS
           </Typography>
           <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                 <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">CC-BASED PRICING RULES</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>Advanced rule engine coming soon.</Typography>
                 </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                 <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">MANUAL OVERRIDE PRICING</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>Manual overrides enabled in bike table below.</Typography>
                 </Box>
              </Grid>
           </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PricingEngineSection;


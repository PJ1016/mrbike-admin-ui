import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Chip,
  Box,
  useTheme,
  alpha,
} from "@mui/material";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";

const BikeCompatibilitySection = ({
  selectedCompanies,
  setSelectedCompanies,
  companies,
  formErrors,
  setFormErrors,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 4 }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
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
                <DirectionsBikeIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography
                variant="h6"
                fontWeight="800"
                sx={{ color: "text.primary", letterSpacing: -0.5 }}
              >
                Bike Compatibility
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Select the bike brands that are compatible with this service.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="text"
              onClick={() => setSelectedCompanies(companies)}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 2,
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) }
              }}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() => setSelectedCompanies([])}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 2,
                color: "text.secondary",
                "&:hover": { bgcolor: "action.hover" }
              }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ position: "relative" }}>
          <Autocomplete
            multiple
            options={companies}
            getOptionLabel={(option) => option.name || ""}
            value={selectedCompanies}
            onChange={(_, newValue) => {
              setSelectedCompanies(newValue);
              if (setFormErrors) setFormErrors((prev) => ({ ...prev, companies: null }));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.name}
                    {...tagProps}
                    sx={{
                      borderRadius: "10px",
                      fontWeight: "700",
                      bgcolor: "white",
                      color: "primary.main",
                      border: "1px solid",
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      m: 0.5,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderColor: "primary.main",
                      },
                    }}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search and select bike brands..."
                variant="outlined"
                error={!!formErrors?.companies}
                helperText={formErrors?.companies}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                    bgcolor: "#fcfcfc",
                    p: 1.5,
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Future Extension Placeholder */}
        {selectedCompanies.length > 0 && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: "12px",
              bgcolor: alpha(theme.palette.info.main, 0.03),
              border: "1px dashed",
              borderColor: alpha(theme.palette.info.main, 0.2),
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }} />
              Models for selected brands will appear here in the next version.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BikeCompatibilitySection;


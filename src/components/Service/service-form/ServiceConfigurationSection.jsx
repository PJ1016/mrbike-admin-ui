import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
  TextField,
  Box,
  useTheme,
  alpha,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ServiceConfigurationSection = ({
  selectedBaseService,
  setSelectedBaseService,
  baseServices,
  selectedDealer,
  setSelectedDealer,
  dealers,
  formData,
  setFormData,
  formErrors,
  setFormErrors,
  dealerId,
  getImageUrl,
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
        overflow: "visible",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              width: 42,
              height: 42,
              borderRadius: "12px",
            }}
          >
            <SettingsIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2 }}>
              Service Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a base service and assign a dealer for this configuration.
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={4}>
          {/* Select Service Cards */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, color: "text.secondary", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Service
            </Typography>
            <Grid container spacing={2}>
              {baseServices.map((service) => {
                const isSelected = selectedBaseService?._id === service._id;
                // Format name: replace underscores with spaces and capitalize words
                const formattedName = service.name
                  ?.toLowerCase()
                  .replace(/_/g, " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                return (
                  <Grid item xs={12} sm={6} md={4} key={service._id}>
                    <Box
                      onClick={() => {
                        setSelectedBaseService(service);
                        setFormErrors((prev) => ({
                          ...prev,
                          base_service_id: null,
                        }));
                      }}
                      sx={{
                        px: 2,
                        py: 3,
                        height: "100%",
                        cursor: "pointer",
                        borderRadius: "20px",
                        border: "2px solid",
                        borderColor: isSelected ? "primary.main" : "divider",
                        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : "white",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: 2,
                        "&:hover": {
                          borderColor: isSelected ? "primary.main" : alpha(theme.palette.primary.main, 0.2),
                          transform: "translateY(-6px)",
                          boxShadow: isSelected 
                            ? `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                            : "0 12px 24px rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      {isSelected && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                          }}
                        >
                          <CheckCircleIcon
                            sx={{
                              color: "white",
                              fontSize: 16,
                            }}
                          />
                        </Box>
                      )}
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: "16px",
                          bgcolor: isSelected ? "white" : alpha(theme.palette.primary.main, 0.03),
                          border: "1px solid",
                          borderColor: isSelected ? "divider" : "transparent",
                          transition: "all 0.3s",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                        }}
                      >
                        <Avatar
                          src={getImageUrl(service.image)}
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "12px",
                            bgcolor: "transparent",
                          }}
                        >
                          <SettingsIcon sx={{ fontSize: 28, color: "text.secondary" }} />
                        </Avatar>
                      </Box>
                      <Box>
                        <Typography
                          variant="body1"
                          fontWeight={isSelected ? 800 : 700}
                          color={isSelected ? "primary.main" : "text.primary"}
                          sx={{ mb: 0.5, lineHeight: 1.3 }}
                        >
                          {formattedName || service.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                          {isSelected ? "Service Selected" : "Click to select"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {formErrors.base_service_id && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {formErrors.base_service_id}
              </Typography>
            )}
          </Grid>

          {/* Assign Dealer */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, color: "text.secondary", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assign Dealer
            </Typography>
            <FormControl
              fullWidth
              error={!!formErrors.dealer}
            >
              <InputLabel>Choose a Dealer</InputLabel>
              <Select
                value={selectedDealer?._id || ""}
                label="Choose a Dealer"
                disabled={
                  !!dealerId ||
                  !!new URLSearchParams(window.location.search).get("dealerId")
                }
                onChange={(e) => {
                  const dealer = dealers.find((d) => d._id === e.target.value);
                  setSelectedDealer(dealer);
                  setFormErrors((prev) => ({ ...prev, dealer: null }));
                }}
                sx={{
                  borderRadius: "16px",
                  bgcolor: "#fcfcfc",
                  "& .MuiSelect-select": {
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              >
                {dealers.map((dealer) => (
                  <MenuItem key={dealer._id} value={dealer._id} sx={{ py: 1.5, px: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: "primary.main",
                          borderRadius: "10px",
                        }}
                      >
                        <StorefrontIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700">
                          {dealer.shopName || dealer.name || "Unknown Shop"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dealer.city || "No City Data"}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              {formErrors.dealer && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                  {formErrors.dealer}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, color: "text.secondary", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dealer Internal Description
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={6}
              value={formData.description}
              placeholder="Internal notes about how this dealer performs the service..."
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setFormErrors((prev) => ({ ...prev, description: null }));
              }}
              error={!!formErrors.description}
              helperText={formErrors.description}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  backgroundColor: "#fcfcfc",
                  p: 2,
                },
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ServiceConfigurationSection;


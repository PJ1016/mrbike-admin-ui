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
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import StorefrontIcon from "@mui/icons-material/Storefront";

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
  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography
          variant="h6"
          fontWeight="800"
          sx={{ mb: 3, color: "text.primary" }}
        >
          Service Configuration
        </Typography>

        <Grid container spacing={3}>
          {/* Select Service */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.base_service_id}>
              <InputLabel>Select Service</InputLabel>

              <Select
                value={selectedBaseService?._id || ""}
                label="Select Service"
                onChange={(e) => {
                  const service = baseServices.find(
                    (s) => s._id === e.target.value,
                  );
                  setSelectedBaseService(service);
                  setFormErrors((prev) => ({
                    ...prev,
                    base_service_id: null,
                  }));
                }}
                sx={{ borderRadius: "12px" }}
              >
                {baseServices.map((service) => (
                  <MenuItem key={service._id} value={service._id}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={getImageUrl(service.image)}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "4px",
                        }}
                      >
                        <SettingsIcon sx={{ fontSize: 16 }} />
                      </Avatar>

                      <Typography variant="body2">{service.name}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>

              {formErrors.base_service_id && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.5 }}
                >
                  {formErrors.base_service_id}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Assign Dealer */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.dealer}>
              <InputLabel>Assign Dealer</InputLabel>

              <Select
                value={selectedDealer?._id || ""}
                label="Assign Dealer"
                disabled={
                  !!dealerId ||
                  !!new URLSearchParams(window.location.search).get("dealerId")
                }
                onChange={(e) => {
                  const dealer = dealers.find((d) => d._id === e.target.value);
                  setSelectedDealer(dealer);
                  setFormErrors((prev) => ({
                    ...prev,
                    dealer: null,
                  }));
                }}
                sx={{ borderRadius: "12px" }}
              >
                {dealers.map((dealer) => (
                  <MenuItem key={dealer._id} value={dealer._id}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <StorefrontIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />

                      <Typography variant="body2">
                        {dealer.shopName || dealer.name || "Unknown Shop"}
                        {dealer.city ? ` (${dealer.city})` : ""}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>

              {formErrors.dealer && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.5 }}
                >
                  {formErrors.dealer}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Dealer Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dealer Internal Description"
              multiline
              minRows={6}
              value={formData.description}
              placeholder="Describe how the dealer performs this service..."
              onChange={(e) => {
                setFormData({
                  ...formData,
                  description: e.target.value,
                });

                setFormErrors((prev) => ({
                  ...prev,
                  description: null,
                }));
              }}
              error={!!formErrors.description}
              helperText={
                formErrors.description ||
                "Briefly describe how the dealer performs this service."
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
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

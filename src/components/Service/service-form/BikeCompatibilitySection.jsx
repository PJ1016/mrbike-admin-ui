import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Chip,
} from "@mui/material";

const BikeCompatibilitySection = ({
  selectedCompanies,
  setSelectedCompanies,
  companies,
  formErrors,
  setFormErrors,
}) => {
  return (
    <Card sx={{ mb: 4, borderRadius: "16px" }}>
      <CardContent sx={{ p: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Typography
            variant="h6"
            fontWeight="800"
            sx={{ color: "text.primary", letterSpacing: -0.5 }}
          >
            Bike Compatibility
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => setSelectedCompanies(companies)}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Select All
            </Button>
            <Button
              size="small"
              color="inherit"
              onClick={() => setSelectedCompanies([])}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>

        <Autocomplete
          multiple
          options={companies}
          getOptionLabel={(option) => option.name || ""}
          value={selectedCompanies}
          onChange={(_, newValue) => {
            setSelectedCompanies(newValue);
            setFormErrors((prev) => ({ ...prev, companies: null }));
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={`${option.name} 🏍`}
                  {...tagProps}
                  sx={{
                    borderRadius: "10px",
                    fontWeight: "700",
                    bgcolor: "primary.light",
                    color: "primary.main",
                    border: "1px solid",
                    borderColor: "primary.main",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "white",
                      transform: "translateY(-2px)",
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
              error={!!formErrors.companies}
              helperText={formErrors.companies}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "12px" },
              }}
            />
          )}
        />
      </CardContent>
    </Card>
  );
};

export default BikeCompatibilitySection;

import { Card, CardContent, Typography, Stack, Box } from "@mui/material";

const PricingDistributionSummary = ({ priceDistribution }) => {
  if (priceDistribution.length === 0) return null;

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#f8fafc",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight="800"
          sx={{
            mb: 2,
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: "0.7rem",
          }}
        >
          Pricing Distribution Summary
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {priceDistribution.map(([price, count]) => (
            <Box
              key={price}
              sx={{
                px: 2,
                py: 1,
                bgcolor: "white",
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              }}
            >
              <Typography
                variant="body2"
                fontWeight="800"
                color="primary.main"
                sx={{ mr: 1 }}
              >
                ₹{price}
              </Typography>
              <Typography
                variant="caption"
                fontWeight="600"
                color="text.secondary"
              >
                ({count} bikes)
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PricingDistributionSummary;

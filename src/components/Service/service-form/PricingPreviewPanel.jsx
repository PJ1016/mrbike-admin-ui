import { Card, CardContent, Typography, Stack } from "@mui/material";

const PricingPreviewPanel = ({ allBikesWithPrices }) => {
  return (
    <Card
      sx={{
        borderRadius: "20px",
        bgcolor: "#1e293b",
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight="800"
          sx={{
            mb: 2,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontSize: "0.65rem",
          }}
        >
          Pricing Preview
        </Typography>
        <Stack spacing={2}>
          {allBikesWithPrices.slice(0, 5).length > 0 ? (
            allBikesWithPrices.slice(0, 5).map((bike) => (
              <Stack
                key={bike.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" fontWeight="500">
                  {bike.model_name} {bike.cc}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="800"
                  sx={{ color: "primary.light" }}
                >
                  ₹{bike.effectivePrice || "--"}
                </Typography>
              </Stack>
            ))
          ) : (
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.4)" }}
            >
              Configure brands and rules to see preview
            </Typography>
          )}
          {allBikesWithPrices.length > 5 && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.4)",
                textAlign: "center",
              }}
            >
              + {allBikesWithPrices.length - 5} more bikes
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PricingPreviewPanel;

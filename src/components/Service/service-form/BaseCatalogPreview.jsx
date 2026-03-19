import { Box, Card, CardContent, Typography } from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";

const BaseCatalogPreview = ({ selectedBaseService, getImageUrl }) => {
  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Typography
          variant="caption"
          fontWeight="800"
          color="text.secondary"
          sx={{
            p: 3,
            pb: 0,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            display: "block",
            fontSize: "0.65rem",
          }}
        >
          Base Catalog Item
        </Typography>
        {selectedBaseService ? (
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                height: 180,
                width: "100%",
                bgcolor: "#f1f5f9",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {selectedBaseService.image ? (
                <Box
                  component="img"
                  src={getImageUrl(selectedBaseService.image)}
                  alt={selectedBaseService.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <Box
                sx={{
                  display: selectedBaseService.image ? "none" : "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "text.secondary",
                }}
              >
                <BuildIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="caption" fontWeight="700">
                  No Image
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" fontWeight="800">
              {selectedBaseService.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedBaseService.description ||
                "Premium bike service from our catalog."}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: "12px",
              m: 3,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Select a service to see details
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BaseCatalogPreview;

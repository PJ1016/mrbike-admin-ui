import { Box, Typography, Stack, Button, CircularProgress } from "@mui/material";

const FooterActions = ({ isDirty, isSubmitting, navigate }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: { lg: 280 }, // Account for sidebar
        right: 0,
        bgcolor: "white",
        borderTop: "1px solid",
        borderColor: "divider",
        p: 2,
        px: 4,
        zIndex: 1000,
        boxShadow: "0 -8px 30px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {isDirty && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "primary.main",
                animation: "pulse 2s infinite",
              }}
            />
            <Typography variant="body2" fontWeight="700" color="text.primary">
              Unsaved changes
            </Typography>
          </Box>
        )}
      </Box>
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate("/services")}
          disabled={isSubmitting}
          sx={{
            borderRadius: "12px",
            px: 4,
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting || !isDirty}
          sx={{
            borderRadius: "12px",
            px: 6,
            fontWeight: 800,
            textTransform: "none",
            boxShadow: (theme) => `0 4px 14px ${theme.palette.primary.main}40`,
          }}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </Button>
      </Stack>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 1; }
            70% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(0.95); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default FooterActions;

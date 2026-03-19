import React from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

const PageHeader = ({ title, breadcrumbs, action }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 1.5 }}
          >
            {breadcrumbs.map((item, index) => (
              <Link
                key={index}
                component={RouterLink}
                to={item.path}
                underline="hover"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color:
                    index === breadcrumbs.length - 1
                      ? "text.primary"
                      : "text.secondary",
                  fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                  fontSize: "0.875rem",
                  pointerEvents: index === breadcrumbs.length - 1 ? "none" : "auto",
                }}
              >
                {item.label}
              </Link>
            ))}
          </Breadcrumbs>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </Typography>
        </Box>

        {action ? (
          <Button
            variant="outlined"
            onClick={action.onClick}
            startIcon={action.icon || <ArrowBackIosNewIcon sx={{ fontSize: "14px !important" }} />}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              border: "1px solid",
              borderColor: "divider",
              color: "text.primary",
              bgcolor: "white",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              },
            }}
          >
            {action.label}
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: "14px !important" }} />}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              border: "1px solid",
              borderColor: "divider",
              color: "text.primary",
              bgcolor: "white",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              },
            }}
          >
            Back
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default PageHeader;

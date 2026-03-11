import React, { useRef } from "react";
import Alladmins from "../../components/Admin/AdminList/AdminList";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import {
  Home as HomeIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  FileDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";

const Admin = () => {
  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);
  
  const [downloadAnchorEl, setDownloadAnchorEl] = React.useState(null);
  const openDownload = Boolean(downloadAnchorEl);

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ minHeight: "100vh", pb: 4 }}>
          {/* Premium Header Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              mb: 4,
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a202c", mb: 1 }}>
                Admins
              </Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <MuiLink
                  component={Link}
                  underline="hover"
                  color="inherit"
                  to="/"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Dashboard
                </MuiLink>
                <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                  Admins
                </Typography>
              </Breadcrumbs>
            </Box>

            <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Button
                variant="outlined"
                onClick={handleDownloadClick}
                startIcon={<DownloadIcon />}
                sx={{
                  backgroundColor: "white",
                  borderColor: "#e2e8f0",
                  color: "#4a5568",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#f7fafc",
                    borderColor: "#cbd5e0",
                  },
                }}
              >
                Export
              </Button>
              <Menu
                anchorEl={downloadAnchorEl}
                open={openDownload}
                onClose={handleDownloadClose}
                PaperProps={{
                  sx: {
                    width: 160,
                    boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)",
                    border: "1px solid #e2e8f0",
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    triggerDownloadExcel.current?.();
                    handleDownloadClose();
                  }}
                  sx={{ fontWeight: 500 }}
                >
                  <ExcelIcon sx={{ mr: 1, color: "#2d3748" }} fontSize="small" />
                  Excel
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    triggerDownloadPDF.current?.();
                    handleDownloadClose();
                  }}
                  sx={{ fontWeight: 500 }}
                >
                  <PdfIcon sx={{ mr: 1, color: "#2d3748" }} fontSize="small" />
                  PDF
                </MenuItem>
              </Menu>

              <Button
                component={Link}
                to="/addadmin"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: "#2e83ff",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#1a6fed",
                    boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1)",
                  },
                }}
              >
                Add New Admin
              </Button>
            </Stack>
          </Box>

          {/* Admin Content Area */}
          <Alladmins
            triggerDownloadExcel={triggerDownloadExcel}
            triggerDownloadPDF={triggerDownloadPDF}
          />
        </Box>
      </div>
    </div>
  );
};

export default Admin;

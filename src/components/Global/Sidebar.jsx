import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  EventNote as BookingIcon,
  People as DealerIcon,
  Build as ServiceIcon,
  Person as CustomerIcon,
  Payments as PaymentIcon,
  Redeem as RewardIcon,
  Image as BannerIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  FiberManualRecord as BulletIcon,
  SupportAgent as TicketIcon,
  PowerSettingsNew as LogoutIcon,
} from "@mui/icons-material";

const DRAWER_WIDTH = 280;

const menuConfig = [
  {
    title: "GENERAL",
    type: "header",
  },
  {
    title: "Dashboard",
    icon: <DashboardIcon />,
    path: "/",
  },
  {
    title: "OPERATIONS",
    type: "header",
  },
  {
    title: "Bookings",
    icon: <BookingIcon />,
    path: "/bookings",
  },
  {
    title: "MANAGEMENT",
    type: "header",
  },
  {
    title: "Dealers",
    icon: <DealerIcon />,
    children: [
      { title: "Dealer List", path: "/dealers" },
      { title: "Verify Dealers", path: "/dealers-verify" },
      // { title: "Performance", path: "/dealer-performance" },
    ],
  },
  {
    title: "Services",
    icon: <ServiceIcon />,
    children: [
      { title: "Major Services", path: "/base-services" },
      { title: "Additional Services", path: "/base-additional-services" },
      { title: "Dealer Services", path: "/services" },
    ],
  },
  {
    title: "Customers",
    icon: <CustomerIcon />,
    path: "/customers",
  },
  {
    title: "FINANCE",
    type: "header",
  },
  {
    title: "Payments",
    icon: <PaymentIcon />,
    children: [
      { title: "Payment List", path: "/paymentList" },
      { title: "Dealer Payouts", path: "/approve" },
    ],
  },
  {
    title: "Rewards",
    icon: <RewardIcon />,
    path: "/rewards",
  },
  {
    title: "ENGAGEMENT",
    type: "header",
  },
  {
    title: "Banners",
    icon: <BannerIcon />,
    path: "/bannerList",
  },
  {
    title: "Offers",
    icon: <RewardIcon />, // Reusing RewardIcon or look for a LocalOffer icon
    path: "/offers",
  },
  {
    title: "Tickets",
    icon: <TicketIcon />,
    path: "/all-tickets",
  },
  {
    title: "SYSTEM",
    type: "header",
  },
  {
    title: "Admin Users",
    icon: <AdminIcon />,
    path: "/admins",
  },
];

const Sidebar = ({ mobileOpen, handleToggleDrawer, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});

  const handleMenuClick = (title, path, hasChildren) => {
    if (hasChildren) {
      setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
    } else if (path) {
      navigate(path);
      if (isMobile) handleToggleDrawer();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const renderMenuItem = (item, isChild = false) => {
    if (item.type === "header") {
      return (
        <Typography
          key={item.title}
          variant="caption"
          sx={{
            px: 3,
            py: 2,
            display: "block",
            fontWeight: 700,
            color: "text.secondary",
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          {item.title}
        </Typography>
      );
    }

    const hasChildren = !!item.children;
    const isOpen = openMenus[item.title];
    const isActive = location.pathname === item.path || (item.children?.some(child => location.pathname === child.path));

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
          <ListItemButton
            onClick={() => handleMenuClick(item.title, item.path, hasChildren)}
            active={isActive ? 1 : 0}
            sx={{
              borderRadius: "10px",
              py: 1,
              bgcolor: isActive && !hasChildren ? "primary.main" : "transparent",
              color: isActive && !hasChildren ? "primary.contrastText" : "text.primary",
              "&:hover": {
                bgcolor: isActive && !hasChildren ? "primary.dark" : "rgba(46, 131, 255, 0.08)",
              },
              transition: "all 0.2s",
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive && !hasChildren ? "inherit" : isActive ? "primary.main" : "text.secondary",
              }}
            >
              {isChild ? <BulletIcon sx={{ fontSize: 8 }} /> : item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title} 
              primaryTypographyProps={{ 
                fontSize: "0.875rem", 
                fontWeight: isActive ? 600 : 500,
              }} 
            />
            {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {item.children.map((child) => renderMenuItem(child, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
      {/* Sidebar Brand/Header */}
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Box 
          sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: "primary.main", 
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "1.2rem",
            boxShadow: "0 4px 12px rgba(46, 131, 255, 0.3)"
          }}
        >
          BD
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1, color: "#1e293b" }}>
            BIKE DOCTOR
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            ADMIN PORTAL
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 1, opacity: 0.6 }} />

      {/* Menu Items */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 0, py: 1 }}>
        <List>
          {menuConfig.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      <Divider sx={{ mx: 2, mt: "auto", opacity: 0.6 }} />

      {/* Footer / Logout */}
      <Box sx={{ p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: "10px",
              color: "error.main",
              "&:hover": { bgcolor: "error.light", color: "error.contrastText", "& .MuiListItemIcon-root": { color: "inherit" } }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleToggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, border: "none" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": { 
            boxSizing: "border-box", 
            width: DRAWER_WIDTH, 
            border: "none",
            borderRight: "1px solid #e2e8f0",
            bgcolor: "#fff"
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
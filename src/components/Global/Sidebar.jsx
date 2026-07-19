import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getDealersVerify } from "../../api";
import { logout } from "../../redux/slices/authSlice";
import { useSupportUnread } from "../../context/SupportUnreadContext";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
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
  FiberManualRecord as BulletIcon,
  SupportAgent as TicketIcon,
  PowerSettingsNew as LogoutIcon,
  TwoWheeler as BikeIcon,
  PlaceOutlined,
  BarChart as FinanceDashIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as TransactionIcon,
  SwapHoriz as WithdrawalIcon,
  TuneOutlined as PreferencesIcon,
  CampaignOutlined as CampaignsIcon,
  LocalOfferOutlined as PromoCodesIcon,
  CardGiftcardOutlined as RewardsReferralIcon,
  GavelOutlined as LegalIcon,
  DashboardCustomizeOutlined as AppContentIcon,
} from "@mui/icons-material";
import { Chip } from "@mui/material";

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
      { title: "Major Services", path: "/MajorServices" },
      { title: "Additional Services", path: "/base-additional-services" },
    ],
  },
  {
    title: "Customers",
    icon: <CustomerIcon />,
    path: "/customers",
  },
  {
    title: "Bikes",
    icon: <BikeIcon />,
    children: [
      { title: "Bike Companies", path: "/bikes" },
      { title: "Add Bike Company", path: "/addBikeCompany" },
    ],
  },
  {
    title: "FINANCE",
    type: "header",
  },
  {
    title: "Finance Dashboard",
    icon: <FinanceDashIcon />,
    path: "/finance",
  },
  {
    title: "Withdrawal Requests",
    icon: <WithdrawalIcon />,
    path: "/finance/withdrawals",
  },
  {
    title: "Dealer Wallets",
    icon: <WalletIcon />,
    path: "/finance/dealer-wallets",
  },
  {
    title: "Transactions",
    icon: <TransactionIcon />,
    path: "/finance/transactions",
  },
  {
    title: "PREFERENCES",
    type: "header",
  },
  {
    title: "Preferences",
    icon: <PreferencesIcon />,
    children: [
      { title: "Campaigns", icon: <CampaignsIcon />, path: "/preferences/campaigns" },
      { title: "Promo Codes", icon: <PromoCodesIcon />, path: "/preferences/promo-codes" },
      { title: "Rewards & Referral", icon: <RewardsReferralIcon />, path: "/preferences/rewards-referral" },
      { title: "Legal", icon: <LegalIcon />, path: "/preferences/legal" },
      { title: "App Content", icon: <AppContentIcon />, path: "/preferences/app-content" },
    ],
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
    title: "Support",
    icon: <TicketIcon />,
    children: [
      { title: "Customer Tickets", path: "/support/customer" },
      { title: "Dealer Tickets", path: "/support/dealer" },
    ],
  },
  {
    title: "Location Categories",
    icon: <PlaceOutlined />,
    path: "/location-featured-categories",
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
  const dispatch = useDispatch();
  const [openMenus, setOpenMenus] = useState({});
  const [pendingVerifyCount, setPendingVerifyCount] = useState(0);
  const { unreadCount: supportUnreadCount } = useSupportUnread();

  useEffect(() => {
    getDealersVerify()
      .then((res) => {
        if (res.success) {
          const count = (res.vendors || []).filter(
            (v) => (v.registrationStatus || "").toLowerCase() === "pending",
          ).length;
          setPendingVerifyCount(count);
        }
      })
      .catch(() => {});
  }, []);

  const handleMenuClick = (title, path, hasChildren) => {
    if (hasChildren) {
      setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
    } else if (path) {
      navigate(path);
      if (isMobile) handleToggleDrawer();
    }
  };

  const handleLogout = () => {
    dispatch(logout());
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
    const isDisabled = !!item.disabled;

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding sx={{ px: 1, mb: 0.5 }}>
          <ListItemButton
            onClick={() => !isDisabled && handleMenuClick(item.title, item.path, hasChildren)}
            active={isActive ? 1 : 0}
            sx={{
              borderRadius: "8px",
              py: 1,
              px: 1.5,
              bgcolor: isActive && !hasChildren ? "primary.light" : "transparent",
              color: isDisabled ? "#cbd5e1" : isActive && !hasChildren ? "primary.main" : "text.secondary",
              cursor: isDisabled ? "default" : "pointer",
              "&:hover": isDisabled ? {} : {
                bgcolor: isActive && !hasChildren ? "primary.light" : "neutral-100",
                color: isActive && !hasChildren ? "primary.main" : "neutral-800",
              },
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 32,
                color: isDisabled ? "#cbd5e1" : isActive ? "primary.main" : "inherit",
                "& svg": { fontSize: isChild ? 18 : 20 }
              }}
            >
              {isChild ? (item.icon || <BulletIcon sx={{ fontSize: 6 }} />) : item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                color: isDisabled ? "#cbd5e1" : undefined,
              }}
            />
            {isChild && item.path === "/dealers-verify" && pendingVerifyCount > 0 && (
              <Chip
                label={pendingVerifyCount}
                size="small"
                color="error"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  minWidth: 24,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
            {!isChild && item.title === "Support" && supportUnreadCount > 0 && (
              <Chip
                label={supportUnreadCount}
                size="small"
                color="error"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  minWidth: 24,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
            {isDisabled && (
              <Chip
                label="Soon"
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  bgcolor: "#f1f5f9",
                  color: "#94a3b8",
                  border: "1px solid #e2e8f0",
                }}
              />
            )}
            {!isDisabled && hasChildren && (
              <Box sx={{ display: 'flex', color: 'text.disabled' }}>
                {isOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
              </Box>
            )}
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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#ffffff" }}>
      {/* Sidebar Brand/Header */}
      <Box sx={{ p: 4, pb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Box 
          sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: "primary.main", 
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "900",
            fontSize: "1.2rem",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
          }}
        >
          BD
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: "neutral.800" }}>
            BIKE DOCTOR
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: "0.05em" }}>
            ADMIN
          </Typography>
        </Box>
      </Box>

      {/* Menu Items */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: "auto", 
        px: 2, 
        py: 2,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'neutral.200', borderRadius: '10px' }
      }}>
        <List sx={{ pt: 0 }}>
          {menuConfig.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer / Account */}
      <Box sx={{ p: 2, mt: "auto", borderTop: "1px solid #f1f5f9" }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: "10px",
              color: "text.secondary",
              py: 1.5,
              "&:hover": { 
                bgcolor: "error.light", 
                color: "error.main", 
                "& .MuiListItemIcon-root": { color: "inherit" } 
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
              <LogoutIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleToggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { 
            boxSizing: "border-box", 
            width: DRAWER_WIDTH, 
            border: "none",
            boxShadow: "var(--shadow-lg)"
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": { 
            boxSizing: "border-box", 
            width: DRAWER_WIDTH, 
            border: "none",
            borderRight: "1px solid #f1f5f9",
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
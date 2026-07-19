import React, { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import AppBannerManager from "../../components/Preferences/AppContent/AppBannerManager";
import FaqManager from "../../components/Preferences/AppContent/FaqManager";
import AppSettingsPanel from "../../components/Preferences/AppContent/AppSettingsPanel";
import { BANNER_TYPES } from "../../api/preferences/appContentApi";

const TABS = [
  { key: "home", label: "Home Banners" },
  { key: "popup", label: "Popup Banners" },
  { key: "announcement", label: "Announcement Banners" },
  { key: "faq", label: "FAQ" },
  { key: "settings", label: "Support & Links" },
];

// Page shell for the App Content module — five tabs (three banner
// collections + FAQ + support/social settings), only the active tab's
// panel is rendered. The outer PrefHeader intentionally has no onAdd:
// "Add" is contextual per-tab, so each tab's own manager component renders
// its own PrefHeader with a tab-specific Add button instead.
const AppContent = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <PrefHeader title="App Content" subtitle="Manage everything shown inside the customer app from one place" />

      <Box sx={{ borderBottom: 1, borderColor: "#e2e8f0", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 44, color: "#64748b" },
            "& .Mui-selected": { color: "#2563eb !important" },
            "& .MuiTabs-indicator": { bgcolor: "#2563eb", height: 3, borderRadius: "3px" },
          }}
        >
          {TABS.map((t) => (
            <Tab key={t.key} label={t.label} />
          ))}
        </Tabs>
      </Box>

      {activeTab === 0 && <AppBannerManager bannerType={BANNER_TYPES.HOME} title="Home Banners" />}
      {activeTab === 1 && <AppBannerManager bannerType={BANNER_TYPES.POPUP} title="Popup Banners" />}
      {activeTab === 2 && <AppBannerManager bannerType={BANNER_TYPES.ANNOUNCEMENT} title="Announcement Banners" />}
      {activeTab === 3 && <FaqManager />}
      {activeTab === 4 && <AppSettingsPanel />}
    </Box>
  );
};

export default AppContent;

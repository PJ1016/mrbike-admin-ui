import React, { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import AppPopupsManager from "../../components/Preferences/AppContent/AppPopupsManager";
import FaqManager from "../../components/Preferences/AppContent/FaqManager";
import AppSettingsPanel from "../../components/Preferences/AppContent/AppSettingsPanel";

const TABS = [
  { key: "app-popups", label: "App Popups" },
  { key: "faq", label: "FAQ" },
  { key: "settings", label: "Support & Links" },
];

// Page shell for the App Content module — three tabs (the merged App Popups
// collection + FAQ + support/social settings), only the active tab's panel
// is rendered. App Popups merges what used to be separate "Popup Banners" /
// "Announcement Banners" tabs: both are the same AppBanner collection
// discriminated by bannerType, so they're now one workspace (AppPopupsManager)
// with a Type field/filter instead of two near-identical tabs. There is no
// "Home Banners" tab here — that's handled by the existing, separate Banners
// module (sidebar "Banners" / /bannerList), so it isn't duplicated in App
// Content. The outer PrefHeader intentionally has no onAdd: "Add" is
// contextual per-tab, so each tab's own manager component renders its own
// PrefHeader with a tab-specific Add button instead.
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

      {activeTab === 0 && <AppPopupsManager />}
      {activeTab === 1 && <FaqManager />}
      {activeTab === 2 && <AppSettingsPanel />}
    </Box>
  );
};

export default AppContent;

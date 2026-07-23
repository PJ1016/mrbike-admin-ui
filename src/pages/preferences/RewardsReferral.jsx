import React, { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import ReferralSettingsPanel from "../../components/Preferences/RewardsReferral/ReferralSettingsPanel";
import ReferralTransactionsPanel from "../../components/Preferences/RewardsReferral/ReferralTransactionsPanel";

// This module's identity color (emerald) — shared by both tabs per the
// Rewards & Referral spec.
const ACCENT = "#059669";

const TAB_LABELS = ["Referral Settings", "Referral Transactions"];

// Preferences > Rewards & Referral, scoped to the current Referral feature
// only. Reward Points, Redemption, Signup Bonus, Cashback and the legacy
// Referral Bonus rule tabs were removed from this UI (their backend logic,
// APIs and components are untouched) — they'll return as separate
// modules/pages once those features are actually implemented.
const RewardsReferral = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <PrefHeader title="Rewards & Referral" subtitle="Configure referral settings and review referral transactions." />

      <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          TabIndicatorProps={{ style: { backgroundColor: ACCENT } }}
          sx={{
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none", color: "#64748b", minHeight: 44 },
            "& .Mui-selected": { color: `${ACCENT} !important` },
          }}
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>

      {tab === 0 && <ReferralSettingsPanel />}
      {tab === 1 && <ReferralTransactionsPanel />}
    </Box>
  );
};

export default RewardsReferral;

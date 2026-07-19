import React, { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import RewardTransactionsPanel from "../../components/Preferences/RewardsReferral/RewardTransactionsPanel";
import RewardRuleManager from "../../components/Preferences/RewardsReferral/RewardRuleManager";
import { RULE_TYPES } from "../../api/preferences/rewardRuleApi";

// This module's identity color (emerald) — shared by every rule tab plus the
// transactions tab's empty state, per the Rewards & Referral spec.
const ACCENT = "#059669";

const TAB_LABELS = [
  "Reward Transactions",
  "Referral Bonus",
  "Reward Point Rules",
  "Redemption Rules",
  "Signup Bonus",
  "Cashback Rules",
];

const referralBonusFields = [
  { key: "ruleName", label: "Rule Name", type: "text", required: true },
  { key: "referrerBonusPoints", label: "Referrer Bonus Points", type: "number", required: true },
  { key: "refereeBonusPoints", label: "Referee Bonus Points", type: "number", required: true },
  { key: "minBookingValue", label: "Minimum Booking Value", type: "number", adornment: "₹" },
  { key: "maxReferralsPerUser", label: "Max Referrals Per User", type: "number" },
];

const referralBonusColumns = [
  { key: "ruleName", label: "Rule Name" },
  { key: "referrerBonusPoints", label: "Referrer Bonus" },
  { key: "refereeBonusPoints", label: "Referee Bonus" },
  {
    key: "minBookingValue",
    label: "Min Booking Value",
    render: (r) => (r.minBookingValue !== undefined && r.minBookingValue !== null && r.minBookingValue !== "" ? `₹${r.minBookingValue}` : "—"),
  },
  { key: "maxReferralsPerUser", label: "Max Referrals/User", render: (r) => r.maxReferralsPerUser ?? "Unlimited" },
];

const pointRuleFields = [
  { key: "ruleName", label: "Rule Name", type: "text", required: true },
  {
    key: "earningBasis",
    label: "Earning Basis",
    type: "select",
    required: true,
    options: [
      { value: "per_100_spent", label: "Per ₹100 Spent" },
      { value: "fixed_per_booking", label: "Fixed Points Per Booking" },
    ],
  },
  { key: "pointsValue", label: "Points Value", type: "number", required: true },
  { key: "applicableService", label: "Applicable Service", type: "text", placeholder: "All Services" },
];

const EARNING_BASIS_LABELS = {
  per_100_spent: "Per ₹100 Spent",
  fixed_per_booking: "Fixed Points Per Booking",
};

const pointRuleColumns = [
  { key: "ruleName", label: "Rule Name" },
  { key: "earningBasis", label: "Earning Basis", render: (r) => EARNING_BASIS_LABELS[r.earningBasis] || r.earningBasis || "—" },
  { key: "pointsValue", label: "Points Value" },
  { key: "applicableService", label: "Applicable Service", render: (r) => r.applicableService || "All Services" },
];

const redemptionFields = [
  { key: "ruleName", label: "Rule Name", type: "text", required: true },
  { key: "minPointsToRedeem", label: "Minimum Points to Redeem", type: "number", required: true },
  { key: "pointValueInRupees", label: "Point Value in ₹", type: "number", required: true, helperText: "1 point = ₹X" },
  { key: "maxRedemptionPerOrder", label: "Max Redemption Per Order", type: "number", adornment: "₹" },
];

const redemptionColumns = [
  { key: "ruleName", label: "Rule Name" },
  { key: "minPointsToRedeem", label: "Min Points to Redeem" },
  { key: "pointValueInRupees", label: "Point Value", render: (r) => `₹${r.pointValueInRupees ?? 0}` },
  {
    key: "maxRedemptionPerOrder",
    label: "Max Redemption/Order",
    render: (r) =>
      r.maxRedemptionPerOrder !== undefined && r.maxRedemptionPerOrder !== null && r.maxRedemptionPerOrder !== ""
        ? `₹${r.maxRedemptionPerOrder}`
        : "—",
  },
];

const signupBonusFields = [
  { key: "ruleName", label: "Rule Name", type: "text", required: true },
  { key: "bonusPoints", label: "Bonus Points", type: "number", required: true },
  { key: "bonusValidityDays", label: "Bonus Validity in Days", type: "number", required: true },
];

const signupBonusColumns = [
  { key: "ruleName", label: "Rule Name" },
  { key: "bonusPoints", label: "Bonus Points" },
  { key: "bonusValidityDays", label: "Validity (Days)" },
];

const cashbackFields = [
  { key: "ruleName", label: "Rule Name", type: "text", required: true },
  { key: "minOrderValue", label: "Minimum Order Value", type: "number", required: true, adornment: "₹" },
  { key: "cashbackPercentage", label: "Cashback Percentage", type: "number", required: true, adornment: "%" },
  { key: "maxCashback", label: "Maximum Cashback", type: "number", adornment: "₹" },
];

const cashbackColumns = [
  { key: "ruleName", label: "Rule Name" },
  { key: "minOrderValue", label: "Min Order Value", render: (r) => `₹${r.minOrderValue ?? 0}` },
  { key: "cashbackPercentage", label: "Cashback %", render: (r) => `${r.cashbackPercentage ?? 0}%` },
  {
    key: "maxCashback",
    label: "Max Cashback",
    render: (r) => (r.maxCashback !== undefined && r.maxCashback !== null && r.maxCashback !== "" ? `₹${r.maxCashback}` : "—"),
  },
];

// Preferences > Rewards & Referral. Moves the legacy standalone Rewards
// feature (Reward Transactions tab) into Preferences, and adds five
// rule-management tabs on top, all built on the generic RewardRuleManager +
// RuleFormDrawer so each tab is just a config object rather than a bespoke page.
const RewardsReferral = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <PrefHeader
        title="Rewards & Referral"
        subtitle="Review reward transactions and configure referral, points, redemption, signup and cashback rules."
      />

      <Box sx={{ borderBottom: "1px solid #e2e8f0", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
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

      {tab === 0 && <RewardTransactionsPanel />}

      {tab === 1 && (
        <RewardRuleManager
          ruleType={RULE_TYPES.REFERRAL_BONUS}
          title="Referral Bonus Rules"
          accentColor={ACCENT}
          fields={referralBonusFields}
          columns={referralBonusColumns}
          searchFields={["ruleName"]}
          emptyMessage="No referral bonus rules configured yet."
        />
      )}

      {tab === 2 && (
        <RewardRuleManager
          ruleType={RULE_TYPES.POINT_RULES}
          title="Reward Point Rules"
          accentColor={ACCENT}
          fields={pointRuleFields}
          columns={pointRuleColumns}
          searchFields={["ruleName"]}
          emptyMessage="No reward point rules configured yet."
        />
      )}

      {tab === 3 && (
        <RewardRuleManager
          ruleType={RULE_TYPES.REDEMPTION_RULES}
          title="Redemption Rules"
          accentColor={ACCENT}
          fields={redemptionFields}
          columns={redemptionColumns}
          searchFields={["ruleName"]}
          emptyMessage="No redemption rules configured yet."
        />
      )}

      {tab === 4 && (
        <RewardRuleManager
          ruleType={RULE_TYPES.SIGNUP_BONUS}
          title="Signup Bonus Rules"
          accentColor={ACCENT}
          fields={signupBonusFields}
          columns={signupBonusColumns}
          searchFields={["ruleName"]}
          emptyMessage="No signup bonus rules configured yet."
        />
      )}

      {tab === 5 && (
        <RewardRuleManager
          ruleType={RULE_TYPES.CASHBACK_RULES}
          title="Cashback Rules"
          accentColor={ACCENT}
          fields={cashbackFields}
          columns={cashbackColumns}
          searchFields={["ruleName"]}
          emptyMessage="No cashback rules configured yet."
        />
      )}
    </Box>
  );
};

export default RewardsReferral;

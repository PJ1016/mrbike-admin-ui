import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip } from "@mui/material";

import SupportSearch from "../../Support/SupportSearch";
import SupportTable from "../../Support/SupportTable";
import SupportEmptyState from "../../Support/SupportEmptyState";
import { getReferralTransactions } from "../../../api/preferences/referralTransactionApi";

const ACCENT = "#059669";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const REWARD_TYPE_LABELS = {
  referrer: "Referrer",
  new_user: "New User",
};

const ReferralTransactionsPanel = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReferralTransactions(1, 100);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load referral transactions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.referrerName || "").toLowerCase().includes(q) ||
        (r.referredUserName || "").toLowerCase().includes(q) ||
        (r.bookingId || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  useEffect(() => setPage(1), [search]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const columns = [
    { key: "createdDate", label: "Date", render: (r) => fmtDate(r.createdDate) },
    { key: "referrerName", label: "Referrer" },
    { key: "referredUserName", label: "Referred User" },
    { key: "bookingId", label: "Booking ID", render: (r) => r.bookingId || "N/A" },
    { key: "rewardType", label: "Reward Type", render: (r) => REWARD_TYPE_LABELS[r.rewardType] || r.rewardType || "—" },
    { key: "rewardAmount", label: "Reward Amount", render: (r) => `₹${r.rewardAmount ?? 0}` },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Chip
          label={r.status === "reversed" ? "Reversed" : "Credited"}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: r.status === "reversed" ? "#fef2f2" : "#ecfdf5",
            color: r.status === "reversed" ? "#991b1b" : "#059669",
          }}
        />
      ),
    },
  ];

  return (
    <Box>
      {error && (
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: "12px",
            bgcolor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {error}
        </Box>
      )}

      <Box sx={{ mb: 2.5 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by referrer, referred user, booking ID…" />
      </Box>

      <SupportTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyState={<SupportEmptyState filtered={rows.length > 0} accentColor={ACCENT} onClearFilters={() => setSearch("")} />}
      />
    </Box>
  );
};

export default ReferralTransactionsPanel;

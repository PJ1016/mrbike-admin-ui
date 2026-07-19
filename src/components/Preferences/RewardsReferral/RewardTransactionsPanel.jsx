import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { Download } from "@mui/icons-material";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";

import SupportSearch from "../../Support/SupportSearch";
import SupportTable from "../../Support/SupportTable";
import SupportEmptyState from "../../Support/SupportEmptyState";
import { getAllRewards } from "../../../api";

// This module's identity color (emerald), shared across every Rewards &
// Referral tab per the module spec.
const ACCENT = "#059669";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Read-only tab: this is the legacy Rewards feature (src/pages/reward/RewardList.jsx +
// src/components/reward/rewardTable.jsx) restyled onto the modern
// Support* table primitives. Same data source (getAllRewards), same columns,
// same search + pagination + Excel/PDF export — no create/edit/delete/status
// controls, since a reward transaction is system-generated, not admin-authored.
const normalize = (r) => {
  const dealer = r.booking_id?.dealer_id;
  const vendorName =
    (dealer && typeof dealer === "object" ? dealer.name || dealer.dealer_name || dealer.business_name : null) ||
    (typeof dealer === "string" ? dealer : null) ||
    "N/A";
  const first = r.user_id?.first_name || "";
  const last = r.user_id?.last_name || "";
  const userName = `${first} ${last}`.trim();

  return {
    id: r._id || r.id,
    rewardId: r._id || r.id || "N/A",
    userName: userName || "N/A",
    bookingId: r.booking_id?.bookingId || "N/A",
    vendorName,
    services: Array.isArray(r.booking_id?.services) ? r.booking_id.services : [],
    rewardPoints: r.reward_points ?? 0,
    isScratched: !!r.is_scratched,
    createdAt: r.created_at || r.createdAt || null,
  };
};

const RewardTransactionsPanel = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [downloadAnchor, setDownloadAnchor] = useState(null);

  const tableRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllRewards();
      const list = Array.isArray(res?.rewards) ? res.rewards : Array.isArray(res) ? res : [];
      setRows(list.map(normalize));
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load reward transactions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.bookingId.toLowerCase().includes(q) ||
        r.rewardId.toLowerCase().includes(q) ||
        r.vendorName.toLowerCase().includes(q)
    );
  }, [rows, search]);

  useEffect(() => setPage(1), [search]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  // Exports pull from the full filtered list (not just the current page) via
  // a visually-hidden table kept in the DOM purely as the export source —
  // same useDownloadExcel/jsPDF approach as the legacy component.
  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Reward_Transactions",
    sheet: "Rewards",
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reward Transactions", 14, 10);
    doc.autoTable({ html: "#reward-export-table", startY: 20, theme: "striped" });
    doc.save("Reward_Transactions.pdf");
  };

  const columns = [
    {
      key: "rewardId",
      label: "Reward ID",
      render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{r.rewardId}</span>,
    },
    { key: "userName", label: "User Name" },
    { key: "bookingId", label: "Booking ID" },
    { key: "vendorName", label: "Vendor Name" },
    {
      key: "services",
      label: "Service Names",
      render: (r) =>
        r.services.length ? (
          <Stack spacing={0.25}>
            {r.services.map((s, i) => (
              <Typography key={i} variant="caption" sx={{ color: "#334155", display: "block" }}>
                • {s.name || s.service_name || "—"}
              </Typography>
            ))}
          </Stack>
        ) : (
          "N/A"
        ),
    },
    { key: "rewardPoints", label: "Reward Points", render: (r) => <strong>{r.rewardPoints}</strong> },
    {
      key: "isScratched",
      label: "Scratched?",
      render: (r) => (
        <Chip
          label={r.isScratched ? "Yes" : "No"}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: r.isScratched ? "#ecfdf5" : "#f1f5f9",
            color: r.isScratched ? "#059669" : "#64748b",
          }}
        />
      ),
    },
    { key: "createdAt", label: "Created At", render: (r) => fmtDate(r.createdAt) },
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

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ flex: 1 }}>
          <SupportSearch value={search} onChange={setSearch} placeholder="Search by user, booking ID, reward ID, vendor…" />
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={(e) => setDownloadAnchor(e.currentTarget)}
          disabled={!filtered.length}
          sx={{ borderRadius: "10px", fontWeight: 700, whiteSpace: "nowrap", borderColor: "#e2e8f0" }}
        >
          Download
        </Button>
        <Menu anchorEl={downloadAnchor} open={Boolean(downloadAnchor)} onClose={() => setDownloadAnchor(null)}>
          <MenuItem
            onClick={() => {
              setDownloadAnchor(null);
              onDownload();
            }}
          >
            Export as Excel
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDownloadAnchor(null);
              exportToPDF();
            }}
          >
            Export as PDF
          </MenuItem>
        </Menu>
      </Stack>

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

      {/* Visually-hidden full-data table — the only purpose of this markup is
          to give useDownloadExcel/jsPDF-autotable a DOM node to read from, so
          exports cover the whole filtered list rather than only the current page. */}
      <Box sx={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
        <table ref={tableRef} id="reward-export-table">
          <thead>
            <tr>
              <th>Reward ID</th>
              <th>User Name</th>
              <th>Booking ID</th>
              <th>Vendor Name</th>
              <th>Service Names</th>
              <th>Reward Points</th>
              <th>Scratched?</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.rewardId}</td>
                <td>{r.userName}</td>
                <td>{r.bookingId}</td>
                <td>{r.vendorName}</td>
                <td>{r.services.map((s) => s.name || s.service_name || "—").join(", ") || "N/A"}</td>
                <td>{r.rewardPoints}</td>
                <td>{r.isScratched ? "Yes" : "No"}</td>
                <td>{fmtDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

export default RewardTransactionsPanel;

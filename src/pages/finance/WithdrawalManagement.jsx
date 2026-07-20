import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import {
  HourglassEmpty,
  Autorenew,
  CheckCircle,
  Cancel,
  Refresh,
  Add,
} from "@mui/icons-material";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { updateWithdrawalStatus, getDealerWallet, adminDepositToDealer } from "../../api";
import { fetchAllPayouts } from "../../services/financeService";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:     { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  IN_PROGRESS: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  APPROVED:    { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  COMPLETED:   { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" }, // legacy alias
  REJECTED:    { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
};

const TXN_LABELS = {
  settlement_online: "Online Settlement",
  settlement_cash:   "Cash Settlement",
  withdrawal:        "Withdrawal",
  deposit:           "Deposit",
};

const DEBIT_TYPES = ["withdrawal"];

const TAB_META = [
  { status: "PENDING",     label: "Pending",     icon: <HourglassEmpty sx={{ fontSize: 16 }} /> },
  { status: "IN_PROGRESS", label: "In Progress", icon: <Autorenew     sx={{ fontSize: 16 }} /> },
  { status: "APPROVED",    label: "Approved",    icon: <CheckCircle   sx={{ fontSize: 16 }} /> },
  { status: "REJECTED",    label: "Rejected",    icon: <Cancel        sx={{ fontSize: 16 }} /> },
];

const ROWS_PER_PAGE = 10;

const getStatus = (p) => p.status || p.rawStatus || p.order_status;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {status === "COMPLETED" ? "APPROVED" : status}
    </span>
  );
};

const WalletStatCell = ({ label, value, valueColor }) => (
  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", flex: 1 }}>
    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </div>
    <div style={{ fontSize: 18, fontWeight: 700, color: valueColor || "#0f172a" }}>{value}</div>
  </div>
);

// ─── Action Buttons per status ────────────────────────────────────────────────

const RowActions = ({ row, onAction, busy }) => {
  const status = getStatus(row);
  const isViewOnly = status === "APPROVED" || status === "COMPLETED" || status === "REJECTED";

  if (isViewOnly) {
    return <span style={{ color: "#cbd5e1", fontSize: 13 }}>—</span>;
  }

  const btnStyle = (bg, color) => ({
    background: bg,
    color,
    border: `1px solid ${color}33`,
    borderRadius: 6,
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    lineHeight: 1.6,
    opacity: busy ? 0.6 : 1,
  });

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {status === "PENDING" && (
        <button
          style={btnStyle("#eff6ff", "#1d4ed8")}
          disabled={busy}
          onClick={() => onAction(row, "IN_PROGRESS")}
        >
          {busy ? "…" : "Move to In Progress"}
        </button>
      )}
      {status === "IN_PROGRESS" && (
        <button
          style={btnStyle("#f0fdf4", "#166534")}
          disabled={busy}
          onClick={() => onAction(row, "APPROVED")}
        >
          {busy ? "…" : "Approve"}
        </button>
      )}
      <button
        style={btnStyle("#fef2f2", "#991b1b")}
        disabled={busy}
        onClick={() => onAction(row, "REJECTED")}
      >
        {busy ? "…" : "Reject"}
      </button>
    </div>
  );
};

// ─── Per-tab Table ────────────────────────────────────────────────────────────

const WithdrawalTable = ({
  rows,
  updating,
  onActionClick,
  onViewWallet,
  tableRef,
  emptyLabel,
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return rows.slice(start, start + ROWS_PER_PAGE);
  }, [rows, page]);

  // Reset page when data changes (e.g. tab switch)
  useEffect(() => setPage(1), [rows]);

  const fmt = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—");

  return (
    <div>
      <div className="table-responsive">
        <table
          ref={tableRef}
          className="table table-striped"
          style={{ fontSize: 13, width: "100%", borderCollapse: "collapse" }}
        >
          <thead style={{ backgroundColor: "#2563eb" }}>
            <tr style={{ color: "#fff" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Dealer</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Updated</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                  {emptyLabel || "No records found."}
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => {
                console.log("dealer object", row.dealer);
                const walletDealerId = row.dealer?._id || row.dealer_id;
                const dealerIdCode   = row.dealer?.dealerId || "—";
                const shopName       = row.dealer?.name || "N/A";
                const busy           = updating === row._id;

                return (
                  <tr key={row._id} style={{ verticalAlign: "middle" }}>
                    <td style={tdStyle}>{(page - 1) * ROWS_PER_PAGE + idx + 1}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#475569" }}>
                      {row.orderId || row._id?.slice(-8) || "—"}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => onViewWallet(walletDealerId, shopName)}
                        title="View wallet details"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                          lineHeight: 1.4,
                        }}
                      >
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                          {dealerIdCode}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted" }}>
                          {shopName}
                        </div>
                      </button>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{fmt(row.amount ?? row.Amount)}</td>
                    <td style={{ ...tdStyle, color: "#475569" }}>
                      {"Withdrawal"}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={getStatus(row)} />
                    </td>
                    <td style={{ ...tdStyle, color: "#64748b", whiteSpace: "nowrap" }}>
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "#64748b", whiteSpace: "nowrap" }}>
                      {row.updatedAt
                        ? new Date(row.updatedAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td style={tdStyle}>
                      <RowActions
                        row={row}
                        onAction={onActionClick}
                        busy={busy}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {rows.length > ROWS_PER_PAGE && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {rows.length > 0
              ? `Showing ${Math.min((page - 1) * ROWS_PER_PAGE + 1, rows.length)}–${Math.min(page * ROWS_PER_PAGE, rows.length)} of ${rows.length}`
              : "No records"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ fontSize: 12, color: "#64748b", padding: "0 4px", alignSelf: "center" }}>
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = { fontWeight: 600, whiteSpace: "nowrap", padding: "10px 12px" };
const tdStyle = { padding: "10px 12px" };

// ─── Main Page ────────────────────────────────────────────────────────────────

const WithdrawalManagement = () => {
  const [allPayouts, setAllPayouts]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [isLegacy, setIsLegacy]       = useState(false);
  const [activeTab, setActiveTab]     = useState(0);
  const [updating, setUpdating]       = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [walletModal, setWalletModal]   = useState(null);
  const [walletData, setWalletData]     = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [depositForm, setDepositForm]   = useState({ dealerId: "", dealerName: "", amount: "", note: "" });
  const [depositLoading, setDepositLoading] = useState(false);

  const tableRef = useRef(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllPayouts();
      setAllPayouts(result.data);
      setIsLegacy(result.isLegacy);
    } catch (err) {
      console.error("Failed to load payouts:", err);
      setError("Unable to load finance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayouts(); }, [loadPayouts]);

  // ── Derived per-tab data ───────────────────────────────────────────────────
  const tabData = useMemo(() => {
    const byStatus = (s) => allPayouts.filter((p) => {
      const st = getStatus(p);
      return st === s || (s === "APPROVED" && st === "COMPLETED");
    });
    const result = [
      byStatus("PENDING"),
      byStatus("IN_PROGRESS"),
      byStatus("APPROVED"),
      byStatus("REJECTED"),
    ];
    return result;
  }, [allPayouts]);

  // ── Export helpers ─────────────────────────────────────────────────────────
  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: `Withdrawal_${TAB_META[activeTab].status}`,
    sheet: "Withdrawals",
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Withdrawal Requests — ${TAB_META[activeTab].label}`, 14, 14);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
    doc.autoTable({
      head: [["#", "Order ID", "Dealer", "Amount", "Type", "Status", "Created", "Updated"]],
      body: tabData[activeTab].map((r, i) => [
        i + 1,
        r.orderId || r._id?.slice(-8) || "—",
        `${r.dealer?.dealerId || "—"} – ${r.dealer?.name || "N/A"}`,
        `₹${(r.amount ?? r.Amount ?? 0).toLocaleString()}`,
        "Withdrawal",
        getStatus(r) || "—",
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—",
        r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-IN") : "—",
      ]),
      startY: 24,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    });
    doc.save(`Withdrawal_${TAB_META[activeTab].status}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // ── Status update ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async (walletId, nextStatus) => {
    setUpdating(walletId);
    try {
      await updateWithdrawalStatus(walletId, nextStatus);
      setConfirmModal(null);
      await loadPayouts();
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setUpdating(null);
    }
  };

  // ── Wallet modal ───────────────────────────────────────────────────────────
  const openWalletModal = async (dealerId, dealerName) => {
    setWalletData(null);
    setWalletModal({ dealerId, dealerName });
    setWalletLoading(true);
    try {
      const res = await getDealerWallet(dealerId);
      setWalletData(res?.data || res);
    } catch (err) {
      console.error("Failed to load wallet:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  const closeWalletModal = () => {
    setWalletModal(null);
    setWalletData(null);
  };

  // ── Deposit modal ──────────────────────────────────────────────────────────
  const openDepositFromWallet = () => {
    setDepositForm((f) => ({
      ...f,
      dealerId: walletModal.dealerId,
      dealerName: walletModal.dealerName,
    }));
    closeWalletModal();
    setDepositModal(true);
  };

  const closeDepositModal = () => {
    setDepositModal(false);
    setDepositForm({ dealerId: "", dealerName: "", amount: "", note: "" });
  };

  const handleDeposit = async () => {
    if (!depositForm.dealerId || !depositForm.amount) return;
    setDepositLoading(true);
    try {
      await adminDepositToDealer({
        dealerId: depositForm.dealerId,
        amount:   Number(depositForm.amount),
        note:     depositForm.note,
      });
      closeDepositModal();
      await loadPayouts();
    } catch (err) {
      console.error("Deposit failed:", err);
    } finally {
      setDepositLoading(false);
    }
  };

  const fmt = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—");

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: "column", gap: 2 }}>
        <CircularProgress size={40} thickness={3} sx={{ color: "#2563eb" }} />
        <Typography variant="body2" color="text.secondary">Loading withdrawal requests…</Typography>
      </Box>
    );
  }

  const currentTabRows = tabData[activeTab];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 3 }} spacing={1.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
            Withdrawal Requests
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Manage dealer payout lifecycle across all statuses
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Tooltip title="Export Excel">
            <button className="btn btn-outline-secondary btn-sm" onClick={onDownload} style={{ fontSize: 12 }}>
              Excel
            </button>
          </Tooltip>
          <Tooltip title="Export PDF">
            <button className="btn btn-outline-secondary btn-sm" onClick={exportPDF} style={{ fontSize: 12 }}>
              PDF
            </button>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton
              onClick={loadPayouts}
              size="small"
              sx={{ bgcolor: "white", border: "1px solid #f1f5f9", "&:hover": { bgcolor: "#f8fafc" } }}
            >
              <Refresh sx={{ fontSize: 16, color: "#64748b" }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setDepositModal(true)}
            sx={{ fontWeight: 700, fontSize: 12, borderRadius: "8px", whiteSpace: "nowrap" }}
          >
            Manual Deposit
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      {isLegacy && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: "12px", fontSize: "0.8rem" }}>
          <strong>Using legacy pending endpoint</strong> — only PENDING withdrawals are shown.
          Backend <code>GET /dealer/payouts?status=ALL</code> may be unavailable.
          IN_PROGRESS, APPROVED, and REJECTED tabs will appear empty.
        </Alert>
      )}

      {/* ── Tabs ── */}
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Tab Bar */}
        <Box sx={{ borderBottom: "1px solid #f1f5f9", px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                minHeight: 56,
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                color: "#64748b",
                "&.Mui-selected": { color: "#2563eb" },
              },
              "& .MuiTabs-indicator": { backgroundColor: "#2563eb", height: 3, borderRadius: "3px 3px 0 0" },
            }}
          >
            {TAB_META.map((tab, idx) => (
              <Tab
                key={tab.status}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {tab.icon}
                    <span>{tab.label}</span>
                    <Badge
                      badgeContent={tabData[idx].length}
                      sx={{
                        "& .MuiBadge-badge": {
                          position: "relative",
                          transform: "none",
                          top: 0,
                          right: 0,
                          fontSize: "0.65rem",
                          minWidth: 20,
                          height: 20,
                          borderRadius: "10px",
                          fontWeight: 700,
                          bgcolor:
                            tab.status === "PENDING"     ? "#f59e0b" :
                            tab.status === "IN_PROGRESS" ? "#2563eb" :
                            tab.status === "APPROVED"    ? "#10b981" :
                                                           "#ef4444",
                          color: "#fff",
                        },
                      }}
                    >
                      <span />
                    </Badge>
                  </Stack>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Table Panel */}
        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <WithdrawalTable
            rows={currentTabRows}
            updating={updating}
            onActionClick={(row, nextStatus) => setConfirmModal({ row, nextStatus })}
            onViewWallet={openWalletModal}
            tableRef={tableRef}
            emptyLabel={`No ${TAB_META[activeTab].label.toLowerCase()} withdrawal requests.`}
          />
        </Box>
      </Box>

      {/* ── Confirm Status Change Modal ── */}
      {confirmModal && (() => {
        const { row, nextStatus } = confirmModal;
        const isReject  = nextStatus === "REJECTED";
        const isApprove = nextStatus === "APPROVED";
        const busy      = updating === row._id;
        return (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
              <div className="modal-content" style={{ borderRadius: 14, border: "none", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
                <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
                  <h6 className="modal-title" style={{ fontWeight: 700, margin: 0 }}>
                    Confirm Status Update
                  </h6>
                  <button type="button" className="btn-close" onClick={() => setConfirmModal(null)} />
                </div>
                <div className="modal-body" style={{ padding: "20px 24px" }}>
                  <p style={{ margin: 0, color: "#374151", lineHeight: 1.65 }}>
                    {isReject ? (
                      <>
                        Reject the withdrawal request from{" "}
                        <strong>{row.dealer?.name || "N/A"}</strong>?
                        <span style={{ fontSize: 12, color: "#6b7280", display: "block", marginTop: 4 }}>
                          The dealer's wallet balance will be restored by the backend.
                        </span>
                      </>
                    ) : (
                      <>
                        Move this request to <strong>{nextStatus}</strong>?
                      </>
                    )}
                  </p>
                  <div
                    style={{
                      marginTop: 14, padding: "10px 14px", background: "#f8fafc",
                      borderRadius: 8, fontSize: 12, display: "flex", flexDirection: "column", gap: 5,
                    }}
                  >
                    <div>
                      <span style={{ color: "#94a3b8", marginRight: 6 }}>Dealer:</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", marginRight: 6 }}>
                        {row.dealer?.dealerId || "—"}
                      </span>
                      <strong>{row.dealer?.name || "N/A"}</strong>
                    </div>
                    <div><span style={{ color: "#94a3b8", marginRight: 6 }}>Amount:</span><strong>{fmt(row.amount ?? row.Amount)}</strong></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#94a3b8" }}>Status:</span>
                      <StatusBadge status={getStatus(row)} />
                      <span style={{ color: "#94a3b8" }}>→</span>
                      <StatusBadge status={nextStatus} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9", padding: "12px 20px", gap: 8 }}>
                  <button className="btn btn-light btn-sm" onClick={() => setConfirmModal(null)} disabled={busy}>
                    Cancel
                  </button>
                  <button
                    className={`btn btn-sm ${isReject ? "btn-danger" : isApprove ? "btn-success" : "btn-primary"}`}
                    disabled={busy}
                    onClick={() => handleStatusUpdate(row._id, nextStatus)}
                  >
                    {busy
                      ? "Processing…"
                      : isReject  ? "Reject"
                      : isApprove ? "Approve"
                      : "Move to In Progress"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Dealer Wallet Details Modal ── */}
      {walletModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
            <div className="modal-content" style={{ borderRadius: 14, border: "none", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
              <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
                <div>
                  <h6 style={{ fontWeight: 700, margin: 0, marginBottom: 2 }}>Wallet Details</h6>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{walletModal.dealerName}</div>
                </div>
                <button type="button" className="btn-close" onClick={closeWalletModal} />
              </div>
              <div className="modal-body" style={{ padding: "20px 24px" }}>
                {walletLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>Loading wallet data…</div>
                ) : !walletData ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#ef4444" }}>Failed to load wallet data.</div>
                ) : (() => {
                  console.log("wallet summary response", walletData);

                  const transactions = walletData.transactions ?? walletData.recentTransactions ?? [];
                  console.log("wallet transactions", transactions);

                  const balance     = walletData.balance ?? walletData.walletBalance ?? walletData.currentBalance ?? 0;
                  const creditLimit = walletData.creditLimit ?? walletData.minWalletAmount ?? 0;

                  // Stored wallet ledger totals only — Admin never derives these
                  // by summing individual transactions itself.
                  const totalCredits = walletData.totalCredits ?? null;
                  const totalDebits  = walletData.totalDebits ?? null;

                  return (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
                        <WalletStatCell label="Current Balance" value={fmt(balance)}      valueColor={balance < 0 ? "#dc2626" : "#166534"} />
                        <WalletStatCell label="Credit Limit"    value={fmt(creditLimit)}  valueColor="#374151" />
                        <WalletStatCell label="Total Credits"   value={fmt(totalCredits)} valueColor="#166534" />
                        <WalletStatCell label="Total Debits"    value={fmt(totalDebits)}  valueColor="#dc2626" />
                      </div>
                      {transactions.length > 0 && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: 8 }}>
                            RECENT TRANSACTIONS
                          </div>
                          <div style={{ maxHeight: 220, overflowY: "auto", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                            {transactions.slice(0, 10).map((txn, i) => {
                              const type      = txn.type || txn.transaction_type;
                              const bookingId = txn.bookingId || txn.booking_id;
                              const isDebit   = DEBIT_TYPES.includes(type);
                              return (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 12px",
                                    borderBottom: i < transactions.length - 1 ? "1px solid #f8fafc" : "none",
                                    fontSize: 13,
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 500, color: "#374151" }}>
                                      {TXN_LABELS[type] || type || "—"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                      {txn.createdAt
                                        ? new Date(txn.createdAt).toLocaleDateString("en-IN", {
                                            day: "2-digit", month: "short", year: "numeric",
                                          })
                                        : ""}
                                      {bookingId && <span style={{ marginLeft: 6 }}>· Ref: {bookingId}</span>}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                    <span style={{ fontWeight: 700, color: isDebit ? "#dc2626" : "#166534" }}>
                                      {isDebit ? "−" : "+"}{fmt(txn.amount)}
                                    </span>
                                    {txn.status && <StatusBadge status={txn.status} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {transactions.length === 0 && (
                        <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8", fontSize: 13 }}>
                          No transactions found.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9", padding: "12px 20px", gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={openDepositFromWallet}>
                  + Add Deposit
                </button>
                <button className="btn btn-light btn-sm" onClick={closeWalletModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Deposit Modal ── */}
      {depositModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content" style={{ borderRadius: 14, border: "none", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
              <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
                <h6 className="modal-title" style={{ fontWeight: 700, margin: 0 }}>Manual Deposit</h6>
                <button type="button" className="btn-close" onClick={closeDepositModal} />
              </div>
              <div className="modal-body" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Dealer ID</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Enter dealer ID"
                      value={depositForm.dealerId}
                      onChange={(e) => setDepositForm((f) => ({ ...f, dealerId: e.target.value }))}
                    />
                    {depositForm.dealerName && (
                      <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4 }}>
                        {depositForm.dealerName}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Amount (₹)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      min={1}
                      placeholder="0"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Note</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={3}
                      placeholder="Reason for deposit (optional)"
                      value={depositForm.note}
                      onChange={(e) => setDepositForm((f) => ({ ...f, note: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9", padding: "12px 20px", gap: 8 }}>
                <button className="btn btn-light btn-sm" onClick={closeDepositModal} disabled={depositLoading}>
                  Cancel
                </button>
                <button
                  className="btn btn-success btn-sm"
                  disabled={depositLoading || !depositForm.dealerId || !depositForm.amount}
                  onClick={handleDeposit}
                >
                  {depositLoading ? "Processing…" : "Confirm Deposit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 4,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default WithdrawalManagement;

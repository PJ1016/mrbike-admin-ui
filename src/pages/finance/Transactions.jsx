import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, Tooltip, IconButton, Typography, Alert } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import useFinanceTransactions from "../../hooks/useFinanceTransactions";
import { fmtCurrency, fmtDate, sortRows, withinDateRange, TXN_LABELS } from "../../utils/financeHelpers";
import SupportSearch from "../../components/Support/SupportSearch";
import SupportTable from "../../components/Support/SupportTable";
import SupportEmptyState from "../../components/Support/SupportEmptyState";
import TransactionFilters from "../../components/finance/TransactionFilters";
import FinanceStatusBadge from "../../components/finance/FinanceStatusBadge";
import TransactionDrawer from "../../components/finance/TransactionDrawer";

const ACCENT = "#2563eb";

const normalizeTxn = (t) => ({
  id: t._id || t.transactionId,
  transactionId: t.transactionId || t._id || "—",
  bookingId: t.bookingId || t.booking_id || t.booking?._id || null,
  dealerName: t.dealer?.name || t.dealer?.shopName || t.dealerName || "N/A",
  customerName:
    t.customer?.name || t.customerName || `${t.user_id?.first_name || ""} ${t.user_id?.last_name || ""}`.trim() || "N/A",
  amount: t.amount ?? 0,
  commission: t.commission ?? null,
  type: t.type || t.transactionType || t.transaction_type || "",
  paymentMethod: t.paymentMethod || t.payment_method || "—",
  status: t.status || "—",
  createdAt: t.createdAt || null,
});

const columns = [
  { key: "transactionId", label: "Transaction ID", render: (r) => <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#64748b" }}>{r.transactionId}</Typography> },
  { key: "bookingId", label: "Booking ID", render: (r) => <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#64748b" }}>{r.bookingId || "—"}</Typography> },
  { key: "dealerName", label: "Dealer", sortable: true },
  { key: "customerName", label: "Customer", sortable: true },
  { key: "amount", label: "Amount", sortable: true, render: (r) => <span style={{ fontWeight: 700 }}>{fmtCurrency(r.amount)}</span> },
  { key: "commission", label: "Commission", sortable: true, render: (r) => (r.commission != null ? fmtCurrency(r.commission) : "—") },
  { key: "type", label: "Transaction Type", render: (r) => TXN_LABELS[r.type] || r.type || "—" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "status", label: "Status", render: (r) => <FinanceStatusBadge status={r.status} /> },
  { key: "createdAt", label: "Created Date", sortable: true, render: (r) => fmtDate(r.createdAt) },
];

const Transactions = () => {
  const { transactions, loading, error, refetch } = useFinanceTransactions();

  const [search, setSearch] = useState("");
  const [dealer, setDealer] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [activeTransactionId, setActiveTransactionId] = useState(null);

  const normalized = useMemo(() => transactions.map(normalizeTxn), [transactions]);

  const dealerOptions = useMemo(() => Array.from(new Set(normalized.map((t) => t.dealerName).filter(Boolean))), [normalized]);
  const statusOptions = useMemo(() => Array.from(new Set(normalized.map((t) => t.status).filter(Boolean))), [normalized]);
  const paymentMethodOptions = useMemo(() => Array.from(new Set(normalized.map((t) => t.paymentMethod).filter((m) => m && m !== "—"))), [normalized]);

  const filtered = useMemo(() => {
    let rows = [...normalized];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.transactionId?.toLowerCase().includes(q) ||
          String(t.bookingId || "").toLowerCase().includes(q) ||
          t.dealerName?.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q)
      );
    }
    if (dealer) rows = rows.filter((t) => t.dealerName === dealer);
    if (status) rows = rows.filter((t) => t.status === status);
    if (paymentMethod) rows = rows.filter((t) => t.paymentMethod === paymentMethod);
    rows = rows.filter((t) => withinDateRange(t.createdAt, dateRange));
    return sortRows(rows, sortKey, sortDirection);
  }, [normalized, search, dealer, status, paymentMethod, dateRange, sortKey, sortDirection]);

  useEffect(() => setPage(1), [search, dealer, status, paymentMethod, dateRange]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const hasActiveFilters = Boolean(search || dealer || status || paymentMethod || dateRange !== "all");
  const clearAllFilters = () => {
    setSearch("");
    setDealer("");
    setStatus("");
    setPaymentMethod("");
    setDateRange("all");
  };

  const handleSortChange = (key) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const openDrawer = (row) => setActiveTransactionId(row.id);
  const closeDrawer = () => setActiveTransactionId(null);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 3 }} spacing={1.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
            Transactions
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            {normalized.length} transaction{normalized.length === 1 ? "" : "s"}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={refetch} sx={{ bgcolor: "white", border: "1px solid #f1f5f9", "&:hover": { bgcolor: "#f8fafc" } }}>
            <Refresh sx={{ fontSize: 18, color: "#64748b" }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}
          action={
            <IconButton size="small" onClick={refetch}>
              <Refresh sx={{ fontSize: 16 }} />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by transaction ID, booking ID, dealer, customer…" />
      </Box>

      <TransactionFilters
        dealer={dealer}
        onDealerChange={setDealer}
        dealerOptions={dealerOptions}
        status={status}
        onStatusChange={setStatus}
        statusOptions={statusOptions}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paymentMethodOptions={paymentMethodOptions}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAllFilters}
      />

      <SupportTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRowClick={openDrawer}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        emptyState={<SupportEmptyState filtered={normalized.length > 0} accentColor={ACCENT} onClearFilters={clearAllFilters} />}
      />

      <TransactionDrawer open={Boolean(activeTransactionId)} transactionId={activeTransactionId} onClose={closeDrawer} />
    </Box>
  );
};

export default Transactions;

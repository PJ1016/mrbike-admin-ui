import React, { useMemo, useState } from "react";
import { Box, Stack, Tooltip, IconButton, Typography, Alert } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import useDealerWallets from "../../hooks/useDealerWallets";
import { fmtCurrency, fmtDate, sortRows } from "../../utils/financeHelpers";
import SupportSearch from "../../components/Support/SupportSearch";
import SupportTable from "../../components/Support/SupportTable";
import SupportEmptyState from "../../components/Support/SupportEmptyState";
import DealerWalletFilters from "../../components/finance/DealerWalletFilters";
import FinanceStatusBadge from "../../components/finance/FinanceStatusBadge";
import DealerWalletDrawer from "../../components/finance/DealerWalletDrawer";

const ACCENT = "#0ea5e9";

const normalizeWallet = (w) => ({
  id: w._id || w.walletId || w.dealer?._id || w.dealerId || w.dealer?.dealerId,
  walletId: w._id || w.walletId,
  dealerId: w.dealer?._id || w.dealerId,
  dealerName: w.dealer?.name || w.dealerName || w.name || "N/A",
  shopName: w.dealer?.shopName || w.shopName || "N/A",
  phone: w.dealer?.phone || w.phone || "—",
  walletBalance: w.walletBalance ?? w.balance ?? w.currentBalance ?? 0,
  availableBalance: w.availableBalance ?? w.balance ?? w.currentBalance ?? 0,
  pendingBalance: w.pendingBalance ?? 0,
  lifetimeEarnings: w.lifetimeEarnings ?? w.totalEarnings ?? w.totalCredits ?? 0,
  totalWithdrawn: w.totalWithdrawn ?? w.totalDebits ?? 0,
  pendingWithdrawal: w.pendingWithdrawal ?? 0,
  lastTransactionAt: w.lastTransactionAt || w.lastTransactionDate || null,
  status: w.status || (w.isActive === false ? "INACTIVE" : "ACTIVE"),
  createdAt: w.createdAt || null,
});

const columns = [
  { key: "dealerName", label: "Dealer", sortable: true, render: (r) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.dealerName}</Typography> },
  { key: "shopName", label: "Shop", sortable: true },
  { key: "phone", label: "Phone" },
  { key: "walletBalance", label: "Wallet Balance", sortable: true, render: (r) => <span style={{ fontWeight: 700 }}>{fmtCurrency(r.walletBalance)}</span> },
  { key: "availableBalance", label: "Available Balance", sortable: true, render: (r) => <span style={{ color: "#166534" }}>{fmtCurrency(r.availableBalance)}</span> },
  { key: "pendingBalance", label: "Pending Balance", sortable: true, render: (r) => <span style={{ color: "#c2410c" }}>{fmtCurrency(r.pendingBalance)}</span> },
  { key: "lifetimeEarnings", label: "Lifetime Earnings", sortable: true, render: (r) => fmtCurrency(r.lifetimeEarnings) },
  { key: "totalWithdrawn", label: "Total Withdrawn", sortable: true, render: (r) => <span style={{ color: "#dc2626" }}>{fmtCurrency(r.totalWithdrawn)}</span> },
  { key: "pendingWithdrawal", label: "Pending Withdrawal", sortable: true, render: (r) => fmtCurrency(r.pendingWithdrawal) },
  { key: "lastTransactionAt", label: "Last Transaction", sortable: true, render: (r) => fmtDate(r.lastTransactionAt) },
  { key: "status", label: "Status", render: (r) => <FinanceStatusBadge status={r.status} /> },
  { key: "createdAt", label: "Created Date", sortable: true, render: (r) => fmtDate(r.createdAt) },
];

const DealerWallets = () => {
  const { wallets, loading, error, refetch } = useDealerWallets();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [activeWallet, setActiveWallet] = useState(null);

  const normalized = useMemo(() => wallets.map(normalizeWallet), [wallets]);

  const statusOptions = useMemo(
    () => Array.from(new Set(normalized.map((w) => w.status).filter(Boolean))),
    [normalized]
  );

  const filtered = useMemo(() => {
    let rows = [...normalized];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (w) =>
          w.dealerName?.toLowerCase().includes(q) ||
          w.shopName?.toLowerCase().includes(q) ||
          w.phone?.toLowerCase?.().includes(q)
      );
    }
    if (status) rows = rows.filter((w) => w.status === status);
    return sortRows(rows, sortKey, sortDirection);
  }, [normalized, search, status, sortKey, sortDirection]);

  React.useEffect(() => setPage(1), [search, status]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const hasActiveFilters = Boolean(search || status);
  const clearAllFilters = () => {
    setSearch("");
    setStatus("");
  };

  const handleSortChange = (key) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const openDrawer = (row) => setActiveWallet(row);
  const closeDrawer = () => setActiveWallet(null);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 3 }} spacing={1.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
            Dealer Wallets
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            {normalized.length} dealer wallet{normalized.length === 1 ? "" : "s"}
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
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by dealer, shop, phone…" />
      </Box>

      <DealerWalletFilters
        status={status}
        onStatusChange={setStatus}
        statusOptions={statusOptions}
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

      <DealerWalletDrawer
        open={Boolean(activeWallet)}
        walletId={activeWallet?.walletId}
        dealerName={activeWallet?.dealerName}
        onClose={closeDrawer}
      />
    </Box>
  );
};

export default DealerWallets;

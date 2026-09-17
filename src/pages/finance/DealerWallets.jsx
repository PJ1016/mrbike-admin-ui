import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Snackbar, Stack, Tooltip, IconButton, Typography, Alert } from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import useDealerWallets from "../../hooks/useDealerWallets";
import { fmtCurrency, fmtDate } from "../../utils/financeHelpers";
import SupportSearch from "../../components/Support/SupportSearch";
import SupportTable from "../../components/Support/SupportTable";
import SupportEmptyState from "../../components/Support/SupportEmptyState";
import DealerWalletFilters from "../../components/finance/DealerWalletFilters";
import FinanceStatusBadge from "../../components/finance/FinanceStatusBadge";
import DepositDialog from "../../components/finance/DepositDialog";

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
  pendingWithdrawal: w.pendingWithdrawal ?? w.pendingWithdrawalAmount ?? 0,
  lastTransactionAt: w.lastTransactionAt || w.lastTransactionDate || null,
  status: w.walletStatus || w.status || (w.isActive === false ? "INACTIVE" : "ACTIVE"),
  createdAt: w.createdAt || w.createdDate || null,
});

const getColumns = (onDeposit) => [
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
  {
    key: "deposit",
    label: "Deposit",
    render: (row) => (
      <Button
        size="small"
        variant="contained"
        color="success"
        startIcon={<Add />}
        onClick={(event) => { event.stopPropagation(); onDeposit(row); }}
        sx={{ whiteSpace: "nowrap", textTransform: "none", boxShadow: "none" }}
      >
        Deposit
      </Button>
    ),
  },
];

const DealerWallets = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [depositWallet, setDepositWallet] = useState(null);
  const [depositNotice, setDepositNotice] = useState("");
  const { wallets, pagination, loading, error, refetch } = useDealerWallets({
    page, limit: pageSize, search, ...(status ? { status } : {}),
    ...(sortKey ? { sortBy: sortKey, sortOrder: sortDirection } : {}),
  });

  const normalized = useMemo(() => wallets.map(normalizeWallet), [wallets]);

  const statusOptions = useMemo(
    () => Array.from(new Set(normalized.map((w) => w.status).filter(Boolean))),
    [normalized]
  );

  React.useEffect(() => setPage(1), [search, status]);

  const total = pagination?.total ?? normalized.length;
  const paged = normalized;

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

  const openWallet = (row) => navigate(`/finance/dealer-wallets/${row.walletId || row.dealerId}`);
  const columns = getColumns(setDepositWallet);
  const handleDeposited = (result) => {
    setDepositNotice(result?.idempotent ? "This deposit was already processed; the wallet was not credited again." : "Deposit completed and recorded in the wallet ledger.");
    refetch();
  };

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
        onRowClick={openWallet}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        emptyState={<SupportEmptyState filtered={normalized.length > 0} accentColor={ACCENT} onClearFilters={clearAllFilters} />}
      />

      <DepositDialog
        open={Boolean(depositWallet)}
        walletId={depositWallet?.walletId || depositWallet?.dealerId}
        dealerName={depositWallet?.dealerName}
        onClose={() => setDepositWallet(null)}
        onDeposited={handleDeposited}
      />
      <Snackbar open={Boolean(depositNotice)} autoHideDuration={5000} onClose={() => setDepositNotice("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" variant="filled" onClose={() => setDepositNotice("")}>{depositNotice}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DealerWallets;

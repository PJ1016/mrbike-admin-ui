import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { Add, ArrowBack, ContentCopy, Refresh } from "@mui/icons-material";
import { fetchAllDealerTransactions, fetchDealerWalletDetails } from "../../services/financeService";
import { fmtCurrency, fmtDateTime, TXN_LABELS } from "../../utils/financeHelpers";
import DepositDialog from "../../components/finance/DepositDialog";
import FinanceStatusBadge from "../../components/finance/FinanceStatusBadge";
import FinanceStatCell from "../../components/finance/FinanceStatCell";
import SupportTable from "../../components/Support/SupportTable";
import SupportEmptyState from "../../components/Support/SupportEmptyState";
import TransactionDrawer from "../../components/finance/TransactionDrawer";

const transactionType = (transaction) => (transaction.transactionType || transaction.transaction_type || "").toLowerCase();
const signedAmount = (transaction) => {
  const type = transactionType(transaction);
  const direction = transaction.direction || transaction.ledgerType || transaction.type;
  return type === "withdrawal" || type === "settlement_cash" || direction === "Debit"
    ? -Number(transaction.amount || 0)
    : Number(transaction.amount || 0);
};

const DetailLine = ({ label, value, copyable }) => (
  <Box>
    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.35 }}>
      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 600, wordBreak: "break-word" }}>{value || "—"}</Typography>
      {copyable && value && <IconButton size="small" onClick={() => navigator.clipboard?.writeText(String(value))}><ContentCopy sx={{ fontSize: 15 }} /></IconButton>}
    </Stack>
  </Box>
);

const columns = [
  { key: "transactionId", label: "Transaction ID", render: (row) => <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{row.transactionId || row._id || "—"}</Typography> },
  { key: "transactionType", label: "Type", render: (row) => TXN_LABELS[transactionType(row)] || transactionType(row) || "—" },
  { key: "amount", label: "Amount", render: (row) => {
    const amount = signedAmount(row);
    return <Typography variant="body2" sx={{ fontWeight: 700, color: amount < 0 ? "#dc2626" : "#166534" }}>{amount < 0 ? "−" : "+"}{fmtCurrency(Math.abs(amount))}</Typography>;
  } },
  { key: "status", label: "Status", render: (row) => <FinanceStatusBadge status={row.status} /> },
  { key: "reference", label: "Reference", render: (row) => row.orderId || row.booking?.bookingId || row.bookingId || "—" },
  { key: "createdAt", label: "Date", render: (row) => fmtDateTime(row.createdAt) },
];

const HistorySection = ({ title, rows, onRowClick, emptyText }) => (
  <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
    <Box sx={{ px: 2.5, py: 2 }}><Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>{title}</Typography></Box>
    <Divider />
    <SupportTable
      columns={columns}
      rows={rows}
      loading={false}
      page={1}
      pageSize={Math.max(rows.length, 10)}
      total={rows.length}
      onRowClick={onRowClick}
      emptyState={<SupportEmptyState title={emptyText} accentColor="#0ea5e9" />}
    />
  </Paper>
);

const DealerWalletDetail = () => {
  const { walletId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeTransaction, setActiveTransaction] = useState(null);

  const load = useCallback(async () => {
    if (!walletId) return;
    setLoading(true);
    setError("");
    try {
      const [details, ledger] = await Promise.all([
        fetchDealerWalletDetails(walletId),
        fetchAllDealerTransactions(walletId),
      ]);
      setData(details);
      setTransactions(ledger);
    } catch (e) {
      setError(e?.message || "Failed to load wallet details");
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => { load(); }, [load]);

  const dealer = data?.dealer || {};
  const deposits = useMemo(() => transactions.filter((item) => transactionType(item) === "deposit"), [transactions]);
  const withdrawals = useMemo(() => transactions.filter((item) => transactionType(item) === "withdrawal"), [transactions]);
  const settlements = useMemo(() => transactions.filter((item) => transactionType(item).startsWith("settlement_")), [transactions]);
  const adjustments = useMemo(() => transactions.filter((item) => transactionType(item) === "manual"), [transactions]);
  const sum = (items, signed = false) => items.reduce((total, item) => total + (signed ? signedAmount(item) : Number(item.amount || 0)), 0);
  const dealerName = dealer.dealerName || dealer.name || dealer.shopName || "Dealer Wallet";

  if (loading) {
    return <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton onClick={() => navigate("/finance/dealer-wallets")} sx={{ bgcolor: "white", border: "1px solid #e2e8f0" }}><ArrowBack /></IconButton>
          <Box>
            <Typography variant="caption" sx={{ color: "#0ea5e9", fontWeight: 800, letterSpacing: "0.08em" }}>WALLET DETAILS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>{dealerName}</Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>{dealer.dealerId || walletId}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <FinanceStatusBadge status={dealer.walletStatus || data?.status || "ACTIVE"} />
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Refresh</Button>
          <Button variant="contained" color="success" startIcon={<Add />} onClick={() => setDepositOpen(true)} sx={{ textTransform: "none", boxShadow: "none" }}>Deposit</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" action={<Button color="inherit" onClick={load}>Retry</Button>} sx={{ mb: 3 }}>{error}</Alert>}

      {data && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 0.7fr) minmax(0, 2fr)" }, gap: 3, mb: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Dealer Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2.25}>
                <DetailLine label="Shop Name" value={dealer.shopName || dealerName} />
                <DetailLine label="Dealer ID" value={dealer.dealerId || dealer._id} copyable />
                <DetailLine label="Phone" value={dealer.phone} />
                <DetailLine label="Email" value={dealer.email} copyable />
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Wallet Summary</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(5, 1fr)" }, gap: 1.5 }}>
                <FinanceStatCell label="Current Balance" value={fmtCurrency(data.walletBalance ?? data.balance)} valueColor="#166534" />
                <FinanceStatCell label="Total Deposits" value={fmtCurrency(sum(deposits))} valueColor="#166534" />
                <FinanceStatCell label="Total Withdrawals" value={fmtCurrency(data.totalWithdrawn ?? sum(withdrawals))} valueColor="#dc2626" />
                <FinanceStatCell label="Booking Settlements" value={fmtCurrency(sum(settlements, true))} />
                <FinanceStatCell label="Manual Adjustments" value={fmtCurrency(sum(adjustments, true))} />
              </Box>
            </Paper>
          </Box>

          <Stack spacing={3}>
            <HistorySection title="Deposit History" rows={deposits} onRowClick={setActiveTransaction} emptyText="No deposits found" />
            <HistorySection title="Full Transaction History" rows={transactions} onRowClick={setActiveTransaction} emptyText="No transactions found" />
          </Stack>
        </>
      )}

      <DepositDialog
        open={depositOpen}
        walletId={walletId}
        dealerName={dealerName}
        onClose={() => setDepositOpen(false)}
        onDeposited={(result) => {
          setNotice(result?.idempotent ? "This deposit was already processed; no duplicate credit was added." : "Deposit completed and recorded in the wallet ledger.");
          load();
        }}
      />
      <TransactionDrawer open={Boolean(activeTransaction)} transactionId={activeTransaction?._id} fallbackData={activeTransaction} onClose={() => setActiveTransaction(null)} />
      <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" variant="filled" onClose={() => setNotice("")}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DealerWalletDetail;

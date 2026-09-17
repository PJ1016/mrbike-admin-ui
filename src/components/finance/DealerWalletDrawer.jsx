import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Divider, Drawer, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { Add, Close, Refresh } from "@mui/icons-material";
import { fetchAllDealerTransactions, fetchDealerWalletDetails } from "../../services/financeService";
import { fmtCurrency } from "../../utils/financeHelpers";
import FinanceStatusBadge from "./FinanceStatusBadge";
import FinanceStatCell from "./FinanceStatCell";
import FinanceDetailItem from "./FinanceDetailItem";
import TransactionRow from "./TransactionRow";
import DepositDialog from "./DepositDialog";

const SectionPaper = ({ title, action, children }) => (
  <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: "1px solid #f1f5f9", mb: 2.5 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      {action}
    </Stack>
    <Divider sx={{ mb: 1.5 }} />
    {children}
  </Paper>
);

// Right-side drawer showing a single dealer's wallet — mirrors the layout
// WithdrawalManagement.jsx already renders inside its bootstrap "Wallet
// Details" modal, but as a proper MUI Drawer (consistent with
// PaymentDetailsDrawer / TicketDrawer) so it can be opened from the new
// Dealer Wallets table without duplicating that modal.
const transactionType = (transaction) => (transaction.transactionType || transaction.transaction_type || "").toLowerCase();
const signedAmount = (transaction) => {
  const type = transactionType(transaction);
  const direction = transaction.direction || transaction.ledgerType || transaction.type;
  return type === "withdrawal" || type === "settlement_cash" || direction === "Debit"
    ? -Number(transaction.amount || 0)
    : Number(transaction.amount || 0);
};

const DealerWalletDrawer = ({ open, walletId, dealerName, onClose, onDeposited }) => {
  const [data, setData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);

  const load = async () => {
    if (!walletId) return;
    setLoading(true);
    setError("");
    try {
      const [res, transactions] = await Promise.all([
        fetchDealerWalletDetails(walletId),
        fetchAllDealerTransactions(walletId),
      ]);
      setData(res);
      setAllTransactions(transactions);
    } catch (e) {
      setError(e?.message || "Failed to load wallet details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && walletId) {
      setData(null);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, walletId]);

  const dealer = data?.dealer || {};
  const transactions = allTransactions.length ? allTransactions : (data?.transactions ?? data?.recentTransactions ?? []);
  const deposits = transactions.filter((transaction) => transactionType(transaction) === "deposit");
  const withdrawals = transactions.filter((transaction) => transactionType(transaction) === "withdrawal");
  const settlements = transactions.filter((transaction) => transactionType(transaction).startsWith("settlement_"));
  const adjustments = transactions.filter((transaction) => transactionType(transaction) === "manual");
  const sum = (items, signed = false) => items.reduce((total, transaction) => total + (signed ? signedAmount(transaction) : Number(transaction.amount || 0)), 0);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, display: "flex", flexDirection: "column" } }}>
      <Box sx={{ height: 4, bgcolor: "#0ea5e9", flexShrink: 0 }} />
      <Box sx={{ p: 2.5, borderBottom: "1px solid #f1f5f9", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>WALLET DETAILS</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }} noWrap>
            {dealer.dealerName || dealer.name || dealer.shopName || dealerName || "Dealer"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close wallet drawer">
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} sx={{ color: "#0ea5e9" }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography sx={{ color: "#ef4444", mb: 2 }}>{error}</Typography>
            <Tooltip title="Retry">
              <IconButton onClick={load} sx={{ bgcolor: "white", border: "1px solid #f1f5f9" }}>
                <Refresh sx={{ fontSize: 18, color: "#64748b" }} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : !data ? (
          <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 6 }}>
            No wallet data available.
          </Typography>
        ) : (
          <>
            <SectionPaper title="Dealer Information">
              <FinanceDetailItem label="Shop Name" value={dealer.shopName || dealer.name} />
              <FinanceDetailItem label="Dealer ID" value={dealer.dealerId || dealer._id} copyable />
              <FinanceDetailItem label="Phone" value={dealer.phone} />
              <FinanceDetailItem label="Email" value={dealer.email} copyable />
            </SectionPaper>

            <SectionPaper
              title="Wallet Summary"
              action={
                <Stack direction="row" spacing={1} alignItems="center">
                  <FinanceStatusBadge status={data.status || dealer.walletStatus || (data.isActive === false ? "INACTIVE" : "ACTIVE")} />
                  <Button size="small" variant="contained" color="success" startIcon={<Add />} onClick={() => setDepositOpen(true)} sx={{ textTransform: "none", boxShadow: "none" }}>
                    Deposit
                  </Button>
                </Stack>
              }
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 1.25 }}>
                <FinanceStatCell label="Current Balance" value={fmtCurrency(data.walletBalance ?? data.balance)} valueColor="#166534" />
                <FinanceStatCell label="Total Deposits" value={fmtCurrency(sum(deposits))} valueColor="#166534" />
                <FinanceStatCell label="Total Withdrawals" value={fmtCurrency(data.totalWithdrawn ?? sum(withdrawals))} valueColor="#dc2626" />
                <FinanceStatCell label="Booking Settlements" value={fmtCurrency(sum(settlements, true))} />
                <FinanceStatCell label="Manual Adjustments" value={fmtCurrency(sum(adjustments, true))} />
              </Box>
            </SectionPaper>

            <SectionPaper title="Deposit History">
              {deposits.length === 0 ? (
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>No deposit history.</Typography>
              ) : (
                <Box sx={{ maxHeight: 220, overflowY: "auto", borderRadius: "8px", border: "1px solid #f8fafc" }}>
                  {deposits.map((transaction, index) => (
                    <TransactionRow key={transaction._id || index} txn={transaction} isLast={index === deposits.length - 1} />
                  ))}
                </Box>
              )}
            </SectionPaper>

            <SectionPaper title="Full Transaction History">
              {transactions.length === 0 ? (
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>No transactions found.</Typography>
              ) : (
                <Box sx={{ maxHeight: 360, overflowY: "auto", borderRadius: "8px", border: "1px solid #f8fafc" }}>
                  {transactions.map((t, i) => (
                    <TransactionRow key={t._id || i} txn={t} isLast={i === transactions.length - 1} />
                  ))}
                </Box>
              )}
            </SectionPaper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: "1px solid #f1f5f9" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Withdrawal History</Typography>
              <Divider sx={{ mb: 1.5 }} />
              {withdrawals.length === 0 ? (
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>No withdrawal history.</Typography>
              ) : (
                <Box sx={{ maxHeight: 220, overflowY: "auto", borderRadius: "8px", border: "1px solid #f8fafc" }}>
                  {withdrawals.map((t, i) => (
                    <TransactionRow key={t._id || i} txn={t} isLast={i === withdrawals.length - 1} />
                  ))}
                </Box>
              )}
            </Paper>
          </>
        )}
      </Box>
      <DepositDialog
        open={depositOpen}
        walletId={walletId}
        dealerName={dealer.dealerName || dealer.name || dealer.shopName || dealerName}
        onClose={() => setDepositOpen(false)}
        onDeposited={(result) => { load(); onDeposited?.(result); }}
      />
    </Drawer>
  );
};

export default DealerWalletDrawer;

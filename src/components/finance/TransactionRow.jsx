import React from "react";
import { TXN_LABELS, isDebitTxn, fmtCurrency, fmtDate } from "../../utils/financeHelpers";
import FinanceStatusBadge from "./FinanceStatusBadge";

const TransactionRow = ({ txn, isLast, onClick }) => {
  const type = txn.type || txn.transaction_type || txn.transactionType;
  const bookingId = txn.bookingId || txn.booking_id;
  const debit = isDebitTxn(txn);

  return (
    <div
      onClick={onClick ? () => onClick(txn) : undefined}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: isLast ? "none" : "1px solid #f8fafc",
        fontSize: 13,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div>
        <div style={{ fontWeight: 500, color: "#374151" }}>{TXN_LABELS[type] || type || "—"}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          {fmtDate(txn.createdAt)}
          {bookingId && <span style={{ marginLeft: 6 }}>· Ref: {bookingId}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span style={{ fontWeight: 700, color: debit ? "#dc2626" : "#166534" }}>
          {debit ? "−" : "+"}
          {fmtCurrency(txn.amount)}
        </span>
        {txn.status && <FinanceStatusBadge status={txn.status} />}
      </div>
    </div>
  );
};

export default TransactionRow;

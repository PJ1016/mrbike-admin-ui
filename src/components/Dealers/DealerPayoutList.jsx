"use client"

import { useState, useMemo, useRef } from "react"
import { useDownloadExcel } from "react-export-table-to-excel"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { updateWithdrawalStatus, getDealerWallet, adminDepositToDealer } from "../../api"

const STATUS_CONFIG = {
  PENDING:     { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  IN_PROGRESS: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  COMPLETED:   { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  REJECTED:    { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
}

const TXN_LABELS = {
  settlement_online: "Online Settlement",
  settlement_cash:   "Cash Settlement",
  withdrawal:        "Withdrawal",
  deposit:           "Deposit",
}

const DEBIT_TYPES = ["withdrawal"]

const labelSt = {
  fontSize: 11,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 4,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
}

const actionBtn = (bg, color) => ({
  background: bg,
  color,
  border: `1px solid ${color}33`,
  borderRadius: 6,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  lineHeight: 1.5,
})

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" }
  return (
    <span style={{
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
    }}>
      {status}
    </span>
  )
}

const StatCard = ({ label, value, valueColor }) => (
  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", flex: 1 }}>
    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: valueColor || "#0f172a" }}>{value}</div>
  </div>
)

const WithdrawalManagementTable = ({ datas = [], fetchLatest, triggerDownloadExcel, triggerDownloadPDF }) => {
  const tableRef = useRef(null)
  const rowsPerPage = 10

  const [currentPage, setCurrentPage] = useState(1)
  const [updating, setUpdating]       = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [walletModal, setWalletModal]   = useState(null)
  const [walletData, setWalletData]     = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [depositModal, setDepositModal] = useState(false)
  const [depositForm, setDepositForm]   = useState({ dealerId: "", dealerName: "", amount: "", note: "" })
  const [depositLoading, setDepositLoading] = useState(false)

  const totalPages  = Math.max(1, Math.ceil(datas.length / rowsPerPage))
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return datas.slice(start, start + rowsPerPage)
  }, [datas, currentPage])

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Withdrawal_Requests",
    sheet: "Withdrawals",
  })
  triggerDownloadExcel.current = onDownload

  triggerDownloadPDF.current = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Withdrawal Requests", 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
    doc.autoTable({
      head: [["#", "Dealer", "Amount", "Type", "Note", "Status", "Date"]],
      body: datas.map((r, i) => [
        i + 1,
        r.dealer_id?.name || "N/A",
        `₹${(r.Amount || 0).toLocaleString()}`,
        TXN_LABELS[r.Type] || r.Type || "N/A",
        r.Note || "—",
        r.order_status || "N/A",
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "N/A",
      ]),
      startY: 28,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    })
    doc.save(`Withdrawal_Requests_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const handleStatusUpdate = async (walletId, status, row) => {
    const payload = { wallet_id: walletId, new_status: status }
    console.log("approve payload", payload)
    console.log("wallet_id", walletId)
    console.log("new_status", status)
    console.log("row fields — _id:", row?._id, "| orderId:", row?.orderId, "| wallet_id field:", row?.wallet_id)
    setUpdating(walletId)
    try {
      const res = await updateWithdrawalStatus(walletId, status)
      console.log("status update response", res)
      setConfirmModal(null)
      await fetchLatest()
    } catch (err) {
      console.error("Status update failed:", err)
      console.error("Error response:", err?.response?.data)
    } finally {
      setUpdating(null)
    }
  }

  const openWalletModal = async (dealerId, dealerName) => {
    setWalletData(null)
    setWalletModal({ dealerId, dealerName })
    setWalletLoading(true)
    try {
      const res = await getDealerWallet(dealerId)
      setWalletData(res?.data || res)
    } catch (err) {
      console.error("Failed to load wallet:", err)
    } finally {
      setWalletLoading(false)
    }
  }

  const closeWalletModal = () => {
    setWalletModal(null)
    setWalletData(null)
  }

  const openDepositFromWallet = () => {
    setDepositForm(f => ({ ...f, dealerId: walletModal.dealerId, dealerName: walletModal.dealerName }))
    closeWalletModal()
    setDepositModal(true)
  }

  const closeDepositModal = () => {
    setDepositModal(false)
    setDepositForm({ dealerId: "", dealerName: "", amount: "", note: "" })
  }

  const handleDeposit = async () => {
    if (!depositForm.dealerId || !depositForm.amount) return
    setDepositLoading(true)
    try {
      await adminDepositToDealer({
        dealerId: depositForm.dealerId,
        amount:   Number(depositForm.amount),
        note:     depositForm.note,
      })
      closeDepositModal()
      await fetchLatest()
    } catch (err) {
      console.error("Deposit failed:", err)
    } finally {
      setDepositLoading(false)
    }
  }

  const renderActions = (row) => {
    const { order_status: status, _id: id } = row
    const busy = updating === id

    if (status === "COMPLETED" || status === "REJECTED") {
      return <span style={{ color: "#cbd5e1", fontSize: 13 }}>—</span>
    }

    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {status === "PENDING" && (
          <button
            style={actionBtn("#eff6ff", "#1d4ed8")}
            disabled={busy}
            onClick={() => setConfirmModal({ row, nextStatus: "IN_PROGRESS" })}
          >
            {busy ? "…" : "In Progress"}
          </button>
        )}
        {status === "IN_PROGRESS" && (
          <button
            style={actionBtn("#f0fdf4", "#166534")}
            disabled={busy}
            onClick={() => setConfirmModal({ row, nextStatus: "COMPLETED" })}
          >
            {busy ? "…" : "Complete"}
          </button>
        )}
        <button
          style={actionBtn("#fef2f2", "#991b1b")}
          disabled={busy}
          onClick={() => setConfirmModal({ row, nextStatus: "REJECTED" })}
        >
          {busy ? "…" : "Reject"}
        </button>
      </div>
    )
  }

  const fmt = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—")

  return (
    <div className="row">
      <div className="col-sm-12">

        {/* Top toolbar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setDepositModal(true)}
            style={{ fontSize: 13, padding: "6px 18px" }}
          >
            + Manual Deposit
          </button>
        </div>

        <div className="card-table card p-2">
          <div className="card-body">
            <div className="table-responsive">
              <table ref={tableRef} id="withdrawal-table" className="table table-striped" style={{ fontSize: 13 }}>
                <thead style={{ backgroundColor: "#2563eb" }}>
                  <tr style={{ color: "#fff" }}>
                    <th style={{ fontWeight: 600, whiteSpace: "nowrap" }}>#</th>
                    <th style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Dealer Name</th>
                    <th style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Amount</th>
                    <th style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Wallet Balance</th>
                    <th style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Transaction Type</th>
                    <th style={{ fontWeight: 600 }}>Note</th>
                    <th style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Created Date</th>
                    <th style={{ fontWeight: 600 }}>Status</th>
                    <th style={{ fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                        No withdrawal requests found.
                      </td>
                    </tr>
                  ) : currentData.map((row, index) => {
                  
                    const dealerName =
  row.dealer?.shopName ||
  row.dealer?.name ||
  row.dealer_id?.shopName ||
  row.dealer_id?.name ||
  "N/A";

const dealerId =
  row.dealer?.dealerId ||
  row.dealer_id?.dealerId ||
  "—";
                    const balance    = row.dealer_id?.walletBalance ?? row.dealer_id?.balance ?? null

                    return (
                      <tr key={row._id}>
                        <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        <td>
                          <button
                            onClick={() => openWalletModal(dealerId, dealerName)}
                            title="View wallet details"
                            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, fontWeight: 500, textDecoration: "underline", textDecorationStyle: "dotted", fontSize: 13 }}
                          >
                            {dealerName}
                          </button>
                        </td>
                        <td style={{ fontWeight: 600 }}>{fmt(row.Amount)}</td>
                        <td style={{ color: balance < 0 ? "#dc2626" : "#374151" }}>
                          {balance != null ? fmt(balance) : <span style={{ color: "#cbd5e1" }}>—</span>}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{TXN_LABELS[row.Type] || row.Type || "—"}</td>
                        <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}>
                          {row.Note || "—"}
                        </td>
                        <td style={{ whiteSpace: "nowrap", fontSize: 12, color: "#64748b" }}>
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td><StatusBadge status={row.order_status} /></td>
                        <td>{renderActions(row)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {datas.length > 0
                  ? `Showing ${Math.min((currentPage - 1) * rowsPerPage + 1, datas.length)}–${Math.min(currentPage * rowsPerPage, datas.length)} of ${datas.length}`
                  : "No records"}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span style={{ fontSize: 12, color: "#64748b", padding: "0 4px" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Status Change Modal ── */}
      {confirmModal && (() => {
        const { row, nextStatus } = confirmModal
        const isReject   = nextStatus === "REJECTED"
        const isComplete = nextStatus === "COMPLETED"
        const busy       = updating === row._id
        return (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
              <div className="modal-content" style={{ borderRadius: 12, border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
                  <h6 className="modal-title" style={{ fontWeight: 700, margin: 0 }}>Confirm Status Update</h6>
                  <button type="button" className="btn-close" onClick={() => setConfirmModal(null)} />
                </div>
                <div className="modal-body" style={{ padding: "20px 24px" }}>
                  <p style={{ margin: 0, color: "#374151", lineHeight: 1.6 }}>
                    {isReject
                      ? <>Reject the withdrawal request from <strong>{row.dealer_id?.name}</strong>?<br />
                         <span style={{ fontSize: 12, color: "#6b7280", display: "block", marginTop: 4 }}>
                           The dealer's wallet balance will be automatically restored by the backend.
                         </span></>
                      : <>Move this request to <strong>{nextStatus}</strong>?</>
                    }
                  </p>
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div><span style={{ color: "#94a3b8", marginRight: 6 }}>Dealer:</span><strong>{row.dealer_id?.name || "N/A"}</strong></div>
                    <div><span style={{ color: "#94a3b8", marginRight: 6 }}>Amount:</span><strong>{fmt(row.Amount)}</strong></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#94a3b8" }}>Current status:</span>
                      <StatusBadge status={row.order_status} />
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
                    className={`btn btn-sm ${isReject ? "btn-danger" : isComplete ? "btn-success" : "btn-primary"}`}
                    disabled={busy}
                    onClick={() => handleStatusUpdate(row._id, nextStatus, row)}
                  >
                    {busy ? "Processing…" : isReject ? "Reject" : isComplete ? "Mark Completed" : "Move to In Progress"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Dealer Wallet Details Modal ── */}
      {walletModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
            <div className="modal-content" style={{ borderRadius: 12, border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
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
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#ef4444" }}>
                    Failed to load wallet data.
                  </div>
                ) : (() => {
                  console.log("wallet summary response", walletData)

                  const transactions = walletData.transactions ?? walletData.recentTransactions ?? []
                  console.log("wallet transactions", transactions)

                  const balance      = walletData.balance ?? walletData.walletBalance ?? walletData.currentBalance ?? 0
                  const creditLimit  = walletData.creditLimit ?? walletData.minWalletAmount ?? 0

                  const isDebitTxn = (txn) => {
                    const t = (txn.type || txn.transaction_type || "").toLowerCase()
                    return t === "withdrawal" || t === "debit"
                  }
                  const totalCredits = walletData.totalCredits ??
                    transactions.filter(t => !isDebitTxn(t)).reduce((s, t) => s + (t.amount || 0), 0)
                  const totalDebits  = walletData.totalDebits ??
                    transactions.filter(isDebitTxn).reduce((s, t) => s + (t.amount || 0), 0)

                  return (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                        <StatCard label="Current Balance" value={fmt(balance)}       valueColor={balance < 0 ? "#dc2626" : "#166534"} />
                        <StatCard label="Credit Limit"    value={fmt(creditLimit)}   valueColor="#374151" />
                        <StatCard label="Total Credits"     value={fmt(totalCredits)}     valueColor="#166534" />
                        <StatCard label="Total Debits"      value={fmt(totalDebits)}      valueColor="#dc2626" />
                      </div>

                      {transactions.length > 0 && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: 8 }}>
                            RECENT TRANSACTIONS
                          </div>
                          <div style={{ maxHeight: 220, overflowY: "auto", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                            {transactions.slice(0, 10).map((txn, i) => {
                              const type      = txn.type || txn.transaction_type
                              const bookingId = txn.bookingId || txn.booking_id
                              const isDebit   = DEBIT_TYPES.includes(type)
                              return (
                                <div key={i} style={{
                                  display: "flex", justifyContent: "space-between", alignItems: "center",
                                  padding: "10px 12px", borderBottom: i < transactions.length - 1 ? "1px solid #f8fafc" : "none",
                                  fontSize: 13,
                                }}>
                                  <div>
                                    <div style={{ fontWeight: 500, color: "#374151" }}>{TXN_LABELS[type] || type || "—"}</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                      {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
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
                              )
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
                  )
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
            <div className="modal-content" style={{ borderRadius: 12, border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
                <h6 className="modal-title" style={{ fontWeight: 700, margin: 0 }}>Manual Deposit</h6>
                <button type="button" className="btn-close" onClick={closeDepositModal} />
              </div>
              <div className="modal-body" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelSt}>Dealer ID</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Enter dealer ID"
                      value={depositForm.dealerId}
                      onChange={e => setDepositForm(f => ({ ...f, dealerId: e.target.value }))}
                    />
                    {depositForm.dealerName && (
                      <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4 }}>
                        {depositForm.dealerName}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={labelSt}>Amount (₹)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      min={1}
                      placeholder="0"
                      value={depositForm.amount}
                      onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelSt}>Note</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={3}
                      placeholder="Reason for deposit (optional)"
                      value={depositForm.note}
                      onChange={e => setDepositForm(f => ({ ...f, note: e.target.value }))}
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
    </div>
  )
}

export default WithdrawalManagementTable

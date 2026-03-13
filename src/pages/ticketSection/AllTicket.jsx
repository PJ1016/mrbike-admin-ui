import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// const API_BASE = "https://api.mrbikedoctor.cloud/bikedoctor/ticket";
const API_BASE = "https://api.mrbikedoctor.cloud/bikedoctor/ticket";

const STATUS_COLORS = {
    "Open": "badge bg-warning-subtle text-warning",
    "In Progress": "badge bg-info-subtle text-info",
    "Closed": "badge bg-secondary-subtle text-secondary",
};

const exportToCSV = (rows, filename = "tickets.csv") => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};

const formatDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return ""; }
};
const who = (user_type) => (Number(user_type) === 2 ? "Dealer" : Number(user_type) === 4 ? "User" : "Unknown");

/** ---------- TicketTable ---------- */
function TicketTable({
    rows,
    loading,
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    onRowClick,
}) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);

    return (
        <div className="card">
            <div className="table-responsive">
                <table className="table align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: 140 }}>Ticket No</th>
                            <th>Subject</th>
                            <th>Created By</th>
                            <th>Status</th>
                            <th>Last Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Loading…</td></tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-5">
                                    <img
                                        alt="empty"
                                        src="https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/svg/1f4e5.svg"
                                        width={36}
                                        className="mb-2 opacity-75"
                                    /><br />
                                    <strong>No tickets found</strong>
                                    <div className="text-muted small">Try adjusting filters or search.</div>
                                </td>
                            </tr>
                        ) : (
                            rows?.map((t) => {
                                const lastMsg = Array.isArray(t.messages) && t.messages.length
                                    ? t.messages[t.messages.length - 1]
                                    : null;
                                const updatedAt = lastMsg?.timestamp || t.created_at;
                                return (
                                    <tr
                                        key={t._id}
                                        className="cursor-pointer"
                                        onClick={() => onRowClick?.(t)}
                                        style={{ "cursor": "pointer" }}
                                    >
                                        {/* <td className="fw-semibold">TCK-{String(t._id).slice(-6).toUpperCase()}</td> */}
                                        <td className="fw-semibold">{t.ticketNo}</td>
                                        <td>
                                            <div className="fw-semibold">{t.subject}</div>
                                            {lastMsg?.message && (
                                                <div className="text-muted small text-truncate" style={{ maxWidth: 420 }}>
                                                    {lastMsg.message}
                                                </div>
                                            )}
                                        </td>
                                        <td>{t.user_type === "user" ? "User" : "Dealer"}</td>
                                        <td>
                                            <span className={STATUS_COLORS[t.status] || "badge bg-light text-dark"}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="text-muted small">{formatDate(updatedAt)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* footer */}
            <div className="d-flex align-items-center justify-content-between p-3 border-top">
                <div className="text-muted small">
                    Showing {rows.length ? from : 0}–{rows.length ? to : 0} of {total}
                </div>
                <div className="d-flex align-items-center gap-2">
                    <select
                        className="form-select form-select-sm"
                        style={{ width: 110 }}
                        value={pageSize}
                        onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                    >
                        {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                    </select>
                    <div className="btn-group">
                        <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>Prev</button>
                        <span className="btn btn-sm btn-outline-secondary disabled">{page}/{totalPages}</span>
                        <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** ---------- Page ---------- */
const AllTicket = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    // filters + search
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    // pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // download triggers
    const triggerDownloadExcel = useRef(null);
    const triggerDownloadPDF = useRef(null);

    // fetch
    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            setFetchError("");
            try {
                const { data } = await axios.get(`${API_BASE}/user-dealer`);
                if (data?.success) {
                    setTickets(Array.isArray(data.data) ? data.data : []);
                } else {
                    setTickets([]);
                    setFetchError(data?.message || "Failed to fetch tickets");
                }
            } catch (e) {
                setTickets([]);
                setFetchError(e?.response?.data?.message || e?.message || "Failed to fetch tickets");
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    // client filters
    const filtered = useMemo(() => {
        let rows = [...tickets];

        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(r => {
                const subjectHit = r.subject?.toLowerCase().includes(q);
                const messageHit = (r.messages || []).some(m => m.message?.toLowerCase().includes(q));
                const idHit = String(r._id).toLowerCase().includes(q);
                return subjectHit || messageHit || idHit;
            });
        }
        if (status !== "all") rows = rows.filter(r => r.status === status);


        return rows;
    }, [tickets, search, status]);

    // pagination slice
    const total = filtered.length;
    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    // row click -> navigate
    const handleRowClick = (row) => {
        navigate(`/all-tickets/view-ticket/${row?._id}`);
    };

    // downloads
    triggerDownloadExcel.current = () => {
        const rows = filtered.map((t) => {
            const lastMsg = Array.isArray(t.messages) && t.messages.length
                ? t.messages[t.messages.length - 1]
                : null;
            return {
                ticket_id: t._id,
                subject: t.subject,
                created_by: who(t.user_type),
                status: t.status,
                created_at: t.created_at,
                last_update: lastMsg?.timestamp || t.created_at,
                last_message: lastMsg?.message || "",
            };
        });
        exportToCSV(rows, "tickets.csv");
    };
    triggerDownloadPDF.current = () => window.print();

    // reset to first page on filter changes
    useEffect(() => { setPage(1); }, [search, status]);

    return (
        <div className="page-wrapper">
            <div className="content container-fluid">
                {/* Header */}
                <div className="page-header">
                    <div className="content-page-header d-flex align-items-center justify-content-between">
                        <h5 className="mb-0">All Tickets</h5>
                    </div>
                </div>

                {/* Filters */}
                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-4">
                                <input
                                    className="form-control"
                                    placeholder="Search by subject, message, ID…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="all">All Status</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            {/* <div className="col-md-2">
                                <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div> */}
                        </div>
                        {fetchError && <div className="text-danger small mt-2">⚠ {fetchError}</div>}
                    </div>
                </div>

                {/* Table */}
                <TicketTable
                    rows={paged}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    onRowClick={handleRowClick}
                />
            </div>
        </div>
    );
};

export default AllTicket;

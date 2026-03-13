import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";    
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";

// const API_BASE = "https://api.mrbikedoctor.cloud/bikedoctor/ticket";
const API_BASE = "https://api.mrbikedoctor.cloud/bikedoctor/ticket";

const who = (t) => {
    if (t == null) return "Unknown";
    const n = Number(t);
    if (!Number.isNaN(n)) {
        if (n === 1 || n === 3) return "Admin";
        if (n === 2) return "Dealer";
        if (n === 4) return "User";
    }
    const s = String(t).toLowerCase();
    if (s === "admin") return "Admin";
    if (s === "dealer") return "Dealer";
    if (s === "user") return "User";
    return "Unknown";
};

const roleToSenderType = (role) => {
    const s = String(role || "").toLowerCase();
    if (["admin", "dealer", "user"].includes(s)) return s;
    if (s.includes("admin")) return "admin";
    if (s.includes("dealer")) return "dealer";
    if (s.includes("user")) return "user";
    return "user";
};

const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return ""; } };

const NewTicket = () => {
    const { ticketId } = useParams();

    const [statusLoading, setStatusLoading] = useState(false);
    const [replyLoading, setReplyLoading] = useState(false);

    const me = useMemo(() => {
        try {
            const raw = localStorage.getItem("userData");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }, []);

    const myId = me?._id;
    const mySenderType = roleToSenderType(me?.role);

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [text, setText] = useState("");

    const bottomRef = useRef(null);
    const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

    // useEffect(() => {
    //     if (!ticketId) return;
    //     (async () => {
    //         setLoading(true);
    //         setErr("");
    //         try {
    //             const { data } = await axios.get(`${API_BASE}/tickets/${ticketId}`);
    //             if (data?.success && data?.data) {
    //                 setTicket(data.data);
    //                 setTimeout(scrollToBottom, 60);
    //             } else {
    //                 setErr(data?.message || "Failed to load ticket");
    //             }
    //         } catch (e) {
    //             setErr(e?.response?.data?.message || e?.message || "Failed to load ticket");
    //         } finally {
    //             setLoading(false);
    //         }
    //     })();
    // }, [ticketId]);

    // Existing useEffect (keep this)
    useEffect(() => {
        if (!ticketId) return;
        (async () => {
            setLoading(true);
            setErr("");
            try {
                const { data } = await axios.get(`${API_BASE}/tickets/${ticketId}`);
                if (data?.success && data?.data) {
                    setTicket(data.data);
                    setTimeout(scrollToBottom, 60);
                } else {
                    setErr(data?.message || "Failed to load ticket");
                }
            } catch (e) {
                setErr(e?.response?.data?.message || e?.message || "Failed to load ticket");
            } finally {
                setLoading(false);
            }
        })();
    }, [ticketId]);

    // NEW: Add this polling useEffect
    useEffect(() => {
        if (!ticketId || ticket?.status === "Closed") return;

        // Set up polling every 5 seconds
        const interval = setInterval(async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/tickets/${ticketId}`);
                if (data?.success && data?.data) {
                    setTicket(data.data);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 5000); // Check every 5 seconds

        // Cleanup interval on unmount or when ticket closes
        return () => clearInterval(interval);
    }, [ticketId, ticket?.status]);


    const showErrorAlert = (message) => {
        Swal.fire({ icon: "error", title: "Error", text: message, confirmButtonColor: "#3085d6" });
    };

    const showSuccessAlert = (message) => {
        Swal.fire({ icon: "success", title: "Success", text: message, confirmButtonColor: "#3085d6", timer: 1500, showConfirmButton: false });
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!ticket?._id || statusLoading) return;

        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Do you want to change the status to "${newStatus}"?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, change it!",
        });
        if (!result.isConfirmed) return;

        setStatusLoading(true);
        try {
            const { data } = await axios.post(
                `${API_BASE}/status/${ticket._id}`,
                { status: newStatus },
                { headers: { "Content-Type": "application/json" } }
            );

            if (data?.success && data?.data) {
                setTicket(data.data);
                showSuccessAlert(`Status updated to ${newStatus}`);
            } else {
                showErrorAlert(data?.message || "Failed to update status");
            }
        } catch (err) {
            console.error("Update status error:", err);
            showErrorAlert(err?.response?.data?.message || "Error updating status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleReplyToTicket = async () => {
        const body = (text || "").trim();
        if (!body || !ticket || replyLoading) return;
        if (!myId) {
            showErrorAlert("You are not logged in.");
            return;
        }

        setReplyLoading(true);
        try {
            const { data } = await axios.post(
                `${API_BASE}/reply/${ticket._id}`,
                {
                    message: body,
                    sender_id: myId,
                    sender_type: mySenderType,
                },
                { headers: { "Content-Type": "application/json" } }
            );

            if (data?.success && data?.data) {
                setTicket(data.data);
                setText("");
                setTimeout(scrollToBottom, 80);
            } else {
                showErrorAlert(data?.message || "Failed to send reply");
            }
        } catch (err) {
            console.error("Reply error:", err);
            showErrorAlert(err?.response?.data?.message || "Error sending reply");
        } finally {
            setReplyLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="content container-fluid">
                <div className="page-header">
                    <div className="content-page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                            <h5 className="mb-1">Ticket Details</h5>
                            <div className="text-muted small">
                                <Link to="/all-tickets">← Back to Tickets</Link>
                            </div>
                        </div>
                        {ticket && (
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-light text-dark px-3 py-2">Status: {ticket.status}</span>
                                <div className="btn-group">
                                    <button
                                        disabled={statusLoading}
                                        className={`btn btn-sm btn-outline-secondary ${ticket.status === "Open" ? "active" : ""}`}
                                        onClick={() => handleUpdateStatus("Open")}
                                    >
                                        Open
                                    </button>
                                    <button
                                        disabled={statusLoading}
                                        className={`btn btn-sm btn-outline-secondary ${ticket.status === "In Progress" ? "active" : ""}`}
                                        onClick={() => handleUpdateStatus("In Progress")}
                                    >
                                        In Progress
                                    </button>
                                    <button
                                        disabled={statusLoading}
                                        className={`btn btn-sm btn-outline-secondary ${ticket.status === "Closed" ? "active" : ""}`}
                                        onClick={() => handleUpdateStatus("Closed")}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        {loading ? (
                            <div>Loading…</div>
                        ) : err ? (
                            <div className="text-danger">⚠ {err}</div>
                        ) : !ticket ? (
                            <div>No ticket found.</div>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <div>
                                            <h6 className="mb-1">{ticket.subject}</h6>
                                            <div className="text-muted small">
                                                Created by: <strong>{who(ticket.user_type)}</strong> · {fmt(ticket.created_at)}
                                            </div>
                                        </div>
                                        <div className="text-muted small">
                                            ID: <code>{ticket?.ticketId || ticket.ticketNo}</code>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded p-3 chat-scroll">
                                    {!ticket.messages?.length ? (
                                        <div className="text-muted small">No messages yet. Start the conversation 👋</div>
                                    ) : (
                                        ticket.messages.map((m) => {
                                            const senderType = typeof m.sender_type === "object"
                                                ? m.sender_type?.user_type || m.sender_type?.role
                                                : m.sender_type;

                                            // normalize
                                            const role = String(senderType).toLowerCase();
                                            const isAdmin = role === "admin" || role === "1" || role === "3";

                                            return (
                                                <div
                                                    key={m._id}
                                                    className={`d-flex mb-3 ${isAdmin ? "justify-content-end" : "justify-content-start"}`}
                                                >
                                                    {!isAdmin && (
                                                        <div className="me-2">
                                                            <div
                                                                className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                                                style={{ width: 34, height: 34 }}
                                                            >
                                                                {who(senderType).slice(0, 1)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`p-2 rounded-3 ${isAdmin ? "bg-primary text-white mine" : "bg-light theirs"}`}
                                                    >
                                                        <div className="small mb-1">
                                                            {who(senderType)} · {fmt(m.timestamp)}
                                                        </div>
                                                        <div>{m.message}</div>
                                                    </div>

                                                    {isAdmin && (
                                                        <div className="ms-2">
                                                            <div
                                                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                                                style={{ width: 34, height: 34 }}
                                                            >
                                                                A
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Reply / Composer Section */}
                                {/* <div className="mt-3">
                                    {ticket.status === "Closed" ? (
                                        <div className="alert alert-secondary text-center mb-0">
                                            This ticket has been <strong>Closed</strong>. You can’t reply anymore.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="input-group">
                                                <textarea
                                                    className="form-control"
                                                    rows={2}
                                                    placeholder="Type your reply…"
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleReplyToTicket();
                                                        }
                                                    }}
                                                    disabled={replyLoading}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleReplyToTicket}
                                                    disabled={!text.trim() || replyLoading}
                                                >
                                                    {replyLoading ? (
                                                        <>
                                                            <span
                                                                className="spinner-border spinner-border-sm me-1"
                                                                role="status"
                                                                aria-hidden="true"
                                                            ></span>
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        "Send"
                                                    )}
                                                </button>
                                            </div>
                                            <div className="text-muted small mt-1">
                                                Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line.
                                            </div>
                                        </>
                                    )}
                                </div> */}
                                <div className="mt-3">
                                    {ticket.status === "Closed" ? (
                                        <div className="alert alert-secondary text-center mb-0">
                                            This ticket has been <strong>Closed</strong>. You can’t reply anymore.
                                        </div>
                                    ) : ticket.status === "Open" ? (
                                        <>
                                            <div className="alert alert-info text-center mb-2">
                                                This ticket is currently <strong>Open</strong>.
                                                Replying will mark it as <strong>In Progress</strong>.
                                            </div>
                                            <div className="input-group">
                                                <textarea
                                                    className="form-control"
                                                    rows={2}
                                                    placeholder="Start typing your reply…"
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            // ensure ticket is moved to In Progress before sending
                                                            if (ticket.status === "Open") {
                                                                await handleUpdateStatus("In Progress");
                                                            }
                                                            handleReplyToTicket();
                                                        }
                                                    }}
                                                    disabled={replyLoading}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={async () => {
                                                        if (ticket.status === "Open") {
                                                            await handleUpdateStatus("In Progress");
                                                        }
                                                        handleReplyToTicket();
                                                    }}
                                                    disabled={!text.trim() || replyLoading}
                                                >
                                                    {replyLoading ? (
                                                        <>
                                                            <span
                                                                className="spinner-border spinner-border-sm me-1"
                                                                role="status"
                                                                aria-hidden="true"
                                                            ></span>
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        "Send"
                                                    )}
                                                </button>
                                            </div>
                                            <div className="text-muted small mt-1">
                                                Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line.
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="input-group">
                                                <textarea
                                                    className="form-control"
                                                    rows={2}
                                                    placeholder="Type your reply…"
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleReplyToTicket();
                                                        }
                                                    }}
                                                    disabled={replyLoading}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleReplyToTicket}
                                                    disabled={!text.trim() || replyLoading}
                                                >
                                                    {replyLoading ? (
                                                        <>
                                                            <span
                                                                className="spinner-border spinner-border-sm me-1"
                                                                role="status"
                                                                aria-hidden="true"
                                                            ></span>
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        "Send"
                                                    )}
                                                </button>
                                            </div>
                                            <div className="text-muted small mt-1">
                                                Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line.
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* <div className="mt-3">
                                    <div className="input-group">
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            placeholder="Type your reply…"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReplyToTicket();
                                                }
                                            }}
                                            disabled={replyLoading}
                                        />
                                        <button className="btn btn-primary" onClick={handleReplyToTicket} disabled={!text.trim() || replyLoading}>
                                            {replyLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    Sending...
                                                </>
                                            ) : (
                                                "Send"
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-muted small mt-1">
                                        Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line.
                                    </div>
                                </div> */}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .rounded-3 { border-radius: 16px !important; }
        .chat-scroll { height: 440px; overflow-y: auto; }
        .mine { border-bottom-right-radius: 6px !important; max-width: 70%; }
        .theirs { border-bottom-left-radius: 6px !important; max-width: 70%; }
        @media (max-width: 576px) { .chat-scroll { height: 60vh; } }
      `}</style>
        </div>
    );
};

export default NewTicket;

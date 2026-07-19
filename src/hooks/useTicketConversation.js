import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  getTicketById,
  replyToTicket,
  updateTicketStatus,
} from "../services/ticketService";
import { roleToSenderType } from "../utils/ticketHelpers";

// Re-implements the exact fetch/poll/reply/status behavior NewTicket.jsx has
// today (5s polling while not Closed, replying while Open silently
// transitioning to In Progress first, the same Swal confirm/success/error
// UX) behind one hook so the new TicketDrawer can reuse it without
// duplicating that logic. The legacy /all-tickets/view-ticket page keeps its
// own untouched copy — nothing here changes its behavior.
const useTicketConversation = (ticketId) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

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

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      const data = await getTicketById(ticketId);
      setTicket(data);
      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load ticket");
    }
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      return;
    }
    setLoading(true);
    setText("");
    fetchTicket().finally(() => setLoading(false));
  }, [ticketId, fetchTicket]);

  useEffect(() => {
    if (!ticketId || ticket?.status === "Closed") return;
    const interval = setInterval(fetchTicket, 5000);
    return () => clearInterval(interval);
  }, [ticketId, ticket?.status, fetchTicket]);

  const updateStatus = useCallback(
    async (newStatus, { confirm = true } = {}) => {
      if (!ticket?._id || statusLoading) return;
      if (confirm) {
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
      }
      setStatusLoading(true);
      try {
        const data = await updateTicketStatus(ticket._id, newStatus);
        setTicket(data);
        if (confirm) {
          Swal.fire({
            icon: "success",
            title: "Success",
            text: `Status updated to ${newStatus}`,
            confirmButtonColor: "#3085d6",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } catch (e) {
        Swal.fire({ icon: "error", title: "Error", text: e?.message, confirmButtonColor: "#3085d6" });
      } finally {
        setStatusLoading(false);
      }
    },
    [ticket, statusLoading]
  );

  const sendReply = useCallback(async () => {
    const body = text.trim();
    if (!body || !ticket || replyLoading) return;
    if (!myId) {
      Swal.fire({ icon: "error", title: "Error", text: "You are not logged in." });
      return;
    }
    // Preserves the existing rule: replying while Open first moves the
    // ticket to In Progress (silently, no confirm dialog for this step).
    if (ticket.status === "Open") {
      await updateStatus("In Progress", { confirm: false });
    }
    setReplyLoading(true);
    try {
      const data = await replyToTicket(ticket._id, {
        message: body,
        senderId: myId,
        senderType: mySenderType,
      });
      setTicket(data);
      setText("");
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e?.message || "Error sending reply" });
    } finally {
      setReplyLoading(false);
    }
  }, [text, ticket, replyLoading, myId, mySenderType, updateStatus]);

  return {
    ticket,
    loading,
    error,
    text,
    setText,
    replyLoading,
    statusLoading,
    sendReply,
    updateStatus,
    refetch: fetchTicket,
  };
};

export default useTicketConversation;

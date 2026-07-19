import {
  getTicketList as apiGetTicketList,
  getTicketById as apiGetTicketById,
  replyToTicket as apiReplyToTicket,
  updateTicketStatus as apiUpdateTicketStatus,
} from "../api";

// Normalizes the {success, data, message} envelope the ticket endpoints
// return (same shape AllTicket.jsx/NewTicket.jsx have always consumed) into
// plain values/thrown errors, so Support module pages/hooks don't each
// re-check `res?.success` inline.

export const getTicketList = async () => {
  const res = await apiGetTicketList();
  if (res?.success) return Array.isArray(res.data) ? res.data : [];
  throw new Error(res?.message || "Failed to fetch tickets");
};

export const getTicketById = async (ticketId) => {
  const res = await apiGetTicketById(ticketId);
  if (res?.success && res?.data) return res.data;
  throw new Error(res?.message || "Failed to load ticket");
};

export const replyToTicket = async (ticketId, { message, senderId, senderType }) => {
  const res = await apiReplyToTicket(ticketId, {
    message,
    sender_id: senderId,
    sender_type: senderType,
  });
  if (res?.success && res?.data) return res.data;
  throw new Error(res?.message || "Failed to send reply");
};

export const updateTicketStatus = async (ticketId, status) => {
  const res = await apiUpdateTicketStatus(ticketId, status);
  if (res?.success && res?.data) return res.data;
  throw new Error(res?.message || "Failed to update status");
};

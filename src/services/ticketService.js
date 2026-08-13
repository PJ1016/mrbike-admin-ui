import {
  getTicketList as apiGetTicketList,
  getTicketById as apiGetTicketById,
  replyToTicket as apiReplyToTicket,
  updateTicketStatus as apiUpdateTicketStatus,
  getSupportUnreadCount as apiGetSupportUnreadCount,
  markTicketRead as apiMarkTicketRead,
} from "../api";

const TICKET_LIST_CACHE_MS = 30 * 1000;
const UNREAD_COUNT_CACHE_MS = 20 * 1000;

let ticketListCache = { data: null, timestamp: 0 };
let ticketListInFlight = null;
let unreadCountCache = { data: null, timestamp: 0 };
let unreadCountInFlight = null;

// Normalizes the {success, data, message} envelope the ticket endpoints
// return (same shape AllTicket.jsx/NewTicket.jsx have always consumed) into
// plain values/thrown errors, so Support module pages/hooks don't each
// re-check `res?.success` inline.

export const getTicketList = async () => {
  const now = Date.now();
  if (ticketListCache.data && now - ticketListCache.timestamp < TICKET_LIST_CACHE_MS) {
    return ticketListCache.data;
  }
  if (ticketListInFlight) return ticketListInFlight;

  ticketListInFlight = (async () => {
    const res = await apiGetTicketList();
    if (!res?.success) {
      throw new Error(res?.message || "Failed to fetch tickets");
    }

    const rows = Array.isArray(res.data) ? res.data : [];
    ticketListCache = { data: rows, timestamp: Date.now() };
    return rows;
  })();

  try {
    return await ticketListInFlight;
  } finally {
    ticketListInFlight = null;
  }
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

export const getSupportUnreadCount = async () => {
  const now = Date.now();
  if (typeof unreadCountCache.data === "number" && now - unreadCountCache.timestamp < UNREAD_COUNT_CACHE_MS) {
    return unreadCountCache.data;
  }
  if (unreadCountInFlight) return unreadCountInFlight;

  unreadCountInFlight = (async () => {
    const res = await apiGetSupportUnreadCount();
    if (!res?.success) {
      throw new Error(res?.message || "Failed to fetch unread count");
    }

    const count = Number(res.unreadCount || 0);
    unreadCountCache = { data: count, timestamp: Date.now() };
    return count;
  })();

  try {
    return await unreadCountInFlight;
  } finally {
    unreadCountInFlight = null;
  }
};

export const markTicketRead = async (ticketId) => {
  const res = await apiMarkTicketRead(ticketId);
  if (res?.success) {
    const count = Number(res.unreadCount || 0);
    unreadCountCache = { data: count, timestamp: Date.now() };
    return count;
  }
  throw new Error(res?.message || "Failed to mark ticket as read");
};

export const primeTicketListCache = (tickets) => {
  if (!Array.isArray(tickets)) return;
  ticketListCache = { data: tickets, timestamp: Date.now() };
};

export const invalidateTicketListCache = () => {
  ticketListCache = { data: null, timestamp: 0 };
};

export const invalidateUnreadCountCache = () => {
  unreadCountCache = { data: null, timestamp: 0 };
};

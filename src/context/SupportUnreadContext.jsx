import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getSupportUnreadCount,
  markTicketRead as markTicketReadApi,
} from "../services/ticketService";
import { getSocket } from "../socket";

const SupportUnreadContext = createContext({
  unreadCount: 0,
  refreshUnreadCount: () => {},
  markTicketRead: () => {},
});

export const useSupportUnread = () => useContext(SupportUnreadContext);

const POLL_INTERVAL_MS = 25000;

const getLoggedInAdminId = () => {
  try {
    const raw = localStorage.getItem("userData");
    return raw ? JSON.parse(raw)?._id : null;
  } catch {
    return null;
  }
};

export const SupportUnreadProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!localStorage.getItem("adminToken")) return;
    try {
      const count = await getSupportUnreadCount();
      setUnreadCount(count);
    } catch {
      // Badge just keeps its last known value on transient failures.
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    pollRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [refreshUnreadCount]);

  useEffect(() => {
    const adminId = getLoggedInAdminId();
    if (!adminId) return undefined;

    const socket = getSocket();
    const join = () => socket.emit("admin:join", { adminId });
    join();
    socket.on("connect", join);
    socket.on("support:unread:changed", refreshUnreadCount);

    return () => {
      socket.off("connect", join);
      socket.off("support:unread:changed", refreshUnreadCount);
    };
  }, [refreshUnreadCount]);

  const markTicketRead = useCallback(
    async (ticketId) => {
      if (!ticketId) return;
      try {
        const count = await markTicketReadApi(ticketId);
        setUnreadCount(count);
      } catch {
        refreshUnreadCount();
      }
    },
    [refreshUnreadCount]
  );

  return (
    <SupportUnreadContext.Provider
      value={{ unreadCount, refreshUnreadCount, markTicketRead }}
    >
      {children}
    </SupportUnreadContext.Provider>
  );
};

export default SupportUnreadContext;

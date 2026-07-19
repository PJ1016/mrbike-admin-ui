import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

// Socket.IO is mounted on the same server as the REST API, but on the host
// root rather than under the "/bikedoctor" API prefix.
const SOCKET_URL = API_BASE_URL.replace(/\/bikedoctor\/?$/, "");

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

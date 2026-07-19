import axios from "axios";
import Swal from "sweetalert2";

// Singleton network-status store, decoupled from React so both the axios
// interceptor (below) and any component tree can share one source of truth.
let online = typeof navigator !== "undefined" ? navigator.onLine : true;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(online));
};

export const getIsOnline = () => online;

export const subscribeNetworkStatus = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setNetworkOnline = () => {
  if (!online) {
    online = true;
    notify();
  }
};

export const setNetworkOffline = () => {
  if (online) {
    online = false;
    notify();
  }
};

// A "network error" is one where the request never reached a server at all
// (DNS failure, connection refused, offline, timeout) — as opposed to the
// server responding with a 4xx/5xx, which is a normal application error.
export const isNetworkError = (error) => {
  if (!error) return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (error.code === "ERR_NETWORK") return true;
  if (error.message === "Network Error") return true;
  if (!error.response && error.request) return true;
  return false;
};

// Every API call in this app goes through the default axios instance
// (see src/api.js, src/api/additionalServiceApi.js), so a single global
// interceptor here covers the whole app without touching any call site.
axios.interceptors.response.use(
  (response) => {
    setNetworkOnline();
    return response;
  },
  (error) => {
    if (isNetworkError(error)) {
      setNetworkOffline();
    } else {
      // Got an actual response from the server, so the network is fine.
      setNetworkOnline();
    }
    return Promise.reject(error);
  },
);

// Existing code shows a Swal.fire error/warning popup on every failed
// request. During an outage every in-flight/retried call fails the same
// way, which would otherwise stack up duplicate popups behind the
// full-screen offline overlay. Suppress just those while offline instead
// of editing every catch block across the codebase.
const originalSwalFire = Swal.fire.bind(Swal);
Swal.fire = (...args) => {
  const options = args[0];
  const icon = typeof options === "object" && options !== null ? options.icon : undefined;

  if (!online && (icon === "error" || icon === "warning")) {
    return Promise.resolve({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
      value: undefined,
    });
  }

  return originalSwalFire(...args);
};

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getIsOnline,
  subscribeNetworkStatus,
  setNetworkOnline,
  setNetworkOffline,
} from "../utils/networkStatus";
import NoInternetOverlay from "../components/Global/NoInternetOverlay";

const NetworkContext = createContext({ isOnline: true });

export const useNetwork = () => useContext(NetworkContext);

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://api.mrbikedoctor.cloud/bikedoctor";

const HEARTBEAT_INTERVAL_MS = 5000;

// A best-effort reachability probe. `no-cors` means we can't read the
// response, but the fetch promise only rejects on a genuine network failure
// (DNS, connection refused, offline) — enough to know the network is back.
const checkConnectivity = async () => {
  try {
    await fetch(API_BASE_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  }
};

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(getIsOnline());
  const heartbeatRef = useRef(null);

  useEffect(() => subscribeNetworkStatus(setIsOnline), []);

  useEffect(() => {
    const handleOnline = () => setNetworkOnline();
    const handleOffline = () => setNetworkOffline();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // While offline, keep probing in the background so the app recovers on
  // its own even if the browser never fires a fresh "online" event (e.g.
  // Wi-Fi stays connected but the route to the server was down).
  useEffect(() => {
    if (isOnline) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      return undefined;
    }

    heartbeatRef.current = setInterval(async () => {
      const reachable = await checkConnectivity();
      if (reachable) setNetworkOnline();
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(heartbeatRef.current);
  }, [isOnline]);

  const handleManualRetry = async () => {
    const reachable = await checkConnectivity();
    if (reachable) setNetworkOnline();
  };

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
      {!isOnline && <NoInternetOverlay onRetry={handleManualRetry} />}
    </NetworkContext.Provider>
  );
};

export default NetworkContext;

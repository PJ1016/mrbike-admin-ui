import { useCallback, useEffect, useState } from "react";
import { fetchDealerWallets } from "../services/financeService";

const useDealerWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchDealerWallets();
      setWallets(rows);
    } catch (e) {
      setWallets([]);
      setError(e?.message || "Failed to fetch dealer wallets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { wallets, loading, error, refetch: load };
};

export default useDealerWallets;

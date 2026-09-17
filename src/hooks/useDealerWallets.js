import { useCallback, useEffect, useState } from "react";
import { fetchDealerWallets } from "../services/financeService";

const useDealerWallets = (params = {}) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchDealerWallets(params);
      setWallets(result.data);
      setPagination(result.pagination);
    } catch (e) {
      setWallets([]);
      setError(e?.message || "Failed to fetch dealer wallets");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    load();
  }, [load]);

  return { wallets, pagination, loading, error, refetch: load };
};

export default useDealerWallets;

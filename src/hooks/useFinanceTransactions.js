import { useCallback, useEffect, useState } from "react";
import { fetchFinanceTransactions } from "../services/financeService";

const useFinanceTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchFinanceTransactions();
      setTransactions(rows);
    } catch (e) {
      setTransactions([]);
      setError(e?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { transactions, loading, error, refetch: load };
};

export default useFinanceTransactions;

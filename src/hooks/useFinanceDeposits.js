import { useCallback, useEffect, useState } from "react";
import { fetchFinanceDeposits } from "../services/financeService";

const useFinanceDeposits = (params = {}) => {
  const [deposits, setDeposits] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchFinanceDeposits(params);
      setDeposits(result.data);
      setPagination(result.pagination);
    } catch (e) {
      setDeposits([]);
      setError(e?.message || "Failed to fetch deposits");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { deposits, pagination, loading, error, refetch: load };
};

export default useFinanceDeposits;

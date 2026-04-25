import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBikesByCompany } from '../redux/slices/bikeSlice';
/**
 * Create a stable key from an array of IDs for comparison
 * @param {Array} ids - Array of IDs
 * @returns {string} - Stable key string
 */
const createStableKey = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return '';
  return [...ids].sort().join(',');
};

/**
 * Custom hook to manage bike fetching by company with duplicate prevention
 * @param {Array} companyIds - Array of company IDs to fetch bikes for
 * @param {Object} options - Configuration options
 * @returns {Object} - { loading, bikes, error, refetch }
 */
export const useBikesByCompany = (companyIds = [], options = {}) => {
  const { debounceMs = 300, enabled = true } = options;
  const dispatch = useDispatch();
  const { bikes, loading, error, lastFetchedCompanyIds } = useSelector(state => state.bike);
  
  const timeoutRef = useRef(null);
  const lastRequestRef = useRef(null);

  const fetchBikes = useCallback((ids) => {
    if (!enabled || !ids || ids.length === 0) return;
    
    // Create stable keys for comparison using utility function
    const requestKey = createStableKey(ids);
    const lastKey = lastFetchedCompanyIds ? createStableKey(lastFetchedCompanyIds) : '';
    
    // Skip if same request is already in progress or completed
    if (requestKey === lastRequestRef.current || requestKey === lastKey) {
      return;
    }
    
    lastRequestRef.current = requestKey;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the API call
    timeoutRef.current = setTimeout(() => {
      dispatch(fetchBikesByCompany([...ids]));
    }, debounceMs);
  }, [dispatch, enabled, debounceMs, lastFetchedCompanyIds]);

  useEffect(() => {
    if (companyIds && companyIds.length > 0) {
      // Create a safe copy of the array
      const safeCompanyIds = Array.isArray(companyIds) ? [...companyIds] : [companyIds];
      fetchBikes(safeCompanyIds);
    }
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [companyIds, fetchBikes]);

  const refetch = useCallback(() => {
    if (companyIds && companyIds.length > 0) {
      const safeCompanyIds = Array.isArray(companyIds) ? [...companyIds] : [companyIds];
      lastRequestRef.current = null;
      fetchBikes(safeCompanyIds);
    }
  }, [companyIds, fetchBikes]);

  return {
    bikes,
    loading,
    error,
    refetch
  };
};

export default useBikesByCompany;
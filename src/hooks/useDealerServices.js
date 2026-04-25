import { useEffect, useRef, useCallback, useState } from 'react';
import { getDealerServices } from '../api';


/**
 * Custom hook to manage dealer services fetching with duplicate prevention and caching
 * @param {string} dealerId - Dealer ID to fetch services for
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useDealerServices = (dealerId, options = {}) => {
  const { enabled = true, cacheTime = 5 * 60 * 1000 } = options; // 5 minutes cache
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cacheRef = useRef(new Map());
  const requestRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchServices = useCallback(async (id, force = false) => {
    if (!enabled || !id) return;

    // Check cache first
    const cacheKey = `dealer-services-${id}`;
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (!force && cached && (now - cached.timestamp) < cacheTime) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return cached.data;
    }

    // Prevent duplicate requests
    if (requestRef.current === id) {
      return;
    }

    requestRef.current = id;
    setLoading(true);
    setError(null);

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await getDealerServices(id);
      
      // Cache the response with safe copy
      cacheRef.current.set(cacheKey, {
        data: response,
        timestamp: now
      });
      
      setData(response);
      setError(null);
      return response;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch dealer services:', err);
        setError(err.message || 'Failed to fetch dealer services');
      }
      throw err;
    } finally {
      setLoading(false);
      requestRef.current = null;
      abortControllerRef.current = null;
    }
  }, [enabled, cacheTime]);

  useEffect(() => {
    if (dealerId) {
      fetchServices(dealerId);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [dealerId, fetchServices]);

  const refetch = useCallback(() => {
    if (dealerId) {
      return fetchServices(dealerId, true); // Force refresh
    }
  }, [dealerId, fetchServices]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
};

export default useDealerServices;
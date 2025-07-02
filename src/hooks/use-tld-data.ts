'use client';

import { useState, useEffect } from 'react';
import {
  loadTldData,
  getCurrentTldData,
  type TldDataState,
} from '@/services/tld-data-service';

/**
 * React hook to load TLD data dynamically with loading states
 */
export function useTldData(): TldDataState {
  const [state, setState] = useState<TldDataState>({
    data: getCurrentTldData(),
    loading: !getCurrentTldData(),
    error: null,
  });

  useEffect(() => {
    // If data is already cached, no need to load
    const cachedData = getCurrentTldData();
    if (cachedData) {
      setState({
        data: cachedData,
        loading: false,
        error: null,
      });
      return;
    }

    // Load data dynamically
    setState(prev => ({ ...prev, loading: true, error: null }));

    loadTldData()
      .then(data => {
        setState({
          data,
          loading: false,
          error: null,
        });
      })
      .catch(error => {
        setState({
          data: null,
          loading: false,
          error: error.message || 'Failed to load TLD data',
        });
      });
  }, []);

  return state;
}

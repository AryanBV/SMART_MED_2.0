import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { FamilyHealthData } from '@/interfaces/types';

export function useFamilyHealthData() {
  const [data, setData] = useState<FamilyHealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFamilyHealthData();
  }, []);

  const fetchFamilyHealthData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/family/health-overview');
      setData(response.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch family health data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchFamilyHealthData,
  };
}
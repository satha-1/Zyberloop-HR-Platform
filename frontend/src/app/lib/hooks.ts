'use client';

import { useState, useEffect } from 'react';
import { api } from './api';

export function useEmployees(params?: { search?: string; department?: string; status?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getEmployees(params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.search, params?.department, params?.status]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getEmployees(params).then(setData).catch(setError).finally(() => setLoading(false));
  }};
}

export function usePayrollRuns() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getPayrollRuns();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getPayrollRuns().then(setData).catch(setError).finally(() => setLoading(false));
  }};
}

export function useLeaveRequests(params?: { status?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getLeaveRequests(params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.status]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getLeaveRequests(params).then(setData).catch(setError).finally(() => setLoading(false));
  }};
}

export function useRequisitions(params?: { status?: string; department?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getRequisitions(params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.status, params?.department]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getRequisitions(params).then(setData).catch(setError).finally(() => setLoading(false));
  }};
}

export function useLogs(params?: { search?: string; module?: string; action?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getLogs(params);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.search, params?.module, params?.action]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getLogs(params).then(setData).catch(setError).finally(() => setLoading(false));
  }};
}

export function useEmployee(id: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setData(null);
      return;
    }
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await api.getEmployeeById(id);
        setData(result);
      } catch (err) {
        console.error('Error fetching employee:', err);
        setError(err as Error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  return { data, loading, error, refetch: () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.getEmployeeById(id).then(setData).catch((err) => {
      console.error('Error refetching employee:', err);
      setError(err as Error);
      setData(null);
    }).finally(() => setLoading(false));
  }};
}

export function usePayrollRun(id: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getPayrollRunById(id);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getPayrollRunById(id).then(setData).catch(setError).finally(() => setLoading(false));
  }};
}

export function useAuditLogs() {
  return useLogs();
}

export function useDepartments() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getDepartments();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getDepartments().then(setData).catch(setError).finally(() => setLoading(false));
  }};
}

export function usePerformanceGoals(employeeId?: string, cycleId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getGoals({ employeeId, cycleId });
        setData(result || []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [employeeId, cycleId]);

  return { data, loading, error, refetch: () => {
    if (!employeeId) return;
    setLoading(true);
    api.getGoals({ employeeId, cycleId }).then(setData).catch((err) => {
      setError(err as Error);
      setData([]);
    }).finally(() => setLoading(false));
  }};
}

export function usePerformanceCycles() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getPerformanceCycles();
        setData(result || []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getPerformanceCycles().then(setData).catch((err) => {
      setError(err as Error);
      setData([]);
    }).finally(() => setLoading(false));
  }};
}

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
        setError(null);
        const result = await api.getEmployees(params);
        // Ensure result is an array
        setData(Array.isArray(result) ? result : []);
      } catch (err: any) {
        console.error('Error fetching employees:', err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.search, params?.department, params?.status]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getEmployees(params).then((data: any) => setData(Array.isArray(data) ? data : (data?.data || []))).catch(setError).finally(() => setLoading(false));
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
        const result = await api.getPayrollRuns({}) as any;
        setData(Array.isArray(result) ? result : (result?.data || []));
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
    api.getPayrollRuns({}).then((data: any) => setData(Array.isArray(data) ? data : (data?.data || []))).catch(setError).finally(() => setLoading(false));
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
        setError(null);
        const result = await api.getDepartments();
        // Ensure result is an array
        setData(Array.isArray(result) ? result : []);
      } catch (err: any) {
        console.error('Error fetching departments:', err);
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

export function useTemplates(params?: { docType?: string; status?: string; locale?: string; search?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getTemplates(params);
        setData(result || []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.docType, params?.status, params?.locale, params?.search]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getTemplates(params).then(setData).catch((err) => {
      setError(err as Error);
      setData([]);
    }).finally(() => setLoading(false));
  }};
}

export function useDocuments(params?: { docType?: string; status?: string; subjectType?: string; subjectId?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getDocuments(params);
        setData(result || []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.docType, params?.status, params?.subjectType, params?.subjectId]);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.getDocuments(params).then(setData).catch((err) => {
      setError(err as Error);
      setData([]);
    }).finally(() => setLoading(false));
  }};
}

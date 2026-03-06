"use client";

import { useState, useEffect } from "react";
import { api } from "./api";

export function useEmployees(params?: {
  search?: string;
  department?: string;
  status?: string;
}) {
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
        console.error("Error fetching employees:", err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.search, params?.department, params?.status]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getEmployees(params)
        .then((data: any) =>
          setData(Array.isArray(data) ? data : data?.data || []),
        )
        .catch(setError)
        .finally(() => setLoading(false));
    },
  };
}

export function usePayrollRuns() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = (await api.getPayrollRuns({})) as any;
        setData(Array.isArray(result) ? result : result?.data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getPayrollRuns({})
        .then((data: any) =>
          setData(Array.isArray(data) ? data : data?.data || []),
        )
        .catch(setError)
        .finally(() => setLoading(false));
    },
  };
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
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.status]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getLeaveRequests(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useRequisitions(params?: {
  status?: string;
  department?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getRequisitions(params);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.status, params?.department]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getRequisitions(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useLogs(params?: {
  search?: string;
  module?: string;
  action?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getLogs(params);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.search, params?.module, params?.action]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getLogs(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
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
        console.error("Error fetching employee:", err);
        setError(err as Error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      api
        .getEmployeeById(id)
        .then(setData)
        .catch((err) => {
          console.error("Error refetching employee:", err);
          setError(err as Error);
          setData(null);
        })
        .finally(() => setLoading(false));
    },
  };
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

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getPayrollRunById(id)
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    },
  };
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
        console.error("Error fetching departments:", err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getDepartments()
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function usePerformanceGoals(employeeId?: string, cycleId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cycleId) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getGoals(
          cycleId!,
          employeeId ? { ownerId: employeeId } : undefined,
        );
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [employeeId, cycleId]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      if (!cycleId) return;
      setLoading(true);
      api
        .getGoals(cycleId, employeeId ? { ownerId: employeeId } : undefined)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
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
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getPerformanceCycles()
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useTemplates(params?: {
  docType?: string;
  status?: string;
  locale?: string;
  search?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getDocumentTemplates(params);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.docType, params?.status, params?.locale, params?.search]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getDocumentTemplates(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useDocuments(params?: {
  docType?: string;
  status?: string;
  subjectType?: string;
  subjectId?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getDocuments(params);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.docType, params?.status, params?.subjectType, params?.subjectId]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getDocuments(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useAttendanceRecords(params?: {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getAttendanceRecords(params);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.startDate, params?.endDate, params?.employeeId, params?.status]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getAttendanceRecords(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

// ─── eSign Hooks ──────────────────────────────────────────

export function useEsignTemplates(params?: { status?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getEsignTemplates(params);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.status]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getEsignTemplates(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useEsignEnvelopes(params?: {
  status?: string;
  employeeId?: string;
  templateId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getEnvelopes(params);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [
    params?.status,
    params?.employeeId,
    params?.templateId,
    params?.dateFrom,
    params?.dateTo,
  ]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getEnvelopes(params)
        .then((result: any) => setData(Array.isArray(result) ? result : []))
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useTasks(params?: {
  status?: string;
  priority?: string;
  overdue?: boolean;
  limit?: number;
  offset?: number;
  userId?: string;
  filterType?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result: any = await api.getTasks(params);
        setData(
          Array.isArray(result.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : [],
        );
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [
    params?.status,
    params?.priority,
    params?.overdue,
    params?.userId,
    params?.filterType,
  ]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      api
        .getTasks(params)
        .then((result: any) =>
          setData(
            Array.isArray(result.data)
              ? result.data
              : Array.isArray(result)
                ? result
                : [],
          ),
        )
        .catch((err) => {
          setError(err as Error);
          setData([]);
        })
        .finally(() => setLoading(false));
    },
  };
}

export function useLearningCourses(params?: {
  category?: string;
  status?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result: any = await api.getLearningCourses(params);
      setData(Array.isArray(result) ? result : result?.data || []);
    } catch (err) {
      setError(err as Error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params?.category, params?.status]);

  return { data, loading, error, refetch: fetchData };
}

export function useLearningAssignments(params?: {
  employeeId?: string;
  courseId?: string;
  status?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result: any = await api.getLearningAssignments(params);
      setData(Array.isArray(result) ? result : result?.data || []);
    } catch (err) {
      setError(err as Error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params?.employeeId, params?.courseId, params?.status]);

  return { data, loading, error, refetch: fetchData };
}
export function useEmployeeProfileAbsence(employeeId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      setData(null);
      return;
    }
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await api.getEmployeeProfileAbsence(employeeId);
        setData(result);
      } catch (err) {
        console.error("Error fetching employee absence profile:", err);
        setError(err as Error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [employeeId]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      if (!employeeId) return;
      setLoading(true);
      setError(null);
      api
        .getEmployeeProfileAbsence(employeeId)
        .then(setData)
        .catch((err) => {
          console.error("Error refetching employee absence profile:", err);
          setError(err as Error);
          setData(null);
        })
        .finally(() => setLoading(false));
    },
  };
}

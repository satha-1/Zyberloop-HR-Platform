const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Employees
  async getEmployees(params?: { search?: string; department?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/employees${query ? `?${query}` : ''}`);
  }

  async getEmployeeById(id: string) {
    return this.request(`/employees/${id}`);
  }

  async createEmployee(data: any) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payroll
  async getPayrollRuns() {
    return this.request('/payroll/runs');
  }

  async getPayrollRunById(id: string) {
    return this.request(`/payroll/runs/${id}`);
  }

  async createPayrollRun(data: { periodStart: string; periodEnd: string }) {
    return this.request('/payroll/runs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async calculatePayrollRun(id: string) {
    return this.request(`/payroll/runs/${id}/calculate`, {
      method: 'POST',
    });
  }

  async approvePayrollRun(id: string, type: 'hr' | 'finance') {
    return this.request(`/payroll/runs/${id}/approve/${type}`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async finalizePayrollRun(id: string) {
    return this.request(`/payroll/runs/${id}/finalize`, {
      method: 'POST',
    });
  }

  async getPayrollEntries(runId: string) {
    return this.request(`/payroll/runs/${runId}/entries`);
  }

  // Leave
  async getLeaveRequests(params?: { status?: string; employeeId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/leave/requests${query ? `?${query}` : ''}`);
  }

  async createLeaveRequest(data: any) {
    return this.request('/leave/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveLeaveRequest(id: string) {
    return this.request(`/leave/requests/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectLeaveRequest(id: string) {
    return this.request(`/leave/requests/${id}/reject`, {
      method: 'POST',
    });
  }

  // Recruitment
  async getRequisitions(params?: { status?: string; department?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/recruitment/requisitions${query ? `?${query}` : ''}`);
  }

  async getRequisitionById(id: string) {
    return this.request(`/recruitment/requisitions/${id}`);
  }

  async getPublicRequisition(id: string) {
    return this.request(`/recruitment/public/requisitions/${id}`);
  }

  async createRequisition(data: any) {
    return this.request('/recruitment/requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCandidates(params?: { requisitionId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/recruitment/candidates${query ? `?${query}` : ''}`);
  }

  async createCandidateApplication(data: any) {
    return this.request('/recruitment/public/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Logs
  async getLogs(params?: { search?: string; module?: string; action?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/logs${query ? `?${query}` : ''}`);
  }

  // Departments
  async getDepartments() {
    return this.request('/departments');
  }
}

export const api = new ApiClient(API_BASE_URL);

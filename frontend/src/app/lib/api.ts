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

    // Refresh token from localStorage on each request
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          // Try to auto-login with default admin credentials
          const defaultEmail = 'sathsarasoysa2089@gmail.com';
          const defaultPassword = 'Sath@Admin';
          
          try {
            await this.login(defaultEmail, defaultPassword);
            // Retry the original request with new token
            if (this.token) {
              const newHeaders = {
                ...headers,
                'Authorization': `Bearer ${this.token}`,
              };
              const retryResponse = await fetch(url, {
                ...options,
                headers: newHeaders,
              });
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                return retryData.data || retryData;
              }
            }
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
          }
        }
        throw new Error('Authentication required. Please login.');
      }

      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const data = await response.json();
    // Handle both { success: true, data: [...] } and direct array/object responses
    if (data && typeof data === 'object' && 'data' in data && !Array.isArray(data)) {
      return data.data;
    }
    return data;
  }

  // Auth
  async login(email: string, password: string) {
    const url = `${this.baseUrl}/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.error?.message || error.message || 'Login failed');
    }

    const result = await response.json();
    const data = result.data || result;
    
    if (data && data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // Employees
  async getEmployees(params?: { search?: string; department?: string; status?: string }) {
    // Only include non-empty parameters in the query
    const queryParams: Record<string, string> = {};
    if (params?.search && params.search.trim() !== '') {
      queryParams.search = params.search;
    }
    if (params?.department && params.department.trim() !== '' && params.department !== 'all') {
      queryParams.department = params.department;
    }
    if (params?.status && params.status.trim() !== '' && params.status !== 'all') {
      queryParams.status = params.status;
    }
    const query = new URLSearchParams(queryParams).toString();
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

  async createEmployeeWithFiles(formData: FormData) {
    const url = `${this.baseUrl}/employees`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
  }

  async updateEmployee(id: string, data: any) {
    return this.request(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateEmployeeWithFiles(id: string, formData: FormData) {
    const url = `${this.baseUrl}/employees/${id}`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
  }

  async deleteEmployee(id: string) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async getEmployeeDocuments(employeeId: string) {
    return this.request(`/employees/${employeeId}/documents`);
  }

  async uploadEmployeeDocument(employeeId: string, file: File, documentType: string) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const url = `${this.baseUrl}/employees/${employeeId}/documents`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
  }

  // Template Management
  async getTemplates() {
    return this.request<{ success: boolean; data: any[] }>('/employees/templates');
  }

  async getTemplateById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/employees/templates/${id}`);
  }

  async createTemplate(data: { name: string; type: string; content: string; placeholders?: string[] }) {
    return this.request<{ success: boolean; data: any }>('/employees/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: { content?: string; name?: string; isActive?: boolean }) {
    return this.request<{ success: boolean; data: any }>(`/employees/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async previewDocument(employeeId: string, templateType: string, data?: any) {
    return this.request<{ success: boolean; data: { content: string; templateName: string; placeholders: string[] } }>('/employees/documents/preview', {
      method: 'POST',
      body: JSON.stringify({ employeeId, templateType, data }),
    });
  }

  async generateDocument(employeeId: string, templateType: string, data?: any) {
    return this.request('/employees/documents/generate', {
      method: 'POST',
      body: JSON.stringify({ employeeId, templateType, data }),
    });
  }

  async getGeneratedDocuments(employeeId: string) {
    return this.request(`/employees/${employeeId}/documents/generated`);
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

  // Performance
  async getGoals(params?: { employeeId?: string; cycleId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/performance/goals${query ? `?${query}` : ''}`);
  }

  async getAppraisals(params?: { employeeId?: string; cycleId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/performance/appraisals${query ? `?${query}` : ''}`);
  }

  async getPerformanceCycles() {
    return this.request('/performance/cycles');
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
    // Public endpoint - don't send auth token
    const url = `${this.baseUrl}/recruitment/public/requisitions/${id}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
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

  async updateCandidateApplicationStatus(applicationId: string, status: string, interviewNotes?: string, rating?: number) {
    return this.request(`/recruitment/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, interviewNotes, rating }),
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

  async getDepartmentById(id: string) {
    return this.request(`/departments/${id}`);
  }

  async createDepartment(data: { name: string; code: string; parentDepartmentId?: string; headId?: string }) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: { name?: string; code?: string; parentDepartmentId?: string; headId?: string }) {
    return this.request(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: string) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Documents & Templates
  async getTemplates(params?: { docType?: string; status?: string; locale?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/documents/templates${query ? `?${query}` : ''}`);
  }

  async getTemplateById(id: string) {
    return this.request(`/documents/templates/${id}`);
  }

  async createTemplate(data: any) {
    return this.request('/documents/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: any) {
    return this.request(`/documents/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async submitTemplateForReview(id: string) {
    return this.request(`/documents/templates/${id}/submit-review`, {
      method: 'POST',
    });
  }

  async approveTemplate(id: string, notes?: string) {
    return this.request(`/documents/templates/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async publishTemplate(id: string, effectiveFrom?: string, effectiveTo?: string) {
    return this.request(`/documents/templates/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ effectiveFrom, effectiveTo }),
    });
  }

  async deprecateTemplate(id: string) {
    return this.request(`/documents/templates/${id}/deprecate`, {
      method: 'POST',
    });
  }

  async previewDocument(data: {
    templateId?: string;
    locale?: string;
    docType?: string;
    subjectType: string;
    subjectId: string;
    effectiveOn?: string;
  }) {
    return this.request('/documents/documents/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateDocument(data: {
    docType: string;
    templateId?: string;
    subjectType: string;
    subjectId: string;
    effectiveOn?: string;
  }) {
    return this.request('/documents/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDocuments(params?: {
    docType?: string;
    status?: string;
    subjectType?: string;
    subjectId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/documents/documents${query ? `?${query}` : ''}`);
  }

  async getDocumentById(id: string) {
    return this.request(`/documents/documents/${id}`);
  }

  async downloadDocument(id: string, artefactKind?: string) {
    return this.request(`/documents/documents/${id}/download`, {
      method: 'POST',
      body: JSON.stringify({ artefactKind }),
    });
  }

  async bulkGenerateDocuments(payrollRunId: string, docType: string) {
    return this.request('/documents/documents/bulk', {
      method: 'POST',
      body: JSON.stringify({ payrollRunId, docType }),
    });
  }

  async getDocumentJob(jobId: string) {
    return this.request(`/documents/document-jobs/${jobId}`);
  }

  async requestDocumentSigning(documentId: string, provider: string, signers: any[]) {
    return this.request(`/documents/documents/${documentId}/sign-request`, {
      method: 'POST',
      body: JSON.stringify({ provider, signers }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

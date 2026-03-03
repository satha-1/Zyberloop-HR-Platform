// API Base URL - must be set in environment variables
// For local development: http://localhost:3001/api/v1
// For production: https://your-api-domain.com/api/v1
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';

if (!process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  NEXT_PUBLIC_API_BASE_URL is not set. Using default localhost URL.');
}

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Refresh token from localStorage on each request
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
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
    } catch (error: any) {
      // Handle network errors (backend not running, CORS, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please ensure the backend server is running.');
      }
      // Re-throw other errors
      throw error;
    }
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

  async generateEmployeeCode() {
    return this.request('/employees/generate-code');
  }

  async generateEmployeeNumber(departmentId: string) {
    return this.request(`/employees/generate-number?departmentId=${encodeURIComponent(departmentId)}`);
  }

  async createEmployee(data: any) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createEmployeeWithFiles(formData: FormData) {
    const url = `${this.baseUrl}/employees`;
    const headers: Record<string, string> = {};
    
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
    const headers: Record<string, string> = {};
    
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

  async getEmployeeCompensationComponents(employeeId: string, asOf?: string) {
    const query = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
    return this.request(`/employees/${employeeId}/compensation/components${query}`);
  }

  async assignEmployeeCompensationComponent(employeeId: string, payload: any) {
    return this.request(`/employees/${employeeId}/compensation/components`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEmployeeCompensationComponent(assignmentId: string, payload: any) {
    return this.request(`/employees/compensation/components/${assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getEmployeeBankAccounts(employeeId: string, asOf?: string) {
    const query = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
    return this.request(`/employees/${employeeId}/bank-accounts${query}`);
  }

  async createEmployeeBankAccount(employeeId: string, payload: any) {
    return this.request(`/employees/${employeeId}/bank-accounts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEmployeeBankAccount(bankAccountId: string, payload: any) {
    return this.request(`/employees/bank-accounts/${bankAccountId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteEmployee(id: string) {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Employee Profile 360° APIs
  async getEmployeeProfileSummary(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/summary`);
  }

  async getEmployeeProfileJob(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/job`);
  }

  async getEmployeeProfileCompensation(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/compensation`);
  }

  async getEmployeeProfilePerformance(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/performance`);
  }

  async getEmployeeProfileCareer(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/career`);
  }

  async getEmployeeProfileContact(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/contact`);
  }

  async getEmployeeProfilePersonal(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/personal`);
  }

  async updateEmployeeProfilePersonal(employeeId: string, payload: any) {
    return this.request(`/employees/${employeeId}/profile/personal`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async createEmployeeProfileJobHistory(employeeId: string, payload: any) {
    return this.request(`/employees/${employeeId}/profile/job-history`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEmployeeProfileJobHistory(employeeId: string, historyId: string, payload: any) {
    return this.request(`/employees/${employeeId}/profile/job-history/${historyId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteEmployeeProfileJobHistory(employeeId: string, historyId: string) {
    return this.request(`/employees/${employeeId}/profile/job-history/${historyId}`, {
      method: 'DELETE',
    });
  }

  async getEmployeeProfilePay(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/pay`);
  }

  async getEmployeeProfileAbsence(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/absence`);
  }

  async getEmployeeProfileBenefits(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/benefits`);
  }

  async getEmployeeProfileServiceDates(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/service-dates`);
  }

  async getEmployeeProfileAssignedRoles(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/assigned-roles`);
  }

  async getEmployeeProfileSupportRoles(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/support-roles`);
  }

  async getEmployeeProfileExternalInteractions(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/external-interactions`);
  }

  async getEmployeeProfileAdditionalData(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/additional-data`);
  }

  async getEmployeeProfileOrganizations(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/organizations`);
  }

  async getEmployeeProfileManagementChain(employeeId: string) {
    return this.request(`/employees/${employeeId}/profile/management-chain`);
  }

  async getEmployeeDocuments(employeeId: string) {
    return this.request(`/employees/${employeeId}/documents`);
  }

  async uploadEmployeeDocument(employeeId: string, file: File, documentType: string) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const url = `${this.baseUrl}/employees/${employeeId}/documents`;
    const headers: Record<string, string> = {};
    
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
  async getEmployeeTemplates() {
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

  async previewEmployeeDocument(employeeId: string, templateType: string, data?: any) {
    return this.request<{ success: boolean; data: { content: string; templateName: string; placeholders: string[] } }>('/employees/documents/preview', {
      method: 'POST',
      body: JSON.stringify({ employeeId, templateType, data }),
    });
  }

  async generateEmployeeDocument(employeeId: string, templateType: string, data?: any) {
    return this.request('/employees/documents/generate', {
      method: 'POST',
      body: JSON.stringify({ employeeId, templateType, data }),
    });
  }

  async getGeneratedDocuments(employeeId: string) {
    return this.request(`/employees/${employeeId}/documents/generated`);
  }

  // Payroll (legacy - use getPayrollRunsWithParams instead)
  async getPayrollRunsLegacy() {
    return this.request('/payroll/runs');
  }

  async getPayrollRunByIdLegacy(id: string) {
    return this.request(`/payroll/runs/${id}`);
  }

  async createPayrollRunLegacy(data: { periodStart: string; periodEnd: string }) {
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

  async getLeaveTypes() {
    return this.request<any[]>("/leave/types");
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

  async getAttendanceRecords(params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/attendance${query ? `?${query}` : ""}`);
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
  async getRequisitions(params?: { 
    status?: string; 
    department?: string; 
    view?: 'showAll' | 'byHiringManager' | 'byLocation';
    location?: string;
    hiringManagerId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.department) query.append('department', params.department);
    if (params?.view) query.append('view', params.view);
    if (params?.location) query.append('location', params.location);
    if (params?.hiringManagerId) query.append('hiringManagerId', params.hiringManagerId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return this.request(`/recruitment/requisitions${query.toString() ? `?${query}` : ''}`);
  }

  async getHiringManagers() {
    return this.request('/recruitment/hiring-managers');
  }

  async getLocations() {
    return this.request('/recruitment/locations');
  }

  async getRequisitionCandidates(requisitionId: string, params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return this.request(`/recruitment/requisitions/${requisitionId}/candidates${query.toString() ? `?${query}` : ''}`);
  }

  // Notifications
  async getNotifications(params?: { onlyUnread?: boolean; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.onlyUnread) query.append('onlyUnread', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return this.request(`/notifications${query.toString() ? `?${query}` : ''}`);
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Tasks
  async getTasks(params?: { status?: string; priority?: string; overdue?: boolean; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.overdue) query.append('overdue', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return this.request(`/tasks${query.toString() ? `?${query}` : ''}`);
  }

  async getTaskById(taskId: string) {
    return this.request(`/tasks/${taskId}`);
  }

  async createTask(data: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(taskId: string, data: any) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getActiveTaskCount() {
    return this.request('/tasks/active-count');
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

  async updateRequisition(id: string, data: any) {
    return this.request(`/recruitment/requisitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCandidates(params?: { requisitionId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/recruitment/candidates${query ? `?${query}` : ''}`);
  }

  async checkApplicationStatus(requisitionId: string, email: string) {
    // Public endpoint - don't send auth token
    const url = `${this.baseUrl}/recruitment/public/check-application?requisitionId=${requisitionId}&email=${encodeURIComponent(email)}`;
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

    const result = await response.json();
    return result.data || result;
  }

  async createCandidateApplication(data: FormData) {
    // Public endpoint - don't send auth token
    const url = `${this.baseUrl}/recruitment/public/applications`;
    const response = await fetch(url, {
      method: 'POST',
      body: data, // FormData includes file
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }

    const result = await response.json();
    return result.data || result;
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

  async generateDepartmentCode(name: string) {
    const query = new URLSearchParams({ name }).toString();
    return this.request(`/departments/generate-code?${query}`);
  }

  async createDepartment(data: {
    name: string;
    code?: string;
    description?: string;
    parentDepartmentId?: string;
    headId?: string;
    location?: string;
    costCenter?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    effectiveFrom?: string;
    email?: string;
    phoneExt?: string;
  }) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: {
    name?: string;
    description?: string;
    parentDepartmentId?: string;
    headId?: string;
    location?: string;
    costCenter?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    effectiveFrom?: string;
    email?: string;
    phoneExt?: string;
  }) {
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
  async getDocumentTemplates(params?: { docType?: string; status?: string; locale?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/documents/templates${query ? `?${query}` : ''}`);
  }

  async getDocumentTemplateById(id: string) {
    return this.request(`/documents/templates/${id}`);
  }

  async createDocumentTemplate(data: any) {
    return this.request('/documents/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDocumentTemplate(id: string, data: any) {
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

  // Payroll Templates API
  async getPayrollTemplates(params?: {
    search?: string;
    payFrequency?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/payroll/templates${query ? `?${query}` : ''}`);
  }

  async getPayrollTemplateById(id: string) {
    return this.request(`/payroll/templates/${id}`);
  }

  async createPayrollTemplate(data: any) {
    return this.request('/payroll/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayrollTemplate(id: string, data: any) {
    return this.request(`/payroll/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePayrollTemplate(id: string) {
    return this.request(`/payroll/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicatePayrollTemplate(id: string) {
    return this.request(`/payroll/templates/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async getPayrollComponents(params?: { kind?: string; isActive?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/payroll/components${query ? `?${query}` : ''}`);
  }

  async createPayrollComponent(data: any) {
    return this.request('/payroll/components', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApitTable(tableCode = 'TABLE_01', asOf?: string) {
    const query = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
    return this.request(`/payroll/apit/${encodeURIComponent(tableCode)}${query}`);
  }

  async calculateEnterprisePayslip(data: any) {
    return this.request('/payroll/enterprise/calculate-payslip', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payroll Runs API (enhanced)
  async getPayrollRuns(params?: {
    search?: string;
    status?: string;
    templateId?: string;
    periodStart?: string;
    periodEnd?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/payroll/runs${query ? `?${query}` : ''}`);
  }

  async getPayrollRunById(id: string) {
    return this.request(`/payroll/runs/${id}`);
  }

  async createPayrollRun(data: any) {
    return this.request('/payroll/runs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayrollRun(id: string, data: any) {
    return this.request(`/payroll/runs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePayrollRun(id: string) {
    return this.request(`/payroll/runs/${id}`, {
      method: 'DELETE',
    });
  }

  async lockPayrollRun(id: string) {
    return this.request(`/payroll/runs/${id}/lock`, {
      method: 'POST',
    });
  }

  async recalculatePayrollRun(id: string) {
    return this.request(`/payroll/runs/${id}/recalculate`, {
      method: 'POST',
    });
  }

  async previewPayrollRun(data: {
    templateId: string;
    periodStart: string;
    periodEnd: string;
    employeeIds?: string[];
  }) {
    return this.request('/payroll/runs/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportPayrollRun(id: string, format: 'pdf' | 'csv' = 'pdf') {
    try {
      const response = await fetch(`${this.baseUrl}/payroll/runs/${id}/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token || localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(error.error?.message || error.message || 'Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-run-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      // Handle network errors (backend not running, CORS, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please ensure the backend server is running.');
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Payroll Dashboard Stats
  async getPayrollStats() {
    return this.request('/payroll/stats');
  }

  // Generate and download individual employee payslip
  async downloadEmployeePayslip(runId: string, employeeId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/payroll/runs/${runId}/employees/${employeeId}/payslip`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to generate payslip' }));
        throw new Error(error.error?.message || error.message || 'Failed to generate payslip');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `payslip-${employeeId}-${runId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      // Handle network errors (backend not running, CORS, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please ensure the backend server is running.');
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Payslip Calculator
  async calculatePayslip(data: any) {
    return this.request('/payroll/calculate-payslip', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async calculatePayslipFromJSON(jsonInput: string) {
    return this.request('/payroll/calculate-payslip-from-json', {
      method: 'POST',
      body: JSON.stringify({ json_input: jsonInput }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

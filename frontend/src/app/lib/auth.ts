import { api } from './api';

// Auto-login with default admin credentials on app initialization
export async function initializeAuth() {
  if (typeof window === 'undefined') return;
  
  const token = localStorage.getItem('auth_token');
  if (token) {
    api.setToken(token);
    return;
  }

  // Try to auto-login with default credentials
  try {
    const defaultEmail = 'sathsarasoysa2089@gmail.com';
    const defaultPassword = 'Sath@Admin';
    
    const response = await api.login(defaultEmail, defaultPassword);
    if (response && response.token) {
      console.log('Auto-login successful');
      return response;
    }
  } catch (error) {
    console.error('Auto-login failed:', error);
    // Don't throw - let the user login manually if needed
  }
}

// Manual login function
export async function login(email: string, password: string) {
  try {
    const response = await api.login(email, password);
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
}

// Logout function
export function logout() {
  api.logout();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}

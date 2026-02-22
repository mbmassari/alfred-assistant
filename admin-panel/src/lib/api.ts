const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('alfred_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('alfred_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Health
export const getHealth = () => apiFetch<{ status: string; gateway: string; nanobot: string }>('/health');

// Auth
export const verifyAuth = () =>
  fetch(`${GATEWAY_URL}/auth/verify`).then((r) => r.json());

// Secrets
export interface Secret {
  name: string;
  display_name: string;
  category: string;
  scope: string;
  env_var: string;
  is_configured: boolean;
  masked_value: string | null;
  updated_at: string | null;
}

export const getSecrets = (category?: string) =>
  apiFetch<{ secrets: Secret[] }>(`/api/v1/secrets${category ? `?category=${category}` : ''}`);

export const updateSecret = (name: string, data: { value?: string; display_name?: string; scope?: string }) =>
  apiFetch(`/api/v1/secrets/${name}`, { method: 'PUT', body: JSON.stringify(data) });

export const createSecret = (data: {
  name: string;
  display_name: string;
  category: string;
  scope: string;
  env_var: string;
  value: string;
}) => apiFetch('/api/v1/secrets', { method: 'POST', body: JSON.stringify(data) });

export const deleteSecret = (name: string) =>
  apiFetch(`/api/v1/secrets/${name}`, { method: 'DELETE' });

export const testSecret = (name: string) =>
  apiFetch<{ name: string; is_configured: boolean; has_value: boolean }>(`/api/v1/secrets/${name}/test`, {
    method: 'POST',
  });

// Agent
export const sendMessage = (message: string, context?: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/api/v1/agent/message', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });

export const getAgentStatus = () =>
  apiFetch<{ status: string; nanobot_url: string }>('/api/v1/agent/status');

// Audit
export interface AuditEntry {
  id: number;
  timestamp: string;
  action: string;
  detail: string | null;
  ip_address: string | null;
}

export const getAuditLogs = (params?: { action?: string; since?: string; limit?: number; offset?: number }) => {
  const query = new URLSearchParams();
  if (params?.action) query.set('action', params.action);
  if (params?.since) query.set('since', params.since);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiFetch<{ logs: AuditEntry[]; count: number }>(`/api/v1/audit${qs ? `?${qs}` : ''}`);
};

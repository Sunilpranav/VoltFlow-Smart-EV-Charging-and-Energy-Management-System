import type {
  AuthResponse,
  CustomerDashboard,
  Station,
  StationSummary,
  Charger,
  User,
  Vehicle,
  VehicleRequest,
  ChargingSession,
  SessionSummary,
  StartSessionRequest,
  Wallet,
  WalletTransaction,
  PaymentIntent,
  PrepaidPlan,
  CustomerPlan,
  PaySessionResponse,
  AdminDashboard,
  Tariff,
  CreateTariffRequest,
  UpdateTariffRequest,
  MaintenanceRecord,
  CreateMaintenanceRequest,
  UpdateMaintenanceRequest,
  CreateStationRequest,
  UpdateStationRequest,
  CreateChargerRequest,
  UpdateChargerRequest,
  CreatePlanRequest,
  UpdatePlanRequest,
  AdminRefundRequest,
  AdminAuditLog,
  PageResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('voltflow_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    if (response.status === 401 && token) {
      localStorage.removeItem('voltflow_token');
      localStorage.removeItem('voltflow_user');
      window.dispatchEvent(new CustomEvent('voltflow:unauthorized'));
    }
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

// ── Auth APIs ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials: { email: string; password: string }): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: { fullName: string; email: string; password: string; phone?: string }): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: (): Promise<User> => request<User>('/auth/me'),
};

// ── Vehicle APIs ─────────────────────────────────────────────────────────────
export const vehicleApi = {
  list: (): Promise<Vehicle[]> => request<Vehicle[]>('/vehicles'),

  getById: (id: number): Promise<Vehicle> => request<Vehicle>(`/vehicles/${id}`),

  create: (data: VehicleRequest): Promise<Vehicle> =>
    request<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: VehicleRequest): Promise<Vehicle> =>
    request<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<void> =>
    request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    }),
};

// ── Station & Charger Discovery APIs ─────────────────────────────────────────
export const stationApi = {
  list: (search?: string, status?: string): Promise<StationSummary[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<StationSummary[]>(`/stations${queryString}`);
  },

  getById: (id: number): Promise<Station> => request<Station>(`/stations/${id}`),

  getChargers: (stationId: number): Promise<Charger[]> =>
    request<Charger[]>(`/stations/${stationId}/chargers`),

  filterChargers: (params: { stationId?: number; connectorType?: string; status?: string }): Promise<Charger[]> => {
    const searchParams = new URLSearchParams();
    if (params.stationId) searchParams.append('stationId', params.stationId.toString());
    if (params.connectorType && params.connectorType !== 'ALL') {
      searchParams.append('connectorType', params.connectorType);
    }
    if (params.status && params.status !== 'ALL') {
      searchParams.append('status', params.status);
    }
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Charger[]>(`/chargers${queryString}`);
  },
};

// ── Customer Dashboard API ───────────────────────────────────────────────────
export const dashboardApi = {
  getDashboard: (): Promise<CustomerDashboard> =>
    request<CustomerDashboard>('/customer/dashboard'),
};

// ── Charging Session APIs ────────────────────────────────────────────────────
export const sessionApi = {
  start: (data: StartSessionRequest): Promise<ChargingSession> =>
    request<ChargingSession>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (status?: string): Promise<ChargingSession[]> => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<ChargingSession[]>(`/sessions${queryString}`);
  },

  getById: (id: number): Promise<ChargingSession> =>
    request<ChargingSession>(`/sessions/${id}`),

  stop: (id: number): Promise<ChargingSession> =>
    request<ChargingSession>(`/sessions/${id}/stop`, {
      method: 'POST',
    }),

  getSummary: (id: number): Promise<SessionSummary> =>
    request<SessionSummary>(`/sessions/${id}/summary`),

  pay: (id: number): Promise<PaySessionResponse> =>
    request<PaySessionResponse>(`/sessions/${id}/pay`, {
      method: 'POST',
    }),

};

// ── Wallet & Payment APIs ───────────────────────────────────────────────────
export const walletApi = {
  getWallet: (): Promise<Wallet> => request<Wallet>('/wallet'),

  getTransactions: (): Promise<WalletTransaction[]> =>
    request<WalletTransaction[]>('/wallet/transactions'),

  createTopUpIntent: (amount: number, idempotencyKey?: string, description?: string): Promise<PaymentIntent> =>
    request<PaymentIntent>('/wallet/topup/intent', {
      method: 'POST',
      body: JSON.stringify({ amount, idempotencyKey, description }),
    }),

  confirmTopUp: (intentId: string, action: 'SUCCEED' | 'FAIL' | 'CANCEL' = 'SUCCEED'): Promise<PaymentIntent> =>
    request<PaymentIntent>('/wallet/topup/confirm', {
      method: 'POST',
      body: JSON.stringify({ intentId, action }),
    }),
};

// ── Prepaid Energy Plans APIs ───────────────────────────────────────────────
export const planApi = {
  getPlans: (): Promise<PrepaidPlan[]> => request<PrepaidPlan[]>('/plans'),

  getMyPlans: (): Promise<CustomerPlan[]> => request<CustomerPlan[]>('/plans/my-plans'),

  purchasePlan: (planId: number, idempotencyKey?: string): Promise<CustomerPlan> =>
    request<CustomerPlan>(`/plans/${planId}/purchase`, {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey }),
    }),
};

// ── Admin APIs ───────────────────────────────────────────────────────────────
export const adminApi = {
  // Dashboard Metrics
  getDashboard: (): Promise<AdminDashboard> =>
    request<AdminDashboard>('/admin/dashboard'),

  // Station Management
  getStations: (): Promise<Station[]> =>
    request<Station[]>('/admin/stations'),

  createStation: (data: CreateStationRequest): Promise<Station> =>
    request<Station>('/admin/stations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStation: (id: number, data: UpdateStationRequest): Promise<Station> =>
    request<Station>(`/admin/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivateStation: (id: number): Promise<void> =>
    request<void>(`/admin/stations/${id}`, {
      method: 'DELETE',
    }),

  // Charger Management
  createCharger: (data: CreateChargerRequest): Promise<Charger> =>
    request<Charger>('/admin/chargers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCharger: (id: number, data: UpdateChargerRequest): Promise<Charger> =>
    request<Charger>(`/admin/chargers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivateCharger: (id: number): Promise<void> =>
    request<void>(`/admin/chargers/${id}`, {
      method: 'DELETE',
    }),

  // Tariff Management
  getTariffs: (): Promise<Tariff[]> =>
    request<Tariff[]>('/admin/tariffs'),

  getTariff: (id: number): Promise<Tariff> =>
    request<Tariff>(`/admin/tariffs/${id}`),

  createTariff: (data: CreateTariffRequest): Promise<Tariff> =>
    request<Tariff>('/admin/tariffs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTariff: (id: number, data: UpdateTariffRequest): Promise<Tariff> =>
    request<Tariff>(`/admin/tariffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTariff: (id: number): Promise<void> =>
    request<void>(`/admin/tariffs/${id}`, {
      method: 'DELETE',
    }),

  // Prepaid Plan Management
  getPlans: (): Promise<PrepaidPlan[]> =>
    request<PrepaidPlan[]>('/admin/plans'),

  createPlan: (data: CreatePlanRequest): Promise<PrepaidPlan> =>
    request<PrepaidPlan>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePlan: (id: number, data: UpdatePlanRequest): Promise<PrepaidPlan> =>
    request<PrepaidPlan>(`/admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePlan: (id: number): Promise<void> =>
    request<void>(`/admin/plans/${id}`, {
      method: 'DELETE',
    }),

  // Maintenance Management
  getMaintenanceRecords: async (params?: {
    status?: string;
    chargerId?: number;
    severity?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<MaintenanceRecord>> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.chargerId) query.append('chargerId', params.chargerId.toString());
    if (params?.severity && params.severity !== 'ALL') query.append('severity', params.severity);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<PageResponse<MaintenanceRecord>>(`/admin/maintenance${qs}`);
  },

  createMaintenance: (data: CreateMaintenanceRequest): Promise<MaintenanceRecord> =>
    request<MaintenanceRecord>('/admin/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMaintenance: (id: number, data: UpdateMaintenanceRequest): Promise<MaintenanceRecord> =>
    request<MaintenanceRecord>(`/admin/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Sessions Monitoring
  getSessions: (params?: {
    status?: string;
    paymentStatus?: string;
    stationId?: number;
    start?: string;
    end?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ChargingSession>> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.paymentStatus && params.paymentStatus !== 'ALL') query.append('paymentStatus', params.paymentStatus);
    if (params?.stationId) query.append('stationId', params.stationId.toString());
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<PageResponse<ChargingSession>>(`/admin/sessions${qs}`);
  },

  refundSession: (sessionId: number, req?: AdminRefundRequest): Promise<PaySessionResponse> =>
    request<PaySessionResponse>(`/admin/sessions/${sessionId}/refund`, {
      method: 'POST',
      body: req ? JSON.stringify(req) : JSON.stringify({}),
    }),

  // Financial Ledger / Transactions
  getTransactions: (params?: {
    type?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<WalletTransaction>> => {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') query.append('type', params.type);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<PageResponse<WalletTransaction>>(`/admin/transactions${qs}`);
  },

  // Audit Logs
  getAuditLogs: (params?: {
    action?: string;
    entityType?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AdminAuditLog>> => {
    const query = new URLSearchParams();
    if (params?.action && params.action !== 'ALL') query.append('action', params.action);
    if (params?.entityType && params.entityType !== 'ALL') query.append('entityType', params.entityType);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<PageResponse<AdminAuditLog>>(`/admin/audit-logs${qs}`);
  },
};




export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  registrationNumber: string;
  batteryCapacityKwh: number;
  connectorType: string;
  modelYear?: number;
  ownerEmail?: string;
  createdAt?: string;
}

export interface VehicleRequest {
  make: string;
  model: string;
  registrationNumber: string;
  batteryCapacityKwh: number;
  connectorType: string;
  modelYear?: number;
}

export interface Charger {
  id: number;
  stationId?: number;
  chargerCode: string;
  connectorType: string;
  maxPowerKw: number;
  status: string;
  createdAt?: string;
}

export interface StationSummary {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  totalChargers: number;
  availableChargers: number;
}

export interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  totalChargers: number;
  availableChargers: number;
  chargers: Charger[];
  createdAt?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: string;
  createdAt: string;
}

export interface CustomerDashboard {
  profile: User;
  vehicleCount: number;
  vehicles: Vehicle[];
  availableStationCount: number;
  recommendedStations: StationSummary[];
  recentActivity: AuditLog[];
  totalEnergyConsumedKwh?: number;
  totalSpend?: number;
  activeSessionCount?: number;
  walletBalance?: number;
}

export type SessionStatus = 'PENDING' | 'CHARGING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface StartSessionRequest {
  vehicleId: number;
  chargerId: number;
}

export interface ChargingSession {
  id: number;
  customerId: number;
  customerEmail: string;
  customerName?: string;
  vehicleId: number;
  vehicleMakeModel?: string;
  vehiclePlate?: string;
  stationId: number;
  stationName: string;
  stationAddress?: string;
  chargerId: number;
  chargerCode: string;
  connectorType: string;
  maxPowerKw?: number;
  startTime: string;
  stopTime?: string;
  durationMinutes?: number;
  status: SessionStatus;
  startMeterKwh: number;
  finalMeterKwh?: number;
  energyConsumedKwh?: number;
  tariffRatePerKwh: number;
  totalCost?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionSummary {
  sessionId: number;
  status: SessionStatus;
  customerName: string;
  customerEmail: string;
  vehicleMakeModel: string;
  registrationNumber: string;
  stationName: string;
  stationAddress: string;
  chargerCode: string;
  connectorType: string;
  startTime: string;
  stopTime: string;
  durationFormatted: string;
  startMeterKwh: number;
  finalMeterKwh: number;
  energyConsumedKwh: number;
  tariffRatePerKwh: number;
  totalCost: number;
  paymentStatus: PaymentStatus;
  currency: string;
  calculationMethod: string;
  notes?: string;
}

export interface Wallet {
  walletId: number;
  userId: number;
  userEmail: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export type TransactionType = 'CREDIT' | 'DEBIT' | 'REFUND';

export interface WalletTransaction {
  id: number;
  walletId: number;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  currency: string;
  status: string;
  description: string;
  referenceId?: string;
  sessionId?: number;
  idempotencyKey: string;
  createdAt: string;
}

export interface PaymentIntent {
  intentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  paymentMethod: string;
  idempotencyKey: string;
  description?: string;
  confirmedAt?: string;
  createdAt: string;
  sandboxMode: boolean;
}

export interface PrepaidPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  creditAmount: number;
  energyAllowanceKwh?: number;
  validityDays: number;
  currency: string;
  active: boolean;
}

export interface CustomerPlan {
  id: number;
  planId: number;
  planName: string;
  planDescription?: string;
  purchasePrice: number;
  creditedAmount: number;
  remainingEnergyKwh?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  idempotencyKey: string;
  purchasedAt: string;
  expiresAt: string;
}

export interface PaySessionResponse {
  sessionId: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  remainingWalletBalance: number;
  transactionId?: number;
  idempotencyKey: string;
  paidAt: string;
}

// ── Admin Domain Types ───────────────────────────────────────────────────────

export interface AdminDashboard {
  status: string;
  customerCount: number;
  vehicleCount: number;
  stationCount: number;
  chargerCount: number;
  availableChargers: number;
  occupiedChargers: number;
  maintenanceChargers: number;
  activeSessions: number;
  completedSessions: number;
  totalEnergyKwh: number;
  paidRevenue: number;
  unpaidRevenue: number;
  successfulTopUpsCount: number;
  successfulTopUpsAmount: number;
  refundsCount: number;
  refundsAmount: number;
  planPurchasesCount: number;
  planPurchasesAmount: number;
}

export interface Tariff {
  id: number;
  name: string;
  ratePerKwh: number;
  connectorType?: string;
  currency: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTariffRequest {
  name: string;
  ratePerKwh: number;
  connectorType?: string;
  currency?: string;
  active?: boolean;
}

export interface UpdateTariffRequest {
  name?: string;
  ratePerKwh?: number;
  connectorType?: string;
  currency?: string;
  active?: boolean;
}

export type MaintenanceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceStatus = 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
export type MaintenanceCategory = 'HARDWARE' | 'SOFTWARE' | 'ELECTRICAL' | 'PHYSICAL_DAMAGE' | 'ROUTINE' | 'OTHER';

export interface MaintenanceRecord {
  id: number;
  chargerId: number;
  chargerCode: string;
  stationId: number;
  stationName: string;
  category: MaintenanceCategory | string;
  description: string;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  reportedBy?: string;
  assignedTechnician?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaintenanceRequest {
  chargerId: number;
  category: string;
  description: string;
  severity: MaintenanceSeverity;
  reportedBy?: string;
  assignedTechnician?: string;
}

export interface UpdateMaintenanceRequest {
  category?: string;
  description?: string;
  severity?: string;
  status: MaintenanceStatus;
  assignedTechnician?: string;
  resolutionNotes?: string;
}

export interface CreateStationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status?: string;
}

export interface UpdateStationRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

export interface CreateChargerRequest {
  stationId: number;
  chargerCode: string;
  connectorType: string;
  maxPowerKw: number;
  status?: string;
}

export interface UpdateChargerRequest {
  chargerCode?: string;
  connectorType?: string;
  maxPowerKw?: number;
  status?: string;
}

export interface CreatePlanRequest {
  name: string;
  description: string;
  price: number;
  creditAmount: number;
  energyAllowanceKwh?: number;
  validityDays: number;
  currency?: string;
  active?: boolean;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  price?: number;
  creditAmount?: number;
  energyAllowanceKwh?: number;
  validityDays?: number;
  currency?: string;
  active?: boolean;
}

export interface AdminRefundRequest {
  sessionId?: number;
  amount?: number;
  reason?: string;
}

export interface AdminAuditLog {
  id: number;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: string;
  actorEmail?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}




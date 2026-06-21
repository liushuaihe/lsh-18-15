export enum DeviceStatus {
  OFF = 'off',
  STANDBY = 'standby',
  ON = 'on',
  WARNING = 'warning',
  FAULT = 'fault',
  FUSED = 'fused',
  BLOCKED = 'blocked',
}

export type AlertLevel = 'warning' | 'critical' | 'fuse';
export type SensorAlertLevel = 'normal' | 'warning' | 'critical' | 'fuse';

export interface Device {
  id: string;
  name: string;
  group: string;
  isCore: boolean;
  status: DeviceStatus;
  dependencyIds: string[];
  tempSensorId: string;
  powerConsumption: number;
  lastStatusChange: number;
  faultCode?: string;
  blockReason?: string;
}

export interface TempSensor {
  id: string;
  deviceId: string;
  currentTemp: number;
  targetTemp: number;
  baseTemp: number;
  tempHistory: Array<{ t: number; v: number }>;
  baseWarningThreshold: number;
  baseCriticalThreshold: number;
  baseFuseThreshold: number;
  warningThreshold: number;
  criticalThreshold: number;
  fuseThreshold: number;
  alertLevel: SensorAlertLevel;
}

export interface Alert {
  id: string;
  timestamp: number;
  deviceId: string;
  sensorId: string;
  level: AlertLevel;
  message: string;
  temperature?: number;
  threshold?: number;
  acknowledged: boolean;
}

export interface ToggleResult {
  success: boolean;
  message?: string;
  blockedDependencies?: string[];
}

export interface TraceStep {
  deviceId: string;
  deviceName: string;
  status: DeviceStatus;
  reason?: string;
  level: number;
}

export interface TracePath {
  rootFaultId: string;
  rootFaultName: string;
  faultCode: string;
  steps: TraceStep[];
}

export interface ThresholdAdjustment {
  warningDelta: number;
  criticalDelta: number;
  fuseDelta: number;
  reason: string;
}

export const STATUS_COLORS: Record<DeviceStatus, { bg: string; border: string; glow: string; text: string; dot: string }> = {
  [DeviceStatus.OFF]: { bg: 'bg-slate-800/40', border: 'border-slate-600/50', glow: 'shadow-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-500' },
  [DeviceStatus.STANDBY]: { bg: 'bg-amber-900/20', border: 'border-amber-500/50', glow: 'shadow-amber-400/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  [DeviceStatus.ON]: { bg: 'bg-emerald-900/20', border: 'border-emerald-500/50', glow: 'shadow-emerald-400/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [DeviceStatus.WARNING]: { bg: 'bg-orange-900/30', border: 'border-orange-500/60', glow: 'shadow-orange-400/40', text: 'text-orange-400', dot: 'bg-orange-400' },
  [DeviceStatus.FAULT]: { bg: 'bg-rose-900/40', border: 'border-rose-500/70', glow: 'shadow-rose-500/50', text: 'text-rose-400', dot: 'bg-rose-500' },
  [DeviceStatus.FUSED]: { bg: 'bg-red-950/60', border: 'border-red-600/80', glow: 'shadow-red-600/60', text: 'text-red-400', dot: 'bg-red-600' },
  [DeviceStatus.BLOCKED]: { bg: 'bg-zinc-800/40', border: 'border-dashed border-zinc-500/50', glow: 'shadow-zinc-500/20', text: 'text-zinc-400', dot: 'bg-zinc-500' },
};

export const STATUS_LABELS: Record<DeviceStatus, string> = {
  [DeviceStatus.OFF]: '关机',
  [DeviceStatus.STANDBY]: '待机中',
  [DeviceStatus.ON]: '运行',
  [DeviceStatus.WARNING]: '温度警示',
  [DeviceStatus.FAULT]: '故障',
  [DeviceStatus.FUSED]: '熔断保护',
  [DeviceStatus.BLOCKED]: '依赖阻断',
};

export type TicketLevel = 'P0' | 'P1' | 'P2' | 'P3';
export type TicketStatus = 'pending' | 'assigned' | 'working' | 'verifying' | 'done' | 'rejected';
export type PersonnelStatus = 'idle' | 'busy' | 'away' | 'offline';

export interface Location {
  zone: string;
  x: number;
  y: number;
}

export interface Personnel {
  id: string;
  name: string;
  avatar: string;
  role: '高级工程师' | '工程师' | '技术员' | '实习生';
  skills: string[];
  status: PersonnelStatus;
  location: Location;
  contact: string;
  currentTicketIds: string[];
  completedToday: number;
  rating: number;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  deviceId: string;
  deviceName: string;
  deviceGroup: string;
  level: TicketLevel;
  status: TicketStatus;
  reporterId: string;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  verifierId?: string;
  faultCode?: string;
  slaMinutes: number;
  createdAt: number;
  assignedAt?: number;
  startedAt?: number;
  verifiedAt?: number;
  completedAt?: number;
  closedAt?: number;
  location: Location;
  priorityScore: number;
  logs: TicketLog[];
  rejectReason?: string;
}

export interface TicketLog {
  id: string;
  timestamp: number;
  action: string;
  operatorId: string;
  operatorName: string;
  remark?: string;
}

export interface DispatchStats {
  pending: number;
  assigned: number;
  working: number;
  verifying: number;
  done: number;
  rejected: number;
  slaBreached: number;
  avgResponseMin: number;
}

export const TICKET_LEVEL_CONFIG: Record<TicketLevel, { label: string; color: string; bg: string; border: string; glow: string; dot: string; sla: number; weight: number }> = {
  P0: { label: '特级紧急', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-500/70', glow: 'shadow-rose-500/50', dot: 'bg-rose-500', sla: 15, weight: 100 },
  P1: { label: '严重故障', color: 'text-orange-400', bg: 'bg-orange-950/50', border: 'border-orange-500/60', glow: 'shadow-orange-500/40', dot: 'bg-orange-500', sla: 30, weight: 60 },
  P2: { label: '一般维修', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/50', glow: 'shadow-amber-500/30', dot: 'bg-amber-500', sla: 120, weight: 25 },
  P3: { label: '日常维护', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/50', glow: 'shadow-cyan-500/30', dot: 'bg-cyan-500', sla: 480, weight: 10 },
};

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: '待派单', color: 'text-slate-400', bg: 'bg-slate-900/50', border: 'border-slate-600/60' },
  assigned: { label: '已派单', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/50' },
  working: { label: '处理中', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/50' },
  verifying: { label: '待验收', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/50' },
  done: { label: '已完成', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50' },
  rejected: { label: '已驳回', color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/50' },
};

export const PERSONNEL_STATUS_CONFIG: Record<PersonnelStatus, { label: string; color: string; dot: string; bg: string; border: string }> = {
  idle: { label: '空闲', color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50' },
  busy: { label: '忙碌', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50' },
  away: { label: '暂离', color: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/50' },
  offline: { label: '离线', color: 'text-slate-500', dot: 'bg-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-600/50' },
};

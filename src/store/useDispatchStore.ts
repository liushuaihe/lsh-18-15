import { create } from 'zustand';
import {
  Ticket,
  Personnel,
  TicketStatus,
  TicketLog,
  DispatchStats,
  Location,
  TICKET_LEVEL_CONFIG,
} from '../types';
import { MOCK_TICKETS, MOCK_PERSONNEL, syncPersonnelWithTickets } from '../data/mockData';

export interface CandidateScore {
  personnelId: string;
  personnelName: string;
  distance: number;
  skillMatch: number;
  loadFactor: number;
  ratingFactor: number;
  totalScore: number;
  reason: string;
}

interface DispatchStore {
  tickets: Ticket[];
  personnel: Personnel[];
  selectedTicketId: string | null;
  draggingTicketId: string | null;
  lastAutoAssignLog: { ticketId: string; assignedTo: string; reason: string; time: number } | null;
  autoAssignEnabled: boolean;

  selectTicket: (id: string | null) => void;
  setDragging: (id: string | null) => void;
  setAutoAssign: (v: boolean) => void;

  getTicket: (id: string) => Ticket | undefined;
  getPersonnel: (id: string) => Personnel | undefined;
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  getTicketsByAssignee: (assigneeId: string) => Ticket[];
  getStats: () => DispatchStats;
  getCandidatesFor: (ticketId: string, topN?: number) => CandidateScore[];

  computeDistance: (a: Location, b: Location) => number;
  autoDispatch: (ticketId: string) => { assigned: boolean; reason?: string } | null;
  autoDispatchCriticalPending: () => Array<{ ticketId: string; assignedTo: string; reason: string }>;

  assignTicket: (ticketId: string, assigneeId: string, byId: string, byName: string) => boolean;
  reassignTicket: (ticketId: string, newAssigneeId: string, byId: string, byName: string, remark?: string) => boolean;
  startWorking: (ticketId: string, byId: string, byName: string) => boolean;
  submitVerify: (ticketId: string, byId: string, byName: string, remark?: string) => boolean;
  acceptTicket: (ticketId: string, byId: string, byName: string) => boolean;
  rejectTicket: (ticketId: string, byId: string, byName: string, reason: string) => boolean;
  reopenRejected: (ticketId: string, byId: string, byName: string) => boolean;

  _appendLog: (ticketId: string, log: Omit<TicketLog, 'id' | 'timestamp'>) => void;
  _syncPersonnel: () => void;
  _refreshScores: () => void;
}

function uid() {
  return `L-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useDispatchStore = create<DispatchStore>((set, get) => ({
  tickets: [...MOCK_TICKETS].map(t => ({ ...t, logs: [...t.logs] })),
  personnel: syncPersonnelWithTickets(MOCK_PERSONNEL, MOCK_TICKETS),
  selectedTicketId: null,
  draggingTicketId: null,
  lastAutoAssignLog: null,
  autoAssignEnabled: true,

  selectTicket: (id) => set({ selectedTicketId: id }),
  setDragging: (id) => set({ draggingTicketId: id }),
  setAutoAssign: (v) => set({ autoAssignEnabled: v }),

  getTicket: (id) => get().tickets.find(t => t.id === id),
  getPersonnel: (id) => get().personnel.find(p => p.id === id),
  getTicketsByStatus: (status) => get().tickets.filter(t => t.status === status).sort((a, b) => b.priorityScore - a.priorityScore),
  getTicketsByAssignee: (assigneeId) =>
    get().tickets.filter(t => t.assigneeId === assigneeId),
  getStats: () => {
      const ts = get().tickets;
      const now = Date.now();
      const min = 60 * 1000;
      let slaBreached = 0;
      let totalResponse = 0;
      let responseCount = 0;
      for (const t of ts) {
        const elapsed = (now - t.createdAt) / min;
        if (t.status !== 'done' && t.status !== 'rejected') {
          if (elapsed > t.slaMinutes) slaBreached++;
        }
        if (t.assignedAt) {
          totalResponse += (t.assignedAt - t.createdAt) / min;
          responseCount++;
        }
      }
      return {
        pending: ts.filter(t => t.status === 'pending').length,
        assigned: ts.filter(t => t.status === 'assigned').length,
        working: ts.filter(t => t.status === 'working').length,
        verifying: ts.filter(t => t.status === 'verifying').length,
        done: ts.filter(t => t.status === 'done').length,
        rejected: ts.filter(t => t.status === 'rejected').length,
        slaBreached,
        avgResponseMin: responseCount ? totalResponse / responseCount : 0,
      };
    },

  computeDistance: (a, b) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

  getCandidatesFor: (ticketId, topN = 5) => {
      const ticket = get().getTicket(ticketId);
      if (!ticket) return [];
      const result: CandidateScore[] = [];
      for (const p of get().personnel) {
        if (p.status === 'offline') continue;
        const dist = get().computeDistance(ticket.location, p.location);
        const skillMatch = p.skills.some(s =>
          ticket.deviceGroup.includes(s) || s.includes(ticket.deviceGroup)
        ) ? 30 : p.skills.filter(s =>
          ticket.title.includes(s) || ticket.description.includes(s)
        ).length * 10;
        const load = p.currentTicketIds.length;
        const loadFactor =
          p.status === 'idle' ? 40 :
          load === 0 ? 30 :
          load === 1 ? 10 : 0;
        const ratingFactor = (p.rating - 4) * 10;
        const availFactor = p.status === 'away' ? -20 : 0;
        const distanceFactor = Math.max(0, 35 - dist * 0.5);
        const total =
          distanceFactor + skillMatch + loadFactor + ratingFactor + availFactor;
        const reasons: string[] = [];
        if (skillMatch >= 30) reasons.push('技能匹配');
        else if (skillMatch > 0) reasons.push('技能相关');
        if (p.status === 'idle') reasons.push('空闲中');
        else if (p.status === 'busy') reasons.push('忙碌中');
        else if (p.status === 'away') reasons.push('暂离');
        if (dist < 15) reasons.push(`距离近(${dist.toFixed(1)})`);
        if (p.rating >= 4.8) reasons.push('高评分');
        result.push({
          personnelId: p.id,
          personnelName: p.name,
          distance: dist,
          skillMatch,
          loadFactor,
          ratingFactor,
          totalScore: total,
          reason: reasons.join(' · ') || '综合评分',
        });
      }
      result.sort((a, b) => b.totalScore - a.totalScore);
      return topN ? result.slice(0, topN) : result;
    },

  autoDispatch: (ticketId) => {
      const ticket = get().getTicket(ticketId);
      if (!ticket || ticket.status !== 'pending') return null;
      const cands = get().getCandidatesFor(ticketId, 3);
      if (cands.length === 0) return { assigned: false, reason: '无可用维修人员' };
      const best = cands[0];
      const assigned = get().assignTicket(ticketId, best.personnelId, 'SYS-AUTO', '系统派工');
      if (!assigned) return { assigned: false, reason: '派单失败' };
      set({
        lastAutoAssignLog: {
          ticketId,
          assignedTo: best.personnelName,
          reason: best.reason,
          time: Date.now(),
        },
      });
      return { assigned: true, reason: best.reason };
    },

  autoDispatchCriticalPending: () => {
      const result: Array<{ ticketId: string; assignedTo: string; reason: string }> = [];
      if (!get().autoAssignEnabled) return result;
      const pending = get()
        .getTicketsByStatus('pending')
        .filter(t => t.level === 'P0' || t.level === 'P1');
      for (const t of pending) {
        const r = get().autoDispatch(t.id);
        if (r?.assigned) {
          const log = get().lastAutoAssignLog;
          if (log) {
            result.push({ ticketId: log.ticketId, assignedTo: log.assignedTo, reason: log.reason });
          }
        }
      }
      return result;
    },

  assignTicket: (ticketId, assigneeId, byId, byName) => {
      const s = get();
      const ticket = s.tickets.find(t => t.id === ticketId);
      const person = s.personnel.find(p => p.id === assigneeId);
      if (!ticket || !person) return false;
      if (ticket.status !== 'pending' && ticket.status !== 'rejected') return false;
      const now = Date.now();
      const newTicket: Ticket = {
        ...ticket,
        status: 'assigned',
        assigneeId,
        assigneeName: person.name,
        assignedAt: now,
        logs: [
          { id: uid(), timestamp: now, action: ticket.status === 'rejected' ? '返工派单' : '工单派单', operatorId: byId, operatorName: byName, remark: `派至 ${person.name}（${person.role}）` },
          ...ticket.logs,
        ],
      };
      set(prev => {
        const newTickets = prev.tickets.map(t => (t.id === ticketId ? newTicket : t));
        return {
          tickets: newTickets,
          personnel: syncPersonnelWithTickets(prev.personnel, newTickets),
        };
      });
      return true;
    },

  reassignTicket: (ticketId, newAssigneeId, byId, byName, remark) => {
      const s = get();
      const ticket = s.tickets.find(t => t.id === ticketId);
      const person = s.personnel.find(p => p.id === newAssigneeId);
      if (!ticket || !person) return false;
      if (ticket.status === 'done') return false;
      const now = Date.now();
      const newStatus: TicketStatus = ticket.status === 'rejected' ? 'assigned' : ticket.status === 'pending' ? 'assigned' : ticket.status;
      const newTicket: Ticket = {
        ...ticket,
        status: newStatus === 'working' || newStatus === 'verifying' ? newStatus : 'assigned',
        assigneeId: newAssigneeId,
        assigneeName: person.name,
        assignedAt: now,
        startedAt: ticket.status === 'working' || ticket.status === 'verifying' ? ticket.startedAt : undefined,
        logs: [
          { id: uid(), timestamp: now, action: '改派工单', operatorId: byId, operatorName: byName, remark: remark || `由 ${ticket.assigneeName || '待派'} 改派至 ${person.name}` },
          ...ticket.logs,
        ],
      };
      set(prev => {
        const newTickets = prev.tickets.map(t => (t.id === ticketId ? newTicket : t));
        return {
          tickets: newTickets,
          personnel: syncPersonnelWithTickets(prev.personnel, newTickets),
        };
      });
      return true;
    },

  startWorking: (ticketId, byId, byName) => {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket || ticket.status !== 'assigned') return false;
      const now = Date.now();
      const newTicket: Ticket = {
        ...ticket,
        status: 'working',
        startedAt: now,
        logs: [{ id: uid(), timestamp: now, action: '开始处理', operatorId: byId, operatorName: byName },
          ...ticket.logs,
        ],
      };
      set(prev => {
        const newTickets = prev.tickets.map(t => (t.id === ticketId ? newTicket : t));
        return {
          tickets: newTickets,
          personnel: syncPersonnelWithTickets(prev.personnel, newTickets),
        };
      });
      return true;
    },

  submitVerify: (ticketId, byId, byName, remark) => {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket || ticket.status !== 'working') return false;
      const now = Date.now();
      const newTicket: Ticket = {
        ...ticket,
        status: 'verifying',
        verifiedAt: now,
        logs: [{ id: uid(), timestamp: now, action: '提交验收', operatorId: byId, operatorName: byName, remark },
          ...ticket.logs,
        ],
      };
      set(prev => ({
        tickets: prev.tickets.map(t => (t.id === ticketId ? newTicket : t)),
      }));
      return true;
    },

  acceptTicket: (ticketId, byId, byName) => {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket || ticket.status !== 'verifying') return false;
      const now = Date.now();
      const newTicket: Ticket = {
        ...ticket,
        status: 'done',
        completedAt: now,
        closedAt: now,
        verifierId: byId,
        logs: [
          { id: uid(), timestamp: now, action: '验收通过', operatorId: byId, operatorName: byName },
          ...ticket.logs,
        ],
      };
      set(prev => {
        const newTickets = prev.tickets.map(t => (t.id === ticketId ? newTicket : t));
        return {
          tickets: newTickets,
          personnel: prev.personnel.map(p =>
            p.id === ticket.assigneeId
              ? { ...p, completedToday: p.completedToday + 1 }
              : p
          ),
        };
      });
      get()._syncPersonnel();
      return true;
    },

  rejectTicket: (ticketId, byId, byName, reason) => {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket || ticket.status !== 'verifying') return false;
      const now = Date.now();
      const newTicket: Ticket = {
        ...ticket,
        status: 'rejected',
        closedAt: now,
        verifierId: byId,
        rejectReason: reason,
        logs: [
          { id: uid(), timestamp: now, action: '验收驳回', operatorId: byId, operatorName: byName, remark: reason },
          ...ticket.logs,
        ],
      };
      set(prev => {
        const newTickets = prev.tickets.map(t => (t.id === ticketId ? newTicket : t));
        return {
          tickets: newTickets,
          personnel: syncPersonnelWithTickets(prev.personnel, newTickets),
        };
      });
      return true;
    },

  reopenRejected: (ticketId, byId, byName) => {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket || ticket.status !== 'rejected') return false;
      const now = Date.now();
      const newTicket: Ticket = {
        ...ticket,
        status: 'pending',
        rejectReason: undefined,
        closedAt: undefined,
        verifierId: undefined,
        logs: [
          { id: uid(), timestamp: now, action: '重新派单', operatorId: byId, operatorName: byName, remark: '驳返工单进入待派' },
          ...ticket.logs,
        ],
      };
      set(prev => {
        const newTickets = prev.tickets.map(t => (t.id === ticketId ? newTicket : t));
        return {
          tickets: newTickets,
          personnel: syncPersonnelWithTickets(prev.personnel, newTickets),
        };
      });
      return true;
    },

  _appendLog: (ticketId, log) => {
      set(prev => ({
        tickets: prev.tickets.map(t =>
          t.id === ticketId
            ? { ...t, logs: [{ id: uid(), timestamp: Date.now(), ...log }, ...t.logs] }
            : t
        ),
      }));
    },

  _syncPersonnel: () => {
      set(prev => ({
        personnel: syncPersonnelWithTickets(prev.personnel, prev.tickets),
      }));
    },

  _refreshScores: () => {
      const now = Date.now();
      const min = 60 * 1000;
      set(prev => ({
        tickets: prev.tickets.map(t => {
          if (t.status === 'done' || t.status === 'rejected') return t;
          const elapsed = now - t.createdAt;
          const weight = TICKET_LEVEL_CONFIG[t.level].weight;
          return { ...t, priorityScore: weight + Math.floor(elapsed / (5 * min)) };
        }),
      }));
    },
  }));

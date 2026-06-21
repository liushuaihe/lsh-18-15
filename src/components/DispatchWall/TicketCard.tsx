import React from 'react';
import {
  Ticket,
  TICKET_LEVEL_CONFIG,
  TICKET_STATUS_CONFIG,
  PERSONNEL_STATUS_CONFIG,
} from '@/types';
import {
  Clock, AlertTriangle, MapPin, User, Wrench, Gauge, CheckCircle2,
  XCircle, PlayCircle, ArrowRightLeft, Eye, Zap,
} from 'lucide-react';
import { useDispatchStore } from '@/store/useDispatchStore';

interface TicketCardProps {
  ticket: Ticket;
  compact?: boolean;
  showActions?: boolean;
  onDragStart?: (e: React.DragEvent, ticketId: string) => void;
  onDragEnd?: () => void;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  compact = false,
  showActions = true,
  onDragStart,
  onDragEnd,
}) => {
  const lvl = TICKET_LEVEL_CONFIG[ticket.level];
  const sta = TICKET_STATUS_CONFIG[ticket.status];
  const {
    startWorking, submitVerify, acceptTicket, rejectTicket,
    selectTicket, getPersonnel, autoDispatch, reopenRejected,
  } = useDispatchStore();

  const now = Date.now();
  const min = 60 * 1000;
  const elapsed = now - ticket.createdAt;
  const slaRemainMs = ticket.slaMinutes * min - elapsed;
  const slaBreached = slaRemainMs <= 0 && ticket.status !== 'done' && ticket.status !== 'rejected';
  const slaPercent = Math.max(0, Math.min(100, 100 - (elapsed / (ticket.slaMinutes * min)) * 100));
  const assignee = ticket.assigneeId ? getPersonnel(ticket.assigneeId) : undefined;
  const assigneeSt = assignee ? PERSONNEL_STATUS_CONFIG[assignee.status] : undefined;

  const isCritical = ticket.level === 'P0';

  const isDragging = useDispatchStore(s => s.draggingTicketId === ticket.id);
  const isSelected = useDispatchStore(s => s.selectedTicketId === ticket.id);

  const canStart = ticket.status === 'assigned';
  const canSubmit = ticket.status === 'working';
  const canAccept = ticket.status === 'verifying';
  const canReject = ticket.status === 'verifying';
  const canAuto = ticket.status === 'pending';
  const canReopen = ticket.status === 'rejected';

  const borderClass = `border ${lvl.border}`;
  const bgClass = `bg-gradient-to-br ${lvl.bg} ${sta.bg}`;
  const glowClass = ticket.status !== 'done' ? `shadow-lg ${lvl.glow}` : '';

  const pulseClass = isCritical && slaBreached ? 'animate-pulse' : '';

  const actionBtns = compact ? null : (
    showActions && (
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1 flex-wrap">
        {canAuto && (
          <button
            onClick={() => autoDispatch(ticket.id)}
            className="group flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition"
          >
            <Zap size={11} className="group-hover:animate-blink-led" />
            自动派
          </button>
        )}
        {canStart && (
          <button
            onClick={() => startWorking(ticket.id, ticket.assigneeId!, ticket.assigneeName!)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition"
          >
            <PlayCircle size={11} />
            开工
          </button>
        )}
        {canSubmit && (
          <button
            onClick={() => submitVerify(ticket.id, ticket.assigneeId!, ticket.assigneeName!, '处理完成，提交验收')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 transition"
          >
            <CheckCircle2 size={11} />
            提交验收
          </button>
        )}
        {canAccept && (
          <button
            onClick={() => acceptTicket(ticket.id, 'MGR-01', '维修主管')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 transition"
          >
            <CheckCircle2 size={11} />
            验收通过
          </button>
        )}
        {canReject && (
          <button
            onClick={() => {
              const r = window.prompt('请输入驳回原因：', '未按SOP完成，请返工');
              if (r) rejectTicket(ticket.id, 'MGR-01', '维修主管', r);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400 transition"
          >
            <XCircle size={11} />
            驳回
          </button>
        )}
        {canReopen && (
          <button
            onClick={() => reopenRejected(ticket.id, 'MGR-01', '维修主管')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400 transition"
          >
            <ArrowRightLeft size={11} />
            重新派单
          </button>
        )}
        <button
          onClick={() => selectTicket(ticket.id)}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border border-slate-600/50 bg-slate-800/40 text-slate-400 hover:bg-slate-700/40 hover:text-slate-300 transition"
        >
          <Eye size={11} />
          详情
        </button>
      </div>
    )
  );

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-ticket-id', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
        useDispatchStore.getState().setDragging(ticket.id);
        onDragStart?.(e, ticket.id);
      }}
      onDragEnd={() => {
        useDispatchStore.getState().setDragging(null);
        onDragEnd?.();
      }}
      onClick={() => selectTicket(isSelected ? null : ticket.id)}
      className={`
        relative group rounded-lg overflow-hidden cursor-grab active:cursor-grabbing
        ${bgClass} ${borderClass} ${glowClass}
        ${isDragging ? 'opacity-40 scale-95 rotate-[-1deg]' : ''}
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-cyber-bg ring-cyber-cyan/80 shadow-neon-cyan' : ''}
        ${pulseClass}
        transition-all duration-200 hover:-translate-y-0.5
      `}
    >
      <div
        className={`
          absolute top-0 left-0 right-0 h-[2px]
          ${isCritical && slaBreached ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-border-flow bg-[length:200%_100%]' : lvl.dot}
        `}
      />
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-start gap-2">
          <div
            className={`
              flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center font-orbitron text-[11px] font-bold
              border ${lvl.border} bg-black/30 ${lvl.color}
              ${isCritical ? 'animate-blink-led shadow-neon-red' : ''}
            `}
          >
            {ticket.level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className={`font-mono text-[9px] tracking-wider ${lvl.color}`}>
                {ticket.code}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${sta.border} ${sta.bg} ${sta.color}`}>
                {sta.label}
              </span>
            </div>
            <div
              className={`
                mt-0.5 text-[12px] font-semibold leading-snug text-slate-100
                line-clamp-2 group-hover:line-clamp-none transition
              `}
            >
              {isCritical && <AlertTriangle size={11} className="inline mr-0.5 -mt-0.5 text-rose-400" />}
              {ticket.title}
            </div>
          </div>
        </div>

        {!compact && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1" title="设备">
              <Wrench size={10} className="text-cyan-400/70" />
              <span className="text-slate-300">{ticket.deviceName}</span>
              <span className="text-slate-500 text-[9px]">[{ticket.deviceGroup}]</span>
            </span>
            {ticket.faultCode && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400/90">
                {ticket.faultCode}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1" title="位置">
            <MapPin size={10} className="text-cyan-400/70" />
            {ticket.location.zone}
          </span>
          <span className="flex items-center gap-1" title="SLA">
            <Clock size={10} className={slaBreached ? 'text-rose-400' : 'text-amber-400/70'} />
            <span className={slaBreached ? 'text-rose-400 font-bold animate-blink-led' : 'text-slate-300'}>
              {slaBreached ? `超时 ${formatDuration(-slaRemainMs)}` : `剩 ${formatDuration(slaRemainMs)}`}
            </span>
            <span className="text-slate-500 text-[9px]">/ {ticket.slaMinutes}m</span>
          </span>
          <span className="flex items-center gap-1 ml-auto" title="已耗时">
            <Gauge size={10} className="text-slate-500" />
            {formatDuration(elapsed)}
          </span>
        </div>

        {!compact && (
          <div className="relative h-1 rounded-full bg-slate-800/70 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${slaBreached ? 'bg-gradient-to-r from-rose-500 to-rose-400' : slaPercent < 30 ? 'bg-gradient-to-r from-orange-500 to-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}`}
              style={{ width: `${100 - slaPercent}%` }}
            />
          </div>
        )}

        {assignee && (compact ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-white/5">
            <div className={`w-3 h-3 rounded-full ${assigneeSt?.dot}`} />
            <span className="text-slate-300">{assignee.name}</span>
          </div>
        ) : (
          <div className="mt-1 pt-1.5 border-t border-white/5 flex items-center gap-2">
            <div className="relative">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-orbitron
                  bg-gradient-to-br from-cyber-card to-cyber-panel
                  border ${assigneeSt?.border || 'border-slate-600'}
                  ${assigneeSt?.color || 'text-slate-400'}
                `}
              >
                {assignee.avatar}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-cyber-panel ${assigneeSt?.dot} ${assignee.status === 'idle' ? 'animate-pulse-led' : ''}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[11px] font-semibold leading-tight ${assigneeSt?.color}`}>
                {assignee.name}
                <span className="ml-1 text-[9px] font-mono text-slate-500">{assignee.role}</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                <User size={9} />
                当前 {assignee.currentTicketIds.length} 单 · 今日 {assignee.completedToday} 单 · {assignee.rating}★
              </div>
            </div>
          </div>
        ))}

        {!compact && ticket.rejectReason && (
          <div className="mt-2 p-2 rounded border border-rose-500/40 bg-rose-500/10">
            <div className="flex items-center gap-1 text-[10px] font-mono text-rose-400 mb-0.5">
              <XCircle size={10} /> 驳回原因
            </div>
            <div className="text-[10px] text-rose-300/90 leading-snug">{ticket.rejectReason}</div>
          </div>
        )}

        {actionBtns}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Personnel, PERSONNEL_STATUS_CONFIG, Ticket } from '@/types';
import {
  MapPin, Star, Phone, Award, Users, Workflow, MoveRight,
  TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';
import { TicketCard } from './TicketCard';
import { useDispatchStore } from '@/store/useDispatchStore';

interface PersonnelColumnProps {
  personnel: Personnel;
  tickets: Ticket[];
}

export const PersonnelColumn: React.FC<PersonnelColumnProps> = ({ personnel, tickets }) => {
  const st = PERSONNEL_STATUS_CONFIG[personnel.status];
  const { reassignTicket, getCandidatesFor, draggingTicketId, getTicket } = useDispatchStore();
  const [isOver, setIsOver] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const activeTickets = tickets.filter(t => t.status !== 'done' && t.status !== 'rejected');
  const finishedTickets = tickets.filter(t => t.status === 'done');
  const activeCount = activeTickets.length;
  const loadPercent = Math.min(100, (activeCount / 3) * 100);
  const loadColor = activeCount >= 3 ? 'from-rose-500 to-orange-400' : activeCount >= 2 ? 'from-amber-500 to-yellow-400' : 'from-emerald-500 to-cyan-400';

  const dragTicket = draggingTicketId ? getTicket(draggingTicketId) : null;
  const candidates = dragTicket ? getCandidatesFor(dragTicket.id, 10) : [];
  const thisRank = candidates.findIndex(c => c.personnelId === personnel.id) + 1;
  const isBest = thisRank === 1;
  const isRecommended = thisRank > 0 && thisRank <= 3;

  const canAcceptDrop = useMemo(() => {
    if (!dragTicket) return false;
    if (personnel.status === 'offline') return false;
    if (dragTicket.assigneeId === personnel.id) return false;
    return true;
  }, [dragTicket, personnel]);

  const borderClass = useMemo(() => {
    if (isOver && canAcceptDrop) return 'border-cyber-cyan bg-cyber-cyan/5 shadow-neon-cyan';
    if (isBest && dragTicket) return 'border-emerald-500/60 bg-emerald-500/5';
    if (isRecommended && dragTicket) return 'border-cyan-500/40 bg-cyan-500/5';
    return 'border-cyber-line bg-cyber-card/40';
  }, [isOver, canAcceptDrop, isBest, isRecommended, dragTicket]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const ticketId = e.dataTransfer.getData('application/x-ticket-id');
    if (!ticketId || !canAcceptDrop) return;
    const ticket = getTicket(ticketId);
    if (!ticket) return;
    if (ticket.status === 'pending' || ticket.status === 'rejected') {
      useDispatchStore.getState().assignTicket(ticketId, personnel.id, 'MGR-01', '维修主管');
    } else {
      reassignTicket(ticketId, personnel.id, 'MGR-01', '维修主管');
    }
  };

  return (
    <div
      onDragOver={(e) => { if (canAcceptDrop) { e.preventDefault(); setIsOver(true); } }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={`
        relative flex-shrink-0 w-[260px] h-full flex flex-col rounded-xl overflow-hidden
        border transition-all duration-300
        ${borderClass}
        ${isOver && canAcceptDrop ? 'scale-[1.01]' : ''}
      `}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${loadColor}`} />
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-20" />

      {(isBest || isRecommended) && dragTicket && (
        <div className={`
          absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono
          ${isBest ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 animate-pulse-led' : 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'}
        `}>
          <Award size={10} />
          {isBest ? '最佳人选' : `推荐 #${thisRank}`}
        </div>
      )}

      <div className="relative flex-shrink-0 p-3 border-b border-white/5 bg-gradient-to-b from-cyber-panel/80 to-transparent">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div
              className={`
                w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold font-orbitron
                bg-gradient-to-br from-cyber-card to-cyber-panel
                border-2 ${st.border?.replace('/50', '/70').replace('/60', '/70') || 'border-slate-600'}
                ${st.color} shadow-md
              `}
            >
              {personnel.avatar}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-cyber-panel ${st.dot} ${personnel.status === 'idle' ? 'animate-pulse-led shadow-[0_0_6px_rgba(0,255,136,0.8)]' : ''}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <div className={`font-semibold text-[13px] leading-tight ${st.color}`}>
                {personnel.name}
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${st.bg} border ${st.border || 'border-slate-600'} ${st.color}`}>
                {st.label}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">{personnel.role}</div>
            <div className="flex items-center gap-1 mt-1">
              <Star size={9} className="text-amber-400" />
              <span className="text-[10px] font-mono text-amber-300/90">{personnel.rating}★</span>
              <span className="mx-1 text-slate-600">|</span>
              <TrendingUp size={9} className="text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400/90">今日 {personnel.completedToday}</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1 min-w-0 flex-1">
            <MapPin size={9} className="text-cyan-400/70 flex-shrink-0" />
            <span className="truncate">{personnel.location.zone}</span>
          </span>
          <span className="flex items-center gap-1">
            <Phone size={9} className="text-slate-500" />
            {personnel.contact.split(' ')[1]}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {personnel.skills.slice(0, 3).map(sk => (
            <span key={sk} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400/90">
              {sk}
            </span>
          ))}
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 relative h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${loadColor} transition-all duration-500`}
              style={{ width: `${loadPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
            {activeCount}/3
          </span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1 text-center">
          <div className="px-1 py-1 rounded bg-slate-900/40 border border-slate-700/40">
            <Users size={11} className="mx-auto mb-0.5 text-cyan-400" />
            <div className="text-[10px] font-orbitron font-bold text-cyan-300">{activeTickets.length}</div>
            <div className="text-[8px] font-mono text-slate-500">进行中</div>
          </div>
          <div className="px-1 py-1 rounded bg-slate-900/40 border border-slate-700/40">
            <Award size={11} className="mx-auto mb-0.5 text-emerald-400" />
            <div className="text-[10px] font-orbitron font-bold text-emerald-300">{finishedTickets.length}</div>
            <div className="text-[8px] font-mono text-slate-500">已完成</div>
          </div>
          <div className="px-1 py-1 rounded bg-slate-900/40 border border-slate-700/40">
            <Workflow size={11} className="mx-auto mb-0.5 text-amber-400" />
            <div className="text-[10px] font-orbitron font-bold text-amber-300">{tickets.length}</div>
            <div className="text-[8px] font-mono text-slate-500">总派单</div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-black/20 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <MoveRight size={10} />
          <span>任务列表</span>
          <span className="px-1 rounded bg-cyber-cyan/10 text-cyber-cyan">{activeTickets.length}</span>
        </div>
        {expanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 transition-all ${expanded ? '' : 'hidden'}`}>
        {activeTickets.length === 0 ? (
          <div className={`
            h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center
            ${isOver && canAcceptDrop ? 'border-cyber-cyan/60 bg-cyber-cyan/10 text-cyber-cyan' : 'border-slate-700/50 text-slate-500'}
            transition-all
          `}>
            <MoveRight size={16} className="mb-1 opacity-50" />
            <div className="text-[10px] font-mono">拖拽工单到此处</div>
            <div className="text-[9px] font-mono opacity-60 mt-0.5">派工 / 改派</div>
          </div>
        ) : (
          activeTickets.map(t => (
            <TicketCard key={t.id} ticket={t} compact />
          ))
        )}

        {finishedTickets.length > 0 && (
          <>
            <div className="mt-3 pt-2 border-t border-dashed border-slate-700/50 flex items-center gap-1.5 text-[10px] font-mono text-emerald-500/80">
              <Award size={10} /> 今日已完成 <span className="font-bold">{finishedTickets.length}</span> 单
            </div>
            {finishedTickets.slice(0, 2).map(t => (
              <TicketCard key={t.id} ticket={t} compact showActions={false} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

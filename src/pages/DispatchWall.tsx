import React, { useEffect, useState } from 'react';
import { useDispatchStore, CandidateScore } from '@/store/useDispatchStore';
import { TicketCard } from '@/components/DispatchWall/TicketCard';
import { PersonnelColumn } from '@/components/DispatchWall/PersonnelColumn';
import {
  TICKET_LEVEL_CONFIG,
  TICKET_STATUS_CONFIG,
  TicketLevel,
  TicketStatus,
} from '@/types';
import {
  ShieldCheck, ShieldAlert, Activity, Clock, AlertTriangle,
  Users, CheckCircle2, PlayCircle, XCircle, Search, Filter,
  Zap, PanelLeftClose, ArrowRightLeft, Trophy,
  Award, X, ChevronRight, History, FileText, ThermometerSun,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function DispatchWall() {
  const {
    personnel, selectedTicketId,
    selectTicket, getTicket, getCandidatesFor,
    getTicketsByStatus, getTicketsByAssignee, getStats,
    autoDispatchCriticalPending, autoAssignEnabled, setAutoAssign,
    lastAutoAssignLog, reassignTicket, _refreshScores,
    assignTicket, reopenRejected, autoDispatch,
  } = useDispatchStore();

  const stats = getStats();
  const pending = getTicketsByStatus('pending');
  const verifying = getTicketsByStatus('verifying');
  const rejected = getTicketsByStatus('rejected');

  const [levelFilter, setLevelFilter] = useState<TicketLevel | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      _refreshScores();
      forceTick(x => x + 1);
    }, 15000);
    return () => clearInterval(t);
  }, [_refreshScores]);

  useEffect(() => {
    if (autoAssignEnabled) {
      const results = autoDispatchCriticalPending();
      if (results.length > 0) {
        console.log('[AUTO-DISPATCH]', results);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sel = selectedTicketId ? getTicket(selectedTicketId) : undefined;
  const candidates: CandidateScore[] = sel ? getCandidatesFor(sel.id, 8) : [];

  const filteredPending = pending.filter(t => {
    if (levelFilter !== 'ALL' && t.level !== levelFilter) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      if (!t.title.toLowerCase().includes(s) &&
          !t.code.toLowerCase().includes(s) &&
          !t.deviceName.toLowerCase().includes(s) &&
          !t.location.zone.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const levelColors: Record<TicketLevel, string> = {
    P0: 'bg-rose-500 border-rose-500/60',
    P1: 'bg-orange-500 border-orange-500/60',
    P2: 'bg-amber-500 border-amber-500/60',
    P3: 'bg-cyan-500 border-cyan-500/60',
  };

  const statusList: { key: TicketStatus | 'all'; label: string }[] = [
    { key: 'pending', label: '待派' },
    { key: 'assigned', label: '已派' },
    { key: 'working', label: '处理中' },
    { key: 'verifying', label: '待验收' },
    { key: 'done', label: '已完成' },
    { key: 'rejected', label: '驳回' },
  ];

  return (
    <div className="w-screen h-screen flex flex-col bg-cyber-bg overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none cyber-grid opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-noise" />

      <DispatchHeader
        stats={stats}
        autoAssignEnabled={autoAssignEnabled}
        setAutoAssign={setAutoAssign}
        lastLog={lastAutoAssignLog}
      />

      <div className="flex-1 min-h-0 flex overflow-hidden relative z-10">
        <div className="w-[360px] xl:w-[400px] flex-shrink-0 h-full flex flex-col border-r border-cyber-line/70 bg-gradient-to-b from-cyber-panel/80 to-cyber-bg/80">
          <div className="flex-shrink-0 p-3 border-b border-white/5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/15 border border-cyan-500/40">
                  <Activity size={16} className="text-cyan-400" />
                </div>
                <div>
                  <div className="font-orbitron text-sm text-cyber-cyan tracking-wider neon-text-cyan">
                    待派工单池
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    PENDING QUEUE · {filteredPending.length} 项
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const r = autoDispatchCriticalPending();
                  if (r.length === 0) {
                    alert('暂无可自动派单的严重故障工单');
                  }
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/50 text-cyan-300 hover:from-cyan-500/30 hover:to-emerald-500/20 transition shadow-neon-cyan"
              >
                <Zap size={14} className="group-hover:animate-blink-led" />
                <span className="text-[11px] font-mono font-semibold">一键自动派单</span>
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="搜索工单编号 / 标题 / 设备 / 位置..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-cyber-card/80 border border-cyber-line/70 text-[11px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyber-cyan/60 focus:shadow-neon-cyan transition"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={12} className="text-slate-500" />
              {(['ALL', 'P0', 'P1', 'P2', 'P3'] as const).map(lv => {
                const isAll = lv === 'ALL';
                return (
                  <button
                    key={lv}
                    onClick={() => setLevelFilter(lv)}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition
                      ${levelFilter === lv
                        ? isAll
                          ? 'bg-cyber-cyan/20 border border-cyber-cyan/60 text-cyber-cyan'
                          : `${TICKET_LEVEL_CONFIG[lv as TicketLevel].bg} ${TICKET_LEVEL_CONFIG[lv as TicketLevel].border} border ${TICKET_LEVEL_CONFIG[lv as TicketLevel].color}`
                        : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:bg-slate-700/40'
                      }
                    `}
                  >
                    {!isAll && <span className={`w-1.5 h-1.5 rounded-full ${levelColors[lv as TicketLevel]}`} />}
                    {isAll ? '全部' : `${lv} ${TICKET_LEVEL_CONFIG[lv as TicketLevel].label}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-2.5">
            {filteredPending.length === 0 ? (
              <div className="h-48 rounded-xl border-2 border-dashed border-slate-700/50 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={28} className="text-emerald-500/70 mb-2" />
                <div className="text-[12px] font-mono text-emerald-400">暂无待派工单</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">等待新报修进入...</div>
              </div>
            ) : (
              filteredPending.map(t => (
                <TicketCard key={t.id} ticket={t} />
              ))
            )}

            {(verifying.length > 0 || rejected.length > 0) && (
              <div className="mt-4 pt-3 border-t border-dashed border-slate-700/50 space-y-2.5">
                {verifying.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1 h-4 rounded bg-purple-500 animate-pulse" />
                      <span className="text-[11px] font-mono text-purple-400">待验收工单</span>
                      <span className="px-1.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">{verifying.length}</span>
                    </div>
                    {verifying.map(t => (
                      <TicketCard key={t.id} ticket={t} />
                    ))}
                  </>
                )}
                {rejected.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-1 mt-2">
                      <div className="w-1 h-4 rounded bg-rose-500" />
                      <span className="text-[11px] font-mono text-rose-400">驳返工单</span>
                      <span className="px-1.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono">{rejected.length}</span>
                    </div>
                    {rejected.map(t => (
                      <TicketCard key={t.id} ticket={t} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 h-full flex flex-col bg-gradient-to-b from-cyber-bg/50 to-cyber-bg/80">
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-cyber-line/50 bg-cyber-panel/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyber-card/50 border border-cyber-line/60">
                <Users size={12} className="text-cyan-400" />
                <span className="text-[10px] font-mono text-slate-400">维修人员</span>
                <span className="text-[11px] font-orbitron font-bold text-cyan-300">{personnel.length}</span>
              </div>
              {statusList.map(s => {
                const cfg = s.key === 'all' ? null : TICKET_STATUS_CONFIG[s.key];
                const cnt = s.key === 'pending' ? stats.pending :
                  s.key === 'assigned' ? stats.assigned :
                  s.key === 'working' ? stats.working :
                  s.key === 'verifying' ? stats.verifying :
                  s.key === 'done' ? stats.done :
                  s.key === 'rejected' ? stats.rejected : 0;
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${cfg?.bg || 'bg-cyber-card/50'} ${cfg?.border || 'border-cyber-line/60'}`}
                  >
                    <span className={`text-[10px] font-mono ${cfg?.color || 'text-slate-400'}`}>{s.label}</span>
                    <span className={`text-[11px] font-orbitron font-bold ${cfg?.color || 'text-cyber-cyan'}`}>{cnt}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span>💡 拖拽工单卡片 → 人员列 = 派工/改派</span>
              <span className="text-cyber-line/80">|</span>
              <span className="text-emerald-400/80">✨ 绿色边框 = 最佳匹配人选</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden p-4">
            <div className="h-full flex items-start gap-3">
              {personnel.map(p => (
                <PersonnelColumn
                  key={p.id}
                  personnel={p}
                  tickets={getTicketsByAssignee(p.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {sel && <TicketDetailPanel
          ticket={sel}
          candidates={candidates}
          onClose={() => selectTicket(null)}
          onAssign={(pid) => {
            if (sel.status === 'rejected') {
              reopenRejected(sel.id, 'MGR-01', '维修主管');
              setTimeout(() => assignTicket(sel.id, pid, 'MGR-01', '维修主管'), 50);
            } else if (sel.status === 'pending') {
              assignTicket(sel.id, pid, 'MGR-01', '维修主管');
            } else {
              reassignTicket(sel.id, pid, 'MGR-01', '维修主管');
            }
          }}
          onAuto={() => autoDispatch(sel.id)}
        />}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent pointer-events-none" />
    </div>
  );
}

function DispatchHeader({
  stats, autoAssignEnabled, setAutoAssign, lastLog,
}: {
  stats: ReturnType<typeof useDispatchStore.getState>['getStats'] extends () => infer R ? R : never;
  autoAssignEnabled: boolean;
  setAutoAssign: (v: boolean) => void;
  lastLog: { ticketId: string; assignedTo: string; reason: string; time: number } | null;
}) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hh = pad(time.getHours());
  const mm = pad(time.getMinutes());
  const ss = pad(time.getSeconds());
  const yy = time.getFullYear();
  const mo = pad(time.getMonth() + 1);
  const dd = pad(time.getDate());

  return (
    <div className="relative w-full h-16 flex-shrink-0 flex items-center px-4 gap-3 border-b border-cyber-line bg-gradient-to-r from-cyber-panel via-cyber-card to-cyber-panel">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-cyber-cyan transition">
          <PanelLeftClose size={16} />
        </Link>
        <div className="relative">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border-2 border-cyan-500/60 shadow-neon-cyan">
            <ShieldAlert size={20} className="text-cyber-cyan" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-cyber-panel animate-pulse-led shadow-[0_0_8px_rgba(0,255,136,0.8)]" />
        </div>
        <div>
          <div className="font-orbitron text-base tracking-[0.25em] text-cyber-cyan neon-text-cyan leading-tight">
            维修派工墙
          </div>
          <div className="text-[10px] font-mono text-slate-500 tracking-wider">
            DISPATCH CONSOLE · MAINTENANCE WORKFLOW v2.1
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
        <HStat
          icon={<Activity size={12} />}
          label="待派"
          value={stats.pending}
          sub={stats.slaBreached > 0 ? `${stats.slaBreached}超时` : undefined}
          color={stats.slaBreached > 0 ? 'red' : stats.pending > 0 ? 'amber' : 'cyan'}
        />
        <HDiv />
        <HStat
          icon={<PlayCircle size={12} />}
          label="在处理"
          value={stats.assigned + stats.working}
          sub={`${stats.working}开工`}
          color="cyan"
        />
        <HDiv />
        <HStat
          icon={<ShieldCheck size={12} />}
          label="待验收"
          value={stats.verifying}
          color="purple"
          blink={stats.verifying > 0}
        />
        <HDiv />
        <HStat
          icon={<CheckCircle2 size={12} />}
          label="已完成"
          value={stats.done}
          sub={stats.rejected > 0 ? `${stats.rejected}驳回` : undefined}
          color="green"
        />
        <HDiv />
        <HStat
          icon={<Clock size={12} />}
          label="平均响应"
          value={`${stats.avgResponseMin.toFixed(1)}分`}
          color={stats.avgResponseMin > 15 ? 'amber' : 'cyan'}
        />
        <HDiv />
        <button
          onClick={() => setAutoAssign(!autoAssignEnabled)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border transition
            ${autoAssignEnabled
              ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 border-emerald-400/50 shadow-neon-green'
              : 'bg-slate-800/50 border-slate-600/50'
            }
          `}
        >
          <Zap size={12} className={autoAssignEnabled ? 'text-emerald-400 animate-blink-led' : 'text-slate-500'} />
          <div className="leading-tight">
            <div className={`text-[10px] font-mono uppercase tracking-wider ${autoAssignEnabled ? 'text-emerald-400/80' : 'text-slate-500'}`}>
              自动派工
            </div>
            <div className={`text-[11px] font-orbitron font-bold ${autoAssignEnabled ? 'text-emerald-300' : 'text-slate-400'}`}>
              {autoAssignEnabled ? 'ACTIVE' : 'PAUSED'}
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition ${autoAssignEnabled ? 'bg-emerald-500/30' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${autoAssignEnabled ? 'left-4 bg-emerald-400 shadow-[0_0_6px_rgba(0,255,136,0.8)]' : 'left-0.5 bg-slate-500'}`} />
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {lastLog && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/40 animate-fault-pulse">
            <RefreshCw size={11} className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="leading-tight">
              <div className="text-[10px] font-mono text-emerald-400">
                自动派单 · {lastLog.assignedTo}
              </div>
              <div className="text-[9px] font-mono text-emerald-300/70">{lastLog.reason}</div>
            </div>
          </div>
        )}
        <div className="text-right">
          <div className="font-orbitron text-base tracking-[0.15em] text-cyber-cyan neon-text-cyan leading-none">
            {hh}<span className="animate-blink-led">:</span>{mm}<span className="animate-blink-led">:</span>{ss}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {yy}-{mo}-{dd}
            <span className="ml-1 text-emerald-500/70 flex items-center gap-0.5 inline-flex">
              <Activity size={9} className="animate-pulse-led" /> LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HDiv() {
  return <div className="w-px h-8 bg-gradient-to-b from-transparent via-cyber-cyan/30 to-transparent" />;
}

function HStat({
  icon, label, value, sub, color, blink,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color: 'cyan' | 'amber' | 'red' | 'green' | 'purple';
  blink?: boolean;
}) {
  const cmap = {
    cyan: 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/5',
    amber: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    red: 'text-rose-400 border-rose-500/50 bg-rose-500/10',
    green: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    purple: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
  };
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border ${cmap[color]}`}>
      <span className={blink ? 'animate-blink-led' : ''}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[9px] font-mono uppercase tracking-wider opacity-70">{label}</div>
        <div className={`text-[13px] font-orbitron font-bold ${blink ? 'animate-blink-led' : ''}`}>
          {value}
          {sub && <span className="ml-1 text-[10px] font-mono opacity-70 font-normal">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function TicketDetailPanel({
  ticket, candidates, onClose, onAssign, onAuto,
}: {
  ticket: ReturnType<typeof useDispatchStore.getState>['getTicket'] extends (id: string) => infer R ? NonNullable<R> : never;
  candidates: CandidateScore[];
  onClose: () => void;
  onAssign: (personnelId: string) => void;
  onAuto: () => void;
}) {
  const lvl = TICKET_LEVEL_CONFIG[ticket.level];
  const sta = TICKET_STATUS_CONFIG[ticket.status];

  return (
    <div
      className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-stretch justify-end"
      onClick={onClose}
    >
      <div
        className="w-[440px] max-w-[90vw] h-full bg-gradient-to-b from-cyber-panel to-cyber-bg border-l border-cyber-line shadow-2xl flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-30" />
        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${ticket.level === 'P0' ? 'from-rose-500 via-rose-400 to-rose-500 animate-border-flow bg-[length:200%_100%]' : ticket.level === 'P1' ? 'from-orange-500 via-amber-400 to-orange-500' : 'from-cyber-cyan via-emerald-400 to-cyber-cyan'}`} />

        <div className="flex-shrink-0 p-4 border-b border-white/5 bg-gradient-to-b from-black/30 to-transparent">
          <div className="flex items-start gap-3">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-orbitron font-bold text-lg border-2 ${lvl.border} ${lvl.bg} ${lvl.color} ${ticket.level === 'P0' ? 'animate-pulse shadow-neon-red' : ''}`}>
              {ticket.level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`font-mono text-[10px] tracking-wider ${lvl.color}`}>{ticket.code}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${sta.border} ${sta.bg} ${sta.color}`}>{sta.label}</span>
                {ticket.faultCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-500/50 bg-rose-500/10 text-rose-400">{ticket.faultCode}</span>
                )}
              </div>
              <div className="font-semibold text-[14px] text-slate-100 leading-snug">{ticket.title}</div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-slate-700/60 bg-slate-800/50 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-400 transition flex items-center justify-center flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="p-4 space-y-4">
            <InfoBlock title="工单详情" icon={<FileText size={13} />}>
              <InfoRow k="设备名称" v={<span className="text-cyan-300">{ticket.deviceName}</span>} />
              <InfoRow k="所属组" v={ticket.deviceGroup} />
              <InfoRow k="设备位置" v={<span className="flex items-center gap-1"><AlertTriangle size={10} className="text-amber-400" />{ticket.location.zone} ({ticket.location.x}, {ticket.location.y})</span>} />
              <InfoRow k="报修人" v={ticket.reporterName} />
              <InfoRow k="SLA时效" v={<span className={lvl.color}>{ticket.slaMinutes} 分钟</span>} />
              <InfoRow k="创建时间" v={formatTime(ticket.createdAt)} />
            </InfoBlock>

            <InfoBlock title="问题描述" icon={<ThermometerSun size={13} />}>
              <div className="text-[12px] text-slate-300 leading-relaxed bg-slate-900/50 border border-slate-700/40 rounded-lg p-3">
                {ticket.description}
              </div>
            </InfoBlock>

            <InfoBlock title="指派人员推荐" icon={<Trophy size={13} />}>
              {ticket.status === 'done' ? (
                <div className="text-[12px] font-mono text-slate-400 text-center py-4">
                  工单已完成，无需指派
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-[12px] font-mono text-slate-500 text-center py-4">
                  暂无可用维修人员
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={onAuto}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono hover:bg-cyan-500/25 transition"
                    >
                      <Zap size={11} /> 系统自动派单
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {candidates.map((c, idx) => (
                      <div
                        key={c.personnelId}
                        className={`
                          group relative flex items-center gap-3 p-2.5 rounded-lg border transition
                          ${idx === 0
                            ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/15 shadow-[0_0_12px_rgba(0,255,136,0.15)]'
                            : idx < 3
                              ? 'bg-cyan-500/5 border-cyan-500/40 hover:bg-cyan-500/10'
                              : 'bg-slate-900/30 border-slate-700/50 hover:bg-slate-800/40'
                          }
                        `}
                      >
                        <div className={`
                          w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-orbitron font-bold
                          ${idx === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50' :
                            idx < 3 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' :
                            'bg-slate-800 text-slate-400 border border-slate-600/50'}
                        `}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[12px] font-semibold ${idx === 0 ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {c.personnelName}
                            </span>
                            {idx === 0 && (
                              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono animate-pulse-led">
                                <Award size={9} /> 最佳
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5 flex-wrap">
                            <span>距离 {c.distance.toFixed(1)}</span>
                            <span>·</span>
                            <span>技能 {c.skillMatch}</span>
                            <span>·</span>
                            <span>负载 {c.loadFactor}</span>
                            <span>·</span>
                            <span className={idx === 0 ? 'text-emerald-400' : 'text-cyan-400'}>
                              综合 {c.totalScore.toFixed(0)}
                            </span>
                          </div>
                          {c.reason && (
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                              {c.reason}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onAssign(c.personnelId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-cyber-cyan/20 to-cyan-500/10 border border-cyber-cyan/50 text-cyber-cyan text-[10px] font-mono hover:from-cyber-cyan/30 hover:to-cyan-500/20 hover:shadow-neon-cyan transition group-hover:translate-x-0.5"
                        >
                          <ArrowRightLeft size={11} />
                          派单
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </InfoBlock>

            <InfoBlock title="工单流转日志" icon={<History size={13} />}>
              <div className="space-y-2.5 relative pl-2">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-cyber-cyan/50 via-slate-700 to-transparent" />
                {ticket.logs.map((log, i) => (
                  <div key={log.id} className="relative flex gap-2.5">
                    <div className={`
                      relative z-10 w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0
                      ${i === 0 ? 'bg-cyber-cyan shadow-[0_0_6px_rgba(0,240,255,0.8)]' : 'bg-slate-600'}
                      border-2 border-cyber-panel
                    `} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-semibold ${i === 0 ? 'text-cyber-cyan' : 'text-slate-300'}`}>
                          {log.action}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">{formatTime(log.timestamp)}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {log.operatorName}
                        {log.remark && ` · ${log.remark}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </InfoBlock>

            {ticket.status === 'assigned' && ticket.assigneeId && (
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10">
                <div className="text-[11px] font-mono text-amber-400 mb-1.5">快速操作</div>
                <button
                  onClick={() => {
                    useDispatchStore.getState().startWorking(ticket.id, ticket.assigneeId!, ticket.assigneeName!);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[11px] font-mono hover:bg-amber-500/30 transition"
                >
                  <PlayCircle size={13} /> 确认 {ticket.assigneeName} 已开工
                </button>
              </div>
            )}

            {ticket.status === 'working' && ticket.assigneeId && (
              <div className="p-3 rounded-lg border border-purple-500/40 bg-purple-500/10">
                <div className="text-[11px] font-mono text-purple-400 mb-1.5">快速操作</div>
                <button
                  onClick={() => {
                    useDispatchStore.getState().submitVerify(ticket.id, ticket.assigneeId!, ticket.assigneeName!, '已修复，提交验收');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-purple-500/20 border border-purple-400/60 text-purple-300 text-[11px] font-mono hover:bg-purple-500/30 transition"
                >
                  <CheckCircle2 size={13} /> 提交验收
                </button>
              </div>
            )}

            {ticket.status === 'verifying' && (
              <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                <div className="text-[11px] font-mono text-emerald-400">验收操作</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => useDispatchStore.getState().acceptTicket(ticket.id, 'MGR-01', '维修主管')}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-md bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[11px] font-mono hover:bg-emerald-500/30 transition"
                  >
                    <CheckCircle2 size={12} /> 验收通过
                  </button>
                  <button
                    onClick={() => {
                      const r = window.prompt('请输入驳回原因：', '请修复后重新提交');
                      if (r) useDispatchStore.getState().rejectTicket(ticket.id, 'MGR-01', '维修主管', r);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-md bg-rose-500/20 border border-rose-400/60 text-rose-300 text-[11px] font-mono hover:bg-rose-500/30 transition"
                  >
                    <XCircle size={12} /> 验收驳回
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-cyber-line/70 bg-gradient-to-br from-cyber-card/60 to-cyber-panel/40 hud-corner">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-black/20">
        <span className="text-cyber-cyan">{icon}</span>
        <span className="text-[11px] font-orbitron tracking-wider text-cyber-cyan neon-text-cyan">{title}</span>
      </div>
      <div className="p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-[11px]">
      <span className="text-slate-500 font-mono w-20 flex-shrink-0">{k}</span>
      <ChevronRight size={10} className="text-slate-600 mt-0.5 flex-shrink-0" />
      <span className="text-slate-300 flex-1 min-w-0 break-words">{v}</span>
    </div>
  );
}

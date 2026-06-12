import { useState } from "react";
import { WorkoutLog } from "../types";
import { Calendar, Clock, Trash2, Dumbbell, ChevronDown, ChevronUp, BarChart3, TrendingUp, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryLogsProps {
  logs: WorkoutLog[];
  onDeleteLog: (logId: string) => void;
}

export default function HistoryLogs({ logs, onDeleteLog }: HistoryLogsProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Calculate total workout volume sum
  const calculateVolume = (log: WorkoutLog) => {
    return log.exercises.reduce((total, ex) => {
      const activeSets = ex.sets.filter((s) => s.completed);
      const exerciseVolume = activeSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      return total + exerciseVolume;
    }, 0);
  };

  const calculateCompletedSetsCount = (log: WorkoutLog) => {
    return log.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/2 border border-dashed border-white/10 rounded-[2.5rem] text-center" id="empty-history-container">
        <div className="bg-white/3 p-5 rounded-full border border-white/5 text-neutral-550 mb-4 shadow-xl">
          <Dumbbell className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-black text-white uppercase tracking-wider">No Training History Found</h3>
        <p className="text-[11px] text-neutral-400 max-w-xs mt-1.5 leading-relaxed">
          Unlock your true strength. Select Day 1 to Day 6 from the splits board, open details, and complete your first session!
        </p>
      </div>
    );
  }

  // Pre-process logs for SVG Wave Chart (older to newer, last 7)
  const chartLogs = [...logs]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .slice(-7);

  const volumes = chartLogs.map((log) => calculateVolume(log));
  const maxVol = Math.max(...volumes, 500);

  // Generate SVG Points
  const svgWidth = 500;
  const svgHeight = 110;
  const paddingX = 40;
  const paddingY = 20;

  const points = chartLogs.map((log, idx) => {
    const n = chartLogs.length;
    const x = n > 1 ? paddingX + (idx / (n - 1)) * (svgWidth - paddingX * 2) : svgWidth / 2;
    const y = svgHeight - paddingY - (calculateVolume(log) / maxVol) * (svgHeight - paddingY * 2);
    return { x, y };
  });

  const getBezierPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${pts[0].y}`;
    
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = getBezierPath(points);
  const fillPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - 10} L ${points[0].x} ${svgHeight - 10} Z` 
    : "";

  return (
    <div className="flex flex-col gap-4" id="history-logs-board">
      {/* Visual Header Grid Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="liquid-glass rounded-[2rem] p-4.5 border border-white/5 flex flex-col justify-between min-h-[90px]">
          <span className="text-[9px] font-mono text-neutral-450 uppercase tracking-widest block font-black">Training Hits</span>
          <span className="text-xl sm:text-2xl font-black tracking-tight mt-1 inline-flex items-center gap-2 text-white">
            {logs.length}
            <Dumbbell className="w-4 h-4 text-pink-500 glow-pink" />
          </span>
        </div>

        <div className="liquid-glass rounded-[2rem] p-4.5 border border-white/5 flex flex-col justify-between min-h-[90px]">
          <span className="text-[9px] font-mono text-neutral-450 uppercase tracking-widest block font-black">Total Work Sets</span>
          <span className="text-xl sm:text-2xl font-black tracking-tight mt-1 inline-flex items-center gap-2 text-white">
            {logs.reduce((sum, current) => sum + calculateCompletedSetsCount(current), 0)}
            <Award className="w-4 h-4 text-pink-500 glow-pink" />
          </span>
        </div>

        <div className="liquid-glass rounded-[2rem] p-4.5 border border-white/5 flex flex-col justify-between min-h-[90px] col-span-2 sm:col-span-1">
          <span className="text-[9px] font-mono text-neutral-450 uppercase tracking-widest block font-black">Est. Weight Volume</span>
          <span className="text-xl sm:text-2xl font-black tracking-tight mt-1 inline-flex items-center gap-1 text-white">
            {logs.reduce((sum, current) => sum + calculateVolume(current), 0).toLocaleString()} <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider pl-0.5">lbs</span>
            <TrendingUp className="w-4 h-4 text-pink-500 glow-pink" />
          </span>
        </div>
      </div>

      {/* SVG Smooth Wave Trend Chart */}
      {chartLogs.length > 0 && (
        <div className="liquid-glass rounded-[2.5rem] p-5 border border-white/5 flex flex-col gap-3 shadow-2xl relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center z-10">
            <div>
              <span className="text-[9px] text-pink-500 font-mono font-black uppercase tracking-widest glow-pink">Volume Metrics</span>
              <h4 className="text-xs font-black text-white uppercase mt-0.5 tracking-tight">Session Weight Curve</h4>
            </div>
            <span className="text-[9px] font-mono text-neutral-400 uppercase font-black bg-white/3 border border-white/5 px-2 py-0.5 rounded-full">
              Lbs Lifted/7 Day Window
            </span>
          </div>

          {/* Render Responsive SVG */}
          <div className="w-full overflow-x-auto select-none mt-1 shrink-0 z-10">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" className="overflow-visible min-w-[420px]">
              <defs>
                <linearGradient id="chart-glow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chart-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="rgba(255,255,255,0.05)" />

              {points.length > 1 && (
                <>
                  {/* Wave Gradient Fill */}
                  <path d={fillPath} fill="url(#chart-glow-gradient)" />
                  {/* Smooth Bezier Line */}
                  <path d={linePath} fill="none" stroke="url(#chart-line-gradient)" strokeWidth="3.5" strokeLinecap="round" />
                </>
              )}

              {/* Data Points */}
              {points.map((p, i) => (
                <g key={i} className="group/dot cursor-pointer">
                  {/* Outer Pulsing Hover Aura */}
                  <circle cx={p.x} cy={p.y} r="8" fill="rgba(236, 72, 153, 0.15)" className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200" />
                  {/* Solid Point Dot */}
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5" className="transition-all duration-300 group-hover/dot:scale-125" />
                  
                  {/* Value label on top */}
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    className="font-mono text-[8px] font-black fill-pink-400 select-none pointer-events-none tracking-tighter"
                  >
                    {volumes[i] > 0 ? `${(volumes[i] / 1000).toFixed(1)}k` : "0"}
                  </text>

                  {/* Session Date bottom helper */}
                  <text
                    x={p.x}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    className="font-mono text-[7px] font-black fill-neutral-500 select-none pointer-events-none uppercase tracking-wider"
                  >
                    {chartLogs[i].workoutName.split(" ")[0]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Accordion list of historic sessions */}
      <div className="flex flex-col gap-3">
        {logs.map((log, idx) => {
          const isExpanded = expandedLogId === log.logId;
          const finishedSets = calculateCompletedSetsCount(log);
          const totalVol = calculateVolume(log);

          return (
            <div
              key={log.logId}
              className="liquid-glass rounded-[2rem] overflow-hidden shadow-lg transition-all border border-white/5"
            >
              {/* Card Header clickable row */}
              <div
                onClick={() => toggleExpand(log.logId)}
                className="p-4.5 flex items-center justify-between cursor-pointer hover:bg-white/2 select-none transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="bg-pink-500/10 text-pink-500 p-2.5 rounded-xl border border-pink-500/20 shadow-[0_0_12px_rgba(236,72,153,0.1)] shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-black leading-none text-pink-500 uppercase tracking-widest block glow-pink">
                      {formatDate(log.completedAt)}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5 uppercase tracking-tight">{log.workoutName}</h4>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-450 font-mono font-bold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-550" />
                        {formatDuration(log.duration)}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span>{finishedSets} sets logged</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block font-mono text-[10px] font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider glow-pink">
                    {totalVol > 0 ? `${totalVol.toLocaleString()} lbs` : "POSTURE DAY"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Permanently erase this training record?")) {
                        onDeleteLog(log.logId);
                      }
                    }}
                    className="p-2.5 text-neutral-500 hover:text-red-500 bg-white/3 hover:bg-red-550/10 border border-white/5 hover:border-red-500/20 rounded-xl transition-all cursor-pointer active:scale-95"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-neutral-450 p-1 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible content area */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-white/5 px-5 py-5 bg-black/30"
                  >
                    <h5 className="text-[9px] font-mono font-black text-neutral-450 uppercase tracking-widest mb-3.5">
                      EXERCISE BREAKDOWN
                    </h5>
                    <div className="flex flex-col gap-3.5">
                      {log.exercises.map((ex) => {
                        const verifiedSets = ex.sets.filter((s) => s.completed);
                        if (verifiedSets.length === 0) return null;

                        return (
                          <div key={ex.exerciseId} className="flex flex-col gap-1.5 border-b border-white/5 pb-3.5 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-white uppercase">{ex.name}</span>
                              <span className="text-[9px] font-mono text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold glow-pink">{ex.category}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {verifiedSets.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] font-mono text-neutral-300 bg-white/3 border border-white/5 px-2.5 py-1 rounded-lg font-bold"
                                >
                                  Set {s.setIndex}: <span className="text-pink-400 font-black glow-pink">{s.weight} lbs</span> x {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

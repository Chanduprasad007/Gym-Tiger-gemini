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
      <div className="flex flex-col items-center justify-center p-12 bg-gray-900/10 border border-dashed border-gray-800 rounded-3xl text-center" id="empty-history-container">
        <div className="bg-gray-900 p-4 rounded-full border border-gray-800 text-gray-500 mb-4 shadow-xl">
          <Dumbbell className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">No Training History Found</h3>
        <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
          Unlock your true strength. Select Day 1 to Day 6 from the splits board, open details, and complete your first session!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" id="history-logs-board">
      {/* Visual Header Grid Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">Training Hits</span>
          <span className="text-2xl font-extrabold text-orange-505 tracking-tight mt-1 inline-flex items-center gap-2 text-white">
            {logs.length}
            <Dumbbell className="w-4 h-4 text-orange-500" />
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">Total Work Sets</span>
          <span className="text-2xl font-extrabold text-orange-505 tracking-tight mt-1 inline-flex items-center gap-1.5 text-white">
            {logs.reduce((sum, current) => sum + calculateCompletedSetsCount(current), 0)}
            <Award className="w-4 h-4 text-orange-500" />
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">Est. Weight Volume</span>
          <span className="text-2xl font-extrabold text-orange-500 tracking-tight mt-1 inline-flex items-center gap-1.5 ">
            {logs.reduce((sum, current) => sum + calculateVolume(current), 0).toLocaleString()} <span className="text-xs text-neutral-400">lbs</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </span>
        </div>
      </div>

      {/* Accordion list of historic sessions */}
      <div className="flex flex-col gap-3">
        {logs.map((log, idx) => {
          const isExpanded = expandedLogId === log.logId;
          const finishedSets = calculateCompletedSetsCount(log);
          const totalVol = calculateVolume(log);

          return (
            <div
              key={log.logId}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg transition-all"
            >
              {/* Card Header clickable row */}
              <div
                onClick={() => toggleExpand(log.logId)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-950/40 select-none transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="bg-orange-500/10 text-orange-500 p-2.5 rounded-xl border border-orange-500/10">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold leading-none text-orange-500 uppercase tracking-wider block">
                      {formatDate(log.completedAt)}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1 uppercase tracking-tight">{log.workoutName}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        {formatDuration(log.duration)}
                      </span>
                      <span>•</span>
                      <span>{finishedSets} sets logged</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block font-mono text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                    {totalVol > 0 ? `${totalVol.toLocaleString()} lbs` : "POSTURE DAY"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Permanently erase this training record?")) {
                        onDeleteLog(log.logId);
                      }
                    }}
                    className="p-2 text-neutral-500 hover:text-red-500 bg-neutral-950 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-neutral-400 p-1">
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
                    className="border-t border-neutral-800 px-4 py-4 bg-neutral-950"
                  >
                    <h5 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-3">
                      EXERCISE BREAKDOWN
                    </h5>
                    <div className="flex flex-col gap-3.5">
                      {log.exercises.map((ex) => {
                        const verifiedSets = ex.sets.filter((s) => s.completed);
                        if (verifiedSets.length === 0) return null;

                        return (
                          <div key={ex.exerciseId} className="flex flex-col gap-1.5 border-b border-neutral-900 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white uppercase">{ex.name}</span>
                              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{ex.category}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {verifiedSets.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] font-mono text-neutral-300 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded"
                                >
                                  Set {s.setIndex}: <span className="text-orange-400 font-bold">{s.weight} lbs</span> x {s.reps}
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

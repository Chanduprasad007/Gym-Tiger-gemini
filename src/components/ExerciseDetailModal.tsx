import { useState, useEffect } from "react";
import { Exercise } from "../data";
import { X, Target, Info, ShieldAlert, Sparkles, Search } from "lucide-react";
import { motion } from "motion/react";
import { getExerciseDetails, ExerciseExtraInfo } from "../lib/workoutx";

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function ExerciseDetailModal({ exercise, onClose, isDarkMode = true }: ExerciseDetailModalProps) {
  const [extra, setExtra] = useState<ExerciseExtraInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAltIdx, setActiveAltIdx] = useState(0);
  const [mediaErr, setMediaErr] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getExerciseDetails(exercise.id, exercise.name)
      .then((data) => {
        if (active) {
          setExtra(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading extra exercise info", err);
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [exercise]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-colors duration-300 ${
      isDarkMode ? "bg-black/90" : "bg-black/40"
    }`} id="exercise-guide-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border transition-all duration-300 ${
          isDarkMode ? "liquid-glass-premium border-white/5" : "light-glass-premium border-black/5"
        }`}
      >
        {/* Modal Header */}
        <div className={`px-6 py-5 flex items-center justify-between shrink-0 border-b ${
          isDarkMode ? "bg-white/3 border-white/5" : "bg-black/[0.02] border-black/5"
        }`}>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[9px] font-mono font-black bg-pink-500/10 text-pink-500 border border-pink-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isDarkMode ? "glow-pink" : ""
              }`}>
                {exercise.category} Isolation
              </span>
              <span className={`text-[9px] font-mono font-bold border px-2.5 py-0.5 rounded-full inline-block ${
                isDarkMode ? "bg-white/5 text-neutral-300 border-white/5" : "bg-black/5 text-neutral-750 border-black/5"
              }`}>
                ⏱️ {exercise.rest} Rest
              </span>
            </div>
            <h2 className={`text-base sm:text-lg font-black mt-2 uppercase tracking-tight ${
              isDarkMode ? "text-white" : "text-neutral-900"
            }`}>{exercise.name}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-3.5 md:p-2 border rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDarkMode
                ? "text-neutral-400 hover:text-white bg-white/3 hover:bg-white/5 border-white/5"
                : "text-neutral-600 hover:text-neutral-900 bg-black/3 hover:bg-black/5 border-black/5"
            }`}
            title="Close Guide"
          >
            <X className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Workout GIF Animation HUD */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-mono font-black text-neutral-450 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 text-pink-500 animate-pulse ${isDarkMode ? "glow-pink" : ""}`} />
              <span>LIVE SYSTEM LOG: ANIMATION DEMO</span>
            </span>
            
            {loading ? (
              <div className={`aspect-video w-full rounded-2xl flex flex-col items-center justify-center gap-3 min-h-[140px] border ${
                isDarkMode ? "bg-black/40 border-white/5" : "bg-black/[0.03] border-black/5"
              }`}>
                <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold">Acquiring WorkoutX stream...</p>
              </div>
            ) : extra?.gifUrl && !mediaErr ? (
              <div className={`relative aspect-video w-full rounded-2xl overflow-hidden flex items-center justify-center p-2 group shadow-inner min-h-[140px] border ${
                isDarkMode ? "bg-black/40 border-white/5" : "bg-black/[0.03] border-black/5"
              }`}>
                <img
                  src={extra.gifUrl}
                  alt={exercise.name}
                  className={`h-full max-h-[220px] object-contain mx-auto pointer-events-none rounded-lg ${
                    isDarkMode ? "mix-blend-lighten" : "mix-blend-normal"
                  }`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => setMediaErr(true)}
                />
                <span className={`absolute bottom-2.5 right-2.5 text-[8px] font-mono font-black text-pink-500 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse ${
                  isDarkMode ? "glow-pink" : ""
                }`}>
                  STREAM LIVE OK
                </span>
              </div>
            ) : (
              <div className={`aspect-video w-full rounded-2xl flex flex-col items-center justify-center gap-2 p-5 text-center min-h-[140px] border ${
                isDarkMode ? "bg-black/45 border-white/5" : "bg-black/[0.03] border-black/5"
              }`}>
                <div className={`w-10 h-10 rounded-full bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-500 mb-1 animate-pulse ${
                  isDarkMode ? "shadow-[0_0_12px_rgba(236,72,153,0.15)]" : ""
                }`}>
                  <Target className={`w-5 h-5 ${isDarkMode ? "glow-pink" : ""}`} />
                </div>
                <span className={`text-xs font-black uppercase tracking-tight ${
                  isDarkMode ? "text-neutral-200" : "text-neutral-750"
                }`}>Active Target: {exercise.target}</span>
                <p className={`text-[10px] max-w-sm leading-relaxed ${
                  isDarkMode ? "text-neutral-400" : "text-neutral-600"
                }`}>
                  The animated stream is currently offline. Refer to the <span className={`font-bold leading-none ${isDarkMode ? "text-white" : "text-neutral-900"}`}>Execution Protocol</span> below and tap the Google Search link for instant form guides.
                </p>
              </div>
            )}
          </div>

          {/* Target muscles banner */}
          <div className={`flex gap-3.5 items-center p-4 rounded-2xl border ${
            isDarkMode ? "bg-white/3 border-white/5" : "bg-black/[0.02] border-black/5"
          }`}>
            <Target className={`w-5 h-5 text-pink-500 shrink-0 ${isDarkMode ? "glow-pink" : ""}`} />
            <div>
              <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-black leading-none">PRIMARY TARGET</p>
              <p className={`text-sm font-extrabold mt-1 uppercase tracking-tight ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}>{exercise.target}</p>
            </div>
          </div>

          {/* Form instructions */}
          <div>
            <h4 className="text-xs font-mono font-black text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className={`w-3.5 h-3.5 text-pink-500 ${isDarkMode ? "glow-pink" : ""}`} />
              <span>EXECUTION PROTOCOL</span>
            </h4>
            <ol className="flex flex-col gap-2.5">
              {exercise.instructions.map((step, idx) => (
                <li key={idx} className={`flex gap-3 text-sm ${isDarkMode ? "text-neutral-300" : "text-neutral-750"}`}>
                  <span className={`font-mono text-[9px] flex items-center justify-center shrink-0 rounded-full border font-black w-5 h-5 ${
                    isDarkMode ? "bg-white/3 text-neutral-300 border-white/5" : "bg-black/3 text-neutral-700 border-black/5"
                  }`}>
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed text-xs sm:text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tiger Tip for athletic form */}
          <div className="bg-pink-500/5 border border-pink-500/15 p-4.5 rounded-2xl flex gap-3.5 items-start">
            <ShieldAlert className={`w-5 h-5 text-pink-500 shrink-0 mt-0.5 ${isDarkMode ? "glow-pink" : ""}`} />
            <div>
              <h5 className={`text-[10px] font-black text-pink-500 font-mono uppercase tracking-wider mb-1 ${isDarkMode ? "glow-pink" : ""}`}>
                TIGER ALIGNMENT NOTE
              </h5>
              <p className={`text-xs leading-relaxed font-sans mt-1 ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                {exercise.tigerTip}
              </p>
            </div>
          </div>

          {/* ALTERNATIVE EXERCISE SECTION */}
          {extra && extra.alternatives && (
            <div className={`p-4.5 rounded-2xl border flex flex-col gap-3.5 ${
              isDarkMode ? "border-white/5 bg-black/20" : "border-black/5 bg-black/[0.01]"
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className={`text-[9px] font-mono text-pink-500 uppercase tracking-widest font-black block ${isDarkMode ? "glow-pink" : ""}`}>ALTERNATIVE DRILLS</span>
                  <span className={`text-[10px] font-mono mt-0.5 uppercase font-bold ${isDarkMode ? "text-neutral-500" : "text-neutral-550"}`}>3 Drills Added</span>
                </div>
                
                {/* 3 buttons to check them! */}
                <div className={`flex gap-0.5 p-0.5 rounded-lg border ${
                  isDarkMode ? "bg-black/50 border-white/5" : "bg-black/10 border-black/5"
                }`} id="alt-tabs-selector">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveAltIdx(idx)}
                      className={`text-[9px] font-mono font-black px-2.5 py-1 rounded-md transition-all select-none cursor-pointer ${
                        activeAltIdx === idx
                          ? "bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                          : isDarkMode 
                          ? "text-neutral-450 hover:text-white" 
                          : "text-neutral-650 hover:text-neutral-900"
                      }`}
                    >
                      Alt {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display currently selected alternative drill */}
              {extra.alternatives[activeAltIdx] && (
                <div className={`flex flex-col gap-2.5 pt-3 border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`} key={activeAltIdx}>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className={`text-[11px] font-black uppercase tracking-tight truncate max-w-[150px] ${
                      isDarkMode ? "text-white" : "text-neutral-900"
                    }`} title={extra.alternatives[activeAltIdx].name}>
                      {extra.alternatives[activeAltIdx].name}
                    </h5>
                    <span className={`text-[8px] font-mono font-black bg-pink-500/10 text-pink-500 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      isDarkMode ? "glow-pink" : ""
                    }`}>
                      {extra.alternatives[activeAltIdx].target}
                    </span>
                  </div>

                  <p className={`text-[11px] leading-relaxed italic ${isDarkMode ? "text-neutral-400" : "text-neutral-550"}`}>
                    If the primary setup is busy or joints feel stiff, swap to this alternative drill with identical motor routing:
                  </p>

                  <ul className="flex flex-col gap-1.5 pl-1">
                    {extra.alternatives[activeAltIdx].instructions.map((altStep, altIdx) => (
                      <li key={altIdx} className={`text-xs flex items-start gap-2 ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                        <span className="text-pink-500 text-xs font-black select-none">•</span>
                        <span className="leading-relaxed">{altStep}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Google Open Form button */}
          <a
            href={extra?.googleSearchUrl || `https://www.google.com/search?q=${encodeURIComponent("how to do " + exercise.name + " barbell dumbbell cable execution video form")}`}
            target="_blank"
            rel="noreferrer"
            className={`btn-liquid-pink flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl text-white transition-all text-xs font-mono tracking-wider font-black cursor-pointer select-none border ${
              isDarkMode ? "border-white/10" : "border-black/5"
            }`}
          >
            <Search className="w-4 h-4 text-white" />
            <span>SEE EXECUTION ON GOOGLE SEARCH</span>
          </a>
        </div>

        {/* Modal Footer */}
        <div className={`border-t px-6 py-4.5 flex justify-end shrink-0 ${
          isDarkMode ? "bg-white/3 border-white/5" : "bg-black/[0.02] border-black/5"
        }`}>
          <button
            onClick={onClose}
            className="px-6 py-3.5 btn-liquid-pink text-white font-black text-xs sm:text-sm tracking-widest uppercase rounded-xl transition-all shadow-xl select-none cursor-pointer"
          >
            Got it, Let's Pull
          </button>
        </div>
      </motion.div>
    </div>
  );
}

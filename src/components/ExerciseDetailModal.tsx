import { useState, useEffect } from "react";
import { Exercise } from "../data";
import { X, Target, Info, ShieldAlert, Sparkles, Search } from "lucide-react";
import { motion } from "motion/react";
import { getExerciseDetails, ExerciseExtraInfo } from "../lib/workoutx";

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export default function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="exercise-guide-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg liquid-glass-premium rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-white/5"
      >
        {/* Modal Header */}
        <div className="bg-white/3 px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono font-black bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider glow-pink">
                {exercise.category} Isolation
              </span>
              <span className="text-[9px] font-mono font-bold bg-white/5 text-neutral-300 border border-white/5 px-2.5 py-0.5 rounded-full inline-block">
                ⏱️ {exercise.rest} Rest
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-2 uppercase tracking-tight">{exercise.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-3.5 md:p-2 text-neutral-400 hover:text-white bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Close Guide"
          >
            <X className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Workout GIF Animation HUD */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-mono font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse glow-pink" />
              <span>LIVE SYSTEM LOG: ANIMATION DEMO</span>
            </span>
            
            {loading ? (
              <div className="aspect-video w-full rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-3 min-h-[140px]">
                <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider font-bold">Acquiring WorkoutX stream...</p>
              </div>
            ) : extra?.gifUrl && !mediaErr ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center p-2 group shadow-inner min-h-[140px]">
                <img
                  src={extra.gifUrl}
                  alt={exercise.name}
                  className="h-full max-h-[220px] object-contain mx-auto mix-blend-lighten pointer-events-none rounded-lg"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => setMediaErr(true)}
                />
                <span className="absolute bottom-2.5 right-2.5 text-[8px] font-mono font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse glow-pink">
                  STREAM LIVE OK
                </span>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-black/45 border border-white/5 flex flex-col items-center justify-center gap-2 p-5 text-center min-h-[140px]">
                <div className="w-10 h-10 rounded-full bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-500 mb-1 animate-pulse shadow-[0_0_12px_rgba(236,72,153,0.15)]">
                  <Target className="w-5 h-5 glow-pink" />
                </div>
                <span className="text-xs text-neutral-200 font-black uppercase tracking-tight">Active Target: {exercise.target}</span>
                <p className="text-[10px] text-neutral-400 max-w-sm leading-relaxed">
                  The animated stream is currently offline. Refer to the <span className="text-white font-bold leading-none">Execution Protocol</span> below and tap the Google Search link for instant form guides.
                </p>
              </div>
            )}
          </div>

          {/* Target muscles banner */}
          <div className="flex gap-3.5 items-center bg-white/3 border border-white/5 p-4 rounded-2xl">
            <Target className="w-5 h-5 text-pink-500 shrink-0 glow-pink" />
            <div>
              <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-black leading-none">PRIMARY TARGET</p>
              <p className="text-sm font-extrabold text-white mt-1 uppercase tracking-tight">{exercise.target}</p>
            </div>
          </div>

          {/* Form instructions */}
          <div>
            <h4 className="text-xs font-mono font-black text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-pink-500 glow-pink" />
              <span>EXECUTION PROTOCOL</span>
            </h4>
            <ol className="flex flex-col gap-2.5">
              {exercise.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-neutral-300">
                  <span className="w-5 h-5 rounded-full bg-white/3 text-neutral-300 font-mono text-[9px] flex items-center justify-center shrink-0 border border-white/5 font-black">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed text-xs sm:text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tiger Tip for athletic form */}
          <div className="bg-pink-500/5 border border-pink-500/15 p-4.5 rounded-2xl flex gap-3.5 items-start">
            <ShieldAlert className="w-5 h-5 text-pink-500 shrink-0 mt-0.5 glow-pink" />
            <div>
              <h5 className="text-[10px] font-black text-pink-500 font-mono uppercase tracking-wider mb-1 glow-pink">
                TIGER ALIGNMENT NOTE
              </h5>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans mt-1">
                {exercise.tigerTip}
              </p>
            </div>
          </div>

          {/* ALTERNATIVE EXERCISE SECTION */}
          {extra && extra.alternatives && (
            <div className="border border-white/5 bg-black/20 p-4.5 rounded-2xl flex flex-col gap-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[9px] font-mono text-pink-400 uppercase tracking-widest font-black block glow-pink">ALTERNATIVE DRILLS</span>
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase font-bold">3 Drills Added</span>
                </div>
                
                {/* 3 buttons to check them! */}
                <div className="flex gap-0.5 bg-black/50 p-0.5 rounded-lg border border-white/5" id="alt-tabs-selector">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveAltIdx(idx)}
                      className={`text-[9px] font-mono font-black px-2.5 py-1 rounded-md transition-all select-none cursor-pointer ${
                        activeAltIdx === idx
                          ? "bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                          : "text-neutral-450 hover:text-white"
                      }`}
                    >
                      Alt {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display currently selected alternative drill */}
              {extra.alternatives[activeAltIdx] && (
                <div className="flex flex-col gap-2.5 pt-3 border-t border-white/5" key={activeAltIdx}>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[150px]" title={extra.alternatives[activeAltIdx].name}>
                      {extra.alternatives[activeAltIdx].name}
                    </h5>
                    <span className="text-[8px] font-mono font-black bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase shrink-0 glow-pink">
                      {extra.alternatives[activeAltIdx].target}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                    If the primary setup is busy or joints feel stiff, swap to this alternative drill with identical motor routing:
                  </p>

                  <ul className="flex flex-col gap-1.5 pl-1">
                    {extra.alternatives[activeAltIdx].instructions.map((altStep, altIdx) => (
                      <li key={altIdx} className="text-xs text-neutral-300 flex items-start gap-2">
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
            className="btn-liquid-pink flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl border border-white/10 text-white transition-all text-xs font-mono tracking-wider font-black cursor-pointer select-none"
          >
            <Search className="w-4 h-4 text-white" />
            <span>SEE EXECUTION ON GOOGLE SEARCH</span>
          </a>
        </div>

        {/* Modal Footer */}
        <div className="bg-white/3 border-t border-white/5 px-6 py-4.5 flex justify-end shrink-0">
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

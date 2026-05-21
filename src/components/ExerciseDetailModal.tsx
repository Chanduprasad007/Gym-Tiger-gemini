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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" id="exercise-guide-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-neutral-950 to-neutral-900 px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {exercise.category} Isolation
            </span>
            <h2 className="text-lg font-extrabold text-white mt-1 uppercase tracking-tight">{exercise.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/40 hover:bg-neutral-800/80 transition-all border border-neutral-850 rounded-xl"
            title="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Workout GIF Animation HUD */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-505 animate-pulse" />
              <span>LIVE SYSTEM LOG: ANIMATION DEMO</span>
            </span>
            
            {loading ? (
              <div className="aspect-video w-full rounded-xl bg-neutral-950 border border-neutral-850 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-orange-550 border-t-transparent animate-spin" />
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Acquiring WorkoutX stream...</p>
              </div>
            ) : extra?.gifUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-850 flex items-center justify-center p-2 group shadow-inner">
                <img
                  src={extra.gifUrl}
                  alt={exercise.name}
                  className="h-full max-h-[220px] object-contain mx-auto mix-blend-lighten pointer-events-none rounded-lg"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <span className="absolute bottom-2.5 right-2.5 text-[8px] font-mono font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  STREAM LIVE OK
                </span>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-neutral-950 border border-neutral-850 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="text-xs text-neutral-400 font-medium">GIF demonstration offline</span>
                <p className="text-[10px] text-neutral-500">Service is currently loading local fallback images.</p>
              </div>
            )}
          </div>

          {/* Target muscles banner */}
          <div className="flex gap-3 items-center bg-neutral-950 border border-neutral-850 p-3.5 rounded-xl">
            <Target className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-none">PRIMARY TARGET</p>
              <p className="text-sm font-bold text-white mt-1 uppercase tracking-tight">{exercise.target}</p>
            </div>
          </div>

          {/* Form instructions */}
          <div>
            <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-orange-500" />
              <span>EXECUTION PROTOCOL</span>
            </h4>
            <ol className="flex flex-col gap-2.5">
              {exercise.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-neutral-300">
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-neutral-300 font-mono text-[10px] flex items-center justify-center shrink-0 border border-neutral-850 font-semibold selection:bg-none">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tiger Tip for athletic form */}
          <div className="bg-orange-500/5 border border-orange-500/15 p-4 rounded-xl flex gap-3.5 items-start">
            <ShieldAlert className="w-5 h-5 text-orange-505 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-orange-500 font-mono uppercase tracking-wider mb-1">
                TIGER ALIGNMENT NOTE
              </h5>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans mt-1">
                {exercise.tigerTip}
              </p>
            </div>
          </div>

          {/* ALTERNATIVE EXERCISE SECTION */}
          {extra && (
            <div className="border border-neutral-800/80 bg-neutral-950/60 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest font-extrabold">ALTERNATIVE DRILL</span>
                  <h5 className="text-sm font-bold text-white uppercase tracking-tight mt-0.5">{extra.alternateName}</h5>
                </div>
                <span className="text-[9px] font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md">
                  {extra.alternateTarget}
                </span>
              </div>
              
              <p className="text-xs text-neutral-400 leading-relaxed italic">
                If the machine is busy or joints feel stiff, substitute with this alternative drill using identical motor patterns:
              </p>

              <ul className="flex flex-col gap-1.5 pl-1">
                {extra.alternateInstructions.map((altStep, altIdx) => (
                  <li key={altIdx} className="text-xs text-neutral-300 flex items-start gap-2">
                    <span className="text-orange-500 text-xs font-extrabold select-none">•</span>
                    <span className="leading-relaxed">{altStep}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dynamic Google Open Form button */}
          <a
            href={extra?.googleSearchUrl || `https://www.google.com/search?q=${encodeURIComponent("how to do " + exercise.name + " barbell dumbbell cable execution video form")}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border border-neutral-800 hover:border-orange-500/40 hover:bg-orange-550/5 text-neutral-400 hover:text-white transition-all text-xs font-mono tracking-wider font-extrabold"
          >
            <Search className="w-4 h-4 text-orange-500 group-hover:scale-105 transition-transform" />
            <span>SEE EXECUTION ON GOOGLE SEARCH</span>
          </a>
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-950/60 border-t border-neutral-800/85 px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-98 select-none"
          >
            Got it, Let's Pull
          </button>
        </div>
      </motion.div>
    </div>
  );
}

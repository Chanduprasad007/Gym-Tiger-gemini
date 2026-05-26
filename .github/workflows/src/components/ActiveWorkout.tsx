import { useState, useEffect } from "react";
import { DayWorkout, Exercise } from "../data";
import { WorkoutLog, LoggedExercise, LoggedSet } from "../types";
import { Play, Pause, Square, Check, Flame, HelpCircle, Award, Search, ChevronDown, ChevronUp, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getExerciseDetails, ExerciseExtraInfo } from "../lib/workoutx";

interface ActiveWorkoutProps {
  dayWorkout: DayWorkout;
  userId: string;
  onFinish: (log: WorkoutLog) => void;
  onCancel: () => void;
  onViewDetails: (exercise: Exercise) => void;
  onMinimize?: () => void;
}

export default function ActiveWorkout({ dayWorkout, userId, onFinish, onCancel, onViewDetails, onMinimize }: ActiveWorkoutProps) {
  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Exercise tracking state
  const [activeExercises, setActiveExercises] = useState<LoggedExercise[]>(() => {
    return dayWorkout.exercises.map((ex) => {
      const defaultSets: LoggedSet[] = Array.from({ length: ex.sets }).map((_, i) => ({
        setIndex: i + 1,
        weight: 20, // Initial default weight
        reps: parseInt(ex.repsRange.split("-")[0]) || 10, // Parse recommended reps
        completed: false,
      }));
      return {
        exerciseId: ex.id,
        name: ex.name,
        category: ex.category,
        sets: defaultSets,
      };
    });
  });

  // Keep stopwatch ticking
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleUpdateRep = (exId: string, setIndex: number, delta: number) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.setIndex !== setIndex) return s;
            return { ...s, reps: Math.max(1, s.reps + delta) };
          }),
        };
      })
    );
  };

  const handleUpdateWeight = (exId: string, setIndex: number, delta: number) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.setIndex !== setIndex) return s;
            return { ...s, weight: Math.max(0, s.weight + delta) };
          }),
        };
      })
    );
  };

  const handleToggleComplete = (exId: string, setIndex: number) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.setIndex !== setIndex) return s;
            return { ...s, completed: !s.completed };
          }),
        };
      })
    );
  };

  const handleCompleteWorkout = () => {
    const finalLog: WorkoutLog = {
      logId: "wl_" + Math.random().toString(36).substring(2, 11),
      userId,
      workoutName: dayWorkout.title,
      dayIndex: dayWorkout.dayIndex,
      completedAt: new Date().toISOString(),
      duration: seconds,
      exercises: activeExercises,
    };
    onFinish(finalLog);
  };

  const totalSets = activeExercises.flatMap((e) => e.sets).length;
  const completedSets = activeExercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans" id="active-workout-console">
      {/* Header section with brand-new premium HUD styling */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="mr-1 p-2 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Minimize & Return to Home Dashboard"
            >
              <ArrowLeft className="w-5 h-5 animate-pulse" />
            </button>
          )}
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-2 rounded-lg hidden sm:block">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono font-medium tracking-wide text-orange-500 uppercase">
              {dayWorkout.dayName} • {dayWorkout.focus.join(", ")}
            </span>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">{dayWorkout.title}</h1>
          </div>
        </div>

        {/* Stopwatch HUD with premium font */}
        <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 px-4 py-1.5 rounded-full shadow-inner">
          <span className="font-mono text-lg font-bold text-orange-400 tracking-wider">
            {formatTime(seconds)}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setIsActive(!isActive)}
              className="p-1 hover:text-orange-400 transition-colors text-neutral-400"
              title={isActive ? "Pause Timer" : "Resume Timer"}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main workout screen */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6 pb-28">
        {/* Progress Tracker Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-md">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
            <span>WORKOUT PROGRESS</span>
            <span className="text-white font-bold">{completedSets} of {totalSets} Sets Checked</span>
          </div>
          <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-orange-600 to-orange-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex flex-col gap-6">
          {dayWorkout.exercises.map((ex, exIdx) => {
            const trackingEx = activeExercises.find((ae) => ae.exerciseId === ex.id);
            return (
              <ActiveExerciseCard
                key={ex.id}
                ex={ex}
                exIdx={exIdx}
                trackingEx={trackingEx}
                onViewDetails={onViewDetails}
                handleUpdateWeight={handleUpdateWeight}
                handleUpdateRep={handleUpdateRep}
                handleToggleComplete={handleToggleComplete}
              />
            );
          })}
        </div>
      </main>

      {/* Persistent global footer workout-HUD buttons */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 border-t border-neutral-800 px-4 py-4 flex items-center justify-center shadow-2xl backdrop-blur-lg">
        <div className="max-w-4xl w-full flex items-center justify-between gap-3 sm:gap-4">
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 text-neutral-400 hover:text-white font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            Quit Session
          </button>

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="flex-1 px-3 sm:px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold text-xs sm:text-sm rounded-xl transition-all text-center cursor-pointer"
            >
              Minimize Workout
            </button>
          )}

          <button
            onClick={handleCompleteWorkout}
            className="flex-1 max-w-sm bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white font-bold text-xs sm:text-sm tracking-wide uppercase py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 select-none active:scale-98 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Finish Lift</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

/**
 * Dedicated Interactive Subcomponent for Active Exercise Cards
 * Stores and displays live GIFs, alternates, and search helpers cleanly.
 */
interface ActiveExerciseCardProps {
  key?: any;
  ex: Exercise;
  exIdx: number;
  trackingEx: LoggedExercise | undefined;
  onViewDetails: (exercise: Exercise) => void;
  handleUpdateWeight: (exId: string, setIndex: number, delta: number) => void;
  handleUpdateRep: (exId: string, setIndex: number, delta: number) => void;
  handleToggleComplete: (exId: string, setIndex: number) => void;
}

function ActiveExerciseCard({
  ex,
  exIdx,
  trackingEx,
  onViewDetails,
  handleUpdateWeight,
  handleUpdateRep,
  handleToggleComplete
}: ActiveExerciseCardProps) {
  const [showGizmo, setShowGizmo] = useState(false);
  const [extra, setExtra] = useState<ExerciseExtraInfo | null>(null);
  const [fetching, setFetching] = useState(false);
  const [activeAltIdx, setActiveAltIdx] = useState(0);
  const [mediaErr, setMediaErr] = useState(false);

  useEffect(() => {
    if (showGizmo && !extra) {
      setFetching(true);
      getExerciseDetails(ex.id, ex.name)
        .then((data) => {
          setExtra(data);
          setFetching(false);
        })
        .catch(() => setFetching(false));
    }
  }, [showGizmo, ex, extra]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: exIdx * 0.05 }}
      className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg group hover:border-neutral-750 transition-all"
      id={`exercise-card-${ex.id}`}
    >
      {/* Exercise banner */}
      <div className="bg-neutral-950/50 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <span className="px-2 py-0.5 text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/15 font-mono font-bold rounded-md uppercase tracking-wider">
            {ex.category}
          </span>
          <h3 className="text-sm font-bold text-white mt-1 uppercase tracking-tight group-hover:text-orange-400 transition-colors">
            {ex.name}
          </h3>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">{ex.target}</p>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Quick toggle for dynamic GIF & Alternates */}
          <button
            onClick={() => setShowGizmo(!showGizmo)}
            className={`flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1.5 rounded-lg border transition-all select-none ${
              showGizmo
                ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
            }`}
            title="Toggle Live Demo & Alternate Drill"
          >
            <span>Media</span>
            {showGizmo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onViewDetails(ex)}
            className="flex items-center gap-1 text-[11.5px] text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1.5 rounded-lg transition-all select-none"
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Form quick clue */}
      <div className="px-4 py-2 border-b border-neutral-850 bg-orange-950/5 flex items-start gap-2">
        <span className="text-xs font-semibold text-orange-500 font-mono mt-0.5">TIGER TIP: </span>
        <p className="text-xs text-neutral-300 italic flex-1">{ex.tigerTip}</p>
      </div>

      {/* Toggleable WorkoutX GIF and Alternate Exercise visual board */}
      <AnimatePresence>
        {showGizmo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-neutral-800 bg-neutral-950/40 overflow-hidden"
          >
            <div className="p-4 flex flex-col md:flex-row gap-4">
              {/* GIF Player Box */}
              <div className="flex-1 min-w-[140px] flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">
                  Demo Loop Stream
                </span>
                
                {fetching ? (
                  <div className="aspect-video w-full rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-orange-550 border-t-transparent animate-spin" />
                    <span className="text-[9px] font-mono text-neutral-500 uppercase">LOAD STREAM...</span>
                  </div>
                ) : extra?.gifUrl && !mediaErr ? (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/60 flex items-center justify-center p-1.5">
                    <img
                      src={extra.gifUrl}
                      alt={ex.name}
                      className="h-full max-h-[140px] object-contain mx-auto mix-blend-lighten pointer-events-none rounded"
                      referrerPolicy="no-referrer"
                      onError={() => setMediaErr(true)}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl bg-neutral-950 border border-neutral-850 flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wide">STREAM OFFLINE</span>
                    <span className="text-[9px] text-neutral-500 mt-0.5">Use Alternative Drills</span>
                  </div>
                )}
              </div>              {/* Alternate Exercise Card */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">
                    Alternative Drills (3 available)
                  </span>
                  {/* Small tabs for checking alternatives */}
                  {extra && extra.alternatives && (
                    <div className="flex gap-0.5 bg-neutral-950 p-0.5 rounded border border-neutral-850">
                      {[0, 1, 2].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveAltIdx(idx)}
                          className={`text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded transition-all select-none cursor-pointer ${
                            activeAltIdx === idx
                              ? "bg-orange-550 text-white"
                              : "text-neutral-500 hover:text-white"
                          }`}
                        >
                          Alt {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {extra && extra.alternatives ? (
                  <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl flex-1 flex flex-col justify-between" key={activeAltIdx}>
                    <div>
                      {extra.alternatives[activeAltIdx] && (
                        <>
                          <div className="flex items-center justify-between gap-2 border-b border-neutral-850 pb-1.5">
                            <h4 className="text-[11px] font-bold text-white uppercase tracking-tight truncate max-w-[130px]" title={extra.alternatives[activeAltIdx].name}>
                              {extra.alternatives[activeAltIdx].name}
                            </h4>
                            <span className="text-[7.5px] font-mono font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1 py-0.5 rounded uppercase">
                              {extra.alternatives[activeAltIdx].target}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-neutral-300 leading-snug font-sans mt-1.5 line-clamp-3" title={extra.alternatives[activeAltIdx].instructions.join(" ")}>
                            {extra.alternatives[activeAltIdx].instructions[0] || "Execute with absolute posture control."}
                          </p>
                        </>
                      )}
                    </div>
 
                    {/* Google execution search helper button */}
                    <a
                      href={extra.googleSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-lg border border-neutral-800 hover:border-orange-500/40 hover:bg-orange-500/5 text-neutral-400 hover:text-white transition-all text-[10px] font-mono font-bold tracking-wider"
                    >
                      <Search className="w-3 h-3 text-orange-500" />
                      <span>OPEN FORM ON GOOGLE</span>
                    </a>
                  </div>
                ) : (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex-1 flex items-center justify-center">
                    <span className="text-[10px] text-neutral-500 font-mono">Alternative Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set log grid */}
      <div className="p-3.5 flex flex-col gap-1.5 bg-neutral-950/20 rounded-b-2xl">
        {/* Grid header */}
        <div className="grid grid-cols-12 gap-2 text-center text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest pb-1 border-b border-neutral-850/45">
          <div className="col-span-2 text-center">SET</div>
          <div className="col-span-4">LBS (WEIGHT)</div>
          <div className="col-span-4">REPS</div>
          <div className="col-span-2 text-right">DONE</div>
        </div>

        {/* Sets items */}
        {trackingEx?.sets.map((set, sIdx) => (
          <div
            key={set.setIndex}
            className={`grid grid-cols-12 gap-2 items-center py-1.5 px-2.5 rounded-lg border transition-all ${
              set.completed
                ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                : "bg-neutral-950/60 border-neutral-850 text-neutral-300"
            }`}
          >
            {/* Set count index */}
            <div className="col-span-2 font-mono text-xs font-black text-center text-neutral-400">
              {set.setIndex}
            </div>

            {/* Weight Controller */}
            <div className="col-span-4 flex items-center justify-center gap-1.5">
              <button
                disabled={set.completed}
                onClick={() => handleUpdateWeight(ex.id, set.setIndex, -5)}
                className="w-6 h-6 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 disabled:opacity-10 text-neutral-300 text-[10px] font-bold rounded-md transition-colors border border-neutral-800/80 cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-xs font-bold w-8 text-center text-white">
                {set.weight}
              </span>
              <button
                disabled={set.completed}
                onClick={() => handleUpdateWeight(ex.id, set.setIndex, 5)}
                className="w-6 h-6 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 disabled:opacity-10 text-neutral-300 text-[10px] font-bold rounded-md transition-colors border border-neutral-800/80 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Reps Controller */}
            <div className="col-span-4 flex items-center justify-center gap-1.5">
              <button
                disabled={set.completed}
                onClick={() => handleUpdateRep(ex.id, set.setIndex, -1)}
                className="w-6 h-6 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 disabled:opacity-10 text-neutral-300 text-[10px] font-bold rounded-md transition-colors border border-neutral-800/80 cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-xs font-bold w-6 text-center text-white">
                {set.reps}
              </span>
              <button
                disabled={set.completed}
                onClick={() => handleUpdateRep(ex.id, set.setIndex, 1)}
                className="w-6 h-6 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 disabled:opacity-10 text-neutral-300 text-[10px] font-bold rounded-md transition-colors border border-neutral-800/80 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Tick off complete checkbox */}
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => handleToggleComplete(ex.id, set.setIndex)}
                className={`w-6 h-6 flex items-center justify-center rounded-md border transition-all cursor-pointer ${
                  set.completed
                    ? "bg-emerald-500 border-emerald-500 text-neutral-950 shadow"
                    : "border-neutral-750 hover:border-orange-500/55 hover:bg-orange-550/5 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from "react";
import { DayWorkout, Exercise, GYM_TIGER_SPLIT } from "../data";
import { WorkoutLog, LoggedExercise, LoggedSet } from "../types";
import { Play, Pause, Square, Check, Flame, HelpCircle, Award, Search, ChevronDown, ChevronUp, Sparkles, ArrowLeft, RefreshCw, LayoutGrid, Eye, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getExerciseDetails, ExerciseExtraInfo } from "../lib/workoutx";

interface ActiveWorkoutProps {
  dayWorkout: DayWorkout;
  userId: string;
  workoutLogs: WorkoutLog[];
  onFinish: (log: WorkoutLog) => void;
  onCancel: () => void;
  onViewDetails: (exercise: Exercise) => void;
  onMinimize?: () => void;
}

export default function ActiveWorkout({ dayWorkout, userId, workoutLogs, onFinish, onCancel, onViewDetails, onMinimize }: ActiveWorkoutProps) {
  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Exercise tracking & layout configuration states
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>(dayWorkout.exercises);
  const [isFocusMode, setIsFocusMode] = useState(true); // Default to Smart Focus Mode
  const [activeExIndex, setActiveExIndex] = useState(0);
  const [swappingExId, setSwappingExId] = useState<string | null>(null);

  // Rest Timer States
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState<number>(0);
  const [nextWorkoutExName, setNextWorkoutExName] = useState<string>("");
  const [isRestCompleted, setIsRestCompleted] = useState<boolean>(false);

  // Exercise tracking state
  const [activeExercises, setActiveExercises] = useState<LoggedExercise[]>(() => {
    return dayWorkout.exercises.map((ex) => {
      const defaultSets: LoggedSet[] = Array.from({ length: ex.sets }).map((_, i) => ({
        setIndex: i + 1,
        weight: 20, // Initial default weight
        reps: parseInt(ex.repsRange.split("-")[0]) || 10,
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

  // Rest countdown timer loop
  useEffect(() => {
    let timer: any = null;
    if (restSecondsLeft !== null && restSecondsLeft > 0) {
      timer = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            // Trigger screen completed pulsing glow state
            setIsRestCompleted(true);
            setTimeout(() => {
              setIsRestCompleted(false);
              setRestSecondsLeft(null);
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [restSecondsLeft]);

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

  // Helper to parse rest string (e.g., "90 sec" or "2-3 min") into seconds
  const parseRestStringToSeconds = (restStr: string): number => {
    const clean = restStr.toLowerCase().trim();
    if (clean.includes("min")) {
      // check for ranges like "2-3 min"
      const matchRange = clean.match(/(\d+)\s*-\s*(\d+)/);
      if (matchRange) {
        const min = parseInt(matchRange[1]);
        const max = parseInt(matchRange[2]);
        return Math.round(((min + max) / 2) * 60);
      }
      const matchSingle = clean.match(/(\d+)/);
      if (matchSingle) {
        return parseInt(matchSingle[1]) * 60;
      }
      return 120; // default 2 mins
    }
    const matchSec = clean.match(/(\d+)/);
    if (matchSec) {
      return parseInt(matchSec[1]);
    }
    return 60; // default 60 sec
  };

  const handleToggleComplete = (exId: string, setIndex: number) => {
    let wasCompleted = false;
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.setIndex !== setIndex) return s;
            wasCompleted = s.completed;
            return { ...s, completed: !s.completed };
          }),
        };
      })
    );

    // Trigger rest timer only when checking set as completed (changing false -> true)
    if (!wasCompleted) {
      const currentExIdx = workoutExercises.findIndex((e) => e.id === exId);
      const currentEx = workoutExercises[currentExIdx];
      if (currentEx) {
        const secs = parseRestStringToSeconds(currentEx.rest);
        setRestSecondsLeft(secs);
        setRestTotal(secs);
        setIsRestCompleted(false);

        // Compute the next target set/movement name
        const nextTargetInfo = (() => {
          if (setIndex < currentEx.sets) {
            return `${currentEx.name} - Set ${setIndex + 1}`;
          }
          if (currentExIdx < workoutExercises.length - 1) {
            const nextEx = workoutExercises[currentExIdx + 1];
            return `${nextEx.name} - Set 1`;
          }
          return "Finish Workout!";
        })();
        setNextWorkoutExName(nextTargetInfo);
      }
    }
  };

  const handleSwapExercise = (exId: string, altName: string) => {
    // Look up alternative details in the database split program
    let foundEx: Exercise | undefined;
    for (const split of GYM_TIGER_SPLIT) {
      foundEx = split.exercises.find((e) => e.name.toLowerCase() === altName.toLowerCase());
      if (foundEx) break;
    }

    const currentEx = activeExercises.find((ae) => ae.exerciseId === exId);
    const currentSetsCount = currentEx?.sets.length || 3;
    const defaultReps = foundEx ? parseInt(foundEx.repsRange.split("-")[0]) || 10 : 10;

    const swappedLoggedEx: LoggedExercise = {
      exerciseId: foundEx ? foundEx.id : `swap-${altName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: altName,
      category: foundEx ? foundEx.category : currentEx?.category || "Hypertrophy",
      sets: Array.from({ length: currentSetsCount }).map((_, i) => ({
        setIndex: i + 1,
        weight: currentEx?.sets[i]?.weight || 20,
        reps: defaultReps,
        completed: false,
      })),
    };

    // Replace in tracking state
    setActiveExercises((prev) =>
      prev.map((ae) => (ae.exerciseId === exId ? swappedLoggedEx : ae))
    );

    // Replace in layout template state
    const swappedExTemplate: Exercise = foundEx || {
      id: swappedLoggedEx.exerciseId,
      name: altName,
      target: currentEx?.category || "Hypertrophy",
      category: currentEx?.category || "Hypertrophy",
      sets: currentSetsCount,
      repsRange: "8-12",
      rest: "60 sec",
      instructions: ["Perform with controlled eccentric and high mind-muscle connection."],
      tigerTip: "Focus on V-taper form alignment.",
      alternatives: [],
    };

    setWorkoutExercises((prev) =>
      prev.map((e) => (e.id === exId ? swappedExTemplate : e))
    );

    setSwappingExId(null);
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

  // Helper selectors for Progressive Overload alerts
  const getPreviousPerformance = (exerciseName: string) => {
    if (!workoutLogs || workoutLogs.length === 0) return null;
    const sortedLogs = [...workoutLogs].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    for (const log of sortedLogs) {
      const foundEx = log.exercises.find(
        (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
      );
      if (foundEx) {
        const completedSets = foundEx.sets.filter((s) => s.completed);
        if (completedSets.length > 0) return completedSets;
      }
    }
    return null;
  };

  const getOverloadTarget = (exerciseName: string, repsRange: string) => {
    const prevSets = getPreviousPerformance(exerciseName);
    if (!prevSets || prevSets.length === 0) {
      return { hasPrev: false, message: "Baseline session: Focus on slow negatives and setup!" };
    }

    const maxWeight = Math.max(...prevSets.map((s) => s.weight));
    const maxRepsForMaxWeight = Math.max(
      ...prevSets.filter((s) => s.weight === maxWeight).map((s) => s.reps)
    );

    const repsParts = repsRange.split("-");
    const minRepTarget = parseInt(repsParts[0]) || 8;
    const maxRepTarget = parseInt(repsParts[1] || repsParts[0]) || 12;

    if (maxRepsForMaxWeight >= maxRepTarget) {
      const suggestedWeight = maxWeight + 5;
      return {
        hasPrev: true,
        prevWeight: maxWeight,
        prevReps: maxRepsForMaxWeight,
        suggestedWeight,
        suggestedReps: minRepTarget,
        message: `🔥 OVERLOAD TARGET: Lift ${suggestedWeight} lbs for ${minRepTarget} reps (+5 lbs load beat last session of ${maxWeight} lbs x ${maxRepsForMaxWeight} reps!)`
      };
    } else {
      const suggestedReps = maxRepsForMaxWeight + 1;
      return {
        hasPrev: true,
        prevWeight: maxWeight,
        prevReps: maxRepsForMaxWeight,
        suggestedWeight: maxWeight,
        suggestedReps,
        message: `🔥 OVERLOAD TARGET: Hit ${suggestedReps} reps with ${maxWeight} lbs (+1 rep volume to beat last session of ${maxWeight} lbs x ${maxRepsForMaxWeight} reps!)`
      };
    }
  };

  // Helper selector for V-Taper muscle completion tracking
  const getMuscleGroupProgress = (muscleCategory: string) => {
    const matchingExercises = activeExercises.filter((ae) => {
      const cat = ae.category.toLowerCase();
      if (muscleCategory === "lats") {
        return cat.includes("width") || cat.includes("back") || cat.includes("lats") || cat.includes("mid back");
      }
      if (muscleCategory === "shoulders") {
        return cat.includes("shoulder") || cat.includes("delt");
      }
      if (muscleCategory === "lower_back") {
        return cat.includes("low back") || cat.includes("lower back");
      }
      if (muscleCategory === "traps") {
        return cat.includes("traps");
      }
      return false;
    });

    if (matchingExercises.length === 0) return { active: false, percent: 0 };
    
    const totalSets = matchingExercises.flatMap((e) => e.sets).length;
    const completedSets = matchingExercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
    const percent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    return { active: true, percent };
  };

  const totalSets = activeExercises.flatMap((e) => e.sets).length;
  const completedSets = activeExercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const latsProg = getMuscleGroupProgress("lats");
  const shouldersProg = getMuscleGroupProgress("shoulders");
  const lowBackProg = getMuscleGroupProgress("lower_back");
  const trapsProg = getMuscleGroupProgress("traps");

  // Determine if active exercise in Focus Mode is completed
  const activeEx = workoutExercises[activeExIndex];
  const activeTrackingEx = activeExercises.find((ae) => ae.exerciseId === activeEx?.id);
  const isActiveExDone = activeTrackingEx?.sets.every((s) => s.completed) ?? false;

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col font-sans relative overflow-x-hidden" id="active-workout-console">
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none animate-blob-1" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-lime-500/10 blur-[150px] pointer-events-none animate-blob-2" />

      {/* Header section with brand-new premium HUD styling */}
      <header className="sticky top-0 z-45 liquid-glass border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-xl rounded-b-[2rem]">
        <div className="flex items-center gap-2.5">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="mr-1 p-2.5 bg-white/3 border border-white/5 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Minimize & Return to Home Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="bg-pink-500/15 border border-pink-500/25 text-pink-500 p-2 rounded-2xl hidden sm:block shadow-[0_0_15px_rgba(236,72,153,0.15)]">
            <Flame className="w-5 h-5 glow-pink animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black tracking-widest text-pink-500 uppercase glow-pink">
              {dayWorkout.dayName} • {dayWorkout.focus.join(", ")}
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight uppercase mt-0.5">{dayWorkout.title}</h1>
          </div>
        </div>

        {/* Setup view toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-black/60 p-0.5 rounded-lg border border-white/5 select-none text-[9.5px] font-mono font-black">
            <button
              onClick={() => setIsFocusMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all cursor-pointer ${isFocusMode ? "bg-pink-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.3)]" : "text-neutral-450 hover:text-white"}`}
            >
              <Eye className="w-3 h-3" /> FOCUS
            </button>
            <button
              onClick={() => setIsFocusMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all cursor-pointer ${!isFocusMode ? "bg-pink-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.3)]" : "text-neutral-450 hover:text-white"}`}
            >
              <LayoutGrid className="w-3 h-3" /> LIST
            </button>
          </div>

          {/* Timer stopwatch */}
          <div className="flex items-center gap-2.5 bg-black/45 border border-white/5 px-3.5 py-1.5 rounded-full shadow-inner">
            <span className="font-mono text-xs sm:text-sm font-black text-pink-500 glow-pink tracking-wider">
              {formatTime(seconds)}
            </span>
            <button
              onClick={() => setIsActive(!isActive)}
              className="hover:text-pink-500 transition-colors text-neutral-450 cursor-pointer"
              title={isActive ? "Pause Timer" : "Resume Timer"}
            >
              {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main workout screen */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-5 pb-28 z-10">
        
        {/* Visual Dashboard Panel: Progress & SVG Muscle Map */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Progress Card */}
          <div className="md:col-span-2 liquid-glass rounded-[2rem] p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[9px] text-pink-500 font-mono font-black uppercase tracking-widest glow-pink">Hypertrophy Progress</span>
              <h2 className="text-base font-black text-white tracking-tight uppercase">Tearing Through Sets</h2>
              <p className="text-[11px] text-neutral-400 mt-1">
                Completed <span className="font-extrabold text-white">{completedSets}</span> of <span className="font-extrabold text-white">{totalSets}</span> sets. Squeeze each contraction!
              </p>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg width="56" height="56" className="transform -rotate-90">
                  <circle stroke="rgba(255, 255, 255, 0.05)" fill="transparent" strokeWidth="6" r="22" cx="28" cy="28" />
                  <motion.circle
                    stroke="url(#active-progress-gradient)"
                    fill="transparent"
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 22}
                    initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 22 - (progressPercent / 100) * (2 * Math.PI * 22) }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    r="22"
                    cx="28"
                    cy="28"
                  />
                  <defs>
                    <linearGradient id="active-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-[10px] font-black text-white font-mono">{progressPercent}%</span>
              </div>

              {/* Muscle completion overview pills */}
              <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold uppercase tracking-wider">
                {latsProg.active && (
                  <span className={`px-2.5 py-1 rounded-full border ${latsProg.percent === 100 ? "bg-pink-500/10 border-pink-500/30 text-pink-400 glow-pink" : "bg-white/3 border-white/5 text-neutral-400"}`}>
                    Lats: {Math.round(latsProg.percent)}%
                  </span>
                )}
                {shouldersProg.active && (
                  <span className={`px-2.5 py-1 rounded-full border ${shouldersProg.percent === 100 ? "bg-pink-500/10 border-pink-500/30 text-pink-400 glow-pink" : "bg-white/3 border-white/5 text-neutral-400"}`}>
                    Delts: {Math.round(shouldersProg.percent)}%
                  </span>
                )}
                {lowBackProg.active && (
                  <span className={`px-2.5 py-1 rounded-full border ${lowBackProg.percent === 100 ? "bg-pink-500/10 border-pink-500/30 text-pink-400 glow-pink" : "bg-white/3 border-white/5 text-neutral-400"}`}>
                    Lower Back: {Math.round(lowBackProg.percent)}%
                  </span>
                )}
                {trapsProg.active && (
                  <span className={`px-2.5 py-1 rounded-full border ${trapsProg.percent === 100 ? "bg-pink-500/10 border-pink-500/30 text-pink-400 glow-pink" : "bg-white/3 border-white/5 text-neutral-400"}`}>
                    Traps: {Math.round(trapsProg.percent)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* V-Taper SVG Muscle Map */}
          <div className="liquid-glass rounded-[2rem] p-4 border border-white/5 flex flex-col items-center justify-between shadow-2xl relative">
            <span className="text-[8.5px] text-neutral-450 font-mono font-black uppercase tracking-widest text-center">V-Taper Activation</span>
            
            <div className="w-28 h-28 my-1 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="traps-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="delts-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                  <linearGradient id="lats-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#84cc16" />
                  </linearGradient>
                  <linearGradient id="lowback-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Traps */}
                <path
                  d="M 100 30 L 125 60 L 100 80 L 75 60 Z"
                  fill={trapsProg.active ? "url(#traps-grad)" : "rgba(255,255,255,0.03)"}
                  fillOpacity={trapsProg.active ? 0.25 + (trapsProg.percent / 100) * 0.75 : 1}
                  stroke={trapsProg.active ? (trapsProg.percent > 0 ? "#ec4899" : "rgba(236,72,153,0.35)") : "rgba(255,255,255,0.06)"}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />

                {/* Left Shoulder (Deltoid) */}
                <path
                  d="M 70 58 C 50 65, 42 90, 60 110 C 65 105, 70 85, 74 65 Z"
                  fill={shouldersProg.active ? "url(#delts-grad)" : "rgba(255,255,255,0.03)"}
                  fillOpacity={shouldersProg.active ? 0.25 + (shouldersProg.percent / 100) * 0.75 : 1}
                  stroke={shouldersProg.active ? (shouldersProg.percent > 0 ? "#ec4899" : "rgba(236,72,153,0.35)") : "rgba(255,255,255,0.06)"}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />

                {/* Right Shoulder (Deltoid) */}
                <path
                  d="M 130 58 C 150 65, 158 90, 140 110 C 135 105, 130 85, 126 65 Z"
                  fill={shouldersProg.active ? "url(#delts-grad)" : "rgba(255,255,255,0.03)"}
                  fillOpacity={shouldersProg.active ? 0.25 + (shouldersProg.percent / 100) * 0.75 : 1}
                  stroke={shouldersProg.active ? (shouldersProg.percent > 0 ? "#ec4899" : "rgba(236,72,153,0.35)") : "rgba(255,255,255,0.06)"}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />

                {/* Left Lat */}
                <path
                  d="M 82 110 C 58 130, 50 170, 85 190 C 95 170, 95 130, 96 110 Z"
                  fill={latsProg.active ? "url(#lats-grad)" : "rgba(255,255,255,0.03)"}
                  fillOpacity={latsProg.active ? 0.25 + (latsProg.percent / 100) * 0.75 : 1}
                  stroke={latsProg.active ? (latsProg.percent > 0 ? "#84cc16" : "rgba(132,204,22,0.35)") : "rgba(255,255,255,0.06)"}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />

                {/* Right Lat */}
                <path
                  d="M 118 110 C 142 130, 150 170, 115 190 C 105 170, 105 130, 104 110 Z"
                  fill={latsProg.active ? "url(#lats-grad)" : "rgba(255,255,255,0.03)"}
                  fillOpacity={latsProg.active ? 0.25 + (latsProg.percent / 100) * 0.75 : 1}
                  stroke={latsProg.active ? (latsProg.percent > 0 ? "#84cc16" : "rgba(132,204,22,0.35)") : "rgba(255,255,255,0.06)"}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />

                {/* Lower Back */}
                <path
                  d="M 88 111 L 112 111 L 108 190 L 92 190 Z"
                  fill={lowBackProg.active ? "url(#lowback-grad)" : "rgba(255,255,255,0.03)"}
                  fillOpacity={lowBackProg.active ? 0.25 + (lowBackProg.percent / 100) * 0.75 : 1}
                  stroke={lowBackProg.active ? (lowBackProg.percent > 0 ? "#84cc16" : "rgba(132,204,22,0.35)") : "rgba(255,255,255,0.06)"}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />
              </svg>
            </div>
            
            <span className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest text-center">Glow corresponds to sets completed</span>
          </div>
        </div>

        {/* Smart Routine Flow (Focus Mode Carousel) vs Scrollable List */}
        {isFocusMode ? (
          <div className="flex flex-col gap-4">
            {/* Horizontal Exercise Bubble Navigator */}
            <div className="liquid-glass rounded-2xl p-3 flex items-center justify-between gap-3 overflow-x-auto border border-white/5 scrollbar-none">
              <div className="flex items-center gap-2">
                {workoutExercises.map((ex, idx) => {
                  const trackingEx = activeExercises.find((ae) => ae.exerciseId === ex.id);
                  const isDone = trackingEx?.sets.every((s) => s.completed) ?? false;
                  const isActive = activeExIndex === idx;

                  return (
                    <button
                      key={ex.id}
                      onClick={() => setActiveExIndex(idx)}
                      className={`h-9 px-3.5 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-mono font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                        isActive
                          ? "bg-pink-500/10 text-pink-400 border-pink-500/40 glow-pink"
                          : isDone
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-white/3 border-white/5 text-neutral-500 hover:text-white"
                      }`}
                    >
                      <span>{idx + 1}</span>
                      <span className="max-w-[70px] truncate hidden sm:block">{ex.name}</span>
                      {isDone && <Check className="w-3 h-3 text-emerald-450 stroke-[3px]" />}
                    </button>
                  );
                })}
              </div>
              
              <span className="text-[9px] font-mono font-black text-neutral-500 uppercase shrink-0 px-2 tracking-wider">
                {activeExIndex + 1} of {workoutExercises.length} EX
              </span>
            </div>

            {/* Focused Active Card Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEx?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {activeEx && (
                  <ActiveExerciseCard
                    ex={activeEx}
                    exIdx={activeExIndex}
                    trackingEx={activeTrackingEx}
                    onViewDetails={onViewDetails}
                    handleUpdateWeight={handleUpdateWeight}
                    handleUpdateRep={handleUpdateRep}
                    handleToggleComplete={handleToggleComplete}
                    getOverloadTarget={getOverloadTarget}
                    getPreviousPerformance={getPreviousPerformance}
                    swappingExId={swappingExId}
                    setSwappingExId={setSwappingExId}
                    handleSwapExercise={handleSwapExercise}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Smart Navigation Nudge bottom bar */}
            <div className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/5">
              <button
                disabled={activeExIndex === 0}
                onClick={() => setActiveExIndex((prev) => prev - 1)}
                className="px-4 py-2 text-[10px] font-mono font-black uppercase bg-white/3 border border-white/5 hover:bg-white/5 rounded-xl disabled:opacity-20 cursor-pointer"
              >
                ← Prev Exercise
              </button>

              <div className="flex items-center gap-2">
                {isActiveExDone ? (
                  activeExIndex < workoutExercises.length - 1 ? (
                    <motion.button
                      initial={{ scale: 0.95 }}
                      animate={{ scale: [0.98, 1.02, 0.98] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      onClick={() => setActiveExIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 text-[10px] font-mono font-black uppercase btn-liquid-pink text-white rounded-xl shadow-lg cursor-pointer"
                    >
                      Next Exercise: {workoutExercises[activeExIndex + 1]?.name} →
                    </motion.button>
                  ) : (
                    <span className="text-[10px] font-mono font-black text-pink-400 glow-pink uppercase tracking-widest animate-pulse">
                      🎉 All movements complete! Lock in finished lift below.
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-mono font-bold text-neutral-550 uppercase tracking-wide">
                    Complete all sets to unlock next movement
                  </span>
                )}
              </div>

              <button
                disabled={activeExIndex === workoutExercises.length - 1}
                onClick={() => setActiveExIndex((prev) => prev + 1)}
                className="px-4 py-2 text-[10px] font-mono font-black uppercase bg-white/3 border border-white/5 hover:bg-white/5 rounded-xl disabled:opacity-20 cursor-pointer"
              >
                Skip Next →
              </button>
            </div>
          </div>
        ) : (
          /* Scrollable List View of all exercises */
          <div className="flex flex-col gap-6">
            {workoutExercises.map((ex, exIdx) => {
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
                  getOverloadTarget={getOverloadTarget}
                  getPreviousPerformance={getPreviousPerformance}
                  swappingExId={swappingExId}
                  setSwappingExId={setSwappingExId}
                  handleSwapExercise={handleSwapExercise}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Persistent global footer workout-HUD buttons */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/85 border-t border-white/5 px-4 py-4 flex items-center justify-center shadow-2xl backdrop-blur-xl">
        <div className="max-w-4xl w-full flex items-center justify-between gap-3 sm:gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-white/3 hover:bg-white/5 border border-white/5 text-neutral-400 hover:text-white font-black text-[10px] sm:text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
          >
            Quit Session
          </button>

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="flex-1 px-4 py-3 bg-white/3 hover:bg-white/5 border border-white/5 text-neutral-200 hover:text-white font-black text-[10px] sm:text-xs tracking-wider uppercase rounded-xl transition-all text-center cursor-pointer"
            >
              Minimize Workout
            </button>
          )}

          <button
            onClick={handleCompleteWorkout}
            className="btn-liquid-pink flex-1 max-w-sm text-white font-black text-[10px] sm:text-xs tracking-widest uppercase py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 select-none active:scale-98 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Finish Lift</span>
          </button>
        </div>
      </footer>

      {/* Immersive Rest Timer Overlay */}
      <AnimatePresence>
        {restSecondsLeft !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center transition-colors duration-500 ${
              isRestCompleted ? "bg-emerald-950/95 backdrop-blur-2xl" : "bg-[#050508]/95 backdrop-blur-xl"
            }`}
          >
            {/* Visual Ring and Countdown Clock */}
            <div className="relative flex items-center justify-center w-[220px] h-[220px] mb-8 select-none">
              {/* Outer pulsing shadow ring */}
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-25 animate-pulse transition-colors duration-500 ${
                isRestCompleted ? "bg-emerald-500" : "bg-pink-500"
              }`} />
              
              <svg width="220" height="220" className="transform -rotate-90">
                <circle
                  stroke="rgba(255, 255, 255, 0.03)"
                  fill="transparent"
                  strokeWidth="10"
                  r="90"
                  cx="110"
                  cy="110"
                />
                <motion.circle
                  stroke={isRestCompleted ? "#10b981" : "url(#rest-progress-gradient)"}
                  fill="transparent"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={
                    restSecondsLeft !== null && restTotal > 0
                      ? (2 * Math.PI * 90) - (restSecondsLeft / restTotal) * (2 * Math.PI * 90)
                      : 0
                  }
                  strokeLinecap="round"
                  r="90"
                  cx="110"
                  cy="110"
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="rest-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
                    <stop offset="100%" stopColor="#d946ef" stopOpacity="1" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center">
                {isRestCompleted ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.9, 1.1, 1] }}
                    className="flex flex-col items-center"
                  >
                    <Flame className="w-10 h-10 text-emerald-400 animate-bounce" />
                    <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight uppercase mt-1">GO TIME!</span>
                  </motion.div>
                ) : (
                  <>
                    <span className="text-xs text-neutral-500 font-mono font-black uppercase tracking-widest mb-1">Rest Remaining</span>
                    <span className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(236,72,153,0.35)]">
                      {restSecondsLeft}s
                    </span>
                    <span className="text-[9px] text-neutral-400 font-mono font-semibold uppercase tracking-widest mt-1">
                      of {restTotal}s
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Next Movement Hud Info */}
            <div className="max-w-md bg-white/2 border border-white/5 p-5 rounded-[2rem] shadow-xl mb-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 pointer-events-none" />
              <span className="text-[10px] text-pink-500 font-mono font-black uppercase tracking-widest glow-pink block mb-1">NEXT SET TARGET</span>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight leading-tight">
                {nextWorkoutExName}
              </h3>
              <p className="text-[11.5px] text-neutral-400 mt-2 font-medium">
                Pack your shoulder blades, brace your core, and prepare for perfect range of motion.
              </p>
            </div>

            {/* Action Buttons */}
            {!isRestCompleted && (
              <div className="flex gap-4 items-center max-w-sm w-full">
                <button
                  onClick={() => {
                    setRestSecondsLeft((prev) => (prev !== null ? prev + 30 : 30));
                    setRestTotal((prev) => prev + 30);
                  }}
                  className="flex-1 bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-xs font-mono font-black uppercase text-neutral-350 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+30s Rest</span>
                </button>
                <button
                  onClick={() => {
                    setRestSecondsLeft(null);
                    setIsRestCompleted(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-3.5 rounded-2xl font-mono font-black text-xs uppercase shadow-lg shadow-pink-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Skip Rest
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Interactive Subcomponent for Active Exercise Cards
 */
interface ActiveExerciseCardProps {
  ex: Exercise;
  exIdx: number;
  trackingEx: LoggedExercise | undefined;
  onViewDetails: (exercise: Exercise) => void;
  handleUpdateWeight: (exId: string, setIndex: number, delta: number) => void;
  handleUpdateRep: (exId: string, setIndex: number, delta: number) => void;
  handleToggleComplete: (exId: string, setIndex: number) => void;
  getOverloadTarget: (exerciseName: string, repsRange: string) => { hasPrev: boolean; prevWeight?: number; prevReps?: number; message: string };
  getPreviousPerformance: (exerciseName: string) => LoggedSet[] | null;
  swappingExId: string | null;
  setSwappingExId: (exId: string | null) => void;
  handleSwapExercise: (exId: string, altName: string) => void;
}

function ActiveExerciseCard({
  ex,
  exIdx,
  trackingEx,
  onViewDetails,
  handleUpdateWeight,
  handleUpdateRep,
  handleToggleComplete,
  getOverloadTarget,
  getPreviousPerformance,
  swappingExId,
  setSwappingExId,
  handleSwapExercise
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

  const overload = getOverloadTarget(ex.name, ex.repsRange);
  const prevSets = getPreviousPerformance(ex.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="liquid-glass rounded-[2rem] overflow-hidden shadow-lg border border-white/5 group relative"
      id={`exercise-card-${ex.id}`}
    >
      {/* Exercise Swap Selection Overlay Dropdown */}
      <AnimatePresence>
        {swappingExId === ex.id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 p-6 flex flex-col justify-center items-center gap-4"
          >
            <div className="text-center">
              <span className="text-[9px] font-mono font-black text-pink-500 uppercase tracking-widest glow-pink block mb-1">Equipment Busy?</span>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-tight">Swap "{ex.name}"</h4>
              <p className="text-[10px] text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Substitute this workout with a predefined biomechanically matching hypertrophy alternative.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              {ex.alternatives && ex.alternatives.length > 0 ? (
                ex.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSwapExercise(ex.id, alt)}
                    className="px-4 py-2.5 bg-white/3 border border-white/5 hover:border-pink-550/30 hover:bg-pink-500/5 text-white font-mono font-black text-[9.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-left flex items-center justify-between"
                  >
                    <span>{alt}</span>
                    <RefreshCw className="w-3 h-3 text-pink-500" />
                  </button>
                ))
              ) : (
                <span className="text-[9.5px] font-mono text-neutral-500 text-center uppercase py-2">No alternatives defined for this split</span>
              )}

              <button
                onClick={() => setSwappingExId(null)}
                className="mt-2 text-[9px] font-mono font-black uppercase text-neutral-500 hover:text-white py-1 select-none cursor-pointer"
              >
                Cancel Swap
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise banner */}
      <div className="bg-white/3 px-5 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono font-black rounded-full uppercase tracking-wider glow-pink">
              {ex.category}
            </span>
            <span className="px-2.5 py-0.5 text-[9px] bg-white/5 text-neutral-350 border border-white/5 font-mono rounded-full font-bold">
              ⏱️ {ex.rest} REST
            </span>
            {ex.alternatives && ex.alternatives.length > 0 && (
              <button
                onClick={() => setSwappingExId(ex.id)}
                className="flex items-center gap-1 px-2.5 py-0.5 text-[8.5px] bg-lime-500/10 text-lime-400 border border-lime-500/20 font-mono rounded-full font-black uppercase hover:bg-lime-550/20 cursor-pointer transition-all ml-1"
                title="Swap with Alternative Exercise"
              >
                <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Swap
              </button>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-white mt-2.5 uppercase tracking-tight group-hover:text-pink-500 transition-colors">
            {ex.name}
          </h3>
          <p className="text-[10px] text-neutral-400 font-mono mt-0.5 uppercase tracking-wider font-bold">{ex.target}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick toggle for dynamic GIF & Alternates */}
          <button
            onClick={() => setShowGizmo(!showGizmo)}
            className={`flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider px-3 py-2 rounded-xl border transition-all select-none cursor-pointer ${
              showGizmo
                ? "bg-pink-500/10 text-pink-400 border-pink-500/30 glow-pink"
                : "bg-white/3 text-neutral-450 border-white/5 hover:text-white hover:bg-white/5"
            }`}
            title="Toggle Live Demo & Alternate Drill"
          >
            <span>Media</span>
            {showGizmo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onViewDetails(ex)}
            className="flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-wider text-neutral-450 hover:text-white bg-white/3 hover:bg-white/5 border border-white/5 px-3 py-2 rounded-xl transition-all select-none cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-405" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Progressive Overload Alert Banner */}
      <div className="px-5 py-3 border-b border-white/5 bg-pink-500/2 flex items-start gap-2">
        <span className="text-[10px] font-black text-pink-500 font-mono mt-0.5 tracking-wider uppercase shrink-0 glow-pink">Target: </span>
        <p className="text-[11px] text-neutral-300 leading-relaxed font-sans font-medium">{overload.message}</p>
      </div>

      {/* Toggleable WorkoutX GIF and Alternate Exercise visual board */}
      <AnimatePresence>
        {showGizmo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/5 bg-black/30 overflow-hidden"
          >
            <div className="p-4 flex flex-col md:flex-row gap-4">
              {/* GIF Player Box */}
              <div className="flex-1 min-w-[140px] flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-black">
                  Demo Loop Stream
                </span>
                
                {fetching ? (
                  <div className="aspect-video w-full rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-2 min-h-[140px]">
                    <div className="w-5 h-5 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                    <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold">LOAD STREAM...</span>
                  </div>
                ) : extra?.gifUrl && !mediaErr ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center p-1.5 min-h-[140px]">
                    <img
                      src={extra.gifUrl}
                      alt={ex.name}
                      className="h-full max-h-[140px] object-contain mx-auto mix-blend-lighten pointer-events-none rounded-lg"
                      referrerPolicy="no-referrer"
                      onError={() => setMediaErr(true)}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-2xl bg-black/45 border border-white/5 flex flex-col items-center justify-center p-3 text-center min-h-[140px]">
                    <span className="text-[10px] text-pink-500 font-black uppercase tracking-wider glow-pink">STREAM OFFLINE</span>
                    <span className="text-[9px] text-neutral-500 mt-1 uppercase font-bold">Use Alternatives Below</span>
                  </div>
                )}
              </div>

              {/* Alternate Exercise Card */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-black">
                    Alternative Drills (3 available)
                  </span>
                  {/* Small tabs for checking alternatives */}
                  {extra && extra.alternatives && (
                    <div className="flex gap-0.5 bg-black/50 p-0.5 rounded-lg border border-white/5">
                      {[0, 1, 2].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveAltIdx(idx)}
                          className={`text-[8.5px] font-mono font-black px-2 py-0.5 rounded transition-all select-none cursor-pointer ${
                            activeAltIdx === idx
                              ? "bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                              : "text-neutral-550 hover:text-white"
                          }`}
                        >
                          Alt {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {extra && extra.alternatives ? (
                  <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex-1 flex flex-col justify-between" key={activeAltIdx}>
                    <div>
                      {extra.alternatives[activeAltIdx] && (
                        <>
                          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                            <h4 className="text-[10.5px] font-black text-white uppercase tracking-tight truncate max-w-[150px]" title={extra.alternatives[activeAltIdx].name}>
                              {extra.alternatives[activeAltIdx].name}
                            </h4>
                            <span className="text-[8px] font-mono font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase shrink-0 glow-pink">
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
                      className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-white/5 hover:border-pink-500/30 hover:bg-pink-500/5 text-neutral-400 hover:text-white transition-all text-[9px] font-mono font-black tracking-wider uppercase"
                    >
                      <Search className="w-3 h-3 text-pink-500" />
                      <span>OPEN FORM ON GOOGLE</span>
                    </a>
                  </div>
                ) : (
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex-1 flex items-center justify-center min-h-[120px]">
                    <span className="text-[9px] text-neutral-500 font-mono font-bold uppercase tracking-wider">Alternative Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set log grid */}
      <div className="p-4 flex flex-col gap-1.5 bg-black/10 rounded-b-[2rem]">
        {/* Grid header */}
        <div className="grid grid-cols-12 gap-2 text-center text-[9px] font-mono font-black text-neutral-500 uppercase tracking-widest pb-2 border-b border-white/5 px-2">
          <div className="col-span-2 text-center">SET</div>
          <div className="col-span-4">LBS (WEIGHT)</div>
          <div className="col-span-4">REPS</div>
          <div className="col-span-2 text-right">DONE</div>
        </div>

        {/* Sets items */}
        {trackingEx?.sets.map((set, sIdx) => {
          const prevSet = prevSets?.[sIdx];

          return (
            <div
              key={set.setIndex}
              className={`flex flex-col gap-1 py-2 px-3 rounded-xl border transition-all ${
                set.completed
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                  : "bg-white/2 border-white/5 text-neutral-350"
              }`}
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Set count index */}
                <div className="col-span-2 font-mono text-[11px] font-black text-center text-neutral-450">
                  {set.setIndex}
                </div>

                {/* Weight Controller */}
                <div className="col-span-4 flex items-center justify-center gap-2">
                  <button
                    disabled={set.completed}
                    onClick={() => handleUpdateWeight(ex.id, set.setIndex, -5)}
                    className="w-7 h-7 flex items-center justify-center bg-white/3 hover:bg-white/7 disabled:opacity-10 text-white text-xs font-black rounded-full border border-white/5 transition-all cursor-pointer active:scale-90"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-black w-8 text-center text-white">
                    {set.weight}
                  </span>
                  <button
                    disabled={set.completed}
                    onClick={() => handleUpdateWeight(ex.id, set.setIndex, 5)}
                    className="w-7 h-7 flex items-center justify-center bg-white/3 hover:bg-white/7 disabled:opacity-10 text-white text-xs font-black rounded-full border border-white/5 transition-all cursor-pointer active:scale-90"
                  >
                    +
                  </button>
                </div>

                {/* Reps Controller */}
                <div className="col-span-4 flex items-center justify-center gap-2">
                  <button
                    disabled={set.completed}
                    onClick={() => handleUpdateRep(ex.id, set.setIndex, -1)}
                    className="w-7 h-7 flex items-center justify-center bg-white/3 hover:bg-white/7 disabled:opacity-10 text-white text-xs font-black rounded-full border border-white/5 transition-all cursor-pointer active:scale-90"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-black w-7 text-center text-white">
                    {set.reps}
                  </span>
                  <button
                    disabled={set.completed}
                    onClick={() => handleUpdateRep(ex.id, set.setIndex, 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white/3 hover:bg-white/7 disabled:opacity-10 text-white text-xs font-black rounded-full border border-white/5 transition-all cursor-pointer active:scale-90"
                  >
                    +
                  </button>
                </div>

                {/* Tick off complete checkbox */}
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => handleToggleComplete(ex.id, set.setIndex)}
                    className={`w-7 h-7 flex items-center justify-center rounded-full border transition-all cursor-pointer ${
                      set.completed
                        ? "bg-emerald-500 border-emerald-500 text-neutral-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        : "border-white/10 hover:border-pink-500/50 hover:bg-pink-500/10 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
                  </button>
                </div>
              </div>

              {/* Set-by-Set Progressive Overload Prompt */}
              {prevSet && (
                <div className="pl-14 text-[9px] font-mono font-bold text-neutral-500 flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/40 inline-block" />
                  <span>Last Session Bench: <span className="text-neutral-400 font-extrabold">{prevSet.weight} lbs</span> x {prevSet.reps} reps</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

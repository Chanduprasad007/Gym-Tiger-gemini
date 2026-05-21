import { useState, useEffect } from "react";
import { GYM_TIGER_SPLIT, Exercise, DayWorkout } from "./data";
import { UserStats, WorkoutLog } from "./types";
import { db, auth, provider, isFirebaseAvailable, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import ActiveWorkout from "./components/ActiveWorkout";
import ExerciseDetailModal from "./components/ExerciseDetailModal";
import HistoryLogs from "./components/HistoryLogs";
import {
  Sparkles,
  Flame,
  Award,
  Calendar,
  LogOut,
  User,
  Plus,
  Compass,
  History,
  Info,
  ChevronRight,
  Database,
  Trophy,
  CheckCircle2,
  Lock,
  Edit2,
  Check,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation & Views State
  const [activeTab, setActiveTab] = useState<"splits" | "history">("splits");
  const [activeWorkout, setActiveWorkout] = useState<DayWorkout | null>(null);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Exercise | null>(null);

  // Authentication & Guest State
  const [currentUser, setCurrentUser] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  // Profile customization modal (for guests and members alike)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameInput, setEditNameInput] = useState("");

  // Complete workout overlay celebration State
  const [celebratedLog, setCelebratedLog] = useState<WorkoutLog | null>(null);

  // Load initial local data (Guest fallback)
  useEffect(() => {
    // Check if firebase Auth is setting up
    if (isFirebaseAvailable && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          try {
            // Get user document in Firestore
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userSnap = await getDoc(userDocRef);

            let profileData: UserStats;
            if (userSnap.exists()) {
              const data = userSnap.data();
              profileData = {
                userId: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: data.displayName || firebaseUser.displayName || "Tiger Fellow",
                streak: data.streak || 0,
                totalWorkouts: data.totalWorkouts || 0,
                lastCompletedDate: data.lastCompletedDate,
              };
            } else {
              // Create user profile
              profileData = {
                userId: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "Tiger Fellow",
                streak: 0,
                totalWorkouts: 0,
                lastCompletedDate: undefined,
              };
              await setDoc(userDocRef, {
                ...profileData,
                updatedAt: new Date().toISOString()
              });
            }

            setCurrentUser(profileData);
            setEditNameInput(profileData.displayName);

            // Fetch logs from Firestore
            const logsPath = `users/${firebaseUser.uid}/workouts`;
            const querySnapshot = await getDocs(collection(db, logsPath));
            const fetchedLogs: WorkoutLog[] = [];
            querySnapshot.forEach((docSnap) => {
              fetchedLogs.push(docSnap.data() as WorkoutLog);
            });

            // Sort logs descending by date
            fetchedLogs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
            setWorkoutLogs(fetchedLogs);
          } catch (err) {
            console.error("Firebase auth initial fetch error, sliding back to Guest storage", err);
            loadLocalStorageFallback();
          }
        } else {
          // No user, load guest data
          loadLocalStorageFallback();
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local Guest fallback
      loadLocalStorageFallback();
      setLoading(false);
    }
  }, []);

  const loadLocalStorageFallback = () => {
    const cachedUser = localStorage.getItem("gym_tiger_user");
    const cachedLogs = localStorage.getItem("gym_tiger_logs");

    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      setCurrentUser(parsed);
      setEditNameInput(parsed.displayName);
    } else {
      const guestObj: UserStats = {
        userId: "guest_tiger",
        email: "guest@gymtiger.local",
        displayName: "Guest Tiger",
        streak: 0,
        totalWorkouts: 0,
      };
      setCurrentUser(guestObj);
      setEditNameInput(guestObj.displayName);
      localStorage.setItem("gym_tiger_user", JSON.stringify(guestObj));
    }

    if (cachedLogs) {
      const logs = JSON.parse(cachedLogs);
      logs.sort((a: WorkoutLog, b: WorkoutLog) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      setWorkoutLogs(logs);
    } else {
      setWorkoutLogs([]);
    }
  };

  // Triggers Google SignIn
  const handleLogin = async () => {
    if (!isFirebaseAvailable || !auth) {
      alert("Firebase is setting up. Try using the Guest features!");
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failure: ", err);
      alert("Sign-in popup was cancelled or blocked. Please try again.");
    }
  };

  // Triggers Sign Out
  const handleLogout = async () => {
    if (isFirebaseAvailable && auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    loadLocalStorageFallback();
  };

  // Core profile saving mechanism
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    const cleanedName = editNameInput.trim() || currentUser.displayName;
    const updatedUser = { ...currentUser, displayName: cleanedName };

    setCurrentUser(updatedUser);
    setIsEditingProfile(false);

    if (isFirebaseAvailable && auth?.currentUser && currentUser.userId !== "guest_tiger") {
      try {
        const userDocRef = doc(db, "users", currentUser.userId);
        await updateDoc(userDocRef, {
          displayName: cleanedName,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.userId}`);
      }
    } else {
      localStorage.setItem("gym_tiger_user", JSON.stringify(updatedUser));
    }
  };

  // Record completed workout
  const handleFinishWorkout = async (newLog: WorkoutLog) => {
    if (!currentUser) return;

    // Filter out completely untracked exercises (no finished sets)
    const filteredExercises = newLog.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.filter((s) => s.completed),
    })).filter((ex) => ex.sets.length > 0);

    if (filteredExercises.length === 0) {
      alert("Check off at least one set before completing your training!");
      return;
    }

    const compiledLog: WorkoutLog = {
      ...newLog,
      exercises: filteredExercises,
    };

    // Calculate dynamic streaks
    // If lastCompletedDate was yesterday, increment streak. If today, keep same. If older, reset to 1.
    const todayStr = new Date().toDateString();
    let newStreak = currentUser.streak;

    if (currentUser.lastCompletedDate) {
      const lastDate = new Date(currentUser.lastCompletedDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.toDateString() === yesterday.toDateString()) {
        newStreak += 1;
      } else if (lastDate.toDateString() !== todayStr) {
        // More than a day gap, start new streak
        newStreak = 1;
      }
    } else {
      newStreak = 1; // First training logged
    }

    const updatedStats: UserStats = {
      ...currentUser,
      streak: newStreak,
      totalWorkouts: currentUser.totalWorkouts + 1,
      lastCompletedDate: new Date().toISOString(),
    };

    const finalLogsList = [compiledLog, ...workoutLogs];

    // Push state updates
    setCurrentUser(updatedStats);
    setWorkoutLogs(finalLogsList);
    setActiveWorkout(null);
    setCelebratedLog(compiledLog); // trigger rewards UI

    // Persist changes
    if (isFirebaseAvailable && auth?.currentUser && currentUser.userId !== "guest_tiger") {
      try {
        // Save Workout Log
        const logId = compiledLog.logId;
        const logPath = `users/${currentUser.userId}/workouts/${logId}`;
        await setDoc(doc(db, "users", currentUser.userId, "workouts", logId), compiledLog);

        // Update User Profile
        const userDocRef = doc(db, "users", currentUser.userId);
        await updateDoc(userDocRef, {
          streak: newStreak,
          totalWorkouts: updatedStats.totalWorkouts,
          lastCompletedDate: updatedStats.lastCompletedDate,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.userId}/workouts/${compiledLog.logId}`);
      }
    } else {
      localStorage.setItem("gym_tiger_user", JSON.stringify(updatedStats));
      localStorage.setItem("gym_tiger_logs", JSON.stringify(finalLogsList));
    }
  };

  // Delete historic session
  const handleDeleteLog = async (logId: string) => {
    if (!currentUser) return;
    const finalLogsList = workoutLogs.filter((l) => l.logId !== logId);
    setWorkoutLogs(finalLogsList);

    if (isFirebaseAvailable && auth?.currentUser && currentUser.userId !== "guest_tiger") {
      try {
        const logDocRef = doc(db, "users", currentUser.userId, "workouts", logId);
        await deleteDoc(logDocRef);

        // Recalculate total workouts
        const userDocRef = doc(db, "users", currentUser.userId);
        // Deduct workout count
        const nextTotal = Math.max(0, currentUser.totalWorkouts - 1);
        setCurrentUser({ ...currentUser, totalWorkouts: nextTotal });
        await updateDoc(userDocRef, {
          totalWorkouts: nextTotal,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.userId}/workouts/${logId}`);
      }
    } else {
      const nextTotal = Math.max(0, currentUser.totalWorkouts - 1);
      const nextUser = { ...currentUser, totalWorkouts: nextTotal };
      setCurrentUser(nextUser);
      localStorage.setItem("gym_tiger_user", JSON.stringify(nextUser));
      localStorage.setItem("gym_tiger_logs", JSON.stringify(finalLogsList));
    }
  };

  // Helper: Checks if a training block has been completed this week
  const isDayCompletedThisWeek = (dayIndex: number) => {
    // Look at logs completed within the last 7 days matching dayIndex
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return workoutLogs.some((log) => {
      const compDate = new Date(log.completedAt);
      return log.dayIndex === dayIndex && compDate.getTime() >= oneWeekAgo.getTime();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center font-sans tracking-wide">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-orange-500/10 p-4 border border-orange-500/20 rounded-full text-orange-500 animate-spin">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <span className="text-xs text-orange-500 font-mono font-bold tracking-widest mt-2 uppercase">
            Summoning Gym Tiger...
          </span>
        </div>
      </div>
    );
  }

  // Swap to active workout screen immediately if a session is actively triggered and not minimized
  if (activeWorkout && !isWorkoutMinimized) {
    return (
      <ActiveWorkout
        dayWorkout={activeWorkout}
        userId={currentUser?.userId || "guest_tiger"}
        onFinish={handleFinishWorkout}
        onCancel={() => {
          if (confirm("Disconnect today's progression? All active sets weight/reps will be lost.")) {
            setActiveWorkout(null);
            setIsWorkoutMinimized(false);
          }
        }}
        onMinimize={() => setIsWorkoutMinimized(true)}
        onViewDetails={(ex) => setSelectedGuide(ex)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-250 flex flex-col font-sans relative pb-10" id="gym-tiger-root">
      
      {/* Dynamic Tiger HUD Bar */}
      <nav className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 shadow-lg select-none">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          {/* Logo brand */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-2.5 py-1 rounded-xl flex items-center justify-center font-extrabold text-sm tracking-tighter">
              G
            </div>
            <h1 className="text-sm font-black font-sans uppercase tracking-widest text-white flex items-center gap-1.5">
              GYM TIGER
              <span className="text-[9px] bg-orange-500/15 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/10 font-mono font-semibold">
                ELITE
              </span>
            </h1>
          </div>

          {/* Cloud Auth / Profile HUD */}
          <div className="flex items-center gap-2">
            {currentUser && currentUser.userId !== "guest_tiger" ? (
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 p-1.5 rounded-full pr-4">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold text-xs">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] font-bold text-neutral-400 capitalize truncate max-w-24 leading-none">{currentUser.displayName}</p>
                  <p className="text-[8px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5 leading-none">
                    <Database className="w-2.5 h-2.5" /> SECURE CLOUD
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-neutral-500 hover:text-white rounded"
                  title="Disconnect account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {isFirebaseAvailable ? (
                  <button
                    onClick={handleLogin}
                    className="text-xs bg-orange-500 hover:bg-orange-400 text-black font-bold px-3 py-1.5 rounded-xl transition-all shadow-md active:scale-95 text-nowrap"
                  >
                    Sync Cloud
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] bg-orange-500/5 text-orange-500 border border-orange-500/10 px-2.5 py-1.5 rounded-xl font-mono">
                    <Database className="w-3 h-3 text-orange-500/80" />
                    <span>LOCAL GUEST PLAY</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Welcome Banner */}
      <header className="px-4 py-8 bg-gradient-to-b from-neutral-900/30 to-transparent border-b border-neutral-900/40">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-orange-500 text-xs font-mono font-bold tracking-widest uppercase mb-1.55">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE COLD HYPERTROPHY METHOD</span>
            </div>
            <h2 className="text-2xl md:text-3.5xl font-black text-white tracking-tight uppercase leading-none">
              SHATTER YOUR SLOUCH. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                FORTIFY THE POSTERIOR.
              </span>
            </h2>
            <p className="text-xs text-neutral-400 max-w-xl mt-3 leading-relaxed">
              Welcome, <span className="text-white font-bold">{currentUser?.displayName}</span>. 
              Gym Tiger is an elite training engine delivering localized lateral lat width, chest width, anti-rotation core raises, and spinal support carries.
            </p>
            
            {/* Quick Profile Modifier trigger */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl transition-all"
              >
                <Edit2 className="w-3 h-3" />
                <span>Rename Avatar</span>
              </button>
            </div>
          </div>

          {/* Premium Bento Stats Boxes */}
          <div className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shrink-0 shadow-inner">
            <div className="flex items-center gap-3 border-r border-neutral-800 pr-4">
              <div className="bg-orange-500/10 text-orange-500 p-3 rounded-2xl border border-orange-500/10 animate-pulse">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest leading-none">STREAK</p>
                <p className="text-xl font-black text-white mt-1 leading-none">{currentUser?.streak || 0} <span className="text-xs font-normal text-neutral-400">Days</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-505/10 text-emerald-400 p-3 rounded-2xl border border-emerald-500/10">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest leading-none">COMPLETED</p>
                <p className="text-xl font-black text-white mt-1 leading-none">{currentUser?.totalWorkouts || 0} <span className="text-xs font-normal text-neutral-400">Logs</span></p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        
        {/* Weekly Split Matrix Indicator HUD */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 mb-8 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-mono font-extrabold text-white tracking-widest uppercase">7-Day Consistency Index</h3>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">7D rolling basis</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
            {GYM_TIGER_SPLIT.map((day) => {
              const completed = isDayCompletedThisWeek(day.dayIndex);
              return (
                <div
                  key={day.dayIndex}
                  className={`border p-3.5 rounded-2xl flex flex-col gap-1 text-center transition-all ${
                    completed
                      ? "bg-orange-600/10 border-orange-500/30 text-orange-400"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <span className="text-[10px] font-mono text-neutral-500 leading-none">{day.dayName}</span>
                  <span className="text-xs font-bold text-white uppercase mt-1 truncate">{day.title.split("&")[0]}</span>
                  {completed ? (
                    <span className="flex items-center justify-center gap-1 text-[9px] font-mono text-orange-400 font-bold mt-1 bg-orange-500/10 py-0.5 rounded-lg">
                      <Check className="w-3 h-3" /> COMPLETED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-neutral-600 mt-1 uppercase block leading-none">INCOMPLETE</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Tab switcher navigation bar */}
        <div className="flex border-b border-neutral-800 gap-6 mb-6">
          <button
            onClick={() => setActiveTab("splits")}
            className={`pb-3 font-bold text-sm uppercase tracking-wide flex items-center gap-2 transition-all relative ${
              activeTab === "splits" ? "text-orange-500" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Training Splits</span>
            {activeTab === "splits" && (
              <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 font-bold text-sm uppercase tracking-wide flex items-center gap-2 transition-all relative ${
              activeTab === "history" ? "text-orange-500" : "text-neutral-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Training Logbook ({workoutLogs.length})</span>
            {activeTab === "history" && (
              <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        </div>

        {/* View content renderer */}
        <AnimatePresence mode="wait">
          {activeTab === "splits" ? (
            <motion.div
              key="splits-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {GYM_TIGER_SPLIT.map((workout) => {
                const isCompleted = isDayCompletedThisWeek(workout.dayIndex);
                return (
                  <div
                    key={workout.dayIndex}
                    className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between hover:border-neutral-700 hover:shadow-xl transition-all shadow-md pr-6"
                    id={`day-workout-${workout.dayIndex}`}
                  >
                    <div>
                      {/* Badge bar */}
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="px-2.5 py-1 bg-orange-550/10 border border-orange-500/20 text-orange-500 rounded-lg text-xs font-mono font-bold">
                          {workout.dayName}
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/5 px-2 py-0.5 font-semibold rounded-full border border-orange-500/10 font-mono">
                            <Check className="w-3.5 h-3.5" /> SECURED
                          </span>
                        )}
                      </div>

                      {/* Header core */}
                      <h3 className="text-base font-extrabold text-white uppercase tracking-tight leading-tight mb-2.5">
                        {workout.title}
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                        {workout.description}
                      </p>

                      {/* Targeted muscles tags */}
                      <div className="flex flex-wrap gap-1.5 mb-5 border-t border-neutral-850 pt-3.5">
                        {workout.focus.map((tgt, i) => (
                          <span
                            key={i}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-400 text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg"
                          >
                            {tgt}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interaction Launch Buttons */}
                    <div className="flex items-center gap-3 border-t border-neutral-800 pt-4 mt-3">
                      <button
                        onClick={() => {
                          setSelectedGuide(workout.exercises[0]);
                        }}
                        className="flex-1 text-center bg-neutral-950 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs uppercase px-4 py-3 border border-neutral-800 rounded-xl transition-colors cursor-pointer select-none"
                      >
                        Inspect Guides
                      </button>

                      <button
                        onClick={() => {
                          if (activeWorkout) {
                            if (confirm(`"${activeWorkout.title}" is currently active in the background. Discard background progress and start this new session?`)) {
                              setActiveWorkout(workout);
                              setIsWorkoutMinimized(false);
                            }
                          } else {
                            setActiveWorkout(workout);
                            setIsWorkoutMinimized(false);
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white font-extrabold text-xs uppercase text-center px-4 py-3.5 rounded-xl transition-all shadow-md select-none cursor-pointer"
                      >
                        Start Session
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="history-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryLogs logs={workoutLogs} onDeleteLog={handleDeleteLog} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- EXERCISE GUIDE FLOATING WINDOWS --- */}
      <AnimatePresence>
        {selectedGuide && (
          <ExerciseDetailModal exercise={selectedGuide} onClose={() => setSelectedGuide(null)} />
        )}
      </AnimatePresence>

      {/* --- RENAME PROFILE DIALOGUE --- */}
      <AnimatePresence>
        {isEditingProfile && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" id="edit-profile-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl p-6"
            >
              <h3 className="text-sm font-extrabold text-white font-sans uppercase tracking-widest leading-none mb-2">
                Customize Avatar Sign
              </h3>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Provide your custom training handle. This will persist on-screen across logs.
              </p>

              <input
                type="text"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                maxLength={20}
                placeholder="Name your Gym Tiger"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold select-none focus:outline-none focus:ring-1 focus:ring-orange-500/50 mb-4"
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditNameInput(currentUser.displayName);
                    setIsEditingProfile(false);
                  }}
                  className="px-4 py-2 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 font-semibold text-xs rounded-xl text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 font-extrabold text-xs text-white rounded-xl active:scale-95 transition-all"
                >
                  Secure Name
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SUCCESS CELEBRATION OVERLAY --- */}
      <AnimatePresence>
        {celebratedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" id="workout-celebration">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border border-orange-500/20 rounded-3xl p-6 text-center shadow-3xl"
            >
              <div className="w-16 h-16 bg-orange-500/10 border-2 border-orange-500/30 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>

              <span className="text-[10px] font-mono font-bold text-orange-500 tracking-widest uppercase">
                SESSION RECORDED
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">
                EXCELLENT LIFTING!
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-2 leading-relaxed">
                Your split entry for <span className="text-white font-bold font-mono">{celebratedLog.workoutName}</span> has been signed into your logs. Keep your spine erect and posture aligned.
              </p>

              {/* Workout stats HUD */}
              <div className="grid grid-cols-2 gap-3 bg-neutral-950 border border-neutral-800 p-4 rounded-2xl my-5 text-left">
                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase leading-none block">Time Under Tension</span>
                  <span className="text-sm font-bold font-mono text-white mt-1 block">
                    {Math.floor(celebratedLog.duration / 60)} mins
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase leading-none block">Sets Checked</span>
                  <span className="text-sm font-bold font-mono text-white mt-1 block">
                    {celebratedLog.exercises.flatMap(e => e.sets).length} sets
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCelebratedLog(null);
                  setActiveTab("history"); // swap to logs so they inspect right away
                }}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white font-extrabold text-sm tracking-wide uppercase py-3.5 rounded-xl shadow-lg transition-all active:scale-98"
              >
                Inspect Training Logbook
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Minimized Active Workout HUD Floater */}
      <AnimatePresence>
        {activeWorkout && isWorkoutMinimized && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-neutral-900 border border-orange-500/30 rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/10 p-2.5 border border-orange-500/20 rounded-xl text-orange-500 animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase tracking-wider">Active Workout Running</p>
                <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[180px] mt-0.5">{activeWorkout.title}</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsWorkoutMinimized(false)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 text-nowrap"
            >
              Resume Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

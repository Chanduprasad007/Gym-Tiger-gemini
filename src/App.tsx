import React, { useState, useEffect } from "react";
import { GYM_TIGER_SPLIT, Exercise, DayWorkout, coachingRules, focusTags } from "./data";
import { UserStats, WorkoutLog } from "./types";
import { db, auth, provider, isFirebaseAvailable, handleFirestoreError, OperationType, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "./lib/firebase";
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
  ChevronUp,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation & Views State
  const [activeTab, setActiveTab] = useState<"splits" | "history">("splits");
  const [activeWorkout, setActiveWorkout] = useState<DayWorkout | null>(null);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Exercise | null>(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const cached = localStorage.getItem("theme");
    return cached === null ? true : cached !== "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Authentication & Guest State
  const [currentUser, setCurrentUser] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthGate, setShowAuthGate] = useState(false); // Default to false
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedRoutineIndex, setExpandedRoutineIndex] = useState<number | null>(null);

  // Profile customization modal (for guests and members alike)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameInput, setEditNameInput] = useState("");
  const [showGitHubGuide, setShowGitHubGuide] = useState(false);

  // Complete workout overlay celebration State
  const [celebratedLog, setCelebratedLog] = useState<WorkoutLog | null>(null);

  // Email/Password login flows
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpNameInput, setSignUpNameInput] = useState("");
  const [authError, setAuthError] = useState("");

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

  // Circular progress data calculations for Liquid UI
  const completedThisWeekCount = GYM_TIGER_SPLIT.filter((day) => isDayCompletedThisWeek(day.dayIndex)).length;
  const completionPercentage = GYM_TIGER_SPLIT.length > 0 
    ? Math.round((completedThisWeekCount / GYM_TIGER_SPLIT.length) * 100) 
    : 0;

  const strokeWidth = 5;
  const radius = 35;
  const normalizedRadius = radius - strokeWidth;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // V-Taper focus calculation (Lat Width, Mid Back, Shoulders, Rear Delt, Traps)
  const getVTaperIntensity = (workout: DayWorkout) => {
    const vTaperTargets = ["Lat Width", "Mid Back", "Shoulders", "Rear Delt", "Traps"];
    let vTaperSets = 0;
    let totalSets = 0;
    workout.exercises.forEach((ex) => {
      totalSets += ex.sets;
      if (vTaperTargets.includes(ex.target)) {
        vTaperSets += ex.sets;
      }
    });
    if (totalSets === 0) return 0;
    return Math.round((vTaperSets / totalSets) * 100);
  };

  const filteredWorkouts = GYM_TIGER_SPLIT.filter((workout) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "Back & Lats") {
      return workout.focus.includes("Lat Width") || workout.focus.includes("Mid Back") || workout.focus.includes("Lower Back");
    }
    if (activeCategory === "Shoulders") {
      return workout.focus.includes("Shoulders") || workout.focus.includes("Rear Delt") || workout.focus.includes("Traps");
    }
    if (activeCategory === "Chest & Abs") {
      return workout.focus.includes("Chest") || workout.focus.includes("Core/Abs") || workout.focus.includes("Triceps");
    }
    if (activeCategory === "Legs") {
      return workout.focus.includes("Legs");
    }
    return true;
  });

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseAvailable || !auth) {
      setAuthError("Firebase services are currently unreachable.");
      return;
    }
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail || !passwordInput) {
      setAuthError("Email and Password are required.");
      return;
    }
    setAuthError("");
    setLoading(true);
    try {
      localStorage.setItem("gym_tiger_was_guest", "false");
      await signInWithEmailAndPassword(auth, trimmedEmail, passwordInput);
    } catch (err: any) {
      console.error("Email login failure: ", err);
      let clientMsg = "Authentication failed. Please verify email and password.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        clientMsg = "Invalid email address or incorrect password. Please verify and retry.";
      } else if (err.code === "auth/invalid-email") {
        clientMsg = "Invalid email format.";
      } else if (err.code === "auth/configuration-not-found") {
        clientMsg = "Email/Password sign-in is disabled. Please enable 'Email/Password' in Firebase Console.";
      }
      setAuthError(clientMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseAvailable || !auth) {
      setAuthError("Firebase services are currently unreachable.");
      return;
    }
    const trimmedEmail = emailInput.trim();
    const trimmedName = signUpNameInput.trim();
    if (!trimmedEmail || !passwordInput || !trimmedName) {
      setAuthError("All registration fields are strictly required.");
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError("Safety Policy: Passwords must be at least 6 characters.");
      return;
    }
    setAuthError("");
    setLoading(true);
    try {
      localStorage.setItem("gym_tiger_was_guest", "false");
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, passwordInput);
      
      // We will save the Display Name instantly into the Firestore user document
      const userDocRef = doc(db, "users", cred.user.uid);
      const profileData: UserStats = {
        userId: cred.user.uid,
        email: trimmedEmail,
        displayName: trimmedName,
        streak: 0,
        totalWorkouts: 0,
        lastCompletedDate: null,
      };
      await setDoc(userDocRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      
      setCurrentUser(profileData);
      setEditNameInput(profileData.displayName);
      setShowAuthGate(false);
    } catch (err: any) {
      console.error("Email registration failure: ", err);
      let clientMsg = "Registration failed. Ensure email is not already registered.";
      if (err.code === "auth/email-already-in-use") {
        clientMsg = "This email is already linked to another Gym - Gemini profile.";
      } else if (err.code === "auth/invalid-email") {
        clientMsg = "Invalid email address format.";
      } else if (err.code === "auth/weak-password") {
        clientMsg = "Select a stronger password (at least 6 characters).";
      } else if (err.code === "auth/configuration-not-found") {
        clientMsg = "Email/Password sign-up is disabled. Please enable 'Email/Password' authentication in your Firebase Console under Authentication > Sign-in method.";
      }
      setAuthError(clientMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load initial local data (Guest fallback)
  useEffect(() => {
    setLoading(true);
    loadLocalStorageFallback();
    setShowAuthGate(false);
    setLoading(false);
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
        email: "guest@gymgemini.local",
        displayName: "Athlete",
        streak: 0,
        totalWorkouts: 0,
        lastCompletedDate: null,
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

  const handleProceedAsGuest = () => {
    localStorage.setItem("gym_tiger_was_guest", "true");
    loadLocalStorageFallback();
    setShowAuthGate(false);
  };

  // Triggers Google SignIn
  const handleLogin = async () => {
    if (!isFirebaseAvailable || !auth) {
      alert("Firebase is setting up. Try using the Guest features!");
      return;
    }
    try {
      localStorage.setItem("gym_tiger_was_guest", "false");
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
    localStorage.removeItem("gym_tiger_was_guest");
    setCurrentUser(null);
    setShowAuthGate(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center font-sans tracking-wide">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-orange-500/10 p-4 border border-orange-500/20 rounded-full text-orange-500 animate-spin">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <span className="text-xs text-orange-500 font-mono font-bold tracking-widest mt-2 uppercase">
            Summoning Gym - Gemini...
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
        workoutLogs={workoutLogs}
        onFinish={handleFinishWorkout}
        onCancel={() => {
          if (confirm("Disconnect today's progression? All active sets weight/reps will be lost.")) {
            setActiveWorkout(null);
            setIsWorkoutMinimized(false);
          }
        }}
        onMinimize={() => setIsWorkoutMinimized(true)}
        onViewDetails={(ex) => setSelectedGuide(ex)}
        isDarkMode={isDarkMode}
      />
    );
  }


  return (
    <div className={`min-h-screen flex flex-col font-sans relative pb-28 md:pb-12 overflow-hidden animate-fade-in transition-colors duration-300 ${
      isDarkMode ? "bg-neutral-950 text-neutral-200" : "bg-neutral-50 text-neutral-800"
    }`} id="gym-gemini-root">
      {/* Background Animated Blobs */}
      <div className={`absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] max-w-[600px] rounded-full blur-[140px] animate-blob-1 pointer-events-none z-0 transition-colors duration-500 ${isDarkMode ? "bg-pink-500/10" : "bg-pink-500/[0.06]"}`} />
      <div className={`absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] max-w-[600px] rounded-full blur-[140px] animate-blob-2 pointer-events-none z-0 transition-colors duration-500 ${isDarkMode ? "bg-lime-500/10" : "bg-lime-500/[0.06]"}`} />
      <div className={`absolute top-[30%] left-[50%] -translate-x-1/2 w-[50vw] h-[50vw] max-w-[500px] rounded-full blur-[140px] animate-blob-3 pointer-events-none z-0 transition-colors duration-500 ${isDarkMode ? "bg-cyan-500/8" : "bg-cyan-500/[0.04]"}`} />

      {/* Dynamic Tiger HUD Bar */}
      <nav className={`sticky top-0 z-45 backdrop-blur-xl border-b px-4 py-3.5 select-none relative transition-colors duration-300 ${
        isDarkMode ? "bg-[#050508]/80 border-white/5 shadow-2xl shadow-black/10" : "bg-white/80 border-black/5 shadow-md shadow-black/[0.02]"
      }`}>
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between relative z-10">
          {/* Logo brand */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2.5 py-1 rounded-[0.8rem] flex items-center justify-center font-extrabold text-sm tracking-tighter shadow-md shadow-pink-500/20">
              G
            </div>
            <h1 className={`text-sm font-black font-sans uppercase tracking-widest flex items-center gap-1.5 leading-none ${
              isDarkMode ? "text-white" : "text-neutral-900"
            }`}>
              GYM - GEMINI
              <span className="text-[8px] bg-pink-500/15 text-pink-400 px-1.5 py-0.5 rounded border border-pink-500/10 font-mono font-semibold">
                STRENGTH
              </span>
            </h1>
          </div>

          {/* Cloud Auth / Profile HUD */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Switch */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] ${
                isDarkMode 
                  ? "bg-white/3 border-white/5 text-neutral-400 hover:bg-white/7 hover:text-white" 
                  : "bg-black/3 border-black/5 text-neutral-600 hover:bg-black/5 hover:text-neutral-800"
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <button
              onClick={() => setShowGitHubGuide(true)}
              className={`px-3 py-1.5 border rounded-xl flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold ${
                isDarkMode
                  ? "bg-white/3 border-white/5 text-neutral-400 hover:bg-white/7 hover:text-white"
                  : "bg-black/3 border-black/5 text-neutral-600 hover:bg-black/7 hover:text-neutral-800"
              }`}
              id="github-guide-trigger"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </button>

            <div 
              onClick={() => setIsEditingProfile(true)}
              className={`flex items-center gap-2 border p-1 rounded-full pr-4 cursor-pointer transition-all select-none active:scale-98 ${
                isDarkMode 
                  ? "bg-white/3 border-white/5 hover:bg-white/5 hover:border-pink-500/30" 
                  : "bg-black/3 border-black/5 hover:bg-black/5 hover:border-pink-500/30"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-black font-extrabold text-xs shadow shadow-pink-500/30 uppercase animate-pulse">
                {currentUser?.displayName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="hidden sm:block text-left">
                <p className={`text-[10px] font-bold capitalize truncate max-w-24 leading-none ${
                  isDarkMode ? "text-neutral-350" : "text-neutral-700"
                }`}>{currentUser?.displayName || "Athlete"}</p>
                <p className="text-[7px] text-pink-400 font-mono flex items-center gap-0.5 mt-0.5 leading-none font-bold">
                  LOCAL SESSION
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Welcome Banner */}
      <header className="px-4 py-8 relative z-10">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight uppercase leading-none animate-fade-in ${
              isDarkMode ? "text-white" : "text-neutral-900"
            }`}>
              SCULPT THE <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 ${isDarkMode ? "glow-pink" : ""}`}>
                V-TAPER PHYSIQUE.
              </span>
            </h2>
            <p className={`text-xs mt-3 max-w-xl font-mono uppercase tracking-wider font-extrabold ${
              isDarkMode ? "text-neutral-450 glow-pink" : "text-neutral-550"
            }`}>
              ⚡ Distraction-free hypertrophy & strength engine.
            </p>
            
            {/* focusTags visual badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              {focusTags.map((tag, idx) => {
                const colors: Record<string, string> = {
                  orange: isDarkMode ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-orange-500/5 text-orange-650 border-orange-500/20",
                  cyan: isDarkMode ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-500/5 text-cyan-650 border-cyan-500/20"
                };
                const colorClass = colors[tag.tone] || (isDarkMode ? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20" : "bg-neutral-500/5 text-neutral-600 border-neutral-500/20");
                return (
                  <span key={idx} className={`text-[10px] font-bold px-3 py-1.5 border rounded-full ${colorClass}`}>
                    {tag.label}
                  </span>
                );
              })}
            </div>
            
            {/* Quick Profile Modifier trigger */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsEditingProfile(true)}
                className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full transition-all border cursor-pointer select-none active:scale-95 ${
                  isDarkMode 
                    ? "text-neutral-400 hover:text-white bg-white/5 border-white/5" 
                    : "text-neutral-600 hover:text-neutral-900 bg-black/5 border-black/5"
                }`}
              >
                <Edit2 className="w-3 h-3" />
                <span>Rename Avatar</span>
              </button>
            </div>
          </div>          {/* Premium Bento Stats Boxes */}
          <div className={`flex items-center gap-6 backdrop-blur-xl p-5 rounded-[2rem] shrink-0 relative overflow-hidden z-10 transition-colors duration-300 ${
            isDarkMode 
              ? "bg-neutral-900/40 border-white/5 border shadow-xl shadow-black/30" 
              : "bg-white/60 border-black/5 border shadow-md shadow-black/[0.02]"
          }`}>
            <div className="relative flex items-center justify-center shrink-0 w-[80px] h-[80px]">
              {/* SVG Ring */}
              <svg height="80" width="80" className={`rotate-[-90deg] ${isDarkMode ? "drop-shadow-[0_0_12px_rgba(236,72,153,0.35)]" : ""}`}>
                <circle
                  stroke={isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"}
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={normalizedRadius}
                  cx="40"
                  cy="40"
                />
                <circle
                  stroke="url(#liquid-gradient-head)"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference + ' ' + circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx="40"
                  cy="40"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="liquid-gradient-head" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center flex flex-col justify-center items-center">
                <span className={`text-[15px] font-black font-mono leading-none ${isDarkMode ? "text-white" : "text-neutral-900"}`}>{completionPercentage}%</span>
                <span className="text-[6px] text-neutral-550 font-mono uppercase tracking-widest mt-0.5 font-bold">Done</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="bg-pink-500/10 p-1.5 rounded-lg border border-pink-500/10">
                  <Flame className={`w-3.5 h-3.5 text-pink-500 fill-pink-500/10 animate-pulse ${isDarkMode ? "glow-pink" : ""}`} />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-mono font-bold text-neutral-550 uppercase tracking-widest leading-none">STREAK</p>
                  <p className={`text-sm font-black leading-none mt-0.5 ${isDarkMode ? "text-white" : "text-neutral-900"}`}>{currentUser?.streak || 0} Days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-lime-500/10 p-1.5 rounded-lg border border-lime-500/10">
                  <Award className={`w-3.5 h-3.5 text-lime-500 ${isDarkMode ? "glow-lime" : ""}`} />
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-mono font-bold text-neutral-550 uppercase tracking-widest leading-none">LOGS</p>
                  <p className={`text-sm font-black leading-none mt-0.5 ${isDarkMode ? "text-white" : "text-neutral-900"}`}>{currentUser?.totalWorkouts || 0} Sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 relative z-10">
        
        {/* Weekly Split Matrix Indicator HUD */}
        <section className={`rounded-[2rem] p-6 mb-8 flex flex-col gap-5 shadow-xl transition-colors duration-300 ${
          isDarkMode ? "liquid-glass" : "light-glass"
        }`}>
          <div className={`flex justify-between items-center border-b pb-3 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 text-pink-500 ${isDarkMode ? "glow-pink" : ""}`} />
              <h3 className={`text-xs font-mono font-extrabold tracking-widest uppercase ${isDarkMode ? "text-white" : "text-neutral-900"}`}>7-Day Consistency Index</h3>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono font-semibold">7D rolling basis</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
            {GYM_TIGER_SPLIT.map((day) => {
              const completed = isDayCompletedThisWeek(day.dayIndex);
              return (
                <div
                  key={day.dayIndex}
                  className={`p-4 rounded-2xl flex flex-col gap-1 text-center transition-all ${
                    completed
                      ? (isDarkMode ? "bg-pink-500/5 border border-pink-500/20 text-pink-400" : "bg-pink-500/[0.04] border border-pink-500/30 text-pink-600")
                      : (isDarkMode ? "bg-neutral-950/40 border border-white/5 text-neutral-450" : "bg-black/[0.02] border border-black/5 text-neutral-550")
                  }`}
                >
                  <span className="text-[10px] font-mono text-neutral-550 leading-none">{day.dayName}</span>
                  <span className={`text-xs font-bold uppercase mt-1 truncate ${isDarkMode ? "text-white" : "text-neutral-850"}`}>{day.title.split("&")[0]}</span>
                  {completed ? (
                    <span className="flex items-center justify-center gap-1 text-[9px] font-mono text-pink-400 font-bold mt-1 bg-pink-500/10 py-0.5 rounded-lg uppercase">
                      <Check className="w-3 h-3" /> SECURED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-neutral-600 mt-1 uppercase block leading-none">WAITING</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>



        {/* Tab switcher navigation bar */}
        <div className="hidden md:flex border-b border-white/5 gap-6 mb-6">
          <button
            onClick={() => setActiveTab("splits")}
            className={`pb-3 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all relative ${
              activeTab === "splits" ? "text-pink-500" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Training Splits</span>
            {activeTab === "splits" && (
              <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 glow-pink" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all relative ${
              activeTab === "history" ? "text-pink-500" : "text-neutral-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Training Logbook ({workoutLogs.length})</span>
            {activeTab === "history" && (
              <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 glow-pink" />
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
              className="flex flex-col gap-6"
            >
              {/* Category Filter Pills - Swipeable Chip Group */}
              <div className={`flex overflow-x-auto whitespace-nowrap pb-3 border-b gap-2.5 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 ${
                isDarkMode ? "border-white/5" : "border-black/5"
              }`}>
                {["All Workouts", "Back & Lats", "Shoulders", "Chest & Abs", "Legs"].map((cat) => {
                  const isActive = activeCategory === cat || (cat === "All Workouts" && activeCategory === "All");
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat === "All Workouts" ? "All" : cat)}
                      className={`px-5 py-3.5 rounded-2xl text-xs md:text-sm font-mono font-black uppercase tracking-wider transition-all border snap-start min-h-[44px] cursor-pointer select-none active:scale-95 ${
                        isActive
                          ? "bg-pink-500/10 text-pink-400 border-pink-500/40 glow-pink"
                          : "bg-white/3 border-white/5 text-neutral-450 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Splits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredWorkouts.map((workout) => {
                  const isCompleted = isDayCompletedThisWeek(workout.dayIndex);
                  const isExpanded = expandedRoutineIndex === workout.dayIndex;
                  const vTaperPct = getVTaperIntensity(workout);
                  const estimatedDuration = workout.exercises.length * 8;
                  const difficulty = workout.exercises.length > 8 ? "🔥 Elite" : "🔥 Intense";
                  
                  const accentColors: Record<string, string> = {
                    orange: "hover:border-orange-500/25 shadow-orange-500/2",
                    cyan: "hover:border-cyan-500/25 shadow-cyan-500/2",
                    violet: "hover:border-violet-500/25 shadow-violet-500/2",
                  };
                  const accentClass = accentColors[workout.accent || "orange"] || "hover:border-pink-500/25";

                  const gradientBtns: Record<string, string> = {
                    orange: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-orange-500/20",
                    cyan: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/20",
                    violet: "bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 shadow-violet-500/20"
                  };
                  const buttonClass = gradientBtns[workout.accent || "orange"] || "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/20";

                  return (
                    <div
                      key={workout.dayIndex}
                      className={`rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden group shadow-lg transition-colors duration-300 ${
                        isDarkMode ? "liquid-glass-interactive" : "light-glass-interactive"
                      } ${accentClass}`}
                      id={`day-workout-${workout.dayIndex}`}
                    >
                      <div>
                        {/* Badge bar */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 border rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                              isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-neutral-800"
                            }`}>
                              {workout.dayName}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] border font-mono rounded-full font-bold ${
                              isDarkMode ? "bg-white/5 border-white/5 text-neutral-350" : "bg-black/3 border-black/5 text-neutral-600"
                            }`}>
                              ⏱️ {estimatedDuration} min
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] border font-mono rounded-full font-bold ${
                              isDarkMode ? "bg-white/5 border-white/5 text-neutral-350" : "bg-black/3 border-black/5 text-neutral-600"
                            }`}>
                              {difficulty}
                            </span>
                          </div>
                          {isCompleted && (
                            <span className={`flex items-center gap-1.5 text-xs text-lime-650 bg-lime-500/5 px-2.5 py-0.5 font-semibold rounded-full border border-lime-500/10 font-mono tracking-wider uppercase ${isDarkMode ? "text-lime-400 border-lime-500/10" : "text-emerald-700 border-emerald-500/20 bg-emerald-50"}`}>
                              <Check className={`w-3.5 h-3.5 ${isDarkMode ? "glow-lime" : ""}`} /> SECURED
                            </span>
                          )}
                        </div>

                        {/* Header core */}
                        <h3 className={`text-lg font-extrabold uppercase tracking-tight leading-tight mb-2.5 ${
                          isDarkMode ? "text-white" : "text-neutral-900"
                        }`}>
                          {workout.title}
                        </h3>

                        {/* V-Taper Focus Bar */}
                        <div className={`border rounded-2xl p-3 mb-4 mt-2 ${
                          isDarkMode ? "bg-white/2 border-white/5" : "bg-black/[0.02] border-black/5"
                        }`}>
                          <div className={`flex justify-between items-center text-[10px] font-mono font-bold uppercase ${
                            isDarkMode ? "text-neutral-400" : "text-neutral-550"
                          }`}>
                            <span>V-Taper Focus Density</span>
                            <span className="text-pink-505 font-extrabold">{vTaperPct}%</span>
                          </div>
                          <div className={`w-full rounded-full h-1.5 overflow-hidden mt-1.5 ${
                            isDarkMode ? "bg-white/5" : "bg-black/5"
                          }`}>
                            <div
                              className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${vTaperPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Targeted muscles tags */}
                        <div className={`flex flex-wrap gap-1.5 mb-4 border-t pt-3.5 ${
                          isDarkMode ? "border-white/5" : "border-black/5"
                        }`}>
                          {workout.focus.map((tgt, i) => (
                            <span
                              key={i}
                              className={`border text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-lg ${
                                isDarkMode ? "bg-white/3 border-white/5 text-neutral-400" : "bg-black/3 border-black/5 text-neutral-600"
                              }`}
                            >
                              {tgt}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Expandable Movements Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className={`overflow-hidden border-t pt-4 mt-1 flex flex-col gap-2 ${
                              isDarkMode ? "border-white/5" : "border-black/5"
                            }`}
                          >
                            <h4 className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1 ${
                              isDarkMode ? "text-neutral-400" : "text-neutral-650"
                            }`}>Movements Panel ({workout.exercises.length})</h4>
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                              {workout.exercises.map((ex) => (
                                <div key={ex.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                  isDarkMode ? "bg-white/2 border-white/5 hover:bg-white/5" : "bg-black/[0.02] border-black/5 hover:bg-black/[0.04]"
                                }`}>
                                  <div className="text-left flex-1 min-w-0">
                                    <p className={`text-xs font-bold truncate ${isDarkMode ? "text-white" : "text-neutral-900"}`}>{ex.name}</p>
                                    <p className={`text-[9.5px] font-mono mt-0.5 ${isDarkMode ? "text-neutral-450" : "text-neutral-600"}`}>{ex.sets} Sets × {ex.repsRange} | ⏱️ {ex.rest}</p>
                                  </div>
                                  <button
                                    onClick={() => setSelectedGuide(ex)}
                                    className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                                      isDarkMode 
                                        ? "bg-white/5 border-white/5 hover:border-pink-500/30 text-neutral-400 hover:text-pink-400" 
                                        : "bg-black/5 border-black/10 hover:border-pink-500/30 text-neutral-600 hover:text-pink-500"
                                    }`}
                                    title="View Form Guide"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Interaction Launch Buttons */}
                      <div className={`flex items-center gap-3 border-t pt-4 mt-3 ${
                        isDarkMode ? "border-white/5" : "border-black/5"
                      }`}>
                        <button
                          onClick={() => {
                            setExpandedRoutineIndex(isExpanded ? null : workout.dayIndex);
                          }}
                          className="flex-1 text-center bg-transparent hover:bg-white/5 text-neutral-350 hover:text-white font-black text-xs sm:text-sm uppercase px-5 py-4 border border-white/10 rounded-2xl transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 min-h-[48px] active:scale-95"
                        >
                          <span>{isExpanded ? "Close Drawer" : "Preview Moves"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 rotate-90" />}
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
                          className={`flex-1 ${buttonClass} text-white font-black text-xs sm:text-sm uppercase text-center px-5 py-4 rounded-2xl transition-all shadow-md active:scale-95 select-none cursor-pointer tracking-wider min-h-[48px]`}
                        >
                          Start Session
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryLogs logs={workoutLogs} onDeleteLog={handleDeleteLog} isDarkMode={isDarkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- EXERCISE GUIDE FLOATING WINDOWS --- */}
      <AnimatePresence>
        {selectedGuide && (
          <ExerciseDetailModal exercise={selectedGuide} onClose={() => setSelectedGuide(null)} isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>

      {/* --- RENAME PROFILE DIALOGUE --- */}
      <AnimatePresence>
        {isEditingProfile && currentUser && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-colors duration-350 ${
            isDarkMode ? "bg-black/85" : "bg-black/40"
          }`} id="edit-profile-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl p-6 relative transition-colors duration-300 ${
                isDarkMode ? "liquid-glass" : "light-glass"
              }`}
            >
              <h3 className={`text-base font-extrabold font-sans uppercase tracking-wider mb-2 ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}>
                Customize Avatar Sign
              </h3>
              <p className={`text-xs mb-4 leading-relaxed font-medium ${
                isDarkMode ? "text-neutral-450" : "text-neutral-600"
              }`}>
                Provide your custom training handle. This will persist on-screen across logs.
              </p>

              <input
                type="text"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                maxLength={20}
                placeholder="Name your Gym - Gemini"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-bold select-none focus:outline-none focus:border-pink-500/80 mb-4 transition-colors font-sans ${
                  isDarkMode ? "bg-white/3 border-white/5 text-white" : "bg-black/3 border-black/10 text-neutral-800"
                }`}
              />

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditNameInput(currentUser.displayName);
                    setIsEditingProfile(false);
                  }}
                  className={`px-4 py-2.5 bg-transparent font-bold text-xs uppercase rounded-xl transition-all ${
                    isDarkMode 
                      ? "hover:bg-white/5 border-white/10 text-neutral-450 hover:text-white" 
                      : "hover:bg-black/5 border-black/15 text-neutral-650 hover:text-neutral-900"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 btn-liquid-pink font-extrabold text-xs uppercase text-white rounded-xl active:scale-95 transition-all cursor-pointer"
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
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-colors duration-350 ${
            isDarkMode ? "bg-black/90" : "bg-black/40"
          }`} id="workout-celebration">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", damping: 15 }}
              className={`w-full max-w-md border rounded-[2.5rem] p-6 text-center shadow-3xl relative transition-colors duration-300 ${
                isDarkMode ? "bg-neutral-950 border-white/5" : "bg-white border-black/5"
              }`}
            >
              <div className={`w-16 h-16 bg-pink-500/10 border-2 border-pink-500/30 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce ${isDarkMode ? "glow-pink" : ""}`}>
                <Trophy className="w-8 h-8" />
              </div>

              <span className="text-[10px] font-mono font-bold text-pink-500 tracking-widest uppercase">
                SESSION RECORDED
              </span>
              <h3 className={`text-xl font-black uppercase tracking-tight mt-1 ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}>
                EXCELLENT LIFTING!
              </h3>
              <p className={`text-xs max-w-sm mx-auto mt-2 leading-relaxed ${
                isDarkMode ? "text-neutral-450" : "text-neutral-600"
              }`}>
                Your split entry for <span className={`font-bold font-mono ${isDarkMode ? "text-white" : "text-neutral-850"}`}>{celebratedLog.workoutName}</span> has been signed into your logs. Keep your spine erect and posture aligned.
              </p>

              {/* Workout stats HUD */}
              <div className={`grid grid-cols-2 gap-3 border p-4 rounded-2xl my-5 text-left ${
                isDarkMode ? "bg-neutral-900 border-white/5" : "bg-black/[0.02] border-black/5"
              }`}>
                <div>
                  <span className="text-[9px] font-mono text-neutral-505 uppercase leading-none block font-bold">Time Under Tension</span>
                  <span className={`text-sm font-bold font-mono mt-1 block ${isDarkMode ? "text-white" : "text-neutral-850"}`}>
                    {Math.floor(celebratedLog.duration / 60)} mins
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-neutral-505 uppercase leading-none block font-bold">Sets Checked</span>
                  <span className={`text-sm font-bold font-mono mt-1 block ${isDarkMode ? "text-white" : "text-neutral-850"}`}>
                    {celebratedLog.exercises.flatMap(e => e.sets).length} sets
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCelebratedLog(null);
                  setActiveTab("history"); // swap to logs so they inspect right away
                }}
                className="w-full btn-liquid-pink text-white font-extrabold text-xs uppercase py-3.5 rounded-full shadow-lg transition-all active:scale-98 tracking-wider animate-pulse"
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
            className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 liquid-glass border border-pink-500/20 rounded-[2rem] p-4 shadow-2xl z-50 flex items-center justify-between backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="bg-pink-500/10 p-2.5 border border-pink-500/20 rounded-xl text-pink-500 animate-pulse glow-pink">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase tracking-wider">Active Workout Running</p>
                <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[180px] mt-0.5">{activeWorkout.title}</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsWorkoutMinimized(false)}
              className="btn-liquid-pink text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-full transition-all shadow-md cursor-pointer active:scale-95 text-nowrap tracking-wider"
            >
              Resume Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GITHUB RESIDUAL EXPORT PORTAL --- */}
      <AnimatePresence>
        {showGitHubGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="github-export-portal">
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              className="w-full max-w-lg liquid-glass rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="bg-white/3 px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-neutral-950 p-2 border border-white/5 text-white rounded-xl">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">GitHub Integration Portal</h3>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5 uppercase font-bold">Manage & Migrate your repository</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGitHubGuide(false)}
                  className="text-neutral-550 hover:text-white font-black text-sm p-1.5 hover:bg-neutral-850 rounded-xl transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 font-sans text-left flex flex-col gap-5">
                {/* Workflow Card 1: Direct Export */}
                <div className="bg-neutral-950/60 border border-white/5 p-4.5 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-pink-500/10 text-pink-400 rounded-full font-mono text-xs flex items-center justify-center font-bold">1</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wide">Direct Google AI Studio Export (Preferred)</h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed pl-7">
                    Google AI Studio provides a native cloud pipeline to export your code directly into a new or existing repository.
                  </p>
                  <div className="pl-7 flex flex-col gap-1.5 mt-1 border-l-2 border-white/5 ml-2.5">
                    <span className="text-[10px] text-neutral-300 font-medium">1. Locate the <span className="font-bold text-white uppercase text-[9px]">Settings / Export</span> menu in the AI Studio header.</span>
                    <span className="text-[10px] text-neutral-300 font-medium">2. Press <span className="font-bold text-white uppercase text-[9px]">"Export to GitHub"</span> or select <span className="font-bold text-white uppercase text-[9px]">"Download ZIP"</span>.</span>
                    <span className="text-[10px] text-neutral-300 font-medium">3. Grant permissions to create and push to a remote GitHub branch instantly.</span>
                  </div>
                </div>

                {/* Workflow Card 2: Manual Terminal Commands */}
                <div className="bg-neutral-950/60 border border-white/5 p-4.5 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-pink-500/10 text-pink-400 rounded-full font-mono text-xs flex items-center justify-center font-bold">2</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wide">Terminal Command Manual Push</h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed pl-7">
                    If you downloaded the code as a ZIP file, initialize standard Git control files inside the unzipped workspace with these server rules:
                  </p>
                  
                  <div className="pl-7 mt-1.5">
                    <pre className="bg-neutral-950 border border-white/5 p-3.5 rounded-xl font-mono text-[9px] text-neutral-200 select-all overflow-x-auto leading-relaxed">
{`# 1. Initialize local repository
git init

# 2. Track all files (ignoring node_modules in .gitignore)
git add .

# 3. Commit elements
git commit -m "feat: Boot Gym - Gemini elite hypertrophy application"

# 4. Set branch and pair remote destination
git branch -M main
git remote add origin https://github.com/your-username/gym-tiger.git

# 5. Push safely to GitHub
git push -u origin main`}
                    </pre>
                  </div>
                </div>

                {/* Protip */}
                <div className="bg-pink-500/5 border border-pink-500/10 p-4 rounded-xl flex items-start gap-2.5">
                  <span className="text-xs mt-0.5">💡</span>
                  <p className="text-[10px] text-pink-400 font-medium leading-relaxed">
                    <span className="font-bold uppercase">Keep Secrets Private:</span> All database configurations are safely extracted to <code className="bg-neutral-950 px-1 py-0.5 rounded text-white font-mono text-[9px]">firebase-applet-config.json</code> and variables are set in <code className="bg-neutral-950 px-1 py-0.5 rounded text-white font-mono text-[9px]">.env.example</code>. Never commit raw passwords or server API keys directly to public repositories.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-955/65 px-6 py-4.5 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setShowGitHubGuide(false)}
                  className="px-6 py-2.5 btn-liquid-pink font-extrabold text-xs text-white tracking-wide uppercase rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Conclude Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Navigation Bar for Mobile App feel */}
      <div className="fixed bottom-0 left-0 right-0 z-45 bg-[#050508]/90 backdrop-blur-2xl border-t border-white/5 py-2.5 pb-safe flex md:hidden justify-around items-center shadow-2xl">
        <button
          onClick={() => setActiveTab("splits")}
          className={`flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 min-h-[48px] cursor-pointer select-none active:scale-95 transition-all ${
            activeTab === "splits" ? "text-pink-500 font-extrabold" : "text-neutral-450 hover:text-white"
          }`}
        >
          <Compass className={`w-5 h-5 ${activeTab === "splits" ? "scale-110 text-pink-500 glow-pink" : ""}`} />
          <span className="text-[9px] uppercase tracking-widest font-mono">Routines</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 min-h-[48px] cursor-pointer select-none active:scale-95 transition-all ${
            activeTab === "history" ? "text-pink-500 font-extrabold" : "text-neutral-450 hover:text-white"
          }`}
        >
          <div className="relative">
            <History className={`w-5 h-5 ${activeTab === "history" ? "scale-110 text-pink-500 glow-pink" : ""}`} />
            {workoutLogs.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-pink-500 text-black font-black font-mono text-[7px] px-1 rounded-full border border-neutral-950">
                {workoutLogs.length}
              </span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-widest font-mono">Logbook</span>
        </button>

        <button
          onClick={() => setIsEditingProfile(true)}
          className="flex flex-col items-center justify-center gap-1.5 py-1.5 flex-1 min-h-[48px] cursor-pointer select-none active:scale-95 transition-all text-neutral-450 hover:text-white"
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-widest font-mono">Profile</span>
        </button>
      </div>
    </div>
  );
}

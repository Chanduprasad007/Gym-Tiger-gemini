import React, { useState, useEffect } from "react";
import { GYM_TIGER_SPLIT, Exercise, DayWorkout } from "./data";
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
  const [showAuthGate, setShowAuthGate] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

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
        clientMsg = "This email is already linked to another Gym Tiger profile.";
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
                lastCompletedDate: data.lastCompletedDate || null,
              };
            } else {
              // Create user profile
              profileData = {
                userId: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "Tiger Fellow",
                streak: 0,
                totalWorkouts: 0,
                lastCompletedDate: null,
              };
              await setDoc(userDocRef, {
                ...profileData,
                updatedAt: new Date().toISOString()
              });
            }

            setCurrentUser(profileData);
            setEditNameInput(profileData.displayName);
            setShowAuthGate(false);

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
            const wasGuest = localStorage.getItem("gym_tiger_was_guest") === "true";
            if (wasGuest) {
              loadLocalStorageFallback();
              setShowAuthGate(false);
            } else {
              setShowAuthGate(true);
            }
          }
        } else {
          // No user, check if we was guest
          const wasGuest = localStorage.getItem("gym_tiger_was_guest") === "true";
          if (wasGuest) {
            loadLocalStorageFallback();
            setShowAuthGate(false);
          } else {
            setShowAuthGate(true);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local Guest fallback
      const wasGuest = localStorage.getItem("gym_tiger_was_guest") === "true";
      if (wasGuest) {
        loadLocalStorageFallback();
        setShowAuthGate(false);
      } else {
        setShowAuthGate(true);
      }
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

  if (showAuthGate && (!currentUser || currentUser.userId === "guest_tiger")) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden" id="login-landing-gate">
        {/* Background ambient aesthetic radial gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-center flex flex-col gap-6">
          {/* Top Branding Section */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative mb-4 cursor-pointer"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl flex items-center justify-center text-black font-extrabold text-3.5xl tracking-tighter shadow-xl shadow-orange-600/15">
                <Flame className="w-10 h-10 text-neutral-950 fill-neutral-950 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-neutral-950 border border-orange-550/35 text-[9px] text-orange-500 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                V1.2
              </span>
            </motion.div>

            <span className="text-[10px] font-mono font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/10 mb-2">
              THE COLD HYPERTROPHY METHOD
            </span>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              GYM TIGER
            </h1>
            <p className="text-xs text-neutral-400 mt-2 font-medium max-w-sm leading-relaxed">
              An elite training system engineered to address lateral lat depth, anti-rotation core raises, and spinal support carries.
            </p>
          </div>

          {/* Premium Bullet Core Features Display */}
          <div className="bg-neutral-950/60 border border-neutral-850/60 rounded-2xl p-4 text-left flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-orange-500/10 text-orange-500 p-1.5 rounded-lg border border-orange-500/10 shrink-0 mt-0.5 animate-pulse">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase">Six-Day Hypertrophy Matrix</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">Custom training days focused on major structural hypertrophy zones.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/10 shrink-0 mt-0.5">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase">Secure Cloud Infrastructure</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">Sync progression and historic logs across phone and computer.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-500/10 text-orange-500 p-1.5 rounded-lg border border-orange-500/10 shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase">Form Video & Fallback Caches</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">Search exercise formats and run offline cached content gracefully.</p>
              </div>
            </div>
          </div>

          {/* Email / Password Sign In and Sign Up HUD Forms */}
          <div className="flex flex-col gap-3.5 border-t border-b border-neutral-855/40 py-4 text-left">
            <h2 className="text-[10px] font-mono font-black text-orange-500 uppercase tracking-widest text-center mb-1">
              {isSignUp ? "CREATE A TIGER PROFILE" : "SIGN IN REGISTRATION"}
            </h2>

            <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailLogin} className="flex flex-col gap-2.5">
              {isSignUp && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arnold S."
                    value={signUpNameInput}
                    onChange={(e) => setSignUpNameInput(e.target.value)}
                    className="bg-neutral-950 border border-neutral-850 focus:border-orange-550 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors font-sans"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 focus:border-orange-550 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors font-sans"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Secure Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 focus:border-orange-550 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors font-sans"
                />
              </div>

              {authError && (
                <div className="text-[9px] font-mono font-bold text-red-400 bg-red-950/20 border border-red-500/15 rounded-xl p-2.5 leading-relaxed text-center">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white font-extrabold text-xs uppercase py-2.5 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer text-center"
              >
                {isSignUp ? "Initiate Account" : "Access Secure Training"}
              </button>
            </form>

            <button
              type="type"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError("");
              }}
              className="text-[9px] font-mono font-black text-orange-400/80 hover:text-orange-300 uppercase tracking-wider text-center mt-0.5 focus:outline-none transition-all cursor-pointer"
            >
              {isSignUp ? "• Already Registered? Log In instead" : "• Need registration? Create an account"}
            </button>
          </div>

          {/* Interactive Flow Entrance Buttons */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">- OR ONE-CLICK CONNECT -</span>
            <button
              onClick={handleLogin}
              className="w-full bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 text-neutral-100 font-bold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Database className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
              <span>Connect Cloud with Google</span>
            </button>

            <button
              onClick={handleProceedAsGuest}
              className="w-full bg-neutral-900/40 hover:bg-neutral-850 border border-neutral-850/60 text-neutral-400 hover:text-neutral-200 font-bold text-xs uppercase py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Proceed in Offline Guest Mode</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-5 border-t border-neutral-850 pt-4 mt-2">
            <div className="text-center">
              <span className="text-[14px] font-mono font-black text-white">6</span>
              <span className="text-[9px] font-mono text-neutral-500 block">SPLITS</span>
            </div>
            <div className="w-px h-6 bg-neutral-850" />
            <div className="text-center">
              <span className="text-[14px] font-mono font-black text-white">100%</span>
              <span className="text-[9px] font-mono text-neutral-500 block">MOBILE ADAPTIVE</span>
            </div>
            <div className="w-px h-6 bg-neutral-850" />
            <div className="text-center">
              <span className="text-[14px] font-mono font-black text-white">PWA</span>
              <span className="text-[9px] font-mono text-neutral-500 block">INSTALLABLE</span>
            </div>
          </div>
        </div>

        {/* Footer brand disclaimer */}
        <p className="text-[9px] text-neutral-600 uppercase tracking-widest font-mono mt-6 text-center select-none">
          Gym Tiger Elite Training Environment • Cloud-Secured Access
        </p>
      </div>
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
            <button
              onClick={() => setShowGitHubGuide(true)}
              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-850 hover:text-white text-neutral-400 border border-neutral-800 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold"
              id="github-guide-trigger"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </button>

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

      {/* --- GITHUB RESIDUAL EXPORT PORTAL --- */}
      <AnimatePresence>
        {showGitHubGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" id="github-export-portal">
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="bg-gradient-to-r from-orange-600/10 to-orange-500/5 px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-neutral-950 p-2 border border-neutral-800 text-white rounded-xl">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">GitHub Integration Portal</h3>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5 uppercase">Manage & Migrate your repository</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGitHubGuide(false)}
                  className="text-neutral-500 hover:text-white font-black text-sm p-1.5 hover:bg-neutral-850 rounded-xl transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 font-sans text-left flex flex-col gap-5">
                {/* Workflow Card 1: Direct Export */}
                <div className="bg-neutral-950 border border-neutral-850 p-4.5 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-orange-500/10 text-orange-500 rounded-full font-mono text-xs flex items-center justify-center font-bold">1</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wide">Direct Google AI Studio Export (Preferred)</h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed pl-7">
                    Google AI Studio provides a native cloud pipeline to export your code directly into a new or existing repository.
                  </p>
                  <div className="pl-7 flex flex-col gap-1.5 mt-1 border-l-2 border-neutral-800 ml-2.5">
                    <span className="text-[10px] text-neutral-300 font-medium">1. Locate the <span className="font-bold text-white uppercase text-[9px]">Settings / Export</span> menu in the AI Studio header.</span>
                    <span className="text-[10px] text-neutral-300 font-medium">2. Press <span className="font-bold text-white uppercase text-[9px]">"Export to GitHub"</span> or select <span className="font-bold text-white uppercase text-[9px]">"Download ZIP"</span>.</span>
                    <span className="text-[10px] text-neutral-300 font-medium">3. Grant permissions to create and push to a remote GitHub branch instantly.</span>
                  </div>
                </div>

                {/* Workflow Card 2: Manual Terminal Commands */}
                <div className="bg-neutral-950 border border-neutral-850 p-4.5 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-orange-500/10 text-orange-500 rounded-full font-mono text-xs flex items-center justify-center font-bold">2</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wide">Terminal Command Manual Push</h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed pl-7">
                    If you downloaded the code as a ZIP file, initialize standard Git control files inside the unzipped workspace with these server rules:
                  </p>
                  
                  <div className="pl-7 mt-1.5">
                    <pre className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-xl font-mono text-[9px] text-neutral-200 select-all overflow-x-auto leading-relaxed">
{`# 1. Initialize local repository
git init

# 2. Track all files (ignoring node_modules in .gitignore)
git add .

# 3. Commit elements
git commit -m "feat: Boot Gym Tiger elite hypertrophy application"

# 4. Set branch and pair remote destination
git branch -M main
git remote add origin https://github.com/your-username/gym-tiger.git

# 5. Push safely to GitHub
git push -u origin main`}
                    </pre>
                  </div>
                </div>

                {/* Protip */}
                <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl flex items-start gap-2.5">
                  <span className="text-xs mt-0.5">💡</span>
                  <p className="text-[10px] text-orange-400 font-medium leading-relaxed">
                    <span className="font-bold uppercase">Keep Secrets Private:</span> All database configurations are safely extracted to <code className="bg-neutral-950 px-1 py-0.5 rounded text-white font-mono text-[9px]">firebase-applet-config.json</code> and variables are set in <code className="bg-neutral-950 px-1 py-0.5 rounded text-white font-mono text-[9px]">.env.example</code>. Never commit raw passwords or server API keys directly to public repositories.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-950 px-6 py-4.5 border-t border-neutral-800 flex justify-end">
                <button
                  onClick={() => setShowGitHubGuide(false)}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 font-extrabold text-xs text-black tracking-wide uppercase rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Conclude Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

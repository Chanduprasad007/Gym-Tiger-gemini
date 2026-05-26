export interface Exercise {
  id: string;
  name: string;
  target: string;
  category: "Lats" | "Shoulders" | "Chest" | "Core/Abs" | "Lower Back" | "Arms" | "Legs";
  sets: number;
  repsRange: string;
  restSeconds: number;
  instructions: string[];
  tigerTip: string;
}

export interface DayWorkout {
  dayIndex: number;
  dayName: string;
  title: string;
  description: string;
  focus: string[];
  exercises: Exercise[];
}

export const GYM_TIGER_SPLIT: DayWorkout[] = [
  {
    dayIndex: 0,
    dayName: "Day 1",
    title: "Lat Width & Side Delts",
    description: "Build an expansive V-taper while expanding the collarbone profile.",
    focus: ["Lat Width", "Shoulder Caps", "Upright Posture"],
    exercises: [
      {
        id: "lats-pulldowns",
        name: "Wide-Grip Lat Pulldown",
        target: "Lats (Upper/Outer)",
        category: "Lats",
        sets: 4,
        repsRange: "10-12 reps",
        restSeconds: 90,
        instructions: [
          "Sit firmly in the machine, securing thighs under the pads.",
          "Grasp the bar with a wide overhand grip, chest lifted and back slightly arched.",
          "Pull the bar down toward your upper chest, leading with your elbows.",
          "Squeeze your shoulder blades tightly at the bottom before releasing under full control."
        ],
        tigerTip: "Do not pull with your hands. Imagine your hands are hooks and pull entirely from the elbows."
      },
      {
        id: "pullups-weighted",
        name: "Posture Pullups (Bodyweight/Weighted)",
        target: "Mid-Lats & Rhomboids",
        category: "Lats",
        sets: 3,
        repsRange: "6-10 reps",
        restSeconds: 120,
        instructions: [
          "Hang with a grip slightly wider than shoulder-width.",
          "Contract your core, keep your legs straight, and depress your scapula.",
          "Pull yourself up until your throat clears the bar, driving your chest towards it.",
          "Control the descent completely to a dead hang."
        ],
        tigerTip: "Avoid crossing your legs or swinging. A rigid, straight bodyline protects the lower back and increases lateral recruit."
      },
      {
        id: "lateral-raises",
        name: "Lu Raises (High lateral raise)",
        target: "Side Delts & Traps",
        category: "Shoulders",
        sets: 4,
        repsRange: "12-15 reps",
        restSeconds: 75,
        instructions: [
          "Stand tall holding light dumbbells at your sides with palms facing forward.",
          "Raise the weights out to your sides in a wide arc, passing parallel.",
          "Keep lifting all the way up until the dumbbells meet overhead, rotating your arms outward slightly.",
          "Reverse the arc exactly, controlling the negative phase back down."
        ],
        tigerTip: "Originated by Olympian Lu Xiaojun. This wide, full-range arc opens the thoracic spine while sculpting round shoulder caps."
      },
      {
        id: "face-pulls",
        name: "Postural Face Pulls with Rope",
        target: "Rear Delts, Rotator Cuff, Upper Back",
        category: "Shoulders",
        sets: 3,
        repsRange: "15 reps",
        restSeconds: 60,
        instructions: [
          "Set cable pulley to eye height and grab the rope handles with thumbs facing back.",
          "Step back to lift the weight, standing with athletic posture.",
          "Pull the center rope towards your forehead while tearing the sides apart.",
          "Ensure your hands finish further back than your elbows in a double-bicep pose."
        ],
        tigerTip: "Hold the peak contraction for 2 full seconds to reinforce upright scapular posture and reverse slouching."
      },
      {
        id: "core-plank-bracing",
        name: "Hardstyle RKC Plank (Bracing)",
        target: "Deep Core & Transverse Abdominis",
        category: "Core/Abs",
        sets: 3,
        repsRange: "20-30s hold",
        restSeconds: 60,
        instructions: [
          "Get into a forearm plank. Keep elbows exactly under your shoulders.",
          "Clench your fists, lock your knees, and squeeze your glutes fully.",
          "Consciously pull your elbows down towards your feet and your toes up towards your head.",
          "Breathe in sharp, powerful cycles while maintaining maximal full-body tension."
        ],
        tigerTip: "This is not standard passive plank. Every muscle should be shaking from active bracing. A phenomenal spine-protecting tool."
      }
    ]
  },
  {
    dayIndex: 1,
    dayName: "Day 2",
    title: "Chest Strength & Rear Delts",
    description: "Develop structural front-to-back symmetry and heavy pressing push power.",
    focus: ["Chest Strength", "Rear Delts", "Scapular Control"],
    exercises: [
      {
        id: "chest-incline-press",
        name: "Incline Dumbbell Press",
        target: "Upper Chest & Front Delts",
        category: "Chest",
        sets: 4,
        repsRange: "8-10 reps",
        restSeconds: 90,
        instructions: [
          "Set bench to an incline of 30 degrees (prevent excessive shoulder takeover).",
          "Sit down, press weights overhead, and tuck shoulder blades safely down and back.",
          "Lower weights slowly toward your collarbones, feeling a deep stretch across the upper chest.",
          "Drive upward with control, stopping just short of locking your elbows."
        ],
        tigerTip: "Keep your feet screwed into the floor and maintain a small arch in the lower back to establish structural strength."
      },
      {
        id: "rear-delt-flyes",
        name: "Prone Retraction Rear Delt Flyes",
        target: "Rear Delts",
        category: "Shoulders",
        sets: 4,
        repsRange: "12-15 reps",
        restSeconds: 75,
        instructions: [
          "Lie face down on an incline bench at 30 degrees.",
          "Hold dumbbells straight down, knuckles facing outward.",
          "Raise weights out to the sides, driving with the back of your shoulders.",
          "Avoid squeezing the neck; focus strictly on shoulder blade movement."
        ],
        tigerTip: "A vital builder to counteract heavy chest pressing and maintain robust shoulder posture."
      },
      {
        id: "chest-dips",
        name: "Bodyweight Chest Dips",
        target: "Lower Chest, Sternal Fibers & Triceps",
        category: "Chest",
        sets: 3,
        repsRange: "8-12 reps",
        restSeconds: 90,
        instructions: [
          "Grasp dip bars and push yourself up to the starting position.",
          "Incline your chest forward by tucking your chin and crossing your legs.",
          "Lower yourself slowly until your elbows reach 90 degrees.",
          "Drive back up using your chest, focusing on squeezing your hands together in mind-to-muscle connection."
        ],
        tigerTip: "Do not let your shoulders shrug up to your ears. Keep them depressed throughout to guard the rotator cuffs."
      },
      {
        id: "dumbbell-pullover",
        name: "Ribcage Expansion Pullover",
        target: "Lower Chest, Lats & Serratus",
        category: "Chest",
        sets: 3,
        repsRange: "10-12 reps",
        restSeconds: 75,
        instructions: [
          "Lie perpendicular across a flat bench, upper back supported by the pad.",
          "Hold a dumbbell overhead with both hands forming a diamond grip.",
          "Keep arms mostly straight and lower the dumbbell back-and-down behind your head under strict control.",
          "Pull the weight back up to eye level, contracting chest and serratus muscles."
        ],
        tigerTip: "Hips should be dropped slightly throughout to increase the stretch on the ribcage and expand overall posture."
      }
    ]
  },
  {
    dayIndex: 2,
    dayName: "Day 3",
    title: "Postural Spine & Abs",
    description: "Anti-slouch restoration and total-core bracing under tension.",
    focus: ["Posterior Health", "Anti-rotation Abs", "Thoracic Extension"],
    exercises: [
      {
        id: "core-hanging-raises",
        name: "Hanging Leg Raises",
        target: "Rectus Abdominis & Deep Hip Flexors",
        category: "Core/Abs",
        sets: 4,
        repsRange: "10-12 reps",
        restSeconds: 90,
        instructions: [
          "Hang from a pullup bar with a shoulder-width grip.",
          "Contract your core, lock your legs out, and lift them slowly until they are parallel to the floor.",
          "Pause for a brief microsecond before lowering them with controlled discipline.",
          "Avoid swinging completely; do not rely on momentum."
        ],
        tigerTip: "To target abs rather than just hip flexors, concentrate on curling the pelvis upward towards the ribs."
      },
      {
        id: "farmer-carries",
        name: "Posture Heavy Farmer's Carries",
        target: "Trapezius, Core Stabilizers & Forearms",
        category: "Lower Back",
        sets: 3,
        repsRange: "40-50 meters",
        restSeconds: 90,
        instructions: [
          "Deadlift two heavy dumbbells or kettlebells to a standing lock-out.",
          "Pack your shoulders down and back, lengthen your neck, and brace your code.",
          "Walk in a straight line with slow, deliberate, heel-to-toe steps.",
          "Do not allow the spine to wobble laterally; carry yourself tall."
        ],
        tigerTip: "One of the most primitive, functional, and posture-friendly strength movements. It binds the entire body into a cohesive unit."
      },
      {
        id: "core-paloff",
        name: "Anti-Rotation Pallof Press",
        target: "Obliques & Core Bracing",
        category: "Core/Abs",
        sets: 3,
        repsRange: "12 reps per side",
        restSeconds: 60,
        instructions: [
          "Set a cable pulley to chest height and stand side-on to the machine.",
          "Grasp the handle with both hands next to your sternum, feet shoulder-width.",
          "Press the handle straight outward, defying the sideways pull of the cable.",
          "Hold for 2 seconds with hands fully extended, then return smoothly."
        ],
        tigerTip: "This is anti-rotation training. The magic lies in preventing your spine from twisting outward, loading deep core."
      },
      {
        id: "bird-dogs",
        name: "Primal Cross-Bracing Bird Dogs",
        target: "Erector Spinae & Glute-Shoulder Bracing",
        category: "Lower Back",
        sets: 3,
        repsRange: "10 holds per side",
        restSeconds: 45,
        instructions: [
          "Get into a quadruped position on hands and knees with flat neutral spine.",
          "Reach one arm straight forward while extending the opposite leg directly backward.",
          "Keep hips pointing squared to the ground; don't twist open.",
          "Hold for 3 seconds, fully tensing the posterior line from heel to fingertip."
        ],
        tigerTip: "A pillar of Spinal Rehab pioneer Stuart McGill's 'Big Three'. Restores glute-lower-back firing patterns instantly."
      }
    ]
  },
  {
    dayIndex: 3,
    dayName: "Day 4",
    title: "Lower Back & Hinge Power",
    description: "Maximize posterior kinetic chain strength and absolute lower back protection.",
    focus: ["Lower Back Power", "Glutes & Hamstrings", "Spine Stabilization"],
    exercises: [
      {
        id: "posterior-rdl",
        name: "Db Romanian Deadlifts (RDLs)",
        target: "Hamstrings, Glutes & Erector Spinae",
        category: "Lower Back",
        sets: 4,
        repsRange: "8-10 reps",
        restSeconds: 120,
        instructions: [
          "Stand tall holding dumbbells in front of thighs. Soften your knees just slightly.",
          "Hinge at your hips, pushing them straight backward as you slide weights down your shins.",
          "Keep the spine completely flat and neck neutral, matching the tilt.",
          "Lower weights to mid-shin until you feel a deep hamstring stretch, then pull hips forward to stand."
        ],
        tigerTip: "Never round your lower back. The movement is vertical/horizontal hip translation, NOT spine bending."
      },
      {
        id: "back-extensions",
        name: "45-Degree Back Extensions",
        target: "Erector Spinae, Glutes & Hamstrings",
        category: "Lower Back",
        sets: 3,
        repsRange: "12-15 reps",
        restSeconds: 75,
        instructions: [
          "Position your hips snug against the pad of a 45-degree extension bench.",
          "Hinge forward at the hips, keeping your spine straight and hands crossed over chest.",
          "Rise smoothly back to alignment, utilizing glutes and spine erectors.",
          "Squeeze hard at the top of the range. Do not hyperextend at the peak."
        ],
        tigerTip: "Focus on pivoting from the hip crease. Rounding the upper back slightly at the bottom targets lower glutes/hamstrings more, keeping lower back healthy."
      },
      {
        id: "good-mornings",
        name: "Dumbbell Good Mornings",
        target: "Lower Back, Glutes & Hamstrings",
        category: "Lower Back",
        sets: 3,
        repsRange: "10-12 reps",
        restSeconds: 90,
        instructions: [
          "Stand with feet shoulder-width, cradling a dumbbell against your upper chest.",
          "Send your hips back, bowing forward slowly while keeping a flat back.",
          "Maintain a slight knee bend throughout the entire arc.",
          "Stop once your chest is nearly parallel to the floor, then return by contracting lower-body posterior muscles."
        ],
        tigerTip: "A magnificent hinge. Start light, prioritize complete core bracing, and search for the hamstring stretch."
      },
      {
        id: "kettlebell-carries",
        name: "Suitcase Hold (Single Kettlebell Carry)",
        target: "Lateral Core Stability & Spine Align",
        category: "Core/Abs",
        sets: 3,
        repsRange: "30 meters per side",
        restSeconds: 60,
        instructions: [
          "Hold a single heavy kettlebell or dumbbell in one hand, leaving the other free.",
          "Stand perfectly vertical, counteracting the heavy off-center pull.",
          "Walk in stable, slow paces, keeping shoulders perfectly level.",
          "Swap hands and repeat."
        ],
        tigerTip: "This is anti-lateral flexion. Your quadratus lumborum and obliques on the opposite side must fire violently to keep your posture straight as a spear."
      }
    ]
  },
  {
    dayIndex: 4,
    dayName: "Day 5",
    title: "Shoulder Caps & Arms",
    description: "Isolate the upper body, framing your physique with dense, round shoulders.",
    focus: ["Shoulder Caps", "Biceps & Triceps", "Collarbone Width"],
    exercises: [
      {
        id: "shoulder-db-press",
        name: "Seated Dumbbell Shoulder Press",
        target: "Anterior & Lateral Deltoids",
        category: "Shoulders",
        sets: 4,
        repsRange: "8-12 reps",
        restSeconds: 90,
        instructions: [
          "Sit on a high-backed bench, holding dumbbells at shoulder level with hand grips angled slightly.",
          "Press dumbbells straight up, converging them together slightly overhead.",
          "Lower back down to ears with full muscular control, avoiding dropping them.",
          "Ensure your elbows stay tucked in the scapular plane (approx 30 degrees forward)."
        ],
        tigerTip: "Tucking elbows slightly forward shields the shoulders from impingement, maximizing delta-recruitment."
      },
      {
        id: "dumbbell-bicep-curls",
        name: "Incline Dumbbell Supination Curls",
        target: "Biceps Brachii (Long Head)",
        category: "Arms",
        sets: 3,
        repsRange: "10-12 reps",
        restSeconds: 75,
        instructions: [
          "Sit on an incline bench set to 45 degrees, arms hanging straight down.",
          "Curl dumbbells up, rotating (supinating) wrists outward so palms face you at the top.",
          "Keep elbows pinned backward throughout the entire range.",
          "Stretch biceps fully at the bottom of each rep."
        ],
        tigerTip: "The incline pre-stretches the long head of the bicep, leading to deeper growth potential and peak isolation."
      },
      {
        id: "tricep-pushdown",
        name: "Rope Triceps Pushdown (Flared)",
        target: "Triceps (Lateral & Medial)",
        category: "Arms",
        sets: 3,
        repsRange: "12-15 reps",
        restSeconds: 60,
        instructions: [
          "Step in close to the high cable with rope attached.",
          "Keep upper arms locked strictly at your sides.",
          "Drive elbows straight down, pushing hands toward feet.",
          "At the bottom of the movement, peel the rope apart with your pinky fingers, locking out fully."
        ],
        tigerTip: "Splitting the rope flares the lateral heads, adding the classic broad silhouette back-arm profile."
      },
      {
        id: "arms-hammer-curls",
        name: "Hammer Grip Pinwheel Curls",
        target: "Brachialis & Brachioradialis (Arm Thickness)",
        category: "Arms",
        sets: 3,
        repsRange: "10-12 reps",
        restSeconds: 75,
        instructions: [
          "Stand tall holding dumbbells with neutral grips (palms facing each other).",
          "Curl one dumbbell across your torso towards the opposite shoulder.",
          "Squeeze and control the negative, returning to the starting position.",
          "Alternate arms smoothly."
        ],
        tigerTip: "Targets brachialis, which pushes up the outer biceps, contributing to a massive mid-arm visual size."
      }
    ]
  },
  {
    dayIndex: 5,
    dayName: "Day 6",
    title: "Functional Posture & Athletic Recovery",
    description: "Synthesize posture work and reinforce bulletproof joints.",
    focus: ["Posterior Recovery", "Spine Decompression", "Joint Health"],
    exercises: [
      {
        id: "rotational-turkish-getup",
        name: "Light Turkish Get-Ups (TGU)",
        target: "Spinal Stability, Shoulders & Posterior",
        category: "Core/Abs",
        sets: 3,
        repsRange: "3 paths per side",
        restSeconds: 90,
        instructions: [
          "Lie face-up on the floor with a dumbbell held straight up in your right hand.",
          "Follow the technical sequencing: roll to elbow, rise to palm, lift hips, sweep knee back.",
          "Lunge up to standing while constantly locking eyes on the overhead load.",
          "Slowly reverse each stage back to the floor with total coordination."
        ],
        tigerTip: "Revered as the ultimate posture reset. Every rotator cuff, spine stabilizer, and lateral chain muscle must work together."
      },
      {
        id: "recovery-dead-hangs",
        name: "Thoracic Dead Hang Decompression",
        target: "Spine Decompression & Grip Strength",
        category: "Lats",
        sets: 3,
        repsRange: "30-45s hold",
        restSeconds: 60,
        instructions: [
          "Grasp a pullup bar with a standard overhand grip.",
          "Release all lower-body effort, letting gravity stretch your obliques, ribs, and back muscles.",
          "Breathe deeply into your stomach, stretching your deep lat attachments.",
          "Descend slowly without dropping heavily."
        ],
        tigerTip: "The ultimate spine saver. Relieves pressure between vertebrae after heavy Romanian Deadlifts and carries."
      },
      {
        id: "recovery-bird-dogs",
        name: "Alternating Slow Bird-Dogs (Rehab)",
        target: "Spinal Health & Posterior Activation",
        category: "Lower Back",
        sets: 3,
        repsRange: "12 slower reps",
        restSeconds: 45,
        instructions: [
          "Set up on hands and knees with perfect alignment.",
          "Extend opposite arm and leg, executing a 4-second hold at the peak.",
          "Squeeze the fists and gluten to drive deep stability.",
          "Return precisely beneath you and alternate."
        ],
        tigerTip: "Keeps spinal pressure minimal while flushing core supporting muscles with high-oxygen recovery circulation."
      }
    ]
  }
];

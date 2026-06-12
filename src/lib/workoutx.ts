const WORKOUTX_API_KEY = "wx_2f5e7d97345de8a1af152ca4bc65f17f969d18997ef865004f66cf18";
const BASE_URL = "https://workoutxapp.com/api/v1";

export interface Alternate {
  name: string;
  target: string;
  instructions: string[];
}

export interface ExerciseExtraInfo {
  gifUrl: string;
  alternateName: string;
  alternateInstructions: string[];
  alternateTarget: string;
  alternatives: Alternate[]; // Array of exactly 3 alternative exercises
  googleSearchUrl: string;
}

// 24 Gym - Gemini Exercises details with Curated Alternates & Fallback illustration search terms.
export const CURATED_EXTRAS: Record<
  string,
  {
    searchQuery: string;
    alternateName: string;
    alternateTarget: string;
    alternateInstructions: string[];
    fallbackGifUrl: string; // High quality placeholder or fallback
  }
> = {
  "lats-pulldowns": {
    searchQuery: "wide grip lat pulldown",
    alternateName: "Underhand Close-Grip Lat Pulldown",
    alternateTarget: "Lower Lats & Brachialis",
    alternateInstructions: [
      "Attach a close-grip V-bar to the pulldown pulley station.",
      "Sit back, anchor your thighs, and grab the bar with hands facing each other.",
      "Squeeze your shoulder blades, pull down to your lower sternum, keeping elbows tucked close.",
      "Extend fully upwards under slow, deliberate control to stretch the lower lat insertion."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0861.gif"
  },
  "pullups-weighted": {
    searchQuery: "pull up",
    alternateName: "Neutral Grip Chinups",
    alternateTarget: "Lats & Brachioradialis",
    alternateInstructions: [
      "Hang from a bar using a neutral grip (palms facing each other) collar-width.",
      "Squeeze shoulder blades down, contract the core rigid, and pull your sternum to the bar.",
      "Slow down and control the eccentric descent to a fully decompressed hang."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0652.gif"
  },
  "lateral-raises": {
    searchQuery: "dumbbells lateral raise",
    alternateName: "Lean-Away Cable Lateral Raise",
    alternateTarget: "Lateral Deltoids (Continuous Tension)",
    alternateInstructions: [
      "Set a cable pulley to bottom height, stand sideways next to the stand.",
      "Grasp the handle with the outer hand, lean your body away at a 15-degree angle holding the pole.",
      "Raise the cable outward sideways until horizontal, feeling continuous isolation at the side head."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0334.gif"
  },
  "face-pulls": {
    searchQuery: "cable face pull",
    alternateName: "Chest-Supported Dumbbell Rear Delt Row",
    alternateTarget: "Rear Deltoids & Rhomboids",
    alternateInstructions: [
      "Lie face down on a 30-degree incline bench with dumbbells hanging свободно.",
      "Pull dumbbells up and outward, flaring elbows to 90 degrees to isolate rear caps.",
      "Hold the peak squeeze for a microsecond before returning."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0148.gif"
  },
  "core-plank-bracing": {
    searchQuery: "plank",
    alternateName: "Hollow Body Rocking Hold",
    alternateTarget: "Deep Transverse Abdominis & Rectus",
    alternateInstructions: [
      "Lie face up on the floor, flatten your lower back completely into the floor.",
      "Raise legs slightly, point toes, lift shoulders and reach arms backward over your ears.",
      "Maintain a strong banana-shaped curve, breathing shallowly without lifting your low back."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1301.gif"
  },
  "chest-incline-press": {
    searchQuery: "incline dumbbell chest press",
    alternateName: "Incline Barbell Bench Press",
    alternateTarget: "Sternal Upper Chest Clavicular Head",
    alternateInstructions: [
      "Lie on a 30-to-45-degree incline bench placing eyes directly under the rack bar.",
      "Unrack the barbell, lower it with flare control to touch the upper chest collar line.",
      "Push vertically, driving shoulders into the pad with robust feet drive."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0314.gif"
  },
  "rear-delt-flyes": {
    searchQuery: "rear delt fly",
    alternateName: "Reverse Pec Deck Machine Flyes",
    alternateTarget: "Rear Deltoids (Posterior Caps)",
    alternateInstructions: [
      "Sit facing the chest pad on a fly station. Set handles back fully.",
      "Grasp handles, keep chest tall and shoulder blades flat.",
      "Sweep arms back parallel to floor, squeezing rear caps without shrugging trap muscles."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1017.gif"
  },
  "chest-dips": {
    searchQuery: "chest dip",
    alternateName: "Decline Dumbbell Chest Press",
    alternateTarget: "Lower Chest Sternal Line & Triceps",
    alternateInstructions: [
      "Lie on a decline bench with weights resting on knees.",
      "Press dumbbells straight up, keeping wrists and elbows stacked vertically.",
      "Lower controlled to armpits, stretching sternal chest fibers, then press up together."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0141.gif"
  },
  "dumbbell-pullover": {
    searchQuery: "dumbbell pullover",
    alternateName: "Standing Cable Pullover",
    alternateTarget: "Lats & Serratus Anterior",
    alternateInstructions: [
      "Stand facing a high cable pulley. Attach straight or lat pulldown bar.",
      "Hinge hips backward 30 degrees, arm straight, gripping the bar overhead wider than shoulders.",
      "Pull the bar down in an arc to your thighs, leading with lats and keeping chest wide open."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0343.gif"
  },
  "core-hanging-raises": {
    searchQuery: "hanging leg raise",
    alternateName: "Captain's Chair Knee-to-Chest Raises",
    alternateTarget: "Lower Rectus Abdominis & Hips",
    alternateInstructions: [
      "Position back against pad on a tower station, gripping the supports firmly.",
      "Lift knees towards chest, actively tilting pelvis forward at top.",
      "Lower legs slowly, resisting momentum to isolate abs."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0462.gif"
  },
  "farmer-carries": {
    searchQuery: "farmers walk",
    alternateName: "Heavy Suitcase Hold (Isometric Lift)",
    alternateTarget: "Core Stabilizers, Forearm Grip",
    alternateInstructions: [
      "Deadlift one heavy dumbbell or kettlebell to a side position.",
      "Stand locked-out, maintaining perfect verticality. Stand tall for 45s per side."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0783.gif"
  },
  "core-paloff": {
    searchQuery: "pallof press",
    alternateName: "Plank with Alternating Shoulder Taps",
    alternateTarget: "Obliques & Anti-Rotation Core",
    alternateInstructions: [
      "Hold forearm plank position with feet loaded wide.",
      "Slowly lift one hand off ground to tap the opposite shoulder, with zero hip rotation.",
      "Return and alternate sides under pristine stability control."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0625.gif"
  },
  "bird-dogs": {
    searchQuery: "bird dog",
    alternateName: "Deadbug (Supine Cross-Body Core)",
    alternateTarget: "Erector Spinae & Rectus Abdominis",
    alternateInstructions: [
      "Lie on your back, legs in a table-top position, arms pointing up.",
      "Flatten lower back to ground. Lower right leg and left arm slowly to hover.",
      "Exhale back to start and switch. Phenomenal spinal support builder."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1381.gif"
  },
  "posterior-rdl": {
    searchQuery: "dumbbell romanian deadlift",
    alternateName: "Barbell Romanian Deadlift (BBRDL)",
    alternateTarget: "Hamstring and Glute Hinge Power",
    alternateInstructions: [
      "Stand tall holding barbell in front of thighs with hands shoulder-width.",
      "Slide bar down shins by pushing hips horizontally back, maintaining flat back.",
      "Decline until deep stretch, then squeeze glutes tightly to stand fully."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1126.gif"
  },
  "back-extensions": {
    searchQuery: "hyperextension",
    alternateName: "Supermans (Lie-Prone Extension)",
    alternateTarget: "Lower Back Erector Spinae",
    alternateInstructions: [
      "Lie face down on floor with legs straight and hands overhead.",
      "Inhale, squeeze glutes and raise chest, arms, and legs slightly off the floor.",
      "Hold the peak fly for 2 seconds, then lower under full discipline."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1144.gif"
  },
  "good-mornings": {
    searchQuery: "good morning",
    alternateName: "Barbell Postural Good Mornings",
    alternateTarget: "Spinal Erector and Hamstring Hinge",
    alternateInstructions: [
      "Rest barbell comfortably across your upper traps, standing shoulder width.",
      "Soft knee bend, push hips backward bowing torso to 45 degrees with flat spine.",
      "Squeeze glutes and extend hips to rise safely back to stand."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1151.gif"
  },
  "kettlebell-carries": {
    searchQuery: "farmers walk",
    alternateName: "High Overhead Kettlebell Waiter Carry",
    alternateTarget: "Shoulder Rotator Cuff & Lateral Core",
    alternateInstructions: [
      "Clean and press kettlebell overhead, locking elbow out straight.",
      "Ensure shoulder blade is pulled down and keep path steady.",
      "Walk in slow measurements, maintaining rigid body posture per side."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1402.gif"
  },
  "shoulder-db-press": {
    searchQuery: "seated dumbbell press",
    alternateName: "Standing Dumbbell Arnold Press",
    alternateTarget: "Deltoid Head Complex & Front Delts",
    alternateInstructions: [
      "Hold dumbbells in front of shoulders, palms facing you.",
      "Press up overhead while twisting wrists outward 180 degrees.",
      "Finish locked-out over ears with palms facing forward, reversing smoothly."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0350.gif"
  },
  "dumbbell-bicep-curls": {
    searchQuery: "dumbbell bicep curl",
    alternateName: "Standing Barbell Curl (EZ-Bar)",
    alternateTarget: "Biceps Brachii Core Thickness",
    alternateInstructions: [
      "Stand gripping EZ-bar with underhand grip outside shoulders.",
      "Pin elbows to ribs and curl the weight up towards shoulders.",
      "Lower under control, fully lengthening arms at bottom."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0294.gif"
  },
  "tricep-pushdown": {
    searchQuery: "triceps pushdown",
    alternateName: "Dumbbell Overhead Tricep Extension",
    alternateTarget: "Triceps Long Head (Symmetry)",
    alternateInstructions: [
      "Stand holding the inner plate of a heavy dumbbell with both hands overhead.",
      "Lower weight behind neck bend, flexing elbows past 90 degrees.",
      "Press vertical back overhead, contracting triceps long head."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1200.gif"
  },
  "arms-hammer-curls": {
    searchQuery: "dumbbell hammer curl",
    alternateName: "Seated Inclined Hammer Curl",
    alternateTarget: "Brachioradialis Thickness",
    alternateInstructions: [
      "Sit back on incline bench at 45 degrees, holding weights with neutral palms.",
      "Curl weights together without swinging, isolating brachialis with elbow pivot."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0313.gif"
  },
  "rotational-turkish-getup": {
    searchQuery: "turkish get up",
    alternateName: "Kettlebell Postural Windmills",
    alternateTarget: "Rotator Cuff & Hip Mobility",
    alternateInstructions: [
      "Stand wide with kettlebell pressed overhead in right arm.",
      "Turn feet 45 degrees left, look up at the weight overhead.",
      "Hinge hips right, sliding left hand down left leg to touch the ankle.",
      "Squeeze core and return straight tall."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1410.gif"
  },
  "recovery-dead-hangs": {
    searchQuery: "hanging lateral raise",
    alternateName: "Passive Lat Dumbbell Bench Stretch",
    alternateTarget: "Deep Intercostal & Lat Relaxation",
    alternateInstructions: [
      "Lie flat on bench, grasp bar or dumbbell behind head.",
      "Let weights extend overhead stretching deep chest/lat insertion.",
      "Breathe into belly decompressing ribcage profile."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/0652.gif"
  },
  "recovery-bird-dogs": {
    searchQuery: "bird dog",
    alternateName: "Slow Alternate Cat-Cow Spine Stretch",
    alternateTarget: "Thoracic & Lumbar Mobilization",
    alternateInstructions: [
      "Settle on hands and knees with neutral alignment.",
      "Arch back upwards (Cat) looking down tucking head in.",
      "Sink belly down towards ground (Cow) raising eyes up.",
      "Alternate slowly with breathing."
    ],
    fallbackGifUrl: "https://g.workoutxapp.com/1381.gif"
  }
};

export const ADDITIONAL_ALTERNATIVES: Record<string, { name: string; target: string; instructions: string[] }[]> = {
  "lats-pulldowns": [
    {
      name: "Single-Arm Cable Knee-Slight Row",
      target: "Outer Lat Sweeps & Serratus",
      instructions: [
        "Kneel sideways next to a cable pulley raised to chest height.",
        "Grasp handle, rotate your torso, and row down and back towards your low ribs.",
        "Squeeze the outer sweep, fully extending forward to feel the deep stretch."
      ]
    },
    {
      name: "Chest-Supported Lat DB Row",
      target: "Rhomboids & Mid-Back Thickness",
      instructions: [
        "Lie chest-down on a bench set to 30 degrees, holding weights below.",
        "Row dumbbells upward towards your hips, retracting shoulder blades.",
        "Squeeze outer-mid back muscles before under-control extension down."
      ]
    }
  ],
  "pullups-weighted": [
    {
      name: "Primal Bodyweight Inverted Rows",
      target: "Upper Back Restoration & Grips",
      instructions: [
        "Hang beneath a bar set to chest height with legs straight on the floor.",
        "Pull your chest to the bar under strict postural alignment.",
        "Decompress slowly to arm extension, maintaining a hollow core."
      ]
    },
    {
      name: "Assisted Pullup Machine",
      target: "Lats & Shoulder Posture Alignment",
      instructions: [
        "Select assistant weight, place knees securely on the pad.",
        "Grasp outer handles wide, pull body vertically keeping shoulders down.",
        "Control descent to prevent joint shearing at bottom range."
      ]
    }
  ],
  "lateral-raises": [
    {
      name: "Incline Bench Dumbbell Lateral Raise",
      target: "Side Deltoids (Upper Peak)",
      instructions: [
        "Lie chest-down on an incline bench at 45 degrees holding dumbbells.",
        "Raise weights outward sideways to shoulder level in a strong arc.",
        "Slowly lower dumbbells, keeping tension strictly on side caps."
      ]
    },
    {
      name: "Primal Kettlebell Halos",
      target: "Shoulder Girdle Rotator Decompression",
      instructions: [
        "Stand tall, cradling a light kettlebell upside down in front of your chin.",
        "Orbit the kettlebell horizontally around your head under strict core brace.",
        "Alternate directions smoothly to lubricate glenohumeral joints."
      ]
    }
  ],
  "face-pulls": [
    {
      name: "Bent-Over Dumbbell Rear Delt Raises",
      target: "Rear Deltoid Posterior Caps",
      instructions: [
        "Hinge hips back forty-five degrees, keeping flat spine.",
        "Raise dumbbells out to your sides, driving with the back of elbows.",
        "Feel the rear shoulders work, descending back down without swing."
      ]
    },
    {
      name: "Mobility Band Pull-Aparts",
      target: "Scapular Retractors & Rhomboids",
      instructions: [
        "Stand tall holding a resistance band straight in front with hands wide.",
        "Pull your hands apart across your chest, squeezing shoulder blades tightly.",
        "Control back to center, preserving perfect vertical head posture."
      ]
    }
  ],
  "core-plank-bracing": [
    {
      name: "Side Plank with Hip Dips",
      target: "Oblique Core Bracing & Anchoring",
      instructions: [
        "Prop up on one elbow in a linear side plank posture.",
        "Dip hips slowly to touch the floor, then drive them high back up.",
        "Activate internal obliques, keeping head aligned over spine."
      ]
    },
    {
      name: "Ab Wheel Core Rollouts",
      target: "Eccentric Core & Rectus Tension",
      instructions: [
        "Kneel on a soft pad, grasping your ab wheel handles.",
        "Roll forward, keeping back arched in a hollow body brace.",
        "Pull yourself back using your abdominal wall with pristine control."
      ]
    }
  ],
  "chest-incline-press": [
    {
      name: "Reverse Grip Flat Bench Press",
      target: "Clavicular Upper Pec Fiber Activation",
      instructions: [
        "Lie flat on the bench, grasping the barbell with an underhand grip.",
        "Unrack and lower with flare control to touch upper chest collar area.",
        "Drive vertically, maintaining active chest engagement and locked upper back."
      ]
    },
    {
      name: "Seated Incline Chest Press Machine",
      target: "Clavicular Pec Isolation & Push",
      instructions: [
        "Align seat height so handles sit close to upper chest.",
        "Press outward powerfully, avoiding shoulder takeover at end range.",
        "Return under active horizontal tension to dynamic stretch."
      ]
    }
  ],
  "rear-delt-flyes": [
    {
      name: "Seated Cable Rear Delt Flyes",
      target: "Rear Delts (Continuous Cable Squeeze)",
      instructions: [
        "Stand centering two pulleys. Grab left cable with right hand, right with left.",
        "Retract rear shoulders outward wide parallel to floor.",
        "Control hands back to start under complete cable tension."
      ]
    },
    {
      name: "Chest-Supported Dumbbell Y-Lifts",
      target: "Lower Trapezius & Postural Support",
      instructions: [
        "Lie face down on a 30-degree incline holding light weights.",
        "Raise arms up and out in a wide 'Y' shape, thumbs facing high.",
        "Squeeze the mid-outer back, avoiding neck shrug."
      ]
    }
  ],
  "chest-dips": [
    {
      name: "Dumbbell Floor Press",
      target: "Inner Pectoralis & Triceps Lockout",
      instructions: [
        "Lie flat on your back on the floor, holding dumbbells above.",
        "Descend dumbbells until upper arms touch floor flats gently.",
        "Press upward of chest squeeze, saving shoulders from excessive deep range."
      ]
    },
    {
      name: "Weighted Pushups (Plate On Upper Back)",
      target: "Pectoralis Major & Scapular Push",
      instructions: [
        "Place weight plate on your upper pack, standard pushup posture.",
        "Lower chest to touch floor, maintaining strict trunk alignment.",
        "Press up forcefully, protracting scapula at peak squeeze."
      ]
    }
  ],
  "dumbbell-pullover": [
    {
      name: "Elite Decline Dumbbell Pullover",
      target: "Serratus & Expanded Thoracic Cage",
      instructions: [
        "Utilize a decline bench, anchoring feet fully.",
        "Lower dumbbells behind head in wide arc, keeping hips down.",
        "Squeeze serratus to raise dumbbells back to eye level."
      ]
    },
    {
      name: "Straight-Arm Lat Cable Pushdowns",
      target: "Outer Lats & Armpit Isolation",
      instructions: [
        "Stand facing high cable, gripping bar shoulder wide.",
        "Hinge slightly, pulling bar down to thighs with straight arms.",
        "Contract outer lats, stretching back up controlled."
      ]
    }
  ],
  "core-hanging-raises": [
    {
      name: "Lying Leg Lifts with Posterior Butt Lift",
      target: "Shorter Range Lower Ab Bracing",
      instructions: [
        "Lie face up on floor, hands flat next to hips.",
        "Raise legs vertical, then push heels straight up lifting pelvis.",
        "Lower slowly back to floor, preventing low back arching."
      ]
    },
    {
      name: "Primal Advanced Dragon Flag Negatives",
      target: "Elite Full-Body Core Tenacity",
      instructions: [
        "Lie on bench, grasping edges behind head closely.",
        "Kick legs/pelvis vertical, raising entire trunk off pad.",
        "Lower body down in a rigid linear plank slowly as possible."
      ]
    }
  ],
  "farmer-carries": [
    {
      name: "Kettlebell Front Rack Walks",
      target: "Anterior Core Deep Alignment",
      instructions: [
        "Clean two kettlebells into a tight front-rack posture.",
        "Brace core, keep chest standing high, and walk slowly.",
        "Do not slouch forward holding the anterior load."
      ]
    },
    {
      name: "Heavy Sandbag Chest Carries",
      target: "Spine Erectors & Upper Back Bracing",
      instructions: [
        "Hug a heavy sandbag tight into chest, shoulders packed.",
        "Maintain upright postural carriage while walking with short, fast strides.",
        "Teaches extreme torso structural rigidity under load."
      ]
    }
  ],
  "core-paloff": [
    {
      name: "Cable Core Woodchoppers",
      target: "Obliques & Dynamic Rotational Drive",
      instructions: [
        "Stand shoulder wide, holding handle on high cable sideways.",
        "Rotate hips and pull cable diagonally down across your body.",
        "Pivot trailing foot, returning under solid torso control."
      ]
    },
    {
      name: "Rotational Russian Twists (Dumbbell/Kettlebell)",
      target: "Obliques & Active Twist Bracing",
      instructions: [
        "Sit on floor, knees bent, leaning torso back 45 degrees.",
        "Hold weight close, twist torso side to side matching head track.",
        "Engage core, keeping spine linear without slumping back."
      ]
    }
  ],
  "bird-dogs": [
    {
      name: "Glute Bridges with Alternate Extension",
      target: "Hamstrings, Glutes & Pelvic Reset",
      instructions: [
        "Lie face up, knees bent. Lift hips high to bridge.",
        "Slowly extend one knee straight, maintaining level hips.",
        "Squeeze glutes, return foot, and swap sides."
      ]
    },
    {
      name: "Postural Prone Cobra Holds (Thoracic)",
      target: "Thoracic Extension & Upper Back Health",
      instructions: [
        "Lie face down on floor, chest and chin resting neutral.",
        "Lift upper chest off ground, peeling hands, squeezing thumbs up.",
        "Hold peak extension for five seconds, looking down."
      ]
    }
  ],
  "posterior-rdl": [
    {
      name: "Good Mornings with Light Kettlebell",
      target: "Hinge Pattern Hamstring Stretch",
      instructions: [
        "Stand tall, hugging light kettlebell tightly into upper chest.",
        "Push hips backward bowing forward with flat spine.",
        "Rise to start, squeezing glutes hard at peak alignment."
      ]
    },
    {
      name: "Single-Leg Dumbbell RDL",
      target: "Unilateral Hamstrings & Hip Knee Stabilizers",
      instructions: [
        "Stand on one foot holding dumbbells. Keep back straight.",
        "Hinge hips, lifting non-standing leg straight back.",
        "Descend weights close to leg, then drive standing foot to rise."
      ]
    }
  ],
  "back-extensions": [
    {
      name: "Reverse Hyperextensions on Flat Bench",
      target: "Lumbo-Pelvic Decompression & Glutes",
      instructions: [
        "Lie chest-down on flat bench, hips resting off edge, grabbing pad.",
        "Keep legs straight and raise them to horizontal using glutes.",
        "Lower slowly below bench line to stretch lower back safely."
      ]
    },
    {
      name: "Dynamic Kettlebell Swings (Hip Hinge)",
      target: "Posterior Chain Kinetic Power & Back Strength",
      instructions: [
        "Hinge at hips, pulling kettlebell between legs.",
        "Drive hips forward explosively, swinging kettlebell to chest line.",
        "Maintain upright posture at peak lockout, avoiding lean-back."
      ]
    }
  ],
  "good-mornings": [
    {
      name: "Cable Postural Pull-Throughs",
      target: "Glute Hinge & Lower Back Decompression",
      instructions: [
        "Stand facing away from low cable, rope pulled between legs.",
        "Hinge forward pushing hips back, allowing cable to pull hands under.",
        "Drive hips forward, standing tall with complete posterior glute squeeze."
      ]
    },
    {
      name: "Chest-Supported Dumbbell Rows (Incline Bench Hinge)",
      target: "Postural Mid-Back Align & Rhomboids",
      instructions: [
        "Sit chest Supported on 30 degree incline bench holding dumbbells.",
        "Row dumbbells strictly upwards keeping chest wide, retracting blades.",
        "Control down smoothly to decompress mid-back tension."
      ]
    }
  ],
  "kettlebell-carries": [
    {
      name: "Zercher Load Walks (Barbell in Elbows)",
      target: "Anterior Rib Protection & Posture Power",
      instructions: [
        "Cradle barbell tightly in crooks of your elbows, chest held high.",
        "Walk with solid, tight steps, bracing pelvis and upper core.",
        "Do not allow upper shoulders to slouch forward under barbell."
      ]
    },
    {
      name: "Standard Heavy Dumbbell Walks",
      target: "Traps & Absolute Grip Symmetric Health",
      instructions: [
        "Stand holding two robust dumbbells at sides.",
        "Squeeze handles, pack shoulders, and walk with tall, deliberate stride."
      ]
    }
  ],
  "shoulder-db-press": [
    {
      name: "Overhead Barbell Military Press",
      target: "Anterior Delts & Absolute Push Power",
      instructions: [
        "Setup barbell on upper rack. Unrack resting on collarbone line.",
        "Core braced, press bar vertically close to face.",
        "Lockout overhead, pushing head slightly forward at top of range."
      ]
    },
    {
      name: "Landmine Single-Arm Diagonal Press",
      target: "Unilateral Anterior Delts & Rotator Cuff",
      instructions: [
        "Stand close to landmine sleeve, holding bar end in right palm.",
        "Press bar up-and-forward diagonally under controlled stance.",
        "Avoid twisting lower back; push directly from shoulders."
      ]
    }
  ],
  "dumbbell-bicep-curls": [
    {
      name: "Preacher Bench Dumbbell Curls",
      target: "Bicep Peak Short Head Isolator",
      instructions: [
        "Sit on preacher bench resting upper arms flat on pad.",
        "Curl dumbbell upward to chin, squeeze forearm flexors.",
        "Extend arms fully back down under strict slow control."
      ]
    },
    {
      name: "Cable Bicep Flex Curls (High Pulley Dual)",
      target: "Symmetric Bicep Peak Peak Tension",
      instructions: [
        "Center between high cables holding both D-handles.",
        "Curl hands towards ears, keeping upper arms parallel to floor.",
        "Deeply contract bicep peak, returning slowly."
      ]
    }
  ],
  "tricep-pushdown": [
    {
      name: "EZ Bar Close Grip Push Press",
      target: "Triceps Core Power Block & Inner Chest",
      instructions: [
        "Lie on bench, grip EZ bar inside shoulder width.",
        "Lower bar to mid chest keeping elbows tucked tight to ribs.",
        "Press up explosively, squeezing triceps at peak lockout."
      ]
    },
    {
      name: "Bodyweight Parallel Bench Dips",
      target: "Triceps Lateral Squeeze & Lower Chest",
      instructions: [
        "Sit on bench flat, hands next to hips. Reach legs straight in front.",
        "Slide hips forward off bench, dip down bending elbows ninety degrees.",
        "Press straight back up using triceps power."
      ]
    }
  ],
  "arms-hammer-curls": [
    {
      name: "Cross-Body Cable Cable Hammer Curls",
      target: "Brachialis Outer Arm Thickness",
      instructions: [
        "Grab low cable handle using neutral thumb-up grip.",
        "Curl across torso towards opposite clavicle, squeezing outer arm.",
        "Release down slowly to experience clean cable tension."
      ]
    },
    {
      name: "Reverse Grip Barbell Extensor Curls",
      target: "Forearm Muscle Extensor System",
      instructions: [
        "Rest forearms on flat bench, hands hanging off edge pronated.",
        "Curl wrists upwards, raising the barbell using forearms.",
        "Decompress smoothly to full extension."
      ]
    }
  ],
  "rotational-turkish-getup": [
    {
      name: "Primal Dumbbell Static Overhead Hold",
      target: "Thoracic Rib Cage Alignment & Cuff",
      instructions: [
        "Clean and press heavy dumbbell overhead, arm locked straight.",
        "Engage core, keep eyes straight forward, and hold for 30s.",
        "Provides excellent shoulder active stability reset."
      ]
    },
    {
      name: "Prone Kneeling T-Spine Opener Stretch",
      target: "T-Spine Mobility & Active Recovery",
      instructions: [
        "Get onto hands and knees. Place left hand behind head.",
        "Rotate elbow down to touch right forearm, then twist high to ceiling.",
        "Open thoracic spine thoroughly, returning controlled."
      ]
    }
  ],
  "recovery-dead-hangs": [
    {
      name: "Prone Active Child's Pose Lat Reach",
      target: "Thoracic Lat & Rib Cage Unwinding",
      instructions: [
        "Kneel on floor, sink hips back to heels stretching arms forward.",
        "Walk both hands slowly to left side, breathing into right lower ribcage.",
        "Repeat on opposite side to decompress lat attachments."
      ]
    },
    {
      name: "Doorway Postural Pec & Thoracic Opener",
      target: "Front Collarbone Decompression & Posture",
      instructions: [
        "Place forearms on door frame, elbows at ninety degrees.",
        "Step body forward gently, breathing into deep front pec stretch.",
        "Restores chest opening after heavy press sessions."
      ]
    }
  ],
  "recovery-bird-dogs": [
    {
      name: "Kneeling Quadruped Outer Hip Circles",
      target: "Pelvic Deep Reset & Glute Mobility",
      instructions: [
        "Keep hands and knees flat. Raise right knee sideways (fire hydrant).",
        "Draw five large circles slowly in the air using your knee.",
        "Reconditions hip socket tracking safely."
      ]
    },
    {
      name: "Thread the Needle Shoulder & Thoracic Sweep",
      target: "Scapular Restoration & Upper Back Decompression",
      instructions: [
        "Kneel on arms and knees. Reach right hand vertically to ceiling.",
        "Sweep it down and through beneath left armpit, resting shoulder on floor.",
        "Hold for deep breath into back scapula, restoring thoracic space."
      ]
    }
  ]
};

/**
 * Fetch exercise details from WorkoutX with local fallback if the API is rate-limited,
 * offline, gets CORS blocks, or does not match.
 */
export async function getExerciseDetails(exerciseId: string, exerciseName: string): Promise<ExerciseExtraInfo> {
  const extra = CURATED_EXTRAS[exerciseId];
  const query = extra?.searchQuery || exerciseName.toLowerCase();
  const fallbackGif = extra?.fallbackGifUrl || "https://g.workoutxapp.com/0861.gif"; 
  const alternateName = extra?.alternateName || "Alternate Exercise";
  const alternateTarget = extra?.alternateTarget || "Same Muscle Groups";
  const alternateInstructions = extra?.alternateInstructions || [
    "Perform the alternative version with slow tempo.",
    "Maintain perfect posture and strong muscular connection."
  ];

  // Compile 3 alternatives in order
  const alt1 = {
    name: alternateName,
    target: alternateTarget,
    instructions: alternateInstructions
  };
  const extraAlts = ADDITIONAL_ALTERNATIVES[exerciseId] || [
    {
      name: `${exerciseName} Alternative 2`,
      target: alternateTarget,
      instructions: ["Perform with steady control.", "Focus on target muscle fatigue."]
    },
    {
      name: `${exerciseName} Alternative 3`,
      target: alternateTarget,
      instructions: ["Execute using controlled negative.", "Maintain straight posture and solid alignment."]
    }
  ];
  const alternatives = [alt1, ...extraAlts]; // Array of exactly 3 alternatives

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent("how to do " + exerciseName + " exercise form video search help")}`;

  try {
    const response = await fetch(`/api/workoutx?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(3500) // Don't block loading forever if API times out
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Search first matching candidate
        const match = data[0];
        if (match.gifUrl) {
          // Route external media through our gif-proxy to bypass Referer check
          const proxiedGifUrl = `/api/gif-proxy?url=${encodeURIComponent(match.gifUrl)}`;
          return {
            gifUrl: proxiedGifUrl,
            alternateName,
            alternateTarget,
            alternateInstructions,
            alternatives,
            googleSearchUrl
          };
        }
      }
    }
  } catch (err) {
    console.warn(`WorkoutX API proxy unreachable for "${exerciseName}". Routing fallback media through server proxy.`, err);
  }

  // Local Fallback with proxied GIF to ensure secure render
  const proxiedFallbackGif = `/api/gif-proxy?url=${encodeURIComponent(fallbackGif)}`;
  return {
    gifUrl: proxiedFallbackGif,
    alternateName,
    alternateTarget,
    alternateInstructions,
    alternatives,
    googleSearchUrl
  };
}

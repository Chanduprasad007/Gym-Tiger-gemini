const WORKOUTX_API_KEY = "wx_2f5e7d97345de8a1af152ca4bc65f17f969d18997ef865004f66cf18";
const BASE_URL = "https://workoutxapp.com/api/v1";

export interface ExerciseExtraInfo {
  gifUrl: string;
  alternateName: string;
  alternateInstructions: string[];
  alternateTarget: string;
  googleSearchUrl: string;
}

// 24 Gym Tiger Exercises details with Curated Alternates & Fallback illustration search terms.
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
    googleSearchUrl
  };
}

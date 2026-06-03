-- ============================================================
-- WORKOUT LIBRARY SEED
-- Run in Supabase SQL Editor after applying migration 0007
-- Replace <TENANT_ID> with your actual tenant UUID before running
-- ============================================================

-- 1. Coaches
INSERT INTO coaches (id, tenant_id, display_name, slug, photo_url, bio, location, specialties, active)
VALUES
  (
    gen_random_uuid(),
    '<TENANT_ID>',
    'Alex Rivera',
    'alex-rivera',
    '/assets/coach-alex.jpg',
    'Alex has spent the last 12 years coaching raw powerlifters, from first-time meet competitors to nationally-ranked lifters. A former collegiate football player, he transitioned to barbell sport after a knee injury and now specializes in long-term programming, technique breakdowns on the big three, and peaking for meets. He believes in boring, repeatable training cycles and brutal honesty about your weak points.',
    'Fort Lauderdale',
    ARRAY['Strength', 'Powerlifting'],
    true
  ),
  (
    gen_random_uuid(),
    '<TENANT_ID>',
    'Maya Chen',
    'maya-chen',
    '/assets/coach-maya.jpg',
    'Maya is a registered dietitian with a master''s in clinical nutrition from NYU. She spent four years at a sports medicine clinic working with endurance athletes and CrossFit competitors before moving into private practice. Her approach is firmly evidence-based but pragmatic — she''d rather help you nail 80% of your nutrition forever than chase a perfect plan you''ll quit in three weeks.',
    'Miami',
    ARRAY['Nutrition', 'Hypertrophy'],
    true
  ),
  (
    gen_random_uuid(),
    '<TENANT_ID>',
    'Sam Okafor',
    'sam-okafor',
    '/assets/coach-sam.jpg',
    'Sam is a doctor of physical therapy who spent six years in outpatient ortho before joining full-time. He''s worked with everyone from post-op ACL patients to masters-level Olympic weightlifters trying to keep their shoulders intact. His sessions blend FRC-style joint control work, soft tissue assessment, and honest conversations about load management.',
    'Miami',
    ARRAY['Mobility', 'Rehab'],
    true
  ),
  (
    gen_random_uuid(),
    '<TENANT_ID>',
    'Jess Park',
    'jess-park',
    '/assets/coach-jess.jpg',
    'Jess is a former NCAA Division I 800m runner who pivoted to conditioning coaching after college. She''s spent the last eight years building interval and metcon programs for everyone from desk-job beginners to amateur hybrid athletes. Her workouts are structured around heart-rate zones, not just feeling smoked — so you actually adapt instead of just suffering.',
    'Fort Lauderdale',
    ARRAY['Conditioning', 'Cardio'],
    true
  );

-- Helper: get coach IDs by slug (used in workout inserts below)
-- NOTE: Run the coach inserts above first, then verify IDs with:
-- SELECT id, display_name, slug FROM coaches WHERE tenant_id = '<TENANT_ID>';
-- Then replace the coach_id values in the workout inserts.

-- ============================================================
-- 2. Workouts
-- Replace coach_id UUIDs with actual IDs from your coaches table.
-- Format: (id, tenant_id, coach_id, title, category, level, muscle_groups,
--          duration_minutes, summary, length_label, saves_count,
--          coach_notes, structure, published_at)
-- ============================================================

-- STRENGTH workouts (coach: Alex Rivera)
INSERT INTO workouts (
  id, tenant_id, coach_id, title, category, level, muscle_groups,
  duration_minutes, summary, length_label, saves_count, coach_notes,
  structure, published_at
)
SELECT
  gen_random_uuid(),
  '<TENANT_ID>',
  c.id,
  w.title,
  w.category,
  w.level,
  w.muscle_groups,
  w.duration_minutes,
  w.summary,
  w.length_label,
  w.saves_count,
  w.coach_notes,
  w.structure::jsonb,
  now()
FROM coaches c,
(VALUES
  (
    'Posterior Chain Reset',
    'Strength', 'Intermediate',
    ARRAY['Hamstrings', 'Glutes', 'Lower back'],
    45,
    'A focused posterior chain session built around the hip hinge. Designed to rebuild glute and hamstring strength after a stretch of front-loaded squat work.',
    '1 day', 342,
    'Keep load honest on the RDLs — most people overshoot and lose the hinge. Film a set from the side. If your low back is doing the work, drop a plate.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"5 min bike + banded glute series (clam shells, lateral walks), 2 rounds"},{"name":"A. Trap-bar deadlift","detail":"4 × 5 @ RPE 7, rest 2:30 between sets"},{"name":"B. Romanian deadlift","detail":"3 × 8, controlled 3-second eccentrics"},{"name":"C. Back extension","detail":"3 × 12, 2-second pause at top"},{"name":"D. Reverse hyper or hollow hold","detail":"3 × 30s, rest 60s"},{"name":"E. Face pull","detail":"3 × 15, external rotation at end"},{"name":"Cool-down","detail":"5 min walk + hip flexor stretch, 2 min/side"}]}]}]}'
  ),
  (
    'Squat Strength',
    'Strength', 'Advanced',
    ARRAY['Quads', 'Glutes'],
    60,
    'A 3-week squat peaking block. Builds toward a heavy single while trimming back-off volume. Built for lifters at or near their meet peak.',
    '3 week', 567,
    'Don''t chase a PR if your warm-ups feel grindy. Hit your RPE 8 and move on — the back-offs are where the work gets done.',
    '{"weeks":[{"label":"Week 1","days":[{"label":"Day 1 — Heavy squat","blocks":[{"name":"Warm-up","detail":"Bar × 10, ramp by 50lbs to opener + hip mob"},{"name":"A. Back squat","detail":"Top single @ RPE 7, then back-off 4 × 5 @ 78%"},{"name":"B. Walking lunge","detail":"3 × 10/side, DBs in hand"},{"name":"C. Standing calf raise","detail":"3 × 12, 2s pause at top"},{"name":"Cool-down","detail":"5 min walk + couch stretch 2 min/side"}]},{"label":"Day 2 — Pause squat","blocks":[{"name":"Warm-up","detail":"Bar × 10 + hip CARs"},{"name":"A. Pause squat","detail":"3 × 3 @ 70%, 2s pause in hole"},{"name":"B. Romanian deadlift","detail":"3 × 8, hinge focus"},{"name":"C. Plank + dead bug","detail":"3 rounds: 45s plank + 8/side dead bug"}]}]},{"label":"Week 2","days":[{"label":"Day 1 — Top single","blocks":[{"name":"Warm-up","detail":"Bar × 10, ramp sets"},{"name":"A. Back squat","detail":"Top single @ RPE 8, then back-off 3 × 4 @ 82%"},{"name":"B. Front-foot elevated split squat","detail":"3 × 8/side, controlled"},{"name":"C. Standing calf raise","detail":"3 × 10, 2s pause"}]},{"label":"Day 2 — Accessory","blocks":[{"name":"A. Romanian deadlift","detail":"3 × 8, hinge focus"},{"name":"B. Pallof press","detail":"3 × 10/side, anti-rotation"},{"name":"C. Side plank","detail":"3 × 30s/side"}]}]},{"label":"Week 3","days":[{"label":"Day 1 — Peak single","blocks":[{"name":"Warm-up","detail":"Bar × 10, ramp to opener"},{"name":"A. Back squat","detail":"Top single @ RPE 9, then back-off 2 × 3 @ 85%"},{"name":"B. Walking lunge","detail":"2 × 8/side, light"},{"name":"Cool-down","detail":"5 min walk + deep breathing + hip stretch"}]},{"label":"Day 2 — Light accessory","blocks":[{"name":"A. Glute ham raise or back extension","detail":"3 × 10"},{"name":"B. Standing calf raise","detail":"3 × 10"},{"name":"C. Plank","detail":"2 × 45s"}]}]}]}'
  ),
  (
    'Full-Body Foundations',
    'Strength', 'Beginner',
    ARRAY['Full body'],
    45,
    'A simple, repeatable full-body session for newer lifters. Builds technique on the major compounds with manageable volume.',
    '4 week', 992,
    'Don''t add weight until every rep looks the same. Three good weeks of clean reps will get you further than rushing the loading.',
    '{"weeks":[{"label":"Week 1","days":[{"label":"Day 1 — Full body A","blocks":[{"name":"Warm-up","detail":"5 min bike + leg swings + band pull-aparts 2 × 15"},{"name":"A. Goblet squat","detail":"3 × 8, light DB, pause 1s at bottom"},{"name":"B. DB bench press","detail":"3 × 8, control the eccentric"},{"name":"C. One-arm row","detail":"3 × 10/side"},{"name":"D. Plank","detail":"3 × 30s"},{"name":"Cool-down","detail":"5 min walk + hip flexor stretch"}]},{"label":"Day 2 — Full body B","blocks":[{"name":"Warm-up","detail":"5 min bike + dynamic flow"},{"name":"A. Goblet squat","detail":"3 × 8"},{"name":"B. Hip thrust","detail":"3 × 10"},{"name":"C. Farmer carry","detail":"3 × 30m"},{"name":"D. Dead bug","detail":"3 × 8/side"}]}]},{"label":"Week 2","days":[{"label":"Day 1","blocks":[{"name":"A. Goblet squat","detail":"4 × 8, same load, quality reps"},{"name":"B. DB bench press","detail":"4 × 8"},{"name":"C. One-arm row","detail":"4 × 10/side"},{"name":"D. Side plank","detail":"3 × 25s/side"}]},{"label":"Day 2","blocks":[{"name":"A. Hip thrust","detail":"3 × 12"},{"name":"B. Lateral raise","detail":"3 × 12"},{"name":"C. Plank","detail":"3 × 35s"}]}]},{"label":"Week 3","days":[{"label":"Day 1 — Heavier A","blocks":[{"name":"A. Goblet squat","detail":"4 × 6, +5lb, maintain depth"},{"name":"B. DB bench press","detail":"4 × 6, +5lb"},{"name":"C. One-arm row","detail":"4 × 8/side, +5lb"}]},{"label":"Day 2 — Heavier B","blocks":[{"name":"A. Hip thrust — barbell","detail":"3 × 8"},{"name":"B. Dead bug","detail":"3 × 8/side, slow"},{"name":"C. Face pull","detail":"3 × 15"}]}]},{"label":"Week 4","days":[{"label":"Day 1 — Test day","blocks":[{"name":"A. Goblet squat — heavy 5","detail":"Work to a clean 5, leave 2 in tank"},{"name":"B. DB bench press — heavy 5","detail":"Work to a clean 5"},{"name":"C. One-arm row","detail":"3 × 8/side"}]},{"label":"Day 2 — Deload","blocks":[{"name":"A. Hip thrust","detail":"3 × 8, light"},{"name":"B. Plank","detail":"2 × 45s"},{"name":"C. Band pull-apart","detail":"3 × 15"}]}]}]}'
  ),
  (
    'Overhead Power',
    'Strength', 'Intermediate',
    ARRAY['Shoulders', 'Upper back'],
    50,
    'Overhead pressing emphasis with complementary pulling. Builds pressing strength and shoulder health in balance.',
    '1 day', 189,
    'Brace your core before every press rep. If your lower back caves, drop the load and fix the pattern first.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"5 min bike + band pull-aparts 2 × 15, shoulder dislocates"},{"name":"A. Strict press","detail":"4 × 5 @ RPE 7, rest 2:30"},{"name":"B. Push press","detail":"3 × 3, use leg drive to reach new overhead heights"},{"name":"C. Weighted pull-up","detail":"3 × 6, rest 2:00"},{"name":"D. Face pull","detail":"3 × 15, external rotation finish"},{"name":"E. Farmer carry","detail":"3 × 40m, heavy"},{"name":"Cool-down","detail":"5 min walk + lat stretch + thoracic foam roll"}]}]}]}'
  )
) AS w(title, category, level, muscle_groups, duration_minutes, summary, length_label, saves_count, coach_notes, structure)
WHERE c.slug = 'alex-rivera' AND c.tenant_id = '<TENANT_ID>';

-- HYPERTROPHY workouts (coach: Alex Rivera)
INSERT INTO workouts (
  id, tenant_id, coach_id, title, category, level, muscle_groups,
  duration_minutes, summary, length_label, saves_count, coach_notes,
  structure, published_at
)
SELECT
  gen_random_uuid(),
  '<TENANT_ID>',
  c.id,
  w.title,
  w.category,
  w.level,
  w.muscle_groups,
  w.duration_minutes,
  w.summary,
  w.length_label,
  w.saves_count,
  w.coach_notes,
  w.structure::jsonb,
  now()
FROM coaches c,
(VALUES
  (
    'Chest & Triceps Volume',
    'Hypertrophy', 'Intermediate',
    ARRAY['Chest', 'Triceps'],
    60,
    'A six-day push/pull/legs split biased toward chest and triceps growth. Repeats twice across the week with a heavier and a lighter day per movement pattern.',
    '6 day', 891,
    'Aim for 1-2 reps shy of failure on the accessories. If you can''t get a real stretch on the fly, lower the cable position.',
    '{"weeks":[{"label":"Week 1","days":[{"label":"Day 1 — Heavy push","blocks":[{"name":"Warm-up","detail":"5 min bike + band pull-aparts 2 × 15"},{"name":"A. Incline barbell press","detail":"4 × 5 @ RPE 8, rest 3:00"},{"name":"B. Flat DB press","detail":"3 × 8, control the eccentric"},{"name":"C. Dip","detail":"3 × 8, +load if clean form"},{"name":"D. Close-grip bench","detail":"3 × 8, elbows tucked 45°"},{"name":"E. Lateral raise","detail":"3 × 12, pause 1s at top"},{"name":"F. Face pull","detail":"3 × 15, external rotation finish"}]},{"label":"Day 2 — Heavy pull","blocks":[{"name":"A. Weighted pull-up","detail":"4 × 6, rest 2:30"},{"name":"B. Barbell row","detail":"3 × 8"},{"name":"C. EZ-bar curl","detail":"3 × 8, 3s lowering"},{"name":"D. Incline DB curl","detail":"3 × 10, full range"},{"name":"E. Farmer carry","detail":"3 × 40m, heavy"}]},{"label":"Day 3 — Heavy legs","blocks":[{"name":"A. Back squat","detail":"4 × 5 @ RPE 8, rest 3:00"},{"name":"B. RDL","detail":"3 × 8, controlled lowering"},{"name":"C. Walking lunge","detail":"3 × 10/side"},{"name":"D. Standing calf raise","detail":"4 × 10, 2s pause at top"}]},{"label":"Day 4 — Volume push","blocks":[{"name":"A. Incline DB press","detail":"4 × 10, rest 90s"},{"name":"B. Flat machine press","detail":"3 × 12, 2s pause at chest"},{"name":"C1. Cable fly","detail":"3 × 15, deep stretch at bottom"},{"name":"C2. Rope pushdown","detail":"3 × 15, split rope at bottom"},{"name":"D. Overhead triceps extension","detail":"3 × 12, slow eccentric"},{"name":"E. Lateral raise","detail":"3 × 15, control the negative"}]},{"label":"Day 5 — Volume pull","blocks":[{"name":"A. Lat pulldown","detail":"4 × 12, control the negative"},{"name":"B. Seated cable row","detail":"3 × 12, squeeze 1s"},{"name":"C. Face pull","detail":"3 × 15"},{"name":"D. Incline DB curl","detail":"3 × 12, full stretch at bottom"},{"name":"E. Hammer curl","detail":"3 × 12, neutral grip"}]},{"label":"Day 6 — Volume legs","blocks":[{"name":"A. Front squat","detail":"4 × 6, rest 2:30"},{"name":"B. Leg press","detail":"3 × 12, full range"},{"name":"C. Hip thrust","detail":"3 × 10, 2s hold at top"},{"name":"D. Leg curl","detail":"3 × 12, control the eccentric"},{"name":"E. Seated calf raise","detail":"4 × 12, 2s pause at stretch"}]}]}]}'
  ),
  (
    'Back & Biceps Pull',
    'Hypertrophy', 'Intermediate',
    ARRAY['Back', 'Biceps'],
    45,
    'Classic pull session with a mix of vertical and horizontal pulling, finished with focused biceps work.',
    '1 day', 234,
    'Initiate every row from the elbow, not the hand. If you feel forearms before lats, your grip is too tight.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"5 min row + band pull-aparts, 2 × 15"},{"name":"A. Weighted pull-up","detail":"4 × 6-8, rest 2:00"},{"name":"B. Chest-supported row","detail":"3 × 10-12, squeeze 1s at top"},{"name":"C. Lat pulldown — wide grip","detail":"3 × 12, controlled lowering"},{"name":"D1. Incline DB curl","detail":"3 × 10, full stretch at bottom"},{"name":"D2. Hammer curl","detail":"3 × 10, neutral grip"},{"name":"E. Reverse fly","detail":"3 × 12, rear delt focus"},{"name":"F. Farmer carry","detail":"3 × 40m, heavy"},{"name":"Cool-down","detail":"5 min walk + doorway pec stretch"}]}]}]}'
  ),
  (
    'Shoulder & Arms Pump',
    'Hypertrophy', 'Beginner',
    ARRAY['Shoulders', 'Arms'],
    45,
    'Approachable hypertrophy day focused on shoulders and arms. Great as a third or fourth lifting day in a beginner split.',
    '1 day', 678,
    'Lateral raises don''t need to be heavy. Pick a weight you can pause at the top — that''s the magic.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"5 min bike + band pull-aparts 2 × 15, shoulder dislocates"},{"name":"A. Seated DB press","detail":"3 × 10, controlled eccentric"},{"name":"B. Lateral raise","detail":"4 × 12-15, pause at top 1s"},{"name":"C. Rear delt fly","detail":"3 × 15, chest supported"},{"name":"D1. EZ-bar curl","detail":"3 × 10, 3s lowering"},{"name":"D2. Rope pushdown","detail":"3 × 12, squeeze at lockout"},{"name":"E. Face pull","detail":"3 × 15, external rotation finish"},{"name":"Cool-down","detail":"5 min walk + cross-body shoulder stretch 90s/side"}]}]}]}'
  ),
  (
    'Glute Hypertrophy',
    'Hypertrophy', 'Intermediate',
    ARRAY['Glutes', 'Hamstrings'],
    45,
    'High-volume glute session with varied loading angles. Combines hip thrusts, split squats, and isolation work for maximum posterior development.',
    '1 day', 445,
    'Don''t rush the hip thrust eccentric. A 2-second lowering phase will double the stimulus.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"5 min bike + banded clam shells 2 × 20, lateral walks 2 × 15m"},{"name":"A. Barbell hip thrust","detail":"4 × 10, 2s hold at top, rest 90s"},{"name":"B. Bulgarian split squat","detail":"3 × 10/side, back foot elevated"},{"name":"C. Cable kickback","detail":"3 × 15/side, controlled"},{"name":"D. Leg curl","detail":"3 × 12, slow eccentric"},{"name":"E. Sumo deadlift — light","detail":"3 × 8, wide stance, hinge focus"},{"name":"Cool-down","detail":"5 min walk + pigeon pose 2 min/side"}]}]}]}'
  )
) AS w(title, category, level, muscle_groups, duration_minutes, summary, length_label, saves_count, coach_notes, structure)
WHERE c.slug = 'alex-rivera' AND c.tenant_id = '<TENANT_ID>';

-- CARDIO workouts (coach: Jess Park)
INSERT INTO workouts (
  id, tenant_id, coach_id, title, category, level, muscle_groups,
  duration_minutes, summary, length_label, saves_count, coach_notes,
  structure, published_at
)
SELECT
  gen_random_uuid(),
  '<TENANT_ID>',
  c.id,
  w.title,
  w.category,
  w.level,
  w.muscle_groups,
  w.duration_minutes,
  w.summary,
  w.length_label,
  w.saves_count,
  w.coach_notes,
  w.structure::jsonb,
  now()
FROM coaches c,
(VALUES
  (
    'Conditioning: Zone 2',
    'Cardio', 'All Levels',
    ARRAY['Engine', 'Recovery'],
    40,
    'An 8-week aerobic base build. Steady-state work in heart-rate zone 2, progressing duration each week without taxing your lifting recovery.',
    '8 week', 1203,
    'If you can''t hold a full conversation, you''re going too hard. Cap effort — this session is about volume, not suffering.',
    '{"weeks":[{"label":"Week 1","days":[{"label":"Day 1 — Steady spin","blocks":[{"name":"Warm-up","detail":"5 min easy spin, RPE 3 + dynamic leg swings"},{"name":"Main","detail":"30 min continuous zone 2, HR 60-65% max"},{"name":"Cool-down","detail":"5 min walk + box breathing"}]},{"label":"Day 2 — Nasal-only easy","blocks":[{"name":"Warm-up","detail":"5 min walk-jog"},{"name":"Main","detail":"25 min easy zone 2, nasal breathing only"},{"name":"Cool-down","detail":"5 min walk + calf stretch"}]}]},{"label":"Week 2","days":[{"label":"Day 1","blocks":[{"name":"Main","detail":"30 min continuous zone 2, HR 60-65% max"}]},{"label":"Day 2","blocks":[{"name":"Main","detail":"30 min continuous zone 2, same HR"}]},{"label":"Day 3 — Recovery","blocks":[{"name":"Main","detail":"20 min recovery pace, nasal only"}]}]},{"label":"Week 3","days":[{"label":"Day 1","blocks":[{"name":"Main","detail":"40 min continuous zone 2, HR 62-68% max"}]},{"label":"Day 2","blocks":[{"name":"Main","detail":"35 min zone 2, focus on steady cadence"}]},{"label":"Day 3","blocks":[{"name":"Main","detail":"25 min easy recovery"}]}]},{"label":"Week 4","days":[{"label":"Day 1","blocks":[{"name":"Main","detail":"45 min continuous zone 2"}]},{"label":"Day 2","blocks":[{"name":"Main","detail":"40 min zone 2, steady state"}]},{"label":"Day 3","blocks":[{"name":"Main","detail":"30 min easy + 5 min nasal breathing cool-down"}]}]},{"label":"Week 5 — Deload","days":[{"label":"Day 1","blocks":[{"name":"Main","detail":"30 min easy zone 2, HR 60% max, conversational"}]},{"label":"Day 2","blocks":[{"name":"Main","detail":"20 min recovery walk or light bike"}]}]},{"label":"Week 6","days":[{"label":"Day 1","blocks":[{"name":"Main","detail":"50 min continuous zone 2, HR 65-70% max"}]},{"label":"Day 2","blocks":[{"name":"Main","detail":"45 min zone 2, steady cadence"}]},{"label":"Day 3","blocks":[{"name":"Main","detail":"35 min easy + cool-down"}]}]},{"label":"Week 7","days":[{"label":"Day 1","blocks":[{"name":"Main","detail":"45 min zone 2, steady state"}]},{"label":"Day 2","blocks":[{"name":"Main","detail":"45 min zone 2, slightly faster cadence"}]},{"label":"Day 3","blocks":[{"name":"Main","detail":"75 min easy zone 2, bring electrolytes"}]}]},{"label":"Week 8","days":[{"label":"Day 1","blocks":[{"name":"Main","detail":"45 min zone 2 at previous week 1 pace — compare HR"}]},{"label":"Day 2","blocks":[{"name":"Main","detail":"45 min zone 2, note avg HR vs watts"}]},{"label":"Day 3","blocks":[{"name":"Main","detail":"60 min easy zone 2, finish strong"},{"name":"Note","detail":"Compare avg HR vs week 1 at same pace — should be lower"}]}]}]}'
  ),
  (
    'Metcon Burner',
    'Cardio', 'Intermediate',
    ARRAY['Conditioning', 'Full body'],
    30,
    'A short, sharp metcon. Three rounds of mixed-modal work — designed to spike heart rate without crushing recovery.',
    '1 day', 156,
    'Pace round 1 like you have to do round 5. Most people blow up in the first six minutes and crawl through the rest.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"5 min row, easy pace + dynamic flow"},{"name":"A. AMRAP 18 min","detail":"10 cal row, 10 KB swings (24/16kg), 10 push-ups, 10 air squats"},{"name":"B. Core finisher","detail":"3 rounds: 20s hollow hold, 10 V-ups, 20s plank"},{"name":"Cool-down","detail":"5 min walk + box breathing (4s in / 4s hold / 4s out)"},{"name":"Stretch","detail":"Couch stretch 2 min/side + lat hang 30s"}]}]}]}'
  ),
  (
    'Bike HIIT',
    'Cardio', 'Intermediate',
    ARRAY['Conditioning', 'Engine'],
    30,
    'High-intensity bike intervals. Short work periods with incomplete recovery — builds lactate tolerance and top-end cardiovascular power.',
    '1 day', 312,
    'Resistance matters more than cadence. Push hard enough that talking is off the table during work intervals.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"8 min easy spin, building pace + dynamic leg swings"},{"name":"Main — 6 rounds","detail":"30s all-out @ RPE 9-10, 90s easy recovery spin"},{"name":"Threshold block","detail":"2 × 5 min @ RPE 7-8, 3 min easy between"},{"name":"Cool-down","detail":"8 min easy spin + nasal breathing + calf stretch"}]}]}]}'
  ),
  (
    'Tempo Run',
    'Cardio', 'Advanced',
    ARRAY['Endurance', 'Engine'],
    45,
    'Classic tempo work at lactate threshold. Builds the ability to sustain uncomfortable paces without blowing up.',
    '1 day', 228,
    'Tempo pace should be "comfortably hard" — you can speak a sentence but wouldn''t want to. If you can chat freely, speed up.',
    '{"weeks":[{"label":"Day","days":[{"label":"Workout","blocks":[{"name":"Warm-up","detail":"10 min easy jog + dynamic drills (A-skip, B-skip, leg swings)"},{"name":"Main — Tempo","detail":"20 min continuous at lactate threshold (10K race pace minus ~30s/mile)"},{"name":"Recovery jog","detail":"5 min easy shuffle to reset"},{"name":"Threshold repeats","detail":"3 × 3 min at 5K effort, 90s jog recovery"},{"name":"Cool-down","detail":"10 min easy jog + hip flexor stretch + calf stretch"}]}]}]}'
  )
) AS w(title, category, level, muscle_groups, duration_minutes, summary, length_label, saves_count, coach_notes, structure)
WHERE c.slug = 'jess-park' AND c.tenant_id = '<TENANT_ID>';

-- MOBILITY workouts (coach: Sam Okafor)
INSERT INTO workouts (
  id, tenant_id, coach_id, title, category, level, muscle_groups,
  duration_minutes, summary, length_label, saves_count, coach_notes,
  structure, published_at
)
SELECT
  gen_random_uuid(),
  '<TENANT_ID>',
  c.id,
  w.title,
  w.category,
  w.level,
  w.muscle_groups,
  w.duration_minutes,
  w.summary,
  w.length_label,
  w.saves_count,
  w.coach_notes,
  w.structure::jsonb,
  now()
FROM coaches c,
(VALUES
  (
    'Hip Mobility Flow',
    'Mobility', 'All Levels',
    ARRAY['Hips', 'Recovery'],
    20,
    'A 14-day hip mobility primer. Short daily sessions that build internal/external rotation and end-range strength in the deep squat.',
    '14 day', 445,
    'End-range matters more than how far you can go. If you''re shaking in the bottom of the Cossack, that''s the dose.',
    '{"weeks":[{"label":"Week 1","days":[{"label":"Day 1","blocks":[{"name":"Hip CARs","detail":"2 × 3/side, slow and controlled"},{"name":"90/90 transitions","detail":"3 × 6 transitions, no rushing"},{"name":"Deep squat hold","detail":"3 × 30s, breathe into the tension"},{"name":"Pigeon pose","detail":"2 × 60s/side"}]},{"label":"Day 2","blocks":[{"name":"Hip CARs","detail":"2 × 3/side"},{"name":"Frog stretch","detail":"2 × 45s"},{"name":"Deep squat hold","detail":"3 × 30s"},{"name":"Breathwork","detail":"3 min box breathing, 4 counts"}]},{"label":"Day 3","blocks":[{"name":"Hip CARs","detail":"2 × 3/side"},{"name":"90/90 transitions","detail":"3 × 6 transitions"},{"name":"Pigeon pose","detail":"2 × 60s/side"}]},{"label":"Day 4","blocks":[{"name":"Hip CARs","detail":"2 × 5/side, larger circles"},{"name":"90/90 lift-offs","detail":"3 × 5/side, hold 3s at top"},{"name":"Cossack squat","detail":"3 × 5/side, bodyweight, sink deep"}]},{"label":"Day 5","blocks":[{"name":"Hip CARs","detail":"2 × 5/side"},{"name":"Deep squat hold","detail":"3 × 45s, chest up"},{"name":"Adductor rockbacks","detail":"3 × 8/side"}]},{"label":"Day 6","blocks":[{"name":"90/90 lift-offs","detail":"3 × 5/side"},{"name":"Cossack squat","detail":"3 × 5/side"},{"name":"Butterfly stretch","detail":"2 × 60s, gentle pulsing"}]},{"label":"Day 7","blocks":[{"name":"Hip CARs","detail":"2 × 5/side"},{"name":"Deep squat hold","detail":"3 × 45s"},{"name":"Breathwork","detail":"3 min nasal breathing in deep squat"}]}]},{"label":"Week 2","days":[{"label":"Day 8","blocks":[{"name":"Hip CARs","detail":"2 × 5/side, banded for resistance"},{"name":"90/90 lift-offs","detail":"3 × 8/side, 3s hold"},{"name":"Deep squat hold","detail":"3 × 60s, light KB in front"}]},{"label":"Day 9","blocks":[{"name":"Cossack squat","detail":"3 × 6/side, light goblet hold"},{"name":"Skater squat","detail":"3 × 5/side, control the descent"},{"name":"Shin box to stand","detail":"3 × 6 transitions"}]},{"label":"Day 10","blocks":[{"name":"Hip CARs","detail":"2 × 5/side"},{"name":"Cossack squat","detail":"3 × 6/side"},{"name":"Breathwork","detail":"3 min recovery breathing"}]},{"label":"Day 11","blocks":[{"name":"90/90 lift-offs","detail":"3 × 8/side"},{"name":"Deep squat + reach","detail":"3 × 45s w/ overhead reach"},{"name":"L-sit or tuck sit","detail":"3 × 15s"}]},{"label":"Day 12","blocks":[{"name":"90/90 to Cossack flow","detail":"3 × 5 transitions/side, smooth"},{"name":"Goblet Cossack","detail":"3 × 6/side, moderate load"},{"name":"Hip flexor pulses","detail":"2 × 12/side"}]},{"label":"Day 13","blocks":[{"name":"Hip CARs","detail":"2 × 5/side"},{"name":"Deep squat + reach","detail":"3 × 45s w/ overhead reach, rotate thoracic"},{"name":"L-sit or tuck sit","detail":"3 × 15s"}]},{"label":"Day 14","blocks":[{"name":"Flow recap","detail":"Run through CARs → 90/90 → Cossack → deep squat, 2 rounds"},{"name":"Breathwork","detail":"5 min guided relaxation"}]}]}]}'
  ),
  (
    'Daily Mobility',
    'Mobility', 'All Levels',
    ARRAY['Full body', 'Recovery'],
    15,
    'A quick daily reset covering the most common restriction patterns — hips, thoracic spine, shoulders, and ankles.',
    '1 day', 892,
    'Ten minutes every morning beats one hour twice a week. Consistency is the whole game here.',
    '{"weeks":[{"label":"Day","days":[{"label":"Routine","blocks":[{"name":"Thoracic rotation","detail":"2 × 8/side, seated or quadruped"},{"name":"Hip CARs","detail":"2 × 3/side, slow and full"},{"name":"Shoulder CARs","detail":"2 × 3/side, full range"},{"name":"90/90 hip stretch","detail":"2 × 45s/side"},{"name":"Ankle circles + calf stretch","detail":"2 × 30s/side"},{"name":"Deep squat breathe","detail":"2 × 30s, relax into it"}]}]}]}'
  ),
  (
    'Thoracic Reset',
    'Mobility', 'All Levels',
    ARRAY['Spine', 'Shoulders'],
    20,
    'Targeted thoracic spine mobilization. Counteracts desk posture and overhead restriction in a 20-minute daily practice.',
    '1 day', 567,
    'Don''t force range. Work up to the boundary, breathe, and wait for the tissue to release. Forcing creates guarding.',
    '{"weeks":[{"label":"Day","days":[{"label":"Routine","blocks":[{"name":"Foam roll — thoracic","detail":"2 min, segmental, pausing on stiff spots"},{"name":"Open book rotations","detail":"3 × 8/side, slow and controlled"},{"name":"Quadruped thoracic rotation","detail":"3 × 8/side, thread the needle"},{"name":"Wall angels","detail":"3 × 10, maintain full contact with wall"},{"name":"Band pull-apart","detail":"3 × 15, external rotation emphasis"},{"name":"Child''s pose to cobra flow","detail":"3 × 6, inhale up / exhale down"}]}]}]}'
  ),
  (
    'Ankle & Hip Prep',
    'Mobility', 'Beginner',
    ARRAY['Ankles', 'Hips'],
    15,
    'Pre-squat mobility primer. Opens up the ankle and hip restrictions that limit depth and create compensations up the chain.',
    '1 day', 334,
    'If your heels lift in the squat, this session is for you. Run it daily for 2 weeks and retest.',
    '{"weeks":[{"label":"Day","days":[{"label":"Routine","blocks":[{"name":"Ankle CARs","detail":"2 × 5/side, slow full circle"},{"name":"Calf stretch — straight leg","detail":"2 × 45s/side, wall"},{"name":"Calf stretch — bent knee (soleus)","detail":"2 × 45s/side"},{"name":"Hip flexor lunge stretch","detail":"2 × 45s/side"},{"name":"Deep squat hold","detail":"3 × 30s, heels flat, weight forward"},{"name":"Lateral band walk","detail":"2 × 15m, glute activation"}]}]}]}'
  )
) AS w(title, category, level, muscle_groups, duration_minutes, summary, length_label, saves_count, coach_notes, structure)
WHERE c.slug = 'sam-okafor' AND c.tenant_id = '<TENANT_ID>';

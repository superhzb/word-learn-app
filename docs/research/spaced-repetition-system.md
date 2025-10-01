# Word Learning SRS - System Design Document

## Overview
This system is a spaced repetition app inspired by **SM-2 / Anki**, but optimized for simplicity.  
- **UI:** 2-button interface (*Remember* / *Not Remember*).  
- **Algorithm:** SM-2 backbone with simplified scoring, learning steps, lapses, and adaptive reaction-time scoring.  
- **Batching:** Learning is chunked into small, fixed-size sessions (e.g. 50 words).  

---

## Core Specs

### 1. Scoring
- **Buttons:**  
  - *Remember* → mapped to score 1–4, based on reaction time.  
  - *Not Remember* → score 0.  

- **Default reaction-time thresholds:**  
  - 0–1s → score 4 (Easy)  
  - 1–3s → score 3 (Good)  
  - 3–6s → score 2 (Hard)  
  - >6s → score 1 (Barely remembered)  
  - *Not Remember* → score 0 (Fail)  

- **Adaptive normalization:**  
  - System tracks **average reaction time per user**.  
  - Thresholds scale relative to personal baseline (default baseline = 2.5s).  
  - Adaptive bucketing example:  
    - Fastest 25% recalls → score 4  
    - Middle 50% → score 3  
    - Slowest 25% but recalled → score 2  
    - >2× median RT → score 1  

---

### 2. Learning / Graduating / Lapse
- **Learning steps:** `1 min → 10 min → 1 day`  
- **Graduating interval:** 3 days (default)  
- **Lapse handling:**  
  - Failed cards → 10 min relearn step  
  - Interval halved after lapse  
  - No full reset  

---

### 3. Interval Growth
- Based on **Anki’s ease factor (EF) system**.  
- Formula: `I_new = I_old × EF`  
- EF updates:  
  - Again → −0.20  
  - Hard → −0.15  
  - Good → 0  
  - Easy → +0.15  
- EF floor = 1.3  

---

### 4. Other Scheduling Rules
- Interval fuzzing (±5–25%) to smooth workload.  
- Maximum interval cap (configurable).  
- Optional suspensions and leech handling.  

---

### 5. Batch Sessions
- Daily learning/review load is split into **fixed-size batches** (default: 50 words).  
- Each batch has its own progress bar for clear short-term goals.  
- Remaining due cards roll into subsequent batches until daily quota is complete.  

---

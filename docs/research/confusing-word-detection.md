# Detecting Confusing French Words  
**Project Document**

## 🎯 Goal  
Build a system to automatically identify **confusing French words** from large word lists.  
Target users: French learners who struggle with look-alike and sound-alike words.  

---

## 🤔 Why This Matters  
Learners often confuse words that are:  
- Spelled almost the same.  
- Pronounced similarly.  
- Derived from the same root (prefix/suffix variations).  
- Semantically close (same category, overlapping meanings).  
- Idiomatic expressions differing by small changes (e.g., *à fond* vs *au fond*).  

By detecting and grouping these words, we can design **better learning tools**: flashcards, spaced repetition decks, and drill exercises tailored to confusion sets.  

---

## 🧩 Confusion Categories  

1. **Spelling Similarity**  
   - Minimal differences (1–2 letters).  
   - Example: *border* vs *broder*.  

2. **Phonetic Similarity**  
   - Near-homophones or vowel/consonant shifts.  
   - Example: *chevaux* [ʃə.vo] vs *cheveux* [ʃə.vø].  

3. **Morphological Neighbors**  
   - Same root with different prefixes/suffixes.  
   - Example: *couvrir* → *recouvrir*, *découvrir*, *couverture*, *couvercle*.  

4. **Semantic Overlap**  
   - Words in the same conceptual field.  
   - Example: *brume* (mist) vs *brouillard* (fog).  

5. **False Friends / Look-alikes**  
   - Appear similar in English but have unrelated meanings.  
   - Example: *préjudice* (harm) ≠ prejudice (in EN).  

6. **Idiomatic Expression Variants**  
   - Phrases differing by a single preposition or small element.  
   - Example: *dans deux heures* (two hours later) vs *en deux heures* (within two hours).  

---

## ⚙️ Technical Approach  

### Step 1. Preprocessing  
- Normalize words (lowercase, strip accents if needed).  
- Generate phonetic forms (IPA or phonetic hashing for French).  

### Step 2. Confusion Scoring  
- **Spelling**: Levenshtein distance, n-gram similarity.  
- **Phonetics**: Edit distance on IPA/phonetic codes.  
- **Morphology**: Root + prefix/suffix detection (regex, morphological analyzer).  
- **Semantics**: Word embeddings (e.g., fastText FR).  
- **Idioms**: Rule-based pattern matching on prepositions/phrases.  

### Step 3. Ranking & Grouping  
- Compute a weighted “confusion score” for all pairs.  
- Group words into **confusion clusters**.  
- Output top candidates for review.  



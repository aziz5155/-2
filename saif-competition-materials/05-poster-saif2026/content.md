# ATHAR — SAIF 2026 Scientific Poster: Content Package

Status: content drafted and ready to pour into the OFFICIAL template once the template file itself is available.
See `STATUS.md` in this folder for what is blocked and what is needed from the user.
All body text below is English-only per the brief. This file is the editorial source; it is not the poster itself.

---

## 0. Identity fields (place in the template's fixed identity fields — do not redesign them)

- **Innovation Title:** ATHAR — Smart Assistant for Missing-Person Search
- **Subtitle (only if the template has a subtitle line):** Bayesian Search-Area Prioritization Using Trip Context and Delayed Location Evidence
- **Student Name:** ABDULAZIZ KHALID ALJURAID
- **University (as affiliation only, no logo, no claim of sponsorship):** King Saud University
- **Country:** Saudi Arabia (flag = Saudi Arabia)
- **Competition Track:** Artificial Intelligence and Data Science
- **Project ID:** *(not yet issued — leave field editable/blank, do not invent)*
- **Booth Number:** *(not yet issued — leave field editable/blank, do not invent)*
- **Acknowledgments:** "No external funding or institutional support to acknowledge."
- **Age-category color:** Deep Evergreen `#0E3F3C` (18+ category, based on registration as a university student — draft assumption, not an age confirmation from organizers)
- Do NOT add email, phone, or birth date anywhere on the poster.

---

## 1. Introduction (~110 words)

Missing-traveler search requires combining incomplete location evidence with trip context. Terrain-aware Bayesian models provide a basis for representing uncertain movement [1], while out-of-sequence measurement research addresses delayed observations [2]. Under intermittent connectivity, a received fix may describe a past position rather than the traveler's current location. ATHAR proposes a workflow that combines trip plans, timestamped evidence and geospatial inference to support search-area prioritization.

**Objective:** Specify a reproducible framework for updating search regions using observation-time evidence and ranking candidate areas by model weight and estimated search effort.

*Can observation-time updates improve ground-truth inclusion at a fixed search-area budget compared with receipt-time updates?*

---

## 2. Methodology (~155 words + 2 figures + 2 equations)

ATHAR combines a trip plan, a timestamped evidence log, and a road-and-terrain motion model (**Figure 1**). Each incoming fix is deduplicated by a persistent identifier and separated into observed-time and received-time fields; a duplicate is acknowledged and excluded from recomputation. A Markov transition model propagates vehicle, walking and stationary states along the road network, using non-negative traversal costs derived from segment length, assumed speed and terrain.

When new evidence arrives, state weights are updated by evidence compatibility (**Eq. 1**) and re-normalized. A fix received out of order restores a prior checkpoint, inserts the evidence at its observed time, and replays subsequent evidence before publishing an updated map — **Restore → Insert → Replay → Predict → Publish** (**Figure 2**). Candidate regions are then ranked by aggregate weight relative to estimated access and search time (**Eq. 2**). A separate server-side check monitors the check-in deadline independently of the evidence pipeline; a new location alone does not confirm the traveler's safety.

### Eq. 1 — Evidence weight update

w⁺ₜ(s) = [ L(eₜ | s) · w⁻ₜ(s) ] / Σₛ′ [ L(eₜ | s′) · w⁻ₜ(s′) ]

- s: position and movement state
- w⁻: predicted weight (before evidence)
- w⁺: updated weight (after evidence)
- L: evidence compatibility likelihood

Applied at the evidence's observation time. Weights are model outputs, not field-calibrated survival probabilities.

### Eq. 2 — Search-area ranking index

S_R = W_R / (T_access,R + T_search,R + τ₀), with τ₀ > 0

- W_R: aggregate model weight in region R
- T_access,R: estimated access time to region R
- T_search,R: estimated search time within region R
- τ₀: positive time constant (same units), avoids division by zero

Approximate single-team ranking index; not proven optimal for multi-team allocation. Traveler motion and search-team motion use separate time estimates — never substitute one for the other.

### Table 1 — Technique-to-role mapping (compact strip under Figure 1, not a full prose table)

| Component | Choice | Role |
|---|---|---|
| Inference | Bayesian updating | Represent uncertainty; update weights with evidence |
| Motion | Markov transition model | Propagate movement states over time |
| Temporal replay | Event log + checkpoints | Recompute after an out-of-order fix |
| Spatial store | PostgreSQL / PostGIS | Store locations; run spatial queries |
| Region aggregation | H3 | Bin and aggregate weights into candidate regions |
| Route cost | NetworkX / Dijkstra | Compute network access-time costs |
| Service layer | Python / FastAPI / NumPy | Run the inference engine; exchange data |
| Clients | Flutter, MapLibre GL JS | Traveler app and monitor map (proposed) |

*(If space is tight, drop the "Service layer" and "Clients" rows and mention them once in Figure 1's caption instead.)*

---

## 3. Results (~85 words)

Current outputs comprise a system architecture, interface mock-ups and a specified evidence-update workflow (**Design-Stage Outputs**). Quantitative performance has not yet been evaluated.

**Figure 3** shows two maps at the same scale and evaluation time (16:40), for a single delayed fix: **(A)** the state before the 16:20 fix is inserted, and **(B)** after it is replayed. Recorded fixes are shown separately from estimated regions; the 16:20 position is not displayed as the traveler's current location at 16:40.

*Schematic illustration; regions are not computed experimental outputs.*

**Legend:** Observed fix — Planned route — Estimated search region

---

## 4. Innovation (~55 words)

The proposed contribution is an auditable workflow that links pre-trip context, observation-time evidence replay, and effort-aware search-area ranking. Recorded locations remain distinct from current estimates, and each priority update can be traced to its evidence and assumptions. This is a proposed system design, not a claim of priority over Bayesian search modeling or out-of-sequence estimation methods generally.

### Table 2 — Scope comparison (illustrative baselines for this study only, not a market survey)

| | Last-known-location view | Receipt-time update baseline | ATHAR (proposed) |
|---|---|---|---|
| Uses trip plan context | No | No | Proposed |
| Orders evidence by observation time | No | No | Proposed |
| Distinguishes recorded vs. estimated position | No | Partial | Proposed |
| Ranks regions by access + search effort | No | No | Proposed |

---

## 5. Conclusion (~50 words)

ATHAR defines a design-stage framework for organizing trip evidence and updating search priorities under intermittent connectivity. The current contribution is a documented computational workflow and interface concept. Its operational benefit remains to be established through implementation and comparative evaluation.

*Estimates support human review and do not establish live location after disconnection.*

---

## 6. Future Work & References (~55 words + small table)

Future work proceeds in three sequential, verifiable stages:

1. **Implementation** — build an executable pipeline for evidence intake, region updates and incident-card generation.
2. **Controlled evaluation** — replay known trips under message delay, disconnection and measurement noise, comparing methods.
3. **Supervised usability assessment** — evaluate clarity of priorities and information with domain reviewers, after computational verification.

### Table 3 — Evaluation plan (compact)

**Metrics:** ground-truth inclusion at matched search-area budget · arrival-order consistency for the same evidence set · recalculation latency · incident-card preparation time and completeness.

**Baselines:** last-known-location circle · road-and-time access radius · receipt-time processing · full observation-time processing (proposed).

**Ablations:** without trip plan · without temporal replay.

*Tuning trips and test trips are kept separate; waypoints from a single trip are not treated as independent trips when estimating uncertainty. A shrinking region is not treated as success if ground-truth inclusion drops.*

### References

[1] Lin, L. and Goodrich, M. A. (2010). A Bayesian approach to modeling lost person behaviors based on terrain features in Wilderness Search and Rescue. *Computational and Mathematical Organization Theory.* https://doi.org/10.1007/s10588-010-9066-2

[2] García-Fernández, Á. F. and Yi, W. (2021). Continuous-discrete multiple target tracking with out-of-sequence measurements. https://arxiv.org/abs/2106.04898

[3] H3: A Hexagonal Hierarchical Geospatial Indexing System — documentation. https://h3geo.org/docs/

[4] PostGIS — Spatial and Geographic Objects for PostgreSQL — documentation. https://postgis.net/docs/

[5] NetworkX — `single_source_dijkstra` reference. https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.shortest_paths.weighted.single_source_dijkstra.html

**Note on verification:** this sandbox's network egress is blocked for general web domains (confirmed for doi.org, arxiv.org and h3geo.org during this session), so these citations could not be independently re-verified against the live sources in this session. Bibliographic details above are taken as supplied. Please have a human confirm titles/authors/years before print if that verification matters for judging.

---

## Figure captions (numbered, English, placed under each figure per the guide)

**Figure 1. Proposed system architecture.** Data flow between the traveler app, the server-side evidence intake and validation, the spatial-temporal store, the analysis engine, the late-evidence processor, the region-ranking stage, a deadline-monitoring branch, and the monitor interface. Solid arrows carry data; the single highlighted arrow marks the recompute trigger fired by delayed evidence. Design-stage architecture, not a deployed system.

**Figure 2. Observation-time processing of delayed evidence.** Restore → Insert → Replay → Predict → Publish: a late fix restores a checkpoint before its observed time, is inserted in correct temporal order, and subsequent evidence is replayed before a new map version is published. Design-stage workflow specification, illustrated with a worked example, not a measured run.

**Figure 3. Design-stage search-update illustration.** Two schematic maps at the same scale and the same evaluation time (16:40): (A) before the 16:20 fix is inserted; (B) after it is replayed. The 16:20 position is an observed fix, shown distinctly from the estimated search regions; it is not displayed as a confirmed current location at 16:40. Schematic illustration; regions are not computed experimental outputs.

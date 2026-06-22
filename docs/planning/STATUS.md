# Project Status — ClaimsScenario

> **What this file is:** the single living source of truth for what is done and what
> is not. It is a burndown, not a planning snapshot. Every status here has been
> **verified against the actual code/repo at the date shown — never assumed.**
> When work lands, this file is updated in the same change.

- **Last updated:** 2026-06-22
- **Updated by:** reconciled by agent (verified against code)
- **Verified against:** `main @ db856c6`
- **Phase / milestone:** Feature-complete MVP; production deployment wiring in progress (no automated test suite yet)
- **Source plan(s):** `docs/PRD.docx` / `Auto_Claims_Simulation_PRD.docx`; architecture spec in `CLAUDE.md`; `Insurance_Simulation_Platform_Guide.md`

## At a glance

| Metric | Count |
|---|---|
| ✅ Done | 16 |
| 🟡 Partial / in progress | 3 |
| ⬜ Not started | 1 |
| 🚫 Blocked | 0 |
| **Total items** | **20** |

**Current focus:** Recent commits fix API URLs/CORS and `render.yaml` for production deployment, and added context-sensitive help plus a progress tracker. The platform is functionally complete across all 3 scenarios; remaining gaps are an automated test suite, verified live deployment, and pause/resume polish.

---

## Task list

> Legend: ✅ done · 🟡 partial / in progress · ⬜ not started · 🚫 blocked
> "Evidence" must point to something real — a file, function, PR, test, or migration.

| ID | Item | Status | Owner | Evidence (file / PR / test) | Notes |
|---|---|---|---|---|---|
| F-01 | Supabase schema (profiles/sessions/messages/reports) + auto-profile trigger | ✅ | — | `supabase/migrations/20260404000000_initial_schema.sql` (tables + `handle_new_user` trigger) | `20260405000000_add_level_column.sql` adds `level` |
| F-02 | Row Level Security (own data; instructors/admins see all) | ✅ | — | `initial_schema.sql`: 4× `ENABLE ROW LEVEL SECURITY`, 9× `CREATE POLICY` | Service role bypasses RLS for backend |
| F-03 | Supabase Auth + JWT verification (ES256 via JWKS, HS256 fallback) | ✅ | — | `backend/api/middleware/auth.py` (`_get_jwks`, jwks cache); `frontend/src/providers/AuthProvider.tsx` | |
| F-04 | Auth pages (login / register) + route protection middleware | ✅ | — | `frontend/src/app/login/page.tsx`, `register/page.tsx`, `src/middleware.ts` (60 ln) | |
| F-05 | Scenario data model + loader (YAML scenarios loaded at startup) | ✅ | — | `backend/engine/scenario_loader.py` (`load_all`); `main.py` lifespan calls it | |
| F-06 | Scenario 1 — Intersection Collision (claims, 7 phases, 6 personas) | ✅ | — | `scenarios/intersection-collision/` (scenario.yaml, 6 personas, 7 rubrics, 3 tiers, 6 evidence) | |
| F-07 | Scenario 2 — Commercial Property Underwriting (7 phases, 4 personas) | ✅ | — | `scenarios/commercial-property-underwriting/` (full persona/rubric/tier/evidence set) | |
| F-08 | Scenario 3 — SmartDrive Product Launch (marketing, 7 phases, 5 personas) | ✅ | — | `scenarios/product-launch-campaign/` (full persona/rubric/tier/evidence set) | |
| F-09 | AI orchestrator — streaming multi-persona conversation loop | ✅ | — | `backend/engine/orchestrator.py` (`stream_response`, AsyncAnthropic + tool use, 193 ln) | |
| F-10 | 7 AI tools (set_active_persona…complete_simulation) + handlers | ✅ | — | `backend/engine/tools.py` (7 named tools), `tool_handlers.py` | All 7 from CLAUDE.md present |
| F-11 | Dynamic prompt builder (mode/difficulty/level/persona context) | ✅ | — | `backend/engine/prompt_builder.py` (`build_system_prompt`, 369 ln) | |
| F-12 | Multi-scenario phase manager (per-scenario phase order/transitions) | ✅ | — | `backend/engine/phase_manager.py` (`SCENARIO_PHASE_ORDERS` claims/underwriting/marketing) | |
| F-13 | Scoring engine (6 weighted dimensions) | ✅ | — | `backend/engine/scorer.py` (`DIMENSION_WEIGHTS`, compute functions) | Weights match PRD (25/20/20/20/10/5) |
| F-14 | Coaching (learning/hybrid phase intros) | ✅ | — | `backend/engine/coaching.py` (`get_phase_intro_coaching`); gated by `is_coaching_allowed` | |
| F-15 | Performance report generation (separate Anthropic call) | ✅ | — | `backend/engine/report_generator.py` (`generate_report`); routes in `api/routes/reports.py`; `app/dashboard/report/[id]/page.tsx` (249 ln) | |
| F-16 | SSE chat endpoint + frontend session/chat UI | ✅ | — | `backend/api/routes/chat.py` (`StreamingResponse`); `frontend/src/lib/sse.ts`; `app/dashboard/session/[id]/page.tsx` (933 ln) | |
| F-17 | Session CRUD + progress tracker + scenario selection UI | ✅ | — | `backend/api/routes/sessions.py` (create/list/get/patch/delete/`/progress`); `app/dashboard/scenarios/page.tsx`, progress panel in session page | |
| F-18 | Admin analytics + user management | 🟡 | — | `backend/api/routes/admin.py` (`/analytics`, role-gated); `app/dashboard/admin/page.tsx` (141 ln), `admin/users/page.tsx` (88 ln) | Aggregates exist; depth of user-management actions unverified |
| F-19 | Production deployment (Render: frontend + backend) | 🟡 | — | `render.yaml` (two web services, health check); commits `db856c6`, `4c30193` (CORS/URL/runtime fixes) | Config present; a verified live/green deploy not confirmed from repo |
| F-20 | Automated test suite (backend + frontend) | ⬜ | — | No `*test*`/`*spec*` files found under `backend/` or `frontend/src/` | No pytest/jest tests in repo |

### Partial items — what's left

- **F-18 (Admin):** `/analytics` endpoint and admin pages exist and are role-gated. Not verified: whether user-management page supports real mutating actions (role changes, deletes) end-to-end vs. read-only listing. Mark partial until those flows are confirmed.
- **F-19 (Deployment):** `render.yaml` defines both services and recent commits fixed API URLs/CORS/runtime versions for prod, but the repo alone can't confirm a successful live deploy. Verify by checking the Render dashboard / live URLs.
- **F-20 covered above** — listed as ⬜ (not started), no test files exist.

---

## Next up (in priority order)

1. Add an automated test suite (F-20) — at minimum pytest coverage for `scorer`, `phase_manager`, and `scenario_loader`; smoke test for the SSE chat route.
2. Verify the Render deployment is live and green (F-19); record the live URLs.
3. Confirm/finish admin user-management mutating actions (F-18).

## Blocked

| ID | Blocked on | Since | What would unblock it |
|---|---|---|---|
| — | none | — | — |

## Decisions & pivots

- **2026-06-22** — STATUS.md reconciled against the codebase by agent.
- **2026-06-22** — Seed STATUS.md (0/0/0/0 placeholder) replaced with 20 verified work items derived from the actual frontend/backend/scenario/migration code (no prior ID list existed to reuse).

## Changelog

- **2026-06-22** — reconciled seed → verified statuses (✅ 16 / 🟡 3 / ⬜ 1 / 🚫 0).

---

### Maintenance rules (do not delete)

1. **Verify, don't guess.** Before marking anything ✅ or 🟡, confirm it against the
   code/tests/repo. Cite the evidence. If you can't verify, mark it ⬜ and say so.
2. **Update in the same change as the work.** A landed feature and its status entry
   move together. This file should never lag the repo by more than the current change.
3. **One source of truth.** Planning docs describe intent and sequence; this file is the
   only place that tracks completion state.
4. **Refresh the header every update** — date, updater, and the git SHA verified against.
5. **Don't silently drop items.** Move descoped items to a `## Dropped` section with a
   dated reason rather than deleting them.

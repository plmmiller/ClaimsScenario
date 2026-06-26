# Insurance Training Simulation Platform

## Project Overview
AI-driven simulation platform that teaches and assesses insurance professionals through conversational AI. Uses Claude to play multiple personas across the full lifecycle of claims, underwriting, and marketing scenarios. Supports 3 scenario types, 3 simulation modes, 3 difficulty tiers, and 3 experience levels.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS (in `frontend/`)
- **Backend:** FastAPI + Python (in `backend/`)
- **AI Engine:** Anthropic Claude API with tool use (streaming SSE via AsyncAnthropic)
- **Database:** Supabase (Postgres + Auth + RLS)
- **Deploy:** Render (two services: frontend + backend)

## Dev Commands
```bash
# Frontend
cd frontend && npm install && npm run dev    # Runs on :3000

# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000        # Runs on :8000

# Supabase migrations
export SUPABASE_ACCESS_TOKEN=sbp_...
supabase db push --linked
```

## Environment Variables
### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
```

**Note:** The backend config (`config.py`) explicitly injects `.env` values when shell env vars are empty — needed because Claude Desktop sets `ANTHROPIC_API_KEY=` (empty) in the shell.

## Key Architecture Decisions
- **Single-conversation multi-persona:** One Anthropic API call per user message where Claude plays all non-adjuster roles, switching via `set_active_persona` tool
- **7 AI tools:** set_active_persona, show_document, record_decision, score_action, advance_phase, provide_coaching, complete_simulation
- **SSE streaming:** Anthropic AsyncAnthropic -> FastAPI StreamingResponse -> fetch+ReadableStream on frontend (not EventSource, since we need POST)
- **Scenario data:** YAML/markdown files in `scenarios/` directory, loaded at backend startup
- **Stateless backend:** Session state rebuilt from Supabase per request; no sticky sessions needed
- **Context management:** Sliding window of last 50 messages + current-phase tool interactions; older phases summarized
- **JWT auth:** Supabase issues ES256 JWTs; backend verifies via JWKS endpoint (not legacy HS256 secret)
- **Multi-scenario phases:** Different scenarios have different phase sets; phase_manager dynamically resolves phase order from scenario definition

## Project Structure
```
├── frontend/src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── login/, register/   # Auth pages
│   │   └── dashboard/          # Protected pages
│   │       ├── scenarios/      # Scenario selection (mode, difficulty, level)
│   │       ├── session/[id]/   # Chat interface (main simulation)
│   │       ├── report/[id]/    # Performance report
│   │       ├── help/           # Help & documentation page
│   │       └── admin/          # Analytics & user management
│   ├── lib/                    # supabase clients, api.ts, sse.ts
│   ├── providers/              # AuthProvider (Supabase auth context)
│   └── types/                  # TypeScript types (Phase is string for multi-scenario support)
├── backend/
│   ├── api/routes/             # FastAPI endpoints (auth, scenarios, sessions, chat, reports, admin)
│   ├── api/middleware/auth.py  # JWT verification via JWKS (ES256) with HS256 fallback
│   ├── engine/                 # AI engine
│   │   ├── orchestrator.py     # Core conversation loop with async streaming
│   │   ├── prompt_builder.py   # Dynamic system prompt assembly (includes level context)
│   │   ├── tools.py            # Tool definitions (JSON schema for Claude)
│   │   ├── tool_handlers.py    # Tool execution logic
│   │   ├── phase_manager.py    # Multi-scenario phase transition validation
│   │   ├── scorer.py           # Score accumulation and computation
│   │   ├── coaching.py         # Phase intro coaching for all scenario types
│   │   └── report_generator.py # Post-session report generation
│   ├── db/                     # Supabase client and queries
│   └── models/                 # Pydantic models
├── scenarios/
│   ├── intersection-collision/       # Auto claims scenario (7 phases, 6 personas)
│   ├── commercial-property-underwriting/  # Underwriting scenario (7 phases, 4 personas)
│   └── product-launch-campaign/      # Marketing scenario (7 phases, 5 personas)
└── supabase/migrations/              # SQL schema (2 migrations)
```

## Scenarios

### 1. Two-Vehicle Intersection Collision (Claims)
- **Phases:** FNOL → Coverage → Investigation → Liability → Damages → Negotiation → Resolution
- **Personas:** Sarah Mitchell (insured), James Torres (claimant), Linda Park (witness), Mike's Auto Body, Dr. Patel, Attorney Davis
- **Key dispute:** Both drivers claim the other ran a red light

### 2. Commercial Property Underwriting
- **Phases:** Submission Review → Risk Assessment → Loss History → Pricing → Terms & Conditions → Negotiation → Binding
- **Personas:** Karen Wells (agent), David Chen (business owner), Maria Santos (loss control), Tom Bradshaw (mentor)
- **Key challenge:** 25-year-old building, prior water damage claim, adjacent restaurant exposure

### 3. SmartDrive Product Launch (Marketing)
- **Phases:** Market Research → Strategy Development → Content Creation → Agency Enablement → Campaign Launch → Performance Tracking → Reporting
- **Personas:** Lisa Morgan (VP Marketing), Raj Patel (agency principal), Emma Wright (digital specialist), Carlos Mendez (actuary), Jennifer Kim (consumer)
- **Key challenge:** Launch UBI auto product in new state with $500K budget

## Database
- **Tables:** profiles, sessions, messages, reports
- **Auth:** Supabase Auth with JWT (ES256), auto-creates profile via trigger (`SECURITY DEFINER SET search_path = public`)
- **RLS:** Users see own data; instructors/admins see all
- **Service role key** used by backend (bypasses RLS)
- **Sessions table** includes: mode, difficulty, level, current_phase, phase_history, decisions, scoring_events

## Session Configuration
- **Modes:** Learning (coaching + visible scoring), Assessment (silent scoring), Hybrid (coaching phases 1-3, assessment 4-7)
- **Difficulty:** Guided (cooperative, hints), Standard (realistic), Advanced (uncooperative, complications)
- **Level:** Beginner (simple language, terms explained), Intermediate (standard industry language), Experienced (full jargon, fast pace)

## Scoring Dimensions (weighted)
- Technical Knowledge (25%)
- Investigation Quality (20%)
- Communication (20%)
- Judgment & Decision-Making (20%)
- Process Adherence (10%)
- Risk/Fraud Awareness (5%)

## Known Quirks
- Python 3.9 compatibility: all backend files use `from __future__ import annotations`
- Supabase client placeholders in `supabase-browser.ts` / `supabase-server.ts` for build-time safety
- Backend config explicitly overrides empty shell env vars (Claude Desktop sets `ANTHROPIC_API_KEY=`)

<!-- status-md-discipline -->
## STATUS.md discipline (required)

Maintain `docs/planning/STATUS.md` as the single source of truth for completion state.
It is a burndown, not a plan. Rules:

1. One row per work item (reuse the plan's IDs, e.g. F-01..F-N), each marked:
   ✅ done · 🟡 partial · ⬜ not started · 🚫 blocked.
2. VERIFY, NEVER ASSUME. Before marking ✅ or 🟡, confirm against the actual code
   (read the source/tests/migrations or the PR) and cite evidence — a real path,
   test, or PR. If you can't verify it, it's ⬜. A plan saying "this was sprint 1"
   is NOT evidence it shipped.
3. Update STATUS.md in the SAME change as the work that lands. It must never lag the
   repo. Refresh the header (date + current git SHA) every update.
4. Keep an append-only Changelog (e.g. "F-03 ⬜→✅") and Decisions log.
5. When asked for status, read this file and give a grouped view: counts, current
   focus, what shipped recently, what's next, what's blocked.
6. Planning docs describe intent and sequence; STATUS.md tracks state. Don't merge them.
<!-- /status-md-discipline -->

<!-- ti-design-system -->
## Design system (TI Design System v2.1 — TIKG/AB/CEU)

This repo follows **The Institutes Knowledge Group Digital Design System v2.1**. The machine-readable reference set lives in **`./design-system/`** and is the source of truth for all visual and content decisions. Load the relevant file(s) before generating UI, copy, slides, or email; run `design-system/qa-checklist.md` against the output before it ships. **Context in → generate → checklist out.**

**Non-negotiables for any UI work:**

- **Tokens only — never hardcoded hex, fonts, spacing, shadow, radius, or motion values.** Import from `design-system/tokens.scss` (SCSS) or `design-system/tokens.css` (CSS custom properties). Any new CSS with a literal color requires review. Run `node design-system/lint.mjs` to check.
- **Three typefaces only:** Merriweather (H1/H3/H4), Montserrat (H2/H5, buttons, nav), Open Sans (body). Never add a fourth.
- **Cards:** `border-radius: 0` (square — intentional) + shadow `0 2px 24px 0 rgba(0,0,0,0.15)`.
- **Buttons:** Montserrat Bold, 14px, uppercase, letter-spacing 1px, min-width 150px, radius 4px; all five states (default, hover, focus 2px outline, active, disabled 40%).
- **Body text** is always `$brand-text-gray (#58595b)` — never a brand color. The **purple gradient / `$brand-secondary-purple` is reserved for AI-related content only.**
- **Breakpoints:** 768px (tablet) and 1100px (desktop). Max content width 1280px.
- **Accessibility: WCAG 2.1 AA is mandatory** — 4.5:1 body / 3:1 large+UI contrast; visible keyboard focus (never `outline:none` without replacement); semantic HTML; one H1; honor `prefers-reduced-motion`; icon-only controls need `aria-label`. Run axe/Lighthouse before accepting any generated component.
- **Voice & content:** see `design-system/voice-and-content.md` — sentence-case UI labels, designation trademark format (CPCU®, ARM™), descriptive links (never "click here"), confident not hedged.
- **AI image generation is NOT an approved source for TIKG visual assets.**

Authoritative web reference: `web-develop.theinstitutes.org/themes/ti_west/public/style-guide/` (wins over the local reference set for web specifics). Same `design-system/` set is mirrored to Cursor (`.cursor/rules/design-system.mdc`) and Grok (`AGENTS.md` + `design-system/CONTEXT.md`).
<!-- /ti-design-system -->

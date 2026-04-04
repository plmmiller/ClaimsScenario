# Auto Claims Simulation Platform

## Project Overview
AI-driven auto claims simulation platform that teaches and assesses insurance adjusters through conversational AI. Uses Claude to play multiple personas (claimant, witnesses, body shop, doctor, attorney) across the full claims lifecycle.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS (in `frontend/`)
- **Backend:** FastAPI + Python (in `backend/`)
- **AI Engine:** Anthropic Claude API with tool use (streaming SSE)
- **Database:** Supabase (Postgres + Auth + RLS)
- **Deploy:** Render (two services: frontend + backend)

## Dev Commands
```bash
# Frontend
cd frontend && npm install && npm run dev    # Runs on :3000

# Backend
cd backend && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000        # Runs on :8000
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

## Key Architecture Decisions
- **Single-conversation multi-persona:** One Anthropic API call per user message where Claude plays all non-adjuster roles, switching via `set_active_persona` tool
- **7 AI tools:** set_active_persona, show_document, record_decision, score_action, advance_phase, provide_coaching, complete_simulation
- **SSE streaming:** Anthropic API -> FastAPI StreamingResponse -> fetch+ReadableStream on frontend (not EventSource, since we need POST)
- **Scenario data:** YAML/markdown files in `scenarios/` directory, loaded at backend startup
- **Stateless backend:** Session state rebuilt from Supabase per request; no sticky sessions needed
- **Context management:** Sliding window of last 50 messages + current-phase tool interactions; older phases summarized

## Project Structure
```
├── frontend/src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── login/, register/   # Auth pages
│   │   └── dashboard/          # Protected pages
│   │       ├── scenarios/      # Scenario selection
│   │       ├── session/[id]/   # Chat interface (main simulation)
│   │       ├── report/[id]/    # Performance report
│   │       └── admin/          # Analytics & user management
│   ├── lib/                    # supabase clients, api.ts, sse.ts
│   ├── providers/              # AuthProvider (Supabase auth context)
│   └── types/                  # TypeScript types
├── backend/
│   ├── api/routes/             # FastAPI endpoints (auth, scenarios, sessions, chat, reports, admin)
│   ├── engine/                 # AI engine
│   │   ├── orchestrator.py     # Core conversation loop with streaming
│   │   ├── prompt_builder.py   # Dynamic system prompt assembly
│   │   ├── tools.py            # Tool definitions (JSON schema for Claude)
│   │   ├── tool_handlers.py    # Tool execution logic
│   │   ├── phase_manager.py    # Phase transition validation
│   │   ├── scorer.py           # Score accumulation and computation
│   │   └── report_generator.py # Post-session report generation
│   ├── db/                     # Supabase client and queries
│   └── models/                 # Pydantic models
├── scenarios/intersection-collision/
│   ├── scenario.yaml           # Master scenario definition
│   ├── personas/*.yaml         # 6 AI persona character sheets
│   ├── evidence/*.md           # Documents (police report, policy dec, etc.)
│   ├── rubrics/*.yaml          # Per-phase scoring rubrics
│   └── tiers/*.yaml            # Difficulty tier overrides
└── supabase/migrations/        # SQL schema
```

## Database
- **Tables:** profiles, sessions, messages, reports
- **Auth:** Supabase Auth with JWT, auto-creates profile via trigger
- **RLS:** Users see own data; instructors/admins see all
- **Service role key** used by backend (bypasses RLS)

## Simulation Modes
- **Learning:** Real-time coaching hints + visible scoring feedback
- **Assessment:** Silent scoring, no hints, generates performance report
- **Hybrid:** Coaching in phases 1-3, assessment in phases 4-7

## Claims Lifecycle Phases
1. FNOL (First Notice of Loss)
2. Coverage Verification
3. Investigation
4. Liability Determination
5. Damage Assessment & Valuation
6. Negotiation & Settlement
7. Resolution & Closing

## Scoring Dimensions (weighted)
- Technical Knowledge (25%)
- Investigation Quality (20%)
- Communication (20%)
- Judgment & Decision-Making (20%)
- Process Adherence (10%)
- Fraud Awareness (5%)

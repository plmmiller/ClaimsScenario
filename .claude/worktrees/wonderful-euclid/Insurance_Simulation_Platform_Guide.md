# Insurance Training Simulation Platform

## Evaluation Guide

---

## What Is This?

The Insurance Training Simulation Platform is an AI-powered interactive training tool that teaches and assesses insurance professionals through realistic, conversational simulations. Powered by Anthropic's Claude, the platform places users in the role of an insurance professional and presents them with lifelike scenarios featuring multiple AI-driven personas (claimants, witnesses, agents, attorneys, etc.). Users must navigate each scenario by asking questions, reviewing documents, making decisions, and resolving the case — just as they would in a real-world setting.

The platform currently supports three scenario types spanning different insurance disciplines:

1. **Auto Claims Adjusting** — Handle a two-vehicle intersection collision from first notice of loss through resolution
2. **Commercial Property Underwriting** — Assess risk, price, and bind a commercial property insurance policy
3. **Insurance Marketing** — Plan and execute a product launch campaign for a usage-based auto insurance product

---

## Getting Started

### Creating an Account

1. Navigate to the application URL
2. Click **Register** and enter your full name, email address, and a password (minimum 6 characters)
3. After registration, you will be redirected to the main dashboard

### Logging In

1. Enter your email and password on the login page
2. Click **Sign In** to access the dashboard

---

## Starting a Simulation

From the dashboard, click **New Simulation** (or navigate to **Scenarios** in the sidebar). You will configure four settings before launching:

### 1. Choose a Scenario

| Scenario | Discipline | What You Do | Duration |
|----------|-----------|-------------|----------|
| **Two-Vehicle Intersection Collision** | Claims | Investigate a disputed collision, determine liability, assess damages, and negotiate a settlement | 30-60 min |
| **Commercial Property Underwriting** | Underwriting | Review a submission for a retail electronics store, assess risks, price the policy, negotiate terms, and bind coverage | 30-60 min |
| **SmartDrive Product Launch Campaign** | Marketing | Conduct market research, develop strategy, create content, enable agents, launch and track a campaign | 30-60 min |

### 2. Select a Mode

| Mode | Coaching | Scoring Visibility | Best For |
|------|----------|--------------------|----------|
| **Learning** | Real-time coaching tips and hints appear throughout the simulation | Scores are shown as you go | Building foundational skills; first-time users |
| **Assessment** | No coaching or hints provided | Scores are hidden until the final report | Evaluating readiness; certification testing |
| **Hybrid** | Coaching during the first 3 phases, then transitions to silent assessment | Visible early, then hidden | Balanced skill-building with evaluation |

### 3. Select an Experience Level

| Level | Language Style | Pacing | Best For |
|-------|--------------|--------|----------|
| **Beginner** | Simple language; insurance terms are explained when used | Patient and slower-paced | New hires; those new to the discipline |
| **Intermediate** | Standard industry language; only uncommon terms explained | Moderate pacing | Professionals with some experience |
| **Experienced** | Full technical jargon; no term explanations | Fast-paced; personas may push back on unnecessary questions | Senior professionals |

### 4. Select a Difficulty

| Difficulty | Persona Behavior | Evidence | Complexity |
|------------|-----------------|----------|------------|
| **Guided** | Cooperative and forthcoming | Clear and straightforward | Simplified; transition hints provided |
| **Standard** | Realistic; information shared only when asked | Some ambiguity; requires thorough investigation | True-to-life complexity |
| **Advanced** | Uncooperative parties; attorney involvement | Conflicting evidence; fraud indicators | High complexity with coverage disputes |

Click **Start Simulation** to begin.

---

## The Simulation Experience

### Chat Interface

The simulation takes place in a real-time chat interface. You type messages as the insurance professional, and the AI responds in character as different personas relevant to the scenario.

**Layout:**
- **Left sidebar** — Session information, phase progress tracker, and a list of documents you have accessed
- **Center** — The main conversation area where you interact with personas
- **Right panel** (when opened) — Progress tracker showing task checklist or running scores

### Interacting with Personas

Each scenario features multiple AI-driven characters. For example, in the auto claims scenario you may speak with:

- **Sarah Mitchell** — The insured driver reporting the accident
- **James Torres** — The other driver (claimant)
- **Linda Park** — An eyewitness
- **Mike's Auto Body** — The repair shop providing damage estimates
- **Dr. Patel** — The treating physician
- **Attorney Davis** — Legal representation for the claimant

The AI automatically switches between personas based on the conversation context. Each persona has a unique colored avatar and their name and role are displayed with their messages.

### Message Types

You will see several types of messages during a simulation, each visually distinct:

- **Your messages** — Blue bubbles on the right side
- **Persona responses** — White bubbles on the left with persona name and avatar
- **Documents** — Amber-highlighted panels showing evidence files (police reports, policy declarations, medical records, etc.)
- **Coaching tips** (Learning mode) — Green panels with a lightbulb icon offering guidance
- **Score events** (Learning mode) — Purple panels showing how specific actions were scored
- **Phase transitions** — Blue banners indicating you have moved to a new phase

### Phase Progression

Each scenario has 7 phases that you progress through sequentially. The sidebar shows your current position:

**Claims Phases:**
FNOL > Coverage Verification > Investigation > Liability Assessment > Damage Assessment > Negotiation > Resolution

**Underwriting Phases:**
Submission Review > Risk Assessment > Loss History > Pricing & Rating > Terms & Conditions > Negotiation > Binding

**Marketing Phases:**
Market Research > Strategy Development > Content Creation > Agency Enablement > Campaign Launch > Performance Tracking > Reporting

Completed phases show a green indicator, the current phase shows blue, and upcoming phases show gray.

### Progress Tracker

Click the **Progress** button (Learning/Hybrid mode) or **Score** button (Assessment mode) in the top-right of the chat header to open the progress panel:

**In Learning/Hybrid Mode:**
- Overall phase progress bar (e.g., 3/7 phases completed)
- A checklist of required tasks for the current phase with completion status
- Running dimension scores (if scoring events have occurred)

**In Assessment Mode:**
- Overall phase progress bar
- Running score breakdown by dimension with progress bars
- Overall score and performance level

Click **Refresh Progress** at the bottom of the panel to update the data.

---

## Scoring System

### Six Competency Dimensions

Your performance is evaluated across six weighted dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| **Technical Knowledge** | 25% | Understanding of insurance concepts, policy language, regulations, and industry standards |
| **Investigation Quality** | 20% | Thoroughness in gathering facts, asking the right questions, and reviewing evidence |
| **Communication** | 20% | Clarity, professionalism, and effectiveness when interacting with all parties |
| **Judgment & Decision-Making** | 20% | Quality of decisions, soundness of rationale, and appropriate use of evidence |
| **Process Adherence** | 10% | Following proper procedures, documentation standards, and workflow requirements |
| **Fraud/Risk Awareness** | 5% | Identifying red flags, inconsistencies, and potential fraud or risk indicators |

### Scoring Scale

Each scored action receives a rating from 1 to 4:

| Score | Level | Meaning |
|-------|-------|---------|
| 4 | **Exemplary** | Exceeds expectations; demonstrates expert-level competency |
| 3 | **Proficient** | Meets expectations; demonstrates solid working knowledge |
| 2 | **Developing** | Partially meets expectations; shows understanding but has gaps |
| 1 | **Needs Improvement** | Does not meet expectations; significant gaps in knowledge or execution |

### Overall Score

Your overall score is the weighted average of all dimension scores, reported on the same 1.0-4.0 scale. Performance level thresholds:

- **3.5 - 4.0** — Exemplary
- **2.5 - 3.4** — Proficient
- **1.5 - 2.4** — Developing
- **Below 1.5** — Needs Improvement

---

## Performance Report

After completing a simulation, click **View Report** from the dashboard or the session page. The report includes:

1. **Overall Score** — Your weighted score and performance level with color-coded badge
2. **Dimension Breakdown** — Individual scores for all six competency dimensions with visual progress bars
3. **Strengths** — Your highest-performing areas with specific examples from the simulation
4. **Areas for Improvement** — Dimensions where performance was lower, with actionable feedback
5. **Phase-by-Phase Narrative** — A summary of your actions and decisions in each phase
6. **Recommendations** — Targeted suggestions for professional development

---

## Managing Sessions

### Dashboard

The dashboard displays all your simulation sessions with status indicators:

- **Active** (green) — Click to resume the simulation
- **Paused** (yellow) — Session is paused; click to resume
- **Completed** (blue) — Click to view the performance report
- **Abandoned** (gray) — Session was abandoned

### Deleting a Session

Click the trash icon on any session card and confirm the deletion. This permanently removes the session, all messages, and any associated report.

---

## Admin Features

Users with administrator access see an additional **Admin** section in the sidebar with:

- **Analytics Dashboard** — Platform-wide metrics including total sessions, completion rates, average scores, and distribution charts for modes and difficulty levels
- **User Management** — View all registered users and their roles

---

## Tips for Evaluators

When evaluating the platform, consider trying the following:

1. **Start with Learning mode on Guided difficulty** to see the full coaching experience and understand what a complete simulation flow looks like
2. **Try Assessment mode on Standard difficulty** to experience the testing workflow and see a realistic performance report
3. **Test all three scenarios** to see how the platform adapts to different insurance disciplines
4. **Compare experience levels** — Start one session as Beginner and another as Experienced to see how the AI adapts its language and pacing
5. **Use the Progress Tracker** during a session to see real-time task tracking and scoring
6. **Complete at least one full simulation** to generate a performance report and review the scoring output
7. **Try asking unexpected questions** or making intentional mistakes to see how the AI responds and scores those interactions
8. **Check the Help page** (sidebar) for the built-in user documentation

### Key Questions for Evaluation

- Does the AI respond realistically and stay in character?
- Are the coaching tips helpful and contextually appropriate?
- Do the phase transitions feel natural and well-timed?
- Is the scoring fair and does the feedback match the actions taken?
- Is the performance report actionable and detailed enough?
- Does the difficulty scaling feel meaningfully different across tiers?
- Would this tool be effective for training new adjusters, underwriters, or marketing professionals?

---

## Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- No software installation required

---

*For questions or issues, contact the development team or refer to the in-app Help page.*

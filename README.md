# ResearchX — Autonomous Multi-Agent AI Research Platform

ResearchX is a modern, academic-grade AI research intelligence platform built entirely with **HTML5, CSS3, Vanilla JavaScript (ES6 Modules), and Firebase**.

It coordinates a swarm of **seven specialized AI agents** to investigate complex topics, query real-time web sources via **Tavily**, encyclopedia archives via **Wikipedia**, and full-text webpage articles via **Jina Reader**, verify empirical claims against raw source excerpts, red-team conclusions through adversarial dialectic, and compile publication-grade academic research monographs with verified citations, interactive **Cytoscape.js** knowledge graphs, and **jsPDF** exports.

---

## 🏛️ System Architecture

ResearchX adheres strictly to a pure client-side static architecture with zero traditional backend dependencies:

```
ResearchX/
├── index.html                   # Authentication portal (Email/Password, Google OAuth, Reset)
├── dashboard.html               # Main Dashboard (Metrics, Swarm architecture, Quick Starters)
├── research.html                # Research Config & Live Multi-Agent Workspace (3-Column layout)
├── report.html                  # Academic Monograph Viewer, Knowledge Graph, Fact-Check Audit
├── history.html                 # Investigation Archive & Side-by-Side Research Comparison Modal
├── database.rules.json          # Firebase Realtime Database Security Rules (User-scoped)
├── firebase.json                # Firebase Hosting configuration
└── assets/
    ├── css/
    │   ├── style.css            # Academic SaaS Design System (Tokens, Reset, Primitives)
    │   ├── dashboard.css        # Hero banners, metrics cards, quick starter grid
    │   ├── research.css         # Live 3-column workspace, agent cards, status indicators
    │   └── report.css           # Academic typography, Cytoscape graph canvas, print styles
    └── js/
        ├── firebase.js          # Firebase SDK v8.10.0 singleton initialization
        ├── auth.js              # Auth state management, profile syncing, route protection
        ├── database.js          # Realtime Database CRUD operations & metrics aggregation
        ├── app.js               # Shared controller, mobile sidebar, API Settings Modal
        ├── api/
        │   ├── gemini.js        # Gemini API client (Structured JSON, token usage tracking)
        │   ├── tavily.js        # Tavily Search API client (Deduplication, domain filters)
        │   ├── wikipedia.js     # MediaWiki Action API client (Multi-language extracts, CORS)
        │   └── jina.js          # Jina Reader API client (r.jina.ai Markdown extraction)
        ├── agents/
        │   ├── orchestrator.js  # Agent 1: Task decomposition, subquestions & plan
        │   ├── researcher.js    # Agent 2: Parallel web & encyclopedia evidence gathering
        │   ├── analyst.js       # Agent 3: Pattern detection, trade-offs & insights
        │   ├── factchecker.js   # Agent 4: Claim verification against raw source excerpts
        │   ├── debater.js       # Agent 5: Adversarial red-team & counterarguments
        │   ├── writer.js        # Agent 6: 12-section monograph composition & citations
        │   └── editor.js        # Agent 7: Editorial QA, citation validation & follow-ups
        ├── core/
        │   ├── research-engine.js # Central orchestrator, parallel execution & Firebase sync
        │   ├── agent-manager.js   # Agent state machine, execution timers & task tracking
        │   ├── source-manager.js  # Source deduplication, credibility ratings & indexing
        │   └── citation-manager.js# Citation index auditing & bibliography generation
        └── utils/
            ├── helpers.js       # DOM selectors, unique IDs, formatting, keyStore
            ├── formatter.js     # LLM JSON parser, citation enrichment, Cytoscape builder
            └── pdf-export.js    # jsPDF academic monograph generation & pagination
```

---

## 🤖 The Seven Specialized AI Agents

| # | Agent Name | Role | Responsibilities | Output Schema Key Highlights |
|---|------------|------|------------------|------------------------------|
| **1** | **Orchestrator** | Chief Systems Architect | Analyzes topic, breaks into subquestions, plans parallel tasks | `research_title`, `research_objective`, `tasks[]`, `expected_sections[]` |
| **2** | **Researcher** | Intelligence Scout | Executes parallel searches across Wikipedia, Tavily, and Jina Reader | `task`, `findings[]`, `important_facts[]`, `statistics[]`, `sources[]` |
| **3** | **Analyst** | Comparative Data Analyst | Uncovers patterns, evaluates advantages/disadvantages, compares paradigms | `key_findings[]`, `advantages[]`, `disadvantages[]`, `comparisons[]`, `insights[]` |
| **4** | **Fact-Checker** | Verification Officer | Audits claims against source excerpts; never marks verified without source quote | `verified_claims[]`, `disputed_claims[]`, `unsupported_claims[]`, `source_quality[]` |
| **5** | **Debater** | Red-Team Dialectician | Challenges conclusions, exposes cognitive bias, provides counterarguments | `objections[]`, `counterarguments[]`, `missing_perspectives[]`, `weak_arguments[]` |
| **6** | **Writer** | Lead Academic Author | Drafts complete 12-section monograph with explicit numeric citations `[1]`, `[2]` | `title`, `executive_summary`, `full_report_markdown`, `word_count` |
| **7** | **Editor** | Editor-in-Chief & QA | Validates citations against sources, polishes prose, generates follow-up queries | `approved_title`, `approved_report`, `editorial_score`, `follow_up_questions[]` |

---

## ✍️ Word Count & AI Humanizer Engine

ResearchX includes granular controls over monograph length and linguistic cadence:

### 1. Target Word Count Specification
- **Concise Brief**: ~800 words (high-level executive overview)
- **Standard Monograph**: ~1,500 words (balanced scholarly analysis)
- **In-Depth Paper**: ~2,500 words (comprehensive evidence synthesis and matrices)
- **Exhaustive Treatise**: ~4,000+ words (rigorous multi-perspective investigation)

Both the **Writer Agent** and **Editor Agent** dynamically allocate depth and analytical rigor to hit the user's selected word target. Actual word count is measured and displayed across the monograph view and exported PDF metadata.

### 2. Humanizer Engine & Anti-Robotic Voice Filter
To prevent canned, monotonous AI phrasing, ResearchX implements a strict humanizing pipeline:
- **Cliché Elimination**: Automatically detects and replaces overused AI filler words (*"delve", "tapestry", "beacon", "testament", "crucial", "navigating the complex landscape", "it is worth noting", "double-edged sword"*).
- **Burstiness & Syntactic Variance**: Alternates between concise declarations (5–9 words) and nuanced compound analytical sentences (22–32 words) to reflect natural human intellectual cadence.
- **Selectable Voices**:
  - `Natural Academic`: Thoughtful scholarly discourse with varied sentence rhythm.
  - `Executive Direct`: Crisp, active voice, bottom-line upfront with zero fluff.
  - `Peer-Reviewed Scientific`: Cautious, evidence-measured, formal peer-review style.
- **On-Demand Humanize Action**: Any completed report can be re-humanized or stylistically polished with one click using the **Humanize Prose** button on the Report page.

---

## ⚡ External APIs & Transparent Connectivity

### 1. Google Gemini API
- **Purpose**: Powers all 7 agents with structured JSON outputs and temperature controls.
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent`
- **Supported Models**: `gemini-1.5-flash` (default, fast), `gemini-2.0-flash`, `gemini-1.5-pro`.
- **Authentication**: `x-goog-api-key` header.
- **Rate Limit & Token Tracking**: Tracks prompt tokens, candidate tokens, and total tokens in real time.

### 2. Tavily Search API
- **Purpose**: Real-time web crawling and domain-filtered web search.
- **Endpoint**: `https://api.tavily.com/search`
- **Authentication**: Passed via Authorization header and payload credentials. Automatic deduplication of URLs.

### 3. Wikipedia MediaWiki Action API
- **Purpose**: Supplementary factual background and introductory definitions in multiple languages (English, Malayalam, Arabic, Hindi, etc.).
- **Endpoint**: `https://{lang}.wikipedia.org/w/api.php` with `origin=*`.
- **CORS Support**: Native browser CORS support out of the box with zero API key required.

### 4. Jina Reader API
- **Purpose**: Converts target article URLs into clean, LLM-ready Markdown.
- **Endpoint**: `https://r.jina.ai/{targetUrl}` with `Accept: application/json`.
- **CORS Support**: Native browser CORS enabled. Works with or without a Jina API key for standard research queries.

---

## 🔒 Security & Client-Side Credential Handling

- **Zero Database Key Storage**: Provider API keys (Gemini, Tavily, Jina) are **never** stored in Firebase Realtime Database.
- **Session Memory Storage**: Keys are maintained in browser session memory (`sessionStorage` and JavaScript memory) to allow navigating between pages while closing with the browser session.
- **Credential Masking**: Fields are masked by default with show/hide controls.
- **Connection Diagnostics**: Live "Test Connection" buttons verify credentials directly against upstream endpoints before running research.
- **Zero Console Leaks**: API keys are scrubbed and redacted from all error messages and console logs.

---

## 🗄️ Firebase Realtime Database Setup & Rules

### Database Logical Structure
```
users/
  {USER_UID}/
    profile/
      name: string
      email: string
      createdAt: number
      lastLoginAt: number
    research/
      {RESEARCH_ID}/
        topic: string
        description: string
        depth: string
        language: string
        format: string
        status: "in_progress" | "completed" | "failed"
        progress: number (0 - 100)
        createdAt: number
        updatedAt: number
        plan: object (Orchestrator output)
        agents/
          orchestrator/
          researcher/
          analyst/
          factchecker/
          debater/
          writer/
          editor/
        sources/ (array of deduplicated citations)
        findings/ (Analyst output)
        debate/ (Debater output)
        report/ (Final verified monograph and editorial audit)
        usage/ (Token counts)
```

### Applying Database Security Rules
To ensure strict multi-tenant isolation where users can only read and write their own data:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (`file-69b4f`).
3. Navigate to **Build > Realtime Database > Rules**.
4. Paste the contents of `database.rules.json`:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        "profile": {
          ".validate": "newData.hasChildren(['email', 'createdAt'])"
        },
        "research": {
          "$researchId": {
            ".validate": "newData.hasChildren(['topic', 'status'])"
          }
        }
      }
    }
  }
}
```
5. Click **Publish**.

---

## 🚀 Running ResearchX Locally

Because ResearchX uses native browser **ES6 modules** (`import` / `export`), it must be served over an HTTP/HTTPS origin (not loaded directly via `file:///` protocol).

### Option A: Using Python's built-in static server
```bash
# In the project root directory:
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in any modern browser.

### Option B: Using VS Code Live Server
1. Install the "Live Server" extension in VS Code.
2. Right-click `index.html` and select **Open with Live Server**.

### Option C: Using npx serve or http-server
```bash
npx serve .
# or
npx http-server -p 8000
```

---

## 🌐 Deploying to Firebase Hosting

ResearchX includes a pre-configured `firebase.json` for one-command static hosting:

```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Deploy hosting and rules
firebase deploy --only hosting,database
```

Once deployed, your application is live on your Firebase domain:
`https://file-69b4f.web.app` (or `https://file-69b4f.firebaseapp.com`).

---

## 🎯 Verification Checklist

- [x] **No Frameworks or Node.js Backend**: 100% Vanilla HTML5, CSS3, ES6 Modules.
- [x] **Firebase SDK 8.10.0**: App, Auth, and Database initialized as singletons.
- [x] **Seven Specialized Agents**: Structured JSON schema outputs for all agents with rigorous error recovery.
- [x] **Parallel Evidence Retrieval**: `Promise.allSettled()` executing concurrent subtasks across Wikipedia, Tavily, and Jina.
- [x] **Live Agent Workspace**: 3-column layout showing real progress, agent timers, logs, live sources, and JSON inspector.
- [x] **Publication-Grade Report Viewer**: Markdown rendering with clickable citation pills `[1]`, `[2]`.
- [x] **Interactive Knowledge Graph**: Cytoscape.js canvas with custom nodes, zoom/fit/reset, and side inspector drawer.
- [x] **Side-by-Side Research Comparison**: Compares two past research sessions side by side.
- [x] **Academic PDF Export**: Built with jsPDF featuring header/footer pagination, metadata banner, executive summary box, and bibliography.
- [x] **Client-Side Key Privacy**: Zero database exposure of secret keys; in-memory session store with live connection testers.


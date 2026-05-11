# HostelLo - Project Guidelines

This file contains team-shared architecture, conventions, and workflows for the HostelLo project. Adhere to these standards to maintain consistency and quality.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** Neon PostgreSQL (Serverless)
- **ORM:** Prisma
- **Auth:** NextAuth v5 (Credentials Provider)
- **Search:** Typesense (with Prisma fallback)
- **Caching/Rate Limiting:** Upstash Redis
- **Object Storage:** Cloudflare R2 (S3-compatible)
- **Email:** Resend
- **SMS:** Twilio
- **Payments:** Safepay

## Architecture & Design Patterns
- **Monolith:** Next.js handles both UI (RSC) and API (Route Handlers).
- **Service Layer:** Business logic should reside in `src/lib/` (e.g., `hostel-service.ts`, `notifications.ts`).
- **Validation:** Use **Zod** for all input validation (API routes and forms).
- **Sanitization:** Use `sanitizeString()` from `src/lib/utils.ts` for user-submitted text.
- **Concurrency:** Use optimistic locking on `Room.version` for booking operations.
- **Search:** Reads should prefer Typesense. If it fails, fallback to Prisma. Sync to Typesense on write.
- **Performance:** 
  - Use `LazyImage` from `src/lib/performance-utils.tsx` for image-heavy lists.
  - Use `useDebounce` for search/filter inputs.
  - Use `React.memo` (or `MemoizedListItem`) for large lists.

## Development Workflows
- **Database Migrations:** 
  - Use `npx prisma migrate dev` for local schema changes.
  - Avoid `prisma db push` in production-facing changes.
- **Component Development:**
  - Follow the UI library in `src/components/ui/`.
  - Refer to Storybook (`npm run storybook`) for existing patterns.
  - Use Tailwind CSS for styling.
- **Testing:**
  - Use **Vitest** for unit and integration tests.
  - Run tests using `npm test`.
  - Add new tests for every feature or bug fix.
- **Linting:**
  - Run `npm run lint` before committing.
  - Follow the project's ESLint configuration.

## Coding Conventions
- **API Responses:** Use the envelope: `{ data: ..., message: "...", error: "..." }`.
- **Error Handling:** Wrap API routes in try/catch. Return human-readable error strings.
- **Naming:** 
  - Use descriptive, camelCase for variables and functions.
  - Use PascalCase for React components and types.
- **Types:** Avoid `any`. Leverage Prisma-generated types and Zod-inferred types.
- **Currency:** Store as integers in PKR (no floats).

## Maintenance Scripts
- Utility scripts are located in `scripts/`.
- Run them using `npx tsx scripts/<script-name>.ts`.
- Use `scripts/setup-typesense.ts` to rebuild the search index.

## Performance Targets
- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1
- **Search Latency:** < 300ms (Typesense)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

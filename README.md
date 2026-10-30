# AiNativeCRM

An agent-native CRM workspace for customer research, sales operations, and governed execution. Built with TypeScript, Next.js, Supabase, and the Pi Agent SDK, it connects CRM records, conversations, knowledge, and memory to a persistent agent runtime with tool policies, human approvals, replay, and evaluation.

[中文文档](README.zh-CN.md) · [Architecture](docs/architecture/README.md) · [Setup](docs/SETUP.md) · [Project provenance](PROVENANCE.md)

## What it does

- **Agent workspace.** Start a task against a CRM object and inspect context, tool calls, observations, approvals, usage, budgets, and termination reasons in one run timeline.
- **Four built-in agents.** Customer intelligence, sales operations, customer communication, and a supervisor for coordinating specialist investigations.
- **Governed CRM tools.** Carry actor permissions, organization scope, and target boundaries through execution. Separate reads, reversible writes, external actions, and irreversible operations; route gated actions through human approval.
- **Persistent execution.** Store run events and checkpoints for replay, SSE reconnection, pause/resume, cancellation, retries, and execution leases.
- **Multi-agent missions.** Track parent/child runs, coordinate read-only investigations, and connect deal goals, acceptance criteria, deadlines, and follow-up input across runs.
- **Knowledge and memory.** Combine tenant-scoped retrieval, WeKnora knowledge sources, confirmed CRM facts, and Mem0 memory adapters while keeping SQL as the business source of truth.
- **Evaluation and traces.** Record evidence, policy checks, tool outcomes, and semantic judgments; deliver traces, usage, and evaluation scores to Langfuse.

## Architecture

| Layer | Responsibility | Location |
| --- | --- | --- |
| Product surface | CRM pages, agent workspace, server actions, and API routes | `app/`, `components/` |
| Runtime boundary | Product-facing execution contracts, model gateway, Pi adapter | `lib/agent-runtime/` |
| Agent engine | Turn execution, tool coordination, queues, pacing, and channel delivery | `lib/agent-engine/` |
| AI services | Model credentials, retrieval, memory, skills, guardrails, and evaluation | `lib/ai/` |
| Background execution | Agent worker processes and scheduled work | `workers/` |
| Data and identity | PostgreSQL baseline, migrations, tenant policies, and Supabase clients | `supabase/`, `lib/supabase/`, `lib/auth/` |
| Integrations | Local service infrastructure and service adapters | `infra/`, `lib/ai/integrations/` |
| Verification | Unit tests, database invariants, browser tests, and recorded evidence | `tests/`, `evidence/` |

```text
Task + CRM object
        |
        v
Context: CRM + knowledge + memory + skills + run history
        |
        v
Agent runtime <---------------- Tool results / human decisions
        |                                      ^
        v                                      |
Execution harness: scope, policies, budgets, approvals, recovery
        |                                      |
        v                                      |
CRM tool ports ----------> Business actions --> Observations
        |
        v
CRM state + persisted run events + traces + evaluations
```

Key design choices:

- **Business state and execution state have separate responsibilities.** SQL owns CRM facts; runs, events, and checkpoints capture execution progress.
- **The product calls a runtime interface.** Pi-specific types stay behind an adapter rather than spreading through the CRM surface.
- **Tool calls carry authority.** Tenant identity and role checks belong at the execution boundary, alongside action policies and audit records.
- **Evidence stays attached to execution.** Knowledge citations, tool observations, and evaluation records make outcomes inspectable.

## Integrations

| Service | Role |
| --- | --- |
| OpenAI, Anthropic, Google, compatible endpoints | Organization model credentials and model bindings |
| Supabase | PostgreSQL, authentication, realtime updates, and storage |
| Mem0 | Customer memory retrieval and synchronization |
| WeKnora | Knowledge retrieval, source pages, versions, and citations |
| Langfuse | Model/tool traces, usage, and evaluation scores |
| WAHA | WhatsApp sessions and messaging tools |
| Feishu | Internal identity mapping, collaboration replies, and mission continuation |

External integrations require their own services and organization configuration. Credentials are configured on the server. See the [integration contracts](docs/integrations/agent-services.md) and [local service guide](infra/local-agent-services/README.md).

## Requirements

Node.js 22+, pnpm, and configured Supabase and Redis services. Live agent execution also requires model credentials. Docker is required for the database verification workflow and for services you choose to run locally.

## Local development

```bash
git clone https://github.com/Winoren/AiNativeCRM.git
cd AiNativeCRM
pnpm install --frozen-lockfile

# Create configuration files only if they do not already exist.
test -e .env.local || cp .env.example .env.local
test -e .env || touch .env
```

Follow [docs/SETUP.md](docs/SETUP.md) to configure Supabase, Redis, application URLs, server-side encryption, and database initialization. Use the documented migration process for an existing database.

Run each process in a separate terminal:

```bash
pnpm dev --port 3000
```

```bash
pnpm worker
```

```bash
pnpm dev:crons
```

Open [the agent workspace](http://localhost:3000/app/ai/workbench), sign in, configure an organization model binding, and select an agent, a CRM object, and a task.

## Demo and replay

```bash
node scripts/serve-agent-demo.mjs
```

Open [the demo workspace](http://127.0.0.1:3008/#/app/ai/workbench). The standalone demo includes synthetic CRM scenarios and sanitized historical model recordings. Replaying a recording displays saved inputs, outputs, tool calls, citations, and evaluations; it does not invoke a model or exercise the live backend.

## Verify

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

Additional suites have environment requirements:

```bash
pnpm test:db              # Docker-backed database invariants
pnpm test:e2e             # Configured app and test database
pnpm test:e2e:acceptance  # Focused acceptance scenarios
pnpm test:e2e:live        # Live model configuration and external services
```

These are verification commands, not a claim that every suite has passed for this publication. Historical reports under `docs/testing/` describe the specific environments and dates in which their results were recorded.

## Project status

This repository is a development snapshot. It contains implementation, tests, demos, and historical validation artifacts for the agent workspace, governed tools, missions, service integrations, and evaluation workflows. A standalone demo is available without configuring the full backend; production deployment and live integrations require separate setup and validation.

The primary overview is in English. Much of the inherited domain code and engineering documentation is in Portuguese, with additional Chinese documentation. Deployment assets retain upstream image references; review them before configuring an installation.

## Documentation

- [Documentation index](docs/index.md)
- [Agent architecture](docs/architecture/README.md)
- [Mission and execution state](docs/architecture/mission-state.md)
- [Feishu collaboration](docs/architecture/internal-collaboration-feishu.md)
- [Memory, Wiki, and Langfuse contracts](docs/integrations/agent-services.md)
- [Local integration services](infra/local-agent-services/README.md)
- [Browser test configurations](tests/e2e/configs/README.md)

## License and provenance

Distributed under the [MIT License](LICENSE). This codebase includes inherited work from [helsome/AiNativeCrm](https://github.com/helsome/AiNativeCrm); the original copyright notice is retained. This repository publishes an existing local snapshot with its own English project overview. See [PROVENANCE.md](PROVENANCE.md) for the scope of that publication.

# FastAPI AI Starter

**🌍 Read this in other languages**: [🇨🇳 简体中文](./README.md) · [🇺🇸 English](./README.en.md) · [🇯🇵 日本語](./README.ja.md) · [🇰🇷 한국어](./README.ko.md) · [🇪🇸 Español](./README.es.md)

[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/release/python-3120/)
[![FastAPI](https://img.shields.io/badge/fastapi-%E2%89%A50.115-green.svg)](https://fastapi.tiangolo.com/)
[![Pydantic](https://img.shields.io/badge/pydantic-v2-orange.svg)](https://docs.pydantic.dev/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](#4-container-deployment)
[![CI](https://img.shields.io/badge/ci-github%20actions-2088FF.svg)](./.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-80%20passed-brightgreen.svg)](#-test-coverage)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

<p align="center">
  <img src="./docs/social-preview.png" alt="FastAPI AI Starter" width="100%">
</p>

## One-liner

**Production-grade FastAPI backend scaffold for AI applications** — Auth / Resource CRUD / LLM Multi-model Gateway / MCP Tools / SSE Streaming / Message Queue / Task Scheduling / Observability, all out of the box. Up in 3 minutes. Write only your business logic.

> How long does it take to build an AI backend from scratch? Registration, login, permissions, pagination, streaming, model integration, health checks…
> With fastapi-ai-starter, they're all there. You just write business logic.

---

## Why fastapi-ai-starter?

There are many FastAPI scaffolds out there, but most are **generic CRUD templates**. When building AI apps, you still have to wire up LLMs, streaming, and tool ecosystems yourself.

| Feature | fastapi-ai-starter | FastAPI official template | full-stack-fastapi | Other boilerplates |
|---|:---:|:---:|:---:|:---:|
| User system (register/login/roles) | ✅ | ❌ | ✅ | ⚠️ |
| Resource CRUD + permission isolation | ✅ | ❌ | ⚠️ | ⚠️ |
| **LLM multi-model gateway (zero SDK)** | ✅ | ❌ | ❌ | ❌ |
| **MCP tool ecosystem (SSE / stdio)** | ✅ | ❌ | ❌ | ❌ |
| **SSE streaming + LLM Streamer** | ✅ | ❌ | ❌ | ⚠️ |
| Kafka message pipeline (auto-reconnect) | ✅ | ❌ | ❌ | ❌ |
| Background task scheduling + realtime progress | ✅ | ❌ | ✅ | ⚠️ |
| Health probes + Prometheus metrics | ✅ | ❌ | ⚠️ | ❌ |
| Rate limiting + security middleware | ✅ | ❌ | ✅ | ⚠️ |
| Docker multi-stage + CI/CD | ✅ | ❌ | ✅ | ⚠️ |
| Graceful degradation when DB is down | ✅ | ❌ | ❌ | ❌ |
| Built-in admin dashboard (multi-language) | ✅ | ❌ | ❌ | ❌ |

**In one sentence**: Others give you a CRUD skeleton. We give you a **production-ready backend for AI applications**.

---

## Core Features

| Module | Capability | Demo endpoint |
|---|---|---|
| 🔀 **LLM Multi-model Gateway** | Multi-provider priority fallback, exponential backoff retry, token/cost stats, unified interface for OpenAI / DeepSeek / Claude / Ollama (chat / stream / embeddings) | `POST /llm/chat` |
| 🔧 **MCP Tool Ecosystem** | Tool registry + JSON-RPC Server (SSE / stdio dual transport), works directly with Claude Desktop, Cline and other AI clients | `GET /mcp/sse` |
| 🌊 **SSE Streaming** | SSEStream (queue / generator patterns), LLMStreamer (OpenAI-compatible streaming output) | `GET /sse/chat` |
| 📚 **RAG Knowledge Base** | Auto-chunking + embedding on ingest, in-memory vector index (cosine similarity), retrieval-augmented Q&A (plain + SSE streaming), pseudo-vector fallback for offline demo when no LLM configured | `POST /rag/docs`, `POST /rag/search`, `POST /rag/chat` |
| 📨 **Kafka Pipeline** | Auto-reconnect + auto-topic-creation producer/consumer, EventPublisher wrapper, callback-based background worker | `POST /kafka/publish`, `GET /kafka/status` |
| ⏰ **Background Task Scheduler** | TaskManager registry (interval/cron), manual trigger + status tracking, SSE realtime progress subscription, pause/resume | `GET /tasks`, `POST /tasks/{name}/trigger` |
| 📊 **Observability** | DB / Redis / Kafka / LLM health probes, Prometheus metrics (P50-P99 latency / Tokens / Cost), trace_id structured tracing | `/monitor/healthz`, `/monitor/readyz`, `/monitor/metrics` |
| 🔐 **Security & Rate Limiting** | Zero-dependency HS256 JWT, API Key auth (role check), Redis Lua sliding-window rate limit (in-memory fallback), request ID correlation | `POST /security/token`, `GET /security/limited` |
| 👤 **User System** | PBKDF2-SHA256 password hashing, register/login/change-password, JWT Bearer auth, admin/user role control, graceful DB-down degradation | `POST /user/register`, `POST /user/login`, `GET /user/me`, `GET /user/list` |
| 📦 **Resource CRUD** | Unified pagination/filter/sort, owner permission isolation (404 on access violation, prevents enumeration), admin full view, partial update, DB degradation | `GET/POST/PUT/DELETE /resource/beams`, `GET /resource/admin/beams` |
| 🚀 **DevOps** | Multi-stage Dockerfile, one-command docker-compose (MySQL + Redis + optional Kafka), GitHub Actions auto regression | `docker compose up -d` |
| 📁 **File / Object Storage** | Storage-backend abstraction (zero-dependency local disk by default / switchable to S3-compatible), multipart streaming upload, size cap & extension whitelist, metadata in DB, owner isolation, public direct-link download, delete cleans the object too | `POST /files/upload` |
| ⚡ **WebSocket Realtime** | Channel rooms + JWT handshake auth (query token), group-chat broadcast, online count/member presence, typing indicator, ping/pong heartbeat, dead-connection auto prune, server-side HTTP push | `WS /ws/rooms/{room}` |
| 🖥️ **Admin Dashboard** | React 18 + Ant Design 5 + react-i18next, 8 modules (Login/Dashboard/Users/Resources/Knowledge/Files/Realtime/Monitor), built-in 5-language switcher (EN/ZH/JA/KO/ES) | `/admin/login` |

All endpoints come with Swagger docs (`/docs`), 80 unit tests with full coverage, CI runs on every push.

## 0 Quick Start

### ⚡ 30-Second Tryout (Docker)

One command boots the whole backend, zero config:

```shell
docker compose up -d
```

After startup you can visit:

| What you want | URL |
|---|---|
| 📖 **Full API Docs** (Swagger UI) | `http://localhost:8080/api/sample/docs` |
| 📋 **Redoc** | `http://localhost:8080/api/sample/redoc` |
| ❤️ Liveness probe | `http://localhost:8080/api/sample/monitor/healthz` |
| ✅ Readiness probe (component status) | `http://localhost:8080/api/sample/monitor/readyz` |
| 📊 Prometheus metrics | `http://localhost:8080/api/sample/monitor/metrics` |
| 🖥️ **Admin Dashboard** (React Admin, 5 languages) | `http://localhost:8080/admin/login` |

> Want Kafka? `docker compose --profile full up -d`.
>
> First boot auto-creates tables (compose sets `FS_AUTO_SCHEMA=true`, safe mode doesn't destroy existing data); you can try register/login directly.

### 💻 Local Development

```powershell
# 1. Create & activate a Python 3.12 venv
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies (dev tools included: aerich/ruff/pytest)
pip install -e ".[dev]"

# 3. Edit database URL / account / password in project_env

# 4. Run (typer commands)
python main.py run            # listens on 0.0.0.0:8080 by default
python main.py run --reload   # hot-reload for development
```

Visit after boot:
- Swagger UI: `http://127.0.0.1:8080/api/sample/docs`
- ReDoc: `http://127.0.0.1:8080/api/sample/redoc`
- Health check: `http://127.0.0.1:8080/api/sample/monitor/healthz`
- Admin: `http://127.0.0.1:8080/admin/login`

### Tech Stack

| Area | Choice |
|---|---|
| Runtime | **Python 3.12** (`asyncio.timeout`, built-in `tomllib`) |
| Web framework | FastAPI ≥ 0.115 (`lifespan` management) |
| Serialization | **Pydantic v2** + pydantic-settings |
| ORM | tortoise-orm[asyncmy] ≥ 0.21 + aerich migrations |
| Cache | redis ≥ 5.1 (`redis.asyncio`, single/sentinel dual mode) |
| Messaging | aiokafka ≥ 0.11 |
| Scheduling | apscheduler ≥ 3.10 (lifespan-managed) |
| LLM | httpx direct connection (zero SDK, OpenAI-compatible protocol) |
| Admin frontend | React 18 + Vite + Ant Design 5 + react-i18next |

## 1 Project Structure

```
├── main.py                 # Typer CLI entry (run / mcp commands)
├── setup.py                # cx_Freeze build script (optional precompiled release)
├── project_env             # Environment variables (DB & other connections)
├── pyproject.toml          # Project config (deps / ruff / aerich / [myproject] runtime config)
├── requirements.txt        # Dependency list (Docker / CI build)
├── Dockerfile              # Multi-stage build (venv dep layer + slim runtime layer)
├── docker-compose.yml      # app + MySQL + Redis (--profile full adds Kafka)
├── .github/workflows/      # GitHub Actions (ruff lint + unit tests)
├── migrations/             # aerich migration files
└── admin/                  # React 18 + Ant Design 5 admin dashboard (Vite build, i18n)
    ├── src/
    │   ├── i18n.ts         # react-i18next config (5 languages)
    │   ├── locales/        # Language packs zh-CN/en-US/ja-JP/ko-KR/es-ES
    │   ├── pages/          # 6 pages: Login/Dashboard/Users/Resources/Knowledge/Monitor
    │   └── layouts/        # AdminLayout (top bar + menu + language switcher)
    └── dist/               # Build output (statically hosted by FastAPI, visit /admin)
└── src/
    ├── application.py      # Typer CLI entry
    ├── settings.py         # pydantic-settings config layer (env > project_env > pyproject)
    ├── faster/             # FastAPI application layer
    │   ├── apps.py         # FastAPI instance + middleware mount
    │   ├── events.py       # lifespan: Tortoise → Redis → Scheduler → LLM Gateway
    │   ├── middlewares/    # Request ID + access log middleware
    │   └── routers/        # Routes (users / resource / mcp / sse / llm / rag / monitor / security)
    └── my_tools/           # Independent tools (reusable standalone)
        ├── llm_tools/      # LLM gateway (multi-provider fallback / retry / cost stats / embeddings)
        ├── mcp_tools/      # MCP protocol (registry / JSON-RPC Server / SSE+stdio transport)
        ├── sse_tools/      # SSE streaming (SSEStream / LLMStreamer)
        ├── rag_tools/      # RAG (chunking / pseudo-vector fallback / in-memory index / retrieval Q&A)
        ├── observability/  # Observability (health probes / Prometheus / tracing)
        ├── security_tools/ # Security (JWT / API Key / sliding window rate limit)
        ├── redis_tools/    # redis.asyncio client (single / sentinel, auto reconnect)
        ├── kafka_tools/    # aiokafka client
        ├── schedule_tasks/ # Background task manager (TaskManager / sample tasks)
        ├── fastapi_tools/  # CBV decorator and viewset
        └── tortoise_tools/ # Custom Tortoise fields and validators
```

- **settings.py**: Loads `project_env` + `pyproject.toml.[myproject]` via `pydantic-settings`; env vars take priority; zero-config injection for container deployments.
- **faster.events**: `@asynccontextmanager` lifespan that initializes resources in order and attaches them to `app.state`; routes access via `request.app.state.redis`; unconfigured capabilities (e.g. empty DB apps) are skipped automatically.
- **my_tools.\***: All tool modules are zero-coupled to FastAPI (except auth/rate_limit wrappers), can be copied to other projects independently.

## 2 Configuration

Runtime config lives under `[myproject]` in `pyproject.toml`. Priority: **env vars > project_env > pyproject.toml > defaults**.

Common env vars (container deployment):

| Variable | Description |
|---|---|
| `FASTSAMPLE_DATABASE_HOST/PORT/USER/PASSWORD/NAME` | MySQL connection |
| `FS_REDIS_HOST/PORT` | Redis address |
| `FS_REDIS_SENTINEL_SERVICE` | Sentinel address list; set to `none` for single-connection mode |
| `FS_KAFKA_SERVICE` | Kafka bootstrap servers |
| `FS_KAFKA_ENABLED` | Set to `true` to enable Kafka pipeline (off by default) |

LLM providers are configured under `[myproject.llm.providers]` (OpenAI-compatible endpoints like DeepSeek / OpenAI / Anthropic / Ollama); API keys should be injected via env vars.

Kafka is off by default. Enable via either `[myproject.mq] enabled = true` or env `FS_KAFKA_ENABLED=true`. On enable, lifespan auto-mounts producer (auto-reconnect + auto-create topic), starts callback-based background worker, and includes Kafka in `/monitor/readyz`. Publish via `POST /kafka/publish`, check status via `GET /kafka/status`. Consumer callbacks inherit `BaseTopicCallSingle` and register in `my_tools/kafka_tools/examples.py` → `get_consumer_callbacks()`.

Security config lives in `[myproject.security]` (API Key table / JWT secret / rate limit params) — **you MUST change the default jwt_secret in production**.

### 2.5 User System

Complete user system built on Tortoise ORM + JWT Bearer, located at `src/faster/routers/users/`.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/user/register` | POST | None | Register new user (username 3-32 alphanumeric/underscore, password ≥ 8 chars) |
| `/user/login` | POST | None | Login, issues JWT (access_token / token_type / expires_in) |
| `/user/me` | GET | Bearer JWT | Get current user info (no password hash) |
| `/user/password` | PUT | Bearer JWT | Change own password (requires old password verification) |
| `/user/list` | GET | Bearer JWT (admin) | Paginated user list (admin only) |

**Key features:**
- **PBKDF2-SHA256 password hashing**: 100,000 iterations + 16-byte random salt, format `pbkdf2_sha256$iterations$salt$hash`, constant-time compare against timing attacks (stdlib, zero dependencies)
- **JWT role auth**: Token carries `sub` (username), `role` (user/admin), `uid` (user ID); admin endpoints use `require_jwt_role("admin")`
- **Graceful DB-down degradation**: App still starts when DB is unreachable; user endpoints return 503 uniformly, no impact on other modules
- **Zero field leakage**: All response models exclude `password_hash`

### 2.6 Resource CRUD Template

Standard CRUD template based on the Beam model at `src/faster/routers/resource/`, serves as a reference for new business modules.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/resource/beams` | GET | Bearer JWT | Paginated own beams (filter by type / fuzzy name / sort) |
| `/resource/beams/{id}` | GET | Bearer JWT | Get single beam (404 on access violation, prevents enumeration) |
| `/resource/beams` | POST | Bearer JWT | Create beam (auto-binds owner to current user) |
| `/resource/beams/{id}` | PUT | Bearer JWT | Partial update (only passed fields) |
| `/resource/beams/{id}` | DELETE | Bearer JWT | Delete beam (204 no body) |
| `/resource/admin/beams` | GET | Bearer JWT (admin) | Admin full view (supports owner_id filter) |

**Key design:**
- **Unified pagination**: `src/my_tools/tortoise_tools/pagination.py` provides `PageResult[T]` / `PaginationParams` / `OrderByParams` / `make_order_by_params()`, shared across list endpoints
- **Owner isolation**: All user queries auto-filter by `owner_id=current user`; unauthorized access returns 404 (avoids resource ID enumeration)
- **Admin full view**: `/resource/admin/beams` requires admin role, supports filtering by `owner_id`
- **Partial update**: PUT uses `model_dump(exclude_unset=True)` to update only explicitly passed fields
- **Graceful DB degradation**: All ORM calls wrapped in `_safe()`; DB failure returns 503 uniformly

### 2.7 RAG Knowledge Base

Vector retrieval + LLM Q&A example built on the LLM gateway, located at `src/faster/routers/rag/` (business) and `src/my_tools/rag_tools/` (reusable). **Zero new dependencies** — pure Python cosine similarity + in-memory vector index by default; when no embedding provider is configured, auto-falls back to deterministic hash pseudo-vectors so the offline demo still works.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/rag/docs` | GET | Bearer JWT | Paginated own documents (title fuzzy, enabled filter) |
| `/rag/docs/{id}` | GET | Bearer JWT | Document detail (with content, 404 on access violation) |
| `/rag/docs` | POST | Bearer JWT | Upload document: auto-chunk → embedding → persist (DB + in-memory index) |
| `/rag/docs/{id}` | PUT | Bearer JWT | Update document (content change triggers re-chunk + re-vectorize) |
| `/rag/docs/{id}` | DELETE | Bearer JWT | Delete document and all chunks |
| `/rag/search` | POST | Bearer JWT | Pure vector retrieval (works without LLM, pseudo-vector fallback) |
| `/rag/chat` | POST | Bearer JWT | Knowledge Q&A: `stream=false` returns full JSON, `stream=true` returns SSE |
| `/rag/stats` | GET | Bearer JWT | Module stats (docs/chunks/index size/LLM status/fallback flag) |
| `/rag/admin/docs` | GET | Bearer JWT (admin) | Admin full document list |

**Key design:**
- **Three-layer decoupling**: `EmbeddingService` (embedding façade, auto pseudo-vector fallback) → `VectorStore` abstraction + `InMemoryVectorStore` (pure Python cosine similarity, tens of thousands of chunks) → `RagService` (orchestration: chunk → ingest → retrieve → build prompt → LLM call)
- **Extensibility**: `VectorStore` is an ABC; swap for Milvus / PGVector / FAISS in production by implementing 4 methods `add/delete/search`; `RagServiceConfig` lets you configure chunk size, top-k, embedding/chat model in `[myproject.rag]`
- **SSE streaming**: `POST /rag/chat` with `"stream": true` emits `retrieval` (hits) → multiple `delta` (LLM text delta) → `done` (end metadata) → `error` on exception
- **Permission isolation**: Users can only search their own docs; admins can cross users
- **Startup warmup**: lifespan loads all chunks from MySQL to rebuild in-memory index on boot (failure falls back without blocking startup)
- **Graceful degradation**: With no LLM provider, `/rag/search` still works with pseudo-vectors; `/rag/chat` returns 503 (consistent with `/llm/chat`)

## 3 Database Migrations

Migrations use `aerich` (included via `pip install -e ".[dev]"`).

```shell
# First init (skip if ./migrations and [tool.aerich] already exist)
aerich init -t src.settings.DATABASE_CONFIG

# Generate tables
aerich init-db

# Generate migration & apply after model changes
aerich migrate --name update_user
aerich upgrade

# View history / pending
aerich history
aerich heads
```

> Migrate other DB connections with `--app [appname]`, e.g. `aerich --app user migrate`.
>
> Note: when renaming columns, `Rename xxx to yyy? [True]` — True generates `RENAME COLUMN` (requires MySQL 8.0+), False drops and recreates; for 5.7 compatibility manually edit migration SQL to `CHANGE COLUMN` syntax.

## 4 Container Deployment

### 4.1 Docker Compose (Recommended)

```shell
docker compose up -d                 # app + MySQL + Redis
docker compose --profile full up -d  # adds single-node Kafka (KRaft mode)
docker compose logs -f app
```

The `app` service injects connection config via env vars (see [2 Configuration](#2-configuration)), and only starts after MySQL is ready (healthcheck gating).

### 4.2 Manual Image Build

```shell
docker build -t fastapi-ai-starter:latest .
docker run -p 8080:8080 fastapi-ai-starter:latest
```

The root [Dockerfile](./Dockerfile) is multi-stage: the builder layer installs deps into an isolated venv (cache hit when deps unchanged), runtime layer uses non-root user + HEALTHCHECK (hits `/monitor/healthz`).

### 4.3 CI/CD

On push to main or PR submission, [GitHub Actions](./.github/workflows/ci.yml) auto-runs:
- **lint**: ruff full check
- **test**: 80 unit tests (users / resource CRUD / RAG / LLM gateway / MCP / SSE / observability / security rate limit / Kafka / task scheduler)

### 4.4 Precompiled Release (Optional)

Project supports cx_Freeze compilation to a standalone executable (for environments without Python):

```shell
pip install cx_Freeze          # Ubuntu needs apt install patchelf
python setup.py build          # output in ./build
docker build -t [tag] -f ./docker/build_dockerfile .   # package build artifact into image
```

The legacy source-image build is preserved in `docker/python_dockerfile` (daily deployment should use the root Dockerfile).

---

## 🎯 Roadmap

- [x] **v1.x** — FastAPI + Tortoise-orm base framework (Python 3.9)
- [x] **v2.0** — Upgrade to Python 3.12, all deps to current major, LLM Gateway + MCP + SSE streaming
- [x] User system (register/login/JWT/roles)
- [x] Resource CRUD template (pagination/permission isolation/admin view)
- [x] RAG knowledge base example (vector retrieval + LLM Q&A)
- [x] Admin dashboard (React 18 + Ant Design 5, built-in 5 languages)
- [x] File upload / object storage template (local disk + S3 abstraction, streaming upload)
- [x] WebSocket realtime communication example (channel rooms + JWT handshake + presence + server push)
- [ ] Agent orchestration template (LangGraph integration)

Want a feature? Feel free to open an [Issue](../../issues) or PR 🤝

---

## ⭐ Support

If this project saved you time, **a Star is the best support**!

Your attention keeps me iterating 💪

---

> **v2.0.0 Major Refactor (2026-05)**: Upgraded to Python 3.12, migrated all deps to current major versions. See [CHANGELOG.md](./CHANGELOG.md).
> Code still deployed on Python 3.9 should keep the `1.x` branch or revert the commit.

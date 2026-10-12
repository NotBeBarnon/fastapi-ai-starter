# FastAPI AI Starter

**🌍 다른 언어로 읽기**: [🇨🇳 简体中文](./README.md) · [🇺🇸 English](./README.en.md) · [🇯🇵 日本語](./README.ja.md) · [🇰🇷 한국어](./README.ko.md) · [🇪🇸 Español](./README.es.md)

[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/release/python-3120/)
[![FastAPI](https://img.shields.io/badge/fastapi-%E2%89%A50.115-green.svg)](https://fastapi.tiangolo.com/)
[![Pydantic](https://img.shields.io/badge/pydantic-v2-orange.svg)](https://docs.pydantic.dev/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](#4-컨테이너-배포)
[![CI](https://img.shields.io/badge/ci-github%20actions-2088FF.svg)](./.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-80%20passed-brightgreen.svg)](#-테스트-커버리지)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

<p align="center">
  <img src="./docs/social-preview.png" alt="FastAPI AI Starter" width="100%">
</p>

## 한 줄 소개

**AI 애플리케이션을 위한 프로덕션급 FastAPI 백엔드 스캐폴드** — 사용자 인증 / 리소스 CRUD / LLM 멀티모델 게이트웨이 / MCP 도구 / SSE 스트리밍 / 메시지 큐 / 태스크 스케줄링 / 옵저버빌리티, 모두 즉시 사용 가능. 3분 만에 시작, 비즈니스 로직만 작성하세요.

> AI 앱 백엔드를 처음부터 구축하는 데 얼마나 걸릴까요? 회원가입, 로그인, 권한, 페이지네이션, 스트리밍, 모델 연동, 헬스체크……
> fastapi-ai-starter를 쓰면 이 모든 게 준비되어 있습니다. 비즈니스 로직만 작성하면 됩니다.

---

## 왜 fastapi-ai-starter인가?

세상에는 많은 FastAPI 스캐폴드가 있지만 대부분 **범용 CRUD 템플릿**입니다. AI 앱을 만들 때는 LLM 연동, 스트리밍, 도구 생태계를 직접 구축해야 합니다.

| 기능 | fastapi-ai-starter | FastAPI 공식 템플릿 | full-stack-fastapi | 기타 보일러플레이트 |
|---|:---:|:---:|:---:|:---:|
| 사용자 시스템 (가입/로그인/역할) | ✅ | ❌ | ✅ | ⚠️ |
| 리소스 CRUD + 권한 분리 | ✅ | ❌ | ⚠️ | ⚠️ |
| **LLM 멀티모델 게이트웨이 (제로 SDK)** | ✅ | ❌ | ❌ | ❌ |
| **MCP 도구 생태계 (SSE / stdio)** | ✅ | ❌ | ❌ | ❌ |
| **SSE 스트리밍 + LLM Streamer** | ✅ | ❌ | ❌ | ⚠️ |
| Kafka 메시지 파이프라인 (자동 재연결) | ✅ | ❌ | ❌ | ❌ |
| 백그라운드 태스크 + 실시간 진행률 | ✅ | ❌ | ✅ | ⚠️ |
| 헬스 프로브 + Prometheus 메트릭 | ✅ | ❌ | ⚠️ | ❌ |
| Rate limit + 보안 미들웨어 | ✅ | ❌ | ✅ | ⚠️ |
| Docker 멀티스테이지 + CI/CD | ✅ | ❌ | ✅ | ⚠️ |
| DB 다운 시 우아한 저하 | ✅ | ❌ | ❌ | ❌ |
| 내장 관리자 대시보드 (다국어) | ✅ | ❌ | ❌ | ❌ |

**한 줄 요약**: 다른 곳은 CRUD 뼈대를 주지만, 우리는 **AI 앱을 바로 프로덕션에 투입할 수 있는** 완전한 백엔드를 제공합니다.

---

## 핵심 기능

| 모듈 | 기능 | 데모 엔드포인트 |
|---|---|---|
| 🔀 **LLM 멀티모델 게이트웨이** | 멀티 프로바이더 우선순위 폴백, 지수 백오프 재시도, 토큰/비용 통계, OpenAI / DeepSeek / Claude / Ollama 통합 인터페이스 (chat / stream / embeddings) | `POST /llm/chat` |
| 🔧 **MCP 도구 생태계** | 도구 레지스트리 + JSON-RPC Server (SSE / stdio 이중 전송), Claude Desktop, Cline 등 AI 클라이언트와 직접 연동 | `GET /mcp/sse` |
| 🌊 **SSE 스트리밍** | SSEStream (큐/제너레이터 패턴), LLMStreamer (OpenAI 호환 스트리밍 출력) | `GET /sse/chat` |
| 📚 **RAG 지식베이스** | 문서 업로드 시 자동 청크 + embedding, 메모리 벡터 인덱스 (코사인 유사도), 검색 증강 QA (일반 + SSE 스트리밍), LLM 미설정 시 의사 벡터로 폴백하여 오프라인 데모 가능 | `POST /rag/docs`, `POST /rag/search`, `POST /rag/chat` |
| 📨 **Kafka 메시징** | 자동 재연결 + 자동 토픽 생성 producer/consumer, EventPublisher 래퍼, 콜백 기반 백그라운드 워커 | `POST /kafka/publish`, `GET /kafka/status` |
| ⏰ **백그라운드 태스크** | TaskManager 레지스트리 (interval/cron), 수동 트리거 + 상태 추적, SSE 실시간 진행률 구독, 일시정지/재개 | `GET /tasks`, `POST /tasks/{name}/trigger` |
| 📊 **옵저버빌리티** | DB / Redis / Kafka / LLM 4종 헬스 프로브, Prometheus 메트릭 (P50-P99 지연시간/토큰/비용), trace_id 구조화 트레이싱 | `/monitor/healthz`, `/monitor/readyz`, `/monitor/metrics` |
| 🔐 **보안 & Rate limit** | 제로 의존 HS256 JWT, API Key 인증 (역할 검사), Redis Lua 슬라이딩 윈도우 Rate limit (메모리 폴백), 요청 ID 상관관계 | `POST /security/token`, `GET /security/limited` |
| 👤 **사용자 시스템** | PBKDF2-SHA256 비밀번호 해시, 가입/로그인/비밀번호 변경, JWT Bearer 인증, admin/user 역할 제어, DB 다운 시 우아한 저하 | `POST /user/register`, `POST /user/login`, `GET /user/me`, `GET /user/list` |
| 📦 **리소스 CRUD** | 통합 페이지네이션/필터/정렬, 소유자 권한 분리 (권한 없으면 404, 열거 방지), 관리자 전체 조회, 부분 업데이트, DB 저하 | `GET/POST/PUT/DELETE /resource/beams`, `GET /resource/admin/beams` |
| 🚀 **DevOps** | 멀티스테이지 Dockerfile, docker-compose 원클릭 (MySQL + Redis + 선택적 Kafka), GitHub Actions 자동 회귀 | `docker compose up -d` |
| 🖥️ **관리자 대시보드** | React 18 + Ant Design 5 + react-i18next, 로그인/대시보드/사용자/리소스/지식베이스/모니터 6개 모듈, 5개 언어 전환 (영/중/일/한/서) 내장 | `/admin/login` |

모든 엔드포인트는 Swagger 문서(`/docs`)를 제공하며, 80개의 단위 테스트로 전 범위를 커버하고 CI가 푸시마다 자동 회귀합니다.

## 0 퀵 스타트

### ⚡ 30초 체험 (Docker)

한 명령으로 백엔드 전체를 시작, 제로 설정:

```shell
docker compose up -d
```

시작 후 방문할 수 있는 곳:

| 보고 싶은 것 | URL |
|---|---|
| 📖 **전체 API 문서** (Swagger UI) | `http://localhost:8080/api/sample/docs` |
| 📋 **Redoc 문서** | `http://localhost:8080/api/sample/redoc` |
| ❤️ Liveness 프로브 | `http://localhost:8080/api/sample/monitor/healthz` |
| ✅ Readiness 프로브 (각 컴포넌트 상태) | `http://localhost:8080/api/sample/monitor/readyz` |
| 📊 Prometheus 메트릭 | `http://localhost:8080/api/sample/monitor/metrics` |
| 🖥️ **관리자 대시보드** (React Admin, 5개 언어) | `http://localhost:8080/admin/login` |

> Kafka가 필요하면 `docker compose --profile full up -d`로 추가하세요.
>
> 최초 부팅 시 자동으로 테이블을 생성합니다(compose에서 `FS_AUTO_SCHEMA=true` 설정, safe 모드로 기존 데이터 파괴 안 함). 가입/로그인을 바로 체험해볼 수 있습니다.

---

## 🎯 로드맵

- [x] **v1.x** — FastAPI + Tortoise-orm 기본 프레임워크 (Python 3.9)
- [x] **v2.0** — Python 3.12로 업그레이드, 전 스택 의존 메이저 버전, LLM 게이트웨이 + MCP + SSE 스트리밍
- [x] 사용자 시스템 (가입/로그인/JWT/역할)
- [x] 리소스 CRUD 템플릿 (페이지네이션/권한 분리/관리자 조회)
- [x] RAG 지식베이스 예제 (벡터 검색 + LLM QA)
- [x] 관리자 대시보드 (React 18 + Ant Design 5, 5개 언어 내장)
- [x] 파일 업로드 / 오브젝트 스토리지 (로컬 + S3 추상화, 스트리밍)
- [x] WebSocket 실시간 통신 예제 (채널/방 + JWT + 프레즌스)
- [ ] Agent 오케스트레이션 템플릿 (LangGraph 연동)

추가하고 싶은 기능이 있다면 [Issue](../../issues)나 PR로 언제든지 환영합니다 🤝

---

## ⭐ 응원해주세요

이 프로젝트가 시간을 절약해줬다면, **Star를 눌러주시는 것이 가장 큰 응원입니다!**

당신의 관심이 지속적인 개선의 원동력이 됩니다 💪

---

> **v2.0.0 메이저 리팩토링 (2026-05)**: Python 3.12로 업그레이드, 모든 의존을 현재 메이저 버전으로 마이그레이션. 자세한 내용은 [CHANGELOG.md](./CHANGELOG.md).
> Python 3.9에 배포된 이전 코드는 `1.x` 브랜치를 유지하거나 커밋을 되돌려주세요.

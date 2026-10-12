# FastAPI AI Starter

**🌍 Leer en otros idiomas**: [🇨🇳 简体中文](./README.md) · [🇺🇸 English](./README.en.md) · [🇯🇵 日本語](./README.ja.md) · [🇰🇷 한국어](./README.ko.md) · [🇪🇸 Español](./README.es.md)

[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/release/python-3120/)
[![FastAPI](https://img.shields.io/badge/fastapi-%E2%89%A50.115-green.svg)](https://fastapi.tiangolo.com/)
[![Pydantic](https://img.shields.io/badge/pydantic-v2-orange.svg)](https://docs.pydantic.dev/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](#4-despliegue-en-contenedores)
[![CI](https://img.shields.io/badge/ci-github%20actions-2088FF.svg)](./.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-80%20passed-brightgreen.svg)](#-cobertura-de-pruebas)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

<p align="center">
  <img src="./docs/social-preview.png" alt="FastAPI AI Starter" width="100%">
</p>

## En una frase

**Scaffold de backend FastAPI listo para producción, orientado a aplicaciones de IA** — Autenticación de usuarios / CRUD de recursos / Gateway multimodelo LLM / Herramientas MCP / Streaming SSE / Cola de mensajes / Programación de tareas / Observabilidad, todo listo para usar. Arranca en 3 minutos. Escribe solo tu lógica de negocio.

> ¿Cuánto se tarda en construir desde cero un backend para aplicaciones de IA? Registro, login, permisos, paginación, streaming, integración de modelos, health checks…
> Con fastapi-ai-starter ya lo tienes todo. Solo tienes que escribir la lógica de negocio.

---

## ¿Por qué fastapi-ai-starter?

Hay muchos scaffolds de FastAPI por ahí, pero la mayoría son **plantillas CRUD genéricas**. Al crear aplicaciones de IA todavía tienes que integrar LLM, streaming y el ecosistema de herramientas por tu cuenta.

| Funcionalidad | fastapi-ai-starter | Plantilla oficial FastAPI | full-stack-fastapi | Otros boilerplates |
|---|:---:|:---:|:---:|:---:|
| Sistema de usuarios (registro/login/roles) | ✅ | ❌ | ✅ | ⚠️ |
| CRUD de recursos + aislamiento de permisos | ✅ | ❌ | ⚠️ | ⚠️ |
| **Gateway multimodelo LLM (sin SDKs)** | ✅ | ❌ | ❌ | ❌ |
| **Ecosistema de herramientas MCP (SSE / stdio)** | ✅ | ❌ | ❌ | ❌ |
| **Streaming SSE + LLM Streamer** | ✅ | ❌ | ❌ | ⚠️ |
| Pipeline Kafka (reconexión automática) | ✅ | ❌ | ❌ | ❌ |
| Tareas en segundo plano + progreso en tiempo real | ✅ | ❌ | ✅ | ⚠️ |
| Sondas de salud + métricas Prometheus | ✅ | ❌ | ⚠️ | ❌ |
| Rate limiting + middleware de seguridad | ✅ | ❌ | ✅ | ⚠️ |
| Docker multietapa + CI/CD | ✅ | ❌ | ✅ | ⚠️ |
| Degradación elegante si la BD cae | ✅ | ❌ | ❌ | ❌ |
| Panel de administración integrado (multilenguaje) | ✅ | ❌ | ❌ | ❌ |

**En una palabra**: otros te dan un esqueleto CRUD; nosotros te damos un backend completo **listo para llevar tu aplicación de IA a producción**.

---

## Funcionalidades principales

| Módulo | Capacidad | Endpoint de demostración |
|---|---|---|
| 🔀 **Gateway multimodelo LLM** | Fallback por prioridad entre múltiples proveedores, reintento con backoff exponencial, estadísticas de tokens/coste, interfaz unificada para OpenAI / DeepSeek / Claude / Ollama (chat / stream / embeddings) | `POST /llm/chat` |
| 🔧 **Ecosistema MCP** | Registro de herramientas + servidor JSON-RPC (doble transporte SSE / stdio), compatible directamente con Claude Desktop, Cline y otros clientes de IA | `GET /mcp/sse` |
| 🌊 **Streaming SSE** | SSEStream (patrones cola/generador), LLMStreamer (salida streaming compatible con OpenAI) | `GET /sse/chat` |
| 📚 **Base de conocimiento RAG** | División automática en fragmentos (chunking) + embedding al indexar, índice vectorial en memoria (similitud coseno), preguntas y respuestas con recuperación (normal + SSE streaming), fallback a pseudo-vectores determinista para demo offline si no hay LLM configurado | `POST /rag/docs`, `POST /rag/search`, `POST /rag/chat` |
| 📨 **Mensajería Kafka** | productor/consumidor con reconexión automática y creación automática de topics, wrapper EventPublisher, worker en segundo plano basado en callbacks | `POST /kafka/publish`, `GET /kafka/status` |
| ⏰ **Programador de tareas** | Registro TaskManager (intervalo/cron), disparo manual + seguimiento de estado, suscripción SSE al progreso en tiempo real, pausar/reanudar | `GET /tasks`, `POST /tasks/{name}/trigger` |
| 📊 **Observabilidad** | Cuatro sondas de salud (DB / Redis / Kafka / LLM), métricas Prometheus (latencia P50-P99 / Tokens / Coste), trazado estructurado con trace_id | `/monitor/healthz`, `/monitor/readyz`, `/monitor/metrics` |
| 🔐 **Seguridad & Rate limiting** | JWT HS256 sin dependencias, autenticación por API Key (comprobación de rol), rate limit de ventana deslizante con Redis Lua (fallback en memoria), correlación por ID de petición | `POST /security/token`, `GET /security/limited` |
| 👤 **Sistema de usuarios** | Hash de contraseña PBKDF2-SHA256, registro/login/cambio de contraseña, autenticación JWT Bearer, control de roles admin/user, degradación elegante si la BD cae | `POST /user/register`, `POST /user/login`, `GET /user/me`, `GET /user/list` |
| 📦 **CRUD de recursos** | Paginación/filtro/ordenación unificados, aislamiento por propietario (404 en acceso no autorizado, evita enumeración), vista completa para admin, actualización parcial, degradación de BD | `GET/POST/PUT/DELETE /resource/beams`, `GET /resource/admin/beams` |
| 🚀 **DevOps** | Dockerfile multietapa, docker-compose con un solo comando (MySQL + Redis + Kafka opcional), regresión automática con GitHub Actions | `docker compose up -d` |
| 🖥️ **Panel de administración** | React 18 + Ant Design 5 + react-i18next, 6 módulos (Login/Dashboard/Users/Resources/Knowledge/Monitor), selector integrado de 5 idiomas (ES/EN/ZH/JA/KO) | `/admin/login` |

Todos los endpoints incluyen documentación Swagger (`/docs`), 80 pruebas unitarias con cobertura completa y CI que se ejecuta automáticamente en cada push.

## 0 Inicio rápido

### ⚡ Pruébalo en 30 segundos (Docker)

Un solo comando arranca todo el backend, sin configuración:

```shell
docker compose up -d
```

Tras arrancar puedes visitar:

| Qué ver | URL |
|---|---|
| 📖 **Documentación completa de la API** (Swagger UI) | `http://localhost:8080/api/sample/docs` |
| 📋 **Redoc** | `http://localhost:8080/api/sample/redoc` |
| ❤️ Sonda de liveness | `http://localhost:8080/api/sample/monitor/healthz` |
| ✅ Sonda de readiness (estado de componentes) | `http://localhost:8080/api/sample/monitor/readyz` |
| 📊 Métricas Prometheus | `http://localhost:8080/api/sample/monitor/metrics` |
| 🖥️ **Panel de administración** (React Admin, 5 idiomas) | `http://localhost:8080/admin/login` |

> ¿Quieres Kafka? Ejecuta `docker compose --profile full up -d`.
>
> El primer arranque crea las tablas automáticamente (compose activa `FS_AUTO_SCHEMA=true`, el modo safe no destruye datos existentes); puedes probar registro y login directamente.

---

## 🎯 Hoja de ruta

- [x] **v1.x** — Framework base FastAPI + Tortoise-orm (Python 3.9)
- [x] **v2.0** — Actualización a Python 3.12, versiones mayores de todas las dependencias, Gateway LLM + MCP + streaming SSE
- [x] Sistema de usuarios (registro/login/JWT/roles)
- [x] Plantilla CRUD de recursos (paginación/aislamiento de permisos/consulta admin)
- [x] Ejemplo de base de conocimiento RAG (búsqueda vectorial + QA con LLM)
- [x] Panel de administración (React 18 + Ant Design 5, 5 idiomas integrados)
- [x] Subida de archivos / almacenamiento de objetos (local + abstracción S3, streaming)
- [x] Ejemplo de comunicación en tiempo real con WebSocket (salas/canales + JWT + presencia)
- [ ] Plantilla de orquestación de agentes (integración LangGraph)

¿Quieres alguna funcionalidad? No dudes en abrir un [Issue](../../issues) o PR 🤝

---

## ⭐ Apoya el proyecto

Si este proyecto te ha ahorrado tiempo, **¡darle una estrella es la mejor forma de apoyar!**

Tu atención es el motor para seguir mejorando 💪

---

> **Refactorización importante v2.0.0 (2026-05)**: Actualizado a Python 3.12, todas las dependencias migradas a sus versiones mayores actuales. Detalles en [CHANGELOG.md](./CHANGELOG.md).
> Si tienes código antiguo desplegado en Python 3.9, mantén la rama `1.x` o revierte el commit.

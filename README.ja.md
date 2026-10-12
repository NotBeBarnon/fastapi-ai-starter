# FastAPI AI Starter

**🌍 他の言語で読む**: [🇨🇳 简体中文](./README.md) · [🇺🇸 English](./README.en.md) · [🇯🇵 日本語](./README.ja.md) · [🇰🇷 한국어](./README.ko.md) · [🇪🇸 Español](./README.es.md)

[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/release/python-3120/)
[![FastAPI](https://img.shields.io/badge/fastapi-%E2%89%A50.115-green.svg)](https://fastapi.tiangolo.com/)
[![Pydantic](https://img.shields.io/badge/pydantic-v2-orange.svg)](https://docs.pydantic.dev/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](#4-コンテナデプロイ)
[![CI](https://img.shields.io/badge/ci-github%20actions-2088FF.svg)](./.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-80%20passed-brightgreen.svg)](#-テストカバレッジ)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

<p align="center">
  <img src="./docs/social-preview.png" alt="FastAPI AI Starter" width="100%">
</p>

## 一言で説明

**AI アプリ向けの本番環境対応 FastAPI バックエンドスキャフォールド** — ユーザー認証 / リソース CRUD / LLM マルチモデルゲートウェイ / MCP ツール / SSE ストリーミング / メッセージキュー / タスクスケジューリング / 可観測性、すべて標準搭載。3分で起動、ビジネスロジックを書くだけ。

> AI アプリのバックエンドをゼロから作るのにどれくらいかかりますか？ 登録・ログイン・権限・ページネーション・ストリーミング・モデル接続・ヘルスチェック……
> fastapi-ai-starter なら全部入っています。あなたはビジネスロジックを書くだけです。

---

## なぜ fastapi-ai-starter か？

FastAPI スキャフォールドは世の中にたくさんありますが、ほとんどは **汎用 CRUD テンプレート** です。AI アプリを作るには、LLM の接続、ストリーミング、ツールエコシステムを自分で整える必要があります。

| 機能 | fastapi-ai-starter | FastAPI 公式テンプレート | full-stack-fastapi | 他のボイラープレート |
|---|:---:|:---:|:---:|:---:|
| ユーザー体系（登録/ログイン/ロール） | ✅ | ❌ | ✅ | ⚠️ |
| リソース CRUD + 権限分离 | ✅ | ❌ | ⚠️ | ⚠️ |
| **LLM マルチモデルゲートウェイ（ゼロ SDK）** | ✅ | ❌ | ❌ | ❌ |
| **MCP ツールエコシステム（SSE / stdio）** | ✅ | ❌ | ❌ | ❌ |
| **SSE ストリーミング + LLM Streamer** | ✅ | ❌ | ❌ | ⚠️ |
| Kafka メッセージング（自動再接続） | ✅ | ❌ | ❌ | ❌ |
| バックグラウンドタスク + リアルタイム進捗 | ✅ | ❌ | ✅ | ⚠️ |
| ヘルスプローブ + Prometheus メトリクス | ✅ | ❌ | ⚠️ | ❌ |
| レート制限 + セキュリティミドルウェア | ✅ | ❌ | ✅ | ⚠️ |
| Docker マルチステージ + CI/CD | ✅ | ❌ | ✅ | ⚠️ |
| DB ダウン時の優美な縮退 | ✅ | ❌ | ❌ | ❌ |
| 管理画面（多言語対応） | ✅ | ❌ | ❌ | ❌ |

**一言で違いを**: 他は CRUD の骨組みをくれます。私たちは **AI アプリを本番投入できる** 完全なバックエンドを提供します。

---

## コア機能

| モジュール | 機能 | デモエンドポイント |
|---|---|---|
| 🔀 **LLM マルチモデルゲートウェイ** | マルチプロバイダ優先度フォールバック、指数バックオフリトライ、トークン/コスト統計、OpenAI / DeepSeek / Claude / Ollama 統一インターフェース（chat / stream / embeddings） | `POST /llm/chat` |
| 🔧 **MCP ツールエコシステム** | ツールレジストリ + JSON-RPC Server（SSE / stdio 両対応）、Claude Desktop、Cline などの AI クライアントに直接接続 | `GET /mcp/sse` |
| 🌊 **SSE ストリーミング** | SSEStream（キュー/ジェネレータ）、LLMStreamer（OpenAI 互換ストリーム出力） | `GET /sse/chat` |
| 📚 **RAG ナレッジベース** | 文書投入時の自動チャンク + embedding、メモリ内ベクトルインデックス（コサイン類似度）、検索拡張 QA（通常 + SSE ストリーム）、LLM 未設定時は疑似ベクトル縮退でオフラインデモ可 | `POST /rag/docs`、`POST /rag/search`、`POST /rag/chat` |
| 📨 **Kafka メッセージング** | 自動再接続 + 自動トピック作成の producer/consumer、EventPublisher ラッパー、コールバック式バックグラウンドワーカー | `POST /kafka/publish`、`GET /kafka/status` |
| ⏰ **バックグラウンドタスク** | TaskManager レジストリ（interval/cron）、手動トリガー + ステータス追跡、SSE リアルタイム進捗、一時停止/再開 | `GET /tasks`、`POST /tasks/{name}/trigger` |
| 📊 **可観測性** | DB / Redis / Kafka / LLM の4種ヘルスプローブ、Prometheus メトリクス（P50-P99 レイテンシ/トークン/コスト）、trace_id 構造化トレーシング | `/monitor/healthz`、`/monitor/readyz`、`/monitor/metrics` |
| 🔐 **セキュリティ & レート制限** | ゼロ依存 HS256 JWT、API Key 認証（ロールチェック）、Redis Lua スライディングウィンドウ（メモリフォールバック）、リクエスト ID 相関 | `POST /security/token`、`GET /security/limited` |
| 👤 **ユーザー体系** | PBKDF2-SHA256 パスワードハッシュ、登録/ログイン/パスワード変更、JWT Bearer 認証、admin/user ロール制御、DB ダウン時縮退 | `POST /user/register`、`POST /user/login`、`GET /user/me`、`GET /user/list` |
| 📦 **リソース CRUD** | 統一ページネーション/フィルタ/ソート、オーナー権限分離（越境は404、列挙防止）、管理者全件クエリ、部分更新、DB 縮退 | `GET/POST/PUT/DELETE /resource/beams`、`GET /resource/admin/beams` |
| 🚀 **DevOps** | マルチステージ Dockerfile、docker-compose 一発構築（MySQL + Redis + オプション Kafka）、GitHub Actions 自動回帰 | `docker compose up -d` |
| 🖥️ **管理画面** | React 18 + Ant Design 5 + react-i18next、ログイン/ダッシュボード/ユーザー/リソース/ナレッジ/モニターの6モジュール、5言語切替（英/中/日/韓/西）を標準搭載 | `/admin/login` |

全エンドポイントに Swagger ドキュメント（`/docs`）付き。80項目のユニットテストで全カバー、CI がプッシュ毎に自動回帰。

## 0 クイックスタート

### ⚡ 30秒でお試し（Docker）

1コマンドでバックエンド全体を起動、ゼロコンフィグ：

```shell
docker compose up -d
```

起動後にアクセスできます：

| 見たいもの | URL |
|---|---|
| 📖 **完全な API ドキュメント**（Swagger UI） | `http://localhost:8080/api/sample/docs` |
| 📋 **Redoc** | `http://localhost:8080/api/sample/redoc` |
| ❤️ Liveness プローブ | `http://localhost:8080/api/sample/monitor/healthz` |
| ✅ Readiness プローブ（各コンポーネント状態） | `http://localhost:8080/api/sample/monitor/readyz` |
| 📊 Prometheus メトリクス | `http://localhost:8080/api/sample/monitor/metrics` |
| 🖥️ **管理画面**（React Admin、5言語対応） | `http://localhost:8080/admin/login` |

> Kafka が必要なら `docker compose --profile full up -d` で追加できます。
>
> 初回起動時は自動でテーブルを作成します（compose で `FS_AUTO_SCHEMA=true`、safe モードで既存データは破壊しません）。登録・ログインをすぐに試せます。

### 💻 ローカル開発

```powershell
# 1. Python 3.12 venv を作成して有効化
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. 依存をインストール（開発ツール含む：aerich/ruff/pytest）
pip install -e ".[dev]"

# 3. project_env 内の DB 接続先/ユーザー/パスワードを編集

# 4. 起動（typer コマンド）
python main.py run            # デフォルトは 0.0.0.0:8080
python main.py run --reload   # 開発用ホットリロード
```

起動後にアクセス：
- Swagger UI: `http://127.0.0.1:8080/api/sample/docs`
- ReDoc: `http://127.0.0.1:8080/api/sample/redoc`
- Health check: `http://127.0.0.1:8080/api/sample/monitor/healthz`
- Admin: `http://127.0.0.1:8080/admin/login`

---

## 🎯 ロードマップ

- [x] **v1.x** — FastAPI + Tortoise-orm 基本フレームワーク（Python 3.9）
- [x] **v2.0** — Python 3.12 にアップグレード、全スタック依存メジャー版、LLM ゲートウェイ + MCP + SSE ストリーミング
- [x] ユーザー体系（登録/ログイン/JWT/ロール）
- [x] リソース CRUD テンプレート（ページネーション/権限分離/管理者クエリ）
- [x] RAG ナレッジベース例（ベクトル検索 + LLM QA）
- [x] 管理画面（React 18 + Ant Design 5、5言語対応）
- [x] ファイルアップロード / オブジェクトストレージ（ローカル + S3 抽象、ストリーミング）
- [x] WebSocket リアルタイム通信サンプル（チャンネル/ルーム + JWT + プレゼンス）
- [ ] Agent オーケストレーションテンプレート（LangGraph 連携）

機能追加のご要望は [Issue](../../issues) または PR でお気軽に 🤝

---

## ⭐ サポート

このプロジェクトが時間を節約できたのなら、**Star を付けていただくのが最大のサポートです！**

あなたの応援が継続的な改善のモチベーションになります 💪

---

> **v2.0.0 メジャーリファクタリング（2026-05）**: Python 3.12 にアップグレード、全依存を現行メジャーに移行。詳細は [CHANGELOG.md](./CHANGELOG.md)。
> Python 3.9 でデプロイしている古いコードは `1.x` ブランチを残すかコミットを差し戻してください。

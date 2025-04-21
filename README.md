# 🤖 Nflow Chat Assistant API

An intelligent multi-agent system for interacting with the Nflow platform to create and manage applications, database schemas, UI layouts, and automation flows through natural language.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🧠 **Multi-Agent Architecture** - Purpose-built agents specializing in different aspects of the Nflow platform
- 🤝 **Human-in-the-Loop (HITL)** - Interactive clarification requests when information is ambiguous or missing
- 📊 **Database Schema Design** - Intelligent object and field creation with relationship modeling
- 🖥️ **UI Layout Creation** - Generate application layouts and pages from descriptions
- 🔄 **Automation Flow Building** - Create complex workflows with triggers and actions
- 💾 **Persistent Memory** - Session-based context management for coherent conversations
- 🔍 **Intent Recognition** - Convert natural language requests into structured task plans

## Architecture

The system uses a multi-agent approach where each agent specializes in a specific domain:

| Agent                 | Responsibility                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **Coordinator Agent** | Central orchestrator that routes tasks, manages memory and HITL, and invokes other agents. |
| **Classifier Agent**  | Classify the user message and route to the correct workflow.                               |
| **Intent Agent**      | Converts user prompts into a structured intent plan (task DAG).                            |
| **Executor Agent**    | Receives normalized tool calls from agents and triggers real Nflow API requests.           |
| **Object Agent**      | Expert in database design and object schema on the Nflow platform.                         |
| **Application Agent** | Creates or updates Nflow applications.                                                     |
| **Layout Agent**      | Creates and manages UI layout/pages in Nflow.                                              |
| **Flow Agent**        | Builds automation flows with triggers and actions.                                         |

## Prerequisites

- Docker and Docker Compose (for containerized setup)
- OpenAI API Key
- Nflow API Credentials

For local development without Docker:

- Node.js (v18+)
- pnpm (v10+)
- PostgreSQL (v15+)
- Redis

## Quick Start with Docker

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nflow-ai-assitant-api-nest.git
cd nflow-ai-assitant-api-nest
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your:

- OpenAI API key
- Nflow API credentials
- Other required settings

### 3. Start the application

#### Development mode

```bash
docker compose -f docker-compose.dev.yml up -d
```

This will start:

- API server in development mode with hot-reload
- PostgreSQL database
- Redis instance
- Automatically run Prisma migrations

#### Production mode

```bash
docker compose up -d
```

This will start:

- API server in production mode
- PostgreSQL database
- Redis instance
- Automatically run Prisma migrations

### 4. Access the API

Once the services are running, you can access:

- API: http://localhost:3000/api
- Swagger Documentation: http://localhost:3000/api/docs

## Local Development (Non-Docker)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up database and Redis

Ensure PostgreSQL and Redis are running locally or update `.env` with their connection details.

### 3. Run database migrations

```bash
pnpm prisma migrate dev
```

### 4. Run the application

```bash
# Development mode with hot-reload
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

## Development Tools

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint code
pnpm lint

# Format code
pnpm format

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev
```

## Troubleshooting

### Database Issues

If you encounter database-related errors like "table does not exist":

1. Make sure the database container is running:

   ```bash
   docker compose ps
   ```

2. Manually run migrations:

   ```bash
   # For development
   docker compose -f docker-compose.dev.yml exec api pnpm prisma migrate deploy

   # For production
   docker compose exec api pnpm prisma migrate deploy
   ```

3. Reset database (caution: this will delete all data):

   ```bash
   # For development
   docker compose -f docker-compose.dev.yml exec api pnpm prisma migrate reset --force

   # For production
   docker compose exec api pnpm prisma migrate reset --force
   ```

### Container Access

To access container shells:

```bash
# API container
docker compose -f docker-compose.dev.yml exec api sh

# Database container
docker compose -f docker-compose.dev.yml exec postgres psql -U pg -d nflow-chat-assistant

# Redis container
docker compose -f docker-compose.dev.yml exec redis redis-cli -a redis
```

## Project Roadmap

Current development progress:

- **Total Progress**: 10/42 tasks completed (24%)
- **Object Agent**: 1/9 completed (11%)
- **Application Agent**: 1/5 completed (20%)
- **Layout Agent**: 1/4 completed (25%)
- **Flow Agent**: 0/4 completed (0%)
- **Coordinator Agent**: 3/6 completed (50%)
- **Executor Agent**: 1/5 completed (20%)
- **Memory Service**: 1/5 completed (20%)
- **HITL & Prompt Handling**: 1/3 completed (33%)
- **Intent Agent**: 2/4 completed (50%)

See the [full roadmap](docs/roadmap.md) for detailed information on planned features and development status.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

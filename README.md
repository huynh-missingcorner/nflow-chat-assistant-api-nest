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

- Node.js (v18+)
- pnpm (v10+)
- PostgreSQL (v15+)
- Redis
- OpenAI API Key

## Getting Started

### Environment Setup

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/nflow-ai-assitant-api-nest.git
   cd nflow-ai-assitant-api-nest
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Copy the example environment file and update with your settings

   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`
   - Set your OpenAI API key
   - Configure database connection
   - Set Nflow API credentials

### Running with Docker

```bash
# Development mode
docker-compose up -d

# Production mode
docker-compose -f docker-compose.yml up -d
```

### Running Locally

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

## API Documentation

Once the server is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api
```

## Development

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint code
pnpm lint

# Format code
pnpm format
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

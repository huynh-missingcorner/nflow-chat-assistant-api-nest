-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('INTENT_EXTRACTION', 'COMPONENT_MAPPING', 'API_GENERATOR', 'VALIDATION', 'APPLICATION_AGENT', 'OBJECT_AGENT', 'LAYOUT_AGENT', 'FLOW_AGENT', 'EXECUTION_AGENT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_results" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentType" "AgentType" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'COMPLETED',
    "error" TEXT,
    "duration" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "agent_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_apps" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nflowAppId" TEXT NOT NULL,
    "appUrl" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "components" JSONB NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "generated_apps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_sessionId_idx" ON "messages"("sessionId");

-- CreateIndex
CREATE INDEX "agent_results_sessionId_idx" ON "agent_results"("sessionId");

-- CreateIndex
CREATE INDEX "agent_results_messageId_idx" ON "agent_results"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_apps_nflowAppId_key" ON "generated_apps"("nflowAppId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_apps_sessionId_key" ON "generated_apps"("sessionId");

-- CreateIndex
CREATE INDEX "generated_apps_sessionId_idx" ON "generated_apps"("sessionId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_results" ADD CONSTRAINT "agent_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_results" ADD CONSTRAINT "agent_results_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_apps" ADD CONSTRAINT "generated_apps_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

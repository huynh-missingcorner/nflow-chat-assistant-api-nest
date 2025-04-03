/*
  Warnings:

  - Added the required column `updatedAt` to the `agent_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `chat_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `generated_apps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agent_results" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "generated_apps" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

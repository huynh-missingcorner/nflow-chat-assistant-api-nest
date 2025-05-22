-- Add userId field to chat_sessions table
ALTER TABLE "chat_sessions" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';

-- Create index on userId for better query performance
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- After all data is migrated, remove the default value
ALTER TABLE "chat_sessions" ALTER COLUMN "userId" DROP DEFAULT;

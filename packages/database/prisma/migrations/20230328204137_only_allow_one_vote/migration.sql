/*
  Warnings:

  - A unique constraint covering the columns `[suggestion_id,user_id]` on the table `suggestion_votes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "suggestions" ADD COLUMN     "approval_queue_messages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_votes_suggestion_id_user_id_key" ON "suggestion_votes"("suggestion_id", "user_id");

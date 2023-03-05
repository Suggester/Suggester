/*
  Warnings:

  - A unique constraint covering the columns `[guild_id,name]` on the table `suggestion_feeds` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "suggestion_feeds_guild_id_name_key" ON "suggestion_feeds"("guild_id", "name");

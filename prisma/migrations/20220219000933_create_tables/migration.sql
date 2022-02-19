-- CreateEnum
CREATE TYPE "SuggestionFeedMode" AS ENUM ('AUTOAPPROVE', 'REVIEW');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('APPROVED', 'IN_PROGRESS', 'DENIED');

-- CreateTable
CREATE TABLE "Instances" (
    "id" SERIAL NOT NULL,
    "bot_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstanceGuilds" (
    "id" SERIAL NOT NULL,
    "bot_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstanceGuilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildConfigs" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT E'en',
    "admin_roles" TEXT[],
    "staff_roles" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "log_channel" TEXT,
    "review_channel" TEXT,
    "denied_channel" TEXT,
    "archive_channel" TEXT,
    "log_hook_id" TEXT,
    "log_hook_token" TEXT,
    "flags" TEXT[],

    CONSTRAINT "GuildConfigs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionFeeds" (
    "channel_id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "emoji_up" TEXT DEFAULT E'👍',
    "emoji_mid" TEXT DEFAULT E'🤷',
    "emoji_down" TEXT DEFAULT E'👎',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "mode" "SuggestionFeedMode" NOT NULL DEFAULT E'AUTOAPPROVE',
    "comment_timestamps" BOOLEAN DEFAULT true,
    "in_channel_suggest" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "ack" TEXT,
    "auto_subscribe" BOOLEAN NOT NULL DEFAULT false,
    "flags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionSubscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionSubscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestions" (
    "global_id" SERIAL NOT NULL,
    "id" INTEGER NOT NULL DEFAULT 0,
    "feed_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "feed_message_id" TEXT,
    "legacy_id" INTEGER,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestions_pkey" PRIMARY KEY ("global_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instances_bot_id_key" ON "Instances"("bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "Instances_token_key" ON "Instances"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Instances_public_key_key" ON "Instances"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "InstanceGuilds_guild_id_bot_id_key" ON "InstanceGuilds"("guild_id", "bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "SuggestionFeeds_channel_id_key" ON "SuggestionFeeds"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "SuggestionSubscriptions_user_id_feed_id_suggestion_id_key" ON "SuggestionSubscriptions"("user_id", "feed_id", "suggestion_id");

-- CreateIndex
CREATE UNIQUE INDEX "Suggestions_id_feed_id_key" ON "Suggestions"("id", "feed_id");

-- AddForeignKey
ALTER TABLE "InstanceGuilds" ADD CONSTRAINT "InstanceGuilds_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "Instances"("bot_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionFeeds" ADD CONSTRAINT "SuggestionFeeds_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildConfigs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSubscriptions" ADD CONSTRAINT "SuggestionSubscriptions_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SuggestionFeeds"("channel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSubscriptions" ADD CONSTRAINT "SuggestionSubscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSubscriptions" ADD CONSTRAINT "SuggestionSubscriptions_feed_id_suggestion_id_fkey" FOREIGN KEY ("feed_id", "suggestion_id") REFERENCES "Suggestions"("feed_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestions" ADD CONSTRAINT "Suggestions_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SuggestionFeeds"("channel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create suggestion id trigger
 DROP TRIGGER IF EXISTS generate_suggestion_id ON "Suggestions";
 DROP FUNCTION IF EXISTS generate_suggestion_id;

 CREATE FUNCTION generate_suggestion_id() RETURNS TRIGGER AS $$
 BEGIN
   SELECT (COALESCE(MAX(id), 0) + 1)
   INTO NEW.id
   FROM "Suggestions"
   WHERE feed_id = NEW.feed_id;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;

 CREATE TRIGGER generate_suggestion_id
 BEFORE INSERT
 ON "Suggestions"
 FOR EACH ROW
 EXECUTE PROCEDURE generate_suggestion_id();

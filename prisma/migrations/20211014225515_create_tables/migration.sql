DROP TRIGGER IF EXISTS generate_suggestion_id ON "Suggestion";
DROP FUNCTION IF EXISTS generate_suggestion_id;

CREATE FUNCTION generate_suggestion_id() RETURNS TRIGGER AS $$
BEGIN
  SELECT (COALESCE(MAX(id), 0) + 1)
  INTO NEW.id
  FROM "Suggestion"
  WHERE feed_id = NEW.feed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_suggestion_id
BEFORE INSERT
ON "Suggestion"
FOR EACH ROW
EXECUTE PROCEDURE generate_suggestion_id();

-- CreateEnum
CREATE TYPE "SuggestionFeedMode" AS ENUM ('AUTOAPPROVE', 'REVIEW');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('APPROVED', 'IN_PROGRESS', 'DENIED');

-- CreateTable
CREATE TABLE "GuildConfig" (
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

    CONSTRAINT "GuildConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionFeed" (
    "channel_id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "emoji_up" TEXT DEFAULT E'👍',
    "emoji_mid" TEXT DEFAULT E'🤷',
    "emoji_down" TEXT DEFAULT E'👎',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "mode" "SuggestionFeedMode" NOT NULL DEFAULT E'AUTOAPPROVE',
    "comment_timestamps" BOOLEAN DEFAULT true
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "ack" TEXT,
    "auto_subscribe" BOOLEAN NOT NULL DEFAULT false,
    "flags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionSubscription" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuggestionSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
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

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("global_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuggestionFeed_channel_id_key" ON "SuggestionFeed"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "SuggestionSubscription_user_id_feed_id_suggestion_id_key" ON "SuggestionSubscription"("user_id", "feed_id", "suggestion_id");

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_id_feed_id_key" ON "Suggestion"("id", "feed_id");

-- AddForeignKey
ALTER TABLE "SuggestionFeed" ADD CONSTRAINT "SuggestionFeed_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSubscription" ADD CONSTRAINT "SuggestionSubscription_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SuggestionFeed"("channel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSubscription" ADD CONSTRAINT "SuggestionSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionSubscription" ADD CONSTRAINT "SuggestionSubscription_feed_id_suggestion_id_fkey" FOREIGN KEY ("feed_id", "suggestion_id") REFERENCES "Suggestion"("feed_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SuggestionFeed"("channel_id") ON DELETE CASCADE ON UPDATE CASCADE;

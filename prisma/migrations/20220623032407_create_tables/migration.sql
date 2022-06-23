-- CreateEnum
CREATE TYPE "suggestion_feed_mode" AS ENUM ('AUTOAPPROVE', 'REVIEW');

-- CreateEnum
CREATE TYPE "suggestion_approval_status" AS ENUM ('APPROVED', 'IN_QUEUE', 'DENIED');

-- CreateEnum
CREATE TYPE "suggestion_display_status" AS ENUM ('DEFAULT', 'IMPLEMENTED', 'CONSIDERING', 'IN_PROGRESS', 'NOT_HAPPENING');

-- CreateEnum
CREATE TYPE "suggestion_vote_kind" AS ENUM ('UPVOTE', 'MID', 'DOWNVOTE');

-- CreateEnum
CREATE TYPE "global_block_kind" AS ENUM ('USER', 'GUILD');

-- CreateTable
CREATE TABLE "instances" (
    "id" SERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_guilds" (
    "id" SERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "access_granted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_configs" (
    "id" SERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "flags" INTEGER NOT NULL DEFAULT 0,
    "admin_roles" TEXT[],
    "staff_roles" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_feeds" (
    "id" SERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "command_alias_name" TEXT,
    "channel_id" TEXT NOT NULL,
    "review_channel_id" TEXT,
    "log_channel_id" TEXT,
    "denied_channel_id" TEXT,
    "archive_channel_id" TEXT,
    "mode" "suggestion_feed_mode" NOT NULL DEFAULT E'AUTOAPPROVE',
    "voting_roles" TEXT[],
    "allowed_roles" TEXT[],
    "blocked_roles" TEXT[],
    "ping_role" TEXT,
    "feed_ping_role" TEXT,
    "approved_role" TEXT,
    "implemented_role" TEXT,
    "upvote_emoji" TEXT,
    "mid_emoji" TEXT,
    "downvote_emoji" TEXT,
    "log_webhook_id" TEXT,
    "log_webhook_token" TEXT,
    "submit_cooldown" INTEGER,
    "suggestion_cap" INTEGER,
    "show_comment_timestamps" BOOLEAN NOT NULL DEFAULT true,
    "last_suggestion_id" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestion_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" SERIAL NOT NULL,
    "public_id" INTEGER NOT NULL,
    "application_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "feed_channel_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "feed_message_id" TEXT,
    "body" TEXT NOT NULL,
    "approval_status" "suggestion_approval_status" NOT NULL,
    "display_status" "suggestion_display_status" NOT NULL DEFAULT E'DEFAULT',
    "denial_reason" TEXT,
    "attachment_url" TEXT,
    "trello_attachment_id" TEXT,
    "trello_card" TEXT,
    "pending_edit_body" TEXT,
    "pending_edit_created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_modified_by" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_comments" (
    "id" SERIAL NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "author_id" TEXT NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "trello_comment" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestion_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_votes" (
    "id" SERIAL NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "suggestion_vote_kind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestion_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestion_subscriptions" (
    "id" SERIAL NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestion_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_users" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT E'en-US',
    "flags" INTEGER NOT NULL DEFAULT 0,
    "show_protips" BOOLEAN NOT NULL DEFAULT true,
    "protips_viewed" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_blocks" (
    "id" SERIAL NOT NULL,
    "entity_id" TEXT NOT NULL,
    "blocked_by" TEXT,
    "kind" "global_block_kind" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instances_application_id_key" ON "instances"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "instances_token_key" ON "instances"("token");

-- CreateIndex
CREATE UNIQUE INDEX "instances_public_key_key" ON "instances"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "instance_guilds_application_id_guild_id_key" ON "instance_guilds"("application_id", "guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "guild_configs_application_id_guild_id_key" ON "guild_configs"("application_id", "guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_feeds_application_id_guild_id_channel_id_key" ON "suggestion_feeds"("application_id", "guild_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "suggestions_application_id_feed_channel_id_public_id_key" ON "suggestions"("application_id", "feed_channel_id", "public_id");

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_subscriptions_suggestion_id_user_id_key" ON "suggestion_subscriptions"("suggestion_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "global_blocks_entity_id_kind_key" ON "global_blocks"("entity_id", "kind");

-- AddForeignKey
ALTER TABLE "instance_guilds" ADD CONSTRAINT "instance_guilds_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "instances"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_configs" ADD CONSTRAINT "guild_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "instances"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_feeds" ADD CONSTRAINT "suggestion_feeds_application_id_guild_id_fkey" FOREIGN KEY ("application_id", "guild_id") REFERENCES "guild_configs"("application_id", "guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_feed_channel_id_application_id_guild_id_fkey" FOREIGN KEY ("feed_channel_id", "application_id", "guild_id") REFERENCES "suggestion_feeds"("channel_id", "application_id", "guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_comments" ADD CONSTRAINT "suggestion_comments_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_votes" ADD CONSTRAINT "suggestion_votes_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion_subscriptions" ADD CONSTRAINT "suggestion_subscriptions_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION set_suggestion_id_fn()
RETURNS trigger
LANGUAGE PLPGSQL
AS $$
  BEGIN
    UPDATE suggestion_feeds
    SET last_suggestion_id = last_suggestion_id + 1
    WHERE
      channel_id = NEW.feed_channel_id
      AND application_id = NEW.application_id
      AND guild_id = NEW.guild_id
    RETURNING last_suggestion_id INTO NEW.public_id;
    RETURN NEW;
  END;
$$;

--

CREATE OR REPLACE TRIGGER set_suggestion_id
BEFORE INSERT ON suggestions
FOR EACH ROW
EXECUTE PROCEDURE set_suggestion_id_fn();

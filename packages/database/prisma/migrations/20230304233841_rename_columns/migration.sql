-- AlterTable
ALTER TABLE "guild_configs" ALTER COLUMN "admin_roles" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "staff_roles" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "suggestion_feeds"
RENAME COLUMN "ping_role" TO "review_ping_role";

-- AlterTable
ALTER TABLE "suggestion_feeds"
RENAME COLUMN "archive_channel_id" TO "implemented_channel_id";

-- AlterTable
ALTER TABLE "suggestion_feeds"
RENAME COLUMN "only_anonymous" TO "allow_anonymous";

-- AlterTable
ALTER TABLE "suggestion_feeds"
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "upvote_emoji" SET NOT NULL,
ALTER COLUMN "upvote_emoji" SET DEFAULT '👍',
ALTER COLUMN "mid_emoji" SET NOT NULL,
ALTER COLUMN "mid_emoji" SET DEFAULT '🤷',
ALTER COLUMN "downvote_emoji" SET NOT NULL,
ALTER COLUMN "downvote_emoji" SET DEFAULT '👎';

-- AlterTable
ALTER TABLE "suggestion_feeds" ADD COLUMN     "show_vote_count" BOOLEAN NOT NULL DEFAULT true;

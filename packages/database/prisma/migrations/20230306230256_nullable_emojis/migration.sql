-- AlterTable
ALTER TABLE "suggestion_feeds" ALTER COLUMN "upvote_emoji" DROP NOT NULL,
ALTER COLUMN "mid_emoji" DROP NOT NULL,
ALTER COLUMN "downvote_emoji" DROP NOT NULL;

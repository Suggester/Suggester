BEGIN;
ALTER TYPE "global_block_kind" RENAME VALUE 'USER' TO 'User';
ALTER TYPE "global_block_kind" RENAME VALUE 'GUILD' TO 'Guild';

ALTER TYPE "suggestion_approval_status" RENAME VALUE 'APPROVED' TO 'Approved';
ALTER TYPE "suggestion_approval_status" RENAME VALUE 'IN_QUEUE' TO 'InQueue';
ALTER TYPE "suggestion_approval_status" RENAME VALUE 'DENIED' TO 'Denied';

ALTER TYPE "suggestion_display_status" RENAME VALUE 'DEFAULT' TO 'Default';
ALTER TYPE "suggestion_display_status" RENAME VALUE 'IMPLEMENTED' TO 'Implemented';
ALTER TYPE "suggestion_display_status" RENAME VALUE 'CONSIDERING' TO 'Considering';
ALTER TYPE "suggestion_display_status" RENAME VALUE 'IN_PROGRESS' TO 'InProgress';
ALTER TYPE "suggestion_display_status" RENAME VALUE 'NOT_HAPPENING' TO 'NotHappening';

ALTER TYPE "suggestion_feed_mode" RENAME VALUE 'AUTOAPPROVE' TO 'AutoApprove';
ALTER TYPE "suggestion_feed_mode" RENAME VALUE 'REVIEW' TO 'Review';

ALTER TYPE "suggestion_vote_kind" RENAME VALUE 'UPVOTE' TO 'Upvote';
ALTER TYPE "suggestion_vote_kind" RENAME VALUE 'MID' TO 'Mid';
ALTER TYPE "suggestion_vote_kind" RENAME VALUE 'DOWNVOTE' TO 'Downvote';
COMMIT;

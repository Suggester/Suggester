/*
  Warnings:

  - Made the column `name` on table `suggestion_feeds` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "suggestion_feeds" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT E'Server Suggestions';

CREATE UNIQUE INDEX
ON suggestion_feeds (is_default)
WHERE is_default = TRUE;

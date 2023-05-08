-- CreateTable
CREATE TABLE "suggestion_attachments" (
    "id" SERIAL NOT NULL,
    "suggestion_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "s3_key" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Attachment',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestion_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "suggestion_attachments" ADD CONSTRAINT "suggestion_attachments_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

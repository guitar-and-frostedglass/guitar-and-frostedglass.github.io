-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "status" "NoteStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateTable
CREATE TABLE "note_edit_history" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "edited_by_id" TEXT NOT NULL,
    "edited_by_name" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_edit_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reply_edit_history" (
    "id" TEXT NOT NULL,
    "reply_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "edited_by_id" TEXT NOT NULL,
    "edited_by_name" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_edit_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "note_edit_history" ADD CONSTRAINT "note_edit_history_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply_edit_history" ADD CONSTRAINT "reply_edit_history_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

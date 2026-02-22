-- CreateTable
CREATE TABLE "deleted_notes" (
    "id" TEXT NOT NULL,
    "original_note_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "note_user_id" TEXT NOT NULL,
    "note_user_name" TEXT NOT NULL,
    "replies" JSONB NOT NULL DEFAULT '[]',
    "deleted_by_id" TEXT NOT NULL,
    "deleted_by_name" TEXT NOT NULL,
    "note_created_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_notes_pkey" PRIMARY KEY ("id")
);

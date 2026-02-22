-- CreateTable
CREATE TABLE "deleted_replies" (
    "id" TEXT NOT NULL,
    "original_reply_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "note_title" TEXT NOT NULL DEFAULT '',
    "reply_user_id" TEXT NOT NULL,
    "reply_user_name" TEXT NOT NULL,
    "deleted_by_id" TEXT NOT NULL,
    "deleted_by_name" TEXT NOT NULL,
    "reply_created_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_replies_pkey" PRIMARY KEY ("id")
);

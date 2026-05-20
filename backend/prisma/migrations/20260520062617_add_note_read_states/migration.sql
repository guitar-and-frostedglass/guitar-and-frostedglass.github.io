-- CreateTable
CREATE TABLE "note_read_states" (
    "user_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_read_states_pkey" PRIMARY KEY ("user_id","note_id")
);

-- AddForeignKey
ALTER TABLE "note_read_states" ADD CONSTRAINT "note_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_read_states" ADD CONSTRAINT "note_read_states_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

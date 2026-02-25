-- AlterTable
ALTER TABLE "replies" ADD COLUMN     "reply_to_id" TEXT;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "NoteLayer" AS ENUM ('SURFACE', 'HIDDEN');

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "layer" "NoteLayer" NOT NULL DEFAULT 'SURFACE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "secondary_pin_hash" TEXT;

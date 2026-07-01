-- Rename image (single TEXT) to images (TEXT array) and add missing rich-content columns.
-- The original project migration created `image TEXT NOT NULL`; the schema was later
-- updated to `images String[]` plus body/budget/objectives but no migration was generated.

ALTER TABLE "projects" DROP COLUMN "image";
ALTER TABLE "projects" ADD COLUMN "images" TEXT[] DEFAULT '{}';
ALTER TABLE "projects" ADD COLUMN "body" TEXT;
ALTER TABLE "projects" ADD COLUMN "budget" TEXT;
ALTER TABLE "projects" ADD COLUMN "objectives" TEXT[] DEFAULT '{}';

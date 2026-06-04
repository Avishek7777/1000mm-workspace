import { defineConfig } from "prisma/config";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env") });

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma/schema.prisma"),
  seed: path.join(__dirname, "prisma/seed.ts"),
});

import type { Config } from "drizzle-kit";

// `npx drizzle-kit generate` writes SQL migrations to drizzle/ after a schema change.
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "expo",
} satisfies Config;

import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";

const betterAuthApiKey = process.env.BETTER_AUTH_API_KEY;

if (!betterAuthApiKey) {
  console.warn("BETTER_AUTH_API_KEY is not set. Better Auth dashboard plugin may be unavailable.");
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "change-me-in-production",
  plugins: [
    dash(),
  ],
});

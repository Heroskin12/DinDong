import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["development", "production", "test"]),
});

const parsed = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
});

export const config = {
  apiUrl: parsed.NEXT_PUBLIC_API_URL,
  environment: parsed.NEXT_PUBLIC_ENVIRONMENT,
};

"use server";
import { cookies } from "next/headers";
import { BLUESKY_COOKIE_PREFIX } from "@repo/auth";
import { z } from "zod";
import { env } from "../../env";

const KindSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const AnnotationSchema = z.object({
  type: z.string(),
});

const ParameterSchema = z.object({
  annotation: AnnotationSchema.optional(),
  convert_device_names: z.boolean().optional(),
  description: z.string().optional(),
  kind: KindSchema,
  name: z.string(),
  default: z.any().optional(),
  eval_expressions: z.boolean().optional(),
});

const PropertiesSchema = z.object({
  is_generator: z.boolean(),
});

const PlanSchema = z.object({
  description: z.string(),
  module: z.string(),
  name: z.string(),
  parameters: z.array(ParameterSchema),
  properties: PropertiesSchema,
});

const ApiResponseSchema = z.object({
  success: z.boolean(),
  msg: z.string(),
  plans_allowed_uid: z.string(),
  plans_allowed: z.record(PlanSchema),
});

export async function get() {
  const cookieStore = cookies();
  const blueskyToken = cookieStore.get(`${BLUESKY_COOKIE_PREFIX}access_token`);
  if (!blueskyToken) {
    throw new Error("No bluesky token found");
  }
  const response = await fetch(
    `${env.BLUESKY_HTTPSERVER_URL}/api/plans/allowed`,
    {
      headers: {
        Authorization: `Bearer ${blueskyToken.value}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch allowed plans");
  }
  const parsed = ApiResponseSchema.parse(await response.json());
  if (!parsed.success) {
    throw new Error(parsed.msg);
  }
  return parsed;
}

export async function getNames() {
  const parsed = await get();
  const names = Object.values(parsed.plans_allowed).map((plan) => plan.name);
  return names;
}

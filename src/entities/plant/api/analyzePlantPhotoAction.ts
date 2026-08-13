"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { createClient } from "@/shared/api/supabase/server";
import type { PlantAnalysis } from "../model/types";

// Free-tier model; gemini-2.5-flash and gemini-2.5-flash-lite are no
// longer available to this project (confirmed via a live API call, not
// docs), so this is the current mainline Flash model instead.
const MODEL = "gemini-3.5-flash";

const ANALYSIS_PROMPT = `You are identifying a garden plant from a photo.

Give your best single guess even if you are not fully sure. Respond with a
JSON object matching the required schema:
- scientific_name: the Latin binomial name, your single best guess
- confidence: your own honest self-assessment of this identification -
  "low", "medium", or "high". Never claim "high" unless the photo makes the
  species genuinely unambiguous.
- common_name: the common name of the plant, written separately in
  Romanian (ro), English (en), and Russian (ru)
- description: a short 1-2 sentence description of the plant, written
  separately in ro/en/ru
- care: short care advice covering watering, light, and common issues,
  written separately in ro/en/ru

Write all three languages yourself in one response.`;

const localizedResponseSchema = {
  type: Type.OBJECT,
  properties: {
    ro: { type: Type.STRING },
    en: { type: Type.STRING },
    ru: { type: Type.STRING },
  },
  required: ["ro", "en", "ru"],
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scientific_name: { type: Type.STRING },
    confidence: { type: Type.STRING, enum: ["low", "medium", "high"] },
    common_name: localizedResponseSchema,
    description: localizedResponseSchema,
    care: localizedResponseSchema,
  },
  required: ["scientific_name", "confidence", "common_name", "description", "care"],
};

const localizedSchema = z.object({ ro: z.string(), en: z.string(), ru: z.string() });

const analysisSchema = z.object({
  scientific_name: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  common_name: localizedSchema,
  description: localizedSchema,
  care: localizedSchema,
}) satisfies z.ZodType<PlantAnalysis>;

export type AnalyzePlantPhotoResult =
  | { ok: true; analysis: PlantAnalysis; analyzedAt: string }
  | {
      ok: false;
      error: "not_authenticated" | "no_photo" | "not_configured" | "request_failed" | "invalid_response" | "save_failed";
    };

// Best-effort: every failure path returns a typed error instead of
// throwing, so a bad analysis never corrupts the plant's existing state.
export async function analyzePlantPhoto(plantId: string): Promise<AnalyzePlantPhotoResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  // Look up the photo URL ourselves (RLS-scoped to the caller's own plants)
  // instead of trusting a client-supplied URL as a server-side fetch target.
  const { data: plant } = await supabase.from("garden_plants").select("photo_url").eq("id", plantId).maybeSingle();
  if (!plant?.photo_url) return { ok: false, error: "no_photo" };

  let base64Image: string;
  let mimeType: string;
  try {
    const photoResponse = await fetch(plant.photo_url);
    if (!photoResponse.ok) throw new Error("photo fetch failed");
    mimeType = photoResponse.headers.get("content-type") ?? "image/jpeg";
    base64Image = Buffer.from(await photoResponse.arrayBuffer()).toString("base64");
  } catch {
    return { ok: false, error: "request_failed" };
  }

  let rawText: string | undefined;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          parts: [{ text: ANALYSIS_PROMPT }, { inlineData: { data: base64Image, mimeType } }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });
    rawText = response.text;
  } catch {
    return { ok: false, error: "request_failed" };
  }

  if (!rawText) return { ok: false, error: "invalid_response" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, error: "invalid_response" };
  }

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) return { ok: false, error: "invalid_response" };

  const analyzedAt = new Date().toISOString();
  const { error: dbError } = await supabase
    .from("garden_plants")
    .update({ analysis: result.data, analyzed_at: analyzedAt })
    .eq("id", plantId);
  if (dbError) return { ok: false, error: "save_failed" };

  return { ok: true, analysis: result.data, analyzedAt };
}

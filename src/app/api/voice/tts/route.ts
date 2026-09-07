import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, isDeepgramConfigured } from "@/lib/deepgram";
import { checkRateLimit, sanitizeTextInput } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Protection (40 req/min)
  const rateLimit = checkRateLimit(req, 40, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many speech synthesis requests. Please retry in ${rateLimit.resetInSec}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSec) } }
    );
  }

  try {
    const body = await req.json();
    const { text, voice = "aura-asteria-en" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    // 2. Sanitize Text Input
    const cleanText = sanitizeTextInput(text, 2000);

    if (!isDeepgramConfigured) {
      return NextResponse.json({
        warning: "Deepgram API key not configured. Speech synthesis requires DEEPGRAM_API_KEY.",
        isSimulated: true,
        text: cleanText,
      }, { status: 200 });
    }

    const { audioBuffer, contentType } = await synthesizeSpeech(cleanText, voice);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "X-Voice-Provider": "Deepgram Aura (TTS)",
      },
    });
  } catch (error: any) {
    console.warn("TTS Route Warning (Falling back to simulated speech):", error.message);
    return NextResponse.json({
      warning: error.message || "Deepgram Aura speech synthesis unavailable. Displaying text response.",
      isSimulated: true,
      text: "",
    }, { status: 200 });
  }
}

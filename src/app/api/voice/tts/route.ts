import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, isDeepgramConfigured } from "@/lib/deepgram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice = "aura-asteria-en" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    if (!isDeepgramConfigured) {
      return NextResponse.json({
        warning: "Deepgram API key not configured. Speech synthesis requires DEEPGRAM_API_KEY.",
        isSimulated: true,
        text,
      }, { status: 200 });
    }

    const { audioBuffer, contentType } = await synthesizeSpeech(text, voice);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "X-Voice-Provider": "Deepgram Aura (TTS)",
      },
    });
  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synthesize speech via Deepgram Aura" },
      { status: 500 }
    );
  }
}

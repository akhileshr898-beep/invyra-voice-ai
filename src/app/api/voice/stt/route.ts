import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, isDeepgramConfigured } from "@/lib/deepgram";
import { checkRateLimit, validateAudioUpload } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Protection (30 req/min)
  const rateLimit = checkRateLimit(req, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many audio transcription requests. Please retry in ${rateLimit.resetInSec}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSec) } }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let audioBuffer: Buffer;
    let mimeType = "audio/webm";
    let language = req.nextUrl.searchParams.get("lang") || "en";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No audio file provided in form data" }, { status: 400 });
      }
      const arrayBuf = await file.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuf);
      mimeType = file.type || "audio/webm";
      const formLang = formData.get("language") as string | null;
      if (formLang) language = formLang;
    } else {
      const arrayBuf = await req.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuf);
      mimeType = contentType || "audio/webm";
    }

    // 2. Audio Payload Validation (Size limit & MIME check)
    const validation = validateAudioUpload(audioBuffer, mimeType, 10 * 1024 * 1024);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (!isDeepgramConfigured) {
      return NextResponse.json({
        text: "",
        warning: "Deepgram API key not configured. Please add DEEPGRAM_API_KEY to your environment variables or Settings.",
        isSimulated: true,
      }, { status: 200 });
    }

    const result = await transcribeAudio(audioBuffer, mimeType, language);

    return NextResponse.json({
      text: result.text,
      confidence: result.confidence,
      detectedLanguage: result.detectedLanguage,
      provider: "Deepgram Nova-2 (STT)",
    });
  } catch (error: any) {
    console.error("STT Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio via Deepgram Nova-2" },
      { status: 500 }
    );
  }
}

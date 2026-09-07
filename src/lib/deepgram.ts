import { createClient } from "@deepgram/sdk";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";

export const isDeepgramConfigured = Boolean(
  DEEPGRAM_API_KEY && 
  !DEEPGRAM_API_KEY.includes("your-deepgram-api-key")
);

function getDeepgramClient() {
  if (!isDeepgramConfigured) return null;
  return createClient(DEEPGRAM_API_KEY);
}

/**
 * Transcribes audio buffer using Deepgram Nova-2 (STT)
 * Supports English (en), Hindi (hi), or multi-lingual auto-detection
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string = "audio/webm",
  language?: string
): Promise<{ text: string; confidence: number; detectedLanguage?: string }> {
  if (!isDeepgramConfigured) {
    throw new Error("Deepgram API Key is not configured in environment variables (DEEPGRAM_API_KEY).");
  }

  const dg = getDeepgramClient();
  if (!dg) throw new Error("Could not initialize Deepgram client.");

  const isHindi = language === "hi" || language === "hindi";
  const options: Record<string, any> = {
    model: "nova-2",
    smart_format: true,
    punctuate: true,
    mimetype: mimeType,
  };

  if (isHindi) {
    options.language = "hi";
  } else if (language && language !== "auto") {
    options.language = language;
  } else {
    options.language = "en";
  }

  const { result, error } = await dg.listen.prerecorded.transcribeFile(buffer, options);

  if (error) {
    throw new Error(`Deepgram transcription error: ${error.message || JSON.stringify(error)}`);
  }

  const channel = result?.results?.channels?.[0];
  const alt = channel?.alternatives?.[0];
  const text = alt?.transcript?.trim() || "";
  const confidence = alt?.confidence || 0.9;
  const detectedLanguage = (result?.results as any)?.channels?.[0]?.detected_language || options.language;

  return {
    text,
    confidence,
    detectedLanguage,
  };
}

/**
 * Synthesizes text to speech using Deepgram Aura (TTS)
 * Strictly does NOT use browser speech APIs.
 * Returns MP3 audio buffer.
 */
export async function synthesizeSpeech(
  text: string,
  model: string = "aura-asteria-en"
): Promise<{ audioBuffer: ArrayBuffer; contentType: string }> {
  if (!isDeepgramConfigured) {
    throw new Error("Deepgram API Key is not configured in environment variables (DEEPGRAM_API_KEY).");
  }

  const sanitizedText = text.replace(/[\*\#\`\_]/g, "").trim();
  if (!sanitizedText) {
    throw new Error("Cannot synthesize empty text.");
  }

  const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: sanitizedText }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Deepgram TTS failed (${res.status}): ${errText}`);
  }

  const audioBuffer = await res.arrayBuffer();
  return {
    audioBuffer,
    contentType: res.headers.get("content-type") || "audio/mpeg",
  };
}

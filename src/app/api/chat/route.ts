import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { runGeminiConversationTurn } from "@/lib/gemini";
import { Business, Workflow, TranscriptMessage } from "@/lib/types";
import { checkRateLimit, sanitizeTextInput, detectPromptInjection } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Protection (40 req/min)
  const rateLimit = checkRateLimit(req, 40, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please slow down. Retry in ${rateLimit.resetInSec}s.` },
      { 
        status: 429, 
        headers: { "Retry-After": String(rateLimit.resetInSec) } 
      }
    );
  }

  try {
    const body = await req.json();
    const {
      businessId,
      workflowId,
      transcript = [],
      latestUserMessage,
      callerPhone = "+1 (555) 234-5678",
      callerName = "Valued Caller",
    } = body;

    if (!latestUserMessage || typeof latestUserMessage !== "string") {
      return NextResponse.json({ error: "Missing or invalid latestUserMessage" }, { status: 400 });
    }

    // 2. Input Sanitization
    const cleanUserMessage = sanitizeTextInput(latestUserMessage, 1500);
    const cleanCallerName = sanitizeTextInput(callerName, 100) || "Valued Caller";
    const cleanCallerPhone = sanitizeTextInput(callerPhone, 30) || "+1 (555) 234-5678";

    // 3. Prompt Injection / Jailbreak Guardrail
    const injectionCheck = detectPromptInjection(cleanUserMessage);
    if (injectionCheck.isSuspicious) {
      return NextResponse.json({
        replyText: "I am an automated assistant dedicated to assisting you with your appointment or service enquiry. How can I assist you with scheduling or orders today?",
        toolCallsExecuted: [],
        extractedData: {},
        detectedIntent: "Security guardrail triggered",
        summary: "Potential prompt override attempt blocked by system safety guardrails.",
        urgency: "normal",
        actionPerformed: "Security guardrail active",
        isComplete: false,
        language: "en",
      });
    }

    const business: Business | null = businessId 
      ? await db.getBusinessById(businessId)
      : (await db.getBusinesses())[0];

    const workflow: Workflow | null = workflowId
      ? await db.getWorkflowById(workflowId)
      : (await db.getWorkflows(business?.id))[0];

    if (!business || !workflow) {
      return NextResponse.json({ error: "Business or Workflow not found" }, { status: 404 });
    }

    const conversationResult = await runGeminiConversationTurn({
      business,
      workflow,
      transcript: transcript as TranscriptMessage[],
      latestUserMessage: cleanUserMessage,
      callerPhone: cleanCallerPhone,
      callerName: cleanCallerName,
    });

    let savedRecordId: string | undefined;
    if (conversationResult.isComplete) {
      const fullTranscript: TranscriptMessage[] = [
        ...transcript,
        {
          role: "user",
          message: cleanUserMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
        {
          role: "assistant",
          message: conversationResult.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
      ];

      const record = await db.createConversation({
        business_id: business.id,
        workflow_id: workflow.id,
        business_name: business.name,
        workflow_name: workflow.name,
        caller_name: cleanCallerName,
        caller_phone: cleanCallerPhone,
        status: "completed",
        intent: conversationResult.detectedIntent,
        collected_data: conversationResult.extractedData,
        summary: conversationResult.summary,
        action_performed: conversationResult.actionPerformed,
        priority: conversationResult.urgency,
        follow_up_status: conversationResult.urgency === "urgent" ? "pending" : "contacted",
        transcript: fullTranscript,
        language: conversationResult.language,
      });
      savedRecordId = record.id;
    }

    return NextResponse.json({
      replyText: conversationResult.replyText,
      toolCallsExecuted: conversationResult.toolCallsExecuted,
      extractedData: conversationResult.extractedData,
      detectedIntent: conversationResult.detectedIntent,
      summary: conversationResult.summary,
      urgency: conversationResult.urgency,
      actionPerformed: conversationResult.actionPerformed,
      isComplete: conversationResult.isComplete,
      language: conversationResult.language,
      savedRecordId,
    });
  } catch (error: any) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat turn" },
      { status: 500 }
    );
  }
}

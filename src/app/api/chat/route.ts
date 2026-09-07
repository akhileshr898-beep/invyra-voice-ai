import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { runGeminiConversationTurn } from "@/lib/gemini";
import { Business, Workflow, TranscriptMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    if (!latestUserMessage) {
      return NextResponse.json({ error: "Missing latestUserMessage" }, { status: 400 });
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
      latestUserMessage,
      callerPhone,
      callerName,
    });

    let savedRecordId: string | undefined;
    if (conversationResult.isComplete) {
      const fullTranscript: TranscriptMessage[] = [
        ...transcript,
        {
          role: "user",
          message: latestUserMessage,
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
        caller_name: callerName,
        caller_phone: callerPhone,
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

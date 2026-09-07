import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const userBusinesses = await db.getBusinesses(session.userId);
    const userBusinessIds = userBusinesses.map((b) => b.id);

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId") || undefined;

    if (businessId) {
      if (!userBusinessIds.includes(businessId)) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view workflows for this business." },
          { status: 403 }
        );
      }
      const workflows = await db.getWorkflows(businessId);
      return NextResponse.json({ workflows });
    }

    // If no businessId specified, return workflows across user's businesses
    const workflowLists = await Promise.all(userBusinessIds.map((bId) => db.getWorkflows(bId)));
    const workflows = workflowLists.flat();
    return NextResponse.json({ workflows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const userBusinesses = await db.getBusinesses(session.userId);
    const userBusinessIds = userBusinesses.map((b) => b.id);

    if (userBusinessIds.length === 0) {
      return NextResponse.json(
        { error: "Please complete business onboarding before creating workflows." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const targetBusinessId = body.business_id || userBusinessIds[0];

    if (!userBusinessIds.includes(targetBusinessId)) {
      return NextResponse.json(
        { error: "Forbidden: You cannot create a workflow for a business you do not own." },
        { status: 403 }
      );
    }

    const created = await db.createWorkflow({
      ...body,
      business_id: targetBusinessId,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const userBusinesses = await db.getBusinesses(session.userId);
    const userBusinessIds = userBusinesses.map((b) => b.id);

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing workflow ID" }, { status: 400 });
    }

    // Verify the workflow exists and belongs to user's business
    const existing = await db.getWorkflowById(id);
    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (!userBusinessIds.includes(existing.business_id)) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify workflows for a business you do not own." },
        { status: 403 }
      );
    }

    const updated = await db.updateWorkflow(id, updates, existing.business_id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const userBusinesses = await db.getBusinesses(session.userId);
    const userBusinessIds = userBusinesses.map((b) => b.id);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing workflow ID" }, { status: 400 });

    const existing = await db.getWorkflowById(id);
    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (!userBusinessIds.includes(existing.business_id)) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete workflows for a business you do not own." },
        { status: 403 }
      );
    }

    const success = await db.deleteWorkflow(id, existing.business_id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

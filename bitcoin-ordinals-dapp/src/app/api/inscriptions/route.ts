/**
 * API Route for Inscriptions
 * 
 * Handles saving and retrieving inscription records
 */

import { NextRequest, NextResponse } from "next/server";
import {
  saveInscription,
  getInscriptionByTxid,
  getInscriptionsByRecipient,
  updateInscriptionStatus,
} from "@/lib/db/db";

/**
 * POST /api/inscriptions
 * Save a new inscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const inscription = await saveInscription({
      txid: body.txid,
      recipient_address: body.recipient_address,
      content_type: body.content_type,
      content_size: body.content_size,
      fee_rate: body.fee_rate,
      fee_paid: body.fee_paid,
      network: body.network || "mainnet",
    });

    return NextResponse.json({ success: true, data: inscription }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to save inscription:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save inscription" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inscriptions?txid=... or ?recipient=...
 * Get inscription(s)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const txid = searchParams.get("txid");
    const recipient = searchParams.get("recipient");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (txid) {
      const inscription = await getInscriptionByTxid(txid);
      if (!inscription) {
        return NextResponse.json(
          { success: false, error: "Inscription not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: inscription });
    }

    if (recipient) {
      const inscriptions = await getInscriptionsByRecipient(recipient, limit);
      return NextResponse.json({ success: true, data: inscriptions });
    }

    return NextResponse.json(
      { success: false, error: "Must provide txid or recipient parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Failed to get inscription:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get inscription" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/inscriptions
 * Update inscription status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.txid || !body.status) {
      return NextResponse.json(
        { success: false, error: "txid and status are required" },
        { status: 400 }
      );
    }

    const inscription = await updateInscriptionStatus(
      body.txid,
      body.status,
      body.block_height
    );

    if (!inscription) {
      return NextResponse.json(
        { success: false, error: "Inscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: inscription });
  } catch (error: any) {
    console.error("Failed to update inscription:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update inscription" },
      { status: 500 }
    );
  }
}


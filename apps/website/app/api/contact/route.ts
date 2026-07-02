// apps/website/app/api/contact/route.ts
//
// Saves contact form submissions to the ContactMessage table.
// Follows the same shape as apps/website/app/api/trainer-application/route.ts.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@1000mm/db";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fullName = String(body.name ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone ?? "").trim() || null;
    const message = String(body.message ?? "").trim();

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      null;

    await prisma.contactMessage.create({
      data: {
        fullName,
        email,
        phone,
        message,
        ipAddress,
      },
    });

    // ── Notify SA (wire to Resend when email is ready) ───────────────────────
    console.log(`[DEV EMAIL] New contact message from ${fullName} <${email}>`);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[contact POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

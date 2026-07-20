import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { saveUploadedFile } from "@/lib/uploadFile";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) ?? "misc";
  const fileName = (formData.get("fileName") as string | null)?.trim() || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await saveUploadedFile(file, folder, fileName, MAX_BYTES);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { ok: _ok, ...body } = result;
  return NextResponse.json(body);
}

import { NextResponse } from "next/server";

import { persistEcomlabsOutput } from "@/lib/ai/persistence";
import { getTenantContext } from "@/lib/tenant/runtime";

export async function POST(request: Request) {
  const formData = await request.formData();
  const { organization, user } = await getTenantContext();
  await persistEcomlabsOutput({
    organizationId: organization.id,
    user,
    toolKey: String(formData.get("tool_key") ?? ""),
    title: String(formData.get("title") ?? "EcomLabs Output"),
    inputPayload: JSON.parse(String(formData.get("input_payload") ?? "{}")) as Record<string, unknown>,
    outputPayload: JSON.parse(String(formData.get("output_payload") ?? "{}")) as Record<string, unknown>
  });
  return NextResponse.json({ ok: true });
}

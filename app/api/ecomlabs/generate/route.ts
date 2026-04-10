import { NextResponse } from "next/server";
import { z } from "zod";

import { generateEcomLabsOutput } from "@/lib/ai/ecomlabs-engine";

const requestSchema = z.object({
  toolKey: z.string().min(1),
  productName: z.string().min(2),
  productContext: z.string().min(5),
  targetAudience: z.string().optional(),
  angle: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const result = await generateEcomLabsOutput(parsed.data);

  return NextResponse.json({
    ok: true,
    result
  });
}

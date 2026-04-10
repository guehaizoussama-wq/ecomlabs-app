import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toLooseSupabase } from "@/lib/supabase/loose";
import type { AuthUser } from "@/types/auth";

export async function persistEcomlabsOutput({
  organizationId,
  user,
  toolKey,
  title,
  inputPayload,
  outputPayload
}: {
  organizationId: string;
  user: AuthUser;
  toolKey: string;
  title: string;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
}) {
  const supabase = toLooseSupabase(await createSupabaseServerClient());
  const { data: promptHistory, error } = await supabase
    .from("prompt_history")
    .insert({
      organization_id: organizationId,
      user_id: user.id,
      tool_key: toolKey,
      input_payload: inputPayload,
      output_payload: outputPayload
    })
    .select("id")
    .single();

  if (error || !promptHistory) {
    throw new Error(error?.message ?? "Failed to save prompt history");
  }

  const { data: generatedOutput, error: generatedError } = await supabase
    .from("generated_outputs")
    .insert({
      organization_id: organizationId,
      prompt_history_id: promptHistory.id,
      output_type: toolKey,
      title,
      payload: outputPayload
    })
    .select("id")
    .single();

  if (generatedError || !generatedOutput) {
    throw new Error(generatedError?.message ?? "Failed to save generated output");
  }

  const { error: savedError } = await supabase.from("saved_outputs").insert({
    organization_id: organizationId,
    generated_output_id: generatedOutput.id,
    title
  });

  if (savedError) {
    throw new Error(savedError.message);
  }

  return generatedOutput.id as string;
}

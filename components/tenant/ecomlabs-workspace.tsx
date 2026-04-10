"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ecomLabsTools } from "@/modules/ecomlabs/tool-registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function prettyValue(value: unknown) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value, null, 2);
  }

  return String(value ?? "");
}

export function EcomlabsWorkspace({
  initialHistory,
  savedOutputs,
  generatedOutputs
}: {
  initialHistory: Record<string, unknown>[];
  savedOutputs: Record<string, unknown>[];
  generatedOutputs: Record<string, unknown>[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toolKey, setToolKey] = useState(ecomLabsTools[0]?.key ?? "hook-generator");
  const [productName, setProductName] = useState("");
  const [productContext, setProductContext] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [angle, setAngle] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<string | null>(null);

  const selectedTool = ecomLabsTools.find((tool) => tool.key === toolKey) ?? ecomLabsTools[0];

  async function runGenerator() {
    setError(null);
    setSaveState(null);
    startTransition(async () => {
      const response = await fetch("/api/ecomlabs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolKey,
          productName,
          productContext,
          targetAudience,
          angle
        })
      });

      const data = (await response.json()) as { ok: boolean; result?: Record<string, unknown>; error?: unknown };
      if (!data.ok || !data.result) {
        setError("Generation failed. Please review the input and try again.");
        return;
      }

      setResult(data.result);
    });
  }

  async function saveResult() {
    if (!result) {
      return;
    }

    setSaveState("Saving...");
    const formData = new FormData();
    formData.set("tool_key", toolKey);
    formData.set("title", `${selectedTool.label} - ${productName}`);
    formData.set(
      "input_payload",
      JSON.stringify({
        toolKey,
        productName,
        productContext,
        targetAudience,
        angle
      })
    );
    formData.set("output_payload", JSON.stringify(result));

    const response = await fetch("/api/ecomlabs/save", {
      method: "POST",
      body: formData
    });

    setSaveState(response.ok ? "Saved to history." : "Save failed.");
    router.refresh();
  }

  async function copyResult() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setSaveState("Copied result.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>EcomLabs Tools</CardTitle>
          <CardDescription>Use the extracted legacy prompt structures through the native SaaS workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Tool</span>
            <Select value={toolKey} onChange={(event) => setToolKey(event.target.value)}>
              {ecomLabsTools.map((tool) => (
                <option key={tool.key} value={tool.key}>
                  {tool.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Product name</span>
            <Input value={productName} onChange={(event) => setProductName(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Product context</span>
            <Textarea value={productContext} onChange={(event) => setProductContext(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Target audience</span>
            <Input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Angle</span>
            <Input value={angle} onChange={(event) => setAngle(event.target.value)} />
          </label>
          <div className="rounded-2xl bg-secondary p-4 text-sm">
            <div className="font-medium">{selectedTool.label}</div>
            <div className="mt-1 text-muted-foreground">{selectedTool.description}</div>
            <div className="mt-3 text-xs text-muted-foreground">
              Output shape: {selectedTool.outputShape.join(", ")}
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saveState ? <p className="text-sm text-muted-foreground">{saveState}</p> : null}
          <Button onClick={runGenerator} disabled={isPending || !productName || !productContext}>
            {isPending ? "Generating..." : "Generate"}
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{selectedTool.label}</CardTitle>
            <CardDescription>{selectedTool.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <>
                <div className="grid gap-4">
                  {Object.entries(result).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border p-4">
                      <div className="mb-2 text-sm font-medium capitalize">{key.replaceAll("_", " ")}</div>
                      <pre className="overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{prettyValue(value)}</pre>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={copyResult}>
                    Copy result
                  </Button>
                  <Button variant="outline" onClick={saveResult}>
                    Save output
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                Run a tool to see structured output here.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prompt History</CardTitle>
            <CardDescription>Saved prompt executions for the current tenant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {initialHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                No history yet.
              </div>
            ) : (
              initialHistory.slice(0, 8).map((entry) => (
                <div key={String(entry.id)} className="rounded-2xl bg-secondary p-4 text-sm">
                  <div className="font-medium">{String(entry.tool_key ?? "tool")}</div>
                  <div className="text-muted-foreground">{String(entry.created_at ?? "")}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saved Outputs</CardTitle>
            <CardDescription>Reusable assets saved from previous EcomLabs runs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedOutputs.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                No saved outputs yet.
              </div>
            ) : (
              savedOutputs.slice(0, 6).map((entry) => {
                const generated = (entry.generated_outputs as Record<string, unknown> | null) ?? null;
                return (
                  <div key={String(entry.id)} className="rounded-2xl border p-4">
                    <div className="font-medium">{String(entry.title ?? "Saved output")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{String(entry.created_at ?? "")}</div>
                    <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                      {prettyValue(generated?.payload ?? {})}
                    </pre>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {generatedOutputs.slice(0, 5).map((entry) => (
              <div key={String(entry.id)} className="rounded-2xl bg-secondary p-4 text-sm">
                <div className="font-medium">{String(entry.title ?? entry.output_type ?? "Generation")}</div>
                <div className="text-xs text-muted-foreground">{String(entry.created_at ?? "")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { saveEntityAction } from "@/modules/tenant/actions";
import { getEntityConfig } from "@/modules/tenant/entity-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type OptionRecord = {
  id?: string;
  name?: string;
  label?: string;
  full_name?: string;
  account_name?: string;
  order_number?: string;
};

function getOptionLabel(option: OptionRecord) {
  return (
    option.name ??
    option.label ??
    option.full_name ??
    option.account_name ??
    option.order_number ??
    option.id
  );
}

export function EntityForm({
  resourceKey,
  path,
  record,
  options
}: {
  resourceKey: string;
  path: string;
  record?: Record<string, unknown> | null;
  options?: Record<string, OptionRecord[]>;
}) {
  const config = getEntityConfig(resourceKey);
  if (!config) {
    return null;
  }

  const action = saveEntityAction.bind(null, resourceKey, path);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? `Edit ${config.singular}` : `Create ${config.singular}`}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          {record?.id ? <input type="hidden" name="id" value={String(record.id)} /> : null}
          {config.fields.map((field) => {
            const defaultValue = record?.[field.key];
            const fullWidth = field.type === "textarea";

            if (field.type === "textarea") {
              return (
                <label key={field.key} className={`space-y-2 ${fullWidth ? "md:col-span-2" : ""}`}>
                  <span className="text-sm font-medium">{field.label}</span>
                  <Textarea name={field.key} defaultValue={String(defaultValue ?? "")} placeholder={field.placeholder} />
                </label>
              );
            }

            if (field.type === "select") {
              return (
                <label key={field.key} className="space-y-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  <Select name={field.key} defaultValue={String(defaultValue ?? "")}>
                    <option value="">Select {field.label}</option>
                    {(options?.[field.key] ?? []).map((option) => (
                      <option key={String(option.id)} value={String(option.id)}>
                        {getOptionLabel(option)}
                      </option>
                    ))}
                  </Select>
                </label>
              );
            }

            if (field.type === "checkbox") {
              return (
                <label key={field.key} className="flex items-center gap-3 rounded-xl border p-3">
                  <Checkbox name={field.key} defaultChecked={Boolean(defaultValue)} />
                  <span className="text-sm font-medium">{field.label}</span>
                </label>
              );
            }

            return (
              <label key={field.key} className="space-y-2">
                <span className="text-sm font-medium">{field.label}</span>
                <Input
                  name={field.key}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                  defaultValue={String(defaultValue ?? "")}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </label>
            );
          })}
          <div className="md:col-span-2">
            <Button type="submit">{record ? "Save changes" : `Create ${config.singular}`}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

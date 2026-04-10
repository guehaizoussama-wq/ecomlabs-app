import Link from "next/link";

import { deleteEntityAction } from "@/modules/tenant/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EntityTable({
  title,
  description,
  path,
  resourceKey,
  records,
  columns,
  detailBasePath,
  allowDelete = true,
  allowOpen = true
}: {
  title: string;
  description: string;
  path: string;
  resourceKey: string;
  records: Record<string, unknown>[];
  columns: string[];
  detailBasePath: string;
  allowDelete?: boolean;
  allowOpen?: boolean;
}) {
  const hasActions = allowDelete || allowOpen;

  function renderValue(value: unknown) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
      return (
        <pre className="max-w-[18rem] overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return String(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
            No records yet. Create the first record from the form above.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column.replaceAll("_", " ")}</TableHead>
                ))}
                {hasActions ? <TableHead>Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={String(record.id)}>
                  {columns.map((column) => (
                    <TableCell key={column}>{renderValue(record[column])}</TableCell>
                  ))}
                  {hasActions ? (
                    <TableCell className="flex gap-2">
                      {allowOpen ? (
                        <Link className="text-sm font-medium text-primary" href={`${detailBasePath}/${record.id}` as Parameters<typeof Link>[0]["href"]}>
                          Open
                        </Link>
                      ) : null}
                      {allowDelete ? (
                        <form action={deleteEntityAction.bind(null, resourceKey, path, String(record.id))}>
                          <Button type="submit" variant="ghost" size="sm">
                            Delete
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

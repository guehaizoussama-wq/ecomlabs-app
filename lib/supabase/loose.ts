type QueryError = { message: string } | null;
type QueryListResult<TRecord extends Record<string, unknown>> = {
  data: TRecord[] | null;
  error: QueryError;
};
type QuerySingleResult<TRecord extends Record<string, unknown>> = {
  data: TRecord | null;
  error: QueryError;
};

export interface LooseQuery<TRecord extends Record<string, unknown>>
  extends PromiseLike<QueryListResult<TRecord>> {
  select(columns?: string): LooseQuery<TRecord>;
  insert(values: Record<string, unknown> | Record<string, unknown>[]): LooseQuery<TRecord>;
  update(values: Record<string, unknown>): LooseQuery<TRecord>;
  delete(): LooseQuery<TRecord>;
  eq(column: string, value: unknown): LooseQuery<TRecord>;
  is(column: string, value: unknown): LooseQuery<TRecord>;
  order(column: string, options?: { ascending?: boolean }): LooseQuery<TRecord>;
  limit(count: number): LooseQuery<TRecord>;
  upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: Record<string, unknown>): LooseQuery<TRecord>;
  single(): Promise<QuerySingleResult<TRecord>>;
  maybeSingle(): Promise<QuerySingleResult<TRecord>>;
}

export interface LooseSupabaseClient {
  from(table: string): LooseQuery<Record<string, unknown>>;
}

export function toLooseSupabase(client: unknown) {
  return client as LooseSupabaseClient;
}

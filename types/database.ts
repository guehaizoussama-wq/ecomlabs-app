export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type RowShape = Record<string, unknown>;
type TableShape = {
  Row: RowShape;
  Insert: RowShape;
  Update: RowShape;
  Relationships: never[];
};
type GenericTableMap = Record<string, TableShape>;

export type Database = {
  public: {
    Tables: GenericTableMap & {
      organizations: TableShape;
      subscriptions: TableShape;
      user_profiles: TableShape;
      roles: TableShape;
      permissions: TableShape;
      role_permissions: TableShape;
      wilayas: TableShape;
      communes: TableShape;
      delivery_partners: TableShape;
      prompt_history: TableShape;
      saved_outputs: TableShape;
      ai_tool_configs: TableShape;
      activity_logs: TableShape;
    };
    Views: Record<string, never>;
    Functions: {
      set_current_organization_id: {
        Args: { organization_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
};

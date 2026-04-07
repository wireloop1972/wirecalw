import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const logSyncStart = async (entityType: string): Promise<number> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("planday_sync_log")
    .insert({ entity_type: entityType, status: "running" })
    .select("id")
    .single();
  if (error) throw new Error(`Sync log insert failed: ${error.message}`);
  return data.id;
};

export const logSyncComplete = async (
  logId: number,
  recordsSynced: number,
): Promise<void> => {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("planday_sync_log")
    .update({
      completed_at: new Date().toISOString(),
      records_synced: recordsSynced,
      status: "success",
    })
    .eq("id", logId);
};

export const logSyncError = async (
  logId: number,
  errorMessage: string,
): Promise<void> => {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("planday_sync_log")
    .update({
      completed_at: new Date().toISOString(),
      status: "error",
      error_message: errorMessage,
    })
    .eq("id", logId);
};

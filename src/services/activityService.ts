import { invoke } from "@tauri-apps/api/core";
import type { ActivityEntry, CommandResult, ActivityStatus } from "@/types";

export async function loadActivity(): Promise<ActivityEntry[]> {
  return invoke<ActivityEntry[]>("load_activity");
}

export async function appendActivity(entry: ActivityEntry): Promise<void> {
  return invoke<void>("append_activity", { entry });
}

export async function clearActivity(): Promise<void> {
  return invoke<void>("clear_activity");
}

/** Create a new activity entry */
export function createActivityEntry(
  operation: string,
  command: string,
  args: string[],
  status: ActivityStatus,
  result?: CommandResult
): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    operation,
    command,
    args,
    result,
    status,
  };
}

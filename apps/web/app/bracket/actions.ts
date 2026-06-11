"use server";

import { revalidatePath } from "next/cache";
import { saveMyGroupPicks, type GroupPickInput } from "@/lib/api";

export type SaveGroupPicksResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export async function saveGroupPicksAction(
  input: GroupPickInput[],
): Promise<SaveGroupPicksResult> {
  const result = await saveMyGroupPicks(input);
  if (result.ok) {
    // Invalidate any cached views that depend on the user's picks
    revalidatePath("/bracket");
    revalidatePath("/standings");
  }
  return result;
}

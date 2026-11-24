import type { FeedbackEntry } from "@/lib/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const LOCAL_KEY = "morai:feedback:v1";

export async function submitFeedback(entry: Omit<FeedbackEntry, "id" | "createdAt">) {
  const full: FeedbackEntry = {
    ...entry,
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from("feedback").insert({
        tipo: full.tipo,
        nota: full.nota,
        mensagem: full.mensagem,
      });
      return full;
    }
  }

  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const current: FeedbackEntry[] = raw ? JSON.parse(raw) : [];
    current.unshift(full);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(current));
  }

  return full;
}

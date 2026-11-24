"use client";

import { createBrowserClient } from "@supabase/ssr";

let cached: ReturnType<typeof createBrowserClient> | null | undefined;

/**
 * Retorna um cliente Supabase no browser, ou `null` se as variáveis de
 * ambiente ainda não foram configuradas. O app funciona em modo demonstrativo
 * (dados locais) enquanto o Supabase não estiver configurado — ver DATABASE.md.
 */
export function getSupabaseBrowserClient() {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    cached = null;
    return cached;
  }

  cached = createBrowserClient(url, key);
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

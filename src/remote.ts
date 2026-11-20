import { createClient } from '@supabase/supabase-js';
import type { Memorial, Memory, RoomMessage, ViewingRecord } from './types';
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
export const supabase = url && key ? createClient(url, key) : null;
export const canSync = Boolean(supabase);
export async function pullViewing(code: string): Promise<ViewingRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('read_viewing', { p_code: code });
  if (error || !data || typeof data !== 'object') return null;
  const row = data as { memorial?: Memorial; memories?: Memory[]; messages?: RoomMessage[] };
  return row.memorial?.code ? { memorial: row.memorial, memories: row.memories ?? [], messages: row.messages ?? [] } : null;
}
export async function pushMemorial(memorial: Memorial) {
  if (!supabase) return false;
  const { error } = await supabase.rpc('save_viewing_memorial', { p_code: memorial.code, p_memorial: memorial });
  return !error;
}
export async function pushMemory(code: string, memory: Memory) {
  if (!supabase) return false;
  const { error } = await supabase.rpc('add_viewing_memory', { p_code: code, p_memory: memory }); return !error;
}
export async function pushMessage(code: string, message: RoomMessage) {
  if (!supabase) return false;
  const { error } = await supabase.rpc('add_viewing_message', { p_code: code, p_message: message }); return !error;
}
declare global { interface ImportMetaEnv { readonly VITE_SUPABASE_URL?: string; readonly VITE_SUPABASE_ANON_KEY?: string } }

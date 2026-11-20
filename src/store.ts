import type { Memorial, Memory, RoomMessage, ViewingRecord } from './types';
const KEY = 'remote-viewer.records.v1';
const empty = (): ViewingRecord[] => [];
function read(): ViewingRecord[] {
  try { const data = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(data) ? data : empty(); }
  catch { return empty(); }
}
function write(records: ViewingRecord[]) { try { localStorage.setItem(KEY, JSON.stringify(records)); } catch { /* storage unavailable */ } }
export function createAccessCode() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}
export function listMemorials(): Memorial[] { return read().map(r => r.memorial).sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
export function readViewing(code: string): ViewingRecord | null { return read().find(r => r.memorial.code === code) ?? null; }
export function saveMemorial(memorial: Memorial) {
  const records = read(); const i = records.findIndex(r => r.memorial.code === memorial.code);
  const next = i < 0 ? { memorial, memories: [], messages: [] } : { ...records[i], memorial };
  if (i < 0) records.push(next); else records[i] = next;
  write(records); return next;
}
export function replaceViewing(record: ViewingRecord) {
  const records = read(); const i = records.findIndex(r => r.memorial.code === record.memorial.code);
  if (i < 0) records.push(record); else records[i] = record; write(records);
}
export function addMemory(code: string, memory: Memory) {
  const record = readViewing(code); if (!record) return null;
  if (!record.memories.some(m => m.id === memory.id)) record.memories.push(memory);
  replaceViewing(record); return record;
}
export function addRoomMessage(code: string, message: RoomMessage) {
  const record = readViewing(code); if (!record) return null;
  if (!record.messages.some(m => m.id === message.id)) record.messages.push(message);
  replaceViewing(record); return record;
}

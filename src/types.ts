export type LiveProvider = 'jitsi' | 'zoom' | 'teams' | 'meet';
export type MemoryKind = 'message' | 'photo' | 'video' | 'audio';
export type RoomId = 'family' | 'friends' | 'coworkers' | 'church';
export interface ScheduleItem { id: string; time: string; title: string; detail: string }
export interface Memorial {
  id: string; code: string; personName: string; dates: string; hostName: string;
  obituary: string; schedule: ScheduleItem[]; provider: LiveProvider; liveUrl: string;
  createdAt: string; updatedAt: string;
}
export interface Memory { id: string; author: string; body: string; kind: MemoryKind; mediaUrl: string; createdAt: string }
export interface RoomMessage { id: string; room: RoomId; author: string; body: string; createdAt: string }
export interface ViewingRecord { memorial: Memorial; memories: Memory[]; messages: RoomMessage[] }
export const ROOMS: { id: RoomId; label: string }[] = [
  { id: 'family', label: 'Close family' }, { id: 'friends', label: 'Friends' },
  { id: 'coworkers', label: 'Coworkers' }, { id: 'church', label: 'Church members' },
];
export const PROVIDERS: { id: LiveProvider; label: string }[] = [
  { id: 'jitsi', label: 'Jitsi Meet' }, { id: 'zoom', label: 'Zoom' },
  { id: 'teams', label: 'Microsoft Teams' }, { id: 'meet', label: 'Google Meet' },
];

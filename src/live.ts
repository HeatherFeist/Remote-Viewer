import type { LiveProvider } from './types';
export function liveView(provider: LiveProvider, liveUrl: string, code: string) {
  const given = /^https:\/\//i.test(liveUrl.trim()) ? liveUrl.trim() : '';
  if (provider === 'jitsi') {
    const room = given ? given.replace(/\/$/, '') : `https://meet.jit.si/AlwaysPresent-${code}`;
    return { mode: 'frame' as const, src: room, href: room, note: 'The service can play on this page. Anyone with the private link can join.' };
  }
  const labels = { zoom: 'Zoom', teams: 'Microsoft Teams', meet: 'Google Meet' };
  return { mode: 'link' as const, src: '', href: given, note: `${labels[provider]} opens in a new window.` };
}

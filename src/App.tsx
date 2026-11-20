import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { addMemory, addRoomMessage, createAccessCode, listMemorials, readViewing, replaceViewing, saveMemorial } from './store';
import { canSync, pullViewing, pushMemorial, pushMemory, pushMessage } from './remote';
import { liveView } from './live';
import { PROVIDERS, ROOMS, type LiveProvider, type Memorial, type Memory, type MemoryKind, type RoomId, type RoomMessage, type ScheduleItem, type ViewingRecord } from './types';

function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} | Always Present`;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) meta.content = description;
  }, [title, description]);
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="site-shell"><header className="topbar"><Link className="brand" to="/">Always Present <span>Remote Viewer</span></Link><nav><Link to="/">About</Link><Link className="nav-cta" to="/host">Create a memorial</Link></nav></header><main>{children}</main><footer>Always Present Remote Viewer <span>·</span> A place to gather, remember, and stay connected.</footer></div>;
}

function Home() {
  usePageMeta('Remote Viewer', 'A private memorial page for a service people can attend from anywhere.');
  return <Shell><section className="hero"><p className="eyebrow">A place to remember, together</p><h1>A service people can attend from anywhere.</h1><p className="lead">Host a memorial, share one private link, and keep the messages, photos, and stories after the service ends. No headset required.</p><div className="actions"><Link className="button primary" to="/host">Create a memorial</Link><a className="button secondary" href="#how-it-works">See how it works</a></div><div className="feature-grid" id="how-it-works">{[['A service together', 'Share a live service using Jitsi, Zoom, Microsoft Teams, or Google Meet.'], ['A place for memories', 'Invite family and friends to leave a message, photo, or a link to a recording.'], ['Rooms to gather', 'Give people a quieter place to share stories with family, friends, coworkers, or church.'], ['A lasting archive', 'Keep the condolence wall and memories available through the private link.']].map(([title, text]) => <article className="card" key={title}><h2>{title}</h2><p>{text}</p></article>)}</div></section><section className="plans"><p className="eyebrow">Simple and personal</p><h2>Start with a free memorial</h2><p>Memorial creation and the core gathering features are available now. Paid plans and checkout are not enabled in this version.</p></section></Shell>;
}

function Host() {
  usePageMeta('Create a memorial', 'Create a private memorial page and share its link with family and friends.');
  const navigate = useNavigate();
  const [personName, setPersonName] = useState('');
  const [dates, setDates] = useState('');
  const [hostName, setHostName] = useState('');
  const [obituary, setObituary] = useState('');
  const [provider, setProvider] = useState<LiveProvider>('jitsi');
  const [liveUrl, setLiveUrl] = useState('');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([{ id: crypto.randomUUID(), time: '', title: '', detail: '' }]);
  const [memorials, setMemorials] = useState<Memorial[]>(listMemorials());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!personName.trim()) return;
    setSaving(true); setError('');
    const now = new Date().toISOString();
    const memorial: Memorial = { id: crypto.randomUUID(), code: createAccessCode(), personName: personName.trim(), dates: dates.trim(), hostName: hostName.trim(), obituary: obituary.trim(), schedule: schedule.filter(item => item.title.trim() || item.time.trim()), provider, liveUrl: liveUrl.trim(), createdAt: now, updatedAt: now };
    saveMemorial(memorial);
    const synced = await pushMemorial(memorial);
    setSaving(false);
    setMemorials(listMemorials());
    if (canSync() && !synced) setError('The memorial is saved in this browser, but could not be saved to the shared database. Check your Supabase configuration and migration before sharing the link.');
    navigate(`/viewing/${memorial.code}`);
  }

  function updateSchedule(id: string, key: 'time' | 'title', value: string) { setSchedule(rows => rows.map(row => row.id === id ? { ...row, [key]: value } : row)); }
  return <Shell><section className="page narrow"><Link className="back-link" to="/">← Remote Viewer</Link><p className="eyebrow">For the people who cannot be there in person</p><h1>Create a memorial</h1><p className="lead">Add the details you want to share, then send the private link to family and friends.</p><p className="notice">{canSync() ? 'Shared database connected.' : 'Local preview mode: add Supabase settings to share this memorial across devices.'}</p><form className="form" onSubmit={submit}><label>Name of the person being remembered<input required value={personName} onChange={e => setPersonName(e.target.value)} /></label><label>Dates<input value={dates} onChange={e => setDates(e.target.value)} placeholder="1948–2026" /></label><label>Your name (host)<input value={hostName} onChange={e => setHostName(e.target.value)} /></label><label>Obituary or remembrance<textarea value={obituary} onChange={e => setObituary(e.target.value)} rows={6} /></label><fieldset><legend>Service schedule</legend>{schedule.map(item => <div className="schedule-row" key={item.id}><input aria-label="Time" placeholder="Time" value={item.time} onChange={e => updateSchedule(item.id, 'time', e.target.value)} /><input aria-label="Event" placeholder="Visitation, service, or reception" value={item.title} onChange={e => updateSchedule(item.id, 'title', e.target.value)} /></div>)}<button className="text-button" type="button" onClick={() => setSchedule(rows => [...rows, { id: crypto.randomUUID(), time: '', title: '', detail: '' }])}>+ Add a time</button></fieldset><label>Live service provider<select value={provider} onChange={e => setProvider(e.target.value as LiveProvider)}>{PROVIDERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Meeting link<input type="url" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder={provider === 'jitsi' ? 'Optional — a private Jitsi room is created automatically' : 'https://'} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create private memorial'}</button></form>{memorials.length > 0 && <section className="existing"><h2>Memorials on this device</h2><ul>{memorials.map(item => <li key={item.code}><Link to={`/viewing/${item.code}`}>{item.personName}{item.dates && <span> · {item.dates}</span>}</Link></li>)}</ul></section>}</section></Shell>;
}

async function photoDataUrl(file: File): Promise<string> {
  const image = await createImageBitmap(file); const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d'); if (!context) throw new Error('Could not read the photo.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', 0.72);
}

function MemorialPage() {
  const { code = '' } = useParams();
  const [record, setRecord] = useState<ViewingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'service' | 'wall' | 'rooms' | 'archive'>('service');
  const [author, setAuthor] = useState(() => { try { return sessionStorage.getItem('remote-viewer.name') ?? ''; } catch { return ''; } });
  const [body, setBody] = useState(''); const [kind, setKind] = useState<MemoryKind>('message'); const [mediaUrl, setMediaUrl] = useState('');
  const [room, setRoom] = useState<RoomId>('family'); const [roomBody, setRoomBody] = useState(''); const [error, setError] = useState('');
  usePageMeta(record ? `In memory of ${record.memorial.personName}` : 'Memorial', 'A private memorial with the service, condolences, rooms, and archive.');
  useEffect(() => {
    let cancelled = false;
    const load = async () => { const remote = await pullViewing(code); const local = readViewing(code); if (cancelled) return; const next = remote ?? local; if (remote) replaceViewing(remote); setRecord(next); setLoading(false); };
    void load(); const timer = window.setInterval(() => void load(), 8000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [code]);
  function rememberName(value: string) { setAuthor(value); try { sessionStorage.setItem('remote-viewer.name', value); } catch { /* session storage is optional */ } }
  async function postMemory(event: FormEvent) {
    event.preventDefault(); if (!record) return;
    if (!author.trim() || (!body.trim() && !mediaUrl)) { setError('Add your name and a memory.'); return; }
    const memory: Memory = { id: `memory-${crypto.randomUUID()}`, author: author.trim(), body: body.trim(), kind, mediaUrl, createdAt: new Date().toISOString() };
    const saved = addMemory(code, memory) ?? { ...record, memories: [...record.memories, memory] }; replaceViewing(saved); setRecord(saved); setBody(''); setMediaUrl(''); setError('');
    if (canSync() && !(await pushMemory(code, memory))) setError('Saved on this device, but not synced. Please try again later.');
  }
  async function postRoom(event: FormEvent) {
    event.preventDefault(); if (!record) return;
    if (!author.trim() || !roomBody.trim()) { setError('Add your name and a note for the room.'); return; }
    const message: RoomMessage = { id: `room-${crypto.randomUUID()}`, room, author: author.trim(), body: roomBody.trim(), createdAt: new Date().toISOString() };
    const saved = addRoomMessage(code, message) ?? { ...record, messages: [...record.messages, message] }; replaceViewing(saved); setRecord(saved); setRoomBody(''); setError('');
    if (canSync() && !(await pushMessage(code, message))) setError('Saved on this device, but not synced. Please try again later.');
  }
  if (loading) return <Shell><section className="page"><p role="status">Opening the memorial…</p></section></Shell>;
  if (!record) return <Shell><section className="page"><h1>This private link does not open a memorial.</h1><p>Ask the host to check the link. A memorial created without a shared database is only available in the host’s browser.</p><Link className="button secondary" to="/">About Remote Viewer</Link></section></Shell>;
  const { memorial } = record; const live = liveView(memorial.provider, memorial.liveUrl, memorial.code);
  return <Shell><article className="page"><p className="eyebrow">In memory</p><h1>{memorial.personName}</h1>{memorial.dates && <p className="lead">{memorial.dates}</p>}{memorial.hostName && <p className="subtle">Hosted by {memorial.hostName}</p>}{!canSync() && <p className="notice">This is a local preview. Connect Supabase so guests on other devices can view and add memories.</p>}<div className="tabs" role="tablist" aria-label="Memorial sections">{(['service', 'wall', 'rooms', 'archive'] as const).map(item => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'wall' ? 'Condolences' : item === 'service' ? 'Service' : item === 'archive' ? 'Archive' : 'Rooms'}</button>)}</div>
    {tab === 'service' && <div className="content-stack">{memorial.obituary && <section className="card"><h2>Obituary</h2><p className="preserve">{memorial.obituary}</p></section>}{memorial.schedule.length > 0 && <section className="card"><h2>Service schedule</h2><ol className="schedule-list">{memorial.schedule.map(item => <li key={item.id}><strong>{item.time && `${item.time} — `}{item.title}</strong>{item.detail && <p>{item.detail}</p>}</li>)}</ol></section>}<section className="card"><h2>Live service</h2><p>{live.note}</p>{live.mode === 'frame' && <iframe className="video-frame" title={`Service for ${memorial.personName}`} src={live.src} allow="camera; microphone; display-capture; fullscreen" />}{live.href && <a className="button primary" href={live.href} target="_blank" rel="noopener noreferrer">Join the service</a>}</section></div>}
    {tab === 'wall' && <section className="content-stack"><h2>Condolence wall</h2><form className="form" onSubmit={postMemory}><label>Your name<input value={author} onChange={e => rememberName(e.target.value)} /></label><label>A message or story<textarea rows={4} value={body} onChange={e => setBody(e.target.value)} /></label><div className="kind-picker">{(['message', 'photo', 'video', 'audio'] as const).map(item => <button type="button" key={item} className={kind === item ? 'active' : ''} onClick={() => { setKind(item); setMediaUrl(''); }}>{item}</button>)}</div>{kind === 'photo' && <label>Choose a photo<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) void photoDataUrl(file).then(setMediaUrl).catch(() => setError('Could not read the photo.')); }} /></label>}{(kind === 'video' || kind === 'audio') && <label>{kind === 'video' ? 'Video' : 'Audio'} link<input type="url" placeholder="https://" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} /></label>}{error && <p className="error" role="alert">{error}</p>}<button className="button primary" type="submit">Leave a memory</button></form><ul className="memory-list">{record.memories.slice().reverse().map(memory => <MemoryCard key={memory.id} memory={memory} />)}</ul></section>}
    {tab === 'rooms' && <section className="content-stack"><h2>Rooms</h2><p>Choose a room and leave a note for the people gathered there.</p><div className="kind-picker">{ROOMS.map(item => <button type="button" key={item.id} className={room === item.id ? 'active' : ''} onClick={() => setRoom(item.id)}>{item.label}</button>)}</div><form className="form" onSubmit={postRoom}><label>Your name<input value={author} onChange={e => rememberName(e.target.value)} /></label><label>A note for this room<textarea rows={3} value={roomBody} onChange={e => setRoomBody(e.target.value)} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="button primary" type="submit">Send to room</button></form><ul className="memory-list">{record.messages.filter(message => message.room === room).map(message => <li className="card" key={message.id}><p className="eyebrow">{message.author}</p><p className="preserve">{message.body}</p></li>)}</ul></section>}
    {tab === 'archive' && <section className="content-stack"><h2>Memory archive</h2><p>Messages and memories shared here stay with this memorial.</p>{record.memories.length ? <ul className="memory-list">{record.memories.map(memory => <MemoryCard key={memory.id} memory={memory} />)}</ul> : <p className="subtle">No memories yet.</p>}</section>}
  </article></Shell>;
}

function MemoryCard({ memory }: { memory: Memory }) {
  return <li className="card"><p className="eyebrow">{memory.author} · {memory.kind}</p>{memory.body && <p className="preserve">{memory.body}</p>}{memory.kind === 'photo' && memory.mediaUrl.startsWith('data:image') && <img className="memory-photo" src={memory.mediaUrl} alt="Shared memory" />}{(memory.kind === 'video' || memory.kind === 'audio') && /^https:\/\//.test(memory.mediaUrl) && <a href={memory.mediaUrl} target="_blank" rel="noopener noreferrer">Open {memory.kind}</a>}</li>;
}

export default function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/host" element={<Host />} /><Route path="/viewing/:code" element={<MemorialPage />} /><Route path="*" element={<Home />} /></Routes>;
}

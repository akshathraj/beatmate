import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "./DashboardCard";
import { Music, Play, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface BackendSong {
  filename: string;
  title?: string;
  download_url: string;
  size: number;
}

export const RemixSongs = () => {
  const [songs, setSongs] = useState<BackendSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [songA, setSongA] = useState<string>("");
  const [songB, setSongB] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [remixUrl, setRemixUrl] = useState<string | null>(null);
  const remixAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isRemixPlaying, setIsRemixPlaying] = useState(false);
  const [remixCurrentTime, setRemixCurrentTime] = useState(0);
  const [remixDuration, setRemixDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array.from({ length: 16 }, () => 10));
  const waveTimerRef = useRef<number | null>(null);
  const [requestStartEpoch, setRequestStartEpoch] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:8000/api/songs');
      if (!res.ok) return;
      const data = await res.json();
      setSongs((data?.songs || []) as BackendSong[]);
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    const onRefresh = () => fetchSongs();
    window.addEventListener('song-generated', onRefresh);
    return () => window.removeEventListener('song-generated', onRefresh);
  }, []);

  const toAbsoluteUrl = (fn: string) => `http://localhost:8000${fn}`;

  const mixTwoSongs = async () => {
    try {
      setIsGenerating(true);
      setRemixUrl(null);
      const sA = songs.find(s => (s.title || s.filename) === songA || s.filename === songA);
      const sB = songs.find(s => (s.title || s.filename) === songB || s.filename === songB);
      if (!sA || !sB) {
        toast({ title: 'Select two songs', description: 'Please choose two songs to remix.', variant: 'destructive' });
        return;
      }

      setRequestStartEpoch(Date.now() / 1000);

      // Call backend remix endpoint to create new lyrics and generate a new song
      const response = await fetch('http://localhost:8000/api/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_a: sA.filename,
          song_b: sB.filename,
          title: (title || `${(sA.title || sA.filename).replace('.mp3','')} x ${(sB.title || sB.filename).replace('.mp3','')} Remix`).trim(),
          genre: 'Pop',
          voiceType: 'male'
        })
      });

      if (!response.ok) {
        let detail = 'Remix request failed';
        try {
          const err = await response.json();
          detail = err?.detail || detail;
        } catch {}
        throw new Error(detail);
      }
      toast({ title: '🎧 Remix Requested', description: 'Your remix is being generated. It will appear in Recent Songs when ready.' });
      // trigger frontend refresh loop
      window.dispatchEvent(new CustomEvent('song-generated'));

      // Poll for the new remix media in /api/songs
      let attempts = 0;
      const intervalMs = 5000;
      const maxAttempts = 60;
      const providedTitle = (title || `${(sA.title || sA.filename).replace('.mp3','')} x ${(sB.title || sB.filename).replace('.mp3','')} Remix`).trim().toLowerCase();
      const startCutoff = (requestStartEpoch || (Date.now() / 1000)) - 2;
      const poll = async () => {
        try {
          const res = await fetch('http://localhost:8000/api/songs');
          if (res.ok) {
            const data = await res.json();
            const found = (data.songs as any[]).find((song: any) => {
              const t = (song.title || '').toLowerCase();
              const f = (song.filename || '').toLowerCase();
              const createdOk = (song.created_at || 0) >= startCutoff;
              return createdOk && (t === providedTitle || f.includes(providedTitle));
            });
            if (found) {
              const url = toAbsoluteUrl(found.download_url);
              setRemixUrl(url);
              setIsGenerating(false);
              return;
            }
          }
        } catch {}
        attempts++;
        if (attempts < maxAttempts) setTimeout(poll, intervalMs); else setIsGenerating(false);
      };
      setTimeout(poll, intervalMs);
    } catch (e: any) {
      toast({ title: 'Remix failed', description: String(e?.message || e), variant: 'destructive' });
      setIsGenerating(false);
    }
  };

  const audioBufferToWavBlob = (buffer: AudioBuffer) => {
    const numOfChan = Math.min(2, buffer.numberOfChannels);
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [] as Float32Array[];
    let offset = 0;
    let pos = 0;

    // write WAVE header
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt "
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * numOfChan * 2); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4); // data length

    // write interleaved data
    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const downloadMix = () => {
    if (!remixUrl) return;
    const link = document.createElement('a');
    link.href = remixUrl;
    link.download = 'remix.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Wave animation for remix playback
  useEffect(() => {
    if (isRemixPlaying) {
      waveTimerRef.current = window.setInterval(() => {
        setWaveHeights(prev => prev.map((_, i) => 10 + Math.floor(Math.random() * (80 - (i % 5) * 5))));
      }, 150);
    } else if (waveTimerRef.current) {
      window.clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
      setWaveHeights(prev => prev.map(() => 10));
    }
    return () => {
      if (waveTimerRef.current) {
        window.clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
    };
  }, [isRemixPlaying]);

  const toggleRemixPlayback = () => {
    if (!remixUrl || !remixAudioRef.current) return;
    if (isRemixPlaying) {
      remixAudioRef.current.pause();
      setIsRemixPlaying(false);
    } else {
      remixAudioRef.current.play().then(() => setIsRemixPlaying(true)).catch(() => {});
    }
  };

  return (
    <DashboardCard glowColor="collab" className="h-full w-full" compact>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-collab rounded-lg">
            <Shuffle className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Remix Songs</h2>
            <p className="text-muted-foreground">Mix any two songs from your library</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-foreground mb-2 block">Song 1</label>
            <Select value={songA} onValueChange={setSongA}>
              <SelectTrigger className="bg-input/50 border-border/50">
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select first song'} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50 max-h-56 overflow-y-auto">
                {songs.map((s) => (
                  <SelectItem key={s.filename} value={s.title || s.filename}>
                    {(s.title || s.filename).replace('.mp3','')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-foreground mb-2 block">Song 2</label>
            <Select value={songB} onValueChange={setSongB}>
              <SelectTrigger className="bg-input/50 border-border/50">
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select second song'} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50 max-h-56 overflow-y-auto">
                {songs.map((s) => (
                  <SelectItem key={s.filename} value={s.title || s.filename}>
                    {(s.title || s.filename).replace('.mp3','')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={mixTwoSongs} variant="collab" size="lg" className="w-full text-lg py-5" disabled={!songA || !songB}>
            <Shuffle className="w-5 h-5" />
            Remix with AI
          </Button>
        </div>

      {/* Remix generation status and inline player */}
      {(isGenerating || remixUrl) && (
        <div className="p-3 bg-muted/20 rounded-md border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Generated Remix</span>
            {!remixUrl && <span className="text-xs text-muted-foreground">Generating…</span>}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={toggleRemixPlayback} variant="collab" size="sm" disabled={!remixUrl}>
              {isRemixPlaying ? 'Pause' : 'Play Remix'}
            </Button>
            <div className="flex-1">
              {remixUrl ? (
                <div className="h-10 flex items-end gap-1">
                  {waveHeights.map((h, i) => (
                    <div key={i} className="w-1 bg-gradient-collab rounded-sm" style={{ height: isRemixPlaying ? `${h}%` : '10%' }} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Processing... This may take a few minutes</div>
              )}
            </div>
          </div>
          {remixUrl && (
            <div className="text-xs text-muted-foreground">
              {Math.floor(remixCurrentTime / 60)}:{`${Math.floor(remixCurrentTime % 60)}`.padStart(2,'0')} / {Math.floor(remixDuration / 60)}:{`${Math.floor(remixDuration % 60)}`.padStart(2,'0')}
            </div>
          )}
          {remixUrl && (
            <audio
              ref={remixAudioRef}
              src={remixUrl}
              onTimeUpdate={(e) => setRemixCurrentTime((e.target as HTMLAudioElement).currentTime)}
              onLoadedMetadata={(e) => setRemixDuration((e.target as HTMLAudioElement).duration)}
              onEnded={() => setIsRemixPlaying(false)}
              onPause={() => setIsRemixPlaying(false)}
              onPlay={() => setIsRemixPlaying(true)}
            />
          )}
        </div>
      )}
      </div>
    </DashboardCard>
  );
};
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "./DashboardCard";
import { Music, Play, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [generationStage, setGenerationStage] = useState<string>("");
  const [remixUrl, setRemixUrl] = useState<string | null>(null);
  const remixAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isRemixPlaying, setIsRemixPlaying] = useState(false);
  const [remixCurrentTime, setRemixCurrentTime] = useState(0);
  const [remixDuration, setRemixDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array.from({ length: 16 }, () => 10));
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const waveTimerRef = useRef<number | null>(null);
  const [requestStartEpoch, setRequestStartEpoch] = useState<number | null>(null);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);
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

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, []);

  // Start cooldown timer
  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds);
    
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    
    cooldownTimerRef.current = window.setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          
          // Notify user when cooldown ends
          toast({
            title: "✅ Ready!",
            description: "You can now generate remixes again!",
            duration: 4000,
          });
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toAbsoluteUrl = (fn: string) => `http://localhost:8000${fn}`;

  const handleOpenTitleDialog = () => {
    // Show cooldown message if still in cooldown
    if (cooldownSeconds > 0) {
      toast({
        title: "⏳ Please Wait",
        description: "Your previous remix is still being processed in the background. We'll notify you when you can generate another remix.",
        duration: 4000,
      });
      return;
    }

    const sA = songs.find(s => (s.title || s.filename) === songA || s.filename === songA);
    const sB = songs.find(s => (s.title || s.filename) === songB || s.filename === songB);
    if (!sA || !sB) {
      toast({ title: 'Select two songs', description: 'Please choose two songs to remix.', variant: 'destructive' });
      return;
    }
    
    // Pre-fill the title with default format
    const defaultTitle = `${(sA.title || sA.filename).replace('.mp3','')} x ${(sB.title || sB.filename).replace('.mp3','')} Remix`;
    setTitle(defaultTitle);
    setShowTitleDialog(true);
  };

  const mixTwoSongs = async () => {
    try {
      setShowTitleDialog(false);
      
      // Reset all remix state before starting
      setRemixUrl(null);
      setIsRemixPlaying(false);
      setRemixCurrentTime(0);
      setRemixDuration(0);
      setIsGenerating(true);
      
      const sA = songs.find(s => (s.title || s.filename) === songA || s.filename === songA);
      const sB = songs.find(s => (s.title || s.filename) === songB || s.filename === songB);
      if (!sA || !sB) {
        toast({ title: 'Select two songs', description: 'Please choose two songs to remix.', variant: 'destructive' });
        setIsGenerating(false);
        setGenerationStage("");
        return;
      }

      setRequestStartEpoch(Date.now() / 1000);

      // Show initial "request received" toast
      toast({
        title: "📨 Request Received",
        description: "Processing your remix request...",
        duration: 3000,
      });

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
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail || `HTTP ${response.status}`;
        console.error('❌ Remix generation failed:', errorDetail);
        console.error('Full error:', errorData);
        throw new Error(errorDetail);
      }
      
      setGenerationStage("");
      
      // Show "lyrics generated" toast
      toast({ 
        title: '✅ Lyrics Generated!', 
        description: 'Remix generation is now in progress. This usually takes 1-2 minutes.',
        duration: 5000 
      });
      
      // trigger frontend refresh loop
      window.dispatchEvent(new CustomEvent('song-generated'));

      // Clear any existing polling
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Poll for the new remix media in /api/songs
      let attempts = 0;
      const intervalMs = 5000;
      const maxAttempts = 60;
      // Normalize the title for comparison (remove special chars, lowercase)
      const normalizeTitle = (str: string) => {
        return str
          .toLowerCase()
          .replace(/\.mp3$/i, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      const providedTitleNormalized = normalizeTitle(title);
      const startCutoff = (requestStartEpoch || (Date.now() / 1000)) - 2;
      
      console.log(`🔍 Polling for remix with title: "${title}"`);
      console.log(`🔍 Normalized search term: "${providedTitleNormalized}"`);
      
      const poll = async () => {
        try {
          attempts++;
          
          // Show generic "still generating" toast every 30 seconds (every 6 attempts)
          if (attempts > 0 && attempts % 6 === 0) {
            toast({
              title: "🎵 Still Generating...",
              description: "Your remix is being created. This usually takes 1-2 minutes.",
              duration: 4000,
            });
          }
          
          const res = await fetch('http://localhost:8000/api/songs');
          if (res.ok) {
            const data = await res.json();
            console.log(`🔍 Poll attempt ${attempts}/${maxAttempts}: Found ${data.songs?.length || 0} songs`);
            
            const found = (data.songs as any[]).find((song: any) => {
              const t = normalizeTitle(song.title || '');
              const f = normalizeTitle(song.filename || '');
              const createdOk = (song.created_at || 0) >= startCutoff;
              
              // More flexible matching
              const titleMatch = t === providedTitleNormalized || 
                                 t.includes(providedTitleNormalized) ||
                                 providedTitleNormalized.includes(t);
              const filenameMatch = f === providedTitleNormalized || 
                                    f.includes(providedTitleNormalized) ||
                                    providedTitleNormalized.includes(f);
              
              if (createdOk && (titleMatch || filenameMatch)) {
                console.log(`✅ Match found! Title: "${song.title}", Filename: "${song.filename}"`);
                return true;
              }
              return false;
            });
            
            if (found) {
              const url = toAbsoluteUrl(found.download_url);
              setRemixUrl(url);
              setIsGenerating(false);
              setGenerationStage("");
              
              // Clear polling interval
              if (pollIntervalRef.current) {
                clearTimeout(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              
              // Start 35-second cooldown to allow MusicGPT to finish processing the 2nd variant
              // This prevents "TOO MANY PARALLEL REQUESTS" errors (invisible to user)
              startCooldown(35);
              
              // Trigger refresh of Music Player
              window.dispatchEvent(new CustomEvent('song-generated'));
              toast({ title: '🎉 Remix Complete!', description: `"${title}" is ready to play!`, duration: 5000 });
              console.log('✅ Remix found and loaded:', found.title || found.filename);
              return; // Stop polling
            }
          }
        } catch (err) {
          console.error('❌ Error polling for remix:', err);
        }
        
        if (attempts < maxAttempts) {
          pollIntervalRef.current = window.setTimeout(poll, intervalMs);
        } else {
          setIsGenerating(false);
          setGenerationStage("");
          
          if (pollIntervalRef.current) {
            clearTimeout(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          toast({ 
            title: '⏰ Still Processing', 
            description: 'Your remix is taking longer than expected. Please check the music player in a few minutes.',
            duration: 7000
          });
        }
      };
      
      pollIntervalRef.current = window.setTimeout(poll, intervalMs);
    } catch (e: any) {
      console.error('❌ Error generating remix:', e);
      console.error('Error details:', {
        message: e?.message,
        stack: e?.stack,
        name: e?.name
      });
      
      toast({ 
        title: 'Remix Failed', 
        description: e?.message || 'Failed to generate remix. Please try again.', 
        variant: 'destructive',
        duration: 5000
      });
      
      setIsGenerating(false);
      setGenerationStage("");
      
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
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

        <Button 
          onClick={handleOpenTitleDialog}
          variant="collab" 
          size="lg" 
          className="w-full text-lg py-5"
          disabled={isGenerating || !songA || !songB}
        >
          {isGenerating ? (
            <>
              <Shuffle className="w-5 h-5 animate-spin" />
              Generating Remix...
            </>
          ) : (
            <>
              <Shuffle className="w-5 h-5" />
              Remix with AI
            </>
          )}
        </Button>

        <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remix Title</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Enter a title for your remix
                </label>
                <Input
                  placeholder="My Remix"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input/50 border-border/50"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTitleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={mixTwoSongs} disabled={!title.trim()}>
                  Generate Remix
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* Remix generation status and inline player */}
      {(isGenerating || remixUrl) && (
        <div className="p-3 bg-muted/20 rounded-md border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Generated Remix</span>
            {isGenerating && !remixUrl && (
              <span className="text-xs text-yellow-500 animate-pulse">Generating…</span>
            )}
            {remixUrl && (
              <span className="text-xs text-green-500">✓ Ready to play</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={toggleRemixPlayback} variant="collab" size="sm" disabled={!remixUrl || isGenerating}>
              {isRemixPlaying ? 'Pause' : 'Play Remix'}
            </Button>
            <div className="flex-1">
              {remixUrl ? (
                <div className="h-10 flex items-end gap-1">
                  {waveHeights.map((h, i) => (
                    <div key={i} className="w-1 bg-gradient-collab rounded-sm" style={{ height: isRemixPlaying ? `${h}%` : '10%' }} />
                  ))}
                </div>
              ) : isGenerating ? (
                <div className="text-sm text-muted-foreground">Processing... This may take a few minutes</div>
              ) : null}
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
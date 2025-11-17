import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "./DashboardCard";
import { Music, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const genres = [
  "Pop", "Hip Hop", "EDM", "Romantic", "Lofi", "Patriotic", "Acoustic", "Rock", "Jazz", "Classical", "Country", "Alternative", "R&B", "Custom"
];

const voiceStyles = [
  { value: "male", label: "Male Voice" },
  { value: "female", label: "Female Voice" },
  { value: "duet", label: "Duet (Male + Female)" },
];

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
  const [genre, setGenre] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [voiceType, setVoiceType] = useState("");
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
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

  const pollForRemix = (songTitle: string) => {
    const startTime = Date.now();
    const POLL_INTERVAL = 5000;
    const TIMEOUT = 180000;
    let lastToastTime = 0;

    const checkRemix = async () => {
      try {
        const elapsed = Date.now() - startTime;
        if (elapsed >= TIMEOUT) {
          toast({
            title: "⏱️ Still Processing",
            description: "Taking longer than expected. Please check back later.",
            duration: 5000,
          });
          setIsGenerating(false);
          startCooldown(35);
          return;
        }

        // Show progress toast every 30 seconds
        if (elapsed - lastToastTime >= 30000) {
          toast({
            title: "🎵 Processing...",
            description: "Your remix is being generated. This may take a few minutes.",
            duration: 5000,
          });
          lastToastTime = elapsed;
        }

        const res = await fetch('http://localhost:8000/api/songs');
        if (!res.ok) {
          pollIntervalRef.current = window.setTimeout(checkRemix, POLL_INTERVAL);
          return;
        }

        const data = await res.json();
        const allSongs = (data?.songs || []) as BackendSong[];
        const foundSong = allSongs.find((s) => (s.title || s.filename).includes(songTitle));

        if (foundSong) {
          setIsGenerating(false);
          
          toast({
            title: "🎉 Remix Complete!",
            description: "Your remix is ready in the Music Player.",
            duration: 5000,
          });

          fetchSongs();
          window.dispatchEvent(new Event('song-generated'));
          
          startCooldown(35);
        } else {
          pollIntervalRef.current = window.setTimeout(checkRemix, POLL_INTERVAL);
        }
      } catch (error) {
        console.error('Polling error:', error);
        pollIntervalRef.current = window.setTimeout(checkRemix, POLL_INTERVAL);
      }
    };

    checkRemix();
  };

  const handleOpenDialog = () => {
    // Check cooldown
    if (cooldownSeconds > 0) {
      toast({
        title: "⏳ Please Wait",
        description: "You can generate a new remix soon.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!songA || !songB) {
      toast({
        title: "⚠️ Selection Required",
        description: "Please select both songs to remix.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!genre) {
      toast({
        title: "⚠️ Genre Required",
        description: "Please select a genre for your remix.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (genre === "custom" && !customGenre.trim()) {
      toast({
        title: "⚠️ Custom Genre Required",
        description: "Please enter a custom genre.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!voiceType) {
      toast({
        title: "⚠️ Voice Style Required",
        description: "Please select a voice style for your remix.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const sA = songs.find((s) => (s.title || s.filename) === songA);
    const sB = songs.find((s) => (s.title || s.filename) === songB);
    if (!sA || !sB) return;

    // Auto-generate title and open dialog
    const autoTitle = `${(sA.title || sA.filename).replace('.mp3','')} x ${(sB.title || sB.filename).replace('.mp3','')} Remix`;
    setTitle(autoTitle);
    setIsDialogOpen(true);
  };

  const mixTwoSongs = async () => {
    const sA = songs.find((s) => (s.title || s.filename) === songA);
    const sB = songs.find((s) => (s.title || s.filename) === songB);
    if (!sA || !sB) return;

    try {
      setIsGenerating(true);
      setIsDialogOpen(false);

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
          title: title.trim(),
          genre: genre === "custom" ? customGenre : genre,
          voiceType: voiceType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail || `HTTP ${response.status}`;
        console.error('❌ Remix generation failed:', errorDetail);
        
        toast({
          title: "❌ Generation Failed",
          description: errorDetail,
          variant: "destructive",
          duration: 5000,
        });
        setIsGenerating(false);
        return;
      }

      const result = await response.json();

      toast({
        title: "✅ Lyrics Generated",
        description: "Song generation in progress...",
        duration: 4000,
      });

      pollForRemix(title);

    } catch (error: any) {
      console.error('❌ Remix error:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to generate remix",
        variant: "destructive",
        duration: 5000,
      });
      setIsGenerating(false);
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
            <p className="text-muted-foreground text-sm">Mix any two songs from your library</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* First Song */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">First Song</label>
            <Select value={songA} onValueChange={setSongA} disabled={isGenerating || cooldownSeconds > 0}>
              <SelectTrigger className="bg-input/50 border-border/50 h-9">
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select first song'} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50 max-h-56 overflow-y-auto">
                {songs.filter((s) => (s.title || s.filename) !== songB).map((s) => (
                  <SelectItem key={s.filename} value={s.title || s.filename}>
                    {(s.title || s.filename).replace('.mp3','')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Second Song */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Second Song</label>
            <Select value={songB} onValueChange={setSongB} disabled={isGenerating || cooldownSeconds > 0}>
              <SelectTrigger className="bg-input/50 border-border/50 h-9">
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select second song'} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50 max-h-56 overflow-y-auto">
                {songs.filter((s) => (s.title || s.filename) !== songA).map((s) => (
                  <SelectItem key={s.filename} value={s.title || s.filename}>
                    {(s.title || s.filename).replace('.mp3','')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Genre */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Genre</label>
            {genre === "custom" ? (
              <div className="relative flex items-center">
                <Input
                  placeholder="Enter custom genre"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  className="bg-input/50 border-border/50 h-9 text-sm pr-10"
                  disabled={isGenerating || cooldownSeconds > 0}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGenre("");
                    setCustomGenre("");
                  }}
                  disabled={isGenerating || cooldownSeconds > 0}
                  className="absolute right-0 h-full px-3 hover:bg-transparent"
                  title="Choose different genre"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </Button>
              </div>
            ) : (
              <Select value={genre} onValueChange={(value) => {
                setGenre(value);
                if (value !== "custom") {
                  setCustomGenre("");
                }
              }} disabled={isGenerating || cooldownSeconds > 0}>
                <SelectTrigger className="bg-input/50 border-border/50 h-9">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  {genres.map((g) => (
                    <SelectItem key={g} value={g.toLowerCase()}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Voice Style */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Voice Style</label>
            <Select value={voiceType} onValueChange={setVoiceType} disabled={isGenerating || cooldownSeconds > 0}>
              <SelectTrigger className="bg-input/50 border-border/50 h-9">
                <SelectValue placeholder="Select voice style" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                {voiceStyles.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleOpenDialog}
          variant="collab" 
          size="lg"
          className="w-full"
          disabled={isGenerating || cooldownSeconds > 0 || !songA || !songB || !genre || !voiceType || (genre === "custom" && !customGenre.trim())}
        >
          {isGenerating ? (
            <>
              <Music className="w-6 h-6 animate-spin" />
              Generating Your Remix...
            </>
          ) : (
            <>
              <Shuffle className="w-6 h-6" />
              Remix with AI
            </>
          )}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={mixTwoSongs} disabled={!title.trim()}>
                  Generate Remix
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardCard>
  );
};

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardCard } from "./DashboardCard";
import { Wand2, Music, Play, Pause, Download, Mic, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const genres = [
  "Pop", "Hip Hop", "EDM", "Romantic", "Lofi", "Patriotic", "Acoustic", "Rock", "Jazz", "Classical", "Country", "Alternative", "R&B", "Custom"
];

const voiceOptions = [
  { value: "male", label: "Male Voice", icon: Mic, description: "Male vocal performance" },
  { value: "female", label: "Female Voice", icon: Mic, description: "Female vocal performance" },
  { value: "duet", label: "Duet", icon: Users, description: "Male & Female duet" }
];

export const SongGenerator = () => {
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [title, setTitle] = useState("");
  const [voiceType, setVoiceType] = useState("male");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>("");
  const [generatedSong, setGeneratedSong] = useState<string | null>(null);
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const [requestStartEpoch, setRequestStartEpoch] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array.from({ length: 16 }, () => 10));
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const waveTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Attach audio listeners for progress/duration when a song URL is set
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
    };
  }, [songUrl]);

  // Simple animated wave bars when playing
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying]);

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
            description: "You can now generate songs again!",
            duration: 4000,
          });
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleButtonClick = () => {
    // Show cooldown message if still in cooldown
    if (cooldownSeconds > 0) {
      toast({
        title: "⏳ Please Wait",
        description: "Your previous song is still being processed in the background. We'll notify you when you can generate another song.",
        duration: 4000,
      });
      return;
    }
    
    // Open dialog if not generating
    if (!isGenerating) {
      setIsDialogOpen(true);
    }
  };

  const handleGenerate = async () => {
    if (!lyrics.trim()) {
      toast({
        title: "Missing lyrics",
        description: "Please enter some lyrics or a description for your song.",
        variant: "destructive",
      });
      return;
    }

    if (!genre) {
      toast({
        title: "Missing genre",
        description: "Please select a genre for your song.",
        variant: "destructive",
      });
      return;
    }

    if (genre === "custom" && !customGenre.trim()) {
      toast({
        title: "Missing custom genre",
        description: "Please enter your custom genre.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your song.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsDialogOpen(false);
    setRequestStartEpoch(Date.now() / 1000);
    
    // Show initial "request received" toast
    toast({
      title: "📨 Request Received",
      description: "Processing your request...",
      duration: 3000,
    });
    
    try {
      const response = await fetch('http://localhost:8000/api/generate-song', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lyrics, 
          genre: genre === "custom" ? customGenre : genre, 
          duration: 60, // Fixed duration
          title: title,
          voiceType: voiceType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorDetail = errorData.detail || `HTTP ${response.status}`;
        console.error('❌ Song generation failed:', errorDetail);
        console.error('Full error:', errorData);
        throw new Error(errorDetail);
      }

      const data = await response.json();
      
      setGeneratedSong(data.song_url);
      setGenerationStage("");
      
      // Show "lyrics generated" toast
      toast({
        title: "✅ Lyrics Generated!",
        description: "Song generation is now in progress. This usually takes 1-2 minutes.",
        duration: 5000,
      });

      // Poll for the completed song
      checkForCompletedSong();
    } catch (error: any) {
      console.error('❌ Error generating song:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      setIsGenerating(false);
      setGenerationStage("");
      
      toast({
        title: "Generation Error",
        description: error.message || "Failed to start song generation. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const checkForCompletedSong = async () => {
    let attempts = 0;
    const intervalMs = 5000; // 5 seconds
    const maxAttempts = 60; // up to ~5 minutes
    
      const poll = async () => {
        try {
          attempts++;
          
          // Show generic "still generating" toast every 30 seconds (every 6 attempts)
          if (attempts > 0 && attempts % 6 === 0) {
            toast({
              title: "🎵 Still Generating...",
              description: "Your song is being created. This usually takes 1-2 minutes.",
              duration: 4000,
            });
          }
        
        const response = await fetch('http://localhost:8000/api/songs');
        if (response.ok) {
          const data = await response.json();
          // Find the most recent song that matches our title AND was created after this request started
          const startCutoff = (requestStartEpoch || (Date.now() / 1000)) - 2; // 2s cushion
          const normalizedTitle = title.trim().toLowerCase();
          const candidates = (data.songs as any[]).filter((song: any) => {
            const t = (song.title || '').toLowerCase();
            const f = (song.filename || '').toLowerCase();
            const createdOk = (song.created_at || 0) >= startCutoff;
            const titleMatch = t === normalizedTitle || f.includes(normalizedTitle);
            return createdOk && titleMatch;
          });
          // Already sorted newest-first by backend; take the first candidate
          const matchingSong = candidates.length > 0 ? candidates[0] : null;
          
          if (matchingSong) {
            const url = `http://localhost:8000${matchingSong.download_url}`;
            setSongUrl(url);
            setIsGenerating(false);
            setGenerationStage("");
            
            // Clear any existing polling interval
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            // Start 35-second cooldown to allow MusicGPT to finish processing the 2nd variant
            // This prevents "TOO MANY PARALLEL REQUESTS" errors (invisible to user)
            startCooldown(35);
            
            // Notify other widgets (MusicPlayer/MySongs) to refresh
            window.dispatchEvent(new CustomEvent('song-generated'));
            
            toast({
              title: "🎵 Song Ready!",
              description: `"${title}" is now ready to play!`,
              duration: 5000,
            });
            return;
          }
        }
        
        if (attempts < maxAttempts) {
          pollIntervalRef.current = window.setTimeout(poll, intervalMs);
        } else {
          setIsGenerating(false);
          setGenerationStage("");
          
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          toast({
            title: "⏰ Still Processing",
            description: "Your song is taking longer than expected. Please check the music player or 'My Songs' in a few minutes.",
            duration: 7000,
          });
        }
      } catch (error) {
        console.error('Error checking for completed song:', error);
        
        if (attempts < maxAttempts) {
          pollIntervalRef.current = window.setTimeout(poll, intervalMs);
        } else {
          setIsGenerating(false);
          setGenerationStage("");
          
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    };
    
    // Start polling after short delay to allow backend to process
    pollIntervalRef.current = window.setTimeout(poll, intervalMs);
  };

  const togglePlayback = () => {
    if (!songUrl || !audioRef.current) {
      toast({
        title: "No song available",
        description: "Please generate a song first.",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Failed to play the song. Please try again.",
          variant: "destructive",
        });
      });
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (!songUrl || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error", 
          description: "Failed to play the song. Please try again.",
          variant: "destructive",
        });
      });
      setIsPlaying(true);
    }
  };

  const downloadSong = () => {
    if (!songUrl) {
      toast({
        title: "No song available",
        description: "Please generate a song first.",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement('a');
    link.href = songUrl;
    link.download = `${title || 'generated-song'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "⬇️ Downloading",
      description: "Your song is being downloaded...",
    });
  };

  return (
    <DashboardCard glowColor="ai" className="h-full w-full">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-ai rounded-lg">
            <Wand2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Song Generator</h2>
            <p className="text-muted-foreground">Create songs with artificial intelligence</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Lyrics or Description
            </label>
            <Textarea
              placeholder={`Enter your lyrics or describe the mood and style you want...

Example: 'A sad love ballad with piano and strings about lost memories'`}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="min-h-[260px] bg-input/50 border-border/50 focus:border-ai-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Genre
              </label>
              {genre === "custom" ? (
                <div className="relative flex items-center">
                  <Input
                    placeholder="Enter custom genre"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    className="bg-input/50 border-border/50 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setGenre("");
                      setCustomGenre("");
                    }}
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
                }}>
                  <SelectTrigger className="bg-input/50 border-border/50">
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

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Voice Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {voiceOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = voiceType === option.value;
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVoiceType(option.value)}
                      className={`flex flex-col items-center gap-1 h-auto py-3 ${
                        isSelected 
                          ? "bg-gradient-ai text-white border-ai-primary" 
                          : "bg-input/20 border-border/50 hover:bg-input/30"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-xs">{option.label.split(' ')[0]}</span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {voiceOptions.find(opt => opt.value === voiceType)?.description}
              </p>
            </div>
          </div>

          <Button
            onClick={handleButtonClick}
            disabled={isGenerating || !lyrics.trim() || !genre}
            variant="hero"
            size="lg"
            className="w-full text-xl py-6"
          >
            {isGenerating ? (
              <>
                <Music className="w-6 h-6 animate-spin" />
                Generating Your Song...
              </>
            ) : (
              <>
                <Wand2 className="w-6 h-6" />
                Generate Song with AI
              </>
            )}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Song Title</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Enter a title for your song
                  </label>
                  <Input
                    placeholder="My Amazing Song"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate} disabled={!title.trim()}>
                    Generate Song
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardCard>
  );
};
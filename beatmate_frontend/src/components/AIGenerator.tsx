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
  "Pop", "Hip Hop", "EDM", "Acoustic", "Rock", "Jazz", "Classical", "R&B", "Country", "Alternative"
];

const voiceOptions = [
  { value: "male", label: "Male Voice", icon: Mic, description: "Male vocal performance" },
  { value: "female", label: "Female Voice", icon: Mic, description: "Female vocal performance" },
  { value: "duet", label: "Duet", icon: Users, description: "Male & Female duet" }
];

export const AIGenerator = () => {
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState("");
  const [title, setTitle] = useState("");
  const [voiceType, setVoiceType] = useState("male");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSong, setGeneratedSong] = useState<string | null>(null);
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const [requestStartEpoch, setRequestStartEpoch] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array.from({ length: 16 }, () => 10));
  const waveTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    
    try {
      const response = await fetch('http://localhost:8000/api/generate-song', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lyrics, 
          genre, 
          duration: 60, // Fixed duration
          title: title,
          voiceType: voiceType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setGeneratedSong(data.song_url);
      toast({
        title: "🎵 Song Generated!",
        description: "Your AI-generated song is being processed. Check back in a few minutes.",
      });

      // Poll for the completed song
      checkForCompletedSong();
    } catch (error) {
      console.error('Error generating song:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const checkForCompletedSong = async () => {
    let attempts = 0;
    const intervalMs = 5000; // 5 seconds
    const maxAttempts = 60; // up to ~5 minutes
    
    const poll = async () => {
      try {
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
            // Notify other widgets (RecentSongs/MySongs) to refresh
            window.dispatchEvent(new CustomEvent('song-generated'));
            toast({
              title: "🎵 Song Ready!",
              description: "Your song is now ready to play!",
            });
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        } else {
          toast({
            title: "⏰ Processing Taking Longer",
            description: "Your song is still being processed. Please check 'My Songs' later.",
          });
        }
      } catch (error) {
        console.error('Error checking for completed song:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        }
      }
    };
    
    // Start polling after short delay to allow backend to process
    setTimeout(poll, intervalMs);
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
    <DashboardCard glowColor="ai" className="h-full">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-ai rounded-lg">
            <Wand2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Music Generator</h2>
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
              className="min-h-[120px] bg-input/50 border-border/50 focus:border-ai-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Genre
              </label>
              <Select value={genre} onValueChange={setGenre}>
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
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
            </DialogTrigger>
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

          {(generatedSong || songUrl) && (
            <div className="p-4 bg-card border border-border/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {title || "Generated Song"}
                </h3>
                {songUrl && (
                  <div className="text-xs text-green-500">Ready to play</div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={togglePlayback}
                  variant="ai"
                  size="sm"
                  disabled={!songUrl}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                {/* Wave visualization */}
                <div className="flex-1">
                  {songUrl ? (
                    <div className="h-10 flex items-end gap-1">
                      {waveHeights.map((h, i) => (
                        <div key={i} className="w-1 bg-gradient-ai rounded-sm" style={{ height: isPlaying ? `${h}%` : '10%' }} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Processing... This may take a few minutes</div>
                  )}
                </div>
                
                <Button
                  onClick={downloadSong}
                  variant="outline"
                  size="sm"
                  disabled={!songUrl}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress time */}
              {songUrl && (
                <div className="text-xs text-muted-foreground">
                  {Math.floor(currentTime / 60)}:{`${Math.floor(currentTime % 60)}`.padStart(2,'0')} / {Math.floor(duration / 60)}:{`${Math.floor(duration % 60)}`.padStart(2,'0')}
                </div>
              )}
              
              {songUrl && (
                <audio
                  ref={audioRef}
                  src={songUrl}
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
                  onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};
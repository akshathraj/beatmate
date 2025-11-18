import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, FileText, Music2, Volume2, SkipBack, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardCard } from "./DashboardCard";
import { songApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface SongItem {
  filename: string;
  title?: string;
  size: number;
  created_at?: number;
  download_url: string;
  album_art_url?: string;
}

export const MusicPlayer = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const song = songs[currentIndex] || null;
  
  // Get user's display name
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "You";

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const data = await songApi.getSongs();
      const list: SongItem[] = data.songs || [];
      setSongs(list);
      // Only reset index if it's out of bounds or if this is the initial load
      setCurrentIndex((prevIndex) => {
        if (list.length === 0) return 0;
        // If current index is out of bounds, reset to 0
        if (prevIndex >= list.length) return 0;
        // Otherwise, keep the current index
        return prevIndex;
      });
    } catch (e) {
      // ignore silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    
    // Listen for song generation completion
    const handleSongGenerated = () => {
      fetchSongs();
    };
    
    window.addEventListener('song-generated', handleSongGenerated);
    
    return () => {
      window.removeEventListener('song-generated', handleSongGenerated);
    };
  }, []);

  useEffect(() => {
    // Setup audio element
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsAudioReady(true);
    });

    audio.addEventListener('canplay', () => {
      setIsAudioReady(true);
    });

    audio.addEventListener('timeupdate', () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Auto play next song
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % (songs.length || 1);
        return songs.length > 0 ? nextIndex : prev;
      });
    });

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    const onRefresh = () => fetchSongs();
    window.addEventListener('song-generated', onRefresh);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      window.removeEventListener('song-generated', onRefresh);
    };
  }, [isDragging]);

  useEffect(() => {
    if (song && audioRef.current) {
      // Use stream_url (direct Supabase URL) instead of download_url (which requires auth)
      const url = (song as any).stream_url || `http://localhost:8000${song.download_url}`;
      const wasPlaying = isPlaying;
      
      setIsAudioReady(false);
      audioRef.current.src = url;
      audioRef.current.load();
      
      // Resume playing if it was playing before
      if (wasPlaying) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !song) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        toast({ 
          title: 'Playback Error', 
          description: 'Unable to play. Try downloading the song.', 
          variant: 'destructive' 
        });
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !progressBarRef.current || !isAudioReady) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    const wasPlaying = !audio.paused;
    
    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Resume playing if it was playing before
      if (wasPlaying) {
        audio.play().catch(() => {
          toast({ 
            title: 'Playback Error', 
            description: 'Unable to resume playback.', 
            variant: 'destructive' 
          });
        });
      }
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleProgressClick(e);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  const handleNext = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentIndex(nextIndex);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    if (songs.length === 0) return;
    // If more than 3 seconds played, restart current song, else go to previous
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } else {
      const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentTime(0);
    }
  };

  const downloadSong = async () => {
    if (!song) return;
    try {
      // Use the authenticated API to download
      const blob = await songApi.downloadSong((song as any).id || song.filename);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = song.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Download Started', description: `Downloading ${song.title || song.filename}` });
    } catch (error) {
      toast({ 
        title: 'Download Failed', 
        description: 'Unable to download song', 
        variant: 'destructive' 
      });
    }
  };

  const downloadLyrics = async () => {
    if (!song) return;
    
    try {
      const songWithLyrics = song as any;
      
      // Check if lyrics URL is available
      if (!songWithLyrics.lyrics_url) {
        toast({ 
          title: 'Lyrics Not Found', 
          description: 'No lyrics file available for this song.', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Download from Supabase URL
      const res = await fetch(songWithLyrics.lyrics_url);
      if (!res.ok) {
        throw new Error('Failed to fetch lyrics');
      }

      const blob = await res.blob();
      const songName = (song.title || song.filename).replace('.mp3', '');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${songName}_lyrics.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast({ title: 'Lyrics Downloaded', description: `Downloaded lyrics for ${songName}` });
    } catch (e) {
      toast({ 
        title: 'Download Failed', 
        description: 'Unable to download lyrics.', 
        variant: 'destructive' 
      });
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <DashboardCard glowColor="songs" className="h-full w-full" compact>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-songs rounded-lg">
              <Music2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Music Player</h2>
              <p className="text-muted-foreground text-sm">Most recent creations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {songs.length > 0 && `${currentIndex + 1} / ${songs.length}`}
            </span>
            <Button variant="outline" size="sm" onClick={fetchSongs} disabled={isLoading}>
              {isLoading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
        </div>

        {!song ? (
          <div className="p-8 bg-card/30 border border-border/30 rounded-xl text-center">
            <Music2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" />
            <p className="text-sm text-muted-foreground">No songs available yet</p>
            <p className="text-xs text-muted-foreground mt-1">Generate your first song to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main Player Container */}
            <div className="relative bg-gradient-to-br from-card/60 to-card/30 border border-primary/20 rounded-2xl p-4 backdrop-blur-sm overflow-hidden">
              {/* Animated Background Glow */}
              <div className={`absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 ${isPlaying ? 'animate-pulse' : ''}`} />
              
              <div className="relative space-y-4">
                {/* Album Art & Info Section */}
                <div className="flex items-start gap-4">
                  {/* Album Art with Animation */}
                  <div className="relative group flex-shrink-0">
                    <div className={`relative w-24 h-24 rounded-xl overflow-hidden shadow-xl border-2 border-primary/30 transition-all duration-500 ${isPlaying ? 'scale-105 shadow-primary/50 border-primary/60' : ''}`}>
                      {song.album_art_url ? (
                        <img 
                          src={song.album_art_url}
                          alt={song.title || song.filename}
                          className={`w-full h-full object-cover ${isPlaying ? 'scale-110' : ''} transition-transform duration-1000`}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <Music2 className={`w-12 h-12 text-primary ${isPlaying ? 'animate-spin-slow' : 'animate-pulse'}`} />
                        </div>
                      )}
                      
                      {/* Playing Indicator */}
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="flex gap-0.5 items-end">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="w-1 bg-primary rounded-full animate-pulse"
                                style={{
                                  height: `${12 + i * 6}px`,
                                  animationDelay: `${i * 0.15}s`,
                                  animationDuration: '0.6s'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Song Info & Controls */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Song Title & Artist */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground truncate mb-0.5 animate-fade-in">
                        {song.title || song.filename.replace('.mp3', '')}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {userName}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div 
                        ref={progressBarRef}
                        className="relative h-1.5 bg-border/40 rounded-full cursor-pointer group overflow-hidden"
                        onClick={handleProgressClick}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleProgressDrag}
                      >
                        {/* Progress Fill with Gradient */}
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-100 shadow-lg shadow-primary/30 group-hover:h-2"
                          style={{ width: `${progress}%` }}
                        />
                        
                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Playhead Indicator */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-primary/50 opacity-0 group-hover:opacity-100 transition-all duration-200 ring-2 ring-primary"
                          style={{ left: `calc(${progress}% - 6px)` }}
                        />
                      </div>

                      {/* Time Display */}
                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span className="tabular-nums">{formatTime(currentTime)}</span>
                        <span className="tabular-nums">{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Control Buttons Row */}
                    <div className="flex items-center justify-between gap-1">
                      {/* Playback Controls */}
                      <div className="flex items-center gap-1">
                        {/* Previous Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handlePrevious}
                          disabled={songs.length <= 1}
                          className="rounded-full hover:scale-110 hover:bg-primary/10 hover:text-primary transition-all duration-200 disabled:opacity-30 h-8 w-8"
                          title="Previous"
                        >
                          <SkipBack className="w-3.5 h-3.5" />
                        </Button>

                        {/* Main Play/Pause Button */}
                        <Button
                          size="lg"
                          onClick={togglePlayPause}
                          className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-primary/60 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {isPlaying ? (
                            <Pause className="w-4 h-4 text-black relative z-10" />
                          ) : (
                            <Play className="w-4 h-4 text-black ml-0.5 relative z-10" />
                          )}
                        </Button>

                        {/* Next Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNext}
                          disabled={songs.length <= 1}
                          className="rounded-full hover:scale-110 hover:bg-primary/10 hover:text-primary transition-all duration-200 disabled:opacity-30 h-8 w-8"
                          title="Next"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </Button>

                        {/* Secondary Controls */}
                        <div className="flex items-center gap-1 ml-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={downloadSong}
                            className="rounded-full hover:scale-110 hover:bg-primary/10 hover:text-primary transition-all duration-200 h-7 w-7"
                            title="Download Song"
                          >
                            <Download className="w-3 h-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={downloadLyrics}
                            className="rounded-full hover:scale-110 hover:bg-accent/10 hover:text-accent transition-all duration-200 h-7 w-7"
                            title="Download Lyrics"
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Volume Control - Compact */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-muted"
                          onClick={() => {
                            if (audioRef.current) {
                              const newVolume = volume > 0 ? 0 : 1;
                              setVolume(newVolume);
                              audioRef.current.volume = newVolume;
                            }
                          }}
                          title={volume > 0 ? "Mute" : "Unmute"}
                        >
                          <Volume2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => {
                            const newVolume = parseFloat(e.target.value);
                            setVolume(newVolume);
                            if (audioRef.current) audioRef.current.volume = newVolume;
                          }}
                          className="w-12 h-1 bg-border/40 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all"
                          style={{
                            background: `linear-gradient(to right, hsl(var(--primary)) ${volume * 100}%, hsl(var(--border) / 0.4) ${volume * 100}%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};


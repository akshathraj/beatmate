import { useEffect, useState, useRef } from "react";
import { Music, Play, Pause, Download, MoreVertical, Loader2, User, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { songApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Song = {
  id: string;
  filename: string;
  title: string;
  genre?: string;
  duration?: number;
  created_at: string;
  download_url: string;
  stream_url: string;
  album_art_url?: string;
};

const CreationsGrid = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Record<string, number>>({});
  const [duration, setDuration] = useState<Record<string, number>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  
  // Get user's display name
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "You";

  // Fetch user's songs
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const data = await songApi.getSongs();
        setSongs((data?.songs || []) as Song[]);
      } catch (error) {
        console.error("Error fetching songs:", error);
        toast.error("Failed to load your songs");
      } finally {
        setIsLoading(false);
      }
    };

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

  const formatTime = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>, songId: string) => {
    const audio = audioRefs.current[songId];
    if (!audio || !duration[songId]) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration[songId];
    
    audio.currentTime = newTime;
    setCurrentTime(prev => ({ ...prev, [songId]: newTime }));
  };

  const handleDownloadSong = async (song: Song) => {
    try {
      const blob = await songApi.downloadSong(song.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = song.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloading ${song.title || song.filename}`);
    } catch (error) {
      toast.error("Failed to download song");
    }
  };

  const handleDownloadLyrics = async (song: Song) => {
    const songWithLyrics = song as any;
    
    if (!songWithLyrics.lyrics_url) {
      toast.error('No lyrics available for this song');
      return;
    }

    try {
      const res = await fetch(songWithLyrics.lyrics_url);
      if (!res.ok) throw new Error('Failed to fetch lyrics');

      const blob = await res.blob();
      const songName = (song.title || song.filename).replace('.mp3', '');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${songName}_lyrics.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success(`Downloaded lyrics for ${songName}`);
    } catch (error) {
      toast.error('Failed to download lyrics');
    }
  };

  const handleDeleteClick = (song: Song) => {
    setSongToDelete(song);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!songToDelete) return;

    setIsDeleting(true);
    try {
      // Stop playing if this song is playing
      if (playingId === songToDelete.id) {
        const audio = audioRefs.current[songToDelete.id];
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        setPlayingId(null);
      }

      // Delete from backend (which also deletes from Supabase)
      await songApi.deleteSong(songToDelete.id);
      
      // Remove from local state
      setSongs(prev => prev.filter(s => s.id !== songToDelete.id));
      
      // Clean up audio ref
      delete audioRefs.current[songToDelete.id];
      
      toast.success(`Deleted "${songToDelete.title || songToDelete.filename}"`);
    } catch (error) {
      toast.error('Failed to delete song');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSongToDelete(null);
    }
  };

  const togglePlay = (song: Song) => {
    // Stop any currently playing song
    if (playingId && playingId !== song.id) {
      const prevAudio = audioRefs.current[playingId];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    // Get or create audio element for this song
    let audio = audioRefs.current[song.id];
    if (!audio) {
      audio = new Audio(song.stream_url);
      audioRefs.current[song.id] = audio;

      // Set up event listeners
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(prev => ({ ...prev, [song.id]: audio.currentTime }));
      });

      audio.addEventListener('loadedmetadata', () => {
        setDuration(prev => ({ ...prev, [song.id]: audio.duration }));
      });

      audio.addEventListener('ended', () => {
        setPlayingId(null);
        setCurrentTime(prev => ({ ...prev, [song.id]: 0 }));
      });
    }

    // Toggle play/pause
    if (playingId === song.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.play();
      setPlayingId(song.id);
      toast.success(`Playing ${song.title || song.filename}`);
    }
  };

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading your creations...</span>
        </div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h2 className="text-3xl font-bold bg-gradient-ai bg-clip-text text-transparent">
            Your Creations
          </h2>
          <p className="text-muted-foreground mt-2">
            No songs yet. Start creating!
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 transition-all duration-300 hover:translate-x-2">
        <h2 className="text-3xl font-bold bg-gradient-ai bg-clip-text text-transparent transition-all duration-300 hover:scale-105 inline-block">
          Your Creations
        </h2>
        <p className="text-muted-foreground mt-2 transition-colors duration-300 hover:text-accent">
          {songs.length} {songs.length === 1 ? 'track' : 'tracks'} generated
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {songs.map((song, index) => {
          const isPlaying = playingId === song.id;
          const progress = duration[song.id] 
            ? (currentTime[song.id] || 0) / duration[song.id] * 100 
            : 0;
          const curr = currentTime[song.id] || 0;
          const dur = duration[song.id] || 0;

          return (
            <div
              key={song.id}
              className="bg-card rounded-xl p-4 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-glow group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Album Art with Play Button and Progress Bar */}
              <div className="relative mb-4 aspect-square rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                {song.album_art_url ? (
                  <img 
                    src={song.album_art_url} 
                    alt={song.title || song.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-16 h-16 text-accent transition-all duration-300" />
                )}
                
                {/* Dark Overlay on Hover or Playing */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                
                {/* Waveform Animation (when playing) */}
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex gap-1 items-end">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-primary/60 rounded-full animate-pulse"
                          style={{
                            height: `${20 + Math.random() * 30}px`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '0.6s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Play/Pause Button at Center of Album Art */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay(song);
                    }}
                    className={`bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-full w-16 h-16 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                      isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </Button>
                </div>

                {/* Progress Bar Overlay at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-8 pb-3 px-3">
                  <div className="flex items-center gap-2">
                    {/* Start Time */}
                    <span className="text-[10px] text-white/90 tabular-nums min-w-[30px] font-medium">
                      {formatTime(curr)}
                    </span>

                    {/* Progress Bar */}
                    <div 
                      className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative backdrop-blur-sm"
                      onClick={(e) => handleProgressClick(e, song.id)}
                    >
                      {/* Progress Fill */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-100 shadow-lg shadow-primary/50"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* End Time */}
                    <span className="text-[10px] text-white/90 tabular-nums min-w-[30px] text-right font-medium">
                      {formatTime(dur)}
                    </span>
                  </div>
                </div>
              </div>

            {/* Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-all duration-300 group-hover:translate-x-1">
                  {song.title || song.filename.replace('.mp3', '')}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-secondary transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-95"
                    >
                      <MoreVertical className="w-4 h-4 transition-transform duration-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border-border animate-fade-in" align="end">
                    <DropdownMenuItem 
                      onClick={() => handleDownloadSong(song)}
                      className="hover:bg-secondary hover:text-accent cursor-pointer transition-all duration-200 hover:translate-x-1"
                    >
                      <Download className="w-4 h-4 mr-2 transition-transform duration-300 hover:scale-110" />
                      Download Song
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDownloadLyrics(song)}
                      className="hover:bg-secondary hover:text-accent cursor-pointer transition-all duration-200 hover:translate-x-1"
                    >
                      <FileText className="w-4 h-4 mr-2 transition-transform duration-300 hover:scale-110" />
                      Download Lyrics
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(song)}
                      className="hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-all duration-200 hover:translate-x-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2 transition-transform duration-300 hover:scale-110" />
                      Delete Song
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                <span className="flex items-center gap-1 transition-transform duration-300 group-hover:translate-x-1">
                  <User className="w-3 h-3 transition-transform duration-300 group-hover:scale-125" />
                  {userName}
                </span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">{formatDate(song.created_at)}</span>
              </div>
              {song.genre && (
                <div className="text-xs text-muted-foreground capitalize">
                  {song.genre}
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Song?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete "<strong>{songToDelete?.title || songToDelete?.filename}</strong>"? 
              <br />
              <br />
              This will permanently remove the song, lyrics, and album art from your library and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-border hover:bg-secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreationsGrid;


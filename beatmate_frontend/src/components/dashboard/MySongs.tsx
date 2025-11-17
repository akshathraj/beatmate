import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "./DashboardCard";
import { Music2, Play, Download, Heart, MoreHorizontal, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MusicPlayerPopup } from "./MusicPlayerPopup";
import { supabase } from "@/lib/supabase";

interface Song {
  filename: string;
  size: number;
  download_url: string;
  title?: string;
  liked: boolean;
}

export const MySongs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      let result: any[] = [];
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('http://localhost:8000/api/my-songs', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const json = await res.json();
          result = json.songs || [];
          const mapped = result.map((s: any) => ({
            filename: s.storage_path?.split("/").pop() || (s.title || "song") + ".mp3",
            size: s.size || 0,
            download_url: s.download_url, // may be absolute signed URL
            title: s.title || "",
            liked: false,
          }));
          setSongs(mapped);
        } else {
          setSongs([]);
        }
      } else {
        const response = await fetch('http://localhost:8000/api/songs');
        if (response.ok) {
          const data = await response.json();
          const songsWithLiked = data.songs.map((song: any) => ({
            ...song,
            liked: false,
            title: song.title || song.filename.replace('.mp3', '').replace(/_\d+$/g, '')
          }));
          setSongs(songsWithLiked);
        }
        // As an extra fallback, try public Supabase songs
        if (result.length === 0 && songs.length === 0) {
          const res = await fetch('http://localhost:8000/api/public-songs');
          if (res.ok) {
            const json = await res.json();
            const mapped = (json.songs || []).map((s: any) => ({
              filename: s.filename,
              size: s.size || 0,
              download_url: s.download_url,
              title: s.title || "",
              liked: false,
            }));
            setSongs(mapped);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast({
        title: "Error",
        description: "Failed to load songs from server.",
        variant: "destructive",
      });
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

  const toggleLike = (filename: string) => {
    setSongs(songs.map(song => 
      song.filename === filename ? { ...song, liked: !song.liked } : song
    ));
  };

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlayerOpen(true);
    // Autoplay when popup opens
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(error => {
          console.error('Error playing audio:', error);
          toast({
            title: "Playback Error",
            description: "Failed to play the song. Please try downloading it instead.",
            variant: "destructive",
          });
        });
      }
    }, 0);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Failed to play the song. Please try again.",
          variant: "destructive",
        });
      });
    }
  };

  const downloadSong = (song: Song) => {
    const isAbsolute = /^https?:\/\//i.test(song.download_url as any);
    const downloadUrl = isAbsolute ? (song.download_url as any) : `http://localhost:8000${song.download_url}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = song.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "⬇️ Downloading",
      description: `Downloading: ${song.title}`,
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <DashboardCard glowColor="songs" className="h-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-songs rounded-lg">
              <Music2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Songs</h2>
              <p className="text-muted-foreground">
                {isLoading ? 'Loading...' : `${songs.length} songs created`}
              </p>
            </div>
          </div>
          <Button
            onClick={fetchSongs}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-3">
          {songs.map((song) => (
            <div
              key={song.filename}
              className="p-4 bg-card/30 border border-border/30 rounded-lg hover:bg-card/50 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    onClick={() => playSong(song)}
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 rounded-full"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{song.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(song.size)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{song.filename}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => toggleLike(song.filename)}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        song.liked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                  
                  <Button
                    onClick={() => downloadSong(song)}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="w-8 h-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      {currentSong && (
        <audio
          ref={audioRef}
          src={/^https?:\/\//i.test(currentSong.download_url as any) ? (currentSong.download_url as any) : `http://localhost:8000${currentSong.download_url}`}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      <MusicPlayerPopup
        isOpen={isPlayerOpen}
        onOpenChange={(open) => {
          setIsPlayerOpen(open);
          if (!open && isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }}
        songUrl={currentSong ? (/^https?:\/\//i.test(currentSong.download_url as any) ? (currentSong.download_url as any) : `http://localhost:8000${currentSong.download_url}`) : ""}
        songTitle={currentSong?.title || "Generated Song"}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        audioRef={audioRef}
      />

        {songs.length === 0 && (
          <div className="text-center py-12">
            <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No songs created yet</p>
            <p className="text-sm text-muted-foreground">Start generating music to see your creations here!</p>
          </div>
        )}

        <Button variant="songs" size="lg" className="w-full">
          <Music2 className="w-5 h-5" />
          View All Songs
        </Button>
      </div>
    </DashboardCard>
  );
};
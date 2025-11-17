import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Music2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardCard } from "./DashboardCard";
import { supabase } from "@/lib/supabase";

interface SongItem {
  filename: string;
  title?: string;
  size: number;
  created_at?: number;
  download_url: string;
  album_art_url?: string;
}

export const RecentSongs = () => {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      let list: SongItem[] = [];
      // Try user-specific list from Supabase via backend
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const resp = await fetch('http://localhost:8000/api/my-songs', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (resp.ok) {
          const json = await resp.json();
          // Map to expected shape, synthesizing filename for UI keys
          list = (json.songs || []).map((s: any) => ({
            filename: s.storage_path?.split("/").pop() || (s.title || "song") + ".mp3",
            title: s.title,
            size: s.size || 0,
            created_at: Date.parse(s.created_at || "") / 1000 || undefined,
            download_url: s.download_url, // likely an absolute signed URL
            album_art_url: s.album_art_url || undefined
          }));
        }
      }
      // Fallback to public Supabase songs (if not logged in)
      if (list.length === 0) {
        const res = await fetch('http://localhost:8000/api/public-songs');
        if (res.ok) {
          const data = await res.json();
          list = (data.songs || []) as SongItem[];
        }
      }
      // Fallback to local files listing
      if (list.length === 0) {
        const res = await fetch('http://localhost:8000/api/songs');
        if (res.ok) {
          const data = await res.json();
          list = data.songs || [];
        }
      }
      // Take top 4 unique songs by filename/title
      const seen = new Set<string>();
      const unique: SongItem[] = [];
      for (const s of list) {
        const key = (s.title || s.filename).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(s);
        }
        if (unique.length >= 4) break;
      }
      setSongs(unique);
    } catch (e) {
      // ignore silently on dashboard
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    // Setup a single audio instance
    audioRef.current = new Audio();
    const audio = audioRef.current;
    if (audio) {
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
    }
    const onRefresh = () => fetchSongs();
    window.addEventListener('song-generated', onRefresh);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      }
      window.removeEventListener('song-generated', onRefresh);
    };
  }, []);

  // Render themed container regardless of count to keep UI consistent

  const play = (song: SongItem) => {
    const audio = audioRef.current;
    if (!audio) return;

    const isAbsolute = /^https?:\/\//i.test(song.download_url);
    const url = isAbsolute ? song.download_url : `http://localhost:8000${song.download_url}`;

    // If clicking same song, toggle play/pause
    if (currentFile === song.filename) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {
          toast({ title: 'Playback Error', description: 'Unable to play. Try download.', variant: 'destructive' });
        });
      }
      return;
    }

    // New song: stop any current and start the new one
    try {
      audio.pause();
      audio.src = url;
      audio.load();
      audio.play().then(() => {
        setCurrentFile(song.filename);
        setIsPlaying(true);
      }).catch(() => {
        toast({ title: 'Playback Error', description: 'Unable to play. Try download.', variant: 'destructive' });
      });
    } catch (e) {
      toast({ title: 'Playback Error', description: 'Unable to play. Try download.', variant: 'destructive' });
    }
  };

  const download = (song: SongItem) => {
    const link = document.createElement('a');
    const isAbsolute = /^https?:\/\//i.test(song.download_url);
    link.href = isAbsolute ? song.download_url : `http://localhost:8000${song.download_url}`;
    link.download = song.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardCard glowColor="songs" className="h-full w-full" compact>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-songs rounded-lg">
              <Music2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Songs</h2>
              <p className="text-muted-foreground">Your latest creations</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSongs} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>

        {songs.length === 0 ? (
          <div className="p-4 bg-card/30 border border-border/30 rounded-lg">
            <p className="text-sm text-muted-foreground">No recent songs yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {songs.map((song, idx) => (
              <Card key={song.filename} className="bg-card/30 border border-border/30 rounded-lg overflow-hidden hover:bg-card/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 cursor-pointer group">
                {/* Album art or vinyl record */}
                <div className="h-24 w-full flex items-center justify-center bg-gradient-songs/20 group-hover:bg-gradient-songs/30 transition-colors duration-300">
                  {song.album_art_url ? (
                    <img 
                      src={/^https?:\/\//i.test(song.album_art_url) ? song.album_art_url : `http://localhost:8000${song.album_art_url}`}
                      alt={song.title || song.filename}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-gray-800 to-black border-4 border-gray-700 shadow-inner group-hover:rotate-45 transition-transform duration-500">
                      <div className="absolute inset-3 rounded-full border border-gray-600/40"></div>
                      <div className="absolute inset-5 rounded-full border border-gray-600/20"></div>
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 ${[
                        'bg-red-600 border-yellow-300',
                        'bg-blue-600 border-cyan-300',
                        'bg-green-600 border-lime-300',
                        'bg-purple-600 border-pink-300'
                      ][idx % 4]}`}></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-black rounded-full"></div>
                    </div>
                  )}
                </div>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm truncate text-foreground group-hover:text-primary transition-colors duration-300">{song.title || song.filename.replace('.mp3','')}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0 pb-3">
                  <Button 
                    size="sm" 
                    variant={currentFile === song.filename && isPlaying ? "default" : "outline"}
                    onClick={() => play(song)}
                    className="rounded-full hover:scale-110 transition-transform duration-200 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => download(song)}
                    className="hover:scale-110 transition-transform duration-200 hover:text-primary"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
};



import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Music2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardCard } from "./DashboardCard";

interface SongItem {
  filename: string;
  title?: string;
  size: number;
  created_at?: number;
  download_url: string;
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
      const res = await fetch('http://localhost:8000/api/songs');
      if (!res.ok) return;
      const data = await res.json();
      const list: SongItem[] = data.songs || [];
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

    const url = `http://localhost:8000${song.download_url}`;

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
    link.href = `http://localhost:8000${song.download_url}`;
    link.download = song.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardCard glowColor="songs" className="h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-songs rounded-lg">
              <Music2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Recent Songs</h3>
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
              <Card key={song.filename} className="bg-card/30 border border-border/30 rounded-lg overflow-hidden hover:bg-card/50 transition-colors">
                {/* Themed header with vinyl */}
                <div className="h-24 w-full flex items-center justify-center bg-gradient-songs/20">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-gray-800 to-black border-4 border-gray-700 shadow-inner">
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
                </div>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm truncate text-foreground">{song.title || song.filename.replace('.mp3','')}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0 pb-3">
                  <Button 
                    size="sm" 
                    variant={currentFile === song.filename && isPlaying ? "default" : "outline"}
                    onClick={() => play(song)}
                    className="rounded-full"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => download(song)}>
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



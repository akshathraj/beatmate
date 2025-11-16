import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Upload, Play, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Song {
  filename: string;
  title: string;
  size: number;
  created_at: number;
  download_url: string;
  album_art_url?: string;
}

interface SongSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (filename: string) => void;
}

export const SongSelectionDialog = ({ open, onOpenChange, onSelect }: SongSelectionDialogProps) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchSongs();
    }
  }, [open]);

  const fetchSongs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/songs");
      const data = await response.json();
      setSongs(data.songs || []);
    } catch (error) {
      toast({
        title: "Failed to load songs",
        description: "Could not fetch songs from library",
        variant: "destructive",
      });
    }
  };

  const handleSelect = () => {
    if (selectedSong) {
      onSelect(selectedSong);
    } else if (uploadFile) {
      // Handle upload logic if needed
      toast({
        title: "Upload not yet implemented",
        description: "Please select from library",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            Select Song
          </DialogTitle>
          <DialogDescription>
            Choose a song from your library or upload your own
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              Upload your own song
            </p>
            <Input
              type="file"
              accept="audio/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="max-w-sm mx-auto"
            />
          </div>

          {/* Library Songs */}
          <div>
            <h3 className="font-semibold mb-3">Generated Songs Library</h3>
            <div className="grid grid-cols-1 gap-3">
              {songs.map((song) => (
                <button
                  key={song.filename}
                  onClick={() => setSelectedSong(song.filename)}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    selectedSong === song.filename
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  {/* Album Art or Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    {song.album_art_url ? (
                      <img
                        src={`http://localhost:8000${song.album_art_url}`}
                        alt={song.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Music className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{song.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {(song.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>

                  {/* Play Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`http://localhost:8000${song.download_url}`, "_blank");
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>

                  {/* Selected Check */}
                  {selectedSong === song.filename && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {songs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No songs in library yet</p>
                <p className="text-sm">Generate some songs first!</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedSong && !uploadFile}
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            Select Song
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

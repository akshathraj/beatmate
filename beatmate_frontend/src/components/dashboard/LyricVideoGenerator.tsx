import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Maximize2, Download, Music, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DashboardCard } from "./DashboardCard";
import { SongSelectionDialog } from "./SongSelectionDialog";
import { VisualSelectionDialog } from "./VisualSelectionDialog";
import { videoApi } from "@/lib/api";

export const LyricVideoGenerator = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [showSongDialog, setShowSongDialog] = useState(false);
  const [showVisualDialog, setShowVisualDialog] = useState(false);
  const [showMaximized, setShowMaximized] = useState(false);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your video",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSong) {
      toast({
        title: "Song required",
        description: "Please select a song",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBackground) {
      toast({
        title: "Background required",
        description: "Please select a visual background",
        variant: "destructive",
      });
      return;
    }

    setShowTitleDialog(false);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("song_filename", selectedSong);
      formData.append("background_filename", selectedBackground);

      const data = await videoApi.generateLyricVideo(formData);

      if (data.status === "success") {
        setVideoUrl(`http://localhost:8000${data.video_url}`);
        toast({
          title: "🎬 Video Generated!",
          description: "Your lyric video is ready to play!",
        });
      } else {
        throw new Error(data.detail || "Generation failed");
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMaximize = () => {
    // Pause the minimized video before opening maximized view
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowMaximized(true);
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${title || "video"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "⬇️ Downloading",
        description: "Your video is being downloaded...",
      });
    }
  };

  return (
    <>
      <DashboardCard glowColor="collab" className="h-full w-full">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-collab-primary to-collab-secondary rounded-lg">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Lyric Video Generator</h2>
              <p className="text-muted-foreground">Create stunning lyric videos</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Video Player - Always Visible */}
            <div className="relative aspect-video rounded-lg bg-black border border-border/50 overflow-hidden group">
              {videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                      onClick={handleMaximize}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-muted/20">
                  <div className="text-center">
                    <Film className="w-16 h-16 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Media Player</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Video will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selection Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Song
                </label>
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-input/50 border-border/50"
                  onClick={() => setShowSongDialog(true)}
                >
                  <Music className="w-4 h-4" />
                  {selectedSong ? "✓ Selected" : "Choose Song"}
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Visual
                </label>
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-input/50 border-border/50"
                  onClick={() => setShowVisualDialog(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                  {selectedBackground ? "✓ Selected" : "Choose Visual"}
                </Button>
              </div>
            </div>

            {/* Generate Button with Title Dialog */}
            <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
              <DialogTrigger asChild>
                <Button
                  disabled={isGenerating || !selectedSong || !selectedBackground}
                  variant="hero"
                  size="lg"
                  className="w-full text-xl py-6"
                  onClick={() => {
                    // Auto-fill title with selected song filename (without .mp3 extension)
                    if (selectedSong) {
                      const songTitle = selectedSong.replace('.mp3', '');
                      setTitle(songTitle);
                    }
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Film className="w-6 h-6 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Film className="w-6 h-6" />
                      Generate Lyric Video
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Video Title</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Enter a title for your video
                    </label>
                    <Input
                      placeholder="My Lyric Video"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTitleDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={!title.trim()}>
                      Generate Video
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </DashboardCard>

      {/* Maximized Video Dialog */}
      {videoUrl && (
        <Dialog open={showMaximized} onOpenChange={setShowMaximized}>
          <DialogContent className="max-w-4xl">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Song Selection Dialog */}
      <SongSelectionDialog
        open={showSongDialog}
        onOpenChange={setShowSongDialog}
        onSelect={(filename) => {
          setSelectedSong(filename);
          setShowSongDialog(false);
        }}
      />

      {/* Visual Selection Dialog */}
      <VisualSelectionDialog
        open={showVisualDialog}
        onOpenChange={setShowVisualDialog}
        onSelect={(filename) => {
          setSelectedBackground(filename);
          setShowVisualDialog(false);
        }}
      />
    </>
  );
};


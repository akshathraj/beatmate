import { useState } from "react";
import { Upload, X, Music, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PostComposerProps {
  onPost: (title: string, file: File | null) => void;
}

export const PostComposer = ({ onPost }: PostComposerProps) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isAudio = selectedFile.type.startsWith("audio/");
      const isVideo = selectedFile.type.startsWith("video/");
      
      if (isAudio || isVideo) {
        setFile(selectedFile);
        toast.success(`${isVideo ? "Video" : "Audio"} file selected`);
      } else {
        toast.error("Please select an audio or video file");
      }
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      onPost(title, file);
      setTitle("");
      setFile(null);
      setUploading(false);
      setProgress(0);
      toast.success("Song posted successfully!");
    }, 2000);
  };

  return (
    <div className="glass-card rounded-xl p-6 border border-accent/30 mb-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Music className="w-5 h-5 text-primary" />
        Share Your Music
      </h3>

      <Input
        placeholder="Enter song title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4 glass-card border-accent/30 focus:border-primary"
      />

      <div className="mb-4">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-accent/40 rounded-lg cursor-pointer hover:border-primary/60 transition-all bg-accent/5 hover:bg-accent/10"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">Audio or Video files</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="audio/*,video/*"
            onChange={handleFileChange}
          />
        </label>

        {file && (
          <div className="mt-3 flex items-center justify-between p-3 glass-card rounded-lg border border-primary/30">
            <div className="flex items-center gap-2">
              {file.type.startsWith("video/") ? (
                <Video className="w-5 h-5 text-primary" />
              ) : (
                <Music className="w-5 h-5 text-primary" />
              )}
              <span className="text-sm text-foreground">{file.name}</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-1 hover:bg-destructive/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-destructive" />
            </button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 neon-glow"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <Button
        onClick={handlePost}
        disabled={uploading || !title.trim()}
        className="w-full bg-gradient-to-r from-primary to-accent text-black font-semibold hover:opacity-90 transition-all neon-glow"
      >
        {uploading ? "Posting..." : "Post Song"}
      </Button>
    </div>
  );
};


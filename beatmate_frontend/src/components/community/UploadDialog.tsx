import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Music2, Video, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (title: string, file: File) => void;
}

export const UploadDialog = ({ open, onOpenChange, onUpload }: UploadDialogProps) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isAudio = selectedFile.type.startsWith('audio/');
      const isVideo = selectedFile.type.startsWith('video/');
      
      if (!isAudio && !isVideo) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio or video file.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your upload.",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "File required",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    onUpload(title, file);
    
    toast({
      title: "Upload successful!",
      description: "Your track has been shared with the community.",
    });

    // Reset form
    setTitle('');
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-card border-primary/30 backdrop-blur-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-3xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Upload Your Track
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Share your music with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-medium">Track Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your track a name..."
              className="glass-input h-12 text-base border-primary/20 focus:border-accent/50"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="file" className="text-base font-medium">Audio or Video File</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                className="glass-input h-12 cursor-pointer border-primary/20 focus:border-accent/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
              />
              {file && (
                <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                    {file.type.startsWith('audio/') ? (
                      <Music2 className="w-5 h-5 text-accent" />
                    ) : (
                      <Video className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 border-primary/20 hover:bg-primary/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 h-12 gap-2 bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white font-semibold shadow-lg shadow-accent/20"
          >
            <Upload className="w-5 h-5" />
            Share Track
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


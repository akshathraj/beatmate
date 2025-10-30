import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Background {
  filename: string;
  url: string;
}

interface VisualSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (filename: string) => void;
}

export const VisualSelectionDialog = ({ open, onOpenChange, onSelect }: VisualSelectionDialogProps) => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchBackgrounds();
    }
  }, [open]);

  const fetchBackgrounds = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/backgrounds");
      const data = await response.json();
      setBackgrounds(data.backgrounds || []);
    } catch (error) {
      toast({
        title: "Failed to load backgrounds",
        description: "Could not fetch background images",
        variant: "destructive",
      });
    }
  };

  const handleSelect = () => {
    if (selectedBg) {
      onSelect(selectedBg);
    } else if (uploadFile) {
      toast({
        title: "Upload not yet implemented",
        description: "Please select from available backgrounds",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" />
            Select Visual Background
          </DialogTitle>
          <DialogDescription>
            Choose a background for your lyric video
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Default Backgrounds Grid */}
          <div>
            <h3 className="font-semibold mb-3">Available Backgrounds</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {backgrounds.map((bg) => (
                <button
                  key={bg.filename}
                  onClick={() => setSelectedBg(bg.filename)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedBg === bg.filename
                      ? "border-primary ring-4 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <img
                    src={`http://localhost:8000${bg.url}`}
                    alt={bg.filename}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selected Overlay */}
                  {selectedBg === bg.filename && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-2">
                        <Check className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              ))}

              {/* Upload Custom Background */}
              <div className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center p-4">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Upload Custom
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            {backgrounds.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No backgrounds available</p>
                <p className="text-sm mt-1">
                  Add bg1.jpg, bg2.jpg, and bg3.jpg to files/backgrounds/ folder
                </p>
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
            disabled={!selectedBg && !uploadFile}
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            Select Background
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


import { Music, Upload, Sparkles, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onUploadClick: () => void;
}

export const Header = ({ onUploadClick }: HeaderProps) => {
  return (
    <header className="glass-card sticky top-0 z-50 border-b border-primary/20 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 animate-glow-pulse">
              <Music className="w-7 h-7 text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold glow-text bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                BeatMate Social
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Share Your Sound
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
            <Button 
              onClick={onUploadClick} 
              size="lg"
              className="gap-2 bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white font-semibold px-6 shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all duration-300 hover:scale-105"
            >
              <Upload className="w-5 h-5" />
              Upload Track
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};


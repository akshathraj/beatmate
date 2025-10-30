import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { Menu, Home, Users, CreditCard, Music } from "lucide-react";
import { useState } from "react";

export const NavigationMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative border-primary/50 bg-primary/10 hover:bg-primary/20 hover:border-primary text-primary hover:text-primary"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] glass-card border-primary/30">
        <SheetHeader>
          <SheetTitle className="text-2xl bg-gradient-ai bg-clip-text text-transparent">
            Navigation
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <Link 
            to="/" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 group border border-transparent hover:border-primary/30"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Dashboard</h3>
              <p className="text-sm text-muted-foreground">Your music studio</p>
            </div>
          </Link>

          <Link 
            to="/community" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 group border border-transparent hover:border-primary/30"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Community</h3>
              <p className="text-sm text-muted-foreground">Share & discover music</p>
            </div>
          </Link>

          <Link 
            to="/subscription" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 group border border-transparent hover:border-primary/30"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Subscribe</h3>
              <p className="text-sm text-muted-foreground">Upgrade to premium</p>
            </div>
          </Link>

          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-5 h-5 text-accent" />
              <h4 className="font-semibold">BeatMate Studio</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Create, share, and discover amazing music with AI
            </p>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};


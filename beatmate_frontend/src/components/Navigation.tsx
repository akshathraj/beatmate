import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Home, Users, CreditCard, Music, UserCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const NavigationMenu = () => {
  const [open, setOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully!");
      setOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

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
            to="/dashboard" 
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

          <Link 
            to="/profile" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 group border border-transparent hover:border-primary/30"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">My Profile</h3>
              <p className="text-sm text-muted-foreground">Manage your account</p>
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

          {/* User Info & Sign Out */}
          {user && (
            <div className="mt-4 pt-4 border-t border-border/20">
              <div className="mb-3 px-4">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full justify-start gap-4 p-4 h-auto border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 text-destructive hover:text-destructive"
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Sign Out</h3>
                  <p className="text-sm opacity-70">End your session</p>
                </div>
              </Button>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};


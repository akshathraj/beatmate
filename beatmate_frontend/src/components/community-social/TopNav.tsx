import { Search, Music, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from "./NotificationDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const TopNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get user display info
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const userPhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass-card border-b border-border z-50 px-6">
      <div className="flex items-center justify-between h-full">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-accent/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
              <Music className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Beatmate Social</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search songs, artists..."
              className="pl-10 glass-card border-accent/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <NotificationDropdown />

          <Avatar 
            className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => navigate("/profile")}
          >
            {userPhoto ? (
              <AvatarImage src={userPhoto} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-black font-bold">
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </div>
    </header>
  );
};

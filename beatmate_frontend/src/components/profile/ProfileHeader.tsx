import { useState, useRef, useEffect } from "react";
import { Camera, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ProfileHeader = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data from Google authentication
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "User");
      setEmail(user.email || "");
      setProfilePhoto(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
    }
  }, [user]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        toast.success("Profile photo updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = (field: string) => {
    toast.success(`${field} updated successfully!`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="bg-card rounded-2xl p-8 shadow-xl border border-border/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Photo */}
          <div className="relative group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-accent to-primary p-1 hover:shadow-glow cursor-pointer transition-all duration-300 hover:scale-105 hover:rotate-2">
              <div className="w-full h-full rounded-xl bg-secondary flex items-center justify-center overflow-hidden relative">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <User className="w-16 h-16 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <button
              onClick={triggerFileInput}
              className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-12 active:scale-95"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-6">
            {/* Name */}
            <div className="space-y-2 transition-all duration-300 hover:translate-x-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-accent transition-transform duration-300 hover:scale-125 hover:rotate-12" />
                Name
              </label>
              {isEditingName ? (
                <div className="flex gap-2 animate-fade-in">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-border/50 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      setIsEditingName(false);
                      handleSave("Name");
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-2xl font-bold text-foreground hover:text-accent transition-all duration-300 text-left group hover:translate-x-2"
                >
                  {name}
                  <span className="ml-2 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 inline-block group-hover:scale-125">
                    ✏️
                  </span>
                </button>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2 transition-all duration-300 hover:translate-x-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary transition-transform duration-300 hover:scale-125 hover:-rotate-12" />
                Email (from Google)
              </label>
              <div className="text-foreground text-left">
                {email}
              </div>
              <p className="text-xs text-muted-foreground">Email is managed by your Google account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;


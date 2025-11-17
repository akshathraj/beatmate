import { useState, useRef, useEffect } from "react";
import { Camera, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ProfileHeader = () => {
  const [name, setName] = useState("Your Name");
  const [email, setEmail] = useState("you@example.com");
  const [phone, setPhone] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Supabase user profile (from Google or email/pass)
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const displayName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || name;
        const photo = (user.user_metadata?.avatar_url as string) || (user.user_metadata?.picture as string) || null;
        setName(displayName || name);
        setEmail(user.email || email);
        // Try DB profile first
        const { data: rows } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (rows) {
          if (rows.display_name) setName(rows.display_name);
          if (rows.phone) setPhone(rows.phone);
          if (rows.avatar_path) {
            setAvatarPath(rows.avatar_path);
            const signed = await supabase.storage.from("avatars").createSignedUrl(rows.avatar_path, 60 * 60);
            if (!signed.error) setProfilePhoto(signed.data.signedUrl);
          }
        } else {
          // Seed a profile row for this user (upsert will create if not exists)
          await supabase.from("profiles").upsert({ id: user.id, display_name: displayName || null }).select().single();
        }
        // Fallback to Google metadata photo if no stored avatar
        if (!profilePhoto && photo) setProfilePhoto(photo);
      }
    };
    loadUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please login to update your profile photo");
          return;
        }
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type || "image/*" });
        if (uploadErr) throw uploadErr;
        setAvatarPath(path);
        const signed = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
        if (!signed.error) setProfilePhoto(signed.data.signedUrl);
        await supabase.from("profiles").upsert({ id: user.id, avatar_path: path });
        toast.success("Profile photo updated!");
      } catch (e: any) {
        toast.error(e?.message || "Failed to upload photo");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (field: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to save your profile");
        return;
      }
      const payload: any = { id: user.id };
      if (field === "Name") payload.display_name = name;
      if (field === "Email") {
        // Email is managed by Supabase Auth; keep display only
        toast.info("Email comes from your sign-in provider");
        return;
      }
      if (field === "Phone") payload.phone = phone;
      await supabase.from("profiles").upsert(payload);
      toast.success(`${field} updated successfully!`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    }
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
                Email
              </label>
              {isEditingEmail ? (
                <div className="flex gap-2 animate-fade-in">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border/50 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      setIsEditingEmail(false);
                      handleSave("Email");
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingEmail(true)}
                  className="text-foreground hover:text-primary transition-all duration-300 text-left group hover:translate-x-2"
                >
                  {email}
                  <span className="ml-2 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 inline-block group-hover:scale-125">
                    ✏️
                  </span>
                </button>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2 transition-all duration-300 hover:translate-x-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent transition-transform duration-300 hover:scale-125 hover:rotate-12" />
                Phone (Optional)
              </label>
              {isEditingPhone ? (
                <div className="flex gap-2 animate-fade-in">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-secondary border-border/50 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      setIsEditingPhone(false);
                      handleSave("Phone");
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="text-foreground hover:text-accent transition-all duration-300 text-left group hover:translate-x-2"
                >
                  {phone}
                  <span className="ml-2 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 inline-block group-hover:scale-125">
                    ✏️
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;


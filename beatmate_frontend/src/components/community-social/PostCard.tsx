import { Heart, MessageCircle, Share2, Trash2, Play, Pause } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
  id: string;
  userName: string;
  userAvatar: string;
  title: string;
  fileType: "audio" | "video";
  fileUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export const PostCard = ({
  id,
  userName,
  userAvatar,
  title,
  fileType,
  fileUrl,
  timestamp,
  likes: initialLikes,
  comments: initialComments,
  isOwner = false,
  onDelete,
}: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      const handleEnded = () => setIsPlaying(false);
      media.addEventListener("ended", handleEnded);
      return () => media.removeEventListener("ended", handleEnded);
    }
  }, []);

  return (
    <article className="glass-card rounded-xl p-6 border border-accent/20 hover-lift animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-primary/30">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-black font-bold">
              {userAvatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
        </div>

        {isOwner && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(id)}
            className="text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
        
        <div className="glass-card border border-primary/30 rounded-lg overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10">
          {fileUrl ? (
            <div className="relative">
              {fileType === "video" ? (
                <video
                  ref={mediaRef as React.RefObject<HTMLVideoElement>}
                  src={fileUrl}
                  className="w-full max-h-96 object-contain bg-black/20"
                  onClick={togglePlay}
                />
              ) : (
                <div className="p-6 flex flex-col items-center gap-4">
                  <audio
                    ref={mediaRef as React.RefObject<HTMLAudioElement>}
                    src={fileUrl}
                    className="w-full"
                    controls
                  />
                  <div className="w-full h-32 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-pointer hover:scale-110 transition-transform neon-glow">
                      <button onClick={togglePlay}>
                        {isPlaying ? (
                          <Pause className="w-12 h-12 text-black" />
                        ) : (
                          <Play className="w-12 h-12 text-black ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {fileType === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center hover:bg-primary transition-all pointer-events-auto neon-glow"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-black" />
                    ) : (
                      <Play className="w-8 h-8 text-black ml-1" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No media file available</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 hover:bg-accent/10 transition-all ${
              liked ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            <span className="font-medium">{likes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={`gap-2 hover:bg-accent/10 transition-all ${
              showComments ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{initialComments}</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary hover:bg-accent/10 transition-all"
        >
          <Share2 className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </Button>
      </div>

      {/* Comment Section */}
      {showComments && <CommentSection postId={id} />}
    </article>
  );
};

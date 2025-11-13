import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  isOwner: boolean;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

export const CommentSection = ({ postId, initialComments = [] }: CommentSectionProps) => {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (newComment.trim().length > 500) {
      toast.error("Comment must be less than 500 characters");
      return;
    }

    const comment: Comment = {
      id: Date.now().toString(),
      userName: user.name,
      userAvatar: user.avatar,
      text: newComment.trim(),
      timestamp: "Just now",
      isOwner: true,
    };

    setComments([...comments, comment]);
    setNewComment("");
    toast.success("Comment added!");
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
    toast.success("Comment deleted");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      {/* Comment Input */}
      <div className="flex gap-3 mb-4">
        <Avatar className="w-8 h-8 border border-primary/30">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-black text-xs font-bold">
            {user.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={500}
            className="glass-card border-accent/30 focus:border-primary"
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            size="icon"
            className="bg-gradient-to-r from-primary to-accent text-black hover:opacity-90 transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-custom">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8 border border-primary/30">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-black text-xs font-bold">
                  {comment.userAvatar}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 glass-card rounded-lg p-3 border border-accent/20">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {comment.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {comment.timestamp}
                    </p>
                  </div>
                  {comment.isOwner && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 hover:bg-destructive/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


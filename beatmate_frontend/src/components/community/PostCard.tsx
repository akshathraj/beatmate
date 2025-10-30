import { Music2, Video, Play, Calendar, Heart, MessageCircle, Eye, Send } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export interface Post {
  id: string;
  userId: string;
  username: string;
  title: string;
  mediaUrl: string;
  mediaType: 'audio' | 'video';
  timestamp: number;
  likes: string[];
  comments: { id: string; username: string; text: string; timestamp: number }[];
  views: number;
}

interface PostCardProps {
  post: Post;
  onDelete: (postId: string) => void;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onView: (postId: string) => void;
}

export const PostCard = ({ post, onDelete, onLike, onComment, onView }: PostCardProps) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  
  const dateStr = new Date(post.timestamp).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const isLiked = post.likes.includes('current-user');

  const handleLike = () => {
    onLike(post.id);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleMediaInteraction = () => {
    if (!hasViewed) {
      onView(post.id);
      setHasViewed(true);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 hover-glow group relative overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center backdrop-blur-sm border border-primary/20 group-hover:scale-110 transition-transform duration-300">
              {post.mediaType === 'audio' ? (
                <Music2 className="w-7 h-7 text-accent" />
              ) : (
                <Video className="w-7 h-7 text-accent" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl mb-2 text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {post.title}
            </h3>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {post.username}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl overflow-hidden bg-black/40 backdrop-blur-sm p-4 border border-primary/10 group-hover:border-primary/30 transition-colors duration-300">
          {post.mediaType === 'audio' ? (
            <audio 
              controls 
              className="w-full" 
              src={post.mediaUrl}
              onPlay={handleMediaInteraction}
              style={{
                filter: 'hue-rotate(180deg) saturate(1.5)',
              }}
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <video 
              controls 
              className="w-full rounded-lg" 
              src={post.mediaUrl}
              onPlay={handleMediaInteraction}
            >
              Your browser does not support the video element.
            </video>
          )}
        </div>

        {/* Social interactions */}
        <div className="mt-4 space-y-4">
          {/* Like, Comment, View buttons */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 group/like transition-transform hover:scale-110"
            >
              <Heart
                className={`w-6 h-6 transition-all duration-300 ${
                  isLiked
                    ? 'fill-red-500 text-red-500 animate-scale-in'
                    : 'text-muted-foreground group-hover/like:text-red-500'
                }`}
              />
              <span className={`text-sm font-medium ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                {post.likes.length}
              </span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 group/comment transition-transform hover:scale-110"
            >
              <MessageCircle className="w-6 h-6 text-muted-foreground group-hover/comment:text-accent transition-colors" />
              <span className="text-sm font-medium text-muted-foreground">
                {post.comments.length}
              </span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {post.views}
              </span>
            </div>
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="space-y-3 animate-fade-in">
              {/* Comment input */}
              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="glass-input flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                />
                <Button
                  onClick={handleCommentSubmit}
                  size="icon"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Comments list */}
              {post.comments.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="glass-card p-3 rounded-lg animate-slide-up"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {comment.username}
                          </p>
                          <p className="text-sm text-foreground mt-1">{comment.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


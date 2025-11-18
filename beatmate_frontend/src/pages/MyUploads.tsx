import { useState } from "react";
import { PostCard } from "@/components/community-social/PostCard";
import { Layout } from "@/components/community-social/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Music } from "lucide-react";

interface Post {
  id: string;
  userName: string;
  userAvatar: string;
  title: string;
  fileType: "audio" | "video";
  fileUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isOwner: boolean;
}

const MyUploads = () => {
  const { user } = useAuth();
  
  // Get user display info
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const [posts, setPosts] = useState<Post[]>([
    // Sample user posts
    {
      id: "1",
      userName,
      userAvatar: userInitials,
      title: "My First Upload",
      fileType: "audio",
      timestamp: "3 days ago",
      likes: 45,
      comments: 12,
      isOwner: true,
    },
  ]);

  const handleDelete = (id: string) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Music className="w-8 h-8 text-primary" />
            My Uploads
          </h1>
          <p className="text-muted-foreground">
            Manage your shared music and videos
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center border border-accent/20">
            <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No uploads yet
            </h3>
            <p className="text-muted-foreground">
              Share your first track on the home feed to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyUploads;
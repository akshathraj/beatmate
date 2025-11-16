import { useState } from "react";
import { PostComposer } from "@/components/community-social/PostComposer";
import { PostCard } from "@/components/community-social/PostCard";
import { Layout } from "@/components/community-social/Layout";
import { useUser } from "@/contexts/UserContext";

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

const Community = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      userName: "DJ Nova",
      userAvatar: "DN",
      title: "Electric Dreams - New Release",
      fileType: "audio",
      timestamp: "2 hours ago",
      likes: 124,
      comments: 23,
      isOwner: false,
    },
    {
      id: "2",
      userName: "Beat Master",
      userAvatar: "BM",
      title: "Midnight Groove Sessions",
      fileType: "video",
      timestamp: "5 hours ago",
      likes: 89,
      comments: 15,
      isOwner: false,
    },
    {
      id: "3",
      userName: "Melody Mix",
      userAvatar: "MM",
      title: "Acoustic Vibes EP",
      fileType: "audio",
      timestamp: "1 day ago",
      likes: 203,
      comments: 42,
      isOwner: false,
    },
  ]);

  const handlePost = (title: string, file: File | null) => {
    let fileUrl: string | undefined;
    
    if (file) {
      fileUrl = URL.createObjectURL(file);
    }

    const newPost: Post = {
      id: Date.now().toString(),
      userName: user.name,
      userAvatar: user.avatar,
      title,
      fileType: file?.type.startsWith("video/") ? "video" : "audio",
      fileUrl,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      isOwner: true,
    };

    setPosts([newPost, ...posts]);
  };

  const handleDelete = (id: string) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <PostComposer onPost={handlePost} />

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              {...post}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Community;

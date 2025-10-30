import { useState, useEffect } from 'react';
import { Header } from '@/components/community/Header';
import { PostCard, Post } from '@/components/community/PostCard';
import { UploadDialog } from '@/components/community/UploadDialog';
import { Music, Waves } from 'lucide-react';

const Community = () => {
  // TODO: DATABASE INTEGRATION - Replace localStorage with Supabase
  // 1. Create 'posts' table in Supabase with columns: id, user_id, username, title, media_url, media_type, timestamp, likes (jsonb), comments (jsonb), views
  // 2. Enable Row Level Security (RLS) policies for the posts table
  // 3. Use Supabase client to fetch posts: const { data: posts } = await supabase.from('posts').select('*').order('timestamp', { ascending: false })
  // 4. Use Supabase realtime subscriptions to listen for new posts
  
  const [posts, setPosts] = useState<Post[]>([
    // Default posts for demonstration
    {
      id: '1',
      userId: 'demo-user-1',
      username: 'DJ Nova',
      title: 'Summer Vibes Mix 2024',
      mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      mediaType: 'audio',
      timestamp: Date.now() - 3600000,
      likes: ['user1', 'user2'],
      comments: [
        {
          id: 'c1',
          username: 'Music Lover',
          text: 'This track is fire! 🔥',
          timestamp: Date.now() - 1800000,
        },
      ],
      views: 127,
    },
    {
      id: '2',
      userId: 'demo-user-2',
      username: 'Beat Master',
      title: 'Late Night Studio Session',
      mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      mediaType: 'audio',
      timestamp: Date.now() - 7200000,
      likes: ['user3'],
      comments: [],
      views: 89,
    },
  ]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // TODO: DATABASE INTEGRATION - Replace with Supabase fetch
  // Load posts from localStorage on mount
  useEffect(() => {
    const storedPosts = localStorage.getItem('musicPosts');
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    }
  }, []);

  // TODO: DATABASE INTEGRATION - Remove localStorage, use Supabase realtime
  // Save posts to localStorage whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('musicPosts', JSON.stringify(posts));
    }
  }, [posts]);

  const handleUpload = (title: string, file: File) => {
    // TODO: DATABASE INTEGRATION - Upload file to Supabase Storage
    // 1. Upload file to Supabase Storage bucket: const { data, error } = await supabase.storage.from('media').upload(`${userId}/${file.name}`, file)
    // 2. Get public URL: const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path)
    // 3. Insert post record into database with the storage URL
    
    // Create object URL for local file preview
    const mediaUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith('audio/') ? 'audio' : 'video';

    const newPost: Post = {
      id: Date.now().toString(),
      userId: 'community-user',
      username: 'Music Creator',
      title,
      mediaUrl,
      mediaType,
      timestamp: Date.now(),
      likes: [],
      comments: [],
      views: 0,
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const handleLike = (postId: string) => {
    // TODO: DATABASE INTEGRATION - Update likes in Supabase
    // await supabase.from('posts').update({ likes: updatedLikesArray }).eq('id', postId)
    
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = post.likes.includes('current-user');
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter((id) => id !== 'current-user')
              : [...post.likes, 'current-user'],
          };
        }
        return post;
      })
    );
  };

  const handleComment = (postId: string, commentText: string) => {
    // TODO: DATABASE INTEGRATION - Insert comment into Supabase
    // await supabase.from('posts').update({ comments: updatedCommentsArray }).eq('id', postId)
    // Or create separate 'comments' table with foreign key to posts
    
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: Date.now().toString(),
            username: 'You',
            text: commentText,
            timestamp: Date.now(),
          };
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );
  };

  const handleView = (postId: string) => {
    // TODO: DATABASE INTEGRATION - Increment view count in Supabase
    // await supabase.rpc('increment_views', { post_id: postId })
    
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            views: post.views + 1,
          };
        }
        return post;
      })
    );
  };

  const handleDelete = (postId: string) => {
    // TODO: DATABASE INTEGRATION - Delete post from Supabase
    // await supabase.from('posts').delete().eq('id', postId)
    // Also delete associated media from Storage
    
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    // Update localStorage after deletion
    const updatedPosts = posts.filter((p) => p.id !== postId);
    if (updatedPosts.length > 0) {
      localStorage.setItem('musicPosts', JSON.stringify(updatedPosts));
    } else {
      localStorage.removeItem('musicPosts');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Header onUploadClick={() => setUploadDialogOpen(true)} />

      <main className="container mx-auto px-6 py-12 relative z-10">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center backdrop-blur-xl border border-primary/30 animate-glow-pulse">
                <Music className="w-16 h-16 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-accent/30 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-primary/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              No Tracks Yet
            </h2>
            <p className="text-muted-foreground text-center max-w-md text-lg flex items-center gap-2">
              <Waves className="w-5 h-5 text-accent" />
              Start the vibe — upload your first track and inspire the community!
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                Community Feed
              </h2>
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <Waves className="w-4 h-4 text-accent" />
                {posts.length} {posts.length === 1 ? 'track' : 'tracks'} shared
              </p>
            </div>
            <div className="space-y-6">
              {posts.map((post, index) => (
                <div key={post.id} style={{ animationDelay: `${index * 0.1}s` }} className="animate-slide-up">
                  <PostCard
                    post={post}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    onComment={handleComment}
                    onView={handleView}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default Community;


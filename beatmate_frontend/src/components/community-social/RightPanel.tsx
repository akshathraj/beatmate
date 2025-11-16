import { TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const RightPanel = () => {
  const suggestedCreators = [
    { name: "DJ Nova", handle: "@djnova", avatar: "DN" },
    { name: "Beat Master", handle: "@beatmaster", avatar: "BM" },
    { name: "Melody Mix", handle: "@melodymix", avatar: "MM" },
    { name: "Sound Wave", handle: "@soundwave", avatar: "SW" },
  ];

  const trendingSongs = [
    { title: "Electric Dreams", artist: "Neon Pulse", plays: "12.5K" },
    { title: "Midnight Groove", artist: "Luna Beats", plays: "10.2K" },
    { title: "Cyber Symphony", artist: "Digital Soul", plays: "8.9K" },
  ];

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 p-6 space-y-6 scrollbar-custom overflow-y-auto">
      {/* Suggested Creators */}
      <div className="glass-card rounded-xl p-5 border border-accent/20">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Suggested Creators</h3>
        </div>

        <div className="space-y-3">
          {suggestedCreators.map((creator, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-black text-xs font-bold">
                    {creator.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{creator.name}</p>
                  <p className="text-xs text-muted-foreground">{creator.handle}</p>
                </div>
              </div>
              <button className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-black transition-all font-medium">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Songs */}
      <div className="glass-card rounded-xl p-5 border border-accent/20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Trending Now</h3>
        </div>

        <div className="space-y-3">
          {trendingSongs.map((song, index) => (
            <div
              key={index}
              className="p-3 rounded-lg hover:bg-accent/10 transition-all cursor-pointer border border-primary/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">{song.title}</p>
                  <p className="text-xs text-muted-foreground">{song.artist}</p>
                </div>
                <span className="text-xs text-primary font-medium">{song.plays}</span>
              </div>
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};


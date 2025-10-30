import { Music, Video, Play, Download, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Creation = {
  id: string;
  type: "audio" | "video";
  title: string;
  duration: string;
  createdAt: string;
  thumbnail?: string;
};

const mockCreations: Creation[] = [
  {
    id: "1",
    type: "audio",
    title: "Ethereal Synthwave",
    duration: "3:42",
    createdAt: "2024-10-25",
  },
  {
    id: "2",
    type: "video",
    title: "Neon Dreams Visualizer",
    duration: "2:18",
    createdAt: "2024-10-24",
  },
  {
    id: "3",
    type: "audio",
    title: "Ambient Space Journey",
    duration: "5:23",
    createdAt: "2024-10-23",
  },
  {
    id: "4",
    type: "video",
    title: "Cyberpunk Beat Drop",
    duration: "1:45",
    createdAt: "2024-10-22",
  },
  {
    id: "5",
    type: "audio",
    title: "Lo-Fi Chill Session",
    duration: "4:12",
    createdAt: "2024-10-21",
  },
  {
    id: "6",
    type: "video",
    title: "Retro Wave Animation",
    duration: "3:05",
    createdAt: "2024-10-20",
  },
];

const CreationsGrid = () => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 transition-all duration-300 hover:translate-x-2">
        <h2 className="text-3xl font-bold bg-gradient-ai bg-clip-text text-transparent transition-all duration-300 hover:scale-105 inline-block">
          Your Creations
        </h2>
        <p className="text-muted-foreground mt-2 transition-colors duration-300 hover:text-accent">
          {mockCreations.length} tracks generated
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCreations.map((creation, index) => (
          <div
            key={creation.id}
            className="bg-card rounded-xl p-4 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-glow group hover:scale-105 hover:-rotate-1 cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Thumbnail/Icon */}
            <div className="relative mb-4 aspect-square rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
              {creation.type === "audio" ? (
                <Music className="w-16 h-16 text-accent group-hover:text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              ) : (
                <Video className="w-16 h-16 text-primary group-hover:text-accent transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                <Button
                  size="icon"
                  className="bg-primary/90 hover:bg-primary text-primary-foreground rounded-full w-14 h-14 shadow-glow transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-90"
                >
                  <Play className="w-6 h-6 fill-current transition-transform duration-300" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-all duration-300 group-hover:translate-x-1">
                  {creation.title}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-secondary transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-95"
                    >
                      <MoreVertical className="w-4 h-4 transition-transform duration-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border-border animate-fade-in">
                    <DropdownMenuItem className="hover:bg-secondary hover:text-accent cursor-pointer transition-all duration-200 hover:translate-x-1">
                      <Download className="w-4 h-4 mr-2 transition-transform duration-300 hover:scale-110" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-secondary hover:text-accent cursor-pointer transition-all duration-200 hover:translate-x-1">
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-secondary hover:text-destructive cursor-pointer transition-all duration-200 hover:translate-x-1">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                <span className="flex items-center gap-1 transition-transform duration-300 group-hover:translate-x-1">
                  {creation.type === "audio" ? (
                    <Music className="w-3 h-3 transition-transform duration-300 group-hover:scale-125" />
                  ) : (
                    <Video className="w-3 h-3 transition-transform duration-300 group-hover:scale-125" />
                  )}
                  {creation.duration}
                </span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">{creation.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreationsGrid;


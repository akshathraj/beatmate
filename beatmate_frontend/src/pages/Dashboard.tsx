import { SongGenerator } from "@/components/dashboard/SongGenerator";
import { RecentSongs } from "@/components/dashboard/RecentSongs";
import { RemixSongs } from "@/components/dashboard/RemixSongs";
import { LyricVideoGenerator } from "@/components/dashboard/LyricVideoGenerator";
import { NavigationMenu } from "@/components/Navigation";
import musicBg from "@/assets/music-bg.jpg";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${musicBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="absolute inset-0 bg-gradient-bg/80" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Hamburger Menu */}
        <header className="p-3 border-b border-border/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-extrabold bg-gradient-ai bg-clip-text text-transparent tracking-tight">
              BeatMate Studio
            </h1>
            <NavigationMenu />
          </div>
        </header>

        {/* Main Dashboard Grid */}
        <main className="p-3">
          <div className="max-w-7xl mx-auto">
            {/* Top Row - Equal Height */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-2">
              <div className="flex">
                <SongGenerator />
              </div>
              <div className="flex">
                <LyricVideoGenerator />
              </div>
            </div>

            {/* Bottom Row - Equal Height - Compact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="flex">
                <RemixSongs />
              </div>
              <div className="flex">
                <RecentSongs />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
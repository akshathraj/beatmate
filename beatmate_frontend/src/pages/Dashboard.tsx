import { AIGenerator } from "@/components/AIGenerator";
import { RecentSongs } from "@/components/RecentSongs";
import { RemixStudio } from "@/components/Collaboration";
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
        {/* Header */}
        <header className="p-3 border-b border-border/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-extrabold bg-gradient-ai bg-clip-text text-transparent tracking-tight">
              BeatMate Studio
            </h1>
          </div>
        </header>

        {/* Main Dashboard Grid */}
        <main className="p-3">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-4">
              <div>
                <RecentSongs />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <AIGenerator />
                </div>
                <div className="lg:col-span-1">
                  <RemixStudio />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
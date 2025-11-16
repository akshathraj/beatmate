const Collaboration = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-left">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Create <span className="text-gradient">Together</span>,<br />
              in Real Time
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Invite friends to join a live session. Chat, brainstorm, and listen as BeatMate creates songs on the spot. 
              Experience the magic of collaborative music creation.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-foreground">Live chat & voice notes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                </div>
                <span className="text-foreground">Real-time song generation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-foreground">Shared music library</span>
              </div>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative animate-fade-in-right">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-subtle">
              {/* Chat Interface */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-bold">M</span>
                  </div>
                  <div className="bg-muted rounded-lg p-3 flex-1">
                    <p className="text-sm">Let's make something chill and dreamy 🌙</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 justify-end mb-4">
                  <div className="bg-primary/20 rounded-lg p-3 flex-1 max-w-xs">
                    <p className="text-sm">Perfect! How about some lo-fi beats?</p>
                  </div>
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-accent-foreground text-sm font-bold">A</span>
                  </div>
                </div>
              </div>

              {/* Music Player */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">Dreamy Lo-Fi Session</h4>
                    <p className="text-xs text-muted-foreground">Generated 2 min ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-primary-foreground text-xs">▶</span>
                    </div>
                  </div>
                </div>
                
                {/* Waveform */}
                <div className="flex items-center space-x-1 h-8">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-primary/60 rounded-full animate-pulse"
                      style={{
                        width: "2px",
                        height: `${Math.random() * 20 + 4}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Collaboration Status */}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>2 collaborators online</span>
                </div>
                <span>Auto-saved</span>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-primary/10 rounded-lg p-2 animate-float">
              <span className="text-xs font-medium">🎵 Real-time sync</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-accent/10 rounded-lg p-2 animate-float" style={{ animationDelay: "1s" }}>
              <span className="text-xs font-medium">💬 Live chat</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Collaboration;

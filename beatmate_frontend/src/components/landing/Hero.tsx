import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center animated-bg overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Turn Ideas into <span className="text-gradient">Music</span> with
              BeatMate
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Write lyrics or describe a mood. BeatMate turns it into a song in
              seconds. Create, collaborate, and share your musical vision
              instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                className="btn-hero text-lg px-8 py-4"
                onClick={() => navigate("/dashboard")}
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                className="btn-secondary text-lg px-8 py-4"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Free forever plan</span>
              </div>
            </div>
          </div>

          {/* Right Content - Music Visualization */}
          <div className="relative animate-fade-in-right">
            <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 shadow-strong">
              <div className="flex flex-col space-y-4">
                {/* Waveform Visualization */}
                <div className="flex items-center space-x-1 h-32 justify-center">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-primary rounded-full animate-pulse"
                      style={{
                        width: "4px",
                        height: `${Math.random() * 80 + 20}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    ></div>
                  ))}
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">🎵 AI-Powered Music Generation</p>
                  <p className="text-sm text-muted-foreground">Create professional songs in seconds</p>
                </div>
              </div>

              {/* Floating UI Elements */}
              <div className="absolute -top-4 -left-4 bg-card border border-border rounded-lg p-3 animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-glow-pulse"></div>
                  <span className="text-sm font-medium">
                    Generating...
                  </span>
                </div>
              </div>

              <div
                className="absolute -bottom-4 -right-4 bg-card border border-border rounded-lg p-3 animate-float"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">🎵 Song Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;




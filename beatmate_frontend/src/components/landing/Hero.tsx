import { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupModal from "./SignupModal";
import heroMockup from "@/assets/hero-mockup.jpg";

const Hero = () => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
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
                onClick={() => setIsSignupOpen(true)}
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                className="btn-secondary text-lg px-8 py-4"
              >
                Watch Demo
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

          {/* Right Content - Video */}
          <div className="relative animate-fade-in-right">
            <div className="relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-10/12 h-auto rounded-2xl shadow-strong glow-primary"
                poster={heroMockup}
              >
                <source src="/myvideo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Floating UI Elements */}
              <div className="absolute -top-4 -left-4 bg-card border border-border rounded-lg p-3 animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-glow-pulse"></div>
                  <span className="text-sm font-medium">
                    BeatMate Generating...
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

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
      />
    </section>
  );
};

export default Hero;

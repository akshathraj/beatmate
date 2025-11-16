import { useState } from "react";
import { Button } from "@/components/ui/button";
import SignupModal from "./SignupModal";

const CTA = () => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-6">
        {/* Free Access Card */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="feature-card">
            <div className="text-4xl mb-6">🎵</div>
            <h3 className="text-2xl font-bold mb-4">
              Start for <span className="text-gradient">Free</span>
            </h3>
            <p className="text-muted-foreground mb-6">
              No credit card required. Create unlimited songs and collaborate with friends.
            </p>
            <Button 
              className="btn-hero text-lg px-8 py-4"
              onClick={() => setIsSignupOpen(true)}
            >
              Sign Up Free
            </Button>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Your music. Your way.<br />
            <span className="text-gradient">Powered by BeatMate.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the future of music creation. Turn your ideas into songs, collaborate in real-time, 
            and share your creativity with the world.
          </p>
          
          <Button 
            className="btn-hero text-xl px-12 py-6 mb-8"
            onClick={() => setIsSignupOpen(true)}
          >
            Start Creating Now
          </Button>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>No installation required</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Modal */}
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </section>
  );
};

export default CTA;

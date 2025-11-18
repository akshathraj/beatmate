import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import OurTeamModal from "./OurTeamModal";

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center logo-rotate">              <span className="text-primary-foreground font-bold text-lg">🎵</span>
            </div>
            <span className="text-xl font-bold text-gradient">BeatMate</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </button>
            <button
              onClick={() => setIsTeamOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Our Team
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button 
                className="btn-hero"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            ) : (
              <GoogleSignInButton 
                className="btn-hero"
                text="Sign in with Google"
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <OurTeamModal isOpen={isTeamOpen} onClose={() => setIsTeamOpen(false)} />
    </header>
  );
};

export default LandingHeader;
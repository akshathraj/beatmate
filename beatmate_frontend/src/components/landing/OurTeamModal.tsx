import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface OurTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OurTeamModal = ({ isOpen, onClose }: OurTeamModalProps) => {
  const teamMembers = [
    {
      name: "Devansh",
      designation: "Chief Beat Wizard 🎵",
      avatar: "D",
      gradient: "from-primary to-accent",
      image: "/1.jpg",
    },
    {
      name: "Akshath",
      designation: "Melody Alchemist ✨",
      avatar: "A",
      gradient: "from-accent to-primary",
      image: "/2.jpg",
    },
    {
      name: "Supreet",
      designation: "Rhythm Architect 🎹",
      avatar: "S",
      gradient: "from-primary via-accent to-primary",
      image: "/3.jpg",
    },
    {
      name: "Kalp",
      designation: "Sound Sorcerer 🎧",
      avatar: "K",
      gradient: "from-accent via-primary to-accent",
      image: "/4.jpg",
    },
    {
      name: "Yash",
      designation: "Harmony Maestro 🎼",
      avatar: "Y",
      gradient: "from-primary to-accent",
      image: "/5.jpg",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] bg-card/95 backdrop-blur-xl border-primary/30 rounded-3xl shadow-[0_0_80px_rgba(0,212,255,0.4)] p-0 overflow-hidden [&>button]:hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-muted/50 hover:bg-muted border border-border flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90 group"
        >
          <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-5xl lg:text-6xl font-bold mb-4 text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              Our Creative Team
            </h2>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-primary to-accent rounded-full animate-pulse-glow"></div>
            <p className="text-xl text-muted-foreground mt-6 max-w-2xl">
              Meet the talented minds behind BeatMate's revolutionary music creation platform
            </p>
          </div>

          {/* Team Members Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-16 w-full max-w-7xl">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="flex flex-col items-center animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Avatar Bubble */}
                <div className="relative group mb-6">
                  {/* Outer Glow Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500 animate-glow-pulse"></div>
                  
                  {/* Main Bubble */}
                  <div
                    className={`relative w-44 h-44 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-[0_0_40px_rgba(0,212,255,0.3)] border-2 border-primary/50 overflow-hidden`}
                  >
                    {member.image ? (
                      <>
                        {/* Team Member Image */}
                        <img
                          src={member.image}
                          alt={member.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-20 mix-blend-overlay`}></div>
                      </>
                    ) : (
                      <>
                        {/* Inner Glass Effect */}
                        <div className="absolute inset-2 rounded-full bg-card/30 backdrop-blur-sm"></div>
                        
                        {/* Avatar Text */}
                        <span className="relative z-10 text-5xl font-bold text-foreground drop-shadow-glow">
                          {member.avatar}
                        </span>
                      </>
                    )}

                    {/* Musical Note Animation */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-bounce shadow-glow z-20">
                      <span className="text-sm">🎵</span>
                    </div>
                  </div>
                  
                  {/* Bottom Reflection */}
                  <div
                    className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-12 bg-gradient-to-b ${member.gradient} opacity-20 blur-2xl rounded-full`}
                  ></div>
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-foreground mb-1 text-center">
                  {member.name}
                </h3>

                {/* Designation */}
                <p className="text-base text-muted-foreground text-center font-medium">
                  {member.designation}
                </p>
              </div>
            ))}
          </div>

          {/* Fun Footer Note */}
          <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "0.8s" }}>
            <p className="text-sm text-muted-foreground italic">
              "Creating the future of music, one beat at a time" 🎶
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OurTeamModal;


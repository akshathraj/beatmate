import { Music2 } from "lucide-react";

const BackgroundEffects = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[hsl(180,100%,10%)] to-black" />
      
      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(192,100%,50%,0.1)] via-transparent to-[hsl(174,100%,45%,0.1)] animate-pulse-glow" />
      
      {/* Floating Musical Notes */}
      <div className="absolute top-20 left-[10%] animate-float opacity-20">
        <Music2 className="w-8 h-8 text-primary" />
      </div>
      <div className="absolute top-40 right-[15%] animate-float-slow opacity-15">
        <Music2 className="w-6 h-6 text-secondary" />
      </div>
      <div className="absolute bottom-32 left-[20%] animate-float opacity-10">
        <Music2 className="w-10 h-10 text-accent" />
      </div>
      <div className="absolute bottom-20 right-[25%] animate-float-slow opacity-20">
        <Music2 className="w-7 h-7 text-primary" />
      </div>
      
      {/* Equalizer Bars */}
      <div className="absolute top-10 right-10 flex gap-1 items-end h-20 opacity-30">
        <div className="w-2 bg-gradient-to-t from-primary to-secondary rounded-full animate-equalizer" />
        <div className="w-2 bg-gradient-to-t from-primary to-secondary rounded-full animate-equalizer-2" />
        <div className="w-2 bg-gradient-to-t from-primary to-secondary rounded-full animate-equalizer-3" />
        <div className="w-2 bg-gradient-to-t from-primary to-secondary rounded-full animate-equalizer" />
        <div className="w-2 bg-gradient-to-t from-primary to-secondary rounded-full animate-equalizer-2" />
      </div>
      
      {/* Sound Wave Lines */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-wave" />
      <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary/10 to-transparent animate-wave" style={{ animationDelay: "1s" }} />
      
      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px]" />
    </div>
  );
};

export default BackgroundEffects;


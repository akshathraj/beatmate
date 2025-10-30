import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "ai" | "collab" | "songs";
}

export const DashboardCard = ({ children, className, glowColor }: DashboardCardProps) => {
  const glowClasses = {
    ai: "shadow-glow hover:shadow-intense",
    collab: "shadow-[0_0_30px_hsl(var(--collab-primary)/0.3)] hover:shadow-[0_0_50px_hsl(var(--collab-primary)/0.5)]",
    songs: "shadow-[0_0_30px_hsl(var(--songs-primary)/0.3)] hover:shadow-[0_0_50px_hsl(var(--songs-primary)/0.5)]",
  };

  return (
    <Card
      className={cn(
        "bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-500 hover:scale-[1.02]",
        glowColor && glowClasses[glowColor],
        className
      )}
    >
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
};
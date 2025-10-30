import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Feature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  features: Feature[];
  ctaText: string;
  isPremium?: boolean;
}

const PricingCard = ({ 
  title, 
  subtitle, 
  price, 
  period, 
  features, 
  ctaText, 
  isPremium = false 
}: PricingCardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-3xl p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2",
        "border border-border/50 bg-gradient-to-br from-card/70 to-card/50",
        "shadow-[0_10px_40px_rgba(0,0,0,0.5)]",
        isPremium && "scale-105 border-primary/50 shadow-[0_0_50px_rgba(0,212,255,0.3)]",
        isPremium && "animate-glow-pulse"
      )}
    >
      {/* Glow Effect for Premium */}
      {isPremium && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl opacity-20 blur-xl -z-10" />
      )}
      
      {/* Card Header */}
      <div className="text-center mb-8">
        <h3 className={cn(
          "text-3xl font-bold mb-2",
          isPremium && "bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]"
        )}>
          {title}
        </h3>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      
      {/* Pricing */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-bold text-foreground">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
      </div>
      
      {/* Features List */}
      <div className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
            )}
            <span className={cn(
              "text-sm",
              feature.included ? "text-foreground" : "text-muted-foreground/70"
            )}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>
      
      {/* CTA Button */}
      <Button
        className={cn(
          "w-full h-12 text-base font-semibold rounded-xl transition-all duration-300",
          "shadow-lg hover:shadow-xl hover:scale-105",
          isPremium 
            ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,212,255,0.5)]" 
            : "bg-muted/50 hover:bg-muted text-foreground border border-border/50"
        )}
      >
        {ctaText}
      </Button>
    </div>
  );
};

export default PricingCard;


import BackgroundEffects from "@/components/subscription/BackgroundEffects";
import PricingCard from "@/components/subscription/PricingCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Subscription = () => {
  const freePlanFeatures = [
    { text: "10 songs / month", included: true },
    { text: "Multi-lingual generation", included: true },
    { text: "Remix", included: false },
    { text: "Lyric-video", included: false },
    { text: "Community posting", included: false },
  ];

  const premiumPlanFeatures = [
    { text: "100 songs / month", included: true },
    { text: "Multi-lingual generation", included: true },
    { text: "Remix tool", included: true },
    { text: "Lyric-video generation", included: true },
    { text: "Community posting & sharing", included: true },
    { text: "All future tools included", included: true },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden font-['Inter_Tight']">
      <BackgroundEffects />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Button 
            asChild 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 hover:translate-x-1"
          >
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
            Choose Your Plan
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full" />
        </header>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-16">
          <PricingCard
            title="Free"
            subtitle="For casual creators"
            price="$0"
            period="/ month"
            features={freePlanFeatures}
            ctaText="Get Started"
          />
          
          <PricingCard
            title="Premium"
            subtitle="For serious creators"
            price="$8"
            period="/ month"
            features={premiumPlanFeatures}
            ctaText="Upgrade Now"
            isPremium
          />
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-muted-foreground text-sm">
            Cancel anytime. No hidden fees.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Subscription;


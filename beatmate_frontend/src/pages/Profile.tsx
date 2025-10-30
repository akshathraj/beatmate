import ProfileHeader from "@/components/profile/ProfileHeader";
import CreationsGrid from "@/components/profile/CreationsGrid";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-bg" />
      
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto mb-8">
          <Button 
            asChild 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 hover:translate-x-1"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-ai bg-clip-text text-transparent transition-all duration-500 hover:scale-105 inline-block cursor-default">
              My Profile
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto transition-all duration-300 hover:text-accent hover:scale-105">
              Manage your generative music creations and profile settings
            </p>
          </div>

          {/* Profile Section */}
          <ProfileHeader />

          {/* Creations Section */}
          <CreationsGrid />
        </div>
      </div>
    </div>
  );
};

export default Profile;


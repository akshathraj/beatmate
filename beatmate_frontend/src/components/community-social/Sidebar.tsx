import { Home, Upload, User } from "lucide-react";
import { NavLink } from "./NavLink";

export const Sidebar = () => {
  const navItems = [
    { icon: Home, label: "Home Feed", path: "/community" },
    { icon: Upload, label: "My Uploads", path: "/community/my-uploads" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 glass-card border-r border-border p-6 scrollbar-custom overflow-y-auto">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-muted-foreground hover:text-primary hover:bg-accent/10"
            activeClassName="text-primary bg-accent/20 font-medium"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 p-4 glass-card rounded-lg border border-accent/30">
        <h3 className="text-sm font-semibold text-primary mb-2">Beatmate Social</h3>
        <p className="text-xs text-muted-foreground">
          Share your music with the world. Connect with creators.
        </p>
      </div>
    </aside>
  );
};


import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  user: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export const NotificationDropdown = () => {
  const notifications: Notification[] = [
    {
      id: "1",
      type: "like",
      user: "DJ Nova",
      userAvatar: "DN",
      content: "liked your song 'Summer Vibes Mix'",
      timestamp: "5m ago",
      read: false,
    },
    {
      id: "2",
      type: "comment",
      user: "Beat Master",
      userAvatar: "BM",
      content: "commented on your video",
      timestamp: "1h ago",
      read: false,
    },
    {
      id: "3",
      type: "follow",
      user: "Melody Mix",
      userAvatar: "MM",
      content: "started following you",
      timestamp: "2h ago",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-primary" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-primary" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-primary" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent/10 transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full text-black text-xs font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 glass-card border-accent/30 bg-popover backdrop-blur-xl z-50"
      >
        <DropdownMenuLabel className="text-foreground font-semibold">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/30" />

        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-4 cursor-pointer focus:bg-accent/10 ${
                !notification.read ? "bg-accent/5" : ""
              }`}
            >
              <div className="flex gap-3 w-full">
                <Avatar className="w-10 h-10 border border-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-black text-xs font-bold">
                    {notification.userAvatar}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    {getIcon(notification.type)}
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{notification.user}</span>{" "}
                      {notification.content}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-border/30" />
            <DropdownMenuItem className="justify-center cursor-pointer text-primary font-medium hover:bg-accent/10">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


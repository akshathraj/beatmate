import { createContext, useContext, useState, ReactNode } from "react";

interface UserProfile {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  photoUrl?: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile>({
    name: "John Smith",
    username: "@johnsmith",
    avatar: "JS",
    bio: "Music producer and DJ from Los Angeles. Specializing in electronic and house music. Always experimenting with new sounds and beats. 🎵",
  });

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

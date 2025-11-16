import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen">
      <TopNav />
      <Sidebar />
      
      <main className="ml-64 mr-80 pt-24 px-8 pb-12">
        {children}
      </main>

      <RightPanel />
    </div>
  );
};


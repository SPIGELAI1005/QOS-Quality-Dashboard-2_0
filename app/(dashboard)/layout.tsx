import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <main className="app-scrollbar flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}


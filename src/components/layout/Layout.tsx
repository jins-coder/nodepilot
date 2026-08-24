import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { useUiStore } from "@/stores";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { terminalOpen } = useUiStore();

  return (
    <div className="h-screen flex bg-bg-base text-text-body overflow-hidden transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-base">
        <Header />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bg-base p-0">
          {children}
        </main>

        {/* Expandable terminal panel */}
        {terminalOpen && <TerminalPanel />}
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

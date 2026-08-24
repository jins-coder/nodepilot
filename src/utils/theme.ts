/**
 * Dynamic theme utility (Dark, Light, System) with View Transition animation
 */

export type ThemeMode = "dark" | "light" | "system";

export function applyTheme(theme: ThemeMode | string) {
  if (typeof document === "undefined") return;

  const update = () => {
    const root = document.documentElement;
    const body = document.body;

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";

      if (body) {
        body.classList.add("dark");
        body.classList.remove("light");
        body.setAttribute("data-theme", "dark");
      }

      root.style.setProperty("--bg-base", "#090a10");
      root.style.setProperty("--bg-surface", "#121420");
      root.style.setProperty("--bg-card", "#161928");
      root.style.setProperty("--bg-tertiary", "#1b1f32");
      root.style.setProperty("--bg-elevated", "#22273e");
      root.style.setProperty("--bg-hover", "#29304c");
      root.style.setProperty("--bg-active", "rgba(99, 102, 241, 0.18)");
      root.style.setProperty("--border-color", "rgba(255, 255, 255, 0.08)");
      root.style.setProperty("--border-subtle", "rgba(255, 255, 255, 0.04)");
      root.style.setProperty("--border-strong", "rgba(255, 255, 255, 0.16)");
      root.style.setProperty("--accent-subtle", "rgba(99, 102, 241, 0.15)");
      root.style.setProperty("--text-heading", "#ffffff");
      root.style.setProperty("--text-body", "#cbd5e1");
      root.style.setProperty("--text-muted", "#94a3b8");
      root.style.setProperty("--text-faint", "#64748b");
      root.style.setProperty("--glow-color", "rgba(99, 102, 241, 0.35)");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";

      if (body) {
        body.classList.add("light");
        body.classList.remove("dark");
        body.setAttribute("data-theme", "light");
      }

      root.style.setProperty("--bg-base", "#f8fafc");
      root.style.setProperty("--bg-surface", "#ffffff");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--bg-tertiary", "#f1f5f9");
      root.style.setProperty("--bg-elevated", "#e2e8f0");
      root.style.setProperty("--bg-hover", "#e2e8f0");
      root.style.setProperty("--bg-active", "rgba(99, 102, 241, 0.1)");
      root.style.setProperty("--border-color", "#e2e8f0");
      root.style.setProperty("--border-subtle", "#f1f5f9");
      root.style.setProperty("--border-strong", "#cbd5e1");
      root.style.setProperty("--accent-subtle", "#e0e7ff");
      root.style.setProperty("--text-heading", "#0f172a");
      root.style.setProperty("--text-body", "#334155");
      root.style.setProperty("--text-muted", "#64748b");
      root.style.setProperty("--text-faint", "#94a3b8");
      root.style.setProperty("--glow-color", "rgba(99, 102, 241, 0.2)");
    }
  };

  // Support modern smooth View Transitions
  if ("startViewTransition" in document) {
    (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(update);
  } else {
    update();
  }
}

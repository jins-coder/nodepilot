import type { NodeVersion } from "@/types";
import { getLtsLabel } from "@/utils/versions";
import { CheckCircle2 } from "lucide-react";

interface VersionBadgesProps {
  version: NodeVersion;
}

export function VersionBadges({ version }: VersionBadgesProps) {
  const ltsLabel = getLtsLabel(version.lts as string | false);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {version.active && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          Active
        </span>
      )}
      {ltsLabel && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          LTS · {ltsLabel}
        </span>
      )}
      {version.current && !ltsLabel && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
          Current
        </span>
      )}
      {version.installed && !version.active && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25">
          <CheckCircle2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
          Installed
        </span>
      )}
    </div>
  );
}

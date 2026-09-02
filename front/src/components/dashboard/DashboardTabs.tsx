import type { LucideIcon } from 'lucide-react';

export interface DashboardTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  activeTab: string;
  onChange: (id: string) => void;
}

const DashboardTabs = ({ tabs, activeTab, onChange }: DashboardTabsProps) => {
  return (
    <>
      {/* Desktop: rail vertical. The active item's left edge carries the
          panel's one signature accent — a filled bg-primary bar, the same
          device the stat tiles and each section's icon chip use — instead of
          a generic pill or full-background fill. */}
      <nav
        className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:gap-1"
        aria-label="Secciones"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl border-l-2 px-4 py-3 text-left font-body text-sm transition-colors duration-200 ${
                isActive
                  ? 'border-primary bg-surface text-text font-semibold'
                  : 'border-transparent text-text-muted hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile: strip horizontal scrolleable */}
      <nav
        className="flex gap-2 overflow-x-auto pb-2 md:hidden"
        aria-label="Secciones"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-body text-sm transition-colors duration-200 ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border text-text-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default DashboardTabs;

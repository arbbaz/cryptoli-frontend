interface SidebarMenuItemProps {
  item: string;
  isActive: boolean;
  onClick: () => void;
}

export default function SidebarMenuItem({ item, isActive, onClick }: SidebarMenuItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex h-10 cursor-pointer items-center justify-between rounded-md px-3 text-xs text-text-secondary transition-colors ${
        isActive
          ? "border-primary-border-active border bg-primary-bg-light"
          : "border-border-lighter bg-bg-lightest hover:border hover:border-primary-border-hover hover:bg-primary-bg-hover"
      }`}
    >
      <span>{item}</span>
      <span className={`text-[11px] font-semibold transition-transform ${isActive ? "rotate-90" : ""}`}>{'>'}</span>
    </div>
  );
}


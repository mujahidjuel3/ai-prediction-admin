import { Avatar } from "@/components/ui/avatar";

interface PersonIdentityProps {
  name: string;
  secondary?: string;
}

export function PersonIdentity({ name, secondary }: PersonIdentityProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{name}</p>
        {secondary ? <p className="truncate text-xs text-slate-500">{secondary}</p> : null}
      </div>
    </div>
  );
}

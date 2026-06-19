import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { formatLabel } from "@/lib/constants";

interface ActivityCardProps {
  subject: string;
  type: string;
  date: Date | string;
  description?: string;
  assignee?: string;
  customer?: string;
  className?: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  CALL: { icon: <Phone className="h-4 w-4" />, color: "bg-blue-100 text-blue-600" },
  MEETING: { icon: <Calendar className="h-4 w-4" />, color: "bg-purple-100 text-purple-600" },
  EMAIL: { icon: <Mail className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-600" },
  TASK: { icon: <CheckSquare className="h-4 w-4" />, color: "bg-amber-100 text-amber-600" },
};

export function ActivityCard({
  subject,
  type,
  date,
  description,
  assignee,
  customer,
  className,
}: ActivityCardProps) {
  const config = typeConfig[type] || typeConfig.TASK;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg p-2", config.color)}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium truncate">{subject}</p>
            <span className="text-xs text-muted-foreground shrink-0">{formatLabel(type)}</span>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span>{formatDate(date)}</span>
            {customer && <span>{customer}</span>}
            {assignee && <span>{assignee}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

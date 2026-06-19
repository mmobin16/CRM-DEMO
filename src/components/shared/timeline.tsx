import { cn, formatDateTime } from "@/lib/utils";
import { Phone, Mail, Calendar, CheckSquare } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  type?: string;
  timestamp: Date | string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  CALL: <Phone className="h-4 w-4" />,
  MEETING: <Calendar className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  TASK: <CheckSquare className="h-4 w-4" />,
  lead: <Phone className="h-4 w-4" />,
  opportunity: <CheckSquare className="h-4 w-4" />,
  customer: <Mail className="h-4 w-4" />,
};

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No activities yet
      </p>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < items.length - 1 && (
            <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
          )}
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {typeIcons[item.type || "TASK"] || typeIcons.TASK}
          </div>
          <div className="flex-1 space-y-1 pt-0.5">
            <p className="text-sm font-medium leading-none">{item.title}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDateTime(item.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

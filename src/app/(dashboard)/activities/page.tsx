"use client";

import { useCallback, useEffect, useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
  addMonths, subMonths, getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, List, CalendarDays } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDate } from "@/lib/utils";
import { formatLabel, ACTIVITY_TYPES } from "@/lib/constants";

interface Activity {
  id: string;
  type: string;
  subject: string;
  description?: string;
  date: string;
  time?: string;
  customer?: { companyName: string };
  assignee?: { name: string };
}

const TYPE_COLORS: Record<string, string> = {
  CALL: "bg-blue-500",
  MEETING: "bg-purple-500",
  TASK: "bg-amber-500",
  EMAIL: "bg-emerald-500",
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    type: "CALL", subject: "", description: "", date: "", time: "",
  });

  const monthStr = format(currentMonth, "yyyy-MM");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/activities?month=${monthStr}`);
    const data = await res.json();
    setActivities(data.activities || []);
    setLoading(false);
  }, [monthStr]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleCreate = async () => {
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
      }),
    });
    setCreateOpen(false);
    setForm({ type: "CALL", subject: "", description: "", date: "", time: "" });
    fetchActivities();
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getActivitiesForDay = (day: Date) =>
    activities.filter((a) => isSameDay(new Date(a.date), day));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Track calls, meetings, emails, and tasks</p>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Log Activity</Button>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-1" /> Calendar</TabsTrigger>
          <TabsTrigger value="list"><List className="h-4 w-4 mr-1" /> List</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="bg-card min-h-[100px] p-2" />
                ))}
                {days.map((day) => {
                  const dayActivities = getActivitiesForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "bg-card min-h-[100px] p-2 transition-colors",
                        !isSameMonth(day, currentMonth) && "opacity-40",
                        isToday && "ring-2 ring-inset ring-primary/30"
                      )}
                    >
                      <p className={cn("text-xs font-medium mb-1", isToday && "text-primary")}>{format(day, "d")}</p>
                      <div className="space-y-1">
                        {dayActivities.slice(0, 3).map((a) => (
                          <div key={a.id} className={cn("rounded px-1.5 py-0.5 text-[10px] text-white truncate", TYPE_COLORS[a.type])}>
                            {a.subject}
                          </div>
                        ))}
                        {dayActivities.length > 3 && (
                          <p className="text-[10px] text-muted-foreground">+{dayActivities.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}</div>
              ) : activities.length === 0 ? (
                <EmptyState title="No activities this month" action={{ label: "Log Activity", onClick: () => setCreateOpen(true) }} />
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-4 rounded-xl border border-border p-4">
                      <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", TYPE_COLORS[a.type])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{a.subject}</p>
                          <StatusBadge status={a.type} />
                        </div>
                        {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(a.date)}{a.time ? ` at ${a.time}` : ""}
                          {a.customer && ` • ${a.customer.companyName}`}
                          {a.assignee && ` • ${a.assignee.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

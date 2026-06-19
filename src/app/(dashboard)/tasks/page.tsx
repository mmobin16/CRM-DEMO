"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor,
  useSensor, useSensors, useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, cn } from "@/lib/utils";
import { formatLabel, TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  progress: number;
  assignee?: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "border-t-slate-400",
  IN_PROGRESS: "border-t-blue-500",
  COMPLETED: "border-t-emerald-500",
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  CRITICAL: "bg-red-500",
};

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id, data: { task } });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
            <p className="text-sm font-medium">{task.title}</p>
          </div>
          {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
          <div className="flex items-center justify-between">
            <StatusBadge status={task.priority} />
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />{formatDate(task.dueDate)}
              </span>
            )}
          </div>
          {task.status === "IN_PROGRESS" && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskColumn({ status, tasks }: { status: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col flex-1 min-w-[300px]">
      <div className={cn("rounded-t-xl border-t-4 bg-muted/30 px-4 py-3", STATUS_COLORS[status])}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{formatLabel(status)}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{tasks.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-3 rounded-b-xl border border-t-0 border-border bg-muted/10 p-3 min-h-[450px]",
          isOver && "bg-primary/5"
        )}
      >
        {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM", dueDate: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus || !TASK_STATUSES.includes(newStatus as typeof TASK_STATUSES[number])) return;

    const progress = newStatus === "COMPLETED" ? 100 : newStatus === "IN_PROGRESS" ? 50 : 0;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus, progress } : t));
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus, progress }),
    });
  };

  const handleCreate = async () => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      }),
    });
    setCreateOpen(false);
    setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
    fetchTasks();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((s) => <div key={s} className="h-[500px] rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag tasks between columns to update status</p>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Task</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((status) => (
            <TaskColumn key={status} status={status} tasks={tasks.filter((t) => t.status === status)} />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

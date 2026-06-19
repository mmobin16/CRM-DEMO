"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Shield, Mail, Settings2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatLabel, ROLES, PERMISSIONS, ROLE_PERMISSIONS,
} from "@/lib/constants";

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  timezone: string;
  currency: string;
  dateFormat: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface SystemPrefs {
  darkMode: boolean;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  autoSave: boolean;
  defaultPageSize: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: "CRM Pro Inc.",
  email: "contact@crmpro.com",
  phone: "+1 (555) 123-4567",
  address: "123 Business Ave, San Francisco, CA 94105",
  website: "https://crmpro.com",
  timezone: "America/Los_Angeles",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
};

const DEFAULT_USERS: UserRecord[] = [
  { id: "1", name: "Admin User", email: "admin@crmpro.com", role: "ADMIN" },
  { id: "2", name: "Sarah Manager", email: "sarah@crmpro.com", role: "SALES_MANAGER" },
  { id: "3", name: "John Executive", email: "john@crmpro.com", role: "SALES_EXECUTIVE" },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { id: "1", name: "Welcome Email", subject: "Welcome to CRM Pro", body: "Dear {{name}},\n\nWelcome to our platform. We're excited to have you on board.\n\nBest regards,\nCRM Pro Team" },
  { id: "2", name: "Quotation Follow-up", subject: "Following up on your quotation", body: "Dear {{name}},\n\nI wanted to follow up on the quotation we sent on {{date}}.\n\nPlease let us know if you have any questions.\n\nBest regards" },
  { id: "3", name: "Meeting Reminder", subject: "Reminder: Upcoming Meeting", body: "Dear {{name}},\n\nThis is a reminder about our meeting scheduled for {{date}} at {{time}}.\n\nLooking forward to speaking with you." },
];

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [users, setUsers] = useState<UserRecord[]>(DEFAULT_USERS);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [prefs, setPrefs] = useState<SystemPrefs>({
    darkMode: false, emailNotifications: true, desktopNotifications: true,
    autoSave: true, defaultPageSize: "10",
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("1");

  useEffect(() => {
    const stored = localStorage.getItem("crm-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.prefs) setPrefs(parsed.prefs);
      } catch { /* ignore */ }
    }
  }, []);

  const showSaved = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  };

  const saveCompany = () => {
    localStorage.setItem("crm-settings", JSON.stringify({ company, prefs }));
    showSaved("company");
  };

  const savePrefs = () => {
    localStorage.setItem("crm-settings", JSON.stringify({ company, prefs }));
    showSaved("prefs");
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Configure your CRM workspace and preferences</p>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="company"><Building2 className="h-4 w-4 mr-1" /> Company Info</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> User Management</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-1" /> Roles & Permissions</TabsTrigger>
          <TabsTrigger value="templates"><Mail className="h-4 w-4 mr-1" /> Email Templates</TabsTrigger>
          <TabsTrigger value="preferences"><Settings2 className="h-4 w-4 mr-1" /> System Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2"><Label>Company Name</Label><Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Website</Label><Input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Phone</Label><Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label>Address</Label><Textarea value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} rows={2} /></div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Timezone</Label>
                  <Select value={company.timezone} onValueChange={(v) => setCompany({ ...company, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="Europe/London">GMT</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={company.currency} onValueChange={(v) => setCompany({ ...company, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date Format</Label>
                  <Select value={company.dateFormat} onValueChange={(v) => setCompany({ ...company, dateFormat: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveCompany}>
                {saved === "company" ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage team members and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Select value={user.role} onValueChange={(v) => setUsers(users.map((u) => u.id === user.id ? { ...u, role: v } : u))}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{formatLabel(r)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Roles & Permissions Matrix</CardTitle>
              <CardDescription>View permission assignments by role</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Permission</th>
                    {ROLES.map((role) => (
                      <th key={role} className="text-center p-3 font-medium">{formatLabel(role)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map((perm) => (
                    <tr key={perm} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{perm}</td>
                      {ROLES.map((role) => {
                        const has = ROLE_PERMISSIONS[role]?.includes(perm);
                        return (
                          <td key={role} className="text-center p-3">
                            <span className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                              has ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                            )}>
                              {has ? "✓" : "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-xl lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Templates</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3 transition-colors",
                      selectedTemplate === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
            {currentTemplate && (
              <Card className="rounded-xl lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Edit Template</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2"><Label>Template Name</Label><Input value={currentTemplate.name} onChange={(e) => setTemplates(templates.map((t) => t.id === currentTemplate.id ? { ...t, name: e.target.value } : t))} /></div>
                  <div className="grid gap-2"><Label>Subject</Label><Input value={currentTemplate.subject} onChange={(e) => setTemplates(templates.map((t) => t.id === currentTemplate.id ? { ...t, subject: e.target.value } : t))} /></div>
                  <div className="grid gap-2"><Label>Body</Label><Textarea value={currentTemplate.body} onChange={(e) => setTemplates(templates.map((t) => t.id === currentTemplate.id ? { ...t, body: e.target.value } : t))} rows={10} className="font-mono text-sm" /></div>
                  <div className="flex gap-2 flex-wrap">
                    {["{{name}}", "{{date}}", "{{time}}", "{{company}}"].map((v) => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">{v}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Customize your CRM experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive email alerts for important events" },
                { key: "desktopNotifications" as const, label: "Desktop Notifications", desc: "Show browser notifications for updates" },
                { key: "autoSave" as const, label: "Auto-save Forms", desc: "Automatically save form drafts" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      prefs[item.key] ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      prefs[item.key] ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
              ))}
              <div className="grid gap-2 max-w-xs">
                <Label>Default Page Size</Label>
                <Select value={prefs.defaultPageSize} onValueChange={(v) => setPrefs({ ...prefs, defaultPageSize: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={savePrefs}>
                {saved === "prefs" ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Preferences</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

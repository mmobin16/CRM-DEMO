"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, UserPlus, Target, Contact } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store";

const typeIcons = {
  lead: UserPlus,
  customer: Building2,
  opportunity: Target,
  contact: Contact,
};

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const { query, results, isSearching, setQuery, setResults, setIsSearching, clearSearch } =
    useSearchStore();
  const [focused, setFocused] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [setResults, setIsSearching]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const showDropdown = focused && query.length >= 2;

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search leads, customers, opportunities..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        className="pl-9 w-full md:w-80 bg-muted/50 border-0 focus-visible:ring-1"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {isSearching ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No results found</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => {
                const Icon = typeIcons[result.type];
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
                    onMouseDown={() => {
                      router.push(result.href);
                      clearSearch();
                    }}
                  >
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

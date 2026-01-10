import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import type { NoteGroup, NoteFolder } from "@/pages/Notes";
import { NotesCategoryDot } from "./NotesCategoryIcon";

export interface NotesFilters {
  groupId: string;
  folderId: string;
  sortBy: "updatedAt" | "createdAt" | "title";
  sortOrder: "asc" | "desc";
  tag: string;
}

interface NotesFilterPanelProps {
  groups: NoteGroup[];
  folders: NoteFolder[];
  tags: string[];
  filters: NotesFilters;
  onFiltersChange: (filters: NotesFilters) => void;
}

export function NotesFilterPanel({ groups, folders, tags, filters, onFiltersChange }: NotesFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    filters.groupId !== "all" || filters.folderId !== "all" || filters.sortBy !== "updatedAt" || filters.tag !== "all";

  const handleReset = () => {
    onFiltersChange({
      groupId: "all",
      folderId: "all",
      sortBy: "updatedAt",
      sortOrder: "desc",
      tag: "all",
    });
  };

  const availableFolders = filters.groupId === "all" ? folders : folders.filter((f) => f.groupId === filters.groupId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Filter className="h-4 w-4" />
          {hasActiveFilters && <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filters</h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Group</Label>
              <Select
                value={filters.groupId}
                onValueChange={(value) => onFiltersChange({ ...filters, groupId: value, folderId: "all" })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <NotesCategoryDot categoryId={group.id} color={group.color} size="sm" />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Folder</Label>
              <Select
                value={filters.folderId}
                onValueChange={(value) => onFiltersChange({ ...filters, folderId: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {availableFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: "updatedAt" | "createdAt" | "title") =>
                  onFiltersChange({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last Edited</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tags.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Tag</Label>
                <Select value={filters.tag} onValueChange={(value) => onFiltersChange({ ...filters, tag: value })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        #{tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

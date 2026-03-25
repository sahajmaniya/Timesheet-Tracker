"use client";

import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTenthsDecimal, formatTime12h, minutesToHM } from "@/lib/time";
import type { TimeEntry } from "@/types/time-entry";

export function EntriesTable({
  entries,
  onEdit,
  onDelete,
}: {
  entries: TimeEntry[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
}) {
  return (
    <Table className="rounded-xl border bg-card">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>In</TableHead>
          <TableHead>Out</TableHead>
          <TableHead>Break</TableHead>
          <TableHead>Worked</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <div className="font-medium">{format(new Date(`${entry.date}T00:00:00`), "MMM d, yyyy")}</div>
              <div className="text-xs text-muted-foreground">{format(new Date(`${entry.date}T00:00:00`), "EEEE")}</div>
            </TableCell>
            <TableCell>{formatTime12h(entry.punchIn)}</TableCell>
            <TableCell>{formatTime12h(entry.punchOut)}</TableCell>
            <TableCell>
              <div>{minutesToHM(entry.breakMinutes)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {entry.breaks.length > 0
                  ? entry.breaks
                      .map((item) => `${formatTime12h(item.start)} - ${formatTime12h(item.end)}`)
                      .join(" | ")
                  : "No break logged"}
              </div>
            </TableCell>
            <TableCell>
              <div className="font-semibold text-primary">{minutesToHM(entry.workedMinutes)}</div>
              <div className="text-xs text-muted-foreground">{formatTenthsDecimal(entry.workedMinutes)} decimal hrs</div>
            </TableCell>
            <TableCell className="max-w-56 truncate text-muted-foreground">{entry.notes || "No notes"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(entry)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

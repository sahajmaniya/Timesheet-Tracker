"use client";

import { format } from "date-fns";
import { CornerDownRight, Pencil, Trash2 } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTime12h, minutesToHM, minutesToTenthsDecimal, workedSegments } from "@/lib/time";
import type { TimeEntry } from "@/types/time-entry";

function PositionBadge({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <span className="mt-1 inline-block max-w-full truncate rounded-full border border-indigo-400/35 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-900 dark:text-indigo-100">
      {name}
    </span>
  );
}

function hhmm(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

/** Work sessions of a session-based (ISA) day; empty for SA days. */
function daySessions(entry: TimeEntry) {
  if (!entry.sessionBased) return [];
  return workedSegments(entry).map((segment, index) => ({
    start: hhmm(segment.start),
    end: hhmm(segment.end),
    minutes: segment.end - segment.start,
    note: entry.sessionNotes[index]?.trim() ?? "",
  }));
}

/** Session-based days with per-session notes show them on each session instead of one day note. */
function hasSessionNotes(entry: TimeEntry) {
  return entry.sessionBased && entry.sessionNotes.some((note) => note.trim());
}

export function EntriesTable({
  entries,
  positionNames,
  onEdit,
  onDelete,
}: {
  entries: TimeEntry[];
  /** When given (user has several positions), each row shows its position. */
  positionNames?: Record<string, string>;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
}) {
  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {entries.map((entry) => {
          const sessions = daySessions(entry);
          return (
            <div key={entry.id} className="rounded-xl border border-border/70 bg-card/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{format(new Date(`${entry.date}T00:00:00`), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(`${entry.date}T00:00:00`), "EEEE")}</p>
                  <PositionBadge name={positionNames?.[entry.positionId]} />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(entry)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {sessions.length > 0 ? (
                <div className="mt-3 space-y-1.5 text-sm">
                  {sessions.map((session, index) => (
                    <div key={session.start} className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5">
                        {sessions.length > 1 && (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted-foreground">
                            <CornerDownRight className="h-3.5 w-3.5" />#{index + 1}
                          </span>
                        )}
                        <span className="whitespace-nowrap">
                          {formatTime12h(session.start)} – {formatTime12h(session.end)}
                        </span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-medium">{minutesToTenthsDecimal(session.minutes).toFixed(1)} hrs</span>
                    </div>
                    {session.note && <p className="mt-0.5 break-words text-xs text-muted-foreground">{session.note}</p>}
                    </div>
                  ))}
                  <p className="pt-1 font-semibold text-primary">
                    <span className="text-muted-foreground">Day total:</span> {entry.workedTenths.toFixed(1)} hrs
                    <span className="ml-1 text-xs font-normal text-muted-foreground">({minutesToHM(entry.workedMinutes)} clock time)</span>
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">In:</span> {formatTime12h(entry.punchIn)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Out:</span> {formatTime12h(entry.punchOut)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Break:</span> {minutesToHM(entry.breakMinutes)}
                    </p>
                    <p className="font-semibold text-primary">
                      <span className="text-muted-foreground">Worked:</span> {minutesToHM(entry.workedMinutes)}
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.breaks.length > 0
                      ? entry.breaks.map((item) => `${formatTime12h(item.start)} - ${formatTime12h(item.end)}`).join(" | ")
                      : "No break logged"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{entry.workedTenths.toFixed(1)} decimal hrs</p>
                </>
              )}
              {!hasSessionNotes(entry) && (
                <p className="mt-2 break-words text-sm text-muted-foreground">{entry.notes || "No notes"}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <Table className="min-w-[900px] rounded-xl border bg-card">
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
            {entries.map((entry) => {
              const sessions = daySessions(entry);
              const subRows = sessions.length > 1 ? sessions : [];
              return (
                <Fragment key={entry.id}>
                  <TableRow className={subRows.length > 0 ? "border-b-0" : undefined}>
                    <TableCell>
                      <div className="font-medium">{format(new Date(`${entry.date}T00:00:00`), "MMM d, yyyy")}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(`${entry.date}T00:00:00`), "EEEE")}</div>
                      <PositionBadge name={positionNames?.[entry.positionId]} />
                    </TableCell>
                    <TableCell>{formatTime12h(entry.punchIn)}</TableCell>
                    <TableCell>{formatTime12h(entry.punchOut)}</TableCell>
                    <TableCell>
                      {entry.sessionBased ? (
                        <div className="text-muted-foreground">{sessions.length === 1 ? "1 session" : `${sessions.length} sessions`}</div>
                      ) : (
                        <>
                          <div>{minutesToHM(entry.breakMinutes)}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {entry.breaks.length > 0
                              ? entry.breaks
                                  .map((item) => `${formatTime12h(item.start)} - ${formatTime12h(item.end)}`)
                                  .join(" | ")
                              : "No break logged"}
                          </div>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-primary">
                        {entry.sessionBased ? `${entry.workedTenths.toFixed(1)} hrs` : minutesToHM(entry.workedMinutes)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.sessionBased ? `Day total · ${minutesToHM(entry.workedMinutes)} clock time` : `${entry.workedTenths.toFixed(1)} decimal hrs`}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {hasSessionNotes(entry)
                        ? subRows.length > 0
                          ? ""
                          : sessions[0]?.note
                        : entry.notes || "No notes"}
                    </TableCell>
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
                  {subRows.map((session, index) => (
                    <TableRow
                      key={`${entry.id}-${session.start}`}
                      className={`bg-muted/25 text-sm hover:bg-muted/35 ${index < subRows.length - 1 ? "border-b-0" : ""}`}
                    >
                      <TableCell className="py-1.5 pl-6 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CornerDownRight className="h-3.5 w-3.5" />
                          Session {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5">{formatTime12h(session.start)}</TableCell>
                      <TableCell className="py-1.5">{formatTime12h(session.end)}</TableCell>
                      <TableCell className="py-1.5" />
                      <TableCell className="py-1.5">{minutesToTenthsDecimal(session.minutes).toFixed(1)} hrs</TableCell>
                      <TableCell className="max-w-56 truncate py-1.5 text-muted-foreground" title={session.note || undefined}>
                        {session.note}
                      </TableCell>
                      <TableCell className="py-1.5" />
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

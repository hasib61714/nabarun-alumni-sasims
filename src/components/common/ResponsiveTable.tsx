import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Shown as the card title on small screens (exactly one column should set this). */
  primary?: boolean;
  /** Hide this column in the small-screen card. */
  hideOnMobile?: boolean;
}

interface Selection {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  selection?: Selection;
  onRowClick?: (row: T) => void;
  className?: string;
}

/** A table on tablets/desktops that turns into a stack of cards on phones. */
export function ResponsiveTable<T>({ rows, columns, rowKey, actions, selection, onRowClick, className }: Props<T>) {
  const allSelected = !!selection && rows.length > 0 && rows.every((r) => selection.selected.has(rowKey(r)));
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const secondary = columns.filter((c) => c !== primary && !c.hideOnMobile);

  return (
    <div className={className}>
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {selection && (
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={selection.onToggleAll} aria-label="সব নির্বাচন করুন" />
                </TableHead>
              )}
              {columns.map((c) => <TableHead key={c.key} className={c.className}>{c.header}</TableHead>)}
              {actions && <TableHead className="text-right">কার্যক্রম</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const id = rowKey(row);
              return (
                <TableRow
                  key={id}
                  data-state={selection?.selected.has(id) ? "selected" : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selection.selected.has(id)} onCheckedChange={() => selection.onToggle(id)} aria-label="নির্বাচন করুন" />
                    </TableCell>
                  )}
                  {columns.map((c) => <TableCell key={c.key} className={c.className}>{c.cell(row)}</TableCell>)}
                  {actions && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">{actions(row)}</div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const id = rowKey(row);
          return (
            <li
              key={id}
              className={cn("rounded-xl border bg-card p-4 shadow-card", selection?.selected.has(id) && "border-primary/50 bg-primary/5")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              <div className="flex items-start gap-3">
                {selection && (
                  <Checkbox className="mt-1" checked={selection.selected.has(id)} onCheckedChange={() => selection.onToggle(id)} onClick={(e) => e.stopPropagation()} aria-label="নির্বাচন করুন" />
                )}
                <div className="min-w-0 flex-1 font-medium">{primary.cell(row)}</div>
              </div>
              {secondary.length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  {secondary.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{c.header}</dt>
                      <dd className="break-words">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {actions && (
                <div className="mt-3 flex flex-wrap justify-end gap-1 border-t pt-3" onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

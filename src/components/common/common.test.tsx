import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { ConfirmProvider } from "./ConfirmDialog";
import { Field } from "./FormDialog";
import { ResponsiveTable } from "./ResponsiveTable";
import { useConfirm } from "./use-confirm";

describe("Field", () => {
  it("links the label, the input and the error message", () => {
    render(<Field label="শিরোনাম" error="খুব ছোট"><Input /></Field>);
    const input = screen.getByLabelText("শিরোনাম");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("খুব ছোট");
  });
  it("describes the input with the hint when there is no error", () => {
    render(<Field label="নাম" hint="৫/১০০"><Input /></Field>);
    const input = screen.getByLabelText("নাম");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("৫/১০০");
  });
});

function Probe({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return <button onClick={async () => onResult(await confirm({ title: "মুছবেন?", confirmLabel: "হ্যাঁ, মুছুন", destructive: true }))}>delete</button>;
}

describe("ConfirmProvider", () => {
  it("resolves true when confirmed and false when cancelled", async () => {
    const results: boolean[] = [];
    render(<ConfirmProvider><Probe onResult={(v) => results.push(v)} /></ConfirmProvider>);

    fireEvent.click(screen.getByText("delete"));
    fireEvent.click(await screen.findByRole("button", { name: "হ্যাঁ, মুছুন" }));
    await waitFor(() => expect(results).toEqual([true]));

    fireEvent.click(screen.getByText("delete"));
    fireEvent.click(await screen.findByRole("button", { name: "বাতিল" }));
    await waitFor(() => expect(results).toEqual([true, false]));
  });
  it("throws a helpful error outside the provider", () => {
    const silence = vi.spyOn(console, "error").mockImplementation(() => undefined); // React logs the expected error
    expect(() => render(<Probe onResult={() => undefined} />)).toThrow(/ConfirmProvider/);
    silence.mockRestore();
  });
});

describe("ResponsiveTable", () => {
  const rows = [{ id: "1", name: "রাহাত", batch: 2015 }, { id: "2", name: "ফাতেমা", batch: 2018 }];
  const columns = [
    { key: "name", header: "নাম", primary: true, cell: (r: (typeof rows)[number]) => r.name },
    { key: "batch", header: "ব্যাচ", cell: (r: (typeof rows)[number]) => r.batch },
  ];
  it("renders every row in the table and in the phone cards, with actions", () => {
    const picked: string[] = [];
    render(<ResponsiveTable rows={rows} columns={columns} rowKey={(r) => r.id} actions={(r) => <button onClick={() => picked.push(r.id)}>edit-{r.id}</button>} />);
    expect(screen.getAllByText("রাহাত")).toHaveLength(2); // table + card
    expect(screen.getAllByText("ব্যাচ").length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getAllByText("edit-2")[0]);
    expect(picked).toEqual(["2"]);
  });
  it("supports selecting rows", () => {
    const toggled: string[] = [];
    render(<ResponsiveTable rows={rows} columns={columns} rowKey={(r) => r.id} selection={{ selected: new Set(["1"]), onToggle: (id) => toggled.push(id), onToggleAll: () => undefined }} />);
    const boxes = screen.getAllByRole("checkbox", { name: "নির্বাচন করুন" });
    fireEvent.click(boxes[1]);
    expect(toggled.length).toBe(1);
    expect(screen.getAllByRole("checkbox", { checked: true }).length).toBeGreaterThan(0);
  });
});

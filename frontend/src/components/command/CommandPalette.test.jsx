import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CommandPalette from "./CommandPalette";

function fakeSearch() {
  return {
    searchNodes: vi.fn().mockResolvedValue({ content: [{ id: 7, name: "STO-Tower-07", location: "Stockholm", status: "DOWN" }] }),
    searchIncidents: vi.fn().mockResolvedValue({
      content: [{ id: 30, description: "Heartbeat lost", nodeName: "STO-Tower-07", status: "OPEN" }],
    }),
  };
}

function renderPalette(props = {}) {
  const onRun = vi.fn();
  const onClose = vi.fn();
  const search = props.search ?? fakeSearch();
  render(<CommandPalette canEdit onClose={onClose} onRun={onRun} search={search} {...props} />);
  return { onRun, onClose, search, input: screen.getByRole("combobox") };
}

describe("CommandPalette", () => {
  it("focuses the search box and lists pages and actions", () => {
    const { input } = renderPalette();
    expect(input).toHaveFocus();
    expect(screen.getByRole("option", { name: /Overview/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /Raise an incident/ })).toBeInTheDocument();
  });

  it("hides admin actions from read-only users", () => {
    renderPalette({ canEdit: false });
    expect(screen.queryByRole("option", { name: /Raise an incident/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Log out/ })).toBeInTheDocument();
  });

  it("moves with the arrow keys and runs the selected item with Enter", async () => {
    const user = userEvent.setup();
    const { input, onRun, onClose } = renderPalette();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const selected = screen.getByRole("option", { selected: true });
    expect(selected).toHaveTextContent("Incidents");
    expect(input).toHaveAttribute("aria-activedescendant", selected.id);

    await user.keyboard("{Enter}");
    expect(onClose).toHaveBeenCalled();
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "go-incidents", to: "/incidents" }));
  });

  it("wraps from the first item to the last", async () => {
    const user = userEvent.setup();
    renderPalette();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent("Log out");
  });

  it("filters as you type", async () => {
    const user = userEvent.setup();
    const { input } = renderPalette();
    await user.type(input, "uptime");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([expect.stringContaining("Analytics")]);
  });

  it("finds nodes and incidents on the server", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { input, search, onRun } = renderPalette();
    await user.type(input, "sto");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(search.searchNodes).toHaveBeenCalledWith(expect.objectContaining({ q: "sto", size: 5 }));
    expect(await screen.findByText("Down in Stockholm")).toBeInTheDocument();
    expect(screen.getByText("Nodes")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /#30 Heartbeat lost/ }));
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ to: "/incidents?open=30" }));
    vi.useRealTimers();
  });

  it("explains when nothing matches", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const search = { searchNodes: vi.fn().mockResolvedValue({ content: [] }), searchIncidents: vi.fn().mockResolvedValue({ content: [] }) };
    const { input } = renderPalette({ search });
    await user.type(input, "zzzz");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(await screen.findByText(/Nothing matches/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPalette();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

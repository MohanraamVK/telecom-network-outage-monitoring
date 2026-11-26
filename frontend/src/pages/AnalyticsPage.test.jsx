import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalytics } from "../services/analyticsService";
import AnalyticsPage from "./AnalyticsPage";

vi.mock("../services/analyticsService", () => ({ getAnalytics: vi.fn() }));
vi.mock("../context/LiveContext", () => ({ useLiveRefresh: vi.fn() }));

function analytics(days) {
  const daily = Array.from({ length: days }, (_, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, "0")}`,
    availabilityPercent: i === 2 ? 98.75 : 100,
    downtimeMinutes: i === 2 ? 90 : 0,
    incidentsOpened: i === 2 ? 2 : 0,
    incidentsResolved: i === 2 ? 1 : 0,
    mttrMinutes: i === 2 ? 45 : null,
  }));
  return {
    days,
    slaTargetPercent: 99.5,
    networkAvailabilityPercent: 99.82,
    downtimeMinutes: 90,
    incidentsOpened: 2,
    incidentsResolved: 1,
    mttrMinutes: 45,
    daily,
    nodes: [
      { id: 1, name: "STO-Tower-07", location: "Stockholm", status: "DOWN", uptime24h: 95, uptime7d: 99.1, uptime30d: 99.2, uptimeInRange: 99.2, downtimeMinutes: 90, outages: 2, incidents: 2, meetsSla: false },
      { id: 2, name: "GBG-Core-01", location: "Gothenburg", status: "ACTIVE", uptime24h: 100, uptime7d: 100, uptime30d: 100, uptimeInRange: 100, downtimeMinutes: 0, outages: 0, incidents: 0, meetsSla: true },
    ],
  };
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>
  );

describe("AnalyticsPage", () => {
  beforeEach(() => {
    getAnalytics.mockImplementation(async (days) => analytics(days));
  });

  it("summarises availability and SLA compliance", async () => {
    renderPage();
    expect(await screen.findByText("99.820%")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 nodes")).toBeInTheDocument();
    expect(screen.getByText("Node downtime").parentElement).toHaveTextContent("1h 30m");
    expect(getAnalytics).toHaveBeenCalledWith(30);
  });

  it("lists uptime per node with the SLA verdict", async () => {
    renderPage();
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("STO-Tower-07");
    expect(rows[1]).toHaveTextContent("Below target");
    expect(rows[2]).toHaveTextContent("Meets target");
    expect(within(rows[1]).getByRole("link", { name: "STO-Tower-07" })).toHaveAttribute("href", "/incidents?nodeId=1");
  });

  it("draws the charts with accessible names", async () => {
    renderPage();
    expect(await screen.findByRole("img", { name: "Network availability per day" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Incidents opened and resolved per day" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Average time to resolve per day" })).toBeInTheDocument();
  });

  it("reloads for a different range", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("99.820%");
    await user.click(screen.getByRole("button", { name: "7 days" }));
    expect(getAnalytics).toHaveBeenLastCalledWith(7);
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText(/Over the last 7 days/)).toBeInTheDocument();
  });

  it("offers a retry when loading fails", async () => {
    getAnalytics.mockRejectedValueOnce(new Error("boom"));
    renderPage();
    expect(await screen.findByText("Analytics could not be loaded.")).toBeInTheDocument();
  });
});

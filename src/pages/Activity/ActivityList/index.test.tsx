import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MainActivity from "./index";

const state = vi.hoisted(() => ({ permissions: ["activities.read"] }));
const requests = vi.hoisted(() => ({ clubs: vi.fn(), activities: vi.fn() }));
vi.mock("../../../stores/authStore", () => ({
  usePermissions: () => state.permissions,
}));
vi.mock("../../../api/services/club", () => ({ getClubs: requests.clubs }));
vi.mock("../../../api/services/activity", () => ({
  getActivities: requests.activities,
}));
vi.mock("ahooks", () => ({
  useRequest: (service: () => unknown, options?: { ready?: boolean }) => {
    if (options?.ready !== false) service();
    return { loading: false, refresh: vi.fn() };
  },
}));
vi.mock("./components/ActivityTable", () => ({
  default: () => <div>Kegiatan tersedia</div>,
}));
vi.mock("../../../components/common/Responsive/ResponsiveFilters", () => ({
  ResponsiveFilters: ({
    children,
  }: {
    children: (props: { apply: () => void }) => React.ReactNode;
  }) => children({ apply: vi.fn() }),
}));
const renderPage = (): string =>
  renderToStaticMarkup(
    <MemoryRouter>
      <MainActivity />
    </MemoryRouter>,
  );

describe("Activity list optional club access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.permissions = ["activities.read", "activities.manage"];
  });
  it("loads activities without requesting clubs for activity-only administrators", () => {
    const html = renderPage();
    expect(requests.activities).toHaveBeenCalledOnce();
    expect(requests.clubs).not.toHaveBeenCalled();
    expect(html).toContain("Kegiatan tersedia");
    expect(html).toContain("Buat Kegiatan");
    expect(html).not.toContain("Semua Klub");
  });
  it("offers the club filter when combined permissions include clubs.read", () => {
    state.permissions.push("clubs.read");
    expect(renderPage()).toContain("Semua Klub");
    expect(requests.clubs).toHaveBeenCalledOnce();
    expect(requests.activities).toHaveBeenCalledOnce();
  });
});

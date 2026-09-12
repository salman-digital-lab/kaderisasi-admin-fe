import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "../../../../types/model/activity";
import type { SetupReadiness } from "../../../../api/services/activity-setup";
import ActivityOverview from "./ActivityOverview";

const request = vi.hoisted(() => ({
  data: undefined as SetupReadiness | undefined,
}));
vi.mock("ahooks", () => ({
  useRequest: () => ({ ...request, loading: false }),
}));
vi.mock("../../../../api/services/activity-setup", () => ({
  getActivityReadiness: vi.fn(),
  saveSetupActivity: vi.fn(),
}));

const renderOverview = (published: boolean): string =>
  renderToStaticMarkup(
    <ActivityOverview
      activity={
        {
          id: 1,
          name: "Kegiatan",
          is_published: published ? 1 : 0,
          is_registration_open: false,
        } as Activity
      }
      onUpdated={vi.fn()}
      onNavigate={vi.fn()}
    />,
  );

describe("Activity overview", () => {
  beforeEach(() => {
    request.data = {
      can_publish: true,
      can_open_registration: true,
      issues: [],
      actions: {
        can_edit: true,
        can_publish: true,
        can_manage_registration: true,
      },
    };
  });

  it("shows publication and registration readiness without wizard steps", () => {
    const html = renderOverview(false);
    expect(html).toContain("Ringkasan Pengaturan");
    expect(html).toContain("Tayangkan Kegiatan");
    expect(html).toContain("Kelola Form Pendaftaran");
    expect(html).not.toContain("ant-steps");
    expect(html).not.toContain("Hapus Kegiatan");
  });

  it("requires publication before registration can open", () => {
    expect(renderOverview(false)).toMatch(
      /<button[^>]*disabled[^>]*><span>Buka Pendaftaran/,
    );
    expect(renderOverview(true)).not.toMatch(
      /<button[^>]*disabled[^>]*><span>Buka Pendaftaran/,
    );
  });

  it("hides status actions for a reader", () => {
    request.data!.actions = {
      can_edit: false,
      can_publish: false,
      can_manage_registration: false,
    };
    const html = renderOverview(false);
    expect(html).not.toContain("Tayangkan Kegiatan");
    expect(html).not.toContain("Buka Pendaftaran");
  });
});

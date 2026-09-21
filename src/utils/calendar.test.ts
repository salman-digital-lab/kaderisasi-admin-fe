import { describe, expect, it } from "vitest";
import {
  addDays,
  eventsOnDay,
  eventSchedule,
  midnight,
  monthDays,
  shiftMonth,
  wibDate,
} from "./calendar";
import type { CalendarEvent } from "../types/model/calendar";

const event: CalendarEvent = {
  id: 1,
  title: "Lintas bulan",
  description: null,
  location: null,
  starts_at: midnight("2026-08-31"),
  ends_at: midnight("2026-09-02"),
  all_day: true,
  activity: null,
  created_at: "",
  updated_at: "",
};

describe("WIB calendar boundaries", () => {
  it("shows dates without time or all-day labels", () => {
    expect(eventSchedule(event)).toBe("31 Agu 2026 – 1 Sep 2026");
    expect(eventSchedule({ ...event, starts_at: midnight("2026-09-01") })).toBe(
      "1 Sep 2026",
    );
  });
  it("uses Jakarta dates independently of the browser timezone", () => {
    expect(wibDate("2026-09-20T18:00:00Z")).toBe("2026-09-21");
  });
  it("includes each overlapping day but excludes the end boundary", () => {
    expect(eventsOnDay([event], "2026-08-31")).toHaveLength(1);
    expect(eventsOnDay([event], "2026-09-01")).toHaveLength(1);
    expect(eventsOnDay([event], "2026-09-02")).toHaveLength(0);
  });
  it("handles timed events crossing WIB midnight", () => {
    const timed = {
      ...event,
      all_day: false,
      starts_at: "2026-09-21T23:30:00+07:00",
      ends_at: "2026-09-22T00:30:00+07:00",
    };
    expect(eventsOnDay([timed], "2026-09-21")).toHaveLength(1);
    expect(eventsOnDay([timed], "2026-09-22")).toHaveLength(1);
  });
  it("keeps complete Monday-based grid weeks and leap days", () => {
    expect(monthDays("2026-09-01", true)[0]).toBe("2026-08-31");
    expect(monthDays("2026-09-01", true)).toHaveLength(35);
    expect(monthDays("2024-02-01", false)).toHaveLength(29);
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(shiftMonth("2026-12-01", 1)).toBe("2027-01-01");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { sqlite } from "@covoiturage/db/client";
import { appRouter } from "./root";
import { createContext } from "./context";

describe("tRPC end-to-end flow", () => {
  afterEach(() => {
    sqlite.exec("DELETE FROM group_memberships;");
    sqlite.exec("DELETE FROM carpool_groups;");
    sqlite.exec("DELETE FROM schedule_entries;");
    sqlite.exec("DELETE FROM users;");
  });

  it("registers, updates location, submits schedule, and retrieves a group", async () => {
    const ctx = await createContext();
    const caller = appRouter.createCaller(ctx);

    const register = await caller.user.register({
      name: "Marie",
      email: `marie+${Date.now()}@exemple.fr`,
    });

    await caller.user.updateLocation({
      userId: register.userId,
      home: { lat: 47.3556, lng: -1.3478, commune: "Ligné" },
      work: { lat: 47.2184, lng: -1.5536, commune: "Nantes" },
    });

    const weekStart = "2026-03-09";
    await caller.schedule.submit({
      userId: register.userId,
      weekStart,
      entries: [
        { day: 0, departureTime: "07:30", toleranceMinutes: 15, returnTime: "17:30", returnToleranceMinutes: 15 },
        { day: 1, departureTime: "07:35", toleranceMinutes: 15, returnTime: "17:35", returnToleranceMinutes: 15 },
        { day: 2, departureTime: "07:40", toleranceMinutes: 15, returnTime: "17:40", returnToleranceMinutes: 15 },
      ],
    });

    // Add two compatible neighbors to ensure a group can be formed.
    const thomas = await caller.user.register({ name: "Thomas", email: `thomas+${Date.now()}@exemple.fr` });
    await caller.user.updateLocation({
      userId: thomas.userId,
      home: { lat: 47.3897, lng: -1.3892, commune: "Saint-Mars-du-Désert" },
      work: { lat: 47.2184, lng: -1.5536, commune: "Nantes" },
    });
    await caller.schedule.submit({
      userId: thomas.userId,
      weekStart,
      entries: [
        { day: 0, departureTime: "07:31", toleranceMinutes: 15, returnTime: "17:30", returnToleranceMinutes: 15 },
        { day: 1, departureTime: "07:36", toleranceMinutes: 15, returnTime: "17:35", returnToleranceMinutes: 15 },
        { day: 2, departureTime: "07:39", toleranceMinutes: 15, returnTime: "17:40", returnToleranceMinutes: 15 },
      ],
    });

    const lea = await caller.user.register({ name: "Léa", email: `lea+${Date.now()}@exemple.fr` });
    await caller.user.updateLocation({
      userId: lea.userId,
      home: { lat: 47.2978, lng: -1.4919, commune: "Carquefou" },
      work: { lat: 47.2184, lng: -1.5536, commune: "Nantes" },
    });
    await caller.schedule.submit({
      userId: lea.userId,
      weekStart,
      entries: [
        { day: 0, departureTime: "07:32", toleranceMinutes: 15, returnTime: "17:30", returnToleranceMinutes: 15 },
        { day: 1, departureTime: "07:34", toleranceMinutes: 15, returnTime: "17:35", returnToleranceMinutes: 15 },
        { day: 2, departureTime: "07:41", toleranceMinutes: 15, returnTime: "17:40", returnToleranceMinutes: 15 },
      ],
    });

    const trigger = await caller.matching.triggerMatch({ userId: register.userId, weekStart });
    expect(trigger.ok).toBe(true);

    const group = await caller.matching.myGroup({ userId: register.userId, weekStart });
    expect(group).not.toBeNull();
    expect(group?.members.length).toBeGreaterThan(0);
  });
});

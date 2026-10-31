import { describe, expect, it } from "vitest";
import { findNearestDemoCity } from "@/lib/maps";

describe("approximate city lookup", () => {
  it("maps coordinates to the nearest supported city", () => {
    expect(findNearestDemoCity(51.5072, -0.1276)).toBe("London");
    expect(findNearestDemoCity(53.4084, -2.9916)).toBe("Liverpool");
    expect(findNearestDemoCity(51.4545, -2.5879)).toBe("Bristol");
  });

  it("asks for a city selection when outside the supported demo areas", () => {
    expect(findNearestDemoCity(40.7128, -74.006)).toBeNull();
  });
});

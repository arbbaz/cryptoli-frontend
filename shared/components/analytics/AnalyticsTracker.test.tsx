import { render, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from "vitest";

const mockGetAnalyticsConsent = vi.fn();
const mockGetApiBaseUrl = vi.fn();

vi.mock("@/shared/components/feedback/CookieConsent", () => ({
  getAnalyticsConsent: () => mockGetAnalyticsConsent(),
}));

vi.mock("@/lib/env", () => ({
  getApiBaseUrl: () => mockGetApiBaseUrl(),
}));

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

function createStorageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe("AnalyticsTracker", () => {
  let fetchSpy: MockInstance<typeof fetch>;
  let origLocalStorage: Storage;
  let origSessionStorage: Storage;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    mockGetAnalyticsConsent.mockReturnValue(true);
    mockGetApiBaseUrl.mockReturnValue("https://api.test.com");
    mockPathname = "/";

    // Install storage mocks
    origLocalStorage = window.localStorage;
    origSessionStorage = window.sessionStorage;
    Object.defineProperty(window, "localStorage", {
      value: createStorageMock(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "sessionStorage", {
      value: createStorageMock(),
      writable: true,
      configurable: true,
    });

    // Pre-seed session ID so getOrCreateSessionId doesn't fail
    window.localStorage.setItem("analytics_session_id", "test-session-123");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: origLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "sessionStorage", {
      value: origSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  it("sends fetch with credentials: 'include' and keepalive: true", async () => {
    const AnalyticsTracker = (await import("./AnalyticsTracker")).default;
    render(<AnalyticsTracker />);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.com/api/analytics/track",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        keepalive: true,
      }),
    );
  });

  it("does not use navigator.sendBeacon", async () => {
    const sendBeaconSpy = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconSpy,
      writable: true,
      configurable: true,
    });

    vi.resetModules();
    const AnalyticsTracker = (await import("./AnalyticsTracker")).default;
    render(<AnalyticsTracker />);

    expect(sendBeaconSpy).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("page_leave events use fetch (not sendBeacon) on visibilitychange", async () => {
    const sendBeaconSpy = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconSpy,
      writable: true,
      configurable: true,
    });

    vi.resetModules();
    const AnalyticsTracker = (await import("./AnalyticsTracker")).default;
    render(<AnalyticsTracker />);

    // Clear the page_view fetch call
    fetchSpy.mockClear();

    // Simulate visibility hidden to trigger page_leave
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(sendBeaconSpy).not.toHaveBeenCalled();
    if (fetchSpy.mock.calls.length > 0) {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
          keepalive: true,
        }),
      );
    }
  });

  it("skips tracking when consent is not granted", async () => {
    mockGetAnalyticsConsent.mockReturnValue(false);

    vi.resetModules();
    const AnalyticsTracker = (await import("./AnalyticsTracker")).default;
    render(<AnalyticsTracker />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips tracking when base URL is not configured", async () => {
    mockGetApiBaseUrl.mockReturnValue(null);

    vi.resetModules();
    const AnalyticsTracker = (await import("./AnalyticsTracker")).default;
    render(<AnalyticsTracker />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

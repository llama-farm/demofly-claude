import { describe, it, expect, vi } from "vitest";
import { resolve, ResolveError } from "./helpers.js";

function mockLocator(opts: {
  visible?: boolean;
  count?: number;
  throwOnWaitFor?: boolean;
}) {
  const { visible = true, count = 1, throwOnWaitFor = false } = opts;
  return {
    first: () => ({
      waitFor: async () => {
        if (throwOnWaitFor) throw new Error("timeout");
      },
    }),
    waitFor: async () => {
      if (throwOnWaitFor) throw new Error("timeout");
    },
    count: async () => count,
  };
}

function mockPage(snapshotResult: object | null = { role: "document", name: "test" }) {
  return {
    accessibility: {
      snapshot: async () => snapshotResult,
    },
  } as any;
}

describe("resolve", () => {
  it("returns the first selector when it matches exactly one visible element", async () => {
    const page = mockPage();
    const locator1 = mockLocator({ count: 1 });
    const locator2 = mockLocator({ count: 1 });

    const result = await resolve(page, {
      description: "Submit button",
      selectors: [() => locator1 as any, () => locator2 as any],
      timeout: 100,
    });

    expect(result).toBe(locator1);
  });

  it("falls back to second selector when first matches multiple elements", async () => {
    const page = mockPage();
    const locator1 = mockLocator({ count: 3 }); // ambiguous
    const locator2 = mockLocator({ count: 1 }); // exact

    const result = await resolve(page, {
      description: "Preview button",
      selectors: [() => locator1 as any, () => locator2 as any],
      timeout: 100,
    });

    expect(result).toBe(locator2);
  });

  it("falls back to second selector when first times out", async () => {
    const page = mockPage();
    const locator1 = mockLocator({ throwOnWaitFor: true });
    const locator2 = mockLocator({ count: 1 });

    const result = await resolve(page, {
      description: "Modal close",
      selectors: [() => locator1 as any, () => locator2 as any],
      timeout: 100,
    });

    expect(result).toBe(locator2);
  });

  it("throws ResolveError with snapshot when all selectors fail", async () => {
    const page = mockPage({ role: "document", children: [{ role: "button", name: "Other" }] });
    const locator1 = mockLocator({ throwOnWaitFor: true });
    const locator2 = mockLocator({ count: 0, throwOnWaitFor: true });

    try {
      await resolve(page, {
        description: "Preview button in the top toolbar",
        selectors: [() => locator1 as any, () => locator2 as any],
        timeout: 100,
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ResolveError);
      const re = err as ResolveError;
      expect(re.description).toBe("Preview button in the top toolbar");
      expect(re.selectorsTriedCount).toBe(2);
      expect(re.snapshot).toContain("Other");
      expect(re.message).toContain("Tried 2 selectors");
    }
  });

  it("catches and skips when a selector factory throws", async () => {
    const page = mockPage();
    const locator2 = mockLocator({ count: 1 });

    const result = await resolve(page, {
      description: "Dynamic element",
      selectors: [
        () => { throw new Error("factory construction failed"); },
        () => locator2 as any,
      ],
      timeout: 100,
    });

    expect(result).toBe(locator2);
  });

  it("truncates snapshot to 2000 chars in error message", async () => {
    const longSnapshot = { data: "x".repeat(3000) };
    const page = mockPage(longSnapshot);
    const locator1 = mockLocator({ throwOnWaitFor: true });

    try {
      await resolve(page, {
        description: "Element",
        selectors: [() => locator1 as any],
        timeout: 100,
      });
      expect.fail("should have thrown");
    } catch (err) {
      const re = err as ResolveError;
      // The snapshot in the message is truncated to 2000 chars
      const snapshotInMessage = re.message.split("Page snapshot (truncated):\n")[1];
      expect(snapshotInMessage.length).toBeLessThanOrEqual(2000);
    }
  });
});

describe("ResolveError", () => {
  it("includes description, count, and snapshot in message", () => {
    const err = new ResolveError("Share button", 3, '{"role":"document"}');
    expect(err.name).toBe("ResolveError");
    expect(err.description).toBe("Share button");
    expect(err.selectorsTriedCount).toBe(3);
    expect(err.message).toContain("Share button");
    expect(err.message).toContain("Tried 3 selectors");
    expect(err.message).toContain("document");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

describe("mock payment service", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("supports development payment flows without real transactions", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.resetModules();
    vi.useFakeTimers();
    const service = await import("../utils/mockPaymentService");

    const payments = [
      service.processMockCardPayment({
        cardNumber: "4242424242424242",
        cardholderName: "Demo User",
        expiryMonth: "12",
        expiryYear: "2030",
        cvv: "123",
        cardType: "credit",
      }, 12.99, "premium"),
      service.processMockUPIPayment({ upiId: "demo@upi", upiApp: "google_pay" }, 12.99, "premium"),
      service.processMockNetBankingPayment({ bankId: "demo", accountNumber: "12345678" }, 12.99, "premium"),
      service.processMockPayPalPayment(12.99, "premium"),
      service.processMockStripePayment(12.99, "premium"),
    ];
    await vi.advanceTimersByTimeAsync(300);
    const results = await Promise.all(payments);
    expect(results.every((result) => result.success && result.isMock)).toBe(true);

    const verification = service.verifyMockPayment(results[0].transactionId);
    await vi.advanceTimersByTimeAsync(500);
    await expect(verification).resolves.toMatchObject({ verified: true, isMock: true });
  });

  it("refuses to process mock transactions in production", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.resetModules();
    const service = await import("../utils/mockPaymentService");

    await expect(service.processMockStripePayment(12.99, "premium")).rejects.toThrow(
      "Mock payments are not enabled",
    );
  });
});

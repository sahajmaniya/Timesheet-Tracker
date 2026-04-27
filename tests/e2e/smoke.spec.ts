import { expect, test } from "@playwright/test";

test.describe("Public smoke", () => {
  test("landing page renders primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Timesheets That Feel Fast/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create Account/i })).toBeVisible();
  });

  test("protected routes redirect to sign in when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("heading", { name: /^Sign in$/i })).toBeVisible();
  });
});

test.describe("Auth page smoke", () => {
  test("sign in page renders OTP flow controls", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { name: /^Sign in$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Send verification code/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Forgot password/i })).toBeVisible();
  });

  test("forgot password page renders recovery form", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page.getByRole("heading", { name: /Forgot password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Send reset link/i })).toBeVisible();
  });

  test("reset password without token shows invalid link state", async ({ page }) => {
    await page.goto("/auth/reset-password");
    await expect(page.getByRole("heading", { name: /Invalid reset link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request new reset link/i })).toBeVisible();
  });
});

test.describe("Mobile overflow guards", () => {
  test("landing page does not overflow viewport width", async ({ page }) => {
    await page.goto("/");
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("sign in page does not overflow viewport width", async ({ page }) => {
    await page.goto("/auth/signin");
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});

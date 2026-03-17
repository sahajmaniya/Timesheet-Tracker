import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;
const hasAuthCreds = Boolean(e2eEmail && e2ePassword);

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill(e2eEmail!);
  await page.getByLabel("Password").fill(e2ePassword!);
  await page.getByRole("button", { name: /^Sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Public smoke", () => {
  test("landing page renders primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Track Daily Hours/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create Account/i })).toBeVisible();
  });

  test("protected routes redirect to sign in when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });
});

test.describe("Authenticated smoke", () => {
  test.skip(!hasAuthCreds, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests.");

  test("user can sign in and load dashboard essentials", async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(/Quick actions/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Entries/i })).toBeVisible();
  });

  test("entries page loads totals and month selector", async ({ page }) => {
    await signIn(page);
    await page.goto("/entries");
    await expect(page).toHaveURL(/\/entries/);
    await expect(page.getByText(/Monthly total/i)).toBeVisible();
    await expect(page.locator('input[type="month"]')).toBeVisible();
  });
});

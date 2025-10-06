import { expect, test } from '@playwright/test';

const formData = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  message:
    'Looking to collaborate on a new project with NomaSoft. Let us know your availability.',
  service: 'web',
};

test('renders English and French locales with persisted selection', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('h1')).toContainText('Ship smarter software');

  const languageSelect = page.locator('label:has-text("Language") select');
  await languageSelect.selectOption('fr');
  await expect(page).toHaveURL(/\/fr\//);
  await expect(page.locator('h1')).toContainText(
    'Créez des solutions plus intelligentes',
  );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('contact form validates input and posts successfully', async ({ page }) => {
  await page.goto('/en/contact');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Provide a valid email address.')).toBeVisible();

  await page.fill('#name', formData.name);
  await page.fill('#email', formData.email);
  await page.fill('#company', formData.company);
  await page.selectOption('#service', formData.service);
  await page.fill('#message', formData.message);

  await page.click('button[type="submit"]');
  await expect(page.locator('text=Thanks!')).toBeVisible();
});

test('portfolio links open externally with tracking attributes', async ({ page }) => {
  await page.goto('/en');
  const links = page.locator('#portfolio a');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(links.nth(i)).toHaveAttribute('target', '_blank');
    await expect(links.nth(i)).toHaveAttribute('rel', /noopener/);
  }
});

test('layout has no horizontal scroll on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en');
  const hasOverflow = await page.evaluate(
    () => document.body.scrollWidth > window.innerWidth + 1,
  );
  expect(hasOverflow).toBeFalsy();
});

test('home page exposes structured data', async ({ page }) => {
  await page.goto('/en');
  const jsonLdHandle = page.locator('script[type="application/ld+json"]');
  const snippetCount = await jsonLdHandle.count();
  expect(snippetCount).toBeGreaterThan(0);
  const raw = await jsonLdHandle.first().textContent();
  expect(raw).toBeTruthy();
  const data = JSON.parse(raw!);
  expect(Array.isArray(data)).toBeTruthy();
  expect(data.length).toBeGreaterThan(0);
});

// coreFlow.spec.js - Playwright E2E test covering registration, album creation, image upload, and read-only share link validation
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Ensure a mock 1x1 transparent PNG file exists for uploading
const mockImagePath = path.join(__dirname, 'mock-image.png');
test.beforeAll(() => {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync(mockImagePath, Buffer.from(pngBase64, 'base64'));
});

test.afterAll(() => {
  if (fs.existsSync(mockImagePath)) {
    fs.unlinkSync(mockImagePath);
  }
});

test('Core E2E flow: User registration -> album creation -> image upload -> share link generation -> unauthenticated public verification', async ({ page, browser }) => {
  // ── 1. Register a new user ─────────────────────────────────────────────────
  await page.goto('/');
  await expect(page.locator('h2')).toContainText('Sign in to CloudSnap');

  // Click switch to Register form
  await page.click('text=Create one');
  await expect(page.locator('h2')).toContainText('Join CloudSnap');

  // Fill registration form
  const email = `e2e-${Date.now()}@example.com`;
  await page.fill('#register-name', 'E2E Tester');
  await page.fill('#register-email', email);
  await page.fill('#register-password', 'testpassword123');

  // Click register submit
  await page.click('button[type="submit"]');

  // Confirm registration redirected to dashboard (navbar should welcome user)
  await expect(page.locator('header')).toContainText('E2E Tester');

  // ── 2. Create an album ─────────────────────────────────────────────────────
  // Click 'Albums' tab in Navbar
  await page.click('button:has-text("Albums")');
  await expect(page.locator('main')).toContainText('My Albums');

  // Trigger Create Album modal
  await page.click('button:has-text("Create New Album")');
  await page.fill('#album-name', 'E2E Album');
  await page.fill('#album-desc', 'Album generated dynamically during automated testing.');
  await page.click('button:has-text("Create Album")');

  // Confirm album exists in list
  await expect(page.locator('main')).toContainText('E2E Album');

  // ── 3. Upload an image into it ─────────────────────────────────────────────
  // Click on E2E Album to enter details view
  await page.click('text=E2E Album');
  await expect(page.locator('main')).toContainText('Viewing Album: E2E Album');

  // Set file into dropzone input
  await page.setInputFiles('#file-dropzone-input', mockImagePath);

  // Wait for upload processing completion (image card selector becomes visible)
  const imageContainer = page.locator('main img');
  await expect(imageContainer).toBeVisible({ timeout: 15000 });

  // ── 4. Generate a share link for the album ─────────────────────────────────
  // Go back to Albums view
  await page.click('button:has-text("Albums")');

  // Click Share Album trigger button on the card
  await page.click('button[title="Share Album"]');

  // Request share link generation
  await page.click('button:has-text("Create Share Link")');

  // Capture the generated URL from the read-only textbox
  const shareInput = page.locator('input[readonly]');
  await expect(shareInput).toBeVisible();
  const shareUrl = await shareInput.inputValue();
  console.log(`Generated share URL: ${shareUrl}`);

  // Close share modal
  await page.click('button:has-text("Done")');

  // ── 5. Open share link in a fresh unauthenticated browser context ──────────
  const strangerContext = await browser.newContext();
  const strangerPage = await strangerContext.newPage();
  
  await strangerPage.goto(shareUrl);

  // Assert correct PublicShareView layout
  await expect(strangerPage.locator('h1')).toContainText('E2E Album');
  
  // Confirm the uploaded mock image is visible to the public viewer
  const strangerImage = strangerPage.locator('img');
  await expect(strangerImage).toBeVisible();

  // Assert that authenticated actions are NOT present in the public view
  // No file upload dropzone
  const uploadZone = strangerPage.locator('#file-dropzone-input');
  await expect(uploadZone).not.toBeVisible();

  // No delete buttons
  const deleteBtn = strangerPage.locator('[id^="delete-btn-"]');
  await expect(deleteBtn).not.toBeVisible();

  // Clean context resources
  await strangerPage.close();
  await strangerContext.close();
});

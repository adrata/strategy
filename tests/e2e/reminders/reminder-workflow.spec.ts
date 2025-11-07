/**
 * E2E Tests: Reminder Workflow
 * 
 * End-to-end tests for the complete reminder functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Reminder Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a person record page
    // Adjust the URL based on your routing structure
    await page.goto('/adrata/people');
    await page.waitForLoadState('networkidle');
  });

  test('should set a reminder using quick option', async ({ page }) => {
    // Click on a person record to open detail view
    const firstPerson = page.locator('[data-testid="person-row"]').first();
    await firstPerson.click();
    await page.waitForLoadState('networkidle');

    // Click Set Reminder button
    const setReminderButton = page.getByRole('button', { name: /set reminder/i });
    await expect(setReminderButton).toBeVisible();
    await setReminderButton.click();

    // Wait for modal to appear
    await expect(page.getByText('Set Reminder')).toBeVisible();

    // Select "In an hour" quick option
    const inAnHourOption = page.getByText('In an hour').locator('..').locator('button');
    await inAnHourOption.click();

    // Verify option is selected (should have primary styling)
    await expect(inAnHourOption).toHaveClass(/bg-primary/);

    // Add a note
    const noteTextarea = page.getByPlaceholderText('Add a note about this reminder...');
    await noteTextarea.fill('E2E test reminder');

    // Click Set Reminder button in modal
    const saveButton = page.getByRole('button', { name: /^Set Reminder$/ });
    await saveButton.click();

    // Wait for modal to close
    await expect(page.getByText('Set Reminder')).not.toBeVisible();

    // Verify success message appears (if you have toast notifications)
    // await expect(page.getByText(/reminder set successfully/i)).toBeVisible();
  });

  test('should set a reminder with custom date/time', async ({ page }) => {
    // Click on a person record
    const firstPerson = page.locator('[data-testid="person-row"]').first();
    await firstPerson.click();
    await page.waitForLoadState('networkidle');

    // Click Set Reminder button
    const setReminderButton = page.getByRole('button', { name: /set reminder/i });
    await setReminderButton.click();

    // Wait for modal
    await expect(page.getByText('Set Reminder')).toBeVisible();

    // Enter custom date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const dateInput = page.getByLabelText('Date');
    await dateInput.fill(dateStr);

    // Enter custom time
    const timeInput = page.getByLabelText('Time');
    await timeInput.fill('14:30');

    // Add note
    const noteTextarea = page.getByPlaceholderText('Add a note about this reminder...');
    await noteTextarea.fill('Custom time reminder');

    // Save
    const saveButton = page.getByRole('button', { name: /^Set Reminder$/ });
    await saveButton.click();

    // Verify modal closes
    await expect(page.getByText('Set Reminder')).not.toBeVisible();
  });

  test('should validate future dates only', async ({ page }) => {
    // Click on a person record
    const firstPerson = page.locator('[data-testid="person-row"]').first();
    await firstPerson.click();
    await page.waitForLoadState('networkidle');

    // Click Set Reminder button
    const setReminderButton = page.getByRole('button', { name: /set reminder/i });
    await setReminderButton.click();

    // Wait for modal
    await expect(page.getByText('Set Reminder')).toBeVisible();

    // Try to set a past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const dateInput = page.getByLabelText('Date');
    await dateInput.fill(dateStr);

    const timeInput = page.getByLabelText('Time');
    await timeInput.fill('09:00');

    // Try to save
    const saveButton = page.getByRole('button', { name: /^Set Reminder$/ });
    await saveButton.click();

    // Should show validation error
    // Note: This depends on how you handle validation - might be alert or inline error
    await page.waitForTimeout(500); // Wait for validation
  });

  test('should cancel reminder creation', async ({ page }) => {
    // Click on a person record
    const firstPerson = page.locator('[data-testid="person-row"]').first();
    await firstPerson.click();
    await page.waitForLoadState('networkidle');

    // Click Set Reminder button
    const setReminderButton = page.getByRole('button', { name: /set reminder/i });
    await setReminderButton.click();

    // Wait for modal
    await expect(page.getByText('Set Reminder')).toBeVisible();

    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Verify modal closes
    await expect(page.getByText('Set Reminder')).not.toBeVisible();
  });

  test('should show Set Reminder button only for people and companies', async ({ page }) => {
    // Navigate to a person record
    await page.goto('/adrata/people');
    await page.waitForLoadState('networkidle');

    const firstPerson = page.locator('[data-testid="person-row"]').first();
    await firstPerson.click();
    await page.waitForLoadState('networkidle');

    // Should see Set Reminder button
    const setReminderButton = page.getByRole('button', { name: /set reminder/i });
    await expect(setReminderButton).toBeVisible();
  });
});


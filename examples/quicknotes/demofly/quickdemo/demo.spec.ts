import { test, type Page, type Locator, type BoundingBox } from '@playwright/test';

const t0 = Date.now();
const mark = (scene: string, action: string, target?: string) =>
  console.log(`DEMOFLY|${scene}|${action}|${target ?? ''}|${Date.now() - t0}`);

async function injectCursor(page: Page) {
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demofly-cursor';
    cursor.style.cssText = `
      width: 20px;
      height: 20px;
      background: rgba(255, 50, 50, 0.9);
      border: 2px solid white;
      border-radius: 50%;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999999;
      pointer-events: none;
      transition: left 0.15s ease-out, top 0.15s ease-out;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(cursor);
  });
}

async function moveTo(
  page: Page,
  element: Locator,
  prevBox?: BoundingBox | null
): Promise<BoundingBox | null> {
  const box = await element.boundingBox();
  if (!box) return null;

  if (prevBox) {
    const distance = Math.sqrt(
      Math.pow(box.x - prevBox.x, 2) + Math.pow(box.y - prevBox.y, 2)
    );
    await page.waitForTimeout(Math.round(80 + distance * 1.8));
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById('demofly-cursor');
      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      }
    },
    { x: centerX, y: centerY }
  );

  return box;
}

test('QuickNotes Demo', async ({ page }) => {
  let prevBox: BoundingBox | null = null;

  // ==================== SCENE 1: Create First Note ====================
  mark('scene-1', 'start');

  await page.goto('/');
  await injectCursor(page);
  mark('scene-1', 'navigate', 'home');
  await page.waitForTimeout(1200);

  // Fill title
  const titleField = page.getByLabel('Note title');
  prevBox = await moveTo(page, titleField, prevBox);
  mark('scene-1', 'click', 'note-title');
  await titleField.click();
  mark('scene-1', 'type-start', 'note-title');
  await titleField.pressSequentially('Meeting Notes', { delay: 40 });
  mark('scene-1', 'type-end', 'note-title');
  await page.waitForTimeout(600);

  // Fill body
  const bodyField = page.getByLabel('Note body');
  prevBox = await moveTo(page, bodyField, prevBox);
  mark('scene-1', 'click', 'note-body');
  await bodyField.click();
  mark('scene-1', 'type-start', 'note-body');
  await bodyField.pressSequentially('Discuss Q1 roadmap priorities and team assignments', { delay: 30 });
  mark('scene-1', 'type-end', 'note-body');
  await page.waitForTimeout(800);

  // Click Add Note
  const addBtn = page.getByRole('button', { name: 'Add Note' });
  prevBox = await moveTo(page, addBtn, prevBox);
  mark('scene-1', 'click', 'add-note-btn');
  await addBtn.click();
  await page.waitForTimeout(1000);

  mark('scene-1', 'pause', 'view-result');
  await page.waitForTimeout(1500);

  mark('scene-1', 'end');

  // ==================== SCENE 2: Edit the Note ====================
  await page.waitForTimeout(1000);
  mark('scene-2', 'start');

  // Click Edit
  const editBtn = page.getByRole('button', { name: 'Edit' });
  prevBox = await moveTo(page, editBtn, prevBox);
  mark('scene-2', 'click', 'edit-btn');
  await editBtn.click();
  await page.waitForTimeout(500);

  // Edit title
  const editTitleField = page.getByLabel('Edit title');
  prevBox = await moveTo(page, editTitleField, prevBox);
  mark('scene-2', 'click', 'edit-title');
  await editTitleField.click();
  await editTitleField.clear();
  mark('scene-2', 'type-start', 'edit-title');
  await editTitleField.pressSequentially('Weekly Standup Notes', { delay: 35 });
  mark('scene-2', 'type-end', 'edit-title');
  await page.waitForTimeout(500);

  // Edit body
  const editBodyField = page.getByLabel('Edit body');
  prevBox = await moveTo(page, editBodyField, prevBox);
  mark('scene-2', 'click', 'edit-body');
  await editBodyField.click();
  await editBodyField.clear();
  mark('scene-2', 'type-start', 'edit-body');
  await editBodyField.pressSequentially('Review sprint progress, blockers, and next steps', { delay: 30 });
  mark('scene-2', 'type-end', 'edit-body');
  await page.waitForTimeout(600);

  // Save
  const saveBtn = page.getByRole('button', { name: 'Save' });
  prevBox = await moveTo(page, saveBtn, prevBox);
  mark('scene-2', 'click', 'save-btn');
  await saveBtn.click();
  await page.waitForTimeout(1000);

  mark('scene-2', 'pause', 'view-saved');
  await page.waitForTimeout(1200);

  mark('scene-2', 'end');

  // ==================== SCENE 3: Create Second Note & Search ====================
  await page.waitForTimeout(1000);
  mark('scene-3', 'start');

  // Create second note
  const titleField2 = page.getByLabel('Note title');
  prevBox = await moveTo(page, titleField2, prevBox);
  mark('scene-3', 'click', 'note-title-2');
  await titleField2.click();
  mark('scene-3', 'type-start', 'note-title-2');
  await titleField2.pressSequentially('Project Ideas', { delay: 40 });
  mark('scene-3', 'type-end', 'note-title-2');
  await page.waitForTimeout(400);

  const bodyField2 = page.getByLabel('Note body');
  prevBox = await moveTo(page, bodyField2, prevBox);
  mark('scene-3', 'click', 'note-body-2');
  await bodyField2.click();
  mark('scene-3', 'type-start', 'note-body-2');
  await bodyField2.pressSequentially('Explore AI-powered features for v2', { delay: 30 });
  mark('scene-3', 'type-end', 'note-body-2');
  await page.waitForTimeout(500);

  const addBtn2 = page.getByRole('button', { name: 'Add Note' });
  prevBox = await moveTo(page, addBtn2, prevBox);
  mark('scene-3', 'click', 'add-note-btn-2');
  await addBtn2.click();
  await page.waitForTimeout(1000);

  // Search
  const searchField = page.getByLabel('Search notes');
  prevBox = await moveTo(page, searchField, prevBox);
  mark('scene-3', 'click', 'search');
  await searchField.click();
  mark('scene-3', 'type-start', 'search');
  await searchField.pressSequentially('Weekly', { delay: 50 });
  mark('scene-3', 'type-end', 'search');

  mark('scene-3', 'pause', 'view-search-results');
  await page.waitForTimeout(2000);

  mark('scene-3', 'end');

  // ==================== SCENE 4: Delete & Wrap Up ====================
  await page.waitForTimeout(1000);
  mark('scene-4', 'start');

  // Clear search first
  await searchField.clear();
  await page.waitForTimeout(500);

  // Click the first note in sidebar (Weekly Standup Notes)
  const firstNote = page.locator('text=Weekly Standup Notes').first();
  prevBox = await moveTo(page, firstNote, prevBox);
  mark('scene-4', 'click', 'first-note');
  await firstNote.click();
  await page.waitForTimeout(800);

  // Delete
  const deleteBtn = page.getByRole('button', { name: 'Delete' });
  prevBox = await moveTo(page, deleteBtn, prevBox);
  mark('scene-4', 'click', 'delete-btn');
  await deleteBtn.click();
  await page.waitForTimeout(1000);

  // Final pause
  mark('scene-4', 'pause', 'final');
  await page.waitForTimeout(2500);

  mark('scene-4', 'end');
});

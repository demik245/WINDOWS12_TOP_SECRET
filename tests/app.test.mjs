import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activateApp,
  createDesktopState,
  getFeaturedWidgets,
  getPinnedApps,
  getSecurityBaselines,
  getWorkspaceTemplates,
  searchApps,
  selectWorkspace,
  toggleFocusMode,
  toggleStartMenu,
  toggleTheme,
  updateSearchQuery
} from '../src/app.js';
import { APP_CATALOG, DEFAULT_PINNED_APP_IDS, WINDOWS_12_BUILD } from '../src/windows12Data.js';

test('default desktop state starts with Explorer active and dark theme', () => {
  const state = createDesktopState();

  assert.equal(state.activeAppId, 'app-001');
  assert.equal(state.theme, 'dark');
  assert.equal(state.isStartOpen, false);
  assert.equal(state.isFocusMode, false);
  assert.equal(state.apps.length, DEFAULT_PINNED_APP_IDS.length);
  assert.equal(state.build.name, WINDOWS_12_BUILD.name);
});

test('pinned apps are returned as defensive copies', () => {
  const firstRead = getPinnedApps();
  firstRead[0].name = 'Mutated';

  assert.equal(getPinnedApps()[0].name, 'Explorer 001');
});

test('the concept catalog is large enough for a broad Windows 12 shell', () => {
  assert.equal(APP_CATALOG.length, 800);
  assert.ok(getFeaturedWidgets().length >= 6);
  assert.ok(getWorkspaceTemplates().length >= 8);
  assert.ok(getSecurityBaselines().length >= 8);
});

test('start menu can be toggled or explicitly forced', () => {
  const state = createDesktopState();

  assert.equal(toggleStartMenu(state).isStartOpen, true);
  assert.equal(toggleStartMenu(state, true).isStartOpen, true);
  assert.equal(toggleStartMenu(state, false).isStartOpen, false);
});

test('focus mode closes the start menu', () => {
  const state = toggleStartMenu(createDesktopState(), true);
  const focused = toggleFocusMode(state);

  assert.equal(focused.isFocusMode, true);
  assert.equal(focused.isStartOpen, false);
});

test('theme toggles between dark and light', () => {
  const light = toggleTheme(createDesktopState());
  const dark = toggleTheme(light);

  assert.equal(light.theme, 'light');
  assert.equal(dark.theme, 'dark');
});

test('activating an app closes start, pins known apps, and ignores unknown apps', () => {
  const state = toggleStartMenu(createDesktopState(), true);
  const activated = activateApp(state, 'app-005');
  const newlyPinned = activateApp(activated, 'app-120');

  assert.equal(activated.activeAppId, 'app-005');
  assert.equal(activated.isStartOpen, false);
  assert.equal(newlyPinned.activeAppId, 'app-120');
  assert.ok(newlyPinned.apps.some((app) => app.id === 'app-120'));
  assert.equal(activateApp(newlyPinned, 'unknown'), newlyPinned);
});

test('search updates query, opens start, and returns matching catalog items', () => {
  const state = updateSearchQuery(createDesktopState(), 'security');

  assert.equal(state.searchQuery, 'security');
  assert.equal(state.isStartOpen, true);
  assert.ok(state.searchResults.length > 0);
  assert.ok(state.searchResults.every((app) => `${app.name} ${app.categoryLabel} ${app.description}`.toLowerCase().includes('security')));
  assert.ok(searchApps('terminal').some((app) => app.shortName === 'Terminal'));
});

test('workspace selection is deterministic and rejects unknown workspaces', () => {
  const state = createDesktopState();
  const selected = selectWorkspace(state, 'workspace-005');

  assert.equal(selected.selectedWorkspaceId, 'workspace-005');
  assert.equal(selected.isStartOpen, false);
  assert.equal(selectWorkspace(selected, 'missing'), selected);
});

import {
  APP_CATALOG,
  DEFAULT_PINNED_APP_IDS,
  SECURITY_BASELINES,
  WIDGET_DECK,
  WINDOWS_12_BUILD,
  WORKSPACE_TEMPLATES,
  findAppById,
  getAppsByCategory
} from './windows12Data.js';

const DEFAULT_ACTIVE_APP_ID = 'app-001';
const DEFAULT_PINNED_APPS = DEFAULT_PINNED_APP_IDS.map((appId) => findAppById(appId)).filter(Boolean);

export function getPinnedApps() {
  return DEFAULT_PINNED_APPS.map((app) => ({ ...app }));
}

export function getFeaturedWidgets(limit = 6) {
  return WIDGET_DECK.slice(0, limit).map((widget) => ({ ...widget }));
}

export function getWorkspaceTemplates(limit = 8) {
  return WORKSPACE_TEMPLATES.slice(0, limit).map((workspace) => ({
    ...workspace,
    appIds: [...workspace.appIds]
  }));
}

export function getSecurityBaselines() {
  return SECURITY_BASELINES.map((baseline) => ({ ...baseline }));
}

export function searchApps(query, limit = 12) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return APP_CATALOG.slice(0, limit).map((app) => ({ ...app }));
  }

  return APP_CATALOG
    .filter((app) => {
      const haystack = `${app.name} ${app.shortName} ${app.categoryLabel} ${app.status} ${app.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, limit)
    .map((app) => ({ ...app }));
}

export function createDesktopState(apps = getPinnedApps()) {
  const safeApps = apps.map((app) => ({ ...app }));
  return {
    apps: safeApps,
    activeAppId: safeApps[0]?.id ?? DEFAULT_ACTIVE_APP_ID,
    isStartOpen: false,
    isFocusMode: false,
    theme: 'dark',
    searchQuery: '',
    searchResults: searchApps('', 12),
    selectedWorkspaceId: WORKSPACE_TEMPLATES[0]?.id ?? null,
    build: { ...WINDOWS_12_BUILD }
  };
}

export function toggleStartMenu(state, force) {
  return {
    ...state,
    isStartOpen: typeof force === 'boolean' ? force : !state.isStartOpen
  };
}

export function toggleFocusMode(state) {
  return {
    ...state,
    isFocusMode: !state.isFocusMode,
    isStartOpen: false
  };
}

export function toggleTheme(state) {
  return {
    ...state,
    theme: state.theme === 'dark' ? 'light' : 'dark'
  };
}

export function activateApp(state, appId) {
  if (!APP_CATALOG.some((app) => app.id === appId)) {
    return state;
  }

  const isAlreadyPinned = state.apps.some((app) => app.id === appId);
  const activatedApp = findAppById(appId);
  const nextApps = isAlreadyPinned || !activatedApp
    ? state.apps
    : [...state.apps, { ...activatedApp }].slice(-10);

  return {
    ...state,
    apps: nextApps,
    activeAppId: appId,
    isStartOpen: false
  };
}

export function updateSearchQuery(state, query) {
  return {
    ...state,
    searchQuery: query,
    searchResults: searchApps(query, 12),
    isStartOpen: true
  };
}

export function selectWorkspace(state, workspaceId) {
  if (!WORKSPACE_TEMPLATES.some((workspace) => workspace.id === workspaceId)) {
    return state;
  }

  return {
    ...state,
    selectedWorkspaceId: workspaceId,
    isFocusMode: false,
    isStartOpen: false
  };
}

function formatDateParts(date = new Date()) {
  return {
    time: new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(date),
    date: new Intl.DateTimeFormat([], { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
  };
}

function createButton(app, state, className) {
  const button = document.createElement('button');
  button.className = className;
  button.dataset.appId = app.id;
  button.type = 'button';
  button.style.setProperty('--app-accent', app.accent);
  button.setAttribute('aria-pressed', String(state.activeAppId === app.id));
  button.innerHTML = `<span aria-hidden="true">${app.icon}</span><small>${app.shortName}</small>`;
  return button;
}

function renderAppButtons(container, state, className) {
  container.replaceChildren(...state.apps.map((app) => createButton(app, state, className)));
}

function renderSearchResults(container, state) {
  container.replaceChildren(
    ...state.searchResults.map((app) => {
      const button = createButton(app, state, 'search-result');
      button.insertAdjacentHTML('beforeend', `<em>${app.categoryLabel}</em>`);
      return button;
    })
  );
}

function renderWidgetDeck(container) {
  container.replaceChildren(
    ...getFeaturedWidgets(6).map((widget) => {
      const card = document.createElement('article');
      card.className = 'mini-widget';
      card.innerHTML = `
        <span>${widget.label}</span>
        <strong>${widget.metric}</strong>
        <small>${widget.detail}</small>
      `;
      return card;
    })
  );
}

function renderWorkspaceRail(container, state) {
  container.replaceChildren(
    ...getWorkspaceTemplates(8).map((workspace) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'workspace-card';
      button.dataset.workspaceId = workspace.id;
      button.setAttribute('aria-pressed', String(workspace.id === state.selectedWorkspaceId));
      button.innerHTML = `
        <strong>${workspace.name}</strong>
        <small>${workspace.focusProfile}</small>
      `;
      return button;
    })
  );
}

function renderSecurityList(container) {
  container.replaceChildren(
    ...getSecurityBaselines().slice(0, 8).map((baseline) => {
      const item = document.createElement('li');
      item.innerHTML = `<strong>${baseline.name}</strong><span>${baseline.state}</span>`;
      return item;
    })
  );
}

function renderCategoryPills(container) {
  const categories = [...new Set(APP_CATALOG.map((app) => app.category))].slice(0, 12);
  container.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement('button');
      const apps = getAppsByCategory(category);
      button.type = 'button';
      button.className = 'category-pill';
      button.dataset.searchTerm = apps[0]?.categoryLabel ?? category;
      button.innerHTML = `<strong>${apps[0]?.categoryLabel ?? category}</strong><small>${apps.length} modules</small>`;
      return button;
    })
  );
}

function setWindowState(state) {
  document.querySelectorAll('[data-window]').forEach((windowElement) => {
    const isActive = windowElement.dataset.window === state.activeAppId;
    windowElement.classList.toggle('active', isActive);
  });
}

function updateBuildLabels(state) {
  document.querySelectorAll('[data-build-label]').forEach((label) => {
    label.textContent = `${state.build.name} · ${state.build.build}`;
  });
  document.querySelectorAll('[data-integrity-label]').forEach((label) => {
    label.textContent = state.build.integrity;
  });
}

function updateDom(state) {
  document.documentElement.dataset.theme = state.theme;
  document.body.classList.toggle('focus-mode', state.isFocusMode);

  const startMenu = document.querySelector('[data-start-menu]');
  if (startMenu) {
    startMenu.classList.toggle('open', state.isStartOpen);
    startMenu.setAttribute('aria-hidden', String(!state.isStartOpen));
  }

  document.querySelectorAll('[data-app-id]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.appId === state.activeAppId));
  });

  document.querySelectorAll('[data-workspace-id]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.workspaceId === state.selectedWorkspaceId));
  });

  const searchInput = document.querySelector('[data-search-input]');
  if (searchInput && searchInput.value !== state.searchQuery) {
    searchInput.value = state.searchQuery;
  }

  setWindowState(state);
  updateBuildLabels(state);
}

function bootDesktop() {
  let state = createDesktopState();
  const pinnedApps = document.querySelector('[data-pinned-apps]');
  const taskbarApps = document.querySelector('[data-taskbar-apps]');
  const searchResults = document.querySelector('[data-search-results]');
  const widgetDeck = document.querySelector('[data-widget-deck]');
  const workspaceRail = document.querySelector('[data-workspace-rail]');
  const securityList = document.querySelector('[data-security-list]');
  const categoryPills = document.querySelector('[data-category-pills]');
  const clock = document.querySelector('[data-clock]');
  const dateLabel = document.querySelector('[data-date]');

  const renderStatefulCollections = () => {
    if (pinnedApps) renderAppButtons(pinnedApps, state, 'pinned-app');
    if (taskbarApps) renderAppButtons(taskbarApps, state, 'taskbar-app');
    if (searchResults) renderSearchResults(searchResults, state);
    if (workspaceRail) renderWorkspaceRail(workspaceRail, state);
  };

  if (widgetDeck) renderWidgetDeck(widgetDeck);
  if (securityList) renderSecurityList(securityList);
  if (categoryPills) renderCategoryPills(categoryPills);
  renderStatefulCollections();

  const setState = (nextState) => {
    state = nextState;
    renderStatefulCollections();
    updateDom(state);
  };

  document.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    const appButton = event.target.closest('[data-app-id]');
    const workspaceButton = event.target.closest('[data-workspace-id]');
    const categoryButton = event.target.closest('[data-search-term]');

    if (appButton) {
      setState(activateApp(state, appButton.dataset.appId));
      return;
    }

    if (workspaceButton) {
      setState(selectWorkspace(state, workspaceButton.dataset.workspaceId));
      return;
    }

    if (categoryButton) {
      setState(updateSearchQuery(state, categoryButton.dataset.searchTerm));
      return;
    }

    if (!actionButton) return;

    const action = actionButton.dataset.action;
    if (action === 'open-start') setState(toggleStartMenu(state));
    if (action === 'toggle-focus') setState(toggleFocusMode(state));
    if (action === 'toggle-theme') setState(toggleTheme(state));
    if (action === 'minimize') setState(activateApp(state, DEFAULT_ACTIVE_APP_ID));
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-search-input]')) {
      setState(updateSearchQuery(state, event.target.value));
    }
  });

  const updateClock = () => {
    const parts = formatDateParts();
    if (clock) clock.textContent = parts.time;
    if (dateLabel) dateLabel.textContent = parts.date;
  };

  updateClock();
  setInterval(updateClock, 30_000);
  updateDom(state);
}

if (typeof document !== 'undefined') {
  bootDesktop();
}

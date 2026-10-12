/**
 * Launchpad — Vanilla JavaScript Application Logic
 * Implements Task 2 (Responsive Board) & Task 3 (REST API Client)
 * Strict Safe DOM Methods • Zero innerHTML Injection • Accessible Dialog Management
 */

(function () {
  'use strict';

  // State Management
  const state = {
    mode: 'auto', // 'auto', 'api', or 'local'
    isApiLive: false,
    apiBaseUrl: '/api',
    localDataUrl: './data/internships.json',
    allInternships: [],
    filteredInternships: [],
    activeInternship: null,
    lastFocusedElement: null,
    localApplications: [] // For offline duplicate detection simulation
  };

  // DOM Elements
  const elements = {
    // Status Bar & Metrics
    statusDot: document.getElementById('statusDot'),
    statusLabel: document.getElementById('statusLabel'),
    apiStatusBadge: document.getElementById('apiStatusBadge'),
    toggleModeBtn: document.getElementById('toggleModeBtn'),
    currentSourceTag: document.getElementById('currentSourceTag'),
    metricRoles: document.getElementById('metricRoles'),

    // Search & Filter Controls
    filterForm: document.getElementById('filterForm'),
    searchInput: document.getElementById('searchInput'),
    domainFilter: document.getElementById('domainFilter'),
    modeFilter: document.getElementById('modeFilter'),
    sortFilter: document.getElementById('sortFilter'),
    resetBtn: document.getElementById('resetBtn'),

    // Listings & Results
    resultsCount: document.getElementById('resultsCount'),
    refreshBtn: document.getElementById('refreshBtn'),
    internshipsContainer: document.getElementById('internshipsContainer'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    emptyResetBtn: document.getElementById('emptyResetBtn'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    fallbackBtn: document.getElementById('fallbackBtn'),

    // Accessible Dialog & Modal
    detailDialog: document.getElementById('detailDialog'),
    closeDetailBtn: document.getElementById('closeDetailBtn'),
    dialogCloseBottomBtn: document.getElementById('dialogCloseBottomBtn'),
    dialogDomain: document.getElementById('dialogDomain'),
    dialogMode: document.getElementById('dialogMode'),
    dialogId: document.getElementById('dialogId'),
    dialogTitle: document.getElementById('dialogTitle'),
    dialogLocation: document.getElementById('dialogLocation'),
    dialogDuration: document.getElementById('dialogDuration'),
    dialogOpenings: document.getElementById('dialogOpenings'),
    dialogStatus: document.getElementById('dialogStatus'),
    dialogDescription: document.getElementById('dialogDescription'),
    dialogSkills: document.getElementById('dialogSkills'),

    // Application Form
    applicationForm: document.getElementById('applicationForm'),
    appInternshipId: document.getElementById('appInternshipId'),
    applicantName: document.getElementById('applicantName'),
    applicantEmail: document.getElementById('applicantEmail'),
    portfolioUrl: document.getElementById('portfolioUrl'),
    applicantNotes: document.getElementById('applicantNotes'),
    nameError: document.getElementById('nameError'),
    emailError: document.getElementById('emailError'),
    urlError: document.getElementById('urlError'),
    formAlert: document.getElementById('formAlert'),
    submitAppBtn: document.getElementById('submitAppBtn'),
    submitBtnText: document.getElementById('submitBtnText'),
    submitSpinner: document.getElementById('submitSpinner')
  };

  // Safe Email & URL Regex
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  /**
   * Health Check: Test whether live Express REST API is responsive
   */
  async function checkApiHealth() {
    try {
      const response = await fetch(`${state.apiBaseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (response.ok) {
        const body = await response.json();
        return body.status === 'success';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Initialize Connectivity and Mode
   */
  async function initConnectivity() {
    updateStatusIndicator('checking', 'Connecting...');
    const healthy = await checkApiHealth();
    state.isApiLive = healthy;

    if (state.mode === 'auto') {
      state.mode = healthy ? 'api' : 'local';
    }

    applyModeVisuals();
  }

  function applyModeVisuals() {
    if (state.mode === 'api' && state.isApiLive) {
      updateStatusIndicator('live', 'Live API Mode (Connected)');
      if (elements.currentSourceTag) {
        elements.currentSourceTag.textContent = 'Source: Express REST API (SQLite)';
      }
      elements.toggleModeBtn.textContent = 'Switch to Local Demo';
    } else {
      updateStatusIndicator('fallback', 'Local Demo Mode (Offline Seed)');
      if (elements.currentSourceTag) {
        elements.currentSourceTag.textContent = 'Source: Local JSON Seed';
      }
      elements.toggleModeBtn.textContent = 'Switch to Live API';
    }
  }

  function updateStatusIndicator(type, labelText) {
    elements.statusDot.className = 'status-dot';
    if (type === 'live') {
      elements.statusDot.classList.add('status-live');
    } else if (type === 'fallback') {
      elements.statusDot.classList.add('status-fallback');
    } else {
      elements.statusDot.classList.add('status-checking');
    }
    elements.statusLabel.textContent = labelText;
  }

  /**
   * Fetch Internships from selected source
   */
  async function fetchInternships() {
    showLoading();

    try {
      if (state.mode === 'api' && state.isApiLive) {
        // Query live API with current filters
        const params = new URLSearchParams();
        const search = elements.searchInput.value.trim();
        const domain = elements.domainFilter.value;
        const mode = elements.modeFilter.value;
        const sort = elements.sortFilter.value;

        if (search) params.append('search', search);
        if (domain) params.append('domain', domain);
        if (mode) params.append('mode', mode);
        if (sort) params.append('sort', sort);
        params.append('limit', '50');

        const res = await fetch(`${state.apiBaseUrl}/internships?${params.toString()}`);
        if (!res.ok) throw new Error(`API responded with HTTP ${res.status}`);

        const result = await res.json();
        if (result.status === 'success') {
          state.filteredInternships = result.data || [];
          renderInternships(state.filteredInternships);
        } else {
          throw new Error(result.message || 'API query error');
        }
      } else {
        // Load local JSON seed
        if (state.allInternships.length === 0) {
          const res = await fetch(state.localDataUrl);
          if (!res.ok) throw new Error(`Failed to load ${state.localDataUrl}`);
          const json = await res.json();
          state.allInternships = json.internships || [];
        }

        // Apply client-side filters
        applyClientFilters();
      }
    } catch (err) {
      console.warn('Listing load error:', err);
      // Auto-fallback if API failed
      if (state.mode === 'api') {
        state.mode = 'local';
        state.isApiLive = false;
        applyModeVisuals();
        fetchInternships();
      } else {
        showError(err.message || 'Could not load internship records.');
      }
    }
  }

  /**
   * Client-side Filtering & Sorting for Local Demo Mode
   */
  function applyClientFilters() {
    const query = elements.searchInput.value.trim().toLowerCase();
    const domain = elements.domainFilter.value;
    const mode = elements.modeFilter.value;
    const sort = elements.sortFilter.value;

    let list = state.allInternships.filter(item => {
      // Domain filter
      if (domain && item.domain !== domain) return false;

      // Mode filter
      if (mode && item.mode !== mode) return false;

      // Keyword search across title, domain, location, skills
      if (query) {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const domainMatch = (item.domain || '').toLowerCase().includes(query);
        const locationMatch = (item.location || '').toLowerCase().includes(query);
        const modeMatch = (item.mode || '').toLowerCase().includes(query);
        const skillsMatch = Array.isArray(item.skills) && item.skills.some(s => s.toLowerCase().includes(query));

        if (!titleMatch && !domainMatch && !locationMatch && !modeMatch && !skillsMatch) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    if (sort === 'title_asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'duration_desc') {
      list.sort((a, b) => (b.duration_weeks || 0) - (a.duration_weeks || 0));
    }

    state.filteredInternships = list;
    renderInternships(list);
  }

  /**
   * Safe DOM Card Construction
   * Strictly uses document.createElement, textContent, and setAttribute.
   * Zero unsafe innerHTML injection.
   */
  function createInternshipCard(item) {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `${item.title} at ${item.domain}`);

    // Card Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';

    const badgeRow = document.createElement('div');
    badgeRow.className = 'card-badge-row';

    const domainBadge = document.createElement('span');
    domainBadge.className = 'badge-domain';
    domainBadge.textContent = item.domain;
    badgeRow.appendChild(domainBadge);

    const modeBadge = document.createElement('span');
    modeBadge.className = `badge-mode mode-${(item.mode || '').toLowerCase().replace(/\s+/g, '-')}`;
    modeBadge.textContent = item.mode;
    badgeRow.appendChild(modeBadge);

    cardHeader.appendChild(badgeRow);

    const idBadge = document.createElement('span');
    idBadge.className = 'badge-id';
    idBadge.textContent = item.id;
    cardHeader.appendChild(idBadge);

    card.appendChild(cardHeader);

    // Card Title
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;
    card.appendChild(title);

    // Meta Row (Location, Duration, Openings)
    const metaRow = document.createElement('div');
    metaRow.className = 'card-meta-row';

    const locationItem = document.createElement('span');
    locationItem.className = 'meta-item';
    locationItem.textContent = `📍 ${item.location || 'India'}`;
    metaRow.appendChild(locationItem);

    const durationItem = document.createElement('span');
    durationItem.className = 'meta-item';
    durationItem.textContent = `⏱️ ${item.duration_weeks || 4} wks`;
    metaRow.appendChild(durationItem);

    const openingsItem = document.createElement('span');
    openingsItem.className = 'meta-item';
    const count = item.openings !== undefined ? item.openings : 1;
    openingsItem.textContent = `👥 ${count} ${count === 1 ? 'opening' : 'openings'}`;
    metaRow.appendChild(openingsItem);

    card.appendChild(metaRow);

    // Description snippet
    const desc = document.createElement('p');
    desc.className = 'card-description';
    desc.textContent = item.description || 'Gain hands-on engineering experience working alongside senior mentors.';
    card.appendChild(desc);

    // Skills tag cloud
    const skillsWrap = document.createElement('div');
    skillsWrap.className = 'skills-wrap';
    const skills = Array.isArray(item.skills) ? item.skills : [];
    skills.forEach(skillText => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skillText;
      skillsWrap.appendChild(tag);
    });
    card.appendChild(skillsWrap);

    // Card Footer
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const statusIndicator = document.createElement('span');
    const isOpen = item.applications_open !== undefined ? Boolean(item.applications_open) : true;
    statusIndicator.className = `status-indicator ${isOpen ? 'status-open' : 'status-closed'}`;
    statusIndicator.textContent = isOpen ? '● Accepting' : '● Closed';
    footer.appendChild(statusIndicator);

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'btn btn-secondary';
    actionBtn.textContent = 'View Details';
    actionBtn.setAttribute('aria-haspopup', 'dialog');
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailModal(item, actionBtn);
    });
    footer.appendChild(actionBtn);

    card.appendChild(footer);

    // Clicking card opens modal
    card.addEventListener('click', () => {
      openDetailModal(item, card);
    });

    // Enter key activates card
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        openDetailModal(item, card);
      }
    });

    return card;
  }

  /**
   * Render Internships list to DOM
   */
  function renderInternships(list) {
    hideAllStates();

    // Update count indicator
    const totalCount = list.length;
    elements.resultsCount.textContent = `Showing ${totalCount} ${totalCount === 1 ? 'internship' : 'internships'}`;
    if (elements.metricRoles) {
      elements.metricRoles.textContent = String(totalCount);
    }

    if (totalCount === 0) {
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.internshipsContainer.replaceChildren();

    const fragment = document.createDocumentFragment();
    list.forEach(item => {
      fragment.appendChild(createInternshipCard(item));
    });

    elements.internshipsContainer.appendChild(fragment);
  }

  function showLoading() {
    hideAllStates();
    elements.loadingState.classList.remove('hidden');
    elements.resultsCount.textContent = 'Fetching opportunities...';
  }

  function showError(msg) {
    hideAllStates();
    elements.errorState.classList.remove('hidden');
    elements.errorMessage.textContent = msg || 'An error occurred while loading data.';
    elements.resultsCount.textContent = 'Error loading results';
  }

  function hideAllStates() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
  }

  /**
   * Modal Management: Open Accessible Detail Dialog
   */
  function openDetailModal(item, triggerEl) {
    state.activeInternship = item;
    state.lastFocusedElement = triggerEl || document.activeElement;

    // Populate modal fields
    elements.dialogId.textContent = item.id;
    elements.dialogTitle.textContent = item.title;
    elements.dialogSubtitle.textContent = `${item.domain} • ${item.mode}`;
    elements.dialogDomain.textContent = item.domain;
    elements.dialogMode.textContent = item.mode;
    elements.dialogMode.className = `badge-mode mode-${(item.mode || '').toLowerCase().replace(/\s+/g, '-')}`;

    elements.dialogLocation.textContent = item.location || 'India';
    elements.dialogDuration.textContent = `${item.duration_weeks || 4} Weeks`;
    const openings = item.openings !== undefined ? item.openings : 1;
    elements.dialogOpenings.textContent = `${openings} ${openings === 1 ? 'Opening' : 'Openings'}`;

    const isOpen = item.applications_open !== undefined ? Boolean(item.applications_open) : true;
    elements.dialogStatus.textContent = isOpen ? 'Accepting Applications' : 'Applications Closed';
    elements.dialogStatus.style.color = isOpen ? 'var(--success)' : 'var(--danger)';

    elements.dialogDescription.textContent = item.description || 'Hands-on practical development role designed for software engineering trainees.';

    // Populate Skills
    elements.dialogSkills.replaceChildren();
    const skills = Array.isArray(item.skills) ? item.skills : [];
    skills.forEach(skillText => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skillText;
      elements.dialogSkills.appendChild(tag);
    });

    // Reset Application Form inside dialog
    resetApplicationForm(item.id);

    // Disable application button if applications are closed
    if (!isOpen) {
      elements.submitAppBtn.disabled = true;
      elements.submitBtnText.textContent = 'Applications Closed';
      showFormAlert('Applications for this position are currently closed.', 'danger');
    } else {
      elements.submitAppBtn.disabled = false;
      elements.submitBtnText.textContent = 'Submit Application';
    }

    // Open dialog via HTML5 dialog API
    if (typeof elements.detailDialog.showModal === 'function') {
      elements.detailDialog.showModal();
    } else {
      elements.detailDialog.setAttribute('open', '');
    }

    elements.closeDetailBtn.focus();
  }

  /**
   * Close Accessible Detail Dialog & Restore Focus
   */
  function closeDetailModal() {
    if (typeof elements.detailDialog.close === 'function') {
      elements.detailDialog.close();
    } else {
      elements.detailDialog.removeAttribute('open');
    }

    state.activeInternship = null;

    // Restore focus to original trigger element
    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
      state.lastFocusedElement.focus();
    }
  }

  /**
   * Reset Application Form
   */
  function resetApplicationForm(internshipId) {
    elements.applicationForm.reset();
    elements.appInternshipId.value = internshipId || '';
    elements.nameError.textContent = '';
    elements.emailError.textContent = '';
    elements.urlError.textContent = '';
    elements.formAlert.classList.add('hidden');
    elements.formAlert.className = 'alert-box hidden';
    elements.formAlert.replaceChildren();
  }

  function showFormAlert(message, type) {
    elements.formAlert.className = `alert-box alert-${type}`;
    elements.formAlert.textContent = message;
    elements.formAlert.classList.remove('hidden');
  }

  /**
   * Application Form Submission Handler
   */
  async function handleApplicationSubmit(e) {
    e.preventDefault();

    // Clear previous errors
    elements.nameError.textContent = '';
    elements.emailError.textContent = '';
    elements.urlError.textContent = '';
    elements.formAlert.classList.add('hidden');

    const name = elements.applicantName.value.trim();
    const email = elements.applicantEmail.value.trim();
    const url = elements.portfolioUrl.value.trim();
    const notes = elements.applicantNotes.value.trim();
    const internshipId = elements.appInternshipId.value.trim();

    let hasErrors = false;

    if (!name || name.length < 2) {
      elements.nameError.textContent = 'Please enter your full name (minimum 2 characters).';
      hasErrors = true;
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      elements.emailError.textContent = 'Please enter a valid email address.';
      hasErrors = true;
    }

    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          elements.urlError.textContent = 'Only HTTP or HTTPS URLs are permitted.';
          hasErrors = true;
        }
      } catch (err) {
        elements.urlError.textContent = 'Please enter a valid URL (e.g. https://github.com/username).';
        hasErrors = true;
      }
    }

    if (hasErrors) return;

    // Submission payload
    const payload = {
      internship_id: internshipId,
      applicant_name: name,
      applicant_email: email,
      portfolio_url: url || null,
      notes: notes || null
    };

    setSubmitLoading(true);

    try {
      if (state.mode === 'api' && state.isApiLive) {
        // Send to live Express REST API
        const response = await fetch(`${state.apiBaseUrl}/applications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.status === 201) {
          showFormAlert(`✓ Success! Application submitted. Confirmation ID: APP-${data.data.id}`, 'success');
          elements.applicationForm.reset();
        } else if (response.status === 409) {
          showFormAlert(data.message || 'You have already applied for this position with this email address.', 'danger');
        } else {
          showFormAlert(data.message || 'Submission failed. Please check your inputs.', 'danger');
        }
      } else {
        // Local Demo Simulation Mode
        const duplicateKey = `${internshipId}::${email.toLowerCase()}`;
        if (state.localApplications.includes(duplicateKey)) {
          showFormAlert('Duplicate Application: An application with this email already exists for this role.', 'danger');
        } else {
          state.localApplications.push(duplicateKey);
          showFormAlert('✓ Success! Application recorded locally (Offline Demo Mode).', 'success');
          elements.applicationForm.reset();
        }
      }
    } catch (err) {
      showFormAlert(`Error submitting application: ${err.message}`, 'danger');
    } finally {
      setSubmitLoading(false);
    }
  }

  function setSubmitLoading(loading) {
    elements.submitAppBtn.disabled = loading;
    if (loading) {
      elements.submitSpinner.classList.remove('hidden');
      elements.submitBtnText.textContent = 'Submitting...';
    } else {
      elements.submitSpinner.classList.add('hidden');
      elements.submitBtnText.textContent = 'Submit Application';
    }
  }

  /**
   * Reset All Filters & Search
   */
  function resetAllFilters() {
    elements.searchInput.value = '';
    elements.domainFilter.value = '';
    elements.modeFilter.value = '';
    elements.sortFilter.value = 'newest';
    fetchInternships();
  }

  /**
   * Toggle between Live API Mode and Local Seed Mode
   */
  function toggleMode() {
    if (state.mode === 'api') {
      state.mode = 'local';
    } else {
      state.mode = 'api';
    }
    applyModeVisuals();
    fetchInternships();
  }

  /**
   * Attach Event Listeners
   */
  function setupEventListeners() {
    // Filter controls
    let debounceTimer = null;
    elements.searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (state.mode === 'api' && state.isApiLive) {
          fetchInternships();
        } else {
          applyClientFilters();
        }
      }, 250);
    });

    elements.domainFilter.addEventListener('change', () => {
      if (state.mode === 'api' && state.isApiLive) {
        fetchInternships();
      } else {
        applyClientFilters();
      }
    });

    elements.modeFilter.addEventListener('change', () => {
      if (state.mode === 'api' && state.isApiLive) {
        fetchInternships();
      } else {
        applyClientFilters();
      }
    });

    elements.sortFilter.addEventListener('change', () => {
      if (state.mode === 'api' && state.isApiLive) {
        fetchInternships();
      } else {
        applyClientFilters();
      }
    });

    // Reset buttons
    elements.resetBtn.addEventListener('click', resetAllFilters);
    elements.emptyResetBtn.addEventListener('click', resetAllFilters);
    elements.refreshBtn.addEventListener('click', fetchInternships);
    elements.retryBtn.addEventListener('click', fetchInternships);

    elements.fallbackBtn.addEventListener('click', () => {
      state.mode = 'local';
      applyModeVisuals();
      fetchInternships();
    });

    elements.toggleModeBtn.addEventListener('click', toggleMode);

    // Dialog controls
    elements.closeDetailBtn.addEventListener('click', closeDetailModal);
    elements.dialogCloseBottomBtn.addEventListener('click', closeDetailModal);

    // Escape key closes dialog & click outside
    elements.detailDialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDetailModal();
      }
    });

    elements.detailDialog.addEventListener('click', (e) => {
      const rect = elements.detailDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeDetailModal();
      }
    });

    // Application form submit
    elements.applicationForm.addEventListener('submit', handleApplicationSubmit);
  }

  /**
   * App Bootstrap
   */
  async function init() {
    setupEventListeners();
    await initConnectivity();
    await fetchInternships();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

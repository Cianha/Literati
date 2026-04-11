/* ══════════════════════════════════════
   LITERATI — Profile & Share (Phase 5)
   ══════════════════════════════════════ */

const Profile = (() => {
  const KEY = 'literati_profile';

  const defaultProfile = () => ({
    name:      'Bookworm',
    username:  'reader',
    bio:       '',
    avatar:    '📚',
    favBooks:  [null, null, null, null],
    joinedAt:  Date.now(),
  });

  const get  = ()  => ({ ...defaultProfile(), ...(JSON.parse(localStorage.getItem(KEY) || 'null') || {}) });
  const save = (p) => { localStorage.setItem(KEY, JSON.stringify(p)); };

  /* ── Initials from name ── */
  const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  /* ── Render page ── */
  const render = () => {
    const p     = get();
    const stats = Storage.getStats();
    const streak = Storage.getStreakStats();

    updateNavAvatar(p);

    /* Cover gradient (random per username) */
    renderSidebar(p, stats, streak);
    renderMain(p, stats);
  };

  const updateNavAvatar = (p) => {
    const el = document.getElementById('nav-avatar-content');
    if (!el) return;
    const ini = initials(p.name);
    el.textContent = ini || '?';
  };

  const renderSidebar = (p, stats, streak) => {
    setText('profile-name',     p.name || 'Bookworm');
    setText('profile-username', '@' + (p.username || 'reader'));
    setText('profile-bio',      p.bio  || 'No bio yet. Click Edit Profile to add one.');
    setText('profile-join',     'Joined ' + new Date(p.joinedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

    setText('pstat-books',  stats.displayFinished.length);
    setText('pstat-pages',  stats.totalPages.toLocaleString());
    setText('pstat-rating', stats.avgRating !== '—' ? stats.avgRating + '★' : '—');
    setText('pstat-streak', streak.current + '🔥');
  };

  const renderMain = (p, stats) => {
    /* Favourite books */
    renderFavSlots(p);

    /* Recent activity */
    const recent = stats.books.filter(b => b.finishDate).sort((a,b) => new Date(b.finishDate) - new Date(a.finishDate)).slice(0, 6);
    const rEl = document.getElementById('profile-recent-list');
    if (rEl) {
      if (!recent.length) {
        rEl.innerHTML = '<div class="empty-state" style="padding:1.5rem"><div class="empty-icon">📖</div><div class="empty-sub">No finished books yet.</div></div>';
      } else {
        rEl.innerHTML = recent.map(b => `
          <div class="diary-entry${b.favourite ? ' fav' : parseFloat(b.rating) >= 4.5 ? ' highlight' : ''}" onclick="showBookDetail('${b.id}')">
            <span class="diary-entry-day">${new Date(b.finishDate + 'T00:00:00').getDate()}</span>
            <span class="diary-entry-title">${b.title}</span>
            <span class="diary-entry-rating">${starsHTML(b.rating, true)}</span>
          </div>`).join('');
      }
    }

    /* Recommendations: top rated books */
    const recs = stats.books.filter(b => parseFloat(b.rating) >= 4).sort((a,b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 3);
    const recEl = document.getElementById('profile-recs-list');
    if (recEl) {
      if (!recs.length) {
        recEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem">Rate books 4★ or above to see them here as recommendations.</div>';
      } else {
        recEl.innerHTML = recs.map(b => `
          <div class="fav-picker-item" onclick="showBookDetail('${b.id}')">
            <div class="fav-picker-cover">${b.coverUrl ? `<img src="${b.coverUrl}" alt="">` : '📚'}</div>
            <div>
              <div class="fav-picker-title">${b.title}</div>
              <div class="fav-picker-author">${b.author || 'Unknown'} · ${starsHTML(b.rating, true)}</div>
            </div>
          </div>`).join('');
      }
    }
  };

  const renderFavSlots = (p) => {
    const container = document.getElementById('profile-favs-grid');
    if (!container) return;
    container.innerHTML = p.favBooks.map((id, i) => {
      const book = id ? Storage.getBook(id) : null;
      if (book) {
        return `
          <div class="profile-fav-slot" onclick="Profile.openFavPicker(${i})">
            ${book.coverUrl ? `<img src="${book.coverUrl}" alt="${book.title}">` : `<div class="fav-placeholder"><i data-lucide="book" class="lucide lucide-xl"></i><span>${book.title.slice(0,20)}</span></div>`}
            <button class="fav-remove" onclick="event.stopPropagation();Profile.removeFav(${i})">
              <i data-lucide="x" class="lucide lucide-sm"></i>
            </button>
          </div>`;
      }
      return `
        <div class="profile-fav-slot" onclick="Profile.openFavPicker(${i})">
          <div class="fav-placeholder">
            <i data-lucide="plus" class="lucide lucide-lg"></i>
            <span>Add fav</span>
          </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
  };

  /* ── Fav picker ── */
  let pickerSlot = 0;
  const openFavPicker = (slotIndex) => {
    pickerSlot = slotIndex;
    renderFavPickerList('');
    document.getElementById('fav-picker-overlay').classList.add('open');
    document.getElementById('fav-picker-search-input').value = '';
    document.getElementById('fav-picker-search-input').focus();
  };

  const renderFavPickerList = (q) => {
    const books = Storage.getBooks().filter(b =>
      !q || (b.title || '').toLowerCase().includes(q.toLowerCase()) || (b.author || '').toLowerCase().includes(q.toLowerCase())
    ).slice(0, 20);
    const el = document.getElementById('fav-picker-list');
    if (!el) return;
    if (!books.length) {
      el.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-dim);font-size:0.8rem">No books found</div>';
      return;
    }
    el.innerHTML = books.map(b => `
      <div class="fav-picker-item" onclick="Profile.selectFav('${b.id}')">
        <div class="fav-picker-cover">${b.coverUrl ? `<img src="${b.coverUrl}" alt="">` : '📚'}</div>
        <div>
          <div class="fav-picker-title">${b.title}</div>
          <div class="fav-picker-author">${b.author || 'Unknown'}</div>
        </div>
      </div>`).join('');
  };

  const selectFav = (bookId) => {
    const p = get();
    p.favBooks[pickerSlot] = bookId;
    save(p);
    document.getElementById('fav-picker-overlay').classList.remove('open');
    renderFavSlots(p);
    Toast.show('❤️ Favourite book set!');
  };

  const removeFav = (slotIndex) => {
    const p = get();
    p.favBooks[slotIndex] = null;
    save(p);
    renderFavSlots(p);
  };

  /* ── Edit profile modal ── */
  const openEditModal = () => {
    const p = get();
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    s('edit-profile-name',     p.name);
    s('edit-profile-username', p.username);
    s('edit-profile-bio',      p.bio);
    s('edit-profile-avatar',   p.avatar);
    document.getElementById('profile-edit-overlay').classList.add('open');
  };

  const saveEdit = () => {
    const g = (id) => document.getElementById(id)?.value?.trim();
    const p = get();
    p.name     = g('edit-profile-name')     || 'Bookworm';
    p.username = (g('edit-profile-username') || 'reader').replace(/\s/g, '').toLowerCase();
    p.bio      = g('edit-profile-bio')      || '';
    p.avatar   = g('edit-profile-avatar')   || '📚';
    save(p);
    document.getElementById('profile-edit-overlay').classList.remove('open');
    render();
    Toast.show('✅ Profile updated!');
  };

  /* ── Share profile ── */
  const share = () => {
    const p      = get();
    const stats  = Storage.getStats();
    const streak = Storage.getStreakStats();
    const favs   = p.favBooks.map(id => {
      const b = id ? Storage.getBook(id) : null;
      return b ? { title: b.title, author: b.author, coverUrl: b.coverUrl } : null;
    });

    const shareData = {
      name:     p.name,
      username: p.username,
      bio:      p.bio,
      avatar:   p.avatar,
      stats: {
        finished: stats.displayFinished.length,
        pages:    stats.totalPages,
        rating:   stats.avgRating,
        streak:   streak.current,
      },
      favs,
    };

    const code    = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
    const shareURL = `${location.href.split('#')[0]}#share=${code}`;

    navigator.clipboard.writeText(shareURL).then(() => {
      Toast.show('🔗 Share link copied to clipboard!');
    }).catch(() => {
      /* Fallback: show in a prompt */
      prompt('Copy your share link:', shareURL);
    });
  };

  /* ── Init ── */
  const init = () => {
    /* Check URL hash for incoming share view */
    checkShareURL();

    /* Fav picker search */
    const searchEl = document.getElementById('fav-picker-search-input');
    if (searchEl) searchEl.addEventListener('input', e => renderFavPickerList(e.target.value));

    /* Close fav picker */
    const fpOverlay = document.getElementById('fav-picker-overlay');
    if (fpOverlay) fpOverlay.addEventListener('click', e => { if (e.target === fpOverlay) fpOverlay.classList.remove('open'); });
    document.getElementById('fav-picker-close')?.addEventListener('click', () => fpOverlay?.classList.remove('open'));

    /* Edit modal */
    const editOverlay = document.getElementById('profile-edit-overlay');
    if (editOverlay) editOverlay.addEventListener('click', e => { if (e.target === editOverlay) editOverlay.classList.remove('open'); });
    document.getElementById('profile-edit-close')?.addEventListener('click', () => editOverlay?.classList.remove('open'));
    document.getElementById('profile-edit-save')?.addEventListener('click', saveEdit);
    document.getElementById('profile-edit-btn')?.addEventListener('click', openEditModal);

    /* Share button */
    document.getElementById('profile-share-btn')?.addEventListener('click', share);

    /* Share view close */
    document.getElementById('share-view-close')?.addEventListener('click', () => {
      document.getElementById('share-view-overlay').classList.remove('open');
      history.replaceState(null, '', location.pathname);
    });
  };

  /* ── Check for incoming shared profile URL ── */
  const checkShareURL = () => {
    const hash = location.hash;
    const match = hash.match(/^#share=(.+)/);
    if (!match) return;
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(match[1]))));
      renderShareView(data);
    } catch(e) {
      console.warn('Invalid share link', e);
    }
  };

  const renderShareView = (data) => {
    const overlay = document.getElementById('share-view-overlay');
    if (!overlay) return;

    setText('sv-name',    data.name || 'Bookworm');
    setText('sv-username','@' + (data.username || 'reader'));
    setText('sv-bio',     data.bio || '');
    setText('sv-avatar',  data.avatar || '📚');
    setText('sv-books',   data.stats?.finished || 0);
    setText('sv-pages',   (data.stats?.pages || 0).toLocaleString());
    setText('sv-rating',  (data.stats?.rating !== '—' && data.stats?.rating) ? data.stats.rating + '★' : '—');
    setText('sv-streak',  (data.stats?.streak || 0) + '🔥');

    const favsEl = document.getElementById('sv-favs');
    if (favsEl) {
      favsEl.innerHTML = (data.favs || []).map(b => b
        ? `<div class="share-fav-book">${b.coverUrl ? `<img src="${b.coverUrl}" alt="${b.title}">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:0.65rem;padding:0.5rem;text-align:center">${b.title}</div>`}</div>`
        : `<div class="share-fav-book" style="background:var(--surface)"></div>`
      ).join('');
    }

    overlay.classList.add('open');
  };

  return {
    render, init, get, save, initials,
    openFavPicker, selectFav, removeFav,
    openEditModal, saveEdit, share, checkShareURL,
  };
})();

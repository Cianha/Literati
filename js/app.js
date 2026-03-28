/* ════════════════════════════════
   LITERATI — App Core
   Navigation · Modal · Toast · Add Book
   ════════════════════════════════ */

/* ── Navigation ── */
const Nav = (() => {
  let current = 'dashboard';

  const init = () => {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => go(tab.dataset.page));
    });
    go(current);
  };

  const go = (page) => {
    current = page;
    document.querySelectorAll('.nav-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.page === page));
    document.querySelectorAll('.page').forEach(p =>
      p.classList.toggle('active', p.id === 'page-' + page));
    if (page === 'dashboard') Dashboard.render();
    if (page === 'tracker')   Tracker.render();
    if (page === 'library')   Library.render();
  };

  return { init, go };
})();

/* ── Toast ── */
const Toast = (() => {
  let el;
  const init = () => { el = document.getElementById('toast'); };
  const show = (msg, ms = 2800) => {
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), ms);
  };
  return { init, show };
})();

/* ── Modal ── */
const Modal = (() => {
  let overlay, modal;

  const init = () => {
    overlay = document.getElementById('modal-overlay');
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('modal-close').addEventListener('click', close);
  };

  const open = () => overlay.classList.add('open');
  const close = () => {
    overlay.classList.remove('open');
    resetForm();
  };

  const resetForm = () => {
    document.getElementById('book-form').reset();
    document.getElementById('form-book-id').value = '';
    document.getElementById('modal-title').textContent = 'Add a Book';
    setStars(0);
  };

  return { init, open, close };
})();

/* ── Star Rating Input ── */
let selectedRating = 0;

const setStars = (rating) => {
  selectedRating = rating;
  document.querySelectorAll('.star-input span').forEach((s, i) => {
    s.classList.toggle('active', i < rating);
    s.textContent = i < rating ? '★' : '☆';
  });
  document.getElementById('input-rating').value = rating;
};

const initStars = () => {
  document.querySelectorAll('.star-input span').forEach((s, i) => {
    s.addEventListener('click', () => setStars(i + 1));
    s.addEventListener('mouseenter', () => {
      document.querySelectorAll('.star-input span').forEach((x, j) => {
        x.textContent = j <= i ? '★' : '☆';
      });
    });
  });
  document.querySelector('.star-input').addEventListener('mouseleave', () => setStars(selectedRating));
};

/* ── Add / Edit Book Form ── */
const BookForm = (() => {

  const STATUS_LABELS = {
    finished: 'Finished',
    reading:  'Reading',
    tbr:      'To Be Read',
    paused:   'Paused',
    dnf:      'Did Not Finish',
  };

  const submit = () => {
    const get = (id) => document.getElementById(id)?.value.trim();

    const title = get('input-title');
    if (!title) { Toast.show('📚 Please enter a book title.'); return; }

    const book = {
      id:          get('form-book-id') || '',
      title,
      author:      get('input-author'),
      genre:       get('input-genre'),
      status:      get('input-status') || 'tbr',
      startDate:   get('input-start-date'),
      finishDate:  get('input-finish-date'),
      format:      get('input-format') || 'physical',
      pages:       get('input-pages'),
      series:      get('input-series'),
      bookNumber:  get('input-book-number'),
      cost:        get('input-cost'),
      summary:     get('input-summary'),
      quote:       get('input-quote'),
      rating:      get('input-rating') || 0,
      favourite:   false,
      coverUrl:    get('input-cover-url'),
    };

    const saved = Storage.saveBook(book);
    if (saved) {
      Modal.close();
      Toast.show(book.id ? '✏️ Book updated!' : '📖 Book added to your library!');
      // Re-render active page
      const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
      if (activePage === 'dashboard') Dashboard.render();
      if (activePage === 'tracker')   Tracker.render();
      if (activePage === 'library')   Library.render();
    }
  };

  const populate = (book) => {
    document.getElementById('form-book-id').value     = book.id;
    document.getElementById('input-title').value      = book.title || '';
    document.getElementById('input-author').value     = book.author || '';
    document.getElementById('input-genre').value      = book.genre || '';
    document.getElementById('input-status').value     = book.status || 'tbr';
    document.getElementById('input-start-date').value = book.startDate || '';
    document.getElementById('input-finish-date').value= book.finishDate || '';
    document.getElementById('input-format').value     = book.format || 'physical';
    document.getElementById('input-pages').value      = book.pages || '';
    document.getElementById('input-series').value     = book.series || '';
    document.getElementById('input-book-number').value= book.bookNumber || '';
    document.getElementById('input-cost').value       = book.cost || '';
    document.getElementById('input-summary').value    = book.summary || '';
    document.getElementById('input-quote').value      = book.quote || '';
    document.getElementById('input-cover-url').value  = book.coverUrl || '';
    setStars(parseFloat(book.rating) || 0);
    document.getElementById('modal-title').textContent = 'Edit Book';
  };

  const init = () => {
    document.getElementById('btn-save-book').addEventListener('click', submit);
    document.getElementById('nav-add-btn').addEventListener('click', () => {
      Modal.close();
      Modal.open();
    });
  };

  return { init, populate };
})();

/* ── Helpers ── */
const statusBadge = (status) => {
  const map = {
    finished: ['badge-green',  'Finished'],
    reading:  ['badge-gold',   'Reading'],
    tbr:      ['badge-sky',    'TBR'],
    paused:   ['badge-amber',  'Paused'],
    dnf:      ['badge-rose',   'DNF'],
  };
  const [cls, label] = map[status] || ['badge-sky', status];
  return `<span class="badge ${cls}">${label}</span>`;
};

const starsHTML = (rating, sm = false) => {
  const r = parseFloat(rating) || 0;
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆';
  return `<span class="stars${sm ? ' sm' : ''}">${s}</span>`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
};

const coverImg = (book, cls = '') => {
  if (book.coverUrl) return `<img src="${book.coverUrl}" alt="${book.title}" class="${cls}" onerror="this.style.display='none'">`;
  return '';
};

const SPINE_COLORS = ['#5C7A5C','#8B6A2E','#4E6E8E','#9E4E4E','#6A4E8E','#4E7A6A','#8E6A4E','#5A7A4E'];

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Modal.init();
  BookForm.init();
  initStars();
  Nav.init();
});
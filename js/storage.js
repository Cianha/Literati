/* ════════════════════════════════
   LITERATI — Storage Module
   All localStorage operations live here
   ════════════════════════════════ */

const Storage = (() => {

  const KEYS = {
    BOOKS:    'literati_books',
    SETTINGS: 'literati_settings',
  };

  /* ── Helpers ── */
  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };

  const save = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch { console.error('Storage write failed'); return false; }
  };

  /* ── Books ── */
  const getBooks = () => load(KEYS.BOOKS, []);

  const saveBook = (book) => {
    const books = getBooks();
    if (book.id) {
      // Update existing
      const idx = books.findIndex(b => b.id === book.id);
      if (idx > -1) books[idx] = { ...books[idx], ...book, updatedAt: Date.now() };
      else books.push(book);
    } else {
      // New book
      book.id        = 'book_' + Date.now();
      book.createdAt = Date.now();
      book.updatedAt = Date.now();
      books.unshift(book); // newest first
    }
    return save(KEYS.BOOKS, books) ? book : null;
  };

  const deleteBook = (id) => {
    const books = getBooks().filter(b => b.id !== id);
    return save(KEYS.BOOKS, books);
  };

  const getBook = (id) => getBooks().find(b => b.id === id) || null;

  const toggleFavourite = (id) => {
    const books = getBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx > -1) { books[idx].favourite = !books[idx].favourite; save(KEYS.BOOKS, books); return books[idx].favourite; }
    return false;
  };

  /* ── Settings ── */
  const getSettings = () => load(KEYS.SETTINGS, { yearlyGoal: 24, currentYear: new Date().getFullYear() });
  const saveSettings = (s) => save(KEYS.SETTINGS, { ...getSettings(), ...s });

  /* ── Analytics helpers ── */
  const getStats = () => {
    const books    = getBooks();
    const settings = getSettings();
    const year     = settings.currentYear;

    const thisYear = books.filter(b => {
      if (!b.finishDate) return false;
      return new Date(b.finishDate).getFullYear() === year;
    });

    const finished  = books.filter(b => b.status === 'finished');
    const reading   = books.filter(b => b.status === 'reading');
    const dnf       = books.filter(b => b.status === 'dnf');
    const paused    = books.filter(b => b.status === 'paused');
    const tbr       = books.filter(b => b.status === 'tbr');

    const totalPages = finished.reduce((sum, b) => sum + (parseInt(b.pages) || 0), 0);
    const avgRating  = finished.length
      ? (finished.reduce((s, b) => s + (parseFloat(b.rating) || 0), 0) / finished.length).toFixed(1)
      : '—';

    // Monthly count (current year)
    const monthly = Array(12).fill(0);
    thisYear.forEach(b => {
      const m = new Date(b.finishDate).getMonth();
      monthly[m]++;
    });

    // Ratings breakdown
    const ratings = [5,4,3,2,1].map(r => ({
      stars: r,
      count: finished.filter(b => Math.round(parseFloat(b.rating)) === r).length
    }));

    return { books, finished, reading, dnf, paused, tbr, thisYear, totalPages, avgRating, monthly, ratings, settings };
  };

  return { getBooks, saveBook, deleteBook, getBook, toggleFavourite, getSettings, saveSettings, getStats };
})();
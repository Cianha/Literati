/* ══════════════════════════════════════
   LITERATI — Storage v4  (Phase 4 final)
   ══════════════════════════════════════ */
const Storage = (() => {
  const KEYS = {
    BOOKS:    'literati_books',
    WISHLIST: 'literati_wishlist',
    UPCOMING: 'literati_upcoming',
    SETTINGS: 'literati_settings',
    STREAK:   'literati_streak',
  };

  const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  const save = (k, d)  => { try { localStorage.setItem(k, JSON.stringify(d)); return true; } catch(e) { console.error(e); return false; } };

  const todayStr   = () => new Date().toISOString().split('T')[0];
  const offsetDate = (ds, days) => { const d = new Date(ds+'T00:00:00'); d.setDate(d.getDate()+days); return d.toISOString().split('T')[0]; };
  const dateYear   = (ds) => ds ? new Date(ds+'T00:00:00').getFullYear() : null;

  /* ── Books ── */
  const getBooks  = () => load(KEYS.BOOKS, []);
  const saveBook  = (book) => {
    const books = getBooks();
    if (book.id) {
      const i = books.findIndex(b => b.id === book.id);
      if (i > -1) books[i] = { ...books[i], ...book, updatedAt: Date.now() };
      else books.push({ ...book, updatedAt: Date.now() });
    } else {
      book.id = 'book_' + Date.now();
      book.createdAt = book.updatedAt = Date.now();
      books.unshift(book);
    }
    return save(KEYS.BOOKS, books) ? book : null;
  };
  const deleteBook = (id) => save(KEYS.BOOKS, getBooks().filter(b => b.id !== id));
  const getBook    = (id) => getBooks().find(b => b.id === id) || null;
  const toggleFav  = (id) => {
    const books = getBooks(), i = books.findIndex(b => b.id === id);
    if (i > -1) { books[i].favourite = !books[i].favourite; save(KEYS.BOOKS, books); return books[i].favourite; }
    return false;
  };

  /* ── Wishlist ── */
  const getWishlist = () => load(KEYS.WISHLIST, []);
  const saveWish = (item) => {
    const list = getWishlist();
    if (item.id) { const i = list.findIndex(w => w.id === item.id); if (i > -1) list[i] = { ...list[i], ...item }; else list.push(item); }
    else { item.id = 'wish_' + Date.now(); item.createdAt = Date.now(); list.unshift(item); }
    return save(KEYS.WISHLIST, list) ? item : null;
  };
  const deleteWish    = (id) => save(KEYS.WISHLIST, getWishlist().filter(w => w.id !== id));
  const wishToLibrary = (id) => {
    const w = getWishlist().find(x => x.id === id); if (!w) return null;
    const b = saveBook({ title: w.title, author: w.author, genre: w.genre, coverUrl: w.coverUrl, status: 'tbr' });
    deleteWish(id); return b;
  };

  /* ── Upcoming ── */
  const getUpcoming = () => load(KEYS.UPCOMING, []);
  const saveUpcoming = (item) => {
    const list = getUpcoming();
    if (item.id) { const i = list.findIndex(u => u.id === item.id); if (i > -1) list[i] = { ...list[i], ...item }; else list.push(item); }
    else { item.id = 'up_' + Date.now(); item.createdAt = Date.now(); list.unshift(item); }
    return save(KEYS.UPCOMING, list) ? item : null;
  };
  const deleteUpcoming    = (id) => save(KEYS.UPCOMING, getUpcoming().filter(u => u.id !== id));
  const upcomingToLibrary = (id) => {
    const u = getUpcoming().find(x => x.id === id); if (!u) return null;
    const b = saveBook({ title: u.title, author: u.author, genre: u.genre, coverUrl: u.coverUrl, status: 'tbr' });
    deleteUpcoming(id); return b;
  };

  /* ── Settings ── */
  const defaultSettings = () => ({ yearlyGoal: 24, selectedYear: 'all', theme: 'dark' });
  const getSettings  = () => ({ ...defaultSettings(), ...load(KEYS.SETTINGS, {}) });
  const saveSettings = (s) => save(KEYS.SETTINGS, { ...getSettings(), ...s });

  /* ── Streak ── */
  const getStreak     = () => load(KEYS.STREAK, {});
  const logReadingDay = (ds, pages) => { const s = getStreak(); s[ds] = Math.max(0, parseInt(pages) || 1); return save(KEYS.STREAK, s); };
  const getStreakStats = () => {
    const streak = getStreak(), today = todayStr();
    const dates  = Object.keys(streak).filter(d => streak[d] > 0).sort();
    let current = 0, check = today;
    while (streak[check] > 0) { current++; check = offsetDate(check, -1); }
    if (current === 0) { check = offsetDate(today, -1); while (streak[check] > 0) { current++; check = offsetDate(check, -1); } }
    let longest = 0, run = 0, prev = null;
    dates.forEach(d => { if (prev && offsetDate(prev,1)===d) run++; else run=1; if (run>longest) longest=run; prev=d; });
    const totalPagesLogged = Object.values(streak).reduce((s,v) => s+(v||0), 0);
    const daysLogged = dates.length;
    const avgPagesDay = daysLogged ? Math.round(totalPagesLogged / daysLogged) : 0;
    return { streak, current, longest, totalPagesLogged, daysLogged, avgPagesDay, todayLogged: (streak[today]||0) > 0, today };
  };

  /* ── Stats (year-aware) ── */
  const getStats = (yearFilter) => {
    const books    = getBooks();
    const settings = getSettings();
    const year     = yearFilter !== undefined ? yearFilter : settings.selectedYear;

    // Filter by year if not 'all'
    const filterByYear = (b) => {
      if (year === 'all') return true;
      const y = parseInt(year);
      return dateYear(b.finishDate) === y || dateYear(b.startDate) === y || dateYear(b.createdAt ? new Date(b.createdAt).getFullYear().toString() : null) === y;
    };

    const yearBooks  = year === 'all' ? books : books.filter(filterByYear);
    const thisYear   = books.filter(b => b.finishDate && (year === 'all' || dateYear(b.finishDate) === parseInt(year)));
    const finished   = books.filter(b => b.status === 'finished');
    const reading    = books.filter(b => b.status === 'reading');
    const dnf        = books.filter(b => b.status === 'dnf');
    const paused     = books.filter(b => b.status === 'paused');
    const tbr        = books.filter(b => b.status === 'tbr');
    const favourites = books.filter(b => b.favourite);

    const displayFinished = year === 'all' ? finished : books.filter(b => b.status === 'finished' && (year === 'all' || dateYear(b.finishDate) === parseInt(year)));
    const totalPages  = displayFinished.reduce((s,b) => s + (parseInt(b.pages)||0), 0);
    const avgRating   = displayFinished.length ? (displayFinished.reduce((s,b) => s+(parseFloat(b.rating)||0),0)/displayFinished.length).toFixed(1) : '—';

    // Monthly (always current display year)
    const displayYear = year === 'all' ? new Date().getFullYear() : parseInt(year);
    const monthly     = Array(12).fill(0);
    const monthlyPages= Array(12).fill(0);
    books.filter(b => b.finishDate && dateYear(b.finishDate) === displayYear).forEach(b => {
      const m = new Date(b.finishDate+'T00:00:00').getMonth();
      monthly[m]++;
      monthlyPages[m] += (parseInt(b.pages)||0);
    });

    const ratings = [5,4,3,2,1].map(r => ({ stars:r, count: finished.filter(b => Math.round(parseFloat(b.rating)) === r).length }));

    const genreMap = {};
    books.forEach(b => { if (b.genre) genreMap[b.genre] = (genreMap[b.genre]||0)+1; });
    const genres = Object.entries(genreMap).sort((a,b)=>b[1]-a[1]).map(([name,count]) => ({ name, count, pct: books.length ? Math.round(count/books.length*100):0 }));

    const authorMap = {};
    finished.forEach(b => { if (b.author) authorMap[b.author] = (authorMap[b.author]||0)+1; });
    const topAuthors = Object.entries(authorMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count]) => ({name,count}));

    const withDur = finished.filter(b => b.startDate && b.finishDate && b.pages);
    const avgPagesPerDay = withDur.length ? Math.round(withDur.reduce((s,b) => {
      const days = Math.max(1, (new Date(b.finishDate) - new Date(b.startDate)) / 86400000);
      return s + (parseInt(b.pages)/days);
    }, 0) / withDur.length) : 0;

    // Available years for selector
    const years = [...new Set(books.map(b => dateYear(b.finishDate) || dateYear(b.startDate)).filter(Boolean))].sort((a,b)=>b-a);

    return { books, yearBooks, finished, displayFinished, reading, dnf, paused, tbr, favourites, thisYear,
             totalPages, avgRating, monthly, monthlyPages, ratings, genres, topAuthors, avgPagesPerDay, settings, years };
  };

  return {
    getBooks, saveBook, deleteBook, getBook, toggleFav,
    getWishlist, saveWish, deleteWish, wishToLibrary,
    getUpcoming, saveUpcoming, deleteUpcoming, upcomingToLibrary,
    getSettings, saveSettings,
    getStreak, logReadingDay, getStreakStats,
    getStats, todayStr, offsetDate,
  };
})();

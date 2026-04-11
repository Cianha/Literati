/* ══════════════════════════════════════
   LITERATI — Reading Diary (Phase 5)
   ══════════════════════════════════════ */

const Diary = (() => {

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const render = () => {
    /* Get all books that have a finishDate, sorted newest first */
    const books = Storage.getBooks()
      .filter(b => b.finishDate)
      .sort((a, b) => new Date(b.finishDate) - new Date(a.finishDate));

    setText('diary-count', books.length);

    const list = document.getElementById('diary-list');
    if (!list) return;

    if (!books.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i data-lucide="book-open" class="lucide lucide-2xl" style="opacity:0.35;color:var(--gold)"></i></div>
          <div class="empty-title">Your diary is empty</div>
          <div class="empty-sub">Books you finish will appear here, organised by date.</div>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    /* Group by year-month */
    const groups = {};
    books.forEach(b => {
      const d   = new Date(b.finishDate + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
      if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), entries: [] };
      groups[key].entries.push({ book: b, day: d.getDate() });
    });

    /* Render groups */
    list.innerHTML = Object.values(groups).map(g => {
      const entriesHTML = g.entries.map(({ book, day }) => {
        const isFav       = book.favourite;
        const rating      = parseFloat(book.rating) || 0;
        const isHighlight = !isFav && rating >= 4.5;
        const cls         = isFav ? ' fav' : isHighlight ? ' highlight' : '';
        const ratingStr   = rating > 0 ? '★'.repeat(Math.round(rating)) : '';

        return `
          <div class="diary-entry${cls}" onclick="showBookDetail('${book.id}')">
            <span class="diary-entry-day">${day}</span>
            <span class="diary-entry-title">${book.title}</span>
            ${ratingStr ? `<span class="diary-entry-rating">${ratingStr}</span>` : ''}
          </div>`;
      }).join('');

      /* Show year label if entries span multiple years */
      const yearLabel = g.year !== new Date().getFullYear() ? `<span style="font-size:0.62rem;color:var(--text-dim);margin-left:4px">${g.year}</span>` : '';

      return `
        <div class="diary-month-group fade-up">
          <div class="diary-month-badge">
            <div class="diary-month-abbr">${MONTHS[g.month]}${yearLabel}</div>
            <div class="diary-month-line"></div>
          </div>
          <div class="diary-entries">${entriesHTML}</div>
        </div>`;
    }).join('');
  };

  return { render };
})();

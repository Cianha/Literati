/* ════════════════════════════════
   LITERATI — Dashboard
   ════════════════════════════════ */

const Dashboard = (() => {

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const render = () => {
    const stats = Storage.getStats();
    renderStats(stats);
    renderDonut(stats);
    renderGoal(stats);
    renderRatings(stats);
    renderMonthly(stats);
    renderShelf(stats);
    renderRecent(stats);
  };

  const renderStats = ({ finished, reading, totalPages, avgRating }) => {
    document.getElementById('dash-total').textContent   = finished.length;
    document.getElementById('dash-reading').textContent = reading.length;
    document.getElementById('dash-pages').textContent   = totalPages.toLocaleString();
    document.getElementById('dash-rating').textContent  = avgRating + (avgRating !== '—' ? '★' : '');
  };

  const renderDonut = ({ finished, reading, dnf, paused, books }) => {
    const total = books.length || 1;
    const pF = Math.round(finished.length / total * 100);
    const pR = Math.round(reading.length  / total * 100);
    const pD = Math.round(dnf.length      / total * 100);

    const cumF  = pF;
    const cumR  = pF + pR;
    const cumD  = pF + pR + pD;

    const donut = document.getElementById('dash-donut');
    donut.style.background = `conic-gradient(
      var(--green) 0% ${cumF}%,
      var(--gold)  ${cumF}% ${cumR}%,
      var(--rose)  ${cumR}% ${cumD}%,
      var(--sky)   ${cumD}% 100%
    )`;
    document.getElementById('donut-total').textContent = books.length;

    document.getElementById('legend-finished').textContent = pF + '%';
    document.getElementById('legend-reading').textContent  = pR + '%';
    document.getElementById('legend-dnf').textContent      = pD + '%';
    document.getElementById('legend-paused').textContent   = (100 - cumD) + '%';
  };

  const renderGoal = ({ thisYear, settings }) => {
    const goal = settings.yearlyGoal || 24;
    const done = thisYear.length;
    const pct  = Math.min(Math.round(done / goal * 100), 100);
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (circumference * pct / 100);

    document.getElementById('goal-pct-text').textContent = pct + '%';
    document.getElementById('goal-sub').textContent      = `${done} of ${goal} books · ${Math.max(goal - done, 0)} to go`;

    setTimeout(() => {
      const prog = document.getElementById('goal-prog');
      if (prog) prog.style.strokeDashoffset = offset;
    }, 200);
  };

  const renderRatings = ({ ratings, finished }) => {
    const maxCount = Math.max(...ratings.map(r => r.count), 1);
    ratings.forEach(r => {
      const fill  = document.getElementById(`bar-${r.stars}`);
      const count = document.getElementById(`count-${r.stars}`);
      if (fill)  setTimeout(() => { fill.style.width = (r.count / maxCount * 100) + '%'; }, 200);
      if (count) count.textContent = r.count;
    });
  };

  const renderMonthly = ({ monthly }) => {
    const chart  = document.getElementById('month-chart');
    const max    = Math.max(...monthly, 1);
    chart.innerHTML = '';
    monthly.forEach((v, i) => {
      const col = document.createElement('div');
      col.className = 'month-col';
      const bar = document.createElement('div');
      bar.className = 'month-bar' + (v === max && v > 0 ? ' peak' : '') + (v === 0 ? ' empty' : '');
      bar.title = `${MONTHS[i]}: ${v} book${v !== 1 ? 's' : ''}`;
      const lbl = document.createElement('div');
      lbl.className = 'month-lbl';
      lbl.textContent = MONTHS[i][0];
      col.appendChild(bar);
      col.appendChild(lbl);
      chart.appendChild(col);
      setTimeout(() => {
        bar.style.height = v === 0 ? '4px' : `${(v / max) * 100}%`;
      }, 300 + i * 40);
    });
  };

  const renderShelf = ({ books }) => {
    const shelf = document.getElementById('bookshelf');
    shelf.innerHTML = '';
    if (!books.length) {
      shelf.innerHTML = '<div style="display:flex;align-items:center;padding:1rem;color:var(--text-dim);font-size:0.8rem;">Your shelf is empty — add some books!</div>';
      return;
    }
    books.slice(0, 30).forEach((b, i) => {
      const spine = document.createElement('div');
      const color = SPINE_COLORS[i % SPINE_COLORS.length];
      const h = 60 + Math.floor(Math.random() * 45);
      spine.className = 'book-spine';
      spine.style.cssText = `background:${color};height:${h}px;`;
      spine.textContent = b.title;
      spine.title = b.title;
      spine.addEventListener('click', () => showBookDetail(b.id));
      shelf.appendChild(spine);
    });
  };

  const renderRecent = ({ books }) => {
    const container = document.getElementById('recent-list');
    const recent = books.slice(0, 5);
    if (!recent.length) {
      container.innerHTML = '<div class="empty-state" style="padding:1.5rem;"><div class="empty-icon">📖</div><div class="empty-sub">No books yet</div></div>';
      return;
    }
    container.innerHTML = recent.map(b => `
      <div class="activity-item" onclick="showBookDetail('${b.id}')" style="cursor:pointer">
        <div class="activity-cover">${b.coverUrl ? `<img src="${b.coverUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" onerror="this.outerHTML='📚'">` : '📚'}</div>
        <div class="activity-info">
          <div class="activity-title">${b.title}</div>
          <div class="activity-meta">${b.author || 'Unknown author'} · ${statusBadge(b.status)}</div>
        </div>
      </div>
    `).join('');
  };

  return { render };
})();

/* ── Book Detail Modal (shared) ── */
function showBookDetail(id) {
  const book = Storage.getBook(id);
  if (!book) return;

  const overlay = document.getElementById('detail-overlay');
  document.getElementById('detail-title').textContent    = book.title;
  document.getElementById('detail-author').textContent   = book.author || '—';
  document.getElementById('detail-genre').textContent    = book.genre  || '—';
  document.getElementById('detail-status').innerHTML     = statusBadge(book.status);
  document.getElementById('detail-start').textContent    = formatDate(book.startDate);
  document.getElementById('detail-finish').textContent   = formatDate(book.finishDate);
  document.getElementById('detail-pages').textContent    = book.pages  || '—';
  document.getElementById('detail-format').textContent   = book.format || '—';
  document.getElementById('detail-series').textContent   = book.series ? `${book.series}${book.bookNumber ? ' #' + book.bookNumber : ''}` : '—';
  document.getElementById('detail-cost').textContent     = book.cost ? '$' + book.cost : '—';
  document.getElementById('detail-summary').textContent  = book.summary || 'No summary added.';
  document.getElementById('detail-stars').innerHTML      = starsHTML(book.rating);

  const quoteEl = document.getElementById('detail-quote');
  if (book.quote) {
    quoteEl.textContent = `"${book.quote}"`;
    quoteEl.style.display = '';
  } else {
    quoteEl.style.display = 'none';
  }

  const coverEl = document.getElementById('detail-cover');
  if (book.coverUrl) {
    coverEl.innerHTML = `<img src="${book.coverUrl}" style="width:120px;aspect-ratio:2/3;object-fit:cover;border-radius:8px;border:1px solid var(--border);" onerror="this.outerHTML='<div style=width:120px;aspect-ratio:2/3;background:var(--surface);border-radius:8px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:2rem>📚</div>'">`;
  } else {
    coverEl.innerHTML = `<div style="width:120px;aspect-ratio:2/3;background:var(--surface);border-radius:8px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:2rem">📚</div>`;
  }

  document.getElementById('detail-edit-btn').onclick = () => {
    overlay.classList.remove('open');
    BookForm.populate(book);
    Modal.open();
  };
  document.getElementById('detail-delete-btn').onclick = () => {
    if (confirm(`Delete "${book.title}"?`)) {
      Storage.deleteBook(id);
      overlay.classList.remove('open');
      Toast.show('🗑️ Book deleted.');
      const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
      if (activePage === 'dashboard') Dashboard.render();
      if (activePage === 'tracker')   Tracker.render();
      if (activePage === 'library')   Library.render();
    }
  };

  overlay.classList.add('open');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open'); };
  document.getElementById('detail-close').onclick = () => overlay.classList.remove('open');
}
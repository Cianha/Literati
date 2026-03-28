/* ════════════════════════════════
   LITERATI — Tracker Module
   ════════════════════════════════ */

const Tracker = (() => {

  let filterStatus = 'all';
  let searchQuery  = '';

  const render = () => {
    const { books, finished, reading, totalPages } = Storage.getStats();

    // Stats bar
    document.getElementById('tr-total').textContent    = books.length;
    document.getElementById('tr-finished').textContent = finished.length;
    document.getElementById('tr-reading').textContent  = reading.length;
    document.getElementById('tr-pages').textContent    = totalPages.toLocaleString();

    renderTable(books);
  };

  const renderTable = (allBooks) => {
    let books = allBooks;

    if (filterStatus !== 'all') books = books.filter(b => b.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      books = books.filter(b =>
        (b.title  || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.genre  || '').toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('tracker-tbody');

    if (!books.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text-dim)">
        ${searchQuery || filterStatus !== 'all' ? '🔍 No books match your filter.' : '📚 No books yet — click <strong style="color:var(--gold)">+ Add Book</strong> to get started!'}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = books.map(b => `
      <tr onclick="showBookDetail('${b.id}')">
        <td>
          ${b.coverUrl
            ? `<img src="${b.coverUrl}" class="table-cover" onerror="this.outerHTML='<div class=table-cover-placeholder>📚</div>'">`
            : `<div class="table-cover-placeholder">📚</div>`}
        </td>
        <td>
          <div class="table-title">${b.title}</div>
          <div class="table-author">${b.author || '—'}</div>
        </td>
        <td style="color:var(--text-muted)">${b.genre || '—'}</td>
        <td>${statusBadge(b.status)}</td>
        <td style="color:var(--text-muted);white-space:nowrap">${formatDate(b.startDate)}</td>
        <td style="color:var(--text-muted);white-space:nowrap">${formatDate(b.finishDate)}</td>
        <td style="color:var(--text-muted)">${b.format || '—'}</td>
        <td>${starsHTML(b.rating, true)}</td>
        <td onclick="event.stopPropagation()">
          <div class="row-actions">
            <button class="row-action-btn" title="Edit" onclick="editBook('${b.id}')">✏️</button>
            <button class="row-action-btn delete" title="Delete" onclick="deleteBook('${b.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  const init = () => {
    // Search
    document.getElementById('tracker-search').addEventListener('input', e => {
      searchQuery = e.target.value;
      render();
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterStatus = chip.dataset.status;
        render();
      });
    });
  };

  return { render, init };
})();

/* ── Shared row actions ── */
function editBook(id) {
  const book = Storage.getBook(id);
  if (!book) return;
  BookForm.populate(book);
  Modal.open();
}

function deleteBook(id) {
  const book = Storage.getBook(id);
  if (!book) return;
  if (confirm(`Delete "${book.title}"?`)) {
    Storage.deleteBook(id);
    Toast.show('🗑️ Book deleted.');
    Tracker.render();
    Dashboard.render();
  }
}

/* ════════════════════════════════
   LITERATI — Library Module
   ════════════════════════════════ */

const Library = (() => {

  let searchQuery = '';
  let filterGenre = '';

  const render = () => {
    const books = Storage.getBooks();
    let filtered = books;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        (b.title  || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q)
      );
    }
    if (filterGenre) {
      filtered = filtered.filter(b => (b.genre || '').toLowerCase() === filterGenre.toLowerCase());
    }

    renderGenreFilters(books);
    renderGrid(filtered);
  };

  const renderGenreFilters = (books) => {
    const genres = [...new Set(books.map(b => b.genre).filter(Boolean))];
    const container = document.getElementById('genre-filters');
    container.innerHTML = `<button class="filter-chip lib-filter ${filterGenre === '' ? 'active' : ''}" data-genre="" onclick="Library._setGenre('')">All</button>` +
      genres.map(g => `<button class="filter-chip lib-filter ${filterGenre === g ? 'active' : ''}" data-genre="${g}" onclick="Library._setGenre('${g}')">${g}</button>`).join('');
  };

  const renderGrid = (books) => {
    const grid = document.getElementById('library-grid');

    if (!books.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📚</div>
        <div class="empty-title">Your library is empty</div>
        <div class="empty-sub">Add your first book to get started!</div>
      </div>`;
      return;
    }

    grid.innerHTML = books.map((b, i) => `
      <div class="book-card fade-up" style="animation-delay:${i * 0.04}s" onclick="showBookDetail('${b.id}')">
        <div class="book-cover-wrap">
          ${b.coverUrl
            ? `<img src="${b.coverUrl}" alt="${b.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML='<div class=book-cover-placeholder-lg><div class=icon>📚</div><span>${b.title.substring(0,20)}</span></div>'">`
            : `<div class="book-cover-placeholder-lg"><div class="icon">📚</div><span>${b.title.substring(0,20)}</span></div>`}
          <button class="book-fav-btn ${b.favourite ? 'active' : ''}"
            onclick="event.stopPropagation();toggleFav('${b.id}',this)"
            title="${b.favourite ? 'Remove from favourites' : 'Add to favourites'}">
            ${b.favourite ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="book-card-body">
          <div class="book-card-title">${b.title}</div>
          <div class="book-card-author">${b.author || 'Unknown'}</div>
          <div class="book-card-footer">
            ${starsHTML(b.rating, true)}
            ${statusBadge(b.status)}
          </div>
        </div>
      </div>
    `).join('');
  };

  const _setGenre = (genre) => {
    filterGenre = genre;
    render();
  };

  const init = () => {
    document.getElementById('library-search').addEventListener('input', e => {
      searchQuery = e.target.value;
      render();
    });
  };

  return { render, init, _setGenre };
})();

function toggleFav(id, btn) {
  const isFav = Storage.toggleFavourite(id);
  btn.textContent = isFav ? '❤️' : '🤍';
  btn.classList.toggle('active', isFav);
  Toast.show(isFav ? '❤️ Added to favourites!' : '🤍 Removed from favourites.');
}
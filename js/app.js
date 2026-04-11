/* ══ LITERATI — App Core v5 (Lucide + New Nav) ══ */

/* ── Helpers ── */
const statusBadge = (s) => {
  const m = { finished:['badge-green','Finished'], reading:['badge-gold','Reading'], tbr:['badge-sky','TBR'], paused:['badge-amber','Paused'], dnf:['badge-rose','DNF'] };
  const [c,l] = m[s]||['badge-sky',s];
  return `<span class="badge ${c}">${l}</span>`;
};
const starsHTML = (r, sm=false) => {
  let s=''; const v=parseFloat(r)||0;
  for(let i=1;i<=5;i++) s+=i<=v?'★':'☆';
  return `<span class="stars${sm?' sm':''}">${s}</span>`;
};
const fmtDate = (d) => {
  if(!d) return '—';
  try { return new Date(d+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
  catch { return d; }
};
const setText = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
const setHTML = (id, v) => { const el=document.getElementById(id); if(el) el.innerHTML=v; };
const SPINE_COLORS = ['#5C7A5C','#8B6A2E','#4E6E8E','#9E4E4E','#6A4E8E','#4E7A6A','#8E6A4E','#5A7A4E','#6E5A4E','#4E5A6E','#7A6E4E','#4E6E7A'];

/* ── Lucide init & refresh ── */
const refreshIcons = () => { if(window.lucide) lucide.createIcons(); };

/* ── Toast ── */
const Toast = (() => {
  let el, timer;
  const init = () => { el=document.getElementById('toast'); };
  const show = (msg, ms=2800) => { clearTimeout(timer); el.textContent=msg; el.classList.add('show'); timer=setTimeout(()=>el.classList.remove('show'),ms); };
  return { init, show };
})();

/* ── Nav (main tabs + dropdown) ── */
const Nav = (() => {
  let current = 'dashboard';
  const renderers = {};

  const register = (page, fn) => { renderers[page] = fn; };

  const init = () => {
    /* Main visible tabs */
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.addEventListener('click', () => go(t.dataset.page));
    });

    /* Dropdown items */
    document.querySelectorAll('.dropdown-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        go(item.dataset.page);
        closeDropdown();
      });
    });

    /* Profile nav button */
    document.getElementById('nav-profile-btn')?.addEventListener('click', () => go('profile'));

    /* More button */
    const moreBtn = document.getElementById('nav-more-btn');
    const dropdown = document.getElementById('nav-dropdown');
    moreBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      moreBtn.classList.toggle('open', isOpen);
    });
    document.addEventListener('click', () => closeDropdown());

    go(current);
  };

  const closeDropdown = () => {
    document.getElementById('nav-dropdown')?.classList.remove('open');
    document.getElementById('nav-more-btn')?.classList.remove('open');
  };

  const go = (page) => {
    current = page;

    /* Update main tabs */
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.page===page));

    /* Update dropdown items */
    document.querySelectorAll('.dropdown-item[data-page]').forEach(item => item.classList.toggle('active', item.dataset.page===page));

    /* Update profile button */
    document.getElementById('nav-profile-btn')?.classList.toggle('active', page==='profile');

    /* Show/hide pages */
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id==='page-'+page));

    /* Render */
    if (renderers[page]) renderers[page]();

    closeDropdown();
  };

  return { init, go, register, current: () => current };
})();

/* ── Modal (Add/Edit Book) ── */
const Modal = (() => {
  let overlay;
  const init = () => {
    overlay = document.getElementById('modal-overlay');
    overlay.addEventListener('click', e => { if(e.target===overlay) close(); });
    document.getElementById('modal-close').addEventListener('click', close);
  };
  const open  = () => overlay.classList.add('open');
  const close = () => { overlay.classList.remove('open'); BookForm.reset(); };
  return { init, open, close };
})();

/* ── Detail Modal ── */
const DetailModal = (() => {
  let overlay;
  const init = () => {
    overlay = document.getElementById('detail-overlay');
    overlay.addEventListener('click', e => { if(e.target===overlay) close(); });
    document.getElementById('detail-close').addEventListener('click', close);
  };
  const open  = () => overlay.classList.add('open');
  const close = () => overlay.classList.remove('open');
  return { init, open, close };
})();

/* ── Cover Search (Open Library) ── */
const CoverSearch = (() => {
  let currentQ='', timer=null;
  const search = async (q, rId='cover-results', sId='cover-status', uId='input-cover-url') => {
    if (!q.trim() || q===currentQ) return;
    currentQ = q;
    const results=document.getElementById(rId), status=document.getElementById(sId);
    if (!results||!status) return;
    results.classList.remove('hidden'); results.innerHTML=''; status.textContent='Searching…';
    try {
      const res  = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=12&fields=cover_i,title,author_name`);
      const data = await res.json();
      const books = (data.docs||[]).filter(b=>b.cover_i);
      if (!books.length) { status.textContent='No covers found. Paste a URL below.'; return; }
      status.textContent = `${books.length} found — click to select`;
      results.innerHTML = books.slice(0,10).map(b => {
        const url = `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`;
        return `<div class="cover-option" onclick="CoverSearch.select('${url}','${uId}',this)"><img src="${url}" alt="" loading="lazy"></div>`;
      }).join('');
    } catch { status.textContent='Search failed. Try pasting a URL.'; }
  };
  const select = (url, uId, el) => {
    document.getElementById(uId).value = url;
    el.closest('.cover-results').querySelectorAll('.cover-option').forEach(o=>o.classList.remove('selected'));
    el.classList.add('selected');
  };
  const init = () => {
    const inp=document.getElementById('cover-search-input'), btn=document.getElementById('cover-search-btn');
    inp.addEventListener('input', e => { clearTimeout(timer); timer=setTimeout(()=>search(e.target.value),600); });
    btn.addEventListener('click', () => search(inp.value));
    document.getElementById('input-title').addEventListener('blur', e => {
      if (e.target.value && !inp.value) { inp.value=e.target.value; search(e.target.value); }
    });
  };
  const reset = () => {
    currentQ='';
    const r=document.getElementById('cover-results'); if(r){r.innerHTML='';r.classList.add('hidden');}
    const s=document.getElementById('cover-status'); if(s) s.textContent='';
    const i=document.getElementById('cover-search-input'); if(i) i.value='';
  };
  return { init, search, select, reset };
})();

/* ── Star rating ── */
let selectedRating = 0;
const setStars = (r) => {
  selectedRating = r;
  document.querySelectorAll('.star-input span').forEach((s,i) => { s.classList.toggle('active',i<r); s.textContent=i<r?'★':'☆'; });
  document.getElementById('input-rating').value = r;
};
const initStars = () => {
  document.querySelectorAll('.star-input span').forEach((s,i) => {
    s.addEventListener('click', ()=>setStars(i+1));
    s.addEventListener('mouseenter', ()=>document.querySelectorAll('.star-input span').forEach((x,j)=>x.textContent=j<=i?'★':'☆'));
  });
  document.querySelector('.star-input').addEventListener('mouseleave', ()=>setStars(selectedRating));
};

/* ── Book Form ── */
const BookForm = (() => {
  const g = (id) => document.getElementById(id)?.value?.trim();
  const submit = async () => {
    const title = g('input-title');
    if (!title) { Toast.show('📚 Please enter a book title.'); return; }
    let coverUrl = g('input-cover-url');
    if (!coverUrl && !g('form-book-id')) {
      try {
        const author = g('input-author') ? `&author=${encodeURIComponent(g('input-author'))}` : '';
        const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}${author}&limit=1&fields=cover_i`);
        const data = await res.json();
        if (data.docs?.[0]?.cover_i) coverUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-M.jpg`;
      } catch (e) { console.warn('Auto-cover fetch failed', e); }
    }
    const book = {
      id: g('form-book-id')||'', title, author:g('input-author'), genre:g('input-genre'),
      status:g('input-status')||'tbr', format:g('input-format')||'physical',
      startDate:g('input-start-date'), finishDate:g('input-finish-date'),
      pages:g('input-pages'), series:g('input-series'), bookNumber:g('input-book-number'),
      cost:g('input-cost'), summary:g('input-summary'), quote:g('input-quote'),
      rating:g('input-rating')||0, coverUrl, favourite:false,
    };
    const saved = Storage.saveBook(book);
    if (saved) { Modal.close(); Toast.show(book.id?'✏️ Book updated!':'📖 Book added!'); rerenderActive(); }
  };
  const populate = (book) => {
    const s = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
    s('form-book-id',book.id); s('input-title',book.title); s('input-author',book.author);
    s('input-genre',book.genre); s('input-status',book.status); s('input-format',book.format);
    s('input-start-date',book.startDate); s('input-finish-date',book.finishDate);
    s('input-pages',book.pages); s('input-series',book.series); s('input-book-number',book.bookNumber);
    s('input-cost',book.cost); s('input-summary',book.summary); s('input-quote',book.quote);
    s('input-cover-url',book.coverUrl);
    setStars(parseFloat(book.rating)||0);
    document.getElementById('modal-title').textContent='Edit Book';
  };
  const reset = () => {
    document.getElementById('book-form').reset();
    document.getElementById('form-book-id').value='';
    document.getElementById('modal-title').textContent='Add a Book';
    setStars(0); CoverSearch.reset();
  };
  const init = () => {
    document.getElementById('btn-save-book').addEventListener('click', submit);
    document.getElementById('nav-add-btn').addEventListener('click', ()=>{ reset(); Modal.open(); });
  };
  return { init, populate, reset };
})();

/* ── Re-render active page ── */
const rerenderActive = () => {
  const page = Nav.current();
  const map  = { dashboard:()=>Dashboard.render(), tracker:()=>Tracker.render(), library:()=>Library.render(),
                  analytics:()=>Analytics.render(), favourites:()=>Favourites.render(), wishlist:()=>Wishlist.render(),
                  tbr:()=>TBRPage.render(), upcoming:()=>Upcoming.render(), diary:()=>Diary.render(),
                  profile:()=>Profile.render(), settings:()=>SettingsPage.render() };
  if (map[page]) map[page]();
};

/* ── Book actions ── */
function editBook(id)   { const b=Storage.getBook(id); if(!b)return; BookForm.populate(b); Modal.open(); }
function deleteBook(id,title) {
  if (!confirm(`Delete "${title||'this book'}"?`)) return;
  Storage.deleteBook(id); Toast.show('🗑️ Book removed.'); rerenderActive();
}
function toggleFav(id, btn) {
  const on = Storage.toggleFav(id);
  if (btn) { btn.textContent=on?'❤️':'🤍'; btn.classList.toggle('on',on); }
  Toast.show(on?'❤️ Added to favourites!':'🤍 Removed.');
  const page = Nav.current();
  if (page==='library')    Library.render();
  if (page==='favourites') Favourites.render();
}

/* ── Book Detail Modal ── */
function showBookDetail(id) {
  const book = Storage.getBook(id); if(!book) return;
  document.getElementById('detail-modal-title').textContent = book.title;
  setHTML('d-stars',  starsHTML(book.rating));
  setHTML('d-status', statusBadge(book.status));
  setText('d-author',  book.author||'—');
  setText('d-genre',   book.genre||'—');
  setText('d-series',  book.series?`${book.series}${book.bookNumber?' #'+book.bookNumber:''}`:'—');
  setText('d-pages',   book.pages?`${book.pages} pages`:'—');
  setText('d-format',  book.format||'—');
  setText('d-start',   fmtDate(book.startDate));
  setText('d-finish',  fmtDate(book.finishDate));
  setText('d-cost',    book.cost?`$${book.cost}`:'—');
  setText('d-summary', book.summary||'No summary added.');
  const qEl = document.getElementById('d-quote');
  if (book.quote) { qEl.textContent=`"${book.quote}"`; qEl.style.display=''; }
  else qEl.style.display='none';
  const cWrap = document.getElementById('d-cover');
  cWrap.innerHTML = book.coverUrl ? `<img src="${book.coverUrl}" alt="${book.title}" onerror="this.outerHTML='📚'">` : '📚';
  document.getElementById('d-edit-btn').onclick   = ()=>{ DetailModal.close(); editBook(id); };
  document.getElementById('d-delete-btn').onclick = ()=>{ if(!confirm(`Delete "${book.title}"?`))return; Storage.deleteBook(id); DetailModal.close(); Toast.show('🗑️ Removed.'); rerenderActive(); };
  document.getElementById('d-fav-btn').onclick    = ()=>{
    const on = Storage.toggleFav(id);
    document.getElementById('d-fav-btn').innerHTML = on
      ? `<i data-lucide="heart" class="lucide lucide-sm" style="fill:var(--rose-lt);color:var(--rose-lt)"></i> Unfavourite`
      : `<i data-lucide="heart" class="lucide lucide-sm"></i> Favourite`;
    refreshIcons();
    Toast.show(on?'❤️ Added to favourites!':'🤍 Removed.');
  };
  document.getElementById('d-fav-btn').innerHTML = book.favourite
    ? `<i data-lucide="heart" class="lucide lucide-sm" style="fill:var(--rose-lt);color:var(--rose-lt)"></i> Unfavourite`
    : `<i data-lucide="heart" class="lucide lucide-sm"></i> Favourite`;
  DetailModal.open();
  refreshIcons();
}

/* ── Mini cover search (wishlist / upcoming) ── */
function miniCoverSearch(inpId, resId, statId, urlId) {
  const q = document.getElementById(inpId)?.value?.trim(); if (!q) return;
  const results=document.getElementById(resId), status=document.getElementById(statId);
  results.classList.remove('hidden'); results.innerHTML=''; status.textContent='Searching…';
  fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=10&fields=cover_i,title`)
    .then(r=>r.json()).then(data=>{
      const books=(data.docs||[]).filter(b=>b.cover_i);
      if(!books.length){status.textContent='No covers found.';return;}
      status.textContent=`${books.length} found — click to select`;
      results.innerHTML=books.slice(0,8).map(b=>{
        const url=`https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`;
        return `<div class="cover-option" onclick="pickCover('${url}','${urlId}',this)"><img src="${url}" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>`;
      }).join('');
    }).catch(()=>{status.textContent='Search failed.';});
}
function pickCover(url, urlId, el) {
  document.getElementById(urlId).value=url;
  el.closest('.cover-results').querySelectorAll('.cover-option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}

/* ── Book card HTML ── */
function bookCardHTML(b, i) {
  return `
    <div class="book-card fade-up" style="animation-delay:${i*.04}s" onclick="showBookDetail('${b.id}')">
      <div class="book-cover-wrap">
        ${b.coverUrl ? `<img src="${b.coverUrl}" alt="${b.title}" onerror="this.outerHTML='<div class=book-cover-ph><div class=ico>📚</div></div>'">` : '<div class="book-cover-ph"><div class="ico">📚</div></div>'}
        <button class="book-fav-btn ${b.favourite?'on':''}" onclick="event.stopPropagation();toggleFav('${b.id}',this)">${b.favourite?'❤️':'🤍'}</button>
      </div>
      <div class="book-card-body">
        <div class="book-card-title">${b.title}</div>
        <div class="book-card-author">${b.author||'Unknown'}</div>
        <div class="book-card-foot">${starsHTML(b.rating,true)}${statusBadge(b.status)}</div>
      </div>
    </div>`;
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  Toast.init(); Modal.init(); DetailModal.init();
  BookForm.init(); initStars(); CoverSearch.init();
  Profile.init();

  Nav.register('dashboard',  ()=>Dashboard.render());
  Nav.register('tracker',    ()=>Tracker.render());
  Nav.register('library',    ()=>Library.render());
  Nav.register('analytics',  ()=>Analytics.render());
  Nav.register('favourites', ()=>Favourites.render());
  Nav.register('tbr',        ()=>TBRPage.render());
  Nav.register('wishlist',   ()=>Wishlist.render());
  Nav.register('upcoming',   ()=>Upcoming.render());
  Nav.register('diary',      ()=>Diary.render());
  Nav.register('profile',    ()=>Profile.render());
  Nav.register('import',     ()=>{});
  Nav.register('settings',   ()=>SettingsPage.render());

  Tracker.init(); Library.init();
  Nav.init();
  refreshIcons();
});

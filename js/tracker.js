/* ══ TRACKER ══ */
const Tracker=(()=>{
  let fs='all',q='';
  const render=()=>{
    const {books,displayFinished,reading,totalPages}=Storage.getStats();
    setText('tr-total',books.length);setText('tr-finished',displayFinished.length);setText('tr-reading',reading.length);setText('tr-pages',totalPages.toLocaleString());
    let list=books;
    if(fs!=='all')list=list.filter(b=>b.status===fs);
    if(q){const lq=q.toLowerCase();list=list.filter(b=>(b.title||'').toLowerCase().includes(lq)||(b.author||'').toLowerCase().includes(lq)||(b.genre||'').toLowerCase().includes(lq));}
    const tbody=document.getElementById('tracker-tbody');
    if(!list.length){tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text-dim)">${q||fs!=='all'?'🔍 No books match your filter.':'📚 No books yet — click <strong style="color:var(--gold)">+ Add Book</strong> to get started!'}</td></tr>`;return;}
    tbody.innerHTML=list.map(b=>`
      <tr onclick="showBookDetail('${b.id}')">
        <td>${b.coverUrl?`<img src="${b.coverUrl}" class="table-cover" onerror="this.outerHTML='<div class=table-cover-ph>📚</div>'">`:'<div class="table-cover-ph">📚</div>'}</td>
        <td><div class="table-title">${b.title}</div><div class="table-author">${b.author||'—'}</div></td>
        <td style="color:var(--text-muted)">${b.genre||'—'}</td>
        <td>${statusBadge(b.status)}</td>
        <td style="color:var(--text-muted);white-space:nowrap">${fmtDate(b.startDate)}</td>
        <td style="color:var(--text-muted);white-space:nowrap">${fmtDate(b.finishDate)}</td>
        <td style="color:var(--text-muted)">${b.format||'—'}</td>
        <td>${starsHTML(b.rating,true)}</td>
        <td onclick="event.stopPropagation()"><div class="row-actions"><button class="row-btn" onclick="editBook('${b.id}')">✏️</button><button class="row-btn del" onclick="deleteBook('${b.id}','${(b.title||'').replace(/'/g,String.fromCharCode(39))}')">🗑️</button></div></td>
      </tr>`).join('');
  };
  const init=()=>{
    document.getElementById('tracker-search').addEventListener('input',e=>{q=e.target.value;render();});
    document.querySelectorAll('#page-tracker .chip').forEach(c=>{c.addEventListener('click',()=>{document.querySelectorAll('#page-tracker .chip').forEach(x=>x.classList.remove('active'));c.classList.add('active');fs=c.dataset.status;render();});});
  };
  return{render,init};
})();

/* ══ LIBRARY ══ */
const Library=(()=>{
  let q='',genre='';
  const render=()=>{
    const books=Storage.getBooks();
    let filtered=books;
    if(q){const lq=q.toLowerCase();filtered=filtered.filter(b=>(b.title||'').toLowerCase().includes(lq)||(b.author||'').toLowerCase().includes(lq));}
    if(genre)filtered=filtered.filter(b=>(b.genre||'').toLowerCase()===genre.toLowerCase());
    const genres=[...new Set(books.map(b=>b.genre).filter(Boolean))];
    document.getElementById('lib-genre-filters').innerHTML=`<button class="chip ${genre===''?'active':''}" onclick="Library._g('')">All</button>`+genres.map(g=>`<button class="chip ${genre===g?'active':''}" onclick="Library._g('${g}')">${g}</button>`).join('');
    const grid=document.getElementById('library-grid');
    if(!filtered.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📚</div><div class="empty-title">Your library awaits</div><div class="empty-sub">Add your first book to begin your journey.</div></div>`;return;}
    grid.innerHTML=filtered.map((b,i)=>bookCardHTML(b,i)).join('');
  };
  const _g=(val)=>{genre=val;render();};
  const init=()=>{document.getElementById('lib-search').addEventListener('input',e=>{q=e.target.value;render();});};
  return{render,init,_g};
})();

/* ══ FAVOURITES ══ */
const Favourites=(()=>{
  const render=()=>{
    const books=Storage.getBooks().filter(b=>b.favourite);
    setText('fav-count',`${books.length} book${books.length!==1?'s':''}`);
    const grid=document.getElementById('fav-grid');
    if(!books.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">❤️</div><div class="empty-title">No favourites yet</div><div class="empty-sub">Tap the heart on any book to save it here.</div></div>`;return;}
    grid.innerHTML=books.map((b,i)=>bookCardHTML(b,i)).join('');
  };
  return{render};
})();

/* ══ TBR ══ */
const TBRPage=(()=>{
  const render=()=>{
    const books=Storage.getBooks().filter(b=>b.status==='tbr');
    setText('tbr-count',`${books.length} book${books.length!==1?'s':''}`);
    const grid=document.getElementById('tbr-grid');
    if(!books.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📋</div><div class="empty-title">TBR pile is empty!</div><div class="empty-sub">Add books with status "To Be Read" and they'll appear here.</div></div>`;return;}
    grid.innerHTML=books.map((b,i)=>`
      <div class="book-card fade-up" style="animation-delay:${i*.04}s" onclick="showBookDetail('${b.id}')">
        <div class="book-cover-wrap">${b.coverUrl?`<img src="${b.coverUrl}" alt="${b.title}" onerror="this.outerHTML='<div class=book-cover-ph><div class=ico>📚</div></div>'">`:'<div class="book-cover-ph"><div class="ico">📚</div></div>'}
        <button class="book-fav-btn ${b.favourite?'on':''}" onclick="event.stopPropagation();toggleFav('${b.id}',this)">${b.favourite?'❤️':'🤍'}</button></div>
        <div class="book-card-body"><div class="book-card-title">${b.title}</div><div class="book-card-author">${b.author||'Unknown'}</div>
        <div class="list-card-actions"><button class="btn btn-sm btn-success" onclick="event.stopPropagation();startReading('${b.id}')">▶ Start</button><button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();editBook('${b.id}')">✏️</button></div></div>
      </div>`).join('');
  };
  return{render};
})();

/* ══ WISHLIST ══ */
const Wishlist=(()=>{
  const render=()=>{
    const items=Storage.getWishlist();
    setText('wish-count',`${items.length} item${items.length!==1?'s':''}`);
    const grid=document.getElementById('wish-grid');
    if(!items.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🛒</div><div class="empty-title">Wishlist is empty</div><div class="empty-sub">Track books you want to buy!</div></div>`;return;}
    grid.innerHTML=items.map((w,i)=>`
      <div class="book-card fade-up" style="animation-delay:${i*.04}s">
        <div class="book-cover-wrap">${w.coverUrl?`<img src="${w.coverUrl}" alt="${w.title}" onerror="this.outerHTML='<div class=book-cover-ph><div class=ico>🛒</div></div>'">`:'<div class="book-cover-ph"><div class="ico">🛒</div></div>'}</div>
        <div class="book-card-body"><div class="book-card-title">${w.title}</div><div class="book-card-author">${w.author||'Unknown'}</div>
        ${w.price?`<div style="font-size:0.7rem;color:var(--gold);margin-top:0.2rem">$${w.price}</div>`:''}
        <div class="list-card-actions"><button class="btn btn-sm btn-success" onclick="moveToLibrary('${w.id}')">+ Add</button><button class="btn btn-sm btn-danger" onclick="delWish('${w.id}','${(w.title||'').replace(/'/g,'\\&apos;')}')">🗑️</button></div></div>
      </div>`).join('');
  };
  return{render};
})();

/* ══ UPCOMING ══ */
const Upcoming=(()=>{
  const render=()=>{
    const items=Storage.getUpcoming().sort((a,b)=>a.releaseDate&&b.releaseDate?new Date(a.releaseDate)-new Date(b.releaseDate):0);
    setText('up-count',`${items.length} release${items.length!==1?'s':''}`);
    const grid=document.getElementById('up-grid');
    if(!items.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No upcoming releases</div><div class="empty-sub">Track books you're anticipating!</div></div>`;return;}
    grid.innerHTML=items.map((u,i)=>`
      <div class="book-card fade-up" style="animation-delay:${i*.04}s">
        <div class="book-cover-wrap">${u.coverUrl?`<img src="${u.coverUrl}" alt="${u.title}" onerror="this.outerHTML='<div class=book-cover-ph><div class=ico>📅</div></div>'">`:'<div class="book-cover-ph"><div class="ico">📅</div></div>'}</div>
        <div class="book-card-body"><div class="book-card-title">${u.title}</div><div class="book-card-author">${u.author||'Unknown'}</div>
        ${u.releaseDate?`<div class="release-date">📅 ${fmtDate(u.releaseDate)}</div>`:''}
        <div class="list-card-actions"><button class="btn btn-sm btn-success" onclick="upToLibrary('${u.id}')">+ Add</button><button class="btn btn-sm btn-danger" onclick="delUp('${u.id}','${(u.title||'').replace(/'/g,'\\&apos;')}')">🗑️</button></div></div>
      </div>`).join('');
  };
  return{render};
})();

/* ══ SHARED ACTIONS ══ */
function startReading(id){const b=Storage.getBook(id);if(!b)return;b.status='reading';b.startDate=b.startDate||Storage.todayStr();Storage.saveBook(b);Toast.show('📖 Happy reading!');TBRPage.render();Dashboard.render();}
function moveToLibrary(id){const b=Storage.wishToLibrary(id);if(b){Toast.show('📚 Added to library as TBR!');Wishlist.render();}}
function upToLibrary(id){const b=Storage.upcomingToLibrary(id);if(b){Toast.show('📚 Added to library as TBR!');Upcoming.render();}}
function delWish(id,t){if(!confirm(`Remove "${t}"?`))return;Storage.deleteWish(id);Toast.show('🗑️ Removed.');Wishlist.render();}
function delUp(id,t){if(!confirm(`Remove "${t}"?`))return;Storage.deleteUpcoming(id);Toast.show('🗑️ Removed.');Upcoming.render();}

/* ══ WISHLIST MODAL ══ */
const WishModal=(()=>{
  let overlay;
  const init=()=>{overlay=document.getElementById('wish-modal-overlay');overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.getElementById('wish-modal-close').addEventListener('click',close);document.getElementById('wish-save-btn').addEventListener('click',submit);document.getElementById('wish-add-btn').addEventListener('click',()=>{document.getElementById('wish-form').reset();['wish-cover-results','wish-cover-status'].forEach(id=>{const el=document.getElementById(id);if(el){el.classList.add('hidden');el.textContent='';}});open();});};
  const open=()=>overlay.classList.add('open');
  const close=()=>overlay.classList.remove('open');
  const submit=()=>{const g=id=>document.getElementById(id)?.value?.trim();const title=g('wish-title');if(!title){Toast.show('📚 Please enter a title.');return;}Storage.saveWish({title,author:g('wish-author'),genre:g('wish-genre'),price:g('wish-price'),notes:g('wish-notes'),coverUrl:g('wish-cover-url')});close();Toast.show('🛒 Added to wishlist!');Wishlist.render();};
  return{init,open,close};
})();

const UpcomingModal=(()=>{
  let overlay;
  const init=()=>{overlay=document.getElementById('up-modal-overlay');overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.getElementById('up-modal-close').addEventListener('click',close);document.getElementById('up-save-btn').addEventListener('click',submit);document.getElementById('up-add-btn').addEventListener('click',()=>{document.getElementById('up-form').reset();['up-cover-results','up-cover-status'].forEach(id=>{const el=document.getElementById(id);if(el){el.classList.add('hidden');el.textContent='';}});open();});};
  const open=()=>overlay.classList.add('open');
  const close=()=>overlay.classList.remove('open');
  const submit=()=>{const g=id=>document.getElementById(id)?.value?.trim();const title=g('up-title');if(!title){Toast.show('📚 Please enter a title.');return;}Storage.saveUpcoming({title,author:g('up-author'),genre:g('up-genre'),releaseDate:g('up-release-date'),notes:g('up-notes'),coverUrl:g('up-cover-url')});close();Toast.show('📅 Added to upcoming!');Upcoming.render();};
  return{init,open,close};
})();

document.addEventListener('DOMContentLoaded',()=>{WishModal.init();UpcomingModal.init();});

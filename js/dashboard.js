/* ══ LITERATI — Dashboard v4 ══ */
const MONTHS_S=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Dashboard = (() => {
  const render=()=>{
    const stats=Storage.getStats(), streak=Storage.getStreakStats();
    renderYearSelector(stats); renderStats(stats); renderDonut(stats);
    renderGoal(stats); renderRatings(stats); renderMonthly(stats);
    renderShelf(stats); renderRecent(stats); renderStreakMini(streak);
    BookFinder.init(stats.books);
  };

  const renderYearSelector=({years,settings})=>{
    const sel=document.getElementById('dash-year-select'); if(!sel)return;
    const cur=settings.selectedYear||'all';
    sel.innerHTML=`<option value="all" ${cur==='all'?'selected':''}>All Years</option>`+years.map(y=>`<option value="${y}" ${String(cur)===String(y)?'selected':''}>${y}</option>`).join('');
    sel.onchange=()=>{ Storage.saveSettings({selectedYear:sel.value}); render(); };
    setText('dash-total-pages-val', Storage.getStats().totalPages.toLocaleString());
  };

  const renderStats=({displayFinished,reading,totalPages,avgRating})=>{
    setText('dash-total',  displayFinished.length);
    setText('dash-reading',reading.length);
    setText('dash-pages',  totalPages.toLocaleString());
    setText('dash-rating', avgRating+(avgRating!=='—'?'★':''));
    setText('dash-wishlist',Storage.getWishlist().length);
  };

  const renderStreakMini=({streak,current,todayLogged,today})=>{
    setText('dash-streak-num',current);
    setText('dash-streak-status',todayLogged?'✓ Logged today':'Tap to log today');
    const grid=document.getElementById('streak-mini-grid');if(!grid)return;
    grid.innerHTML='';
    for(let i=27;i>=0;i--){
      const ds=Storage.offsetDate(today,-i);
      const dot=document.createElement('div');
      dot.className='streak-mini-dot'+(ds===today?' today':streak[ds]>0?' on':'');
      grid.appendChild(dot);
    }
  };

  const renderDonut=({displayFinished,reading,dnf,paused,books})=>{
    const total=books.length||1;
    const pF=Math.round(displayFinished.length/total*100),pR=Math.round(reading.length/total*100),pD=Math.round(dnf.length/total*100);
    const donut=document.getElementById('dash-donut');
    if(donut) donut.style.background=`conic-gradient(var(--green) 0% ${pF}%,var(--gold) ${pF}% ${pF+pR}%,var(--rose) ${pF+pR}% ${pF+pR+pD}%,var(--sky) ${pF+pR+pD}% 100%)`;
    setText('donut-total',books.length);setText('lg-finished',pF+'%');setText('lg-reading',pR+'%');setText('lg-dnf',pD+'%');setText('lg-paused',(100-pF-pR-pD)+'%');
  };

  const renderGoal=({thisYear,settings})=>{
    const goal=settings.yearlyGoal||24,done=thisYear.length;
    const pct=Math.min(Math.round(done/goal*100),100),circ=2*Math.PI*42;
    setText('goal-pct-text',pct+'%');setText('goal-sub',`${done} of ${goal} · ${Math.max(goal-done,0)} to go`);
    setTimeout(()=>{const p=document.getElementById('goal-prog');if(p)p.style.strokeDashoffset=circ-(circ*pct/100);},180);
  };

  const renderRatings=({ratings})=>{
    const max=Math.max(...ratings.map(r=>r.count),1);
    ratings.forEach(r=>{
      const f=document.getElementById(`bar-${r.stars}`),c=document.getElementById(`cnt-${r.stars}`);
      if(f) setTimeout(()=>{f.style.width=(r.count/max*100)+'%';},180);
      if(c) c.textContent=r.count;
    });
  };

  const renderMonthly=({monthly})=>{
    const chart=document.getElementById('month-chart'),max=Math.max(...monthly,1);
    chart.innerHTML='';
    monthly.forEach((v,i)=>{
      const col=document.createElement('div');col.className='month-col';
      const bar=document.createElement('div');bar.className='month-bar'+(v===max&&v>0?' peak':'')+(v===0?' empty':'');
      bar.title=`${MONTHS_S[i]}: ${v} book${v!==1?'s':''}`;
      const lbl=document.createElement('div');lbl.className='month-lbl';lbl.textContent=MONTHS_S[i][0];
      col.appendChild(bar);col.appendChild(lbl);chart.appendChild(col);
      setTimeout(()=>{bar.style.height=v===0?'4px':`${(v/max)*100}%`;},260+i*38);
    });
  };

  const renderShelf=({books})=>{
    const shelf=document.getElementById('bookshelf');shelf.innerHTML='';
    if(!books.length){shelf.innerHTML='<div style="display:flex;align-items:center;padding:1rem 0.5rem;color:var(--text-dim);font-size:0.8rem;font-style:italic">Your shelf is empty — add books to fill it!</div>';return;}
    books.slice(0,40).forEach((b,i)=>{
      const spine=document.createElement('div');
      const h=62+Math.floor(Math.sin(i*1.5)*22+22);
      const w=22+Math.floor(Math.random()*10);
      spine.className='book-spine';
      spine.style.cssText=`background:${SPINE_COLORS[i%SPINE_COLORS.length]};height:${h}px;width:${w}px;`;
      spine.textContent=b.title;spine.title=`${b.title}${b.author?' — '+b.author:''}`;
      spine.addEventListener('click',()=>showBookDetail(b.id));
      shelf.appendChild(spine);
    });
  };

  const renderRecent=({books})=>{
    const el=document.getElementById('recent-list');
    if(!books.length){el.innerHTML='<div class="empty-state" style="padding:1.5rem"><div class="empty-icon">📖</div><div class="empty-sub">No books yet — add one!</div></div>';return;}
    el.innerHTML=books.slice(0,5).map(b=>`
      <div class="activity-item" onclick="showBookDetail('${b.id}')">
        <div class="activity-cover">${b.coverUrl?`<img src="${b.coverUrl}" alt="">`:'📚'}</div>
        <div class="activity-info">
          <div class="activity-title">${b.title}</div>
          <div class="activity-meta">${b.author||'Unknown'} · ${statusBadge(b.status)}</div>
        </div>
      </div>`).join('');
  };

  return { render };
})();

/* ══ BOOK FINDER ══ */
const BookFinder = (() => {
  let books=[], selected=null;

  const init=(allBooks)=>{
    books=allBooks;
    const inp=document.getElementById('finder-input');
    const dropdown=document.getElementById('finder-dropdown');
    if(!inp) return;

    inp.addEventListener('input',()=>{
      const q=inp.value.toLowerCase().trim();
      if(!q){dropdown.classList.remove('open');return;}
      const matches=books.filter(b=>(b.title||'').toLowerCase().includes(q)||(b.author||'').toLowerCase().includes(q)).slice(0,8);
      if(!matches.length){dropdown.innerHTML='<div style="padding:0.75rem 1rem;font-size:0.78rem;color:var(--text-dim)">No books found</div>';dropdown.classList.add('open');return;}
      dropdown.innerHTML=matches.map(b=>`
        <div class="finder-item" onclick="BookFinder.select('${b.id}')">
          <div class="finder-item-cover">${b.coverUrl?`<img src="${b.coverUrl}" alt="">`:'📚'}</div>
          <div><div class="finder-item-title">${b.title}</div><div class="finder-item-author">${b.author||'Unknown'}</div></div>
        </div>`).join('');
      dropdown.classList.add('open');
    });

    document.addEventListener('click',e=>{if(!e.target.closest('.finder-search-wrap'))dropdown.classList.remove('open');});
    inp.addEventListener('focus',()=>{ if(inp.value) inp.dispatchEvent(new Event('input')); });
  };

  const select=(id)=>{
    selected=Storage.getBook(id);
    const dropdown=document.getElementById('finder-dropdown');
    const inp=document.getElementById('finder-input');
    if(!selected){return;}
    dropdown.classList.remove('open');
    if(inp) inp.value=selected.title;
    renderDetail(selected);
  };

  const renderDetail=(book)=>{
    const el=document.getElementById('finder-detail');if(!el)return;
    el.innerHTML=`
      <div class="finder-detail-content">
        <div class="finder-detail-cover">${book.coverUrl?`<img src="${book.coverUrl}" alt="${book.title}" onerror="this.outerHTML='📚'">`:'📚'}</div>
        <div class="finder-detail-info">
          <div class="finder-detail-title">${book.title}</div>
          <div>${starsHTML(book.rating,'lg')} ${statusBadge(book.status)}</div>
          <div class="finder-detail-meta">
            <div class="finder-meta-row"><span class="finder-meta-key">Author</span><span class="finder-meta-val">${book.author||'—'}</span></div>
            <div class="finder-meta-row"><span class="finder-meta-key">Genre</span><span class="finder-meta-val">${book.genre||'—'}</span></div>
            <div class="finder-meta-row"><span class="finder-meta-key">Start Date</span><span class="finder-meta-val">${fmtDate(book.startDate)}</span></div>
            <div class="finder-meta-row"><span class="finder-meta-key">Finished</span><span class="finder-meta-val">${fmtDate(book.finishDate)}</span></div>
            <div class="finder-meta-row"><span class="finder-meta-key">Pages</span><span class="finder-meta-val">${book.pages||'—'}</span></div>
            ${book.series?`<div class="finder-meta-row"><span class="finder-meta-key">Series</span><span class="finder-meta-val">${book.series}${book.bookNumber?' #'+book.bookNumber:''}</span></div>`:''}
            ${book.cost?`<div class="finder-meta-row"><span class="finder-meta-key">Cost</span><span class="finder-meta-val">$${book.cost}</span></div>`:''}
          </div>
          ${book.summary?`<div class="finder-summary">${book.summary}</div>`:''}
          ${book.quote?`<div class="finder-quote">"${book.quote}"</div>`:''}
          <div class="finder-actions">
            <button class="btn btn-primary btn-sm" onclick="showBookDetail('${book.id}')">View Full Detail</button>
            <button class="btn btn-ghost btn-sm" onclick="editBook('${book.id}')">✏️ Edit</button>
          </div>
        </div>
      </div>`;
  };

  return { init, select };
})();

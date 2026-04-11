/* ══ ANALYTICS v4 ══ */
const GENRE_COLORS=['#C9A35D','#4E7260','#4E6E8E','#9E4E4E','#6A4E8E','#C97B35','#4E7A6A','#7A4E6E','#6E7A4E','#4E5A7A'];

const Analytics=(()=>{
  const render=()=>{
    const stats=Storage.getStats(),streak=Storage.getStreakStats();
    renderSummary(stats,streak);renderGenre(stats);renderPagesMonth(stats);
    renderTopAuthors(stats);renderTopGenres(stats);renderStreakCal(streak);
    const el=document.getElementById('an-streak-current2');if(el)el.textContent=streak.current;
  };
  const renderSummary=({displayFinished,totalPages,avgPagesPerDay,settings},{current})=>{
    const goal=settings.yearlyGoal||24,done=Storage.getStats().thisYear.length;
    setText('an-books',displayFinished.length);setText('an-pages',totalPages.toLocaleString());
    setText('an-avg-pages',avgPagesPerDay||'—');setText('an-streak',current+' 🔥');
    setText('an-goal-pct',Math.min(100,Math.round(done/goal*100))+'%');
  };
  const renderGenre=({genres,books})=>{
    if(!genres.length){setHTML('genre-donut-wrap','<div style="color:var(--text-dim);font-size:0.8rem">No genre data yet</div>');return;}
    const total=books.length||1;let cum=0;
    const segs=genres.slice(0,8).map((g,i)=>{const pct=g.count/total*100,start=cum;cum+=pct;return{...g,pct:Math.round(pct),start,color:GENRE_COLORS[i%GENRE_COLORS.length]};});
    const donut=document.getElementById('genre-donut');
    if(donut)donut.style.background=`conic-gradient(${segs.map(s=>`${s.color} ${s.start.toFixed(1)}% ${(s.start+s.pct).toFixed(1)}%`).join(',')},var(--surface) ${cum.toFixed(1)}% 100%)`;
    setText('genre-donut-total',books.length);
    setHTML('genre-legend',segs.map(s=>`<div class="genre-legend-item"><div class="genre-legend-dot" style="background:${s.color}"></div><span>${s.name}</span><span style="font-size:0.7rem;color:var(--text-dim)">${s.count}</span><span class="genre-legend-pct">${s.pct}%</span></div>`).join(''));
  };
  const renderPagesMonth=({monthlyPages})=>{
    const chart=document.getElementById('pages-month-chart');if(!chart)return;
    const max=Math.max(...monthlyPages,1);chart.innerHTML='';
    ['J','F','M','A','M','J','J','A','S','O','N','D'].forEach((m,i)=>{
      const col=document.createElement('div');col.className='pages-col';
      const bar=document.createElement('div');bar.className='pages-bar';
      bar.setAttribute('data-tip',`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}: ${monthlyPages[i].toLocaleString()} pages`);
      const lbl=document.createElement('div');lbl.className='pages-lbl';lbl.textContent=m;
      col.appendChild(bar);col.appendChild(lbl);chart.appendChild(col);
      setTimeout(()=>{bar.style.height=monthlyPages[i]===0?'4px':`${(monthlyPages[i]/max)*100}%`;},180+i*38);
    });
  };
  const renderTopAuthors=({topAuthors})=>{
    const el=document.getElementById('top-authors-list');if(!el)return;
    if(!topAuthors.length){el.innerHTML='<div style="color:var(--text-dim);font-size:0.78rem">Read more books to see top authors</div>';return;}
    const max=topAuthors[0].count;
    el.innerHTML=topAuthors.map((a,i)=>`<div class="top-list-item"><div class="top-list-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${i+1}</div><div class="top-list-bar-wrap"><div class="top-list-name">${a.name}</div><div class="top-list-bar-track"><div class="top-list-bar-fill" style="width:${(a.count/max*100)}%"></div></div></div><div class="top-list-count">${a.count} book${a.count!==1?'s':''}</div></div>`).join('');
  };
  const renderTopGenres=({genres})=>{
    const el=document.getElementById('top-genres-list');if(!el)return;
    if(!genres.length){el.innerHTML='<div style="color:var(--text-dim);font-size:0.78rem">Add genres to your books to see breakdown</div>';return;}
    const max=genres[0].count;
    el.innerHTML=genres.slice(0,5).map((g,i)=>`<div class="top-list-item"><div class="top-list-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${i+1}</div><div class="top-list-bar-wrap"><div class="top-list-name">${g.name}</div><div class="top-list-bar-track"><div class="top-list-bar-fill" style="background:linear-gradient(90deg,${GENRE_COLORS[i]},${GENRE_COLORS[(i+2)%GENRE_COLORS.length]});width:${(g.count/max*100)}%"></div></div></div><div class="top-list-count">${g.count} · ${g.pct}%</div></div>`).join('');
  };
  const renderStreakCal=({streak,current,longest,daysLogged,avgPagesDay,today})=>{
    setText('an-streak-current',current);setText('an-streak-longest',longest);setText('an-streak-days',daysLogged);setText('an-streak-avgpg',avgPagesDay||'—');
    const calEl=document.getElementById('streak-calendar');if(!calEl)return;
    const now=new Date(today+'T00:00:00');
    const start=new Date(now);start.setMonth(start.getMonth()-5);start.setDate(1);
    calEl.innerHTML='';
    for(let m=0;m<6;m++){
      const md=new Date(start);md.setMonth(start.getMonth()+m);
      const yr=md.getFullYear(),mo=md.getMonth(),days=new Date(yr,mo+1,0).getDate();
      const row=document.createElement('div');row.className='streak-month-row';
      const lbl=document.createElement('div');lbl.className='streak-month-lbl';lbl.textContent=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mo];
      const ds=document.createElement('div');ds.className='streak-days';
      for(let d=1;d<=days;d++){
        const dateStr=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dot=document.createElement('div');dot.className='streak-day';
        const pages=streak[dateStr]||0,isToday=dateStr===today,isFuture=dateStr>today;
        if(isFuture)dot.classList.add('future');
        else if(pages>=100)dot.classList.add('read-max');
        else if(pages>=50)dot.classList.add('read-high');
        else if(pages>=20)dot.classList.add('read-mid');
        else if(pages>0)dot.classList.add('read-low');
        if(isToday)dot.classList.add('today');
        dot.setAttribute('data-tip',isFuture?'':pages>0?`${dateStr}: ${pages} pages`:dateStr);
        if(!isFuture)dot.addEventListener('click',()=>openLogModal(dateStr));
        ds.appendChild(dot);
      }
      row.appendChild(lbl);row.appendChild(ds);calEl.appendChild(row);
    }
  };
  return{render};
})();

/* ══ GOAL MODAL ══ */
const GoalModal=(()=>{
  let overlay,input;
  const init=()=>{
    overlay=document.getElementById('goal-modal-overlay');input=document.getElementById('goal-input');
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    document.getElementById('goal-modal-close').addEventListener('click',close);
    document.getElementById('goal-save-btn').addEventListener('click',saveGoal);
    document.getElementById('goal-dec').addEventListener('click',()=>adjust(-1));
    document.getElementById('goal-inc').addEventListener('click',()=>adjust(+1));
    input.addEventListener('input',updateRing);
    const ring=document.getElementById('goal-ring-clickable');if(ring)ring.addEventListener('click',open);
  };
  const open=()=>{const s=Storage.getSettings();input.value=s.yearlyGoal||24;updateRing();setText('goal-done-count',`${Storage.getStats().thisYear.length} books finished this year`);overlay.classList.add('open');};
  const close=()=>overlay.classList.remove('open');
  const adjust=(d)=>{input.value=Math.max(1,Math.min(500,(parseInt(input.value)||24)+d));updateRing();};
  const updateRing=()=>{
    const goal=Math.max(1,parseInt(input.value)||24),done=Storage.getStats().thisYear.length;
    const pct=Math.min(100,Math.round(done/goal*100)),circ=2*Math.PI*54;
    const el=document.getElementById('goal-modal-prog');if(el)el.style.strokeDashoffset=circ-(circ*pct/100);
    setText('goal-modal-pct',pct+'%');setText('goal-modal-sub',`${done} of ${goal} · ${Math.max(0,goal-done)} to go`);
  };
  const saveGoal=()=>{const goal=Math.max(1,parseInt(input.value)||24);Storage.saveSettings({yearlyGoal:goal});close();Toast.show('🎯 Goal set to '+goal+' books!');Dashboard.render();if(Nav.current()==='analytics')Analytics.render();};
  return{init,open,close};
})();

/* ══ LOG PAGES MODAL ══ */
const LogModal=(()=>{
  let overlay,curDate;
  const init=()=>{
    overlay=document.getElementById('log-modal-overlay');
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    document.getElementById('log-modal-close').addEventListener('click',close);
    document.getElementById('log-save-btn').addEventListener('click',saveLog);
    document.getElementById('log-pages-slider').addEventListener('input',e=>setText('log-pages-display',e.target.value));
    document.getElementById('log-pages-input').addEventListener('input',e=>{setText('log-pages-display',e.target.value||0);document.getElementById('log-pages-slider').value=Math.min(500,e.target.value||0);});
    const btn=document.getElementById('streak-log-today-btn');if(btn)btn.addEventListener('click',()=>openLogModal(Storage.todayStr()));
  };
  const open=(dateStr)=>{
    curDate=dateStr||Storage.todayStr();
    const existing=Storage.getStreak()[curDate]||0;
    const el=document.getElementById('log-date-str');if(el)el.textContent=new Date(curDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
    setText('log-pages-display',existing||0);
    document.getElementById('log-pages-slider').value=Math.min(500,existing);
    document.getElementById('log-pages-input').value=existing||'';
    const sel=document.getElementById('log-book-select');
    const reading=Storage.getBooks().filter(b=>b.status==='reading');
    sel.innerHTML='<option value="">— Currently reading (optional) —</option>'+reading.map(b=>`<option value="${b.id}">${b.title}</option>`).join('');
    overlay.classList.add('open');
  };
  const close=()=>overlay.classList.remove('open');
  const saveLog=()=>{
    const pages=parseInt(document.getElementById('log-pages-input').value)||parseInt(document.getElementById('log-pages-slider').value)||1;
    Storage.logReadingDay(curDate,pages);close();Toast.show(`📖 Logged ${pages} pages!`);Dashboard.render();if(Nav.current()==='analytics')Analytics.render();
  };
  return{init,open,close};
})();
function openLogModal(ds){LogModal.open(ds);}

/* ══ GOODREADS IMPORT ══ */
const GoodreadsImport=(()=>{
  const STATUS_MAP={'read':'finished','currently-reading':'reading','to-read':'tbr'};
  const init=()=>{
    const dz=document.getElementById('csv-drop-zone'),fi=document.getElementById('csv-file-input');if(!dz)return;
    dz.addEventListener('click',()=>fi.click());
    fi.addEventListener('change',e=>{if(e.target.files[0])processFile(e.target.files[0]);});
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
    dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
    dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');if(e.dataTransfer.files[0])processFile(e.dataTransfer.files[0]);});
  };
  const processFile=(file)=>{
    if(!file.name.endsWith('.csv')){showStatus('csv-status','error','⚠️ Please upload a .csv file.');return;}
    showStatus('csv-status','info','⏳ Reading file…');
    const reader=new FileReader();reader.onload=e=>parseCSV(e.target.result);reader.readAsText(file);
  };
  const parseCSV=(text)=>{
    const lines=text.split('\n').filter(l=>l.trim());if(lines.length<2){showStatus('csv-status','error','⚠️ CSV appears empty.');return;}
    const headers=parseRow(lines[0]).map(h=>h.trim().toLowerCase());
    const getCol=(row,...names)=>{for(const n of names){const i=headers.findIndex(h=>h.includes(n));if(i>-1)return row[i]?.trim()||'';}return '';};
    const books=[];
    for(let i=1;i<lines.length;i++){
      const row=parseRow(lines[i]);if(row.length<3)continue;
      const shelf=getCol(row,'exclusive shelf','bookshelves','shelf');
      const status=STATUS_MAP[shelf]||'tbr';
      const title=getCol(row,'title');if(!title)continue;
      books.push({title,author:getCol(row,'author'),pages:getCol(row,'number of pages','pages'),rating:getCol(row,'my rating','rating'),startDate:fmtGRDate(getCol(row,'date started','started')),finishDate:fmtGRDate(getCol(row,'date read','finished','read')),status,format:'physical'});
    }
    if(!books.length){showStatus('csv-status','error','⚠️ No books found. Make sure this is a Goodreads export CSV.');return;}
    const preview=document.getElementById('csv-preview');
    preview.innerHTML=books.slice(0,8).map(b=>`<div class="preview-row"><span class="preview-title">${b.title}</span><span>${statusBadge(b.status)}</span></div>`).join('')+(books.length>8?`<div class="preview-row"><span style="color:var(--text-dim)">…and ${books.length-8} more</span></div>`:'');
    preview.classList.add('show');
    const btn=document.getElementById('csv-import-btn');btn.style.display='flex';btn.onclick=()=>importBooks(books);
    showStatus('csv-status','info',`📚 Found ${books.length} books. Preview below — click Import to add them.`);
  };
  const importBooks=(books)=>{
    let added=0,skipped=0;
    const existing=Storage.getBooks().map(b=>b.title.toLowerCase());
    books.forEach(b=>{if(existing.includes(b.title.toLowerCase())){skipped++;return;}Storage.saveBook(b);added++;});
    showStatus('csv-status','success',`✅ Imported ${added} books!${skipped?` (${skipped} already existed)`:''}`);
    document.getElementById('csv-preview').classList.remove('show');
    document.getElementById('csv-import-btn').style.display='none';
    Toast.show(`📚 Imported ${added} books from Goodreads!`);rerenderActive();
  };
  const parseRow=(line)=>{const r=[];let cur='',inQ=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"')inQ=!inQ;else if(c===','&&!inQ){r.push(cur);cur='';}else cur+=c;}r.push(cur);return r;};
  const fmtGRDate=(s)=>{if(!s||s==='0000/00/00'||s==='not set')return '';try{const d=new Date(s.replace(/\//g,'-'));return isNaN(d)?'':d.toISOString().split('T')[0];}catch{return '';}};
  const showStatus=(id,type,msg)=>{const el=document.getElementById(id);if(!el)return;el.className=`import-status ${type}`;el.textContent=msg;};
  return{init};
})();

/* ══ ANILIST ══ */
const AniListSync=(()=>{
  const TOKEN_KEY='literati_anilist_token';
  const getToken=()=>localStorage.getItem(TOKEN_KEY);
  const init=()=>{
    const hash=window.location.hash,match=hash.match(/access_token=([^&]+)/);
    if(match){localStorage.setItem(TOKEN_KEY,match[1]);window.location.hash='';Toast.show('✅ AniList connected!');updateUI(true);}
    else updateUI(!!getToken());
    const btn=document.getElementById('anilist-connect-btn');if(btn)btn.addEventListener('click',()=>getToken()?syncNow():startOAuth());
    const dis=document.getElementById('anilist-disconnect-btn');if(dis)dis.addEventListener('click',disconnect);
    const cinp=document.getElementById('anilist-client-id');if(cinp){cinp.value=localStorage.getItem('literati_anilist_client')||'';cinp.addEventListener('change',e=>localStorage.setItem('literati_anilist_client',e.target.value.trim()));}
  };
  const startOAuth=()=>{
    const cid=localStorage.getItem('literati_anilist_client')||'';
    if(!cid){showStatus('anilist-status','error','⚠️ Enter your AniList Client ID first.');return;}
    window.location.href=`https://anilist.co/api/v2/oauth/authorize?client_id=${cid}&response_type=token`;
  };
  const syncNow=async()=>{
    const token=getToken();if(!token){startOAuth();return;}
    showStatus('anilist-status','info','⏳ Fetching your AniList manga list…');
    try{
      const res=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({query:`{MediaListCollection(type:MANGA,status:COMPLETED){lists{entries{media{title{romaji english}volumes chapters}score startedAt{year month day}completedAt{year month day}}}}}`})});
      const data=await res.json();
      if(data.errors)throw new Error(data.errors[0].message);
      const entries=data.data?.MediaListCollection?.lists?.flatMap(l=>l.entries)||[];
      let added=0;
      entries.forEach(e=>{
        const title=e.media?.title?.english||e.media?.title?.romaji;if(!title)return;
        if(Storage.getBooks().find(b=>b.title.toLowerCase()===title.toLowerCase()))return;
        Storage.saveBook({title,status:'finished',genre:'Manga',rating:e.score?(e.score/20).toFixed(1):0,pages:e.media?.chapters||'',startDate:fmtAD(e.startedAt),finishDate:fmtAD(e.completedAt)});added++;
      });
      showStatus('anilist-status','success',`✅ Synced! Added ${added} manga.`);Toast.show(`🎌 Synced ${added} manga from AniList!`);rerenderActive();
    }catch(err){localStorage.removeItem(TOKEN_KEY);updateUI(false);showStatus('anilist-status','error','⚠️ Sync failed: '+err.message);}
  };
  const disconnect=()=>{localStorage.removeItem(TOKEN_KEY);updateUI(false);showStatus('anilist-status','info','Disconnected from AniList.');};
  const updateUI=(c)=>{const btn=document.getElementById('anilist-connect-btn'),dis=document.getElementById('anilist-disconnect-btn');if(btn){btn.textContent=c?'🔄 Sync Now':'🔗 Connect AniList';btn.classList.toggle('connected',c);}if(dis)dis.style.display=c?'block':'none';};
  const fmtAD=(d)=>d?.year?`${d.year}-${String(d.month||1).padStart(2,'0')}-${String(d.day||1).padStart(2,'0')}`:'';
  const showStatus=(id,type,msg)=>{const el=document.getElementById(id);if(!el)return;el.className=`import-status ${type}`;el.textContent=msg;};
  return{init};
})();

/* ══ SETTINGS PAGE ══ */
const SettingsPage=(()=>{
  const render=()=>{
    const s=Storage.getSettings(),books=Storage.getBooks();
    setText('set-total-books',books.length);
    setText('set-goal',s.yearlyGoal||24);
    setText('set-year',s.selectedYear==='all'?'All Years':s.selectedYear||new Date().getFullYear());
    setText('set-storage',`${new Blob([JSON.stringify(localStorage)]).size/1024|0} KB used`);
  };
  return{render};
})();

document.addEventListener('DOMContentLoaded',()=>{
  GoalModal.init();LogModal.init();GoodreadsImport.init();AniListSync.init();
  document.getElementById('settings-set-goal-btn')?.addEventListener('click',()=>GoalModal.open());
  document.getElementById('settings-export-btn')?.addEventListener('click',exportData);
  document.getElementById('settings-import-btn')?.addEventListener('click',()=>document.getElementById('settings-import-file').click());
  document.getElementById('settings-import-file')?.addEventListener('change',importData);
  document.getElementById('settings-clear-btn')?.addEventListener('click',clearAllData);
});

function exportData(){
  const data={books:Storage.getBooks(),wishlist:Storage.getWishlist(),upcoming:Storage.getUpcoming(),settings:Storage.getSettings(),streak:Storage.getStreak()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`literati-backup-${Storage.todayStr()}.json`;a.click();URL.revokeObjectURL(url);
  Toast.show('📦 Data exported!');
}
function importData(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=(ev)=>{
    try{
      const data=JSON.parse(ev.target.result);
      if(data.books)localStorage.setItem('literati_books',JSON.stringify(data.books));
      if(data.wishlist)localStorage.setItem('literati_wishlist',JSON.stringify(data.wishlist));
      if(data.upcoming)localStorage.setItem('literati_upcoming',JSON.stringify(data.upcoming));
      if(data.settings)localStorage.setItem('literati_settings',JSON.stringify(data.settings));
      if(data.streak)localStorage.setItem('literati_streak',JSON.stringify(data.streak));
      Toast.show('✅ Data restored!');rerenderActive();
    }catch{Toast.show('⚠️ Invalid backup file.');}
  };
  reader.readAsText(file);e.target.value='';
}
function clearAllData(){
  if(!confirm('⚠️ This will delete ALL your Literati data. This cannot be undone. Continue?'))return;
  ['literati_books','literati_wishlist','literati_upcoming','literati_settings','literati_streak'].forEach(k=>localStorage.removeItem(k));
  Toast.show('🗑️ All data cleared.');rerenderActive();
}

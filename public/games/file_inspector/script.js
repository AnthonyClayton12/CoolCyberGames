// ===== Inline SVG icons (no external files) =====
    const ICONS = {
      exe: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="16" fill="#7f1d1d"/><text x="64" y="76" font-family="monospace" font-size="36" text-anchor="middle" fill="white">EXE</text></svg>`),
      pdf: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="16" fill="#1d4ed8"/><text x="64" y="76" font-family="monospace" font-size="36" text-anchor="middle" fill="white">PDF</text></svg>`),
      doc: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="16" fill="#0e7490"/><text x="64" y="76" font-family="monospace" font-size="36" text-anchor="middle" fill="white">DOC</text></svg>`),
      zip: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="16" fill="#92400e"/><text x="64" y="76" font-family="monospace" font-size="36" text-anchor="middle" fill="white">ZIP</text></svg>`)
    };

    // ===== Master dataset (for gameplay) =====
    const DEFAULT_FILES = [
      { name:"invoice.pdf.exe", size:25.0, type:"Executable",             date:"2025-07-28", icon:ICONS.exe, correct:"delete",
        explanation:"Double extension indicates an .exe disguised as .pdf. Never run; delete." },
      { name:"Office_Macro_Template.docm", size:312.4, type:"Doc (macro)", date:"2025-04-03", icon:ICONS.doc, correct:"quarantine",
        explanation:"Macro-enabled documents can run code. Quarantine and verify before opening." },
      { name:"quarterly_report.pdf", size:814.7, type:"PDF",               date:"2025-01-15", icon:ICONS.pdf, correct:"approve",
        explanation:"Normal-looking PDF with expected sender and pattern. Approve." },
      { name:"payment-details.zip", size:92.8, type:"Compressed Archive",  date:"2025-05-19", icon:ICONS.zip, correct:"quarantine",
        explanation:"Archives can hide executables. Quarantine and scan before extracting." },
      { name:"HR_Policies_Update.pdf", size:640.2, type:"PDF",             date:"2025-02-11", icon:ICONS.pdf, correct:"approve",
        explanation:"Expected internal doc with normal naming." },
      { name:"bonus_form.pdf.exe", size:41.5, type:"Executable",           date:"2025-06-02", icon:ICONS.exe, correct:"delete",
        explanation:"Again, double extension pretending to be a PDF." },
      // New examples to diversify practice
      { name:"UPS_Label_2025-08-12.pdf.exe", size:88.2, type:"Executable", date:"2025-08-12", icon:ICONS.exe, correct:"delete",
        explanation:"Fake shipping labels often use double extensions; treat as malicious." },
      { name:"Timesheet_Q3_2025.docm", size:220.3, type:"Doc (macro)", date:"2025-07-03", icon:ICONS.doc, correct:"quarantine",
        explanation:"Macro timesheet templates are a common lure—quarantine to scan first." },
      { name:"Project_SOW_Final.pdf", size:512.0, type:"PDF", date:"2025-06-21", icon:ICONS.pdf, correct:"approve",
        explanation:"Legitimate statement of work in PDF format." },
      { name:"Photos_Aug.zip", size:20480.0, type:"Compressed Archive", date:"2025-08-28", icon:ICONS.zip, correct:"quarantine",
        explanation:"Photo zips frequently hide scripts. Quarantine and scan before extracting." }
    ];

    // ===== Simple DB of known files (editable via 'Manage DB') =====
    const DEFAULT_DB = [
      { id:1, name:"invoice.pdf.exe", type:"Executable", tag:"known-malicious", note:"Double extension EXE", size:25.0, date:"2025-07-28" },
      { id:2, name:"bonus_form.pdf.exe", type:"Executable", tag:"known-malicious", note:"Double extension EXE", size:41.5, date:"2025-06-02" },
      { id:3, name:"UPS_Label_2025-08-12.pdf.exe", type:"Executable", tag:"known-malicious", note:"Fake shipping label EXE", size:88.2, date:"2025-08-12" },
      { id:4, name:"Office_Macro_Template.docm", type:"Doc (macro)", tag:"suspicious", note:"Macro doc seen in phishing", size:312.4, date:"2025-04-03" },
      { id:5, name:"Timesheet_Q3_2025.docm", type:"Doc (macro)", tag:"suspicious", note:"Macro timesheet lure", size:220.3, date:"2025-07-03" },
      { id:6, name:"payment-details.zip", type:"Compressed Archive", tag:"suspicious", note:"Archive may hide executables", size:92.8, date:"2025-05-19" },
      { id:7, name:"Photos_Aug.zip", type:"Compressed Archive", tag:"suspicious", note:"Large archive - scan before extracting", size:20480.0, date:"2025-08-28" },
      { id:8, name:"project_manager.exe", type:"Executable", tag:"known-bad-name", note:"Exe with suspicious name", size:1024.0, date:"2025-03-02" },
      { id:9, name:"passwords.txt", type:"Text", tag:"suspicious", note:"Credential file naming", size:4.2, date:"2025-02-11" },
      { id:10, name:"HR_Policies_Update.pdf", type:"PDF", tag:"known-good", note:"Known internal doc", size:640.2, date:"2025-02-11" },
      { id:11, name:"quarterly_report.pdf", type:"PDF", tag:"known-good", note:"Normal PDF", size:814.7, date:"2025-01-15" },
      { id:12, name:"malicious_dropper.exe", type:"Executable", tag:"known-malicious", note:"Example dropper", size:512.0, date:"2024-11-11" },
      { id:13, name:"invoice_urgent.zip", type:"Compressed Archive", tag:"suspicious", note:"Invoice + archive combo", size:120.0, date:"2025-09-01" },
      { id:14, name:"setup.bat", type:"Executable", tag:"suspicious", note:"Batch script executable", size:2.0, date:"2025-06-27" },
      { id:15, name:"README.md", type:"Text", tag:"known-good", note:"Benign readme", size:1.1, date:"2025-02-01" }
    ];

    // persistable DB (loaded from localStorage if user edited)
    let DB = JSON.parse(localStorage.getItem('mff_db')||'null') || DEFAULT_DB.slice();

    // ===== State =====
    let pool = [...DEFAULT_FILES];
    let gameSet = [];
    let currentIdx = 0;
    let score = 0, correct = 0, wrong = 0;
    let hardMode = false;
    let timer = null, timeLeft = 20; // seconds per round in hard mode
    let perRoundTimes = [];

    const $ = s => document.querySelector(s);
const scrIntro = document.getElementById('screen-intro');
const scrMenu = $('#screen-menu'), scrGame = $('#screen-game'), scrResults = $('#screen-results');
    const nameEl = $('#file-name'), sizeEl = $('#file-size'), typeEl = $('#file-type'), dateEl = $('#file-date');
    const iconEl = $('#file-icon');
    const progressEl = $('#progress'), scoreEl = $('#score'), progressFill = $('#progressFill');
    const feedback = $('#feedback');
    const timerWrap = $('#timerWrap'), timerEl = $('#timer');

    
function showScreen(which) {
  const screens = [
    (typeof scrOnboard !== 'undefined' ? scrOnboard : null),
    scrIntro,
    scrMenu,
    scrGame,
    scrResults
  ].filter(Boolean);

  const current = screens.find(s => !s.classList.contains('hidden'));

  // If nothing visible yet, just show target with fade-in
  if (!current) {
    which.classList.remove('hidden');
    which.classList.add('fade-in');
    which.addEventListener('animationend', () => {
      which.classList.remove('fade-in');
    }, { once: true });
    return;
  }

  if (current === which) return;

  // Prepare target
  which.classList.remove('hidden');
  which.classList.add('fade-in');

  // Fade out current
  current.classList.add('fade-out');

  const cleanup = () => {
    current.classList.add('hidden');
    current.classList.remove('fade-out');
    which.classList.remove('fade-in');
  };

  let done = 0;
  const check = () => {
    done++;
    if (done >= 2) cleanup();
  };

  current.addEventListener('animationend', check, { once: true });
  which.addEventListener('animationend', check, { once: true });
}
  // Drag & Drop wiring
  const draggable = document.getElementById('draggable-file');
  const dropTargets = Array.from(document.querySelectorAll('.drop-target'));
  let pickedUp = false;

  if (draggable) {
    draggable.setAttribute('draggable', 'true');
    draggable.addEventListener('dragstart', (e) => {
      pickedUp = true;
      draggable.classList.add('dragging');
      e.dataTransfer.setData('text/plain', 'file');
      // add a tiny transparent image so some browsers show custom drag
      const img = document.createElement('canvas');
      img.width = img.height = 1;
      e.dataTransfer.setDragImage(img, 0, 0);
    });

    draggable.addEventListener('dragend', () => {
      pickedUp = false;
      draggable.classList.remove('dragging');
      dropTargets.forEach(t => t.classList.remove('drag-over'));
    });

    // Keyboard fallback: space/enter to pick up, then focus target and press enter to drop
    draggable.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        pickedUp = !pickedUp;
        draggable.classList.toggle('dragging', pickedUp);
        if (pickedUp) {
          draggable.setAttribute('aria-grabbed', 'true');
          // move focus to first drop target for convenience
          const first = dropTargets[0];
          if (first) first.focus();
        } else {
          draggable.setAttribute('aria-grabbed', 'false');
        }
      }
    });
  }

  dropTargets.forEach(target => {
    target.setAttribute('tabindex', '0');
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      target.classList.add('drag-over');
    });
    target.addEventListener('dragleave', () => target.classList.remove('drag-over'));
    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('drag-over');
      if (!pickedUp) return;
      pickedUp = false;
      draggable.classList.remove('dragging');
      const action = target.dataset.action;
      if (action && typeof choose === 'function') {
        choose(action);
      }
    });

    // Keyboard drop: when target has focus and user presses Enter/Space while "holding" the file
    target.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && pickedUp) {
        e.preventDefault();
        const action = target.dataset.action;
        pickedUp = false;
        draggable.classList.remove('dragging');
        if (action && typeof choose === 'function') choose(action);
      }
    });
  });


    function shuffle(arr){
      for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
      return arr;
    }

    function showFile(i){
      const f = gameSet[i];
      nameEl.textContent = f.name;
      sizeEl.textContent = `${f.size} KB`;
      typeEl.textContent = f.type;
      dateEl.textContent = f.date;
      iconEl.src = f.icon; iconEl.alt = f.type + ' icon';
      progressEl.textContent = `${i+1} / ${gameSet.length}`;
      progressFill.style.width = `${((i)/Math.max(1,gameSet.length))*100}%`;
      feedback.className = ''; feedback.textContent = '';
      if(hardMode){ startTimer(); } else { stopTimer(); }
      roundStartTs = performance.now();
    }

    function delta(choice, correct){ return (choice===correct) ? (correct!=='approve'?10:5) : (correct==='approve'?-5:-10); }

    function formatTime(s){ const m = Math.floor(s/60); const r = (s%60); return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; }

    let roundStartTs = 0;

    function choose(choice){
      const f = gameSet[currentIdx];
      const spent = Math.max(0, Math.round((performance.now()-roundStartTs)/1000));
      perRoundTimes.push(spent);

      let d = delta(choice, f.correct);
      let bonus = 0;
      if(hardMode && timeLeft >= 5 && choice === f.correct){ bonus = 2; }
      score += (d + bonus);
      scoreEl.textContent = `Score: ${score}`;
  const ok = (choice === f.correct);
  ok ? correct++ : wrong++;
      feedback.className = (ok ? 'good' : 'bad') + ' show';
      const bonusTxt = bonus? ` (+${bonus} time bonus)` : '';
      feedback.textContent = (ok ? '✅ Correct: ' : '❌ Wrong: ') + f.explanation + bonusTxt;
      stopTimer();
      if(ok){
        spawnConfetti(window.innerWidth*0.5, window.innerHeight*0.45, 20);
      } else {
        // trigger fail feedback: shake + flash + vibration (if available)
        triggerFailFeedback();
      }
    }

    function triggerFailFeedback(){
      // Add classes to body to trigger CSS animations
      document.body.classList.add('screen-shake');
      document.body.classList.add('screen-flash');
      // Try to vibrate on supporting devices (short pattern)
      try{ if(navigator.vibrate) navigator.vibrate([40,30,40]); }catch(e){}
      // Remove classes after animation completes (~600ms)
      setTimeout(()=>{ document.body.classList.remove('screen-shake'); }, 620);
      setTimeout(()=>{ document.body.classList.remove('screen-flash'); }, 620);
    }

    function nextFile(){
      currentIdx++;
      if(currentIdx >= gameSet.length){ finish(); return; }
      showFile(currentIdx);
    }

    function finish(){
      stopTimer();
      $('#r-score').textContent = score;
      $('#r-rounds').textContent = gameSet.length;
      $('#r-correct').textContent = correct;
      $('#r-wrong').textContent = wrong;
      const avg = perRoundTimes.length ? (perRoundTimes.reduce((a,b)=>a+b,0)/perRoundTimes.length) : 0;
      $('#r-avg').textContent = `${avg.toFixed(1)} s`;
      progressFill.style.width = '100%';
      // high score
      const hs = Number(localStorage.getItem('mff_highscore')||'0');
      if(score > hs){ localStorage.setItem('mff_highscore', String(score)); }
      updateHighScore();
      showScreen(scrResults);
    }

    function updateHighScore(){ $('#highscore').textContent = localStorage.getItem('mff_highscore') || '0'; }

    function startTimer(){
      timeLeft = 20; timerWrap.classList.remove('hidden'); timerEl.textContent = formatTime(timeLeft);
      stopTimer();
      timer = setInterval(()=>{
        timeLeft--; timerEl.textContent = formatTime(timeLeft);
        if(timeLeft <= 5) { timerEl.classList.add('urgent'); }
        if(timeLeft<=0){
          clearInterval(timer); timer=null;
          // auto mark as wrong if no action
          choose('__timeout__');
        }
      },1000);
    }
    function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } timerEl.classList.remove('urgent'); timerWrap.classList.toggle('hidden',!hardMode); }

    // ===== Hints =====
    const HINTS = [
      [/\.pdf\.exe$/i, 'Double extension: looks like a PDF but is an EXE.'],
      [/\.docm$/i, 'Macro-enabled document: treat with caution.'],
      [/\.zip$/i, 'Archives may hide scripts/executables; quarantine first.'],
      [/^HR_|^Project_|^quarterly_/i, 'Typical corporate naming; still verify sender.']
    ];
    function getHint(name){
      for(const [re,txt] of HINTS){ if(re.test(name)) return txt; }
      return 'Look at the extension and whether it can execute code or hide contents.';
    }

    // ===== DB utilities =====
    function dbFindByName(name){
      const n = (name||'').toLowerCase();
      return DB.filter(e => e.name.toLowerCase() === n || n.includes(e.name.toLowerCase()));
    }

    function heuristicsForName(name, type, size){
      const reasons = [];
      if(/\.([a-z0-9]+)\.([a-z0-9]+)$/i.test(name)) reasons.push('Double extension (e.g., .pdf.exe) — often malicious.');
      if(/\.docm$/i.test(name) || /\.xlsm$/i.test(name)) reasons.push('Macro-enabled Office document (.docm/.xlsm).');
      if(/\.zip$|\.rar$|\.7z$/i.test(name)) reasons.push('Compressed archive — scan before extracting.');
      if(/(invoice|payment|urgent|label|shipping|bank)/i.test(name) && /\.zip$|\.exe$|\.scr$/.test(name)) reasons.push('Common phishing lure + executable/archive.');
      if(size && size > 10000) reasons.push('Very large file — could contain many files/scripts (scan before extracting).');
      return reasons;
    }

    function scanWithDb(file){
      const reasons = [];
      const matches = dbFindByName(file.name || '');
      if(matches.length){
        const exact = matches.find(m => m.name.toLowerCase() === (file.name||'').toLowerCase());
        if(exact){
          if(exact.tag === 'known-malicious' || exact.tag === 'known-bad-name') return { verdict:'bad', reasons:[`Matched DB entry: ${exact.name} — ${exact.note}`] };
          if(exact.tag === 'suspicious') reasons.push(`Matched DB entry: ${exact.name} — ${exact.note}`);
          if(exact.tag === 'known-good') return { verdict:'known-good', reasons:[`Matched DB whitelist: ${exact.name}`] };
        } else {
          reasons.push(...matches.map(m=>`Partial DB match: ${m.name} (${m.tag})`));
        }
      }
      const h = heuristicsForName(file.name || '', file.type, file.size);
      reasons.push(...h);
      const suspiciousExt = /\.(exe|scr|bat|cmd|msi|vbs|ps1|jar|hta)$/i;
      if(suspiciousExt.test(file.name || '')) reasons.push('Executable extension detected — handle as high risk.');
      if(reasons.some(r => /Double extension|Executable extension|Matched DB entry: .*known-malicious|known-bad-name/i.test(r))) {
        return { verdict:'bad', reasons };
      }
      if(reasons.length > 0) {
        return { verdict:'suspicious', reasons };
      }
      return { verdict:'clean', reasons:[] };
    }

    function openManageDbDialog(){
      let dlg = document.getElementById('db-dialog');
      if(!dlg){
        dlg = document.createElement('dialog'); dlg.id = 'db-dialog';
        dlg.innerHTML = `
          <div class="modal-header"><strong>Manage DB</strong><button class="close-x" data-close>✕</button></div>
          <div class="modal-body">
            <p class="note">Edit the DB JSON array of objects (<code>id,name,type,tag,note,size,date</code>). You can export/import below.</p>
            <textarea id="db-json" style="width:100%;height:220px;background:#071226;color:var(--text);border:1px solid var(--border);padding:10px;border-radius:8px;"></textarea>
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
              <button id="db-save" class="menu-btn primary">Save</button>
              <button id="db-export" class="menu-btn">Export DB</button>
              <button id="db-reset" class="menu-btn">Reset to defaults</button>
            </div>
          </div>`;
        document.body.appendChild(dlg);
        dlg.querySelector('[data-close]').addEventListener('click',()=>dlg.close());
        dlg.addEventListener('click', (e)=>{ if(e.target===dlg) dlg.close(); });
        dlg.addEventListener('close', ()=>{ /* noop */ });
        dlg.querySelector('#db-save').addEventListener('click', ()=>{
          try{
            const parsed = JSON.parse(dlg.querySelector('#db-json').value);
            if(!Array.isArray(parsed)) throw new Error('DB must be an array');
            DB = parsed;
            localStorage.setItem('mff_db', JSON.stringify(DB));
            alert('DB saved.'); dlg.close();
          }catch(e){ alert('Invalid JSON: '+e.message); }
        });
        dlg.querySelector('#db-export').addEventListener('click', ()=>{
          const blob = new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
          const url = URL.createObjectURL(blob); const a = document.createElement('a');
          a.href = url; a.download = `mff_db_${Date.now()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),500);
        });
        dlg.querySelector('#db-reset').addEventListener('click', ()=>{
          if(confirm('Reset DB to defaults?')){ DB = DEFAULT_DB.slice(); localStorage.removeItem('mff_db'); dlg.querySelector('#db-json').value = JSON.stringify(DB,null,2); alert('Reset'); }
        });
      }
      dlg.querySelector('#db-json').value = JSON.stringify(DB,null,2);
      dlg.showModal();
    }

    // ===== Wiring =====
    $('#approve').addEventListener('click', () => choose('approve'));
    $('#quarantine').addEventListener('click', () => choose('quarantine'));
    $('#delete').addEventListener('click', () => choose('delete'));
    $('#next').addEventListener('click', nextFile);
    $('#hint').addEventListener('click', ()=>{
      const f = gameSet[currentIdx];
      feedback.className = 'show';
      feedback.textContent = '💡 Hint: ' + getHint(f.name);
    });

    window.addEventListener('keydown', (e) => {
      if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase();
      if(k==='a') choose('approve');
      if(k==='q') choose('quarantine');
      if(k==='d') choose('delete');
      if(k==='n' || e.key==='ArrowRight') nextFile();
    });

    // menu wiring for DB
    $('#manageDb').addEventListener('click', ()=> openManageDbDialog());
    $('#useDb').addEventListener('change', (e)=> {
      const on = e.target.checked;
      document.getElementById('manageDb').disabled = !on;
    });

    // scan button in game actions
    $('#scanDb').addEventListener('click', ()=>{
  const wrap = document.createElement('div'); wrap.className='scan-overlay';
  const spinner = document.createElement('div'); spinner.className='scan-spinner';
  wrap.appendChild(spinner);
  wrap.appendChild(document.createTextNode('Scanning…'));
  feedback.className = 'show';
  feedback.textContent = '';
  feedback.appendChild(wrap);
  // small delay to simulate scan
  setTimeout(()=>{
    // actual scan logic (existing code) – call scanWithDb and render results
    const f = gameSet[currentIdx];
    const res = scanWithDb(f);
    feedback.className = (res.verdict==='bad' ? 'bad show' : (res.verdict==='suspicious' ? 'bad show' : 'good show'));
    feedback.textContent = `DB scan: ${res.verdict.toUpperCase()}. Reasons: ${res.reasons.join(' | ')}`;
  }, 700);
});

    // ===== Menu actions =====
    $('#start').addEventListener('click', () => {
      const rounds = parseInt($('#rounds').value,10);
      const shuffleOn = $('#shuffle').checked;
      hardMode = $('#hardmode').checked;

      // Category filtering
      const enabledCats = Array.from(document.querySelectorAll('.cat:checked')).map(x=>x.value);
      const filtered = pool.filter(f => enabledCats.includes(f.type));

      // Build the game set
      gameSet = filtered.slice(0);
      if(shuffleOn) shuffle(gameSet);
      gameSet = gameSet.slice(0, Math.min(rounds, gameSet.length));
      if(gameSet.length===0){ alert('No questions in the selected categories.'); return; }

      // Reset state
      currentIdx = 0; score = 0; correct = 0; wrong = 0; perRoundTimes = [];
      scoreEl.textContent = `Score: ${score}`;
      progressFill.style.width = '0%';

      // Go!
      showScreen(scrGame);
      showFile(currentIdx);
    });

    $('#play-again').addEventListener('click', () => { showScreen(scrIntro); });
    $('#back-menu').addEventListener('click', () => showScreen(scrMenu));

    // Intro screen → menu
    document.getElementById('enter-menu').addEventListener('click', () => showScreen(scrMenu));

    // ===== Import / Export (question pool) =====
    $('#import').addEventListener('click', ()=> $('#file-import').click());
    $('#file-import').addEventListener('change', async (ev)=>{
      const file = ev.target.files?.[0]; if(!file) return;
      try{
        const txt = await file.text();
        const data = JSON.parse(txt);
        if(!Array.isArray(data)) throw new Error('JSON must be an array of items');
        const ok = data.every(o=> o && typeof o.name==='string' && typeof o.type==='string' && typeof o.correct==='string');
        if(!ok) throw new Error('Each item must include at least name, type, and correct');
        data.forEach(o=>{ if(!o.icon){
          if(/exe|execut/i.test(o.type)) o.icon = ICONS.exe;
          else if(/pdf/i.test(o.type)) o.icon = ICONS.pdf;
          else if(/doc|macro/i.test(o.type)) o.icon = ICONS.doc;
          else if(/zip|archive/i.test(o.type)) o.icon = ICONS.zip;
          else o.icon = ICONS.pdf;
        }});
        pool = [...DEFAULT_FILES, ...data];
        alert(`Imported ${data.length} items. Pool now has ${pool.length}.`);
      }catch(err){ alert('Import failed: '+ err.message); }
      finally{ ev.target.value = ''; }
    });

    $('#export').addEventListener('click', ()=>{
      const out = {
        score, correct, wrong, rounds: gameSet.length,
        avg_time_s: perRoundTimes.length ? (perRoundTimes.reduce((a,b)=>a+b,0)/perRoundTimes.length) : 0,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(out,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `mff_session_${Date.now()}.json`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 500);
    });

    // How to Play modal
    const dlg = document.getElementById('modal-how');
    document.getElementById('howto').addEventListener('click', ()=> dlg.showModal());
    dlg.addEventListener('click', (e)=>{ if(e.target===dlg) dlg.close(); });
    dlg.querySelector('[data-close]').addEventListener('click', ()=> dlg.close());

    // File Type Guide modal + tabs
const guideDlg = document.getElementById('modal-guide');
document.getElementById('guide').addEventListener('click', ()=> guideDlg.showModal());
guideDlg.addEventListener('click', (e)=>{ if(e.target===guideDlg) guideDlg.close(); });
guideDlg.querySelector('[data-close]').addEventListener('click', ()=> guideDlg.close());

// Tabs behavior
const guideTabs = Array.from(guideDlg.querySelectorAll('.tab'));
const panels = Array.from(guideDlg.querySelectorAll('.tab-panel'));
guideTabs.forEach(btn => btn.addEventListener('click', ()=>{
  guideTabs.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const id = btn.getAttribute('data-tab');
  panels.forEach(p=>{
    const on = p.id === id;
    p.classList.toggle('hidden', !on);
    p.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
}));

// Init
    updateHighScore();
    // (intro screen disabled; onboarding handles first-run)

// ===== Onboarding Wizard =====
const scrOnboard = document.getElementById('screen-onboard');
const obText = document.getElementById('ob-step-text');
const obDots = Array.from(document.querySelectorAll('.ob-dots .dot'));
const obBack = document.getElementById('ob-back');
const obNext = document.getElementById('ob-next');
const obSkip = document.getElementById('ob-skip');
const obSkipNext = document.getElementById('ob-skip-next');

/* Onboarding steps */
const OB_STEPS = [
  "Welcome! I’m your helper shield. I’ll show you how to spot tricky files. Click “Next”.",
  "Rule 1: Look at the file ending. If it ends with .exe or has two endings like .pdf.exe, don’t open it.",
  "Rule 2: Files that say .docm or .xlsm can run code. If you didn’t expect it, choose Quarantine.",
  "Rule 3: Zip files can hide bad stuff. Quarantine and scan before opening.",
  "You will choose: Approve (safe), Quarantine (unsure), or Delete (clearly bad). Ready to try it?"
];

let obIndex = 0;

function renderOnboard(){
  if(!scrOnboard) return;
  obText.textContent = OB_STEPS[obIndex];
  obBack.disabled = obIndex === 0;
  obNext.textContent = (obIndex === OB_STEPS.length - 1) ? "Let's go" : "Next";
  obDots.forEach((d,i)=> d.classList.toggle('active', i===obIndex));
}

if(scrOnboard){
  obBack.addEventListener('click', ()=>{ if(obIndex>0){ obIndex--; renderOnboard(); } });
  obNext.addEventListener('click', ()=>{
    if(obIndex < OB_STEPS.length - 1){ obIndex++; renderOnboard(); }
    else {
      if(obSkipNext.checked){ localStorage.setItem('mff_skip_intro','1'); }
      showScreen(scrIntro);
    }
  });
  obSkip.addEventListener('click', ()=>{
    if(obSkipNext.checked){ localStorage.setItem('mff_skip_intro','1'); }
    showScreen(scrIntro);
  });
}

// On load, show onboarding unless the user chose to skip
(function(){
  const skip = localStorage.getItem('mff_skip_intro') === '1';
  if(!skip && scrOnboard){ showScreen(scrOnboard); renderOnboard(); }
})();

function spawnConfetti(x = window.innerWidth/2, y = window.innerHeight/2, count = 18){
  const colors = ['#22d3ee','#60a5fa','#34d399','#f59e0b','#fb7185'];
  const frag = document.createDocumentFragment();
  for(let i=0;i<count;i++){
    const d = document.createElement('div');
    d.className = 'confetti-piece';
    d.style.background = colors[i % colors.length];
    document.body.appendChild(d);
    // initial position
    d.style.left = `${x}px`; d.style.top = `${y}px`;
    // random velocity
    const vx = (Math.random()-0.5)*400;
    const vy = - (Math.random()*500 + 200);
    const rot = (Math.random()-0.5)*720;
    // animate via requestAnimationFrame
    const duration = 1200 + Math.random()*800;
    const start = performance.now();
    function frame(t){
      const p = Math.min(1,(t-start)/duration);
      const ease = 1 - Math.pow(1-p,3);
      d.style.transform = `translate(${vx*ease}px, ${vy*ease + 0.5*900*p*p}px) rotate(${rot*p}deg)`;
      d.style.opacity = `${1 - p}`;
      if(p < 1) requestAnimationFrame(frame);
      else d.remove();
    }
    requestAnimationFrame(frame);
  }
}

// smooth numeric tween (optional)
const newScore = score;
let start = null, from = Number(scoreEl.dataset.val||0);
function step(ts){
  if(!start) start = ts;
  const p = Math.min(1,(ts-start)/300);
  const val = Math.round(from + (newScore - from) * p);
  scoreEl.textContent = `Score: ${val}`;
  if(p<1) requestAnimationFrame(step);
  else scoreEl.dataset.val = String(newScore);
}
requestAnimationFrame(step);

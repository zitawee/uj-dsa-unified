let TOKEN = localStorage.getItem('fit_tok');
let ME = null;
let SKILLS = [];
let GAMES = [];
let CANDIDATES = [];
let CUR_SKILL = null, CUR_GAME = null, CUR_GENDER = '';
let CUR_STUDENT_ID = null;

function fEsc(s) { return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function api(url, method='GET', body=null) {
  const opts = { method, headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+(TOKEN||'') } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(url, opts);
    const data = await r.json().catch(()=>({}));
    if (!r.ok) return { error: data.error || 'حدث خطأ' };
    return data;
  } catch(e) { return { error: 'تعذّر الاتصال بالخادم' }; }
}

async function doLogin() {
  const username = document.getElementById('lu').value.trim();
  const password = document.getElementById('lp').value;
  const btn = document.getElementById('lbtn');
  const err = document.getElementById('lerr');
  err.innerHTML = '';
  if (!username || !password) { err.innerHTML = '<div class="err">يرجى إدخال اسم المستخدم وكلمة المرور</div>'; return; }
  btn.disabled = true; btn.textContent = 'جارٍ الدخول...';
  const r = await api('/api/login', 'POST', { username, password });
  btn.disabled = false; btn.textContent = 'دخول';
  if (r.error) { err.innerHTML = `<div class="err">${fEsc(r.error)}</div>`; return; }
  if (!['admin','sports_reviewer'].includes(r.user.role)) {
    err.innerHTML = '<div class="err">هذا الحساب لا يملك صلاحية الوصول لشاشة اختبار اللياقة</div>';
    return;
  }
  TOKEN = r.token; ME = r.user;
  localStorage.setItem('fit_tok', TOKEN);
  localStorage.setItem('fit_me', JSON.stringify(ME));
  showAfterLogin();
}

function doLogout() {
  api('/api/logout', 'POST');
  localStorage.removeItem('fit_tok'); localStorage.removeItem('fit_me');
  TOKEN = null; ME = null;
  document.getElementById('hdr-who').style.display = 'none';
  document.getElementById('hdr-logout').style.display = 'none';
  document.getElementById('scr-login').style.display = 'block';
  document.getElementById('scr-setup').style.display = 'none';
  document.getElementById('scr-list').style.display = 'none';
}

async function checkSession() {
  if (!TOKEN) return;
  const r = await api('/api/sports_excellence/fitness/skills');
  if (r.error) { localStorage.removeItem('fit_tok'); TOKEN = null; return; }
  const stored = localStorage.getItem('fit_me');
  if (stored) ME = JSON.parse(stored);
  SKILLS = r;
  showAfterLogin(true);
}

async function showAfterLogin(skipSkillsFetch) {
  document.getElementById('scr-login').style.display = 'none';
  document.getElementById('hdr-who').style.display = 'inline';
  document.getElementById('hdr-who').textContent = ME?.fullName || ME?.username || '';
  document.getElementById('hdr-logout').style.display = 'inline-block';

  if (!skipSkillsFetch) {
    const r = await api('/api/sports_excellence/fitness/skills');
    if (!r.error) SKILLS = r;
  }
  const settings = await api('/api/sports_excellence/settings');
  GAMES = (!settings.error && Array.isArray(settings.active_games)) ? settings.active_games : [];

  document.getElementById('setup-skill').innerHTML = SKILLS.map(s => `<option value="${s.key}">${fEsc(s.label)} (${fEsc(s.unit)})</option>`).join('');
  document.getElementById('setup-game').innerHTML = `<option value="">اختاري اللعبة</option>` + GAMES.map(g => `<option value="${fEsc(g)}">${fEsc(g)}</option>`).join('');

  document.getElementById('scr-setup').style.display = 'block';
}

function backToSetup() {
  document.getElementById('scr-list').style.display = 'none';
  document.getElementById('scr-setup').style.display = 'block';
}

async function startSession() {
  const skillKey = document.getElementById('setup-skill').value;
  const game = document.getElementById('setup-game').value;
  const gender = document.getElementById('setup-gender').value;
  if (!game) { alert('يرجى اختيار اللعبة'); return; }
  CUR_SKILL = SKILLS.find(s => s.key === skillKey);
  CUR_GAME = game;
  CUR_GENDER = gender;

  const r = await api('/api/sports_excellence/fitness/candidates');
  if (r.error) { alert(r.error); return; }
  CANDIDATES = r;

  document.getElementById('lb-skill').textContent = `📏 ${CUR_SKILL.label}`;
  document.getElementById('lb-game').textContent = `🏆 ${CUR_GAME}${gender ? ' — ' + gender : ''}`;
  document.getElementById('scr-setup').style.display = 'none';
  document.getElementById('scr-list').style.display = 'block';
  document.getElementById('list-q').value = '';
  renderList();
}

function renderList() {
  const q = (document.getElementById('list-q').value || '').trim().toLowerCase();
  let rows = CANDIDATES.filter(r => (r.game_types||[]).includes(CUR_GAME));
  if (CUR_GENDER) rows = rows.filter(r => r.gender === CUR_GENDER);
  if (q) rows = rows.filter(r => (r.full_name||'').toLowerCase().includes(q));
  rows = rows.slice().sort((a,b) => (a.full_name||'').localeCompare(b.full_name||'', 'ar'));

  const body = document.getElementById('list-body');
  if (!rows.length) { body.innerHTML = `<div class="empty">لا يوجد طلبة مطابقون لهذا الاختيار</div>`; return; }

  body.innerHTML = rows.map(r => {
    const val = r.fitness_measurements ? r.fitness_measurements[CUR_SKILL.key] : null;
    const done = val != null;
    return `
    <div class="row ${done?'done':''}" onclick="openOv('${r.id}')">
      <div>
        <div class="rn">${fEsc(r.full_name)}</div>
        ${done ? `<div class="rv">✓ تم الفحص — ${fEsc(val)} ${fEsc(CUR_SKILL.unit)}</div>` : ''}
      </div>
      <div class="re">${done ? 'تعديل' : 'إدخال'}</div>
    </div>`;
  }).join('');
}

function openOv(id) {
  const r = CANDIDATES.find(c => c.id === id);
  if (!r) return;
  CUR_STUDENT_ID = id;
  document.getElementById('ov-title').textContent = CUR_SKILL.label;
  document.getElementById('ov-stu').textContent = r.full_name;
  document.getElementById('ov-label').textContent = `القيمة (${CUR_SKILL.unit})`;
  const val = r.fitness_measurements ? r.fitness_measurements[CUR_SKILL.key] : null;
  document.getElementById('ov-val').value = val != null ? val : '';
  document.getElementById('ov-err').innerHTML = '';
  document.getElementById('ov').classList.add('open');
  setTimeout(()=>document.getElementById('ov-val').focus(), 100);
}

function closeOv() {
  document.getElementById('ov').classList.remove('open');
  CUR_STUDENT_ID = null;
}

async function saveOv() {
  const val = document.getElementById('ov-val').value;
  const err = document.getElementById('ov-err');
  err.innerHTML = '';
  if (val === '' || isNaN(parseFloat(val)) || parseFloat(val) < 0) {
    err.innerHTML = '<div class="err">يرجى إدخال رقم صحيح</div>';
    return;
  }
  const r = await api(`/api/sports_excellence/${CUR_STUDENT_ID}/fitness`, 'PUT', { skill: CUR_SKILL.key, value: parseFloat(val) });
  if (r.error) { err.innerHTML = `<div class="err">${fEsc(r.error)}</div>`; return; }

  // تحديث محلي فوري دون إعادة تحميل كل القائمة من الخادم
  const idx = CANDIDATES.findIndex(c => c.id === CUR_STUDENT_ID);
  if (idx > -1) {
    CANDIDATES[idx].fitness_measurements = r.fitness_measurements;
    CANDIDATES[idx].ability_test_score = r.ability_test_score;
    CANDIDATES[idx].status = r.status;
  }
  closeOv();
  renderList();
  if (r.completed) {
    setTimeout(()=>alert(`✅ اكتملت المهارات الخمس لهذا الطالب.\nعلامة اختبار اللياقة: ${r.ability_test_score} من 50\nالنتيجة: ${r.status === 'ability_test_passed' ? 'اجتاز' : 'لم يجتاز'}`), 150);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lp').addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); });
  document.getElementById('lu').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('lp').focus(); });
  document.getElementById('ov-val').addEventListener('keydown', e => { if (e.key==='Enter') saveOv(); });
  checkSession();
});

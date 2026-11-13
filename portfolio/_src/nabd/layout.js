const PEOPLE = {
  sara:  {n:'سارة العتيبي', i:'س', c:'#6366F1', role:'مديرة المشاريع'},
  khaled:{n:'خالد الشمري', i:'خ', c:'#0EA5E9', role:'قائد فريق التطوير'},
  noura: {n:'نورة القحطاني', i:'ن', c:'#EC4899', role:'مصممة واجهات'},
  faisal:{n:'فيصل الدوسري', i:'ف', c:'#F59E0B', role:'مطور واجهات أمامية'},
  reem:  {n:'ريم الزهراني', i:'ر', c:'#10B981', role:'محللة أعمال'},
  abdullah:{n:'عبدالله الحربي', i:'ع', c:'#8B5CF6', role:'مطور أنظمة خلفية'},
  lama:  {n:'لمى السبيعي', i:'ل', c:'#14B8A6', role:'مختبرة جودة'},
  majed: {n:'ماجد الغامدي', i:'م', c:'#EF4444', role:'مدير التسويق'},
  haya:  {n:'هيا المطيري', i:'ه', c:'#F97316', role:'مسؤولة المحتوى'},
  turki: {n:'تركي العنزي', i:'ت', c:'#64748B', role:'مهندس عمليات DevOps'},
};
const av = (k, s = 34) => { const p = PEOPLE[k]; return `<span class="av" style="background:${p.c};width:${s}px;height:${s}px;font-size:${s * .4}px">${p.i}</span>`; };
const avs = (ks, s = 30) => `<span class="avs">${ks.map(k => av(k, s)).join('')}</span>`;

function layout(active, crumb) {
  const items = [
    ['dash', 'layout-dashboard', 'لوحة التحكم'],
    ['projects', 'folder-kanban', 'المشاريع', '12'],
    ['tasks', 'list-checks', 'المهام', '48'],
    ['calendar', 'calendar-days', 'التقويم'],
    ['team', 'users', 'الفريق'],
    ['reports', 'chart-pie', 'التقارير'],
  ];
  const items2 = [['msgs', 'message-square-text', 'الرسائل', '5'], ['files', 'folder-open', 'الملفات'], ['settings', 'settings', 'الإعدادات']];
  const link = ([k, ic, t, b]) => `<a class="${k === active ? 'on' : ''}"><i data-lucide="${ic}"></i>${t}${b ? `<span class="b">${b}</span>` : ''}</a>`;
  document.body.innerHTML = `<div class="app">
  <aside class="side">
    <div class="logo"><div class="mark"><i data-lucide="activity"></i></div><div><b>نبض</b><small>إدارة المشاريع والمهام</small></div></div>
    <div class="ws"><span class="wi">أ</span><div><b>أفق للحلول الرقمية</b><span>مساحة العمل · 32 عضوًا</span></div><i data-lucide="chevrons-up-down" style="width:16px;color:#64748B"></i></div>
    <div class="nav-t">القائمة الرئيسية</div><nav class="nav">${items.map(link).join('')}</nav>
    <div class="nav-t" style="margin-top:14px">مساحة العمل</div><nav class="nav">${items2.map(link).join('')}</nav>
    <div class="up"><b>مساحة التخزين</b><p>استُخدم 36 جيجابايت من أصل 50 جيجابايت</p><div class="bar"><i></i></div></div>
    <div class="me">${av('sara', 38)}<div><b>سارة العتيبي</b><span>مديرة المشاريع</span></div><i data-lucide="log-out" style="margin-inline-start:auto;width:17px;color:#64748B"></i></div>
  </aside>
  <main class="main">
    <header class="top">
      <div class="crumb">${crumb}</div>
      <div class="search"><i data-lucide="search"></i>ابحث عن مشروع أو مهمة أو عضو...<kbd>Ctrl K</kbd></div>
      <div class="ib"><i data-lucide="bell"></i><span class="dot"></span></div>
      <div class="ib"><i data-lucide="circle-help"></i></div>
      <button class="btn p" style="height:44px"><i data-lucide="plus"></i>مهمة جديدة</button>
    </header>
    <section class="content" id="content"></section>
  </main></div>`;
  return document.getElementById('content');
}
const icons = () => lucide.createIcons();

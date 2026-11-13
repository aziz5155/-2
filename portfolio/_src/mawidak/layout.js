const DOC = {
  ahmad: {n:'د. أحمد العمري', s:'أخصائي تقويم الأسنان', i:'أ', c:'#0D9488'},
  muna:  {n:'د. منى الحارثي', s:'أخصائية تجميل الأسنان', i:'م', c:'#F06548'},
  yousef:{n:'د. يوسف البقمي', s:'استشاري زراعة الأسنان', i:'ي', c:'#6366F1'},
  layla: {n:'د. ليلى القرني', s:'أخصائية علاج العصب', i:'ل', c:'#D97706'},
  salman:{n:'د. سلمان الشهري', s:'طبيب أسنان عام', i:'س', c:'#0EA5E9'},
};
const dav = (k, s = 36, round = false) => { const p = DOC[k]; return `<span class="av ${round ? 'avr' : ''}" style="background:${p.c};width:${s}px;height:${s}px;font-size:${s * .4}px">${p.i}</span>`; };
const cav = (name, color, s = 36) => `<span class="av avr" style="background:${color}1F;color:${color};width:${s}px;height:${s}px;font-size:${s * .38}px">${name.trim()[0]}</span>`;

function layout(active, title, sub) {
  const items = [
    ['dash', 'layout-grid', 'لوحة التحكم'],
    ['cal', 'calendar-days', 'التقويم'],
    ['book', 'calendar-check-2', 'الحجوزات', '8'],
    ['cust', 'contact-round', 'العملاء'],
    ['prov', 'stethoscope', 'مقدمو الخدمة'],
    ['serv', 'sparkles', 'الخدمات'],
    ['stats', 'chart-column-big', 'الإحصائيات'],
  ];
  const items2 = [['pay', 'wallet', 'المدفوعات'], ['notif', 'bell-ring', 'التذكيرات والرسائل'], ['set', 'settings-2', 'الإعدادات']];
  const link = ([k, ic, t, b]) => `<a class="${k === active ? 'on' : ''}"><i data-lucide="${ic}"></i>${t}${b ? `<span class="b">${b}</span>` : ''}</a>`;
  document.body.innerHTML = `<div class="app">
  <aside class="side">
    <div class="logo"><div class="mark"><i data-lucide="calendar-heart"></i></div><div><b>موعدك</b><small>منصة الحجوزات الذكية</small></div></div>
    <div class="biz"><span class="bi"><i data-lucide="smile-plus"></i></span><div><b>عيادات بسمة لطب الأسنان</b><span>فرع الملقا — الرياض</span></div><i data-lucide="chevron-down" style="margin-inline-start:auto;width:16px;color:var(--muted)"></i></div>
    <div class="nav-t">الإدارة</div><nav class="nav">${items.map(link).join('')}</nav>
    <div class="nav-t" style="margin-top:12px">النظام</div><nav class="nav">${items2.map(link).join('')}</nav>
    <div class="promo"><b>صفحة الحجز الخاصة بك</b><p>شارك رابط الحجز مع عملائك عبر واتساب ووسائل التواصل.</p><span class="lnk"><i data-lucide="link-2" style="width:15px;height:15px"></i>نسخ رابط الحجز</span></div>
  </aside>
  <main class="main">
    <header class="top"><div><h2>${title}</h2><div class="sub">${sub}</div></div>
      <div class="search"><i data-lucide="search"></i>ابحث عن عميل أو حجز أو رقم جوال...</div>
      <div class="ib"><i data-lucide="bell"></i><span class="dot"></span></div>
      <div class="usr"><span class="av" style="background:#10201E;width:36px;height:36px;border-radius:10px">ر</span><div><b>رنا الدوسري</b><span>مديرة الاستقبال</span></div><i data-lucide="chevron-down" style="width:15px;color:var(--muted)"></i></div>
    </header>
    <section class="content" id="content"></section>
  </main></div>`;
  return document.getElementById('content');
}
const icons = () => lucide.createIcons();

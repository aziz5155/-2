const path = require("path");
const ROOT = path.join(__dirname, "..");
const pptxgen = require(path.join(ROOT, "node_modules/pptxgenjs"));

const NAVY = "0B1F3A", NAVY2 = "132F52";
const PETROL = "12746F", PETROL_L = "22A79A", PETROL_PALE = "E9F7F5";
const ALERT = "E8613C", ALERT_PALE = "FDECE8";
const BG = "F4F7FB", CARD = "FFFFFF", LINE = "E3E9F2";
const TEXT_DARK = "0B1F3A", TEXT_GRAY = "5A6B87";
const F_HEAD = "Calibri", F_BODY = "Arial";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
const W = 13.333, H = 7.5;

function rtl(slide, text, x, y, w, h, opts) {
  return slide.addText(text, Object.assign({
    x, y, w, h, isTextBox: true, align: "right", fontFace: F_BODY, color: TEXT_DARK,
    valign: "top", rtlMode: true, margin: 0
  }, opts));
}
function iconCircle(slide, cx, cy, d, bg) {
  slide.addShape("ellipse", { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: bg }, line: { type: "none" } });
}
function card(slide, x, y, w, h, fillColor = CARD) {
  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: 0.12, fill: { color: fillColor }, line: { color: LINE, width: 1 },
    shadow: { type: "outer", color: "0B1F3A", opacity: 0.12, blur: 8, offset: 3, angle: 90 }
  });
}
function pill(slide, x, y, w, h, text, bg, color, fontSize = 11) {
  slide.addShape("roundRect", { x, y, w, h, rectRadius: h / 2, fill: { color: bg }, line: { type: "none" } });
  slide.addText(text, { x, y, w, h, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize, color, isTextBox: true, rtlMode: true, margin: 0 });
}
function kicker(slide, text, dark) {
  slide.addText(text, {
    x: 0.7, y: 0.45, w: W - 1.4, h: 0.5, align: "right", fontFace: F_HEAD, bold: true, fontSize: 15,
    color: dark ? "7FD6C9" : PETROL, isTextBox: true, rtlMode: true, margin: 0
  });
}
function pageBadge(slide, n, dark) {
  slide.addText(`${n} / 7`, {
    x: 0.5, y: H - 0.55, w: 1.2, h: 0.35, align: "left", fontFace: F_BODY, fontSize: 10.5,
    color: dark ? "8AA0C2" : TEXT_GRAY, isTextBox: true, margin: 0
  });
  slide.addText("أثر — مساعد ذكي للبحث عن المفقودين", {
    x: W - 5.5, y: H - 0.55, w: 5.0, h: 0.35, align: "right", fontFace: F_BODY, fontSize: 10.5,
    color: dark ? "8AA0C2" : TEXT_GRAY, isTextBox: true, rtlMode: true, margin: 0
  });
}
function conceptTag(slide, x, y, text) {
  pill(slide, x, y, 2.6, 0.4, text, "1A3A63", "DCE6F5", 10.5);
}

// ============================================================
// SLIDE 1 — المشكلة
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape("rect", { x: 0, y: 0, w: W, h: H, fill: { type: "none" } });
  // faint route illustration
  const routePts = "M1.0,1.0 C3,2 4.5,3 6,3.6 C7.5,4.2 9,4.2 10.2,3.6 C11.4,3 12,2.2 12.3,1.3";
  s.addShape("line", { x: 0, y: 0, w: 0.01, h: 0.01, line: { type: "none" } }); // no-op keep structure simple

  kicker(s, "المشكلة", true);
  s.addText("عندما تنقطع الأخبار في منتصف الرحلة…", {
    x: 0.9, y: 2.5, w: W - 1.8, h: 1.6, align: "center", fontFace: F_HEAD, bold: true, fontSize: 40,
    color: "FFFFFF", isTextBox: true, rtlMode: true, margin: 0
  });
  s.addText("لا معلومات منظّمة تعني وقتًا ثمينًا يضيع قبل أن يبدأ أي تحرك فعلي", {
    x: 1.4, y: 3.85, w: W - 2.8, h: 0.9, align: "center", fontFace: F_BODY, fontSize: 19,
    color: "B9C6DC", isTextBox: true, rtlMode: true, margin: 0
  });

  // three quiet stat-like chips
  const chips = [
    "مسافر في رحلة برية طويلة",
    "بلا اتصال بعد نقطة معيّنة",
    "متابع بلا معلومات كافية"
  ];
  const cw = 3.3, gap = 0.35;
  const totalW = cw * 3 + gap * 2;
  let cx = (W - totalW) / 2;
  chips.forEach(c => {
    s.addShape("roundRect", { x: cx, y: 5.1, w: cw, h: 0.85, rectRadius: 0.1, fill: { color: "132F52" }, line: { color: "24406B", width: 1 } });
    rtl(s, c, cx + 0.15, 5.1, cw - 0.3, 0.85, { align: "center", valign: "middle", fontSize: 13.5, color: "DCE6F5", bold: true });
    cx += cw + gap;
  });

  pageBadge(s, 1, true);

  s.addNotes(
    "تخيّلوا معي: مسافر خرج في رحلة برية طويلة، ثم انقطعت أخباره. الشخص الذي يفترض أن يتابعه غالبًا لا يملك معلومات منظمة عن وجهته أو مساره أو موعد اطمئنانه. وهذا يعني وقتًا ثمينًا يضيع قبل أن يبدأ أي تحرك فعلي نحو المساعدة.\n\n(الزمن المقترح للمشهد: نحو ٢٠ ثانية)"
  );
}

// ============================================================
// SLIDE 2 — فكرة الحل
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };
  kicker(s, "فكرة الحل");
  s.addText("أثر: تنظيم المعلومات قبل الحاجة إليها", {
    x: 0.7, y: 0.95, w: W - 1.4, h: 0.8, align: "right", fontFace: F_HEAD, bold: true, fontSize: 30,
    color: NAVY, isTextBox: true, rtlMode: true, margin: 0
  });
  rtl(s, "مساعد ذكي يرافق المسافر قبل الرحلة وأثناءها، ويساعد المتابع عند الحاجة", 0.7, 1.75, W - 1.4, 0.5, { fontSize: 15, color: TEXT_GRAY });

  const steps = [
    { n: "١", t: "تسجيل الرحلة", c: PETROL, bg: PETROL_PALE },
    { n: "٢", t: "حفظ المواقع", c: PETROL, bg: PETROL_PALE },
    { n: "٣", t: "تجاوز الموعد", c: PETROL, bg: PETROL_PALE },
    { n: "٤", t: "تنبيه فوري", c: ALERT, bg: ALERT_PALE },
    { n: "٥", t: "اقتراح مناطق البحث", c: PETROL, bg: PETROL_PALE },
  ];
  const stepW = 2.15, stepGap = 0.15;
  const totalW = steps.length * stepW + (steps.length - 1) * stepGap;
  let x0 = (W - totalW) / 2;
  const topY = 2.9;
  card(s, x0 - 0.3, topY - 0.3, totalW + 0.6, 3.15, CARD);
  steps.forEach((st, i) => {
    const x = x0 + totalW - stepW - i * (stepW + stepGap); // RTL order
    const ccx = x + stepW / 2;
    iconCircle(s, ccx, topY + 0.75, 0.95, st.bg);
    s.addText(st.n, { x: ccx - 0.475, y: topY + 0.75 - 0.475, w: 0.95, h: 0.95, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 26, color: st.c, isTextBox: true, margin: 0 });
    s.addText(st.t, { x: x + 0.05, y: topY + 1.4, w: stepW - 0.1, h: 0.5, align: "center", fontFace: F_HEAD, bold: true, fontSize: 14, color: TEXT_DARK, isTextBox: true, rtlMode: true, margin: 0 });
    if (i < steps.length - 1) {
      s.addText("‹", { x: x - 0.2, y: topY + 0.55, w: 0.2, h: 0.4, align: "center", fontFace: F_HEAD, bold: true, fontSize: 20, color: "9FB0CC", isTextBox: true, margin: 0 });
    }
  });

  rtl(s, "يستخدم الذكاء الاصطناعي عند الحاجة لاقتراح مناطق البحث وترتيب أولوياتها — وليس للتتبع المباشر بعد انقطاع الاتصال", x0 - 0.3, topY + 2.15, totalW + 0.6, 0.6, { align: "center", fontSize: 12.5, italic: true, color: TEXT_GRAY });

  pageBadge(s, 2, false);
  s.addNotes(
    "هنا يأتي دور أثر: مساعد ذكي يساعد المسافر على تسجيل خطة رحلته مسبقًا، ويحفظ آخر مواقعه أثناء توفر الاتصال. وإذا تجاوز موعد اطمئنانه، ينبّه الشخص الموثوق تلقائيًا، ويقترح عليه مناطق بحث محتملة مرتّبة حسب الأولوية باستخدام الذكاء الاصطناعي.\n\n(الزمن المقترح للمشهد: نحو ٢٥ ثانية)"
  );
}

// ============================================================
// SLIDE 3 — تسجيل الرحلة
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };
  kicker(s, "قبل الرحلة");
  s.addText("تسجيل بسيط وسريع لخطة الرحلة", {
    x: 0.7, y: 0.95, w: W - 1.4, h: 0.8, align: "right", fontFace: F_HEAD, bold: true, fontSize: 30,
    color: NAVY, isTextBox: true, rtlMode: true, margin: 0
  });

  // mockup card (traveler interface)
  const cx = W / 2, cardW = 6.4, cardH = 4.15, cardX = cx - cardW / 2, cardY = 1.95;
  card(s, cardX, cardY, cardW, cardH);
  s.addShape("roundRect", { x: cardX + 0.35, y: cardY + 0.3, w: cardW - 0.7, h: 0.55, rectRadius: 0.08, fill: { color: PETROL_PALE }, line: { type: "none" } });
  rtl(s, "واجهة المسافر — الرحلة جارية", cardX + 0.55, cardY + 0.3, cardW - 1.1, 0.55, { valign: "middle", fontSize: 14, bold: true, color: PETROL });

  const fields = [
    ["الوجهة", "واحة الشعيب — طريق ٤١٢ البري"],
    ["موعد الاطمئنان القادم", "اليوم — الساعة ٨:٠٠ مساءً"],
    ["الشخص الموثوق للمتابعة", "سالم العتيبي — أخ المسافر"],
    ["المركبة والركاب", "دفع رباعي أبيض — ٣ ركاب"],
  ];
  let fy = cardY + 1.05;
  fields.forEach(([label, val]) => {
    iconCircle(s, cardX + cardW - 0.65, fy + 0.35, 0.55, PETROL_PALE);
    rtl(s, label, cardX + 0.35, fy, cardW - 1.3, 0.35, { fontSize: 12, color: TEXT_GRAY });
    rtl(s, val, cardX + 0.35, fy + 0.33, cardW - 1.3, 0.4, { fontSize: 15.5, bold: true, color: TEXT_DARK });
    fy += 0.77;
  });

  conceptTag(s, cardX + cardW - 2.6, cardY - 0.55, "تصور للواجهة · بيانات تجريبية");

  pageBadge(s, 3, false);
  s.addNotes(
    "قبل الانطلاق، يسجّل المسافر رحلته في دقائق معدودة: الوجهة، موعد الاطمئنان المتوقع، بيانات المركبة والركاب، والشخص الموثوق الذي سيتابعه أثناء الرحلة. هذه هي الشاشة المتصوَّرة لواجهة المسافر.\n\n(الزمن المقترح للمشهد: نحو ٢٥ ثانية)"
  );
}

// ============================================================
// SLIDE 4 — التنبيه عند التأخر
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };
  kicker(s, "أثناء الرحلة");
  s.addText("عند تجاوز موعد الاطمئنان: تنبيه فوري", {
    x: 0.7, y: 0.95, w: W - 1.4, h: 0.8, align: "right", fontFace: F_HEAD, bold: true, fontSize: 30,
    color: NAVY, isTextBox: true, rtlMode: true, margin: 0
  });

  const cx = W / 2, cardW = 6.6, cardH = 4.15, cardX = cx - cardW / 2, cardY = 1.95;
  card(s, cardX, cardY, cardW, cardH);
  s.addShape("roundRect", { x: cardX + 0.35, y: cardY + 0.3, w: cardW - 0.7, h: 0.55, rectRadius: 0.08, fill: { color: ALERT_PALE }, line: { type: "none" } });
  rtl(s, "واجهة المتابعة — تجاوز موعد الاطمئنان", cardX + 0.55, cardY + 0.3, cardW - 1.1, 0.55, { valign: "middle", fontSize: 14, bold: true, color: ALERT });

  // notification bubble
  s.addShape("roundRect", { x: cardX + 0.35, y: cardY + 1.05, w: cardW - 0.7, h: 1.0, rectRadius: 0.1, fill: { color: ALERT_PALE }, line: { color: "F4C4B4", width: 1 } });
  iconCircle(s, cardX + cardW - 0.75, cardY + 1.55, 0.5, "FFFFFF");
  s.addText("!", { x: cardX + cardW - 1.0, y: cardY + 1.3, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 20, color: ALERT, isTextBox: true, margin: 0 });
  rtl(s, "تنبيه: سالم لم يؤكد سلامته بعد موعد اطمئنانه", cardX + 0.55, cardY + 1.18, cardW - 1.5, 0.35, { fontSize: 14.5, bold: true, color: TEXT_DARK });
  rtl(s, "آخر تحديث موقع: قبل ٣ ساعات و٤٠ دقيقة — بيانات تجريبية", cardX + 0.55, cardY + 1.55, cardW - 1.5, 0.35, { fontSize: 12, color: TEXT_GRAY });

  rtl(s, "يستمر التطبيق بإرسال آخر المواقع تلقائيًا أثناء توفر الاتصال، وعند تجاوز المهلة المحددة يصل التنبيه للشخص المسؤول فورًا — حتى إن كان هاتف المسافر خارج التغطية في تلك اللحظة.", cardX + 0.35, cardY + 2.3, cardW - 0.7, 1.6, { fontSize: 14.5, lineSpacingMultiple: 1.35 });

  conceptTag(s, cardX + cardW - 2.6, cardY - 0.55, "تصور للواجهة · بيانات تجريبية");

  pageBadge(s, 4, false);
  s.addNotes(
    "أثناء الرحلة، يرسل التطبيق آخر المواقع تلقائيًا كلما توفّر اتصال بالإنترنت. فإذا تجاوز المسافر موعد اطمئنانه والمهلة المحددة دون تأكيد سلامته، يصل تنبيه فوري إلى الشخص المسؤول عنه — حتى لو كان هاتف المسافر نفسه خارج التغطية في تلك اللحظة.\n\n(الزمن المقترح للمشهد: نحو ٢٥ ثانية)"
  );
}

// ============================================================
// SLIDE 5 — بطاقة المعلومات
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };
  kicker(s, "عند الحاجة للمساعدة");
  s.addText("بطاقة رحلة جاهزة للمشاركة فورًا", {
    x: 0.7, y: 0.95, w: W - 1.4, h: 0.8, align: "right", fontFace: F_HEAD, bold: true, fontSize: 30,
    color: NAVY, isTextBox: true, rtlMode: true, margin: 0
  });

  const cardW = 7.4, cardH = 4.15, cardX = W / 2 - cardW / 2, cardY = 1.95;
  card(s, cardX, cardY, cardW, cardH);
  rtl(s, "بطاقة رحلة — سالم العتيبي", cardX + 0.4, cardY + 0.3, cardW - 0.8, 0.45, { fontSize: 17, bold: true, color: NAVY });

  const rows = [
    ["الوجهة والمسار", "واحة الشعيب — طريق ٤١٢ البري"],
    ["آخر موقع مستلم", "على بعد ٣٨ كم من الوجهة — ٥:٢٠ مساءً"],
    ["المركبة والركاب", "دفع رباعي أبيض — ٣ ركاب"],
    ["جهة الاتصال", "سالم العتيبي — ٠٥xxxxxxxx"],
  ];
  let ry = cardY + 0.95;
  rows.forEach(([label, val], i) => {
    if (i % 2 === 1) s.addShape("rect", { x: cardX + 0.2, y: ry, w: cardW - 0.4, h: 0.62, fill: { color: "F7FAFC" }, line: { type: "none" } });
    rtl(s, label, cardX + 0.4, ry + 0.1, 2.6, 0.42, { fontSize: 12.5, color: TEXT_GRAY });
    rtl(s, val, cardX + 3.1, ry + 0.1, cardW - 3.5, 0.42, { fontSize: 14, bold: true, color: TEXT_DARK });
    ry += 0.62;
  });

  pill(s, cardX + cardW - 2.6, ry + 0.18, 2.2, 0.5, "جاهزة للمشاركة الآن", PETROL, "FFFFFF", 12.5);
  conceptTag(s, cardX, cardY - 0.55, "تصور للواجهة · بيانات تجريبية");

  pageBadge(s, 5, false);
  s.addNotes(
    "مع التنبيه، تظهر بطاقة رحلة واضحة تجمع كل المعلومات المهمة في مكان واحد: الوجهة، آخر موقع، المركبة، وجهة الاتصال — جاهزة للمشاركة الفورية مع أي جهة تساعد في البحث، دون الحاجة لتجميع المعلومات من جديد تحت الضغط.\n\n(الزمن المقترح للمشهد: نحو ٢٠ ثانية)"
  );
}

// ============================================================
// SLIDE 6 — محاكاة مناطق البحث وتحديثها
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };
  kicker(s, "الذكاء الاصطناعي في العمل");
  s.addText("مناطق بحث مقترحة تتحدّث مع كل معلومة جديدة", {
    x: 0.7, y: 0.95, w: W - 1.4, h: 0.8, align: "right", fontFace: F_HEAD, bold: true, fontSize: 27,
    color: NAVY, isTextBox: true, rtlMode: true, margin: 0
  });

  const panelW = 5.75, panelH = 4.15, gap = 0.35, topY = 2.0;
  const rightX = W / 2 + gap / 2; // "before" on the right (read first, RTL)
  const leftX = W / 2 - gap / 2 - panelW;

  function zonesPanel(x, label, order, badgeColor) {
    card(s, x, topY, panelW, panelH, NAVY2);
    rtl(s, label, x + 0.3, topY + 0.25, panelW - 0.6, 0.4, { fontSize: 14, bold: true, color: "FFFFFF" });
    const cx = x + panelW / 2, cy = topY + 2.45;
    // simple 3 zone blobs
    const positions = [
      { dx: 0.55, dy: -0.35, r: 0.55 },
      { dx: -0.6, dy: -0.1, r: 0.5 },
      { dx: -0.05, dy: 0.55, r: 0.42 },
    ];
    order.forEach((rank, i) => {
      const p = positions[i];
      const zx = cx + p.dx, zy = cy + p.dy;
      const colors = [PETROL, PETROL_L, "7FD6C9"];
      s.addShape("ellipse", { x: zx - p.r, y: zy - p.r, w: p.r * 2, h: p.r * 2, fill: { color: colors[rank - 1], transparency: 55 }, line: { color: colors[rank - 1], width: 1.5, dashType: "dash" } });
      iconCircle(s, zx, zy, 0.42, colors[rank - 1]);
      s.addText(String(rank), { x: zx - 0.21, y: zy - 0.21, w: 0.42, h: 0.42, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 15, color: "FFFFFF", isTextBox: true, margin: 0 });
    });
    // pin
    iconCircle(s, cx, topY + 0.95, 0.16, "FFFFFF");
    rtl(s, "آخر موقع معروف", x + 0.3, topY + 1.15, panelW - 0.6, 0.3, { align: "center", fontSize: 10.5, color: "B9C6DC" });
  }

  zonesPanel(rightX, "قبل وصول معلومة جديدة", [1, 2, 3]);
  zonesPanel(leftX, "بعد وصول معلومة جديدة (محاكاة)", [2, 1, 3]);

  // update arrow/badge between panels
  iconCircle(s, W / 2, topY + panelH / 2, 0.55, ALERT);
  s.addText("↻", { x: W / 2 - 0.275, y: topY + panelH / 2 - 0.3, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 22, color: "FFFFFF", isTextBox: true, margin: 0 });

  rtl(s, "محاكاة معلنة على بيانات تجريبية — المواقع المقترحة تقديرات استرشادية وليست تتبعًا مباشرًا", 0.7, topY + panelH + 0.25, W - 1.4, 0.4, { align: "center", fontSize: 12, italic: true, color: TEXT_GRAY });

  pageBadge(s, 6, false);
  s.addNotes(
    "يستخدم أثر الذكاء الاصطناعي ليقترح مناطق بحث محتملة بناءً على آخر موقع معروف، وخطة الرحلة، والوقت المنقضي، وطبيعة الطرق والتضاريس. وعند وصول أي معلومة جديدة، تتحدّث هذه الاقتراحات وتُعاد ترتيب أولوياتها فورًا — كما ترون هنا في هذه المحاكاة المعلنة على بيانات تجريبية بالكامل.\n\n(الزمن المقترح للمشهد: نحو ٣٠ ثانية)"
  );
}

// ============================================================
// SLIDE 7 — القيمة المتوقعة وخطة الاختبار
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "القيمة وخطة الاختبار", true);
  s.addText("ماذا نريد أن نثبت، وكيف سنختبره؟", {
    x: 0.7, y: 0.9, w: W - 1.4, h: 0.7, align: "right", fontFace: F_HEAD, bold: true, fontSize: 28,
    color: "FFFFFF", isTextBox: true, rtlMode: true, margin: 0
  });

  const colW = (W - 1.4 - 0.4) / 2, gap = 0.4;
  const rightX = W - 0.7 - colW, leftX = 0.7;
  const topY = 1.85, colH = 3.9;

  s.addShape("roundRect", { x: rightX, y: topY, w: colW, h: colH, rectRadius: 0.1, fill: { color: "132F52" }, line: { color: "24406B", width: 1 } });
  rtl(s, "القيمة التي نريد اختبارها", rightX + 0.35, topY + 0.3, colW - 0.7, 0.45, { fontSize: 17, bold: true, color: "7FD6C9" });
  const vals = ["تقليل الوقت اللازم لتجهيز معلومات المسافر", "المساعدة في ترتيب أولويات مناطق البحث", "بطاقة رحلة واضحة وقابلة للمشاركة فورًا"];
  let vy = topY + 1.0;
  vals.forEach(v => {
    iconCircle(s, rightX + colW - 0.45, vy + 0.14, 0.14, PETROL_L);
    rtl(s, v, rightX + 0.35, vy, colW - 0.9, 0.55, { fontSize: 14.5, color: "E4EAF5", lineSpacingMultiple: 1.2 });
    vy += 0.75;
  });
  rtl(s, "المشروع في مرحلة التصميم؛ لا نتائج فعلية بعد.", rightX + 0.35, topY + colH - 0.55, colW - 0.7, 0.4, { fontSize: 11.5, italic: true, color: "8AA0C2" });

  s.addShape("roundRect", { x: leftX, y: topY, w: colW, h: colH, rectRadius: 0.1, fill: { color: "132F52" }, line: { color: "24406B", width: 1 } });
  rtl(s, "خطة التحقق المقترحة", leftX + 0.35, topY + 0.3, colW - 0.7, 0.45, { fontSize: 17, bold: true, color: "7FD6C9" });
  const plan = ["رحلات تجريبية معروفة المسار مسبقًا", "إخفاء المواقع بعد نقطة انقطاع افتراضية", "مقارنة مناطق البحث بالموقع الحقيقي"];
  let py = topY + 1.0;
  plan.forEach((p, i) => {
    s.addText(String(i + 1), { x: leftX + colW - 0.75, y: py, w: 0.4, h: 0.4, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 13, color: "FFFFFF", fill: { color: PETROL }, isTextBox: true, margin: 0 });
    rtl(s, p, leftX + 0.35, py, colW - 1.25, 0.55, { fontSize: 14.5, color: "E4EAF5", lineSpacingMultiple: 1.2 });
    py += 0.75;
  });
  rtl(s, "المقاييس: احتواء المنطقة للموقع الحقيقي، مساحتها، ووقت تجهيز البطاقة.", leftX + 0.35, topY + colH - 0.75, colW - 0.7, 0.6, { fontSize: 11.5, italic: true, color: "8AA0C2" });

  s.addText("أثر — معلومات أوضح، وبداية بحث أكثر تنظيمًا", {
    x: 0.7, y: H - 1.1, w: W - 1.4, h: 0.4, align: "center", fontFace: F_HEAD, bold: true, fontSize: 15,
    color: PETROL_L, isTextBox: true, rtlMode: true, margin: 0
  });
  pageBadge(s, 7, true);

  s.addNotes(
    "القيمة التي نريد اختبارها هي: تقليل الوقت اللازم لتجهيز معلومات المسافر، والمساعدة في ترتيب أولويات البحث. المشروع اليوم في مرحلة التصميم، ولم نُجرِ اختبارات فعلية بعد. خطتنا للتحقق: استخدام رحلات تجريبية معروفة المسار، وإخفاء المواقع بعد نقطة انقطاع افتراضية، ثم مقارنة مناطق البحث المقترحة بالموقع الحقيقي. هذا هو أثر: معلومات أوضح، وبداية بحث أكثر تنظيمًا. شكرًا لكم.\n\n(الزمن المقترح للمشهد: نحو ٣٥ ثانية)"
  );
}

pres.writeFile({ fileName: path.join(ROOT, "03-video/athar-presentation.pptx") }).then(() => {
  console.log("deck done");
});

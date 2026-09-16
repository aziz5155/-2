const path = require("path");
const ROOT = path.join(__dirname, "..");
const pptxgen = require(path.join(ROOT, "node_modules/pptxgenjs"));

// ---------- palette & fonts ----------
const NAVY = "0B1F3A";
const NAVY2 = "132F52";
const PETROL = "12746F";
const PETROL_L = "22A79A";
const PETROL_PALE = "E9F7F5";
const ALERT = "E8613C";
const ALERT_PALE = "FDECE8";
const BG = "F4F7FB";
const CARD = "FFFFFF";
const TEXT_DARK = "0B1F3A";
const TEXT_GRAY = "5A6B87";
const LINE = "E3E9F2";

const F_HEAD = "Calibri";
const F_BODY = "Arial";

const PW = 23.39, PH = 40.5; // poster width fixed (A1), height computed generously then trimmed via content; we lay out with a cursor

const pres = new pptxgen();
pres.defineLayout({ name: "POSTER", width: PW, height: PH });
pres.layout = "POSTER";

const slide = pres.addSlide();
slide.background = { color: BG };

const MX = 0.85; // side margin
const CW = PW - MX * 2; // content width

function rtlText(x, y, w, h, text, opts) {
  return slide.addText(text, Object.assign({
    x, y, w, h, isTextBox: true, align: "right", fontFace: F_BODY,
    color: TEXT_DARK, valign: "top", rtlMode: true, margin: 0
  }, opts));
}

function pill(x, y, w, h, text, bg, color) {
  slide.addShape("roundRect", { x, y, w, h, rectRadius: h / 2, fill: { color: bg }, line: { type: "none" } });
  slide.addText(text, { x, y, w, h, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 13, color, isTextBox: true, rtlMode: true, margin: 0 });
}

function iconCircle(cx, cy, d, bg) {
  slide.addShape("ellipse", { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: bg }, line: { type: "none" } });
}

function sectionTitle(x, y, w, text, opts) {
  slide.addText(text, Object.assign({
    x, y, w, h: 0.6, align: "right", fontFace: F_HEAD, bold: true, fontSize: 24,
    color: NAVY, isTextBox: true, rtlMode: true, margin: 0
  }, opts));
}

// ================= HEADER =================
let cursor = 0;
const HEADER_H = 3.55;
slide.addShape("rect", { x: 0, y: 0, w: PW, h: HEADER_H, fill: { color: NAVY }, line: { type: "none" } });

// logo mark (top-right, reading start for RTL)
iconCircle(PW - MX - 0.55, 0.75, 1.1, PETROL);
slide.addText("أثر", { x: PW - MX - 6.5, y: 0.28, w: 5.3, h: 0.8, align: "right", fontFace: F_HEAD, bold: true, fontSize: 44, color: "FFFFFF", isTextBox: true, rtlMode: true, margin: 0 });
slide.addText("مساعد ذكي للبحث عن المفقودين", { x: PW - MX - 6.5, y: 1.05, w: 5.3, h: 0.5, align: "right", fontFace: F_BODY, fontSize: 16, color: "B9C6DC", isTextBox: true, rtlMode: true, margin: 0 });

slide.addText("معلومات أوضح، وبداية بحث أكثر تنظيمًا", {
  x: MX, y: 1.75, w: CW, h: 0.75, align: "center", fontFace: F_HEAD, bold: true, fontSize: 30, color: "FFFFFF",
  isTextBox: true, rtlMode: true, margin: 0
});

pill(PW - MX - 3.3, 2.75, 3.3, 0.55, "مسابقة SAIF — ملصق علمي", "1A3A63", "DCE6F5");
pill(MX, 2.75, 5.6, 0.55, "المشروع في مرحلة التصميم — بيانات ومحاكاة تجريبية بالكامل", "1A3A63", "DCE6F5");

cursor = HEADER_H + 0.55;

// ================= ROW: PROBLEM + GOAL =================
const gap = 0.55;
const col2w = (CW - gap) / 2;
const rowTop1 = cursor;

function card(x, y, w, h, fillColor = CARD) {
  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: 0.14, fill: { color: fillColor }, line: { color: LINE, width: 1 },
    shadow: { type: "outer", color: "0B1F3A", opacity: 0.12, blur: 10, offset: 3, angle: 90 }
  });
}

const row1H = 6.6;
// Right card: problem
{
  const x = MX + col2w + gap, y = rowTop1, w = col2w, h = row1H;
  card(x, y, w, h);
  iconCircle(x + w - 0.65, y + 0.6, 0.7, ALERT_PALE);
  slide.addText("!", { x: x + w - 0.65 - 0.35, y: y + 0.6 - 0.35, w: 0.7, h: 0.7, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 26, color: ALERT, isTextBox: true, margin: 0 });
  sectionTitle(x + 0.4, y + 0.3, w - 1.4, "المشكلة والفئة المستفيدة");
  rtlText(x + 0.4, y + 1.15, w - 0.8, 1.9,
    "عند تأخر مسافر في رحلة برية عن موعده المتوقع، غالبًا لا تكون لدى من يتابعه معلومات كافية ومنظمة عن وجهته ومساره وموعد اطمئنانه — مما يؤخر بدء أي تحرك ويبعثر الجهد في البحث دون أولويات واضحة.",
    { fontSize: 15.5, lineSpacingMultiple: 1.28 });

  sectionTitle(x + 0.4, y + 3.25, w - 0.8, "الفئة المستفيدة", { fontSize: 17 });
  const bullets = [
    "المسافرون وهواة البر والرحلات البرية الطويلة",
    "الأشخاص الموثوقون المكلَّفون بمتابعة الرحلة",
    "فرق ومنسقو البحث عند الحاجة الفعلية"
  ];
  let by = y + 3.9;
  bullets.forEach(b => {
    iconCircle(x + w - 0.5, by + 0.14, 0.14, PETROL);
    rtlText(x + 0.4, by, w - 1.0, 0.5, b, { fontSize: 14.5 });
    by += 0.62;
  });
}

// Left card: goal
{
  const x = MX, y = rowTop1, w = col2w, h = row1H;
  card(x, y, w, h);
  iconCircle(x + w - 0.65, y + 0.6, 0.7, PETROL_PALE);
  slide.addText("◎", { x: x + w - 0.65 - 0.35, y: y + 0.6 - 0.38, w: 0.7, h: 0.7, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 22, color: PETROL, isTextBox: true, margin: 0 });
  sectionTitle(x + 0.4, y + 0.3, w - 1.4, "هدف المشروع");
  rtlText(x + 0.4, y + 1.15, w - 0.8, 1.9,
    "تجهيز معلومات المسافر وخطة رحلته بشكل منظّم وقابل للمشاركة قبل حدوث أي طارئ، ثم استخدام الذكاء الاصطناعي عند الحاجة لاقتراح مناطق بحث محتملة وترتيبها حسب الأولوية — لتقليل الوقت الضائع في بداية الاستجابة.",
    { fontSize: 15.5, lineSpacingMultiple: 1.28 });

  sectionTitle(x + 0.4, y + 3.25, w - 0.8, "القيمة التي نريد اختبارها", { fontSize: 17 });
  const bullets2 = [
    "تقليل الوقت اللازم لتجهيز معلومات المسافر",
    "المساعدة في ترتيب أولويات مناطق البحث",
    "بطاقة رحلة واضحة وقابلة للمشاركة فورًا"
  ];
  let by = y + 3.9;
  bullets2.forEach(b => {
    iconCircle(x + w - 0.5, by + 0.14, 0.14, PETROL);
    rtlText(x + 0.4, by, w - 1.0, 0.5, b, { fontSize: 14.5 });
    by += 0.62;
  });
}

cursor = rowTop1 + row1H + 0.55;

// ================= ROW: HOW IT WORKS (5 steps) =================
const howY = cursor;
sectionTitle(MX, howY, CW, "طريقة العمل: من تسجيل الرحلة إلى اقتراح مناطق البحث", { fontSize: 24, align: "center" });
const stepsTop = howY + 0.85;
const stepH = 2.55;
card(MX, stepsTop, CW, stepH, CARD);

const steps = [
  { n: "١", t: "تسجيل الرحلة", d: "الوجهة، الموعد، المركبة والركاب، والشخص الموثوق" },
  { n: "٢", t: "حفظ المواقع", d: "إرسال آخر المواقع تلقائيًا أثناء توفر الاتصال" },
  { n: "٣", t: "تجاوز الموعد", d: "مراقبة موعد الاطمئنان والمهلة المحددة" },
  { n: "٤", t: "تنبيه فوري", d: "إشعار الشخص المسؤول ببطاقة رحلة جاهزة" },
  { n: "٥", t: "اقتراح مناطق البحث", d: "ترتيب مناطق محتملة وتحديثها بالمعلومات الجديدة" }
];
const stepW = (CW - 0.6) / steps.length;
// RTL order: step 1 rightmost
steps.forEach((s, i) => {
  const x = MX + CW - stepW - i * (stepW + 0.15);
  const cx = x + stepW / 2;
  iconCircle(cx, stepsTop + 0.75, 0.95, i === 3 ? ALERT_PALE : PETROL_PALE);
  slide.addText(s.n, { x: cx - 0.475, y: stepsTop + 0.75 - 0.475, w: 0.95, h: 0.95, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 26, color: i === 3 ? ALERT : PETROL, isTextBox: true, margin: 0 });
  slide.addText(s.t, { x: x + 0.05, y: stepsTop + 1.35, w: stepW - 0.1, h: 0.45, align: "center", fontFace: F_HEAD, bold: true, fontSize: 15.5, color: TEXT_DARK, isTextBox: true, rtlMode: true, margin: 0 });
  slide.addText(s.d, { x: x + 0.1, y: stepsTop + 1.78, w: stepW - 0.2, h: 0.7, align: "center", fontFace: F_BODY, fontSize: 11.5, color: TEXT_GRAY, isTextBox: true, rtlMode: true, margin: 0, lineSpacingMultiple: 1.1 });
  if (i < steps.length - 1) {
    slide.addText("‹", { x: x - 0.2, y: stepsTop + 0.55, w: 0.2, h: 0.4, align: "center", fontFace: F_HEAD, bold: true, fontSize: 20, color: "9FB0CC", isTextBox: true, margin: 0 });
  }
});

cursor = stepsTop + stepH + 0.55;

// ================= ROW: INTERFACE MOCKUP + MAP =================
const visY = cursor;
sectionTitle(MX, visY, CW, "تصور واجهات المشروع وخريطة توضيحية (بيانات تجريبية)", { fontSize: 24, align: "center" });
const imgTop = visY + 0.85;
const imgW = CW;
const imgH = imgW * (1080 / 1920);
slide.addImage({ path: path.join(ROOT, "01-project-image/project-image.png"), x: MX, y: imgTop, w: imgW, h: imgH });
slide.addShape("roundRect", { x: MX, y: imgTop, w: imgW, h: imgH, rectRadius: 0.12, fill: { type: "none" }, line: { color: LINE, width: 1.5 } });

cursor = imgTop + imgH + 0.55;

// ================= ROW: VALUE + VERIFICATION PLAN =================
const rowTop3 = cursor;
const row3H = 6.9;
{
  const x = MX + col2w + gap, y = rowTop3, w = col2w, h = row3H;
  card(x, y, w, h);
  sectionTitle(x + 0.4, y + 0.3, w - 0.8, "القيمة المقترحة");
  rtlText(x + 0.4, y + 1.05, w - 0.8, 2.0,
    "استخدام خطة المسافر ومعلوماته المسجَّلة مسبقًا (الوجهة، المسار، آخر موقع، الوقت المنقضي، الطرق والتضاريس) لتجهيز بطاقة بحث جاهزة فورًا، وترتيب الاحتمالات بدل البدء من الصفر عند كل بلاغ.",
    { fontSize: 15, lineSpacingMultiple: 1.28 });

  const chips = ["أسرع في تجهيز المعلومات", "ترتيب أولويات لا تخمين عشوائي", "يتحدّث مع كل معلومة جديدة"];
  let cy = y + 3.05;
  chips.forEach(c => {
    slide.addShape("roundRect", { x: x + 0.4, y: cy, w: w - 0.8, h: 0.62, rectRadius: 0.1, fill: { color: PETROL_PALE }, line: { type: "none" } });
    rtlText(x + 0.6, cy, w - 1.2, 0.62, c, { fontSize: 14, valign: "middle", color: PETROL, bold: true });
    cy += 0.78;
  });

  rtlText(x + 0.4, y + h - 1.05, w - 0.8, 0.9,
    "ملاحظة: المواقع المقترحة تقديرات استرشادية وليست تتبعًا مباشرًا بعد انقطاع الاتصال.",
    { fontSize: 12, italic: true, color: TEXT_GRAY, lineSpacingMultiple: 1.2 });
}
{
  const x = MX, y = rowTop3, w = col2w, h = row3H;
  card(x, y, w, h);
  sectionTitle(x + 0.4, y + 0.3, w - 0.8, "خطة التحقق والنتائج المستهدفة");
  rtlText(x + 0.4, y + 1.05, w - 0.8, 1.15,
    "لم تُجرَ اختبارات فعلية بعد. خطة التحقق المقترحة:",
    { fontSize: 14.5, bold: true, color: NAVY });

  const plan = [
    "استخدام رحلات تجريبية معروفة المسار مسبقًا",
    "إخفاء المواقع بعد نقطة انقطاع افتراضية محدَّدة",
    "مقارنة مناطق البحث المقترحة بالموقع الحقيقي"
  ];
  let py = y + 1.65;
  plan.forEach((p, i) => {
    slide.addText(String(i + 1), { x: x + w - 0.75, y: py, w: 0.4, h: 0.4, align: "center", valign: "middle", fontFace: F_HEAD, bold: true, fontSize: 13, color: "FFFFFF", fill: { color: PETROL }, isTextBox: true, margin: 0 });
    rtlText(x + 0.4, py, w - 1.25, 0.55, p, { fontSize: 13.5 });
    py += 0.62;
  });

  sectionTitle(x + 0.4, py + 0.15, w - 0.8, "مقاييس النجاح المستهدفة", { fontSize: 15.5 });
  const metrics = [
    "احتواء المنطقة المقترحة للموقع الحقيقي",
    "مساحة منطقة البحث المقترحة",
    "الوقت اللازم لتجهيز بطاقة المعلومات"
  ];
  let my = py + 0.65;
  metrics.forEach(m => {
    iconCircle(x + w - 0.5, my + 0.13, 0.13, PETROL_L);
    rtlText(x + 0.4, my, w - 1.0, 0.5, m, { fontSize: 13 });
    my += 0.5;
  });

  rtlText(x + 0.4, y + h - 0.75, w - 0.8, 0.6,
    "لا توجد شراكة قائمة مع جهة إنقاذ أو جامعة حتى الآن.",
    { fontSize: 11.5, italic: true, color: TEXT_GRAY });
}

cursor = rowTop3 + row3H + 0.55;

// ================= SOURCES =================
const srcY = cursor;
sectionTitle(MX, srcY, CW, "مصادر موثوقة", { fontSize: 22, align: "center" });
const srcTop = srcY + 0.7;
const srcH = 2.5;
card(MX, srcTop, CW, srcH);

const sources = [
  ["Koester, R. — Lost Person Behavior، دراسة سلوك المفقودين المرجعية", "dbs-sar.com/LostPersonBehavior.htm"],
  ["dbS Productions — قاعدة بيانات ISRID الدولية لحوادث البحث والإنقاذ", "dbs-sar.com/SAR_Research/ISRID.htm"],
  ["IMO/ICAO — دليل IAMSAR الدولي للبحث والإنقاذ الجوي والبحري", "imo.org/en/ourwork/safety/pages/iamsarmanual.aspx"],
  ["SARBayes — نماذج بايزية لاحتمالية مناطق البحث (WiSAR)", "sarbayes.org"],
  ["National Park Service — دليل إعداد خطة الرحلة (Trip Plan) قبل السفر", "nps.gov/articles/gtgtripplan.htm"],
  ["الهيئة العامة للهلال الأحمر السعودي — خدمات الطوارئ والإنقاذ", "srca.org.sa"]
];
const src2w = (CW - 0.8) / 2;
sources.forEach((s, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = MX + 0.4 + col * (src2w + 0.4);
  const y = srcTop + 0.25 + row * 0.72;
  iconCircle(x + src2w - 0.14, y + 0.1, 0.12, PETROL);
  rtlText(x, y, src2w - 0.3, 0.32, s[0], { fontSize: 12.5, bold: true, color: TEXT_DARK });
  rtlText(x, y + 0.33, src2w - 0.3, 0.28, s[1], { fontSize: 11, color: PETROL, align: "right" });
});

cursor = srcTop + srcH + 0.5;

// ================= FOOTER =================
const footY = cursor;
slide.addShape("rect", { x: 0, y: footY, w: PW, h: 0.05, fill: { color: LINE }, line: { type: "none" } });
rtlText(MX, footY + 0.2, CW - 4, 0.5, "أثر — مساعد ذكي للبحث عن المفقودين  ·  مسابقة SAIF  ·  تصميم تجريبي، لا يمثل نتائج فعلية", { fontSize: 12, color: TEXT_GRAY, align: "right" });

cursor = footY + 0.85;

// finalize actual poster height
const FINAL_H = cursor;
pres.defineLayout({ name: "POSTER_FINAL", width: PW, height: FINAL_H });
pres.layout = "POSTER_FINAL";

console.log("Computed poster height (in):", FINAL_H);

pres.writeFile({ fileName: path.join(ROOT, "02-poster/athar-poster.pptx") }).then(() => {
  console.log("done");
});

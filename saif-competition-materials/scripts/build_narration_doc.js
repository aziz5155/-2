const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, PageBreak
} = require("docx");

const NAVY = "0B1F3A";
const PETROL = "12746F";
const ALERT = "E8613C";
const GRAY = "5A6B87";

function P(text, opts = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.RIGHT,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    heading: opts.heading,
    children: [new TextRun({
      text, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22,
      color: opts.color ?? "1A1A1A", rightToLeft: true, font: "Arial"
    })]
  });
}

function H1(text) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { after: 200, before: 300 },
    border: { bottom: { color: PETROL, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY, rightToLeft: true, font: "Arial" })]
  });
}
function H2(text, color = PETROL) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { after: 140, before: 260 },
    children: [new TextRun({ text, bold: true, size: 26, color, rightToLeft: true, font: "Arial" })]
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { after: 90 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size: opts.size ?? 22, color: opts.color ?? "1A1A1A", rightToLeft: true, font: "Arial", bold: opts.bold })]
  });
}

function sceneCell(text, opts = {}) {
  return new TableCell({
    width: opts.width,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade } : undefined,
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    children: (Array.isArray(text) ? text : [text]).map(t =>
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: t, bold: opts.bold, size: opts.size ?? 20, color: opts.color ?? "1A1A1A", rightToLeft: true, font: "Arial" })]
      })
    )
  });
}

const scenes = [
  {
    n: "١", title: "المشكلة", time: "٠:٠٠ – ٠:٢٠ (نحو ٢٠ ثانية)",
    onscreen: "عندما تنقطع الأخبار في منتصف الرحلة… / لا معلومات منظّمة = وقت ضائع في البحث",
    narration: "تخيّلوا معي: مسافر خرج في رحلة برية طويلة، ثم انقطعت أخباره. الشخص الذي يفترض أن يتابعه غالبًا لا يملك معلومات منظمة عن وجهته أو مساره أو موعد اطمئنانه. وهذا يعني وقتًا ثمينًا يضيع قبل أن يبدأ أي تحرك فعلي نحو المساعدة."
  },
  {
    n: "٢", title: "فكرة الحل", time: "٠:٢٠ – ٠:٤٥ (نحو ٢٥ ثانية)",
    onscreen: "أثر: تنظيم المعلومات قبل الحاجة إليها — تسجيل الرحلة ← حفظ المواقع ← تجاوز الموعد ← تنبيه فوري ← اقتراح مناطق البحث",
    narration: "هنا يأتي دور أثر: مساعد ذكي يساعد المسافر على تسجيل خطة رحلته مسبقًا، ويحفظ آخر مواقعه أثناء توفر الاتصال. وإذا تجاوز موعد اطمئنانه، ينبّه الشخص الموثوق تلقائيًا، ويقترح عليه مناطق بحث محتملة مرتّبة حسب الأولوية باستخدام الذكاء الاصطناعي."
  },
  {
    n: "٣", title: "تسجيل الرحلة", time: "٠:٤٥ – ١:١٠ (نحو ٢٥ ثانية)",
    onscreen: "واجهة المسافر (تصور): الوجهة، موعد الاطمئنان، الشخص الموثوق، المركبة والركاب",
    narration: "قبل الانطلاق، يسجّل المسافر رحلته في دقائق معدودة: الوجهة، موعد الاطمئنان المتوقع، بيانات المركبة والركاب، والشخص الموثوق الذي سيتابعه أثناء الرحلة. هذه هي الشاشة المتصوَّرة لواجهة المسافر."
  },
  {
    n: "٤", title: "التنبيه عند التأخر", time: "١:١٠ – ١:٣٥ (نحو ٢٥ ثانية)",
    onscreen: "واجهة المتابعة (تصور): تجاوز موعد الاطمئنان — تنبيه فوري للشخص المسؤول",
    narration: "أثناء الرحلة، يرسل التطبيق آخر المواقع تلقائيًا كلما توفّر اتصال بالإنترنت. فإذا تجاوز المسافر موعد اطمئنانه والمهلة المحددة دون تأكيد سلامته، يصل تنبيه فوري إلى الشخص المسؤول عنه — حتى لو كان هاتف المسافر نفسه خارج التغطية في تلك اللحظة."
  },
  {
    n: "٥", title: "بطاقة المعلومات", time: "١:٣٥ – ١:٥٥ (نحو ٢٠ ثانية)",
    onscreen: "بطاقة رحلة (تصور): الوجهة، آخر موقع، المركبة، جهة الاتصال — جاهزة للمشاركة",
    narration: "مع التنبيه، تظهر بطاقة رحلة واضحة تجمع كل المعلومات المهمة في مكان واحد — جاهزة للمشاركة الفورية مع أي جهة تساعد في البحث، دون الحاجة لتجميع المعلومات من جديد تحت الضغط."
  },
  {
    n: "٦", title: "محاكاة مناطق البحث وتحديثها", time: "١:٥٥ – ٢:٢٥ (نحو ٣٠ ثانية)",
    onscreen: "خريطتان: قبل معلومة جديدة / بعد معلومة جديدة (محاكاة معلنة، بيانات تجريبية)",
    narration: "يستخدم أثر الذكاء الاصطناعي ليقترح مناطق بحث محتملة بناءً على آخر موقع معروف، وخطة الرحلة، والوقت المنقضي، وطبيعة الطرق والتضاريس. وعند وصول أي معلومة جديدة، تتحدّث هذه الاقتراحات وتُعاد ترتيب أولوياتها فورًا — كما ترون هنا في هذه المحاكاة المعلنة على بيانات تجريبية بالكامل."
  },
  {
    n: "٧", title: "القيمة المتوقعة وخطة الاختبار", time: "٢:٢٥ – ٣:٠٠ (نحو ٣٥ ثانية)",
    onscreen: "القيمة: تقليل وقت التجهيز + ترتيب الأولويات / خطة التحقق: رحلات تجريبية، إخفاء المواقع، مقارنة بالموقع الحقيقي",
    narration: "القيمة التي نريد اختبارها هي: تقليل الوقت اللازم لتجهيز معلومات المسافر، والمساعدة في ترتيب أولويات البحث. المشروع اليوم في مرحلة التصميم، ولم نُجرِ اختبارات فعلية بعد. خطتنا للتحقق: استخدام رحلات تجريبية معروفة المسار، وإخفاء المواقع بعد نقطة انقطاع افتراضية، ثم مقارنة مناطق البحث المقترحة بالموقع الحقيقي. هذا هو أثر: معلومات أوضح، وبداية بحث أكثر تنظيمًا. شكرًا لكم."
  }
];

const sceneTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        sceneCell("النص المعروض على الشاشة", { width: { size: 32, type: WidthType.PERCENTAGE }, shade: "132F52", color: "FFFFFF", bold: true, size: 20 }),
        sceneCell("نص التعليق الصوتي (الإلقاء)", { width: { size: 44, type: WidthType.PERCENTAGE }, shade: "132F52", color: "FFFFFF", bold: true, size: 20 }),
        sceneCell("الزمن", { width: { size: 12, type: WidthType.PERCENTAGE }, shade: "132F52", color: "FFFFFF", bold: true, size: 20 }),
        sceneCell("#", { width: { size: 12, type: WidthType.PERCENTAGE }, shade: "132F52", color: "FFFFFF", bold: true, size: 20 }),
      ]
    }),
    ...scenes.map((sc, i) => new TableRow({
      children: [
        sceneCell(sc.onscreen, { width: { size: 32, type: WidthType.PERCENTAGE }, shade: i % 2 ? "F4F7FB" : "FFFFFF", size: 18, color: "5A6B87" }),
        sceneCell(sc.narration, { width: { size: 44, type: WidthType.PERCENTAGE }, shade: i % 2 ? "F4F7FB" : "FFFFFF", size: 20 }),
        sceneCell(sc.time, { width: { size: 12, type: WidthType.PERCENTAGE }, shade: i % 2 ? "F4F7FB" : "FFFFFF", size: 17, color: "5A6B87" }),
        sceneCell(`المشهد ${sc.n}\n${sc.title}`.split("\n"), { width: { size: 12, type: WidthType.PERCENTAGE }, shade: i % 2 ? "F4F7FB" : "FFFFFF", bold: true, size: 18, color: NAVY }),
      ]
    }))
  ]
});

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "أثر — مساعد ذكي للبحث عن المفقودين", bold: true, size: 40, color: NAVY, rightToLeft: true, font: "Arial" })]
      }),
      new Paragraph({
        bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 300 },
        children: [new TextRun({ text: "نص التعليق الصوتي للعرض المرئي — مسابقة SAIF", size: 24, color: PETROL, rightToLeft: true, font: "Arial" })]
      }),
      P("هذا الملف يحتوي على نص التعليق الصوتي الكامل لعرض PowerPoint المكوَّن من ٧ شرائح (athar-presentation.pptx)، مرتّبًا حسب المشاهد مع الزمن المقترح لكل مشهد. نفس هذا النص موجود أيضًا داخل ملاحظات كل شريحة (Speaker Notes) في ملف العرض. المدة الإجمالية المستهدفة للسرد نحو ٣ دقائق، على أن لا يتجاوز الفيديو النهائي بعد التسجيل ٥ دقائق و١٥٠ ميجابايت.", { color: GRAY, size: 20 }),

      H1("نص التعليق الصوتي حسب المشاهد"),
      sceneTable,

      new Paragraph({ children: [new PageBreak()] }),

      H1("طريقة تسجيل الشرح بصوتك من الآيفون"),
      P("الهدف: تسجيل شاشة عرض PowerPoint وأنت تشرح بصوتك مباشرة فوق الشرائح، لإنتاج فيديو واحد جاهز للتسليم دون الحاجة لبرامج مونتاج إضافية.", { color: GRAY }),

      H2("قبل التسجيل"),
      bullet("افتح ملف athar-presentation.pptx على آيفونك عبر تطبيق PowerPoint (من App Store) — انقله بالبريد أو AirDrop أو iCloud/OneDrive."),
      bullet("راجع نص الإلقاء في الجدول أعلاه لكل شريحة، أو افتح ملاحظات الشريحة داخل PowerPoint."),
      bullet("فعّل وضع «عدم الإزعاج»، واختر مكانًا هادئًا، ويُفضّل استخدام سماعة بميكروفون لصوت أوضح."),
      bullet("أضف «تسجيل الشاشة» إلى مركز التحكم إن لم يكن موجودًا: الإعدادات ← مركز التحكم ← أضف «تسجيل الشاشة»."),
      bullet("تأكد أن ميكروفون تسجيل الشاشة مُفعّل: اضغط مطوّلًا على أيقونة تسجيل الشاشة في مركز التحكم، وفعّل الميكروفون قبل البدء."),

      H2("أثناء التسجيل"),
      bullet("افتح العرض في PowerPoint واضغط «عرض الشرائح» (Play) لتشغيله بملء الشاشة."),
      bullet("من مركز التحكم، اضغط زر تسجيل الشاشة لبدء التسجيل (عدّ تنازلي ٣ ثوانٍ ثم يبدأ)."),
      bullet("انتقل بين الشرائح بالنقر، واشرح كل شريحة بصوتك مستخدمًا نص الإلقاء كمرجع لا كنص يُقرأ حرفيًا — تحدّث بشكل طبيعي."),
      bullet("اترك ثانية أو ثانيتين صمت بين الشرائح لتسهيل أي قص لاحق إن احتجت."),
      bullet("بعد الشريحة الأخيرة، اضغط مركز التحكم مرة أخرى لإيقاف التسجيل."),

      H2("بعد التسجيل"),
      bullet("يُحفظ الفيديو تلقائيًا في تطبيق «الصور». افتحه وعدّل (Edit) لقص أي جزء زائد من البداية أو النهاية."),
      bullet("تحقّق من المدة (٥ دقائق كحد أقصى) وحجم الملف (١٥٠ ميجابايت كحد أقصى) من خلال معلومات الملف في تطبيق «الصور» أو «الملفات»."),
      bullet("إذا تجاوز الحجم المسموح: افتح الفيديو في «الصور» ← مشاركة ← اختر جودة أقل عند التصدير، أو استخدم تطبيق iMovie لتصديره بدقة 720p بدلًا من 1080p/4K لتقليل الحجم بشكل كبير مع بقاء الوضوح جيدًا على الجوال."),
      bullet("للحصول على أفضل جودة صوت إن توفر جهاز حاسوب: يمكن بديلًا استخدام Keynote أو PowerPoint على ماك مع تسجيل الشاشة عبر QuickTime وميكروفون خارجي، ثم تصدير الفيديو بنفس الطريقة."),

      H2("ملاحظة مهمة", ALERT),
      P("وضّح في بداية أو نهاية حديثك أن واجهات التطبيق والمحاكاة المعروضة هي تصور تصميمي للمشروع وبيانات تجريبية، وأن المشروع في مرحلة التصميم ولم تُجرَ اختبارات فعلية بعد — هذا موجود بالفعل في نص الإلقاء المقترح أعلاه.", { color: GRAY })
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(path.join(ROOT, "03-video/narration-script.docx"), buf);
  console.log("narration doc done");
});

# الخوارزمية – Algorithm
## نظام إدارة درجات الطلاب – Student Grades Management System

> الخوارزمية مطابقة تمامًا للمخطط الانسيابي (`flowchart.png` / `flowchart.pdf`) وللكود (`grades_system.py`).
> رقم كل خطوة مذكور بجانبه اسم الدالة التي تنفّذها في الكود.

---

## 1. وصف المسألة – Problem Description
برنامج يُدخل فيه المستخدم أسماء الطلاب ودرجاتهم في ثلاث مواد (Math, Science, English)،
فيحسب المجموع والمتوسط لكل طالب، ويحدد حالته (ناجح / راسب)، ويسمح بإدخال أي عدد من الطلاب،
ثم يعرض النتائج في جدول منظّم مع ملخص للفصل.

## 2. المدخلات – Inputs
| المدخل | النوع | شرط الصحة |
|---|---|---|
| اسم الطالب `name` | نص | غير فارغ، ويحتوي على حروف ومسافات فقط |
| درجة Math | رقم | بين 0 و 100 |
| درجة Science | رقم | بين 0 و 100 |
| درجة English | رقم | بين 0 و 100 |
| إضافة طالب آخر؟ | حرف | `y` / `yes` أو `n` / `no` |

## 3. العمليات – Processing
- `total = Math + Science + English`
- `average = total / 3`
- إذا كان `average >= 50` فإن `status = PASS (ناجح)`، وإلا `status = FAIL (راسب)`

## 4. المخرجات – Outputs
- لكل طالب بعد إدخاله: المجموع، المتوسط، الحالة.
- في النهاية: جدول بكل الطلاب (الاسم، الدرجات الثلاث، المجموع، المتوسط، الحالة)،
  وملخص: عدد الطلاب، عدد الناجحين، عدد الراسبين، متوسط الفصل.

## 5. الثوابت والمتغيرات – Constants & Variables
| الاسم | الوصف |
|---|---|
| `SUBJECTS` | المواد الثلاث (Math, Science, English) |
| `PASS_MARK = 50` | الحد الأدنى للمتوسط للنجاح |
| `students` | قائمة تُخزَّن فيها سجلات جميع الطلاب |
| `name` | اسم الطالب الحالي |
| `grades` | قائمة درجات الطالب الحالي |
| `i` | عدّاد المواد (1 إلى 3) |
| `total`, `average`, `status` | المجموع والمتوسط والحالة |

---

## 6. خطوات الخوارزمية – Algorithm Steps

```
Step 1 : START                                                     [main]
Step 2 : students ← [ ]   (empty list)                             [main]
Step 3 : INPUT name                                                [get_student_name]
Step 4 : IF name is empty OR contains non-letters THEN             [is_valid_name]
             DISPLAY "Error: invalid name"
             GO TO Step 3
         END IF
Step 5 : grades ← [ ] ,  i ← 1                                     [main]
Step 6 : WHILE i <= 3 DO                                           [for subject in SUBJECTS]
   6.1 :     INPUT grade of subject i                              [get_grade]
   6.2 :     IF grade is not a number OR grade < 0 OR grade > 100  [parse_grade]
                 DISPLAY "Error: invalid grade"
                 GO TO Step 6.1
             END IF
   6.3 :     add grade to grades ;  i ← i + 1
         END WHILE
Step 7 : total   ← grades[1] + grades[2] + grades[3]               [calculate_total]
         average ← total / 3                                       [calculate_average]
Step 8 : IF average >= 50 THEN status ← "PASS"                     [determine_status]
         ELSE                 status ← "FAIL"
Step 9 : save record (name, grades, total, average, status)
         in students, and DISPLAY total, average, status           [build_student_record]
Step 10: INPUT answer  "Add another student? (y/n)"                [ask_continue]
Step 11: IF answer is not y/n THEN
             DISPLAY "Error: enter y or n"
             GO TO Step 10
         END IF
Step 12: IF answer = y THEN GO TO Step 3                           (next student)
Step 13: DISPLAY results table of all students and the summary
         (number of students, passed, failed, class average)       [display_results]
Step 14: END
```

## 7. شرح الخطوات بالعربية – Explanation
1. **البداية:** يبدأ البرنامج بطباعة عنوان النظام وتجهيز قائمة فارغة `students`.
2. **إدخال الاسم (الخطوتان 3–4):** يطلب البرنامج اسم الطالب، فإذا كان فارغًا أو يحتوي على أرقام/رموز تظهر رسالة خطأ ويُعاد الطلب (حلقة تحقق `while`).
3. **إدخال الدرجات (الخطوتان 5–6):** حلقة تتكرر 3 مرات (مرة لكل مادة)؛ وفي كل مرة يُتحقق أن المُدخَل رقم بين 0 و100، وإلا تظهر رسالة خطأ ويُعاد إدخال درجة المادة نفسها.
4. **المعالجة (الخطوة 7):** حساب المجموع ثم المتوسط.
5. **القرار (الخطوة 8):** إذا كان المتوسط 50 أو أكثر فالطالب **ناجح PASS**، وإلا فهو **راسب FAIL**.
6. **الحفظ (الخطوة 9):** يُحفظ سجل الطالب في القائمة وتُعرض نتيجته فورًا.
7. **التكرار (الخطوات 10–12):** يُسأل المستخدم هل يريد إضافة طالب آخر؛ إذا أجاب `y` يعود البرنامج إلى الخطوة 3، وإذا أدخل إجابة غير صحيحة يُعاد السؤال.
8. **العرض النهائي (الخطوة 13):** عرض جدول منظّم لجميع الطلاب مع ملخص الفصل.
9. **النهاية (الخطوة 14).**

## 8. مثال تتبّع يدوي – Dry Run
| الطالب | Math | Science | English | total | average | average ≥ 50 ? | status |
|---|---|---|---|---|---|---|---|
| Ahmed Ali | 85 | 90 | 78 | 253 | 84.33 | Yes | PASS |
| Sara Hassan | 40 | 35 | 50 | 125 | 41.67 | No | FAIL |

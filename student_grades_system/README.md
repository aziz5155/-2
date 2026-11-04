# Student Grades Management System – نظام إدارة درجات الطلاب
**Topic 3: Programming (Python)**

برنامج Python لإدخال أسماء الطلاب ودرجاتهم في ثلاث مواد، وحساب المجموع والمتوسط، وتحديد حالة الطالب (ناجح/راسب)، مع التحقق من صحة المدخلات وإمكانية إدخال أكثر من طالب.

## الملفات – Files
| الملف | الوصف | بند التقييم |
|---|---|---|
| `grades_system.py` | البرنامج الرئيسي | Program Code |
| `ALGORITHM.md` | الخوارزمية (المدخلات، العمليات، المخرجات، الخطوات) | Algorithm |
| `flowchart.png` / `flowchart.pdf` | المخطط الانسيابي | Flowchart |
| `TEST_RESULTS.md` | نتائج التشغيل والاختبارات | Final Output |
| `test_grades_system.py` | اختبارات الوحدة الآلية (11 اختبار) | Testing |
| `run_test_cases.py` | تشغيل البرنامج بحالات اختبار جاهزة | Testing |
| `make_flowchart.py` | السكربت الذي يولّد المخطط (يحتاج `matplotlib`) | — |
| `test_run_output.txt`, `unit_test_output.txt` | المخرجات الخام للتشغيل | — |

## التشغيل – How to run
```bash
python3 grades_system.py                   # تشغيل البرنامج تفاعليًا (لا يحتاج أي مكتبات خارجية)
python3 run_test_cases.py                  # تشغيل حالات الاختبار الجاهزة
python3 -m unittest -v test_grades_system  # اختبارات الوحدة
pip install matplotlib && python3 make_flowchart.py   # (اختياري) إعادة توليد المخطط
```

## المفاهيم البرمجية المستخدمة – Concepts used
- **المتغيرات والثوابت:** `SUBJECTS`, `PASS_MARK`, `students`, `grades`, `total`, `average`, `status`
- **الشروط:** `if / else` لتحديد النجاح والرسوب وللتحقق من المدخلات
- **الحلقات:** `while` للتحقق المتكرر ولإدخال عدة طلاب، و`for` للمرور على المواد والطلاب
- **الدوال:** `get_student_name`, `get_grade`, `parse_grade`, `ask_continue`, `calculate_total`, `calculate_average`, `determine_status`, `build_student_record`, `display_results`, `main`
- **التحقق من المدخلات:** `try / except ValueError` ونطاق الدرجات 0–100
- **هياكل البيانات:** قائمة `list` من القواميس `dict`

## قاعدة النجاح – Pass rule
الطالب **ناجح (PASS)** إذا كان المتوسط ≥ 50، وإلا فهو **راسب (FAIL)**.

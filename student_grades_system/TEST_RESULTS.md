# نتائج التشغيل والاختبارات – Run & Test Results
## Student Grades Management System

جميع المخرجات في هذا الملف **منسوخة حرفيًا من تشغيل فعلي** للبرنامج (Python 3.13) وليست مكتوبة يدويًا.
يمكن إعادة توليدها بالأوامر:

```bash
python3 run_test_cases.py                 # يشغّل البرنامج بحالات الاختبار ويعرض المدخلات والمخرجات
python3 -m unittest -v test_grades_system # اختبارات الوحدة الآلية
```

> ملاحظة: الملف `run_test_cases.py` يستدعي الدالة الرئيسية `main()` نفسها من `grades_system.py`،
> ويقوم فقط بتزويدها بالمدخلات تلقائيًا وطباعة ما "كتبه" المستخدم بجانب كل سؤال.

---

## 1. ملخص حالات الاختبار – Test Cases Summary

| # | الحالة | المدخلات | النتيجة المتوقعة | النتيجة الفعلية | الحكم |
|---|---|---|---|---|---|
| 1 | طالب ناجح | Ahmed Ali: 85, 90, 78 | المجموع 253، المتوسط 84.33، PASS | 253.0 / 84.33 / PASS | ✅ |
| 2 | طالب راسب | Sara Hassan: 40, 35, 50 | المجموع 125، المتوسط 41.67، FAIL | 125.0 / 41.67 / FAIL | ✅ |
| 3 | حد النجاح بالضبط | Khalid: 50, 50, 50 | المتوسط 50.00، PASS | 50.00 / PASS | ✅ |
| 4 | أقل من الحد بقليل | Mona: 49, 50, 50 | المتوسط 49.67، FAIL | 49.67 / FAIL | ✅ |
| 5 | مدخلات خاطئة | اسم فارغ، `Omar99`، درجات `abc`, `120`, `-5`، إجابة `maybe` | رسائل خطأ ثم قبول المدخلات الصحيحة | 2 خطأ اسم، 3 خطأ درجة، 1 خطأ إجابة، ثم PASS | ✅ |
| 6 | عدة طلاب (5) | انظر التشغيل 6 | 3 ناجحون، 2 راسبون، متوسط الفصل 59.20 | 3 / 2 / 59.20 | ✅ |

---

## 2. مخرجات التشغيل الفعلي – Actual Program Runs

```text
##############################################################################
# Test 1 - Passing student
##############################################################################
==============================================================================
                       STUDENT GRADES MANAGEMENT SYSTEM                       
         Subjects: Math, Science, English  |  Pass mark (average): 50         
==============================================================================

--- Student #1 ---
Enter student name: Ahmed Ali
  Enter Math grade (0-100): 85
  Enter Science grade (0-100): 90
  Enter English grade (0-100): 78
  -> Total = 253.0, Average = 84.33, Status = PASS
Add another student? (y/n): n

==============================================================================
                               STUDENT RESULTS                                
==============================================================================
No. Name                   Math  Science  English    Total  Average  Status
------------------------------------------------------------------------------
1   Ahmed Ali              85.0     90.0     78.0    253.0    84.33    PASS
------------------------------------------------------------------------------
Number of students : 1
Passed             : 1
Failed             : 0
Class average      : 84.33
==============================================================================
Program finished. Goodbye!

##############################################################################
# Test 2 - Failing student
##############################################################################
==============================================================================
                       STUDENT GRADES MANAGEMENT SYSTEM                       
         Subjects: Math, Science, English  |  Pass mark (average): 50         
==============================================================================

--- Student #1 ---
Enter student name: Sara Hassan
  Enter Math grade (0-100): 40
  Enter Science grade (0-100): 35
  Enter English grade (0-100): 50
  -> Total = 125.0, Average = 41.67, Status = FAIL
Add another student? (y/n): n

==============================================================================
                               STUDENT RESULTS                                
==============================================================================
No. Name                   Math  Science  English    Total  Average  Status
------------------------------------------------------------------------------
1   Sara Hassan            40.0     35.0     50.0    125.0    41.67    FAIL
------------------------------------------------------------------------------
Number of students : 1
Passed             : 0
Failed             : 1
Class average      : 41.67
==============================================================================
Program finished. Goodbye!

##############################################################################
# Test 3 - Boundary case (average exactly 50 -> PASS)
##############################################################################
==============================================================================
                       STUDENT GRADES MANAGEMENT SYSTEM                       
         Subjects: Math, Science, English  |  Pass mark (average): 50         
==============================================================================

--- Student #1 ---
Enter student name: Khalid
  Enter Math grade (0-100): 50
  Enter Science grade (0-100): 50
  Enter English grade (0-100): 50
  -> Total = 150.0, Average = 50.00, Status = PASS
Add another student? (y/n): n

==============================================================================
                               STUDENT RESULTS                                
==============================================================================
No. Name                   Math  Science  English    Total  Average  Status
------------------------------------------------------------------------------
1   Khalid                 50.0     50.0     50.0    150.0    50.00    PASS
------------------------------------------------------------------------------
Number of students : 1
Passed             : 1
Failed             : 0
Class average      : 50.00
==============================================================================
Program finished. Goodbye!

##############################################################################
# Test 4 - Boundary case (average 49.67 -> FAIL)
##############################################################################
==============================================================================
                       STUDENT GRADES MANAGEMENT SYSTEM                       
         Subjects: Math, Science, English  |  Pass mark (average): 50         
==============================================================================

--- Student #1 ---
Enter student name: Mona
  Enter Math grade (0-100): 49
  Enter Science grade (0-100): 50
  Enter English grade (0-100): 50
  -> Total = 149.0, Average = 49.67, Status = FAIL
Add another student? (y/n): n

==============================================================================
                               STUDENT RESULTS                                
==============================================================================
No. Name                   Math  Science  English    Total  Average  Status
------------------------------------------------------------------------------
1   Mona                   49.0     50.0     50.0    149.0    49.67    FAIL
------------------------------------------------------------------------------
Number of students : 1
Passed             : 0
Failed             : 1
Class average      : 49.67
==============================================================================
Program finished. Goodbye!

##############################################################################
# Test 5 - Invalid inputs (validation)
##############################################################################
==============================================================================
                       STUDENT GRADES MANAGEMENT SYSTEM                       
         Subjects: Math, Science, English  |  Pass mark (average): 50         
==============================================================================

--- Student #1 ---
Enter student name: 
  [Error] Name must not be empty and must contain letters only.
Enter student name: Omar99
  [Error] Name must not be empty and must contain letters only.
Enter student name: Omar Saleh
  Enter Math grade (0-100): abc
  [Error] Grade must be a number between 0 and 100.
  Enter Math grade (0-100): 120
  [Error] Grade must be a number between 0 and 100.
  Enter Math grade (0-100): -5
  [Error] Grade must be a number between 0 and 100.
  Enter Math grade (0-100): 60
  Enter Science grade (0-100): 70.5
  Enter English grade (0-100): 80
  -> Total = 210.5, Average = 70.17, Status = PASS
Add another student? (y/n): maybe
  [Error] Please enter 'y' or 'n'.
Add another student? (y/n): n

==============================================================================
                               STUDENT RESULTS                                
==============================================================================
No. Name                   Math  Science  English    Total  Average  Status
------------------------------------------------------------------------------
1   Omar Saleh             60.0     70.5     80.0    210.5    70.17    PASS
------------------------------------------------------------------------------
Number of students : 1
Passed             : 1
Failed             : 0
Class average      : 70.17
==============================================================================
Program finished. Goodbye!

##############################################################################
# Test 6 - Several students (full class)
##############################################################################
==============================================================================
                       STUDENT GRADES MANAGEMENT SYSTEM                       
         Subjects: Math, Science, English  |  Pass mark (average): 50         
==============================================================================

--- Student #1 ---
Enter student name: Ahmed Ali
  Enter Math grade (0-100): 85
  Enter Science grade (0-100): 90
  Enter English grade (0-100): 78
  -> Total = 253.0, Average = 84.33, Status = PASS
Add another student? (y/n): y

--- Student #2 ---
Enter student name: Sara Hassan
  Enter Math grade (0-100): 40
  Enter Science grade (0-100): 35
  Enter English grade (0-100): 50
  -> Total = 125.0, Average = 41.67, Status = FAIL
Add another student? (y/n): y

--- Student #3 ---
Enter student name: Khalid
  Enter Math grade (0-100): 100
  Enter Science grade (0-100): 100
  Enter English grade (0-100): 100
  -> Total = 300.0, Average = 100.00, Status = PASS
Add another student? (y/n): Y

--- Student #4 ---
Enter student name: Mona
  Enter Math grade (0-100): 0
  Enter Science grade (0-100): 20
  Enter English grade (0-100): 30
  -> Total = 50.0, Average = 16.67, Status = FAIL
Add another student? (y/n): y

--- Student #5 ---
Enter student name: Fatimah
  Enter Math grade (0-100): 55
  Enter Science grade (0-100): 45
  Enter English grade (0-100): 60
  -> Total = 160.0, Average = 53.33, Status = PASS
Add another student? (y/n): no

==============================================================================
                               STUDENT RESULTS                                
==============================================================================
No. Name                   Math  Science  English    Total  Average  Status
------------------------------------------------------------------------------
1   Ahmed Ali              85.0     90.0     78.0    253.0    84.33    PASS
2   Sara Hassan            40.0     35.0     50.0    125.0    41.67    FAIL
3   Khalid                100.0    100.0    100.0    300.0   100.00    PASS
4   Mona                    0.0     20.0     30.0     50.0    16.67    FAIL
5   Fatimah                55.0     45.0     60.0    160.0    53.33    PASS
------------------------------------------------------------------------------
Number of students : 5
Passed             : 3
Failed             : 2
Class average      : 59.20
==============================================================================
Program finished. Goodbye!

```

---

## 3. اختبارات الوحدة الآلية – Automated Unit Tests

الأمر: `python3 -m unittest -v test_grades_system`

```text
test_invalid_inputs_are_rejected_then_accepted (test_grades_system.TestFullProgram.test_invalid_inputs_are_rejected_then_accepted) ... ok
test_pass_and_fail_students (test_grades_system.TestFullProgram.test_pass_and_fail_students) ... ok
test_record (test_grades_system.TestProcessing.test_record) ... ok
test_status_boundary (test_grades_system.TestProcessing.test_status_boundary) ... ok
test_status_fail (test_grades_system.TestProcessing.test_status_fail) ... ok
test_status_pass (test_grades_system.TestProcessing.test_status_pass) ... ok
test_total_and_average (test_grades_system.TestProcessing.test_total_and_average) ... ok
test_invalid_grades (test_grades_system.TestValidation.test_invalid_grades) ... ok
test_invalid_names (test_grades_system.TestValidation.test_invalid_names) ... ok
test_valid_grades (test_grades_system.TestValidation.test_valid_grades) ... ok
test_valid_names (test_grades_system.TestValidation.test_valid_names) ... ok

----------------------------------------------------------------------
Ran 11 tests in 0.002s

OK
```

---

## 4. الخلاصة – Conclusion
- البرنامج يعمل دون أخطاء، ويحسب المجموع والمتوسط بدقة.
- تحديد الحالة صحيح، بما في ذلك الحالات الحدّية (50 ناجح، 49.67 راسب).
- جميع المدخلات الخاطئة (اسم فارغ أو به أرقام، درجة غير رقمية أو خارج 0–100، إجابة غير y/n) تُرفض برسالة واضحة ويُعاد السؤال دون توقف البرنامج.
- يمكن إدخال أي عدد من الطلاب، وتُعرض النتائج في جدول منظّم مع ملخص الفصل.
- نجحت جميع اختبارات الوحدة (11 من 11).

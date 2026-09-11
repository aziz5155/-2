# اختبار قاعدة البيانات محليًا (بدون مشروع Supabase)

هذان الملفان يسمحان بالتحقق من صحة الترحيلات (migrations) والدوال (RPC) على
أي Postgres عادي (16+)، دون الحاجة لمشروع Supabase فعلي — مفيد أثناء تطوير
الـ schema قبل رفعه.

`stub_auth.sql` يُنشئ نسخة مبسّطة جدًا من مخطط `auth` الذي توفّره Supabase
عادة (فقط `auth.users` و `auth.uid()`)، بما يكفي لتشغيل الترحيلات دون أخطاء.
هذا **ليس** بديلاً عن Supabase Auth الحقيقي (لا تشفير كلمات مرور، لا Realtime،
إلخ) — استخدمه فقط محليًا لفحص صحة SQL.

## التشغيل

```bash
createdb familytest
psql -d familytest -f supabase/testing/stub_auth.sql
for f in supabase/migrations/*.sql supabase/seed.sql supabase/seed_billing.sql; do
  psql -d familytest -v ON_ERROR_STOP=1 -f "$f"
done
psql -d familytest -v ON_ERROR_STOP=1 -f supabase/testing/smoke_test.sql
psql -d familytest -v ON_ERROR_STOP=1 -f supabase/testing/smoke_test_billing.sql
```

`smoke_test.sql` يحاكي دورة كاملة: تسجيل ولي أمر → إنشاء عائلة → إضافة طفل →
إسناد مهمة تلقائية ويدوية → اعتماد → نقاط يدوية (منح/خصم مع السقف عند صفر) →
طلب مكافأة → موافقة (خصم مرة واحدة فقط) → **محاولة موافقة ثانية يجب أن تفشل**
(هذا هو السطر الأخير في الملف، وفشله برسالة `already decided` هو النجاح
المتوقّع، وليس خطأ).

`smoke_test_billing.sql` يغطي طبقة الصلاحيات والفوترة: منح دور `owner`،
منع غير المالك من إدارة الفريق، التحقق من كود خصم وتطبيقه على اشتراك فعلي،
منع إعادة استخدام نفس الكود لنفس العميل، منع حذف كود مستخدم (أرشفة فقط)،
ومنع تعطيل حساب المالك نفسه. ينتهي بسطر `ALL BILLING/RBAC CHECKS PASSED`
عند النجاح.

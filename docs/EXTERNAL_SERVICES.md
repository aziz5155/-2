# خدمات وحسابات خارجية مطلوبة منك

هذه الخطوات الوحيدة التي لا يمكن لأي مساعد تقني تنفيذها نيابة عنك، لأنها
تتطلب تسجيل دخول لحسابك الشخصي أو بيانات دفع. كل ما عداها منفَّذ في الكود.

## 1. Supabase (إلزامي لتشغيل التطبيق)

- أنشئ حسابًا مجانيًا على [supabase.com](https://supabase.com) (لا يحتاج بطاقة ائتمان).
- أنشئ مشروعًا جديدًا (اختر منطقة قريبة من مستخدميك، مثلًا Frankfurt أو Singapore).
- شغّل ملفات `supabase/migrations/*.sql` بالترتيب الرقمي (0001 → 0007)، ثم
  `supabase/seed.sql`، ثم `supabase/seed_billing.sql` من SQL Editor.
- انشر الدوال الثلاث في `supabase/functions/` (تحتاج تثبيت [Supabase CLI](https://supabase.com/docs/guides/cli) وتسجيل دخول: `supabase login`).
- من Project Settings → API: انسخ `Project URL` و `anon public key` إلى ملف `.env` (انظر `.env.example`).
- من Project Settings → API → service_role: هذا المفتاح **سري جدًا**، لا يوضع في `.env` للتطبيق أبدًا — يُضبط فقط كسر لدوال Edge:
  ```bash
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```
- **إعداد حساب المالك**: اتبع خطوات [`docs/OWNER_SETUP.md`](OWNER_SETUP.md) —
  خطوتان بسيطتان في لوحة Supabase (إضافة مستخدم + تشغيل سكربت SQL واحد).

## 1.1 رمز تأكيد البريد الإلكتروني (إلزامي — دقيقتان في لوحة Supabase)

Supabase يرسل رابط تأكيد افتراضيًا؛ التطبيق مبني على استخدام **رمز من 6
أرقام** بدلاً من رابط، لذلك يجب تعديل قالب البريد مرة واحدة:

1. **Authentication → Providers → Email**: تأكد أن **Confirm email** مفعّل (Enabled).
2. **Authentication → Email Templates → Confirm signup**: استبدل الجسم بمحتوى يعرض `{{ .Token }}` بدل رابط التأكيد، مثلًا:
   ```html
   <h2>رمز تأكيد بريدك في العائلة الناجحة</h2>
   <p>رمزك هو:</p>
   <h1 style="letter-spacing:4px">{{ .Token }}</h1>
   <p>صلاحية الرمز محدودة، وإذا لم تطلب هذا الرمز يمكنك تجاهل الرسالة.</p>
   ```
3. احفظ (Save).

بهذا فقط تعمل شاشة "تأكيد البريد الإلكتروني" وإعادة الإرسال في التطبيق فعليًا.
البريد يُرسل عبر خدمة Supabase المجانية (محدودة العدد بالساعة) — لحجم استخدام
أكبر لاحقًا، أضف SMTP مخصص من **Authentication → Settings → SMTP Settings**
(اختياري، ليس مطلوبًا للتشغيل الأول).

## 2. Apple Developer Program (إلزامي للنشر على App Store ولتفعيل Apple Sign-In فعليًا)

- حساب Apple Developer ($99/سنة) على [developer.apple.com](https://developer.apple.com).
- بعد الحصول عليه، أخبرني بـ **Team ID** الخاص بك لأربط `app.json` به عبر `eas build`.
- فعّل "Sign in with Apple" Capability لمعرّف التطبيق (`com.familysuccess.app`) من صفحة Certificates, Identifiers & Profiles.

## 3. Google OAuth Client ID (اختياري — لتفعيل "المتابعة عبر Google")

- من [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
- أنشئ OAuth Client ID من نوع **Web application** (لاستخدامه أيضًا كمزوّد Google في Supabase Auth → Providers)، وآخر من نوع **iOS** ببندل آيدي `com.familysuccess.app`.
- ضع القيمتين في `.env`: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` و `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- في Supabase Dashboard → Authentication → Providers → Google: فعّله وألصق نفس الـ Web Client ID وسره.

## 4. تحصيل الدفع الفعلي — مؤجَّل عمدًا حاليًا بطلبك

النظام الكامل للباقات والأسعار وأكواد الخصم والدفعات **يعمل فعليًا** (جدول
`plans`, `promo_codes`, `payments` — لوحة المالك تديره بالكامل)، لكن كل
عملية اشتراك تُسجَّل بحالة `pending_provider` لأنه لا يوجد مزوّد دفع مربوط
بعد — لا مبالغ حقيقية تُحصَّل حتى تربط واحدًا. هذا واضح داخل لوحة المالك
(بطاقة "بانتظار ربط بوابة دفع").

عند الاستعداد، الخيارات الأنسب للسوق السعودي:

- **[Moyasar](https://moyasar.com)** (موصى به): يدعم مدى/Apple Pay/STC Pay،
  API بسيط جدًا، ولا يتطلب سجلًا تجاريًا معقدًا للبدء.
- **[Tap Payments](https://tap.company)**: منتشر في الخليج، يدعم مدى أيضًا.
- كلاهما يحتاج فتح حساب تاجر (KYC + حساب بنكي) من طرفك — لا يمكنني إنشاءه
  نيابة عنك. بعد فتح الحساب، أعطني مفاتيح API فأربط `subscribe_family_to_plan`
  بعملية دفع فعلية (Webhook سيرفري يحدّث حالة `payments` إلى `succeeded` بعد
  تأكيد البنك — لا يلمسه التطبيق مباشرة أبدًا، لضمان عدم التلاعب من العميل).
- الاشتراك عبر App Store (Apple In-App Purchase + RevenueCat) بديل ممكن
  لاحقًا إن فضّلت الفوترة عبر Apple بدل بوابة سعودية مباشرة — يحتاج حساب
  App Store Connect + [RevenueCat](https://www.revenuecat.com) (مجاني للبدء).

## 5. Push Notifications الفعلية (اختياري)

- Expo يدير شهادات Apple Push تلقائيًا عبر `eas credentials` عند البناء —
  لا حاجة لخطوة يدوية منفصلة عادة، لكنها تتطلب حساب Apple Developer (بند 2).

## 6. النشر على App Store (عند اكتمال الاختبار)

- إنشاء تطبيق جديد في App Store Connect بنفس Bundle ID (`com.familysuccess.app`).
- التنفيذ عبر `eas build --platform ios` ثم `eas submit --platform ios`
  (يحتاج تسجيل دخولك بحساب Apple Developer أثناء أول بناء فقط).

---

**بدون أي من هذه الخطوات، يبقى الكود كاملاً وقابلاً للمراجعة والتشغيل محليًا
فور توفر مشروع Supabase فقط (البند 1) — وهو الوحيد الإلزامي لتشغيل تطبيق حي.**

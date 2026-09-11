# خدمات وحسابات خارجية مطلوبة منك

هذه الخطوات الوحيدة التي لا يمكن لأي مساعد تقني تنفيذها نيابة عنك، لأنها
تتطلب تسجيل دخول لحسابك الشخصي أو بيانات دفع. كل ما عداها منفَّذ في الكود.

## 1. Supabase (إلزامي لتشغيل التطبيق)

- أنشئ حسابًا مجانيًا على [supabase.com](https://supabase.com) (لا يحتاج بطاقة ائتمان).
- أنشئ مشروعًا جديدًا (اختر منطقة قريبة من مستخدميك، مثلًا Frankfurt أو Singapore).
- شغّل ملفات `supabase/migrations/*.sql` ثم `supabase/seed.sql` من SQL Editor بالترتيب.
- انشر الدوال الثلاث في `supabase/functions/` (تحتاج تثبيت [Supabase CLI](https://supabase.com/docs/guides/cli) وتسجيل دخول: `supabase login`).
- من Project Settings → API: انسخ `Project URL` و `anon public key` إلى ملف `.env` (انظر `.env.example`).
- من Project Settings → API → service_role: هذا المفتاح **سري جدًا**، لا يوضع في `.env` للتطبيق أبدًا — يُضبط فقط كسر لدوال Edge:
  ```bash
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

## 2. Apple Developer Program (إلزامي للنشر على App Store ولتفعيل Apple Sign-In فعليًا)

- حساب Apple Developer ($99/سنة) على [developer.apple.com](https://developer.apple.com).
- بعد الحصول عليه، أخبرني بـ **Team ID** الخاص بك لأربط `app.json` به عبر `eas build`.
- فعّل "Sign in with Apple" Capability لمعرّف التطبيق (`com.familysuccess.app`) من صفحة Certificates, Identifiers & Profiles.

## 3. Google OAuth Client ID (اختياري — لتفعيل "المتابعة عبر Google")

- من [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
- أنشئ OAuth Client ID من نوع **Web application** (لاستخدامه أيضًا كمزوّد Google في Supabase Auth → Providers)، وآخر من نوع **iOS** ببندل آيدي `com.familysuccess.app`.
- ضع القيمتين في `.env`: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` و `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- في Supabase Dashboard → Authentication → Providers → Google: فعّله وألصق نفس الـ Web Client ID وسره.

## 4. الاشتراكات المدفوعة (Premium) — عند الاستعداد للتسويق فعليًا

الجدول (`subscriptions`) والواجهة جاهزان لعرض/إخفاء ميزات Premium، لكن تحصيل
الدفع الفعلي عبر App Store يحتاج:

- حساب **App Store Connect** (ضمن Apple Developer نفسه) — إنشاء منتجات
  Auto-Renewable Subscription.
- حساب مجاني على [RevenueCat](https://www.revenuecat.com) (موصى به: يبسّط
  التحقق من الإيصالات ويعطي Webhook جاهز) — أو التعامل المباشر مع
  StoreKit عبر `expo-in-app-purchases`.
- بعد إنشاء الحسابين، أخبرني بمفاتيح RevenueCat API فأربط تحديث جدول
  `subscriptions` بـ Webhook سيرفري (لا يلمسه التطبيق مباشرة أبدًا، حفاظًا
  على الأمان — نفس مبدأ عدم الثقة بالعميل المطبَّق في كل مكان آخر).

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

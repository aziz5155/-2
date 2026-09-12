# قاعدة البيانات (Database Schema)

جميع الجداول والدوال في `supabase/migrations/*.sql`، تُشغَّل بالترتيب:
`0001_init` → `0002_security` → `0003_functions` → `0004_grants` →
`0005_admin_rbac` → `0006_billing` → `0007_billing_grants` →
`0008_admin_grant_subscription` → `0009_avatars_storage` → `seed.sql` →
`seed_billing.sql`.

## الجداول

| الجدول | الغرض |
|---|---|
| `users` | امتداد 1:1 لـ `auth.users`، يشمل حسابات الوالدين والأبناء معًا (`kind`) |
| `families` | العائلة، ولها `family_code` فريد يُستخدم لدخول الأبناء |
| `family_members` | ربط الوالدين بالعائلة — يدعم أكثر من ولي أمر لنفس العائلة |
| `children` | ملف الطفل: النقاط، المستوى المحسوب من `lifetime_points`، إلخ |
| `streaks` | سجل الأيام المتتالية لكل طفل (صف واحد لكل طفل) |
| `tasks` | تعريف المهمة: النقاط، التكرار، الأولوية، طريقة الاعتماد |
| `task_assignments` | ربط مهمة بطفل (Many-to-Many) |
| `task_completions` | تنفيذ واحد للمهمة في تاريخ معيّن — لا كتابة مباشرة، فقط عبر RPC |
| `programs` / `program_tasks` | البرنامج ومهامه (Many-to-Many مع ترتيب) |
| `point_transactions` | **سجل النقاط الوحيد** — append-only، مصدر الحقيقة للرصيد |
| `rewards` / `reward_redemptions` | متجر المكافآت وطلبات الاستبدال |
| `goals` | هدف ادخار نقاط للطفل، يُفعَّل تلقائيًا عند بلوغ الرصيد |
| `achievements` / `child_achievements` | كتالوج الشارات (عام) + ما فتحه كل طفل |
| `challenges` / `challenge_members` | التحديات العائلية والمشاركون فيها |
| `activity_events` | سجل نشاط العائلة المرئي للجميع (Feed) |
| `notifications` | صندوق إشعارات لكل مستخدم (بنية جاهزة لـ Push) |
| `subscriptions` | خطة العائلة (`free`/`premium`) وحالتها |
| `program_templates` / `program_template_tasks` | كتالوج القوالب الجاهزة (عام) |
| `admin_users` | حسابات المالك/الفريق الإداري ودورهم (`owner`/`admin`/`support`/`marketing`/`finance`) |
| `admin_audit_log` | سجل تلقائي لكل تعديل إداري (من، ماذا، متى، القيمة قبل/بعد) |
| `plans` | كتالوج الباقات: السعر، الدورة (يومي/أسبوعي/شهري/سنوي)، الحدود، يديره المالك بالكامل من الواجهة |
| `promo_codes` / `promo_code_plans` | أكواد الخصم وقيودها (تاريخ، حد استخدام، الباقات المشمولة) |
| `promo_code_redemptions` | سجل كل استخدام فعلي لكود خصم |
| `payments` | سجل كل عملية اشتراك — `pending_provider` حتى تُربط بوابة دفع حقيقية |

## الصلاحيات الإدارية (RBAC)

- `is_admin()` / `is_owner()` / `current_admin_role()`: دوال مساعدة (نفس نمط
  `is_family_parent`) تُستخدم داخل كل سياسة RLS على جداول الإدارة.
- **لا مسار في الكود يمنح دور `owner` تلقائيًا** — يُمنح فقط عبر
  `supabase/owner_bootstrap.sql` الذي يُشغَّل يدويًا مرة واحدة (راجع
  `docs/OWNER_SETUP.md`).
- `add_admin_by_email` / `set_admin_active`: دوال `owner`-only فقط لإدارة
  الفريق، وكل استدعاء لها يُسجَّل في `admin_audit_log`.
- كل تعديل على `plans` أو `promo_codes` يُسجَّل تلقائيًا عبر Trigger
  (`audit_table_change`) — لا حاجة لكود إضافي عند إضافة جدول إداري جديد،
  فقط أضف نفس الـ Trigger عليه.

## الدوال (RPC) الأساسية

كل دالة أدناه هي `SECURITY DEFINER` وتتحقق من هوية المستخدم (`auth.uid()`)
وصلاحيته بنفسها، بغض النظر عمّن استدعاها:

- `create_family(name)` — ينشئ عائلة + عضوية Owner + اشتراك مجاني، بمعاملة واحدة.
- `complete_task(assignment_id, date, notes?)` — الطفل (أو الوالد نيابة عنه) يُنجز مهمة. يمنح النقاط فورًا إن كانت `auto`، أو يضعها "بانتظار الموافقة" إن كانت `manual`.
- `decide_task_completion(completion_id, approve, note?)` — اعتماد/رفض الوالد لمهمة بانتظار الموافقة.
- `award_points(child_id, amount, reason)` / `deduct_points(child_id, amount, reason)` — نقاط يدوية، السبب إلزامي في الخصم.
- `request_redemption(reward_id)` — الطفل يطلب استبدال مكافأة (لا خصم بعد).
- `decide_redemption(redemption_id, approve, note?)` — الموافقة تخصم النقاط ذريًا (قفل صف + إعادة التحقق من الرصيد).
- `create_program_from_template(family_id, template_id)` — ينسخ قالبًا جاهزًا إلى برنامج ومهام حقيقية للعائلة، مع التحقق من قيود Premium.
- `join_challenge(challenge_id)` — الطفل ينضم لتحدٍ عائلي.
- `validate_promo_code(code, plan_id)` — يتحقق من صلاحية كود الخصم (التاريخ، الحدود، الباقة) ويُرجع السعر قبل/بعد الخصم، دون أي تعديل على القاعدة.
- `subscribe_family_to_plan(plan_id, code?)` — العملية الفعلية: تُعيد التحقق من الكود بنفسها (لا تثق بالعميل)، تُسجّل دفعة في `payments`، تُحدّث `subscriptions`، وتزيد عداد استخدام الكود — كل ذلك بمعاملة واحدة.

## التريغرز التلقائية

- `trg_apply_point_transaction`: بعد أي إدراج في `point_transactions`، يحدّث
  رصيد الطفل، ثم يتحقق من الأهداف (`check_goals`) والإنجازات
  (`check_and_award_achievements`) — دفعة واحدة، بدون الحاجة لأي كود إضافي
  في التطبيق.
- `after_task_counted`: بعد أي إنجاز مهمة "محتسب" (معتمد/تلقائي)، يحدّث
  السلسلة المتتالية (Streak)، ويتحقق من مكافأة إكمال البرنامج، ويحدّث تقدّم
  أي تحدٍ مرتبط بنفس المهمة.

## كيف تُشغِّل الترحيلات (Migrations)

من لوحة تحكم Supabase → **SQL Editor**، الصق محتوى كل ملف بالترتيب الرقمي
ونفّذه (Run). أو عبر Supabase CLI إن كنت تفضّله:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## اختبار الترحيلات محليًا قبل رفعها

راجع [`supabase/testing/README.md`](../supabase/testing/README.md) — سكربت
يشغّل الترحيلات كاملة + دورة عمل حقيقية (عائلة → مهمة → اعتماد → نقاط →
استبدال مكافأة) على أي Postgres عادي، ويتحقق تلقائيًا أن الخصم لا يتكرر.

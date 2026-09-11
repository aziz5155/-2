-- ============================================================================
-- Reference/catalog data: achievements + program templates.
-- This is real product content (shipped with every install), not test data —
-- run once after the migrations, safe to re-run (upserts by unique key).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Achievements catalog
-- ----------------------------------------------------------------------------
insert into public.achievements (key, name, description, icon, criteria_type, criteria_value, criteria_category, sort_order) values
  ('first_task', 'أول مهمة', 'أكملت أول مهمة لك', 'flag', 'first_task', 1, null, 1),
  ('tasks_10', '10 مهام', 'أكملت 10 مهام', 'medal', 'tasks_count', 10, null, 2),
  ('tasks_50', '50 مهمة', 'أكملت 50 مهمة', 'medal', 'tasks_count', 50, null, 3),
  ('tasks_100', '100 مهمة', 'أكملت 100 مهمة', 'trophy', 'tasks_count', 100, null, 4),
  ('streak_7', 'أسبوع كامل من الالتزام', 'حافظت على سلسلتك 7 أيام متتالية', 'flame', 'streak_days', 7, null, 5),
  ('streak_30', '30 يومًا من الالتزام', 'حافظت على سلسلتك 30 يومًا متتالية', 'flame', 'streak_days', 30, null, 6),
  ('reading_10', 'قارئ نشيط', 'أكملت مهام القراءة 10 مرات', 'book', 'category_count', 10, 'reading', 7),
  ('all_tasks_day', 'يوم مثالي', 'أنهيت جميع مهام يومك', 'sun', 'all_tasks_in_day', null, null, 8),
  ('first_goal', 'أول هدف', 'حققت أول هدف ادخرت من أجله', 'target', 'goal_reached', null, null, 9)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  criteria_type = excluded.criteria_type,
  criteria_value = excluded.criteria_value,
  criteria_category = excluded.criteria_category,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- Program templates (free)
-- ----------------------------------------------------------------------------
do $$
declare
  v_id uuid;
begin
  -- برنامج الصباح
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('morning', 'برنامج الصباح', 'ابدأ يومك بروتين صباحي منظم', 'sunrise', false, 1)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'الاستيقاظ في الوقت المحدد', 'alarm', 'morning', 10, 1),
    (v_id, 'ترتيب السرير', 'bed', 'chores', 10, 2),
    (v_id, 'تنظيف الأسنان', 'tooth', 'hygiene', 10, 3),
    (v_id, 'تناول الإفطار', 'coffee', 'morning', 10, 4),
    (v_id, 'الاستعداد للمدرسة', 'backpack', 'morning', 10, 5);

  -- برنامج النوم
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('bedtime', 'برنامج النوم', 'روتين مسائي هادئ قبل النوم', 'moon', false, 2)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'ترتيب الغرفة', 'broom', 'chores', 10, 1),
    (v_id, 'تحضير حقيبة الغد', 'backpack', 'chores', 10, 2),
    (v_id, 'تنظيف الأسنان', 'tooth', 'hygiene', 10, 3),
    (v_id, 'قراءة قبل النوم', 'book', 'reading', 15, 4),
    (v_id, 'النوم في الوقت المحدد', 'moon', 'sleep', 10, 5);

  -- برنامج النظافة الشخصية
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('hygiene', 'برنامج النظافة الشخصية', 'عادات نظافة يومية', 'droplet', false, 3)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'الاستحمام', 'shower', 'hygiene', 15, 1),
    (v_id, 'تنظيف الأسنان صباحًا ومساءً', 'tooth', 'hygiene', 10, 2),
    (v_id, 'تمشيط الشعر', 'comb', 'hygiene', 5, 3),
    (v_id, 'تقليم الأظافر أسبوعيًا', 'scissors', 'hygiene', 10, 4);

  -- برنامج الأعمال المنزلية
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('chores', 'برنامج الأعمال المنزلية', 'مساعدة الأسرة في المنزل', 'broom', false, 4)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'ترتيب الغرفة', 'broom', 'chores', 10, 1),
    (v_id, 'ترتيب المطبخ بعد الأكل', 'kitchen', 'chores', 15, 2),
    (v_id, 'إخراج القمامة', 'trash', 'chores', 10, 3),
    (v_id, 'سقي النباتات', 'plant', 'chores', 5, 4),
    (v_id, 'مساعدة أحد أفراد الأسرة', 'heart', 'chores', 10, 5);

  -- برنامج الصلاة
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('prayer', 'برنامج الصلاة', 'المحافظة على الصلوات في وقتها', 'moon-star', false, 5)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'صلاة الفجر', 'moon-star', 'prayer', 15, 1),
    (v_id, 'صلاة الظهر', 'sun', 'prayer', 10, 2),
    (v_id, 'صلاة العصر', 'sun', 'prayer', 10, 3),
    (v_id, 'صلاة المغرب', 'sunset', 'prayer', 10, 4),
    (v_id, 'صلاة العشاء', 'moon', 'prayer', 10, 5);

  -- برنامج الدراسة
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('study', 'برنامج الدراسة', 'تنظيم وقت الدراسة اليومي', 'pencil', false, 6)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'تحضير الدروس', 'book', 'study', 15, 1),
    (v_id, 'أداء الواجب المدرسي', 'pencil', 'study', 20, 2),
    (v_id, 'ترتيب الأدوات المدرسية', 'backpack', 'study', 5, 3);

  -- برنامج المذاكرة
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('revision', 'برنامج المذاكرة', 'مراجعة الدروس استعدادًا للاختبارات', 'notebook', false, 7)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'مراجعة دروس اليوم', 'notebook', 'study', 15, 1),
    (v_id, 'حل تمارين إضافية', 'pencil', 'study', 15, 2),
    (v_id, 'مراجعة عامة قبل الاختبار', 'book', 'study', 20, 3);

  -- برنامج قراءة القرآن (premium)
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('quran', 'برنامج قراءة القرآن', 'ورد يومي من القرآن الكريم', 'quran', true, 8)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'قراءة ورد اليوم', 'quran', 'reading', 15, 1),
    (v_id, 'حفظ آيات جديدة', 'quran', 'reading', 20, 2),
    (v_id, 'مراجعة المحفوظ', 'book', 'reading', 15, 3);

  -- برنامج التمارين (premium)
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('exercise', 'برنامج التمارين', 'نشاط رياضي يومي', 'dumbbell', true, 9)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'إحماء 5 دقائق', 'dumbbell', 'exercise', 5, 1),
    (v_id, 'تمارين رياضية 20 دقيقة', 'dumbbell', 'exercise', 20, 2),
    (v_id, 'المشي أو الجري', 'run', 'exercise', 15, 3);

  -- برنامج الإجازة (premium)
  insert into public.program_templates (key, name, description, icon, is_premium, sort_order)
  values ('vacation', 'برنامج الإجازة', 'توازن بين المتعة والمسؤولية في الإجازة', 'beach', true, 10)
  on conflict (key) do update set name = excluded.name returning id into v_id;
  delete from public.program_template_tasks where template_id = v_id;
  insert into public.program_template_tasks (template_id, title, icon, category, points, sort_order) values
    (v_id, 'قراءة كتاب حر', 'book', 'reading', 15, 1),
    (v_id, 'نشاط عائلي', 'heart', 'family', 15, 2),
    (v_id, 'وقت شاشة محدود', 'screen', 'other', 10, 3),
    (v_id, 'مساعدة في المنزل', 'broom', 'chores', 10, 4);
end $$;

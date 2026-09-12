import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText, Button, Input, Screen } from '@/design-system/components';
import { useTheme } from '@/design-system/ThemeProvider';
import { createPromoCode, listAllPlans } from '@/services/admin.service';

/** Parses "YYYY-MM-DD HH:MM" as Asia/Riyadh (UTC+3) wall-clock time. */
function parseRiyadhDateTime(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[];
  const utcMillis = Date.UTC(y, mo - 1, d, h, mi) - 3 * 60 * 60 * 1000;
  return new Date(utcMillis).toISOString();
}

export default function NewPromoCodeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: listAllPlans });
  const premiumPlans = plansQuery.data?.filter((p) => p.tier !== 'free') ?? [];

  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('50');
  const [noExpiry, setNoExpiry] = useState(true);
  const [endsAt, setEndsAt] = useState('');
  const [firstNPayments, setFirstNPayments] = useState('1');
  const [unlimitedPayments, setUnlimitedPayments] = useState(false);
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [maxPerCustomer, setMaxPerCustomer] = useState('1');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlan = (id: string) =>
    setSelectedPlanIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const handleSubmit = async () => {
    setError(null);
    if (!code.trim()) return setError('أدخل الكود');
    const discount = Number(discountPercent);
    if (!discount || discount <= 0 || discount > 100) return setError('نسبة الخصم يجب أن تكون بين 1 و100');

    let endsAtIso: string | null = null;
    if (!noExpiry) {
      endsAtIso = parseRiyadhDateTime(endsAt);
      if (!endsAtIso) return setError('صيغة تاريخ الانتهاء يجب أن تكون YYYY-MM-DD HH:MM');
    }

    try {
      setLoading(true);
      await createPromoCode(
        {
          code: code.trim().toUpperCase(),
          discount_percent: discount,
          starts_at: new Date().toISOString(),
          ends_at: endsAtIso,
          applies_to_first_n_payments: unlimitedPayments ? null : Number(firstNPayments) || 1,
          max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
          max_redemptions_per_customer: Number(maxPerCustomer) || 1,
        },
        selectedPlanIds,
      );
      await queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.lg }}>
        <AppText variant="display">كود خصم جديد</AppText>

        <Input label="الكود" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" placeholder="WELCOME50" />
        <Input label="نسبة الخصم (%)" value={discountPercent} onChangeText={setDiscountPercent} keyboardType="number-pad" />

        <View>
          <AppText variant="label" color="secondary" style={{ marginBottom: 6 }}>
            تاريخ الانتهاء (بتوقيت السعودية — يفترض أن جهازك مضبوط عليه)
          </AppText>
          <Pressable onPress={() => setNoExpiry((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AppText>{noExpiry ? '☑️' : '⬜️'} بلا تاريخ انتهاء</AppText>
          </Pressable>
          {!noExpiry && <Input value={endsAt} onChangeText={setEndsAt} placeholder="2026-12-31 23:59" />}
        </View>

        <View>
          <Pressable onPress={() => setUnlimitedPayments((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AppText>{unlimitedPayments ? '☑️' : '⬜️'} يشمل كل دفعات الاشتراك (غير محدود بعدد)</AppText>
          </Pressable>
          {!unlimitedPayments && (
            <Input label="يشمل أول كم دفعة؟ (1 = أول دفعة فقط)" value={firstNPayments} onChangeText={setFirstNPayments} keyboardType="number-pad" />
          )}
        </View>

        <Input
          label="الحد الأقصى لعدد مرات الاستخدام إجمالًا (اتركه فارغًا لعدم التحديد)"
          value={maxRedemptions}
          onChangeText={setMaxRedemptions}
          keyboardType="number-pad"
          placeholder="بلا حد"
        />
        <Input label="الحد الأقصى لكل عميل" value={maxPerCustomer} onChangeText={setMaxPerCustomer} keyboardType="number-pad" />

        <View>
          <AppText variant="label" color="secondary" style={{ marginBottom: 6 }}>
            الباقات المشمولة (لا تختر أي شيء = يشمل كل الباقات)
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {premiumPlans.map((plan) => {
              const selected = selectedPlanIds.includes(plan.id);
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => togglePlan(plan.id)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: theme.radius.pill,
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
                  }}
                >
                  <AppText variant="caption" style={{ color: selected ? theme.colors.onPrimary : theme.colors.textPrimary }}>
                    {plan.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? (
          <AppText color="danger" variant="caption">
            {error}
          </AppText>
        ) : null}

        <Button label="حفظ" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
      </View>
    </Screen>
  );
}

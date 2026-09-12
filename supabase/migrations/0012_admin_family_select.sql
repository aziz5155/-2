-- ============================================================================
-- families/family_members RLS only ever let an actual member of the family
-- read its own row — there was no admin bypass, unlike every other
-- owner-facing table (payments, promo_code_redemptions, plans, ...). That
-- silently broke the Customers list and customer detail screen for the
-- owner: the nested family_members -> families embed came back empty (or
-- errored) because RLS denied it, even though public.users itself was
-- already readable via users_select_admin (migration 0010).
-- ============================================================================

alter policy "families_select_member" on public.families
  using (public.is_family_member(id) or public.is_admin());

alter policy "family_members_select" on public.family_members
  using (public.is_family_member(family_id) or public.is_admin());

-- Same gap on children (blocks the customer detail screen's children(count)
-- embed) and subscriptions (blocks the plan badge shown for each customer).
alter policy "children_select" on public.children
  using (public.is_family_parent(family_id) or user_id = auth.uid() or public.is_admin());

alter policy "subscriptions_select" on public.subscriptions
  using (public.is_family_member(family_id) or public.is_admin());

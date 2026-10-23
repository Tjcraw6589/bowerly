import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { ColorGrid, EmojiGrid } from '@/components/Pickers';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/lib/categories';
import type { Category } from '@/lib/types';
import { successHaptic } from '@/services/haptics';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

interface FormState {
  id: string | null;
  name: string;
  emoji: string;
  color: string;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const isPro = useStore((s) => s.meta.isPro);
  const categories = useStore((s) => s.categories);
  const subs = useStore((s) => s.subscriptions);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const removeCategory = useStore((s) => s.removeCategory);

  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<Category | null>(null);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs) map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1);
    return map;
  }, [subs]);
  const custom = categories.filter((c) => !c.builtIn);
  const builtIn = categories.filter((c) => c.builtIn);

  if (!isPro) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header title="Categories" dismiss="back" />
        <EmptyState
          emoji="🏷️"
          title="Custom categories are a Pro feature"
          body="Pro lets you add your own categories with their own emoji and colour, and removes ads for good."
          actionLabel="See Pro"
          onAction={() => router.push({ pathname: '/pro', params: { reason: 'categories' } })}
        />
      </Screen>
    );
  }

  const openNew = () => {
    setError(undefined);
    setForm({ id: null, name: '', emoji: CATEGORY_EMOJIS[10] ?? '🏷️', color: CATEGORY_COLORS[5] ?? '#0EA5E9' });
  };
  const openEdit = (c: Category) => {
    setError(undefined);
    setForm({ id: c.id, name: c.name, emoji: c.emoji, color: c.color });
  };

  const saveForm = () => {
    if (!form) return;
    const name = form.name.trim();
    if (!name) {
      setError('Give the category a name.');
      return;
    }
    if (categories.some((c) => c.id !== form.id && c.name.toLowerCase() === name.toLowerCase())) {
      setError('A category with that name already exists.');
      return;
    }
    if (form.id) updateCategory(form.id, { name, emoji: form.emoji, color: form.color });
    else addCategory({ name, emoji: form.emoji, color: form.color });
    successHaptic();
    setForm(null);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    removeCategory(deleting.id);
    setDeleting(null);
    successHaptic();
  };

  return (
    <Screen scroll edges={['top', 'bottom']} testID="categories-screen">
      <Header title="Categories" dismiss="back" right={<Button label="New" size="sm" onPress={openNew} testID="category-new" />} />

      <SectionHeader title="Your categories" first />
      {custom.length === 0 ? (
        <Card>
          <AppText variant="body" tone="muted">
            {"You haven't added any categories yet. Tap New to create one."}
          </AppText>
        </Card>
      ) : (
        <Card padded={false}>
          {custom.map((c, i) => (
            <Row
              key={c.id}
              left={<Avatar emoji={c.emoji} color={c.color} size={36} />}
              title={c.name}
              subtitle={`${usage.get(c.id) ?? 0} subscription${(usage.get(c.id) ?? 0) === 1 ? '' : 's'}`}
              right={
                <Button
                  label="Delete"
                  variant="danger"
                  size="sm"
                  onPress={() => setDeleting(c)}
                  style={{ marginRight: 8 }}
                  testID={`category-delete-${c.id}`}
                />
              }
              onPress={() => openEdit(c)}
              last={i === custom.length - 1}
              testID={`category-row-${c.id}`}
            />
          ))}
        </Card>
      )}

      <SectionHeader title="Built-in" />
      <Card padded={false}>
        {builtIn.map((c, i) => (
          <Row
            key={c.id}
            left={<Avatar emoji={c.emoji} color={c.color} size={36} />}
            title={c.name}
            value={String(usage.get(c.id) ?? 0)}
            chevron={false}
            last={i === builtIn.length - 1}
          />
        ))}
      </Card>
      <AppText variant="caption" tone="faint" style={{ marginTop: spacing.md }}>
        {"Built-in categories can't be removed. Deleting one of yours moves its subscriptions to Other."}
      </AppText>
      <View style={{ height: spacing.xl }} />

      <Sheet visible={form !== null} onClose={() => setForm(null)} title={form?.id ? 'Edit category' : 'New category'} testID="category-sheet">
        {form ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <View style={[styles.preview, { marginBottom: spacing.md }]}>
              <Avatar emoji={form.emoji} color={form.color} size={56} />
            </View>
            <TextField
              label="Name"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
              placeholder="Pets, Kids, Work…"
              autoFocus
              maxLength={30}
              error={error}
              testID="category-name"
            />
            <ColorGrid colors={CATEGORY_COLORS} value={form.color} onChange={(color) => setForm({ ...form, color })} />
            <View style={{ height: spacing.md }} />
            <EmojiGrid emojis={CATEGORY_EMOJIS} value={form.emoji} onChange={(emoji) => setForm({ ...form, emoji })} />
            <Button label={form.id ? 'Save' : 'Add category'} fullWidth onPress={saveForm} style={{ marginTop: spacing.lg }} testID="category-save" />
          </View>
        ) : null}
      </Sheet>
      <ConfirmSheet
        visible={deleting !== null}
        title={`Delete ${deleting?.name ?? ''}?`}
        message={`${usage.get(deleting?.id ?? '') ?? 0} subscription(s) will move to Other.`}
        confirmLabel="Delete category"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        testID="category-delete-sheet"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center' },
});

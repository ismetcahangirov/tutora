/**
 * Design System showcase (epic #8).
 *
 * Renders every component in the Tutora UI kit so the design system can be
 * reviewed at a glance in both light and dark mode. This replaces the Expo
 * starter home screen and doubles as living documentation for the kit.
 */
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  FilterChip,
  FilterSheet,
  Input,
  Modal,
  SearchBar,
  Skeleton,
  SkeletonText,
  Text,
  useToast,
  type FilterSection,
  type FilterSelection,
} from '@/components/ui';
import { spacing, useColors, useThemeMode } from '@/theme';

const FILTER_SECTIONS: FilterSection[] = [
  {
    key: 'district',
    title: 'District',
    multiple: true,
    options: [
      { label: 'Nəsimi', value: 'nasimi' },
      { label: 'Yasamal', value: 'yasamal' },
      { label: 'Sabail', value: 'sabail' },
    ],
  },
  {
    key: 'subject',
    title: 'Subject',
    multiple: true,
    options: [
      { label: 'Math', value: 'math' },
      { label: 'Physics', value: 'physics' },
      { label: 'English', value: 'english' },
    ],
  },
  {
    key: 'price',
    title: 'Price',
    options: [
      { label: '< 20 ₼', value: 'lt20' },
      { label: '20–40 ₼', value: 'mid' },
      { label: '40+ ₼', value: 'gt40' },
    ],
  },
  {
    key: 'rating',
    title: 'Rating',
    options: [
      { label: '4.0+', value: '4' },
      { label: '4.5+', value: '4.5' },
    ],
  },
  {
    key: 'format',
    title: 'Format',
    options: [
      { label: 'Online', value: 'online' },
      { label: 'Offline', value: 'offline' },
    ],
  },
  {
    key: 'language',
    title: 'Language',
    multiple: true,
    options: [
      { label: 'AZ', value: 'az' },
      { label: 'EN', value: 'en' },
      { label: 'RU', value: 'ru' },
    ],
  },
];

const SUBJECTS = ['Math', 'Physics', 'English', 'Chemistry'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title">{title}</Text>
      {children}
    </View>
  );
}

export default function ShowcaseScreen() {
  const colors = useColors();
  const { mode, toggle } = useThemeMode();
  const { show } = useToast();

  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState<string[]>(['Math']);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selection, setSelection] = useState<FilterSelection>({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleSubject = (subject: string) =>
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="headline">Tutora UI</Text>
            <Text variant="bodySmall" color="textSecondary">
              Design system · {mode} mode
            </Text>
          </View>
          <Button
            label={mode === 'dark' ? 'Light' : 'Dark'}
            variant="outline"
            size="compact"
            onPress={toggle}
          />
        </View>

        <Section title="Typography">
          <Text variant="display">Display</Text>
          <Text variant="title">Title heading</Text>
          <Text variant="body">
            Body copy uses Plus Jakarta Sans. Find the right tutor by budget, district, and subject.
          </Text>
          <Text variant="caption" color="textSecondary">
            Caption · metadata
          </Text>
        </Section>

        <Section title="Buttons">
          <Button
            label="Primary"
            onPress={() => show({ message: 'Primary pressed', type: 'success' })}
          />
          <Button label="Outline" variant="outline" leadingIcon="check" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Danger" variant="danger" onPress={() => {}} />
          <View style={styles.row}>
            <Button label="Compact" size="compact" onPress={() => {}} />
            <Button label="Loading" loading onPress={() => {}} />
            <Button label="Disabled" disabled onPress={() => {}} />
          </View>
        </Section>

        <Section title="Inputs">
          <Input
            label="Full name"
            placeholder="e.g. Aygün Məmmədova"
            helperText="As it appears on your ID"
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            leadingIcon="search"
            errorText="Email is required"
          />
        </Section>

        <Section title="Cards">
          <Card>
            <Text variant="subtitle">Static card</Text>
            <Text variant="bodySmall" color="textSecondary">
              Soft shadow in light mode, border-separated in dark.
            </Text>
          </Card>
          <Card onPress={() => show({ message: 'Card tapped' })}>
            <Text variant="subtitle">Pressable card</Text>
            <Text variant="bodySmall" color="textSecondary">
              Tap me to fire a toast.
            </Text>
          </Card>
        </Section>

        <Section title="Search & Filters">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search tutors"
            onDebouncedChange={(q) =>
              q.length > 0 && show({ message: `Searching “${q}”`, type: 'info' })
            }
          />
          <View style={styles.chips}>
            {SUBJECTS.map((subject) => (
              <FilterChip
                key={subject}
                label={subject}
                selected={subjects.includes(subject)}
                onPress={() => toggleSubject(subject)}
              />
            ))}
          </View>
          <Button
            label="Open filters"
            variant="outline"
            leadingIcon="filter"
            onPress={() => setFiltersVisible(true)}
          />
        </Section>

        <Section title="Overlays & feedback">
          <Button label="Open bottom sheet" onPress={() => setSheetVisible(true)} />
          <Button label="Open modal" variant="outline" onPress={() => setModalVisible(true)} />
          <View style={styles.row}>
            <Button
              label="Success"
              variant="ghost"
              onPress={() => show({ message: 'Saved!', type: 'success' })}
            />
            <Button
              label="Error"
              variant="ghost"
              onPress={() => show({ message: 'Upload failed', type: 'error' })}
            />
            <Button
              label="Info"
              variant="ghost"
              onPress={() => show({ message: 'Heads up', type: 'info' })}
            />
          </View>
        </Section>

        <Section title="Loading & empty">
          <Card elevated={false}>
            <View style={styles.skeletonRow}>
              <Skeleton width={48} height={48} radius="full" />
              <View style={styles.skeletonText}>
                <SkeletonText lines={3} />
              </View>
            </View>
          </Card>
          <Card elevated={false}>
            <EmptyState
              title="No tutors found"
              description="Try widening your filters to see more results."
              actionLabel="Reset filters"
              onAction={() => setSelection({})}
            />
          </Card>
        </Section>
      </ScrollView>

      <FilterSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        sections={FILTER_SECTIONS}
        value={selection}
        onChange={setSelection}
        onApply={() => show({ message: 'Filters applied', type: 'success' })}
      />

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Bottom sheet"
      >
        <Text variant="body" color="textSecondary">
          Sheets use a 24px top radius, a drag handle, and a dimmed backdrop.
        </Text>
        <Button label="Close" onPress={() => setSheetVisible(false)} />
      </BottomSheet>

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Confirm">
        <Text variant="body" color="textSecondary">
          Modals are centered, capped in width, and always dismissable.
        </Text>
        <Button label="Got it" onPress={() => setModalVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing['3xl'],
    paddingBottom: spacing['6xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  skeletonText: {
    flex: 1,
  },
});

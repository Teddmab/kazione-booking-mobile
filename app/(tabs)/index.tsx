import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useDebounce } from 'use-debounce';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryFilter } from '@/components/marketplace/CategoryFilter';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { SalonCard, SALON_CARD_HEIGHT } from '@/components/salon/SalonCard';
import { SalonCardSkeleton } from '@/components/salon/SalonCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { useLanguage } from '@/hooks/useLanguage';
import { useMarketplace } from '@/hooks/useMarketplace';
import { toSalonListItem, type SalonListItem } from '@/types/marketplace';

const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => ({ id: `skeleton-${i}` }));

export default function MarketplaceHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, role } = useAuth();
  const hasOwnerBanner =
    !!session && (role === 'owner' || role === 'manager');
  const { language, setLanguage } = useLanguage();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 400);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMarketplace({ category, q: debouncedQuery });

  const salons = useMemo(
    () => (data?.pages.flatMap((p) => p.storefronts.map(toSalonListItem)) ?? []),
    [data],
  );

  const openSalon = useCallback(
    (slug: string) => {
      router.push(`/salon/${slug}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: SalonListItem }) => (
      <View style={styles.cardCell}>
        <SalonCard
          salon={item}
          onPress={() => openSalon(item.slug)}
          onBook={() => router.push(`/booking/staff?salonSlug=${item.slug}` as Href)}
        />
      </View>
    ),
    [openSalon, router],
  );

  const listHeader = (
    <View
      style={[
        styles.headerBlock,
        { paddingTop: hasOwnerBanner ? SPACING.sm : insets.top + SPACING.md },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Logo size="sm" variant="icon-only" />
          <Text style={styles.brandName}>KaziOne</Text>
        </View>
        <View style={styles.langRow}>
          {(['en', 'fr', 'et'] as const).map((lang) => (
            <Pressable key={lang} onPress={() => void setLanguage(lang)}>
              <Text style={[styles.langChip, language === lang && styles.langChipActive]}>
                {lang.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text style={styles.heroTitle}>{t('marketplace.heroTitle', 'Find Your Perfect Salon')}</Text>
      <View style={styles.cityChip}>
        <Text style={styles.cityText}>Tallinn 📍</Text>
      </View>
      <CategoryFilter selected={category} onSelect={setCategory} />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('marketplace.searchPlaceholder', 'Search salons, services…')}
      />
      <Text style={styles.sectionLabel}>{t('marketplace.topSalons', 'Top Salons')}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <FlatList
          style={styles.screen}
          contentContainerStyle={styles.listContent}
          data={SKELETON_ROWS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrap}
          ListHeaderComponent={listHeader}
          renderItem={() => (
            <View style={styles.cardCell}>
              <SalonCardSkeleton />
            </View>
          )}
          scrollEnabled={false}
        />
      </TouchableWithoutFeedback>
    );
  }

  if (isError) {
    return (
      <View style={styles.screen}>
        {listHeader}
        <ErrorState message={t('marketplace.loadError')} onRetry={() => void refetch()} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.listContent}
        data={salons}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title={t('marketplace.noResults')}
            message={t('marketplace.tryDifferentFilters')}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <LoadingSpinner message={t('common.loading')} />
          ) : !hasNextPage && salons.length > 0 ? (
            <Text style={styles.endText}>{t('marketplace.allLoaded', 'All salons loaded')}</Text>
          ) : null
        }
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: SALON_CARD_HEIGHT + SPACING.sm,
          offset: (SALON_CARD_HEIGHT + SPACING.sm) * Math.floor(index / 2),
          index,
        })}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={COLORS.orange}
          />
        }
      />
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  headerBlock: {
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.orange,
  },
  langRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  langChip: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  langChipActive: {
    color: COLORS.orange,
    fontWeight: '700',
  },
  heroTitle: {
    ...TYPOGRAPHY.display,
    color: COLORS.orange,
  },
  cityChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.elevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
  },
  cityText: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
  },
  sectionLabel: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  columnWrap: {
    gap: SPACING.sm,
  },
  cardCell: {
    flex: 1,
    minWidth: 0,
    marginBottom: SPACING.sm,
  },
  endText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
});

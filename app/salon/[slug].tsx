import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServiceCard } from '@/components/salon/ServiceCard';
import { StorefrontSkeleton } from '@/components/storefront/StorefrontSkeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { ApiError } from '@/lib/api';
import { useStorefront } from '@/hooks/useStorefront';
import type { StorefrontService } from '@/types/marketplace';

function currencySymbol(code: string) {
  if (code === 'EUR') return '€';
  if (code === 'USD') return '$';
  return code;
}

function groupServicesByCategory(services: StorefrontService[]) {
  const map = new Map<string, StorefrontService[]>();
  for (const s of services) {
    const cat = s.category || 'Other';
    const arr = map.get(cat) ?? [];
    arr.push(s);
    map.set(cat, arr);
  }
  return [...map.entries()];
}

export default function SalonStorefrontScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [bioExpanded, setBioExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const { data: salon, isLoading, isError, refetch, error } = useStorefront(slug);

  const servicesByCategory = useMemo(
    () => (salon ? groupServicesByCategory(salon.services) : []),
    [salon],
  );

  const bio = salon?.extendedDescription ?? salon?.description ?? '';
  const bioPreview = bio.length > 120 && !bioExpanded ? `${bio.slice(0, 120)}…` : bio;

  const goBook = (serviceId?: string) => {
    const qs = serviceId ? `?salonSlug=${slug}&serviceId=${serviceId}` : `?salonSlug=${slug}`;
    router.push(`/booking/staff${qs}` as Href);
  };

  if (isLoading || !slug) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="KaziOne" showBack onBack={() => router.back()} />
        <StorefrontSkeleton />
      </View>
    );
  }

  if (isError || !salon) {
    const is404 =
      error instanceof ApiError
        ? error.status === 404
        : error instanceof Error && error.message.toLowerCase().includes('not found');
    return (
      <View style={styles.screen}>
        <ScreenHeader title="KaziOne" showBack onBack={() => router.back()} />
        <ErrorState
          message={is404 ? t('marketplace.salonNotFound') : t('marketplace.loadError')}
          onRetry={() => void refetch()}
        />
        <Button
          variant="ghost"
          label={t('common.back')}
          onPress={() => router.back()}
          style={styles.backBtn}
        />
      </View>
    );
  }

  const sym = currencySymbol(salon.currencyCode);
  const heroUri = salon.coverImageUrl ?? salon.logoUrl;
  const city = salon.contact.city ?? salon.countryCode ?? '';

  return (
    <View style={styles.screen}>
      <ScreenHeader title="KaziOne" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}>
        <View style={styles.heroWrap}>
          <Image
            source={heroUri ? { uri: heroUri } : undefined}
            style={styles.heroImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <View style={styles.heroGradient} />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{salon.name}</Text>
            <Text style={styles.heroMeta}>
              ★ {salon.rating.toFixed(1)} · {salon.reviewCount} reviews · {city}
            </Text>
            {salon.featured ? (
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>{t('marketplace.featured', 'Featured')}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('marketplace.about', 'About')}</Text>
            <Text style={styles.bodyText}>{bioPreview}</Text>
            {bio.length > 120 ? (
              <Pressable onPress={() => setBioExpanded((e) => !e)}>
                <Text style={styles.readMore}>
                  {bioExpanded
                    ? t('marketplace.readLess', 'Read less')
                    : t('marketplace.readMore', 'Read more')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('marketplace.services', 'Services')}</Text>
          {servicesByCategory.length === 0 ? (
            <EmptyState
              icon="✂️"
              title={t('marketplace.noServices', 'No services')}
              message=""
            />
          ) : (
            servicesByCategory.map(([cat, items]) => (
              <View key={cat}>
                <Text style={styles.categoryLabel}>{cat}</Text>
                {items.map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    service={svc}
                    currencySymbol={sym}
                    onPress={() => goBook(svc.id)}
                  />
                ))}
              </View>
            ))
          )}
        </View>

        {salon.team.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('marketplace.ourTeam', 'Our Team')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {salon.team.map((member) => (
                <View key={member.id} style={styles.teamMember}>
                  <Image
                    source={member.avatar ? { uri: member.avatar } : undefined}
                    style={styles.teamAvatar}
                    cachePolicy="memory-disk"
                  />
                  <Text style={styles.teamName} numberOfLines={1}>
                    {member.name}
                  </Text>
                  <Text style={styles.teamRole} numberOfLines={1}>
                    {member.role}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {salon.gallery.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('marketplace.gallery', 'Gallery')}</Text>
            <View style={styles.galleryGrid}>
              {salon.gallery.map((img, idx) => (
                <Pressable key={img.id} style={styles.galleryCell} onPress={() => setGalleryIndex(idx)}>
                  <Image
                    source={{ uri: img.imageUrl }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {salon.promotions.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.gold }]}>
              {t('marketplace.promotions', 'Promotions')}
            </Text>
            {salon.promotions.map((promo) => (
              <View key={promo.id} style={styles.promoCard}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.bodyText}>{promo.description}</Text>
                {promo.validUntil ? (
                  <Text style={styles.promoMeta}>
                    {t('marketplace.validUntil', 'Valid until')} {promo.validUntil}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <Button label={t('marketplace.bookNow')} onPress={() => goBook()} />
      </View>

      <Modal visible={galleryIndex !== null} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setGalleryIndex(null)}>
          {galleryIndex !== null && salon.gallery[galleryIndex] ? (
            <Image
              source={{ uri: salon.gallery[galleryIndex].imageUrl }}
              style={styles.modalImage}
              contentFit="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  heroWrap: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%', backgroundColor: COLORS.elevated },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: 'rgba(12,11,10,0.75)',
  },
  heroText: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
  },
  heroName: { ...TYPOGRAPHY.h1, color: COLORS.text },
  heroMeta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  openBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  openBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.background, fontWeight: '700' },
  section: { padding: SPACING.md, gap: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  categoryLabel: { ...TYPOGRAPHY.label, color: COLORS.gold, marginTop: SPACING.sm },
  bodyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  readMore: { ...TYPOGRAPHY.label, color: COLORS.gold, marginTop: SPACING.xs },
  teamMember: { width: 80, marginRight: SPACING.md, alignItems: 'center' },
  teamAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.elevated,
  },
  teamName: { ...TYPOGRAPHY.caption, color: COLORS.text, marginTop: 6 },
  teamRole: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, fontSize: 11 },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  galleryCell: { width: '48%', aspectRatio: 1 },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.elevated,
  },
  promoCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  promoTitle: { ...TYPOGRAPHY.label, color: COLORS.text },
  promoMeta: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginTop: 4 },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backBtn: { margin: SPACING.md },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: { width: '90%', height: '70%' },
});

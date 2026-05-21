import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OwnerBusinessHeader } from '@/components/owner/OwnerBusinessHeader';
import { QueryState } from '@/components/owner/QueryState';
import { StatCard } from '@/components/owner/StatCard';
import { StatusBadge } from '@/components/owner/StatusBadge';
import { OWNER_QUICK_NAV } from '@/constants/ownerNav';
import { ownerColors, ownerStyles } from '@/constants/ownerTheme';
import { useTenantContext } from '@/contexts/TenantContext';
import { useOwnerDashboardKPIs } from '@/hooks/useOwnerAppointments';
import { formatCurrency, formatDateLong, formatTime } from '@/lib/format';

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? '';
  const { data: kpis, isLoading, isError, error, refetch, isRefetching } =
    useOwnerDashboardKPIs(businessId);

  const today = formatDateLong(new Date());
  const upcoming = kpis?.upcoming_today ?? [];

  return (
    <View style={styles.flex}>
      <OwnerBusinessHeader />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
      >
        <Text style={styles.date}>{today}</Text>

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          onRetry={() => void refetch()}
        >
          <View style={styles.statsGrid}>
            <StatCard
              label={t('owner.appointmentsToday')}
              value={String(kpis?.today?.total ?? 0)}
              hint={`${kpis?.today?.remaining ?? 0} ${t('owner.remaining')}`}
            />
            <StatCard
              label={t('owner.weekRevenue')}
              value={formatCurrency(kpis?.this_week?.revenue ?? 0)}
              hint={`${kpis?.this_week?.completed ?? 0} ${t('owner.completed')}`}
            />
            <StatCard
              label={t('owner.monthRevenue')}
              value={formatCurrency(kpis?.this_month?.revenue ?? 0)}
              hint={`${kpis?.this_month?.total ?? 0} ${t('owner.bookings')}`}
            />
            <StatCard
              label={t('owner.activeClients')}
              value={String(kpis?.active_clients_total ?? 0)}
              hint={
                (kpis?.avg_rating ?? 0) > 0
                  ? `★ ${(kpis!.avg_rating).toFixed(1)}`
                  : t('owner.noRatingYet')
              }
            />
          </View>

          <Text style={ownerStyles.sectionTitle}>{t('owner.todaysAppointments')}</Text>
          {upcoming.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.empty}>{t('owner.noAppointmentsToday')}</Text>
            </View>
          ) : (
            upcoming.slice(0, 5).map((a) => (
              <Pressable
                key={a.id}
                style={styles.apptCard}
                onPress={() => router.push('/(app)/owner/appointments' as Href)}
              >
                <View style={styles.apptRow}>
                  <Text style={styles.apptTime}>{formatTime(a.starts_at)}</Text>
                  <StatusBadge status={a.status} />
                </View>
                <Text style={styles.apptClient}>{a.client_name}</Text>
                <Text style={styles.apptMeta}>
                  {a.service_name} · {a.staff_name}
                </Text>
              </Pressable>
            ))
          )}
        </QueryState>

        <Text style={ownerStyles.sectionTitle}>{t('owner.management')}</Text>
        <View style={styles.navGrid}>
          {OWNER_QUICK_NAV.map((item) => (
            <Pressable
              key={item.key}
              style={styles.navCard}
              onPress={() => router.push(item.href as Href)}
            >
              <Text style={styles.navTitle}>{item.title}</Text>
              <Text style={styles.navSub}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  date: { fontSize: 14, color: ownerColors.textMuted, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginBottom: 12,
  },
  empty: { fontSize: 15, color: ownerColors.textMuted },
  apptCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  apptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  apptTime: { fontSize: 15, fontWeight: '700', color: ownerColors.primary },
  apptClient: { fontSize: 16, fontWeight: '600', color: ownerColors.text },
  apptMeta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 2 },
  navGrid: { gap: 10 },
  navCard: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
  },
  navTitle: { fontSize: 16, fontWeight: '600', color: ownerColors.text },
  navSub: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
});

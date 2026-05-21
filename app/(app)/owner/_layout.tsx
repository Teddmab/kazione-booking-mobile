import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingScreen } from '@/components/LoadingScreen';
import { ownerColors } from '@/constants/ownerTheme';
import { useTenantContext } from '@/contexts/TenantContext';

export default function OwnerLayout() {
  const { tenant, loading, error } = useTenantContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !tenant) {
    return <Redirect href="/" />;
  }

  if (tenant.role !== 'owner' && tenant.role !== 'manager') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: ownerColors.bg },
        headerTintColor: ownerColors.primary,
        headerTitleStyle: { fontWeight: '600', color: ownerColors.text },
        tabBarStyle: {
          backgroundColor: ownerColors.bg,
          borderTopColor: ownerColors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: ownerColors.primary,
        tabBarInactiveTintColor: ownerColors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Team',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
      {/* Non-tab screens — hidden from tab bar */}
      <Tabs.Screen name="clients" options={{ href: null, title: 'Clients' }} />
      <Tabs.Screen name="services" options={{ href: null, title: 'Services' }} />
      <Tabs.Screen name="storefront" options={{ href: null, title: 'Storefront' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
      <Tabs.Screen name="finance" options={{ href: null, title: 'Revenue' }} />
      <Tabs.Screen name="reports" options={{ href: null, title: 'Reports' }} />
    </Tabs>
  );
}

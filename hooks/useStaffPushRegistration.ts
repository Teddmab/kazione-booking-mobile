import { useEffect, useRef } from "react";
import { useRouter, type Href } from "expo-router";
import * as Notifications from "expo-notifications";

import { useAuthContext } from "@/contexts/AuthContext";
import {
  parseStaffPushData,
  registerForPushNotifications,
  syncPushTokenWithBackend,
} from "@/lib/pushNotifications";
import { staffHrefForPushData } from "@/lib/pushRouting";

let handledResponseId: string | null = null;

function navigateFromResponse(
  router: ReturnType<typeof useRouter>,
  response: Notifications.NotificationResponse,
) {
  const responseId = response.notification.request.identifier;
  if (handledResponseId === responseId) return;
  handledResponseId = responseId;

  const raw = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  const href = staffHrefForPushData(parseStaffPushData(raw));
  router.push(href as Href);
}

/**
 * Registers the Expo push token with the backend after staff auth,
 * and routes taps on remote notifications into staff screens.
 */
export function useStaffPushRegistration(enabled = true) {
  const { user } = useAuthContext();
  const router = useRouter();
  const userId = user?.id ?? "";
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      registeredFor.current = null;
      return;
    }
    if (registeredFor.current === userId) return;

    let cancelled = false;

    void (async () => {
      const token = await registerForPushNotifications();
      if (cancelled || !token) return;
      await syncPushTokenWithBackend(token);
      if (!cancelled) registeredFor.current = userId;
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromResponse(router, response);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) navigateFromResponse(router, response);
    });

    return () => sub.remove();
  }, [enabled, router]);
}

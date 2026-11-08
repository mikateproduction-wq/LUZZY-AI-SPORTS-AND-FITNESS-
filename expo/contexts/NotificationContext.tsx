import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FitnessLevel } from '@/types/fitness';
import { logger } from '@/utils/logger';

const NOTIF_STORAGE_KEY = '@luzzy_notifications_v2';

export type NotifFrequency = 'daily' | 'every3days' | 'weekly';

export interface NotifPreferences {
  enabled: boolean;
  frequency: NotifFrequency;
  hour: number;
  minute: number;
}

const DEFAULT_PREFS: NotifPreferences = {
  enabled: false,
  frequency: 'every3days',
  hour: 9,
  minute: 0,
};

function getDefaultFrequency(level?: FitnessLevel): NotifFrequency {
  if (level === 'expert') return 'daily';
  if (level === 'intermediate') return 'every3days';
  return 'weekly';
}

const MOTIVATION_MESSAGES: Record<string, { title: string; body: string }[]> = {
  fr: [
    { title: "C'est l'heure ! 💪", body: "Ton entraînement t'attend. Chaque pas compte !" },
    { title: 'Allez, on bouge ! 🔥', body: 'Même 15 minutes font la différence. Lance-toi !' },
    { title: 'Tu es en forme ! 🏋️', body: 'Continue sur ta lancée, tu progresses chaque jour.' },
    { title: 'Objectif du jour 🎯', body: 'Un petit effort aujourd\'hui, de grands résultats demain.' },
    { title: "Pas d'excuses ! ⚡", body: 'Ton corps te remerciera. C\'est parti !' },
  ],
  en: [
    { title: 'Time to train! 💪', body: 'Your workout is waiting. Every step counts!' },
    { title: "Let's move! 🔥", body: 'Even 15 minutes make a difference. Go for it!' },
    { title: "You're on fire! 🏋️", body: 'Keep the momentum, you\'re improving every day.' },
    { title: "Today's goal 🎯", body: 'A small effort today, big results tomorrow.' },
    { title: 'No excuses! ⚡', body: 'Your body will thank you. Let\'s go!' },
  ],
  es: [
    { title: '¡Hora de entrenar! 💪', body: 'Tu entrenamiento te espera. ¡Cada paso cuenta!' },
    { title: '¡Vamos a moverse! 🔥', body: 'Incluso 15 minutos marcan la diferencia. ¡Hazlo!' },
    { title: '¡Estás en forma! 🏋️', body: 'Sigue así, mejoras cada día.' },
    { title: 'Objetivo del día 🎯', body: 'Un pequeño esfuerzo hoy, grandes resultados mañana.' },
    { title: '¡Sin excusas! ⚡', body: 'Tu cuerpo te lo agradecerá. ¡Vamos!' },
  ],
  pt: [
    { title: 'Hora de treinar! 💪', body: 'O teu treino está à tua espera. Cada passo conta!' },
    { title: 'Vamos mexer! 🔥', body: 'Mesmo 15 minutos fazem a diferença. Vai a isso!' },
    { title: 'Estás em forma! 🏋️', body: 'Continua no ritmo, estás a melhorar todos os dias.' },
    { title: 'Objetivo do dia 🎯', body: 'Um pequeno esforço hoje, grandes resultados amanhã.' },
    { title: 'Sem desculpas! ⚡', body: 'O teu corpo vai agradecer. Vamos!' },
  ],
  tr: [
    { title: 'Antrenman zamanı! 💪', body: 'Antrenmanın seni bekliyor. Her adım sayılır!' },
    { title: 'Hadi hareketlen! 🔥', body: 'Sadece 15 dakika bile fark yaratır. Hadi başla!' },
    { title: 'Formdasın! 🏋️', body: 'İvmeni koru, her gün gelişiyorsun.' },
    { title: "Günün hedefi 🎯", body: 'Bugün küçük bir çaba, yarın büyük sonuçlar.' },
    { title: 'Mazeret yok! ⚡', body: 'Vücudun sana teşekkür edecek. Hadi başlayalım!' },
  ],
  ru: [
    { title: 'Время тренировки! 💪', body: 'Твоя тренировка ждет. Каждый шаг важен!' },
    { title: 'Давай двигаться! 🔥', body: 'Даже 15 минут имеют значение. Вперед!' },
    { title: 'Ты в форме! 🏋️', body: 'Продолжай в том же духе, ты улучшаешься каждый день.' },
    { title: 'Цель дня 🎯', body: 'Малое усилие сегодня, большие результаты завтра.' },
    { title: 'Без отговорок! ⚡', body: 'Твое тело скажет тебе спасибо. Вперед!' },
  ],
  hi: [
    { title: 'व्यायाम का समय! 💪', body: 'आपका वर्कआउट इंतजार कर रहा है। हर कदम मायने रखता है!' },
    { title: 'चलो चलें! 🔥', body: 'सिर्फ 15 मिनट भी फर्क करते हैं। आगे बढ़ें!' },
    { title: 'आप फिट हैं! 🏋️', body: 'लगातार बने रहें, आप हर दिन बेहतर हो रहे हैं।' },
    { title: 'आज का लक्ष्य 🎯', body: 'आज थोड़ी मेहनत, कल बड़े परिणाम।' },
    { title: 'कोई बहाना नहीं! ⚡', body: 'आपका शरीर आपका धन्यवाद करेगा। चलिए शुरू करें!' },
  ],
  zh: [
    { title: '训练时间！💪', body: '你的训练在等着你。每一步都算数！' },
    { title: '动起来！🔥', body: '即使15分钟也有作用。去吧！' },
    { title: '你状态很好！🏋️', body: '保持动力，你每天都在进步。' },
    { title: '今日目标 🎯', body: '今天小努力，明天大成果。' },
    { title: '没有借口！⚡', body: '你的身体会感谢你。开始吧！' },
  ],
  ar: [
    { title: 'وقت التمرين! 💪', body: 'تمرينك في انتظارك. كل خطوة تحسب!' },
    { title: 'هيا نتحرك! 🔥', body: 'حتى 15 دقيقة تحدث فرقاً. انطلق!' },
    { title: 'أنت بصحة جيدة! 🏋️', body: 'استمر في الزخم، أنت تتحسن كل يوم.' },
    { title: 'هدف اليوم 🎯', body: 'جهد صغير اليوم، نتائج كبيرة غداً.' },
    { title: 'لا أعذار! ⚡', body: 'جسمك سيشكرك. هيا بنا!' },
  ],
  ln: [
    { title: 'Ntango ya mateya! 💪', body: 'Mateya na yo ezali kolingela yo. Matendo nionso etali!' },
    { title: 'Tika kotambola! 🔥', body: 'Ata miniti 15 esalisa mingi. Banda lelo!' },
    { title: 'Ozali makasi! 🏋️', body: 'Koba na mpiko, ozali kobakisa mosusu na mosusu.' },
    { title: 'Tina ya lelo 🎯', body: 'Misala moke lelo, bizaleli minene lobi.' },
    { title: 'Likaki te! ⚡', body: 'Nzoto na yo ekolobela yo merci. Tinda!' },
  ],
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const { profile } = useProfile();
  const { language } = useLanguage();
  const [prefs, setPrefs] = useState<NotifPreferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const checkPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPermissionGranted(false);
      return;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
      logger.log('[Notifications] permission checked', { granted: status === 'granted' });
    } catch (error) {
      logger.error('[Notifications] permission check error', error);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      logger.log('[Notifications] web platform - skipping permission request');
      return false;
    }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      logger.log('[Notifications] permission requested', { granted });
      return granted;
    } catch (error) {
      logger.error('[Notifications] permission request error', error);
      return false;
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as NotifPreferences;
        setPrefs(parsed);
      } else if (profile?.fitnessLevel) {
        setPrefs(prev => ({
          ...prev,
          frequency: getDefaultFrequency(profile.fitnessLevel),
        }));
      }
    } catch (error) {
      logger.error('[Notifications] preferences loading error', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.fitnessLevel]);

  useEffect(() => {
    void loadPreferences();
    void checkPermission();

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      logger.log('[Notifications] received');
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.log('[Notifications] response received');
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [loadPreferences, checkPermission]);

  useEffect(() => {
    if (!isLoading && prefs.enabled && permissionGranted) {
      void scheduleNotifications(prefs, languageRef.current);
    }
  }, [prefs, isLoading, permissionGranted]);

  const savePreferences = useCallback(async (newPrefs: NotifPreferences) => {
    try {
      setPrefs(newPrefs);
      await AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(newPrefs));
      logger.log('[Notifications] preferences saved', { enabled: newPrefs.enabled, frequency: newPrefs.frequency });

      if (newPrefs.enabled && permissionGranted) {
        await scheduleNotifications(newPrefs, languageRef.current);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        logger.log('[Notifications] scheduled notifications cancelled');
      }
    } catch (error) {
      logger.error('[Notifications] preferences saving error', error);
    }
  }, [permissionGranted]);

  const scheduleNotifications = async (p: NotifPreferences, lang: string) => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const messages = MOTIVATION_MESSAGES[lang] || MOTIVATION_MESSAGES.en;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];

      if (p.frequency === 'daily') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: randomMsg.title,
            body: randomMsg.body,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: p.hour,
            minute: p.minute,
          },
        });
        logger.log('[Notifications] daily notification scheduled');
      } else {
        const intervalDays = p.frequency === 'every3days' ? 3 : 7;
        const now = new Date();
        const nextTrigger = new Date();
        nextTrigger.setHours(p.hour, p.minute, 0, 0);

        if (nextTrigger <= now) {
          nextTrigger.setDate(nextTrigger.getDate() + 1);
        }

        for (let i = 0; i < 10; i++) {
          const triggerDate = new Date(nextTrigger.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
          const msg = messages[i % messages.length];

          await Notifications.scheduleNotificationAsync({
            content: {
              title: msg.title,
              body: msg.body,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });
        }
        logger.log('[Notifications] recurring notifications scheduled', { intervalDays });
      }
    } catch (error) {
      logger.error('[Notifications] scheduling error', error);
    }
  };

  const toggleEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && !permissionGranted) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission requise',
          'Les notifications nécessitent votre autorisation. Activez-les dans les paramètres.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    const newPrefs = { ...prefs, enabled };
    await savePreferences(newPrefs);
    return true;
  }, [prefs, permissionGranted, requestPermission, savePreferences]);

  const updateFrequency = useCallback(async (frequency: NotifFrequency) => {
    const newPrefs = { ...prefs, frequency };
    await savePreferences(newPrefs);
  }, [prefs, savePreferences]);

  const updateTime = useCallback(async (hour: number, minute: number) => {
    const newPrefs = { ...prefs, hour, minute };
    await savePreferences(newPrefs);
  }, [prefs, savePreferences]);

  const sendTestNotification = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      const messages = MOTIVATION_MESSAGES[language] || MOTIVATION_MESSAGES.en;
      const msg = messages[0];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 2000),
        },
      });
    } catch (error) {
      logger.error('[Notifications] test error', error);
    }
  }, [language]);

  return useMemo(() => ({
    prefs,
    isLoading,
    permissionGranted,
    toggleEnabled,
    updateFrequency,
    updateTime,
    requestPermission,
    getDefaultFrequency,
    sendTestNotification,
  }), [
    prefs,
    isLoading,
    permissionGranted,
    toggleEnabled,
    updateFrequency,
    updateTime,
    requestPermission,
    sendTestNotification,
  ]);
});

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type NuriPersonality = 'friendly' | 'professional' | 'strict';
export type NuriVoiceType = 'female' | 'male' | 'neutral';
export type ProductScanPriority = 'barcode' | 'image';
export type ProductSensitivity = 'strict' | 'balanced' | 'lenient';
export type UnitSystem = 'kg' | 'lbs';

export interface AppSettings {
  childSafetyMode: boolean;

  nuriPersonality: NuriPersonality;
  nuriVoiceEnabled: boolean;
  nuriVoiceType: NuriVoiceType;
  nuriLanguage: string;
  nuriAllowHealthData: boolean;

  notifyExpiry7d: boolean;
  notifyExpiry3d: boolean;
  notifyExpiry1d: boolean;
  notifyExpirySameDay: boolean;
  notifyAllergy: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;

  productAutoScan: boolean;
  productScanPriority: ProductScanPriority;
  productSensitivity: ProductSensitivity;

  privacyBiometricLock: boolean;
  privacyApiPermissions: boolean;

  appLanguage: string;
  voiceLanguage: string;
  textSize: number;
  highContrastMode: boolean;

  darkMode: boolean;
  units: UnitSystem;
  region: string;

  debugMode: boolean;
}

const SETTINGS_STORAGE_KEY = 'defendish.app.settings.v1';

function applyThemeFromSettings(darkMode: boolean) {
  const targetScheme = darkMode ? 'dark' : 'light';
  try {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(targetScheme);
    }
  } catch (error) {
    // Keep app usable even if runtime does not support scheme override.
  }
}

export const defaultSettings: AppSettings = {
  childSafetyMode: true,

  nuriPersonality: 'friendly',
  nuriVoiceEnabled: false,
  nuriVoiceType: 'female',
  nuriLanguage: 'English',
  nuriAllowHealthData: true,

  notifyExpiry7d: true,
  notifyExpiry3d: true,
  notifyExpiry1d: true,
  notifyExpirySameDay: true,
  notifyAllergy: true,
  notifyEmail: false,
  notifyPush: true,

  productAutoScan: true,
  productScanPriority: 'barcode',
  productSensitivity: 'balanced',

  privacyBiometricLock: false,
  privacyApiPermissions: true,

  appLanguage: 'English',
  voiceLanguage: 'English',
  textSize: 16,
  highContrastMode: false,

  darkMode: false,
  units: 'kg',
  region: 'India',

  debugMode: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          const merged = { ...defaultSettings, ...parsed };
          setSettings(merged);
          applyThemeFromSettings(merged.darkMode);
        } else {
          applyThemeFromSettings(defaultSettings.darkMode);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const persist = useCallback(async (nextSettings: AppSettings) => {
    setSettings(nextSettings);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const next = { ...settings, [key]: value };
      if (key === 'darkMode') {
        applyThemeFromSettings(Boolean(value));
      }
      await persist(next);
    },
    [persist, settings]
  );

  const updateMany = useCallback(
    async (partial: Partial<AppSettings>) => {
      const next = { ...settings, ...partial };
      if (typeof partial.darkMode === 'boolean') {
        applyThemeFromSettings(partial.darkMode);
      }
      await persist(next);
    },
    [persist, settings]
  );

  const resetSettings = useCallback(async () => {
    applyThemeFromSettings(defaultSettings.darkMode);
    await persist(defaultSettings);
  }, [persist]);

  return {
    settings,
    isLoaded,
    updateSetting,
    updateMany,
    resetSettings,
  };
}

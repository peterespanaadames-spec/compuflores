import { authenticatedFetch } from './supabase/api';

export interface PrintSettings {
  defaultFormat: 'ticket58' | 'ticket80' | 'carta' | 'pdf';
  cashDrawerTrigger: boolean;
  headerMessage: string;
  footerMessage: string;
}

const STORAGE_KEY = 'frenyer_print_settings';

const DEFAULTS: PrintSettings = {
  defaultFormat: 'ticket80',
  cashDrawerTrigger: true,
  headerMessage: '¡Gracias por su compra en Bella Vista!',
  footerMessage: 'Conserve su ticket para cambios dentro de las 48 horas.'
};

export function getPrintSettings(): PrintSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
}

export function savePrintSettings(settings: Partial<PrintSettings>): PrintSettings {
  const current = getPrintSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('frenyer:print-settings-updated', { detail: updated }));
  } catch (e) {
    console.error('Error saving print settings:', e);
  }
  return updated;
}

export async function refreshPrintSettingsFromServer(): Promise<PrintSettings> {
  try {
    const res = await authenticatedFetch('/api/print-settings');
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        return savePrintSettings(json.data);
      }
    }
  } catch {
    // ignore
  }
  return getPrintSettings();
}
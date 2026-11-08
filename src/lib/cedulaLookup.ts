/**
 * Consulta de datos de persona natural por cédula contra el servicio
 * cedula.com.ve, SIEMPRE por medio del proxy del servidor
 * (`/api/cedula-lookup`): las credenciales nunca viajan al navegador.
 */
import { useCallback, useRef } from 'react';
import { authenticatedFetch } from './supabase/api';

export interface CedulaIdentity {
  nacionalidad: string;
  cedula: string;
  rif: string;
  names: string;
  lastNames: string;
  fullName: string;
}

export interface CedulaLocation {
  estado: string;
  municipio: string;
  parroquia: string;
  centroElectoral: string;
}

export interface CedulaLookupData {
  found: true;
  cached: boolean;
  identity: CedulaIdentity;
  location: CedulaLocation;
}

export type CedulaLookupOutcome =
  | { ok: true; data: CedulaLookupData }
  | { ok: false; reason: 'not-configured' | 'invalid' | 'not-found' | 'unavailable'; message: string };

/** Acepta "V-12345678", "V12345678", "12345678" (sin letra asume V). */
export function parseCedulaDoc(input: string): { nacionalidad: 'V' | 'E'; digits: string; normalized: string } | null {
  const normalized = input.trim().toUpperCase().replace(/[\s.\-–]/g, '');
  const match = normalized.match(/^([VE]?)(\d{5,9})$/);
  if (!match) return null;
  const nacionalidad = (match[1] || 'V') as 'V' | 'E';
  if (match[2].startsWith('0')) return null;
  return { nacionalidad, digits: match[2], normalized: `${nacionalidad}-${match[2]}` };
}

/** ¿Es un tipo de documento consultable por el API? (personas naturales V/E) */
export function isConsultaDocType(docType: string): boolean {
  return docType.trim().toLowerCase().startsWith('natural');
}

/** Texto de dirección armado con la ubicación devuelta por el registro. */
export function buildCedulaLocationText(location: CedulaLocation | undefined): string {
  if (!location) return '';
  return [location.estado, location.municipio, location.parroquia]
    .filter((part) => part.trim().length > 0)
    .map((part) => part.trim())
    .join(' · ');
}

export async function lookupCedula(doc: string): Promise<CedulaLookupOutcome> {
  const parsed = parseCedulaDoc(doc);
  if (!parsed) {
    return { ok: false, reason: 'invalid', message: 'Cédula inválida: usa V o E seguido de 5 a 9 dígitos.' };
  }

  try {
    const response = await authenticatedFetch(
      `/api/cedula-lookup?doc=${encodeURIComponent(parsed.normalized)}`
    );
    const json = await response.json().catch(() => null);

    if (response.status === 503) {
      return {
        ok: false,
        reason: 'not-configured',
        message: (json && json.message) || 'El autocompletado por cédula aún no está configurado en el servidor.'
      };
    }
    if (response.status === 429) {
      return { ok: false, reason: 'unavailable', message: (json && json.error) || 'Demasiadas consultas seguidas, espera un momento.' };
    }
    if (response.status === 400) {
      return { ok: false, reason: 'invalid', message: (json && json.error) || 'Cédula inválida.' };
    }
    if (!response.ok || !json || !json.found) {
      return { ok: false, reason: 'not-found', message: (json && json.error) || 'No se encontró a la persona en el registro.' };
    }

    return {
      ok: true,
      data: {
        found: true,
        cached: Boolean(json.cached),
        identity: {
          nacionalidad: json.identity?.nacionalidad ?? parsed.nacionalidad,
          cedula: json.identity?.cedula ?? parsed.digits,
          rif: json.identity?.rif ?? '',
          names: json.identity?.names ?? '',
          lastNames: json.identity?.lastNames ?? '',
          fullName: json.identity?.fullName ?? ''
        },
        location: {
          estado: json.location?.estado ?? '',
          municipio: json.location?.municipio ?? '',
          parroquia: json.location?.parroquia ?? '',
          centroElectoral: json.location?.centroElectoral ?? json.location?.centro_electoral ?? ''
        }
      }
    };
  } catch {
    return { ok: false, reason: 'unavailable', message: 'No se pudo contactar el servicio de consulta de cédulas.' };
  }
}

export interface CedulaAutofillHandlers {
  /** Asigna el RIF devuelto por el registro en el campo de documento. */
  setDoc(value: string): void;
  /** Asigna nombres y apellidos en el campo de nombre. */
  setName(value: string): void;
  /** Asigna «Estado · Municipio · Parroquia» en el campo de dirección (si existe). */
  setAddress?(value: string): void;
}

/**
 * Coloca los datos devueltos por el registro en los campos del formulario.
 * Regla: el nombre y la dirección se sobrescriben solo si el usuario no
 * escribió algo propio (vacíos o si el valor actual fue autocompletado
 * antes); los campos quedan editables en cualquier caso.
 */
export function useCedulaAutofill(notify?: (message: string) => void) {
  const lastAutoRef = useRef<{ name?: string; address?: string }>({});

  return useCallback(
    (data: CedulaLookupData, set: CedulaAutofillHandlers, current: { name: string; address?: string }) => {
      const rif = data.identity.rif.trim();
      if (rif) set.setDoc(rif);

      const locText = buildCedulaLocationText(data.location);
      const previousAuto = lastAutoRef.current;

      const identity = data.identity.fullName.trim();
      if (identity) {
        const overwriteName = !current.name.trim() || current.name.trim() === (previousAuto.name ?? '');
        if (overwriteName) set.setName(identity);
      }

      if (locText && set.setAddress) {
        const overwriteAddress = !current.address || !current.address.trim() || current.address.trim() === (previousAuto.address ?? '');
        if (overwriteAddress) set.setAddress(locText);
      }

      lastAutoRef.current = { name: identity, address: locText };

      if (identity && notify) {
        notify(`Datos cargados desde el registro: ${identity}${data.cached ? ' (en caché)' : ''}.`);
      }
    },
    [notify]
  );
}

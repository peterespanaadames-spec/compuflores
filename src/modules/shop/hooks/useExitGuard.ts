import { useCallback, useEffect, useRef, useState } from 'react';

interface UseExitGuardOptions {
  /**
   * Activa el guardia solo cuando exista riesgo real
   * (carrito con contenido o sesión activa del usuario).
   */
  enabled: boolean;
  /**
   * Acción al confirmar «Abandonar sistema».
   * Por defecto: retrocede al punto donde el usuario estaba antes de entrar a la tienda.
   */
  onAbandon?: () => void;
}

interface UseExitGuardResult {
  /** true mientras el usuario intentó salir y debe verse el modal interno. */
  isExitPromptOpen: boolean;
  /** El usuario elige permanecer: se cierra el aviso y el guardia sigue armado. */
  stay: () => void;
  /** El usuario confirma salir: desarma el guardia y abandona la vista. */
  abandon: () => void;
}

/** Marca del centinela en el history (SPA): distingue popstate propios de otros. */
const EXIT_GUARD_SENTINEL_FLAG = 'frenyerExitGuardSentinel';
/** Límite defensivo: nunca re-armar más de N centinelas en cadena. */
const MAX_SENTINEL_DEPTH = 20;

/**
 * Guardia de salida incondicional del carrito / sesión.
 *
 * Capas de protección:
 *  1. `beforeunload` (nativo): advierte al cerrar pestaña, recargar o salir del dominio.
 *     Respetado por Chrome/Firefox/Edge de escritorio (y Android Chrome). Los navegadores
 *     móviles modernos (iOS Safari/Chrome) NO muestran diálogos nativos en `beforeunload`;
 *     es una limitación del navegador, por eso el guardia complementa con la capa SPA.
 *  2. Centinela en el history: al montar empuja una entrada "trampa" (mismá URL) y escucha
 *     `popstate`; el botón «Atrás» (o la navegación interna de la SPA) abre el modal interno
 *     de confirmación en vez de irse en silencio. Esto funciona igual en móvil y escritorio.
 *
 * El guardia es inofensivo si no hay riesgo: mientras `enabled` sea falso no toca el
 * history ni interfiere con la navegación.
 */
export function useExitGuard({ enabled, onAbandon }: UseExitGuardOptions): UseExitGuardResult {
  const [isExitPromptOpen, setIsExitPromptOpen] = useState(false);
  const isPromptOpenRef = useRef(false);
  /** Cantidad de centinelas vivos apilados sobre el history real. */
  const sentinelDepthRef = useRef(0);
  const onAbandonRef = useRef(onAbandon);
  /** Desmonta los listeners sin esperar el cleanup del efecto (lo usa `abandon`). */
  const teardownRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onAbandonRef.current = onAbandon;
  }, [onAbandon]);

  useEffect(() => {
    if (!enabled) return undefined;

    const armSentinel = () => {
      if (sentinelDepthRef.current >= MAX_SENTINEL_DEPTH) return;
      window.history.pushState({ [EXIT_GUARD_SENTINEL_FLAG]: true }, '');
      sentinelDepthRef.current += 1;
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Advertencia nativa del navegador: texto y botones los decide el navegador,
      // no se puede personalizar (estándar de seguridad del web).
      event.preventDefault();
      event.returnValue = '';
    };

    const handlePopState = () => {
      // Solo reaccionamos si hay un centinela propio bajo el cursor del history.
      if (sentinelDepthRef.current > 0) sentinelDepthRef.current -= 1;
      if (isPromptOpenRef.current) return;
      isPromptOpenRef.current = true;
      setIsExitPromptOpen(true);
      // El «Atrás» consumió el centinela: se re-arma para seguir protegiendo
      // los siguientes intentos de salida (escritorio y móvil por igual).
      if (sentinelDepthRef.current === 0) armSentinel();
    };

    const teardown = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      teardownRef.current = null;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    teardownRef.current = teardown;
    armSentinel();

    return teardown;
  }, [enabled]);

  const stay = useCallback(() => {
    isPromptOpenRef.current = false;
    setIsExitPromptOpen(false);
    // El centinela ya está re-armado por el propio handler de popstate.
  }, []);

  const abandon = useCallback(() => {
    // 1) Desarma todo ANTES de navegar, para que las popstate del salto
    //    no reabran el modal y el router pueda procesar la salida limpia.
    teardownRef.current?.();
    const depth = sentinelDepthRef.current;
    isPromptOpenRef.current = false;
    setIsExitPromptOpen(false);
    sentinelDepthRef.current = 0;
    // 2) Acción de salida: callback del consumidor, o retroceder los centinelas
    //    acumulados y aterrizar en la página anterior real del usuario.
    const abandonAction = onAbandonRef.current;
    if (abandonAction) {
      abandonAction();
      return;
    }
    if (depth > 0) {
      window.history.go(-depth);
    } else {
      window.history.go(-1);
    }
  }, []);

  return { isExitPromptOpen, stay, abandon };
}

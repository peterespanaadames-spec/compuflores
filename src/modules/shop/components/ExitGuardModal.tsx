import { ShieldAlert, X } from 'lucide-react';

interface ExitGuardModalProps {
  isOpen: boolean;
  /** El usuario elige quedarse: cierra el aviso sin perder nada. */
  onStay: () => void;
  /** El usuario confirma salir del sistema. */
  onAbandon: () => void;
}

/**
 * Modal de respaldo interno del guardia de salida (banner flotante).
 *
 * Complementa la advertencia nativa de `beforeunload` (que los navegadores
 * móviles no muestran) cuando el usuario intenta retroceder en el navegador
 * o navegar dentro de la SPA. Adaptable: hoja inferior a ancho completo en
 * móvil y banner compacto en la esquina inferior derecha en escritorio.
 */
export function ExitGuardModal({ isOpen, onStay, onAbandon }: ExitGuardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="eg-root">
      <style>{`
        .eg-root .eg-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(3px);
          z-index: 1600;
        }
        .eg-root .eg-banner {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: 84px;
          z-index: 1601;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.28);
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: eg-rise 0.22s ease-out;
        }
        @keyframes eg-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .eg-root .eg-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .eg-root .eg-icon {
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #fef3c7;
          color: #b45309;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .eg-root .eg-title {
          margin: 0;
          font-size: 14.5px;
          font-weight: 800;
          color: #1e293b;
        }
        .eg-root .eg-message {
          margin: 4px 0 0;
          font-size: 12.5px;
          line-height: 1.45;
          color: #64748b;
        }
        .eg-root .eg-close {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #94a3b8;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .eg-root .eg-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .eg-root .eg-stay {
          width: 100%;
          border: none;
          border-radius: 10px;
          background: #2d2e32;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          padding: 11px 14px;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .eg-root .eg-stay:hover { opacity: 0.88; }
        .eg-root .eg-leave {
          width: 100%;
          background: transparent;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .eg-root .eg-leave:hover { background: #fef2f2; }

        /* Escritorio: banner compacto en la esquina inferior derecha */
        @media (min-width: 768px) {
          .eg-root .eg-banner {
            left: auto;
            bottom: 24px;
            width: 372px;
            right: 24px;
            padding: 16px;
          }
          .eg-root .eg-actions {
            flex-direction: row;
          }
          .eg-root .eg-stay, .eg-root .eg-leave {
            width: auto;
            flex: 1;
            white-space: nowrap;
          }
        }
      `}</style>

      <div className="eg-backdrop" onClick={onStay} />

      <div
        className="eg-banner"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="eg-title"
      >
        <div className="eg-head">
          <div className="eg-icon">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p id="eg-title" className="eg-title">Cuidado: puedes perder tu carrito</p>
            <p className="eg-message">
              Tienes artículos en tu carrito. Si sales o recargas ahora podrías perder
              tu selección.
            </p>
          </div>
          <button type="button" className="eg-close" onClick={onStay} aria-label="Cerrar aviso">
            <X size={15} />
          </button>
        </div>
        <div className="eg-actions">
          <button type="button" className="eg-stay" onClick={onStay}>
            ¿Quieres permanecer aquí?
          </button>
          <button type="button" className="eg-leave" onClick={onAbandon}>
            Abandonar sistema
          </button>
        </div>
      </div>
    </div>
  );
}

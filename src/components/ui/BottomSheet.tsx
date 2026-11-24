"use client";

import { AnimatePresence, motion, PanInfo, useDragControls } from "framer-motion";
import { useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** altura máxima em vh (padrão 86) */
  maxHeightVh?: number;
  showHandle?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  children,
  className,
  maxHeightVh = 86,
  showHandle = true,
}: BottomSheetProps) {
  // `dragListener={false}` + iniciar o arrasto só a partir da alcinha (pelo onPointerDown
  // abaixo) é importante: com `drag="y"` ouvindo o corpo inteiro da folha, um toque real num
  // botão lá dentro (ex.: "Dirigir até lá") podia ser interpretado como o início de um arrasto
  // no celular, e o clique nunca chegava a disparar — bug visto num iPhone real.
  const dragControls = useDragControls();

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 120 || info.velocity.y > 600) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface pb-safe shadow-[var(--shadow-sheet)] ${className ?? ""}`}
            style={{ maxHeight: `${maxHeightVh}vh` }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            {showHandle && (
              <div
                className="flex justify-center pt-2.5 pb-1"
                onPointerDown={(e) => dragControls.start(e)}
                style={{ touchAction: "none" }}
              >
                <div className="h-1.5 w-10 rounded-full bg-border-subtle" />
              </div>
            )}
            <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: `calc(${maxHeightVh}vh - 24px)` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

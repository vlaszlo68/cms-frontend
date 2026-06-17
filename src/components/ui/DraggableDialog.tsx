import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";

type DraggableDialogProps = {
  labelledBy?: string;
  className?: string;
  children: ReactNode;
};

type Position = {
  x: number;
  y: number;
};

type DragState = {
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

function shouldStartDrag(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    !target.closest("button, a, input, textarea, select, label, iframe, [data-no-drag]")
  );
}

function clampPosition(position: Position, element: HTMLElement | null): Position {
  if (!element) {
    return position;
  }

  const rect = element.getBoundingClientRect();
  const maxX = Math.max(0, (window.innerWidth - rect.width) / 2 - 12);
  const maxY = Math.max(0, (window.innerHeight - rect.height) / 2 - 12);

  return {
    x: Math.min(maxX, Math.max(-maxX, position.x)),
    y: Math.min(maxY, Math.max(-maxY, position.y)),
  };
}

export default function DraggableDialog({
  labelledBy,
  className,
  children,
}: DraggableDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !shouldStartDrag(event.target)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: position.x,
      startY: position.y,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    const nextPosition = {
      x: dragState.startX + event.clientX - dragState.startClientX,
      y: dragState.startY + event.clientY - dragState.startClientY,
    };

    setPosition(clampPosition(nextPosition, dialogRef.current));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current) {
      return;
    }

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      aria-labelledby={labelledBy}
      aria-modal="true"
      className="modal-backdrop"
      role="dialog"
    >
      <div
        className={`confirm-dialog draggable-dialog${className ? ` ${className}` : ""}`}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={dialogRef}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

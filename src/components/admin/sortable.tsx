"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DragHandleProps {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
}

export function DragHandle({
  attributes,
  listeners,
  className,
}: DragHandleProps & { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className={cn(
        "hover:text-ink flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 active:cursor-grabbing",
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

function SortableItem({
  id,
  children,
  className,
}: {
  id: string;
  children: (handle: DragHandleProps) => ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(className, isDragging && "relative z-10 opacity-80 shadow-lg")}
    >
      {children({ attributes, listeners })}
    </div>
  );
}

/** Drag-and-drop reorderable list or grid with keyboard support. */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  layout = "list",
  className,
  itemClassName,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, handle: DragHandleProps) => ReactNode;
  layout?: "list" | "grid";
  className?: string;
  itemClassName?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from !== -1 && to !== -1) onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id} className={itemClassName}>
              {(handle) => renderItem(item, index, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

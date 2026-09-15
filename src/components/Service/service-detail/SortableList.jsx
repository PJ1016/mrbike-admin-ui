import React, { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

// Generic drag-to-reorder list, extracted so images, essential items,
// optional items, benefits and FAQs all reorder identically. Mirrors the
// dnd-kit setup ServiceCategories.jsx already uses (PointerSensor with a 5px
// activation distance so a click still reads as a click, not a drag).
//
// Ordering is positional: the backend re-derives every `order` field from
// array index on save, so the array this emits IS the order. Nothing here
// needs to manage order numbers.

export const DragHandle = ({ attributes, listeners, sx }) => (
  <Box
    {...attributes}
    {...listeners}
    sx={{
      cursor: "grab",
      color: "#94a3b8",
      display: "flex",
      alignItems: "center",
      touchAction: "none",
      "&:active": { cursor: "grabbing" },
      ...sx,
    }}
  >
    <DragIndicatorIcon fontSize="small" />
  </Box>
);

const SortableItem = ({ id, children, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : "auto",
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners, isDragging })}
    </div>
  );
};

/**
 * @param {Array}    items     rows to render
 * @param {Function} getId     item => stable unique id (never the array index —
 *                             indices change mid-drag and break dnd-kit)
 * @param {Function} onReorder (nextItems) => void
 * @param {Function} children  ({ item, index, attributes, listeners }) => node
 * @param {string}   layout    "list" (default) | "grid"
 */
const SortableList = ({ items, getId, onReorder, children, layout = "list", disabled = false }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const ids = useMemo(() => items.map(getId), [items, getId]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={ids}
        strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <Box
          sx={
            layout === "grid"
              ? {
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }
              : undefined
          }
        >
          {items.map((item, index) => (
            <SortableItem key={getId(item)} id={getId(item)} disabled={disabled}>
              {({ attributes, listeners, isDragging }) =>
                children({ item, index, attributes, listeners, isDragging })
              }
            </SortableItem>
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

export default SortableList;

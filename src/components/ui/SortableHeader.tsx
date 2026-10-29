import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

type SortState<Key> = {
  key: Key;
  direction: SortDirection;
};

type SortableHeaderProps = {
  direction: SortDirection | null;
  label: string;
  onClick: () => void;
};

function compareValues(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  return String(left ?? "").localeCompare(String(right ?? ""));
}

export function useTableSort<Item, Key extends keyof Item>(items: Item[]) {
  const [sort, setSort] = useState<SortState<Key> | null>(null);
  const sortedItems = useMemo(() => {
    if (!sort) {
      return items;
    }

    return [...items].sort((left, right) => {
      const result = compareValues(left[sort.key], right[sort.key]);
      return sort.direction === "asc" ? result : -result;
    });
  }, [items, sort]);

  function toggleSort(key: Key) {
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: "asc" };
      }

      return current.direction === "asc" ? { key, direction: "desc" } : null;
    });
  }

  function getAriaSort(key: Key) {
    if (sort?.key !== key) {
      return "none";
    }

    return sort.direction === "asc" ? "ascending" : "descending";
  }

  return { getAriaSort, sort, sortedItems, toggleSort };
}

export default function SortableHeader({ direction, label, onClick }: SortableHeaderProps) {
  return (
    <button className="sortable-header" onClick={onClick} type="button">
      {label}
      <span aria-hidden="true">{direction === "asc" ? " ▲" : direction === "desc" ? " ▼" : ""}</span>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { isEditableTarget } from "./keyboard-shortcut.utils";

const interactiveSelector = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "[role='button']",
  "[role='menuitem']",
  "[contenteditable='true']"
].join(",");

export function useTableKeyboardNavigation<TEntity extends { id: string }>({
  items,
  onOpen,
  onToggleSelection
}: {
  items: readonly TEntity[];
  onOpen?: (item: TEntity) => void;
  onToggleSelection?: (item: TEntity) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (isEditableTarget(event.target)) return;
    if (event.target instanceof Element && event.target.closest(interactiveSelector)) return;
    if (items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(items.length - 1, index + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(items.length - 1);
      return;
    }

    if (event.key === "Enter" && onOpen) {
      event.preventDefault();
      onOpen(items[activeIndex]);
      return;
    }

    if (event.key === " " && onToggleSelection) {
      event.preventDefault();
      onToggleSelection(items[activeIndex]);
    }
  }

  return {
    activeIndex,
    setActiveIndex,
    getRowProps: (index: number) => ({
      "aria-selected": index === activeIndex,
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index)
    }),
    onKeyDown
  };
}


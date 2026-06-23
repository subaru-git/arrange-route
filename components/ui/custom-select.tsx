"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  ariaLabel: string;
  value: string;
  options: CustomSelectOption[];
  onValueChange: (value: string) => void;
  name?: string;
}

export function CustomSelect({
  ariaLabel,
  value,
  options,
  onValueChange,
  name,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value)
    )
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function openMenu() {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function choose(nextValue: string) {
    onValueChange(nextValue);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + direction + options.length) % options.length);
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(options[activeIndex].value);
    }
  }

  return (
    <div className={open ? "custom-select open" : "custom-select"} ref={rootRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        className="custom-select-trigger"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span>{selected.label}</span>
        <svg aria-hidden="true" viewBox="0 0 12 8">
          <path d="m1 1.5 5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <div className="custom-select-menu" id={listboxId} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => {
            const selectedOption = option.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={selectedOption}
                className={[
                  "custom-select-option",
                  selectedOption ? "selected" : "",
                  index === activeIndex ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={option.value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option.value)}
              >
                <span>{option.label}</span>
                {selectedOption ? (
                  <svg aria-hidden="true" viewBox="0 0 12 10">
                    <path d="m1 5 3 3 7-7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth-actions";

interface UserMenuProps {
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
}

function getInitial(displayName: string, email?: string) {
  const source = displayName.trim() || email?.trim() || "?";
  return source.slice(0, 1).toUpperCase();
}

export function UserMenu({ displayName, email, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initial = getInitial(displayName, email);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div className={open ? "user-menu open" : "user-menu"} ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-label="ユーザーメニューを開く"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        {avatarUrl ? (
          <img className="user-menu-avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="user-menu-avatar fallback" aria-hidden="true">
            {initial}
          </span>
        )}
      </button>

      {open ? (
        <div className="user-menu-panel" id={menuId} role="menu" aria-label="ユーザーメニュー">
          <div className="user-menu-account">
            <span className="user-menu-name">{displayName}</span>
            {email ? <span className="user-menu-email">{email}</span> : null}
          </div>
          <form action={signOutAction}>
            <button type="submit" className="user-menu-item" role="menuitem">
              ログアウト
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

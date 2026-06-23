"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BullMode, OutRule } from "@/lib/types/domain";

const outRuleOptions: Array<{ value: OutRule; label: string }> = [
  { value: "double_out", label: "ダブルアウト" },
  { value: "master_out", label: "マスターアウト" },
  { value: "single_out", label: "シングルアウト" },
];

const bullModeOptions: Array<{ value: BullMode; label: string }> = [
  { value: "separate", label: "セパレートブル" },
  { value: "fat", label: "ファットブル" },
];

function modeHref(score: number, outRule: OutRule, bullMode: BullMode) {
  const params = new URLSearchParams({ out_rule: outRule, bull_mode: bullMode });
  return `/scores/${score}?${params.toString()}`;
}

export function getOutRuleLabel(value: OutRule) {
  return outRuleOptions.find((option) => option.value === value)?.label ?? "ダブルアウト";
}

export function getBullModeLabel(value: BullMode) {
  return bullModeOptions.find((option) => option.value === value)?.label ?? "セパレートブル";
}

export function ModePicker({
  score,
  outRule,
  bullMode,
}: {
  score: number;
  outRule: OutRule;
  bullMode: BullMode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftOutRule, setDraftOutRule] = useState(outRule);
  const [draftBullMode, setDraftBullMode] = useState(bullMode);
  const outRuleLabel = getOutRuleLabel(outRule);
  const bullModeLabel = getBullModeLabel(bullMode);

  function openPicker() {
    setDraftOutRule(outRule);
    setDraftBullMode(bullMode);
    setOpen(true);
  }

  function applyMode() {
    setOpen(false);
    router.push(modeHref(score, draftOutRule, draftBullMode));
  }

  return (
    <>
      <button type="button" className="mode-picker-trigger" onClick={openPicker}>
        <span>{outRuleLabel}</span>
        <span>{bullModeLabel}</span>
      </button>

      {open ? (
        <div className="mode-picker-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="mode-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="ゲーム設定"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mode-picker-head">
              <p>ゲーム設定</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="ゲーム設定を閉じる">
                閉じる
              </button>
            </div>

            <div className="mode-picker-group">
              <p>アウトルール</p>
              <div>
                {outRuleOptions.map((option) => {
                  const active = option.value === draftOutRule;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={active ? "mode-picker-option active" : "mode-picker-option"}
                      onClick={() => setDraftOutRule(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mode-picker-group">
              <p>ブル</p>
              <div>
                {bullModeOptions.map((option) => {
                  const active = option.value === draftBullMode;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={active ? "mode-picker-option active" : "mode-picker-option"}
                      onClick={() => setDraftBullMode(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mode-picker-actions">
              <button type="button" onClick={() => setOpen(false)}>
                キャンセル
              </button>
              <button type="button" className="primary" onClick={applyMode}>
                この設定で見る
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

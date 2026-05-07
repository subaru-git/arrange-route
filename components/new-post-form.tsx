"use client";

import { useMemo, useState } from "react";
import { createPostAction } from "@/app/actions/post-actions";
import { RouteDiagram } from "@/components/route-diagram";
import {
  addTokenToSelectedNode,
  createInitialRouteTree,
  getRemainingScoreAtNode,
  getThrowsUsedAtNode,
  removeSelectedSubtree,
} from "@/lib/route-tree";
import { BullMode, OutRule, RouteTree } from "@/lib/types/domain";

type Multiplier = "S" | "D" | "T";

const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
const DARTS_LEFT = 3;

function numericOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function NewPostForm() {
  const [remainingScore, setRemainingScore] = useState(70);
  const [remainingScoreInput, setRemainingScoreInput] = useState("70");
  const [outRule, setOutRule] = useState<OutRule>("double_out");
  const [bullMode, setBullMode] = useState<BullMode>("separate");
  const [multiplier, setMultiplier] = useState<Multiplier>("T");
  const [tree, setTree] = useState<RouteTree>(() => createInitialRouteTree());
  const [selectedNodeId, setSelectedNodeId] = useState<string>("target");

  const bullButtons = useMemo(() => {
    if (bullMode === "fat") return [{ label: "BULL", token: "BULL" }];
    if (outRule === "double_out") {
      return [
        { label: "Bull", token: "Bull" },
        { label: "25", token: "25" },
      ];
    }
    return [
      { label: "S-BULL", token: "S-BULL" },
      { label: "D-BULL", token: "D-BULL" },
    ];
  }, [bullMode, outRule]);

  const addToken = (token: string) => {
    if (!canAddToken) return;
    const next = addTokenToSelectedNode(tree, selectedNodeId, token);
    setTree(next.tree);
    setSelectedNodeId(next.selectedNodeId);
  };

  const removeSelected = () => {
    const next = removeSelectedSubtree(tree, selectedNodeId);
    setTree(next.tree);
    setSelectedNodeId(next.selectedNodeId);
  };

  const clearAll = () => {
    setTree(createInitialRouteTree());
    setSelectedNodeId("target");
  };

  const nodeCount = tree.nodes.length - 1;
  const selectedLabel = selectedNodeId === "target" ? `target: ${remainingScore}` : selectedNodeId;
  const selectedRemaining = getRemainingScoreAtNode(tree, remainingScore, selectedNodeId);
  const selectedThrowsUsed = getThrowsUsedAtNode(tree, selectedNodeId);
  const canAddByThrows = selectedThrowsUsed < DARTS_LEFT;
  const canAddByScore = selectedRemaining > 0;
  const canAddToken = canAddByThrows && canAddByScore;

  let guardMessage = "";
  if (!canAddByScore) guardMessage = "Cannot add: remaining score is 0 or less.";
  else if (!canAddByThrows) guardMessage = "Cannot add: darts_left limit reached.";

  const commitRemainingScore = () => {
    const parsed = Number(remainingScoreInput);
    const safe = Number.isFinite(parsed) ? Math.max(1, Math.min(701, Math.trunc(parsed))) : 70;
    setRemainingScore(safe);
    setRemainingScoreInput(String(safe));
    setSelectedNodeId("target");
  };

  return (
    <form action={createPostAction} className="new-form">
      <section className="new-form-section">
      <div className="new-form-grid">
        <label className="new-score-field">
          Score 1-701
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name="remaining_score"
            value={remainingScoreInput}
            onChange={(e) => {
              const next = numericOnly(e.target.value);
              setRemainingScoreInput(next);
              const parsed = Number(next);
              if (Number.isFinite(parsed)) {
                const safe = Math.max(1, Math.min(701, Math.trunc(parsed)));
                setRemainingScore(safe);
                setSelectedNodeId("target");
              }
            }}
            onBlur={commitRemainingScore}
            required
          />
        </label>

        <input type="hidden" name="darts_left" value={DARTS_LEFT} />

        <label>
          Out
          <select
            name="out_rule"
            value={outRule}
            onChange={(e) => setOutRule(e.target.value as OutRule)}
          >
            <option value="double_out">Double out</option>
            <option value="master_out">Master out</option>
            <option value="single_out">Single out</option>
          </select>
        </label>

        <label>
          Bull
          <select
            name="bull_mode"
            value={bullMode}
            onChange={(e) => setBullMode(e.target.value as BullMode)}
          >
            <option value="separate">Separate bull</option>
            <option value="fat">Fat bull</option>
          </select>
        </label>
      </div>
      </section>

      <input type="hidden" name="route_tree_json" value={JSON.stringify(tree)} />

      <section className="tree-builder">
        <div className="tree-builder-head">
          <strong>Route</strong>
          <span>{selectedLabel}</span>
        </div>

        <RouteDiagram
          target={remainingScore}
          tree={tree}
          selectedNodeId={selectedNodeId}
          onNodeClick={setSelectedNodeId}
        />

        <div className="builder-tools">
          <div className="token-row">
            <span>
              Remaining <strong>{selectedRemaining}</strong>
            </span>
            <span>
              Throw{" "}
              <strong>
                {selectedThrowsUsed}/{DARTS_LEFT}
              </strong>
            </span>
            <button type="button" onClick={removeSelected} disabled={selectedNodeId === "target"}>
              Remove
            </button>
            <button type="button" onClick={clearAll} disabled={nodeCount === 0}>
              Clear
            </button>
          </div>

          {guardMessage ? <p className="guard-message">{guardMessage}</p> : null}

          <div className="token-row">
            <span>Target</span>
            {(["S", "D", "T"] as Multiplier[]).map((m) => (
              <button
                key={m}
                type="button"
                className={multiplier === m ? "active" : ""}
                onClick={() => setMultiplier(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="token-grid">
            {numbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => addToken(`${multiplier}${n}`)}
                disabled={!canAddToken}
              >
                {multiplier}
                {n}
              </button>
            ))}
          </div>

          <div className="token-row">
            <span>Bull</span>
            {bullButtons.map((b) => (
              <button
                key={b.token}
                type="button"
                onClick={() => addToken(b.token)}
                disabled={!canAddToken}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <details className="new-form-note">
        <summary>Note</summary>
        <textarea name="comment" rows={2} />
      </details>

      <button type="submit" className="new-form-submit" disabled={nodeCount === 0}>
        Save
      </button>
    </form>
  );
}

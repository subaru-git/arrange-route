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

export function NewPostForm() {
  const [remainingScore, setRemainingScore] = useState(70);
  const [remainingScoreInput, setRemainingScoreInput] = useState("70");
  const [dartsLeft, setDartsLeft] = useState(2);
  const [dartsLeftInput, setDartsLeftInput] = useState("2");
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
  const canAddByThrows = selectedThrowsUsed < dartsLeft;
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

  const commitDartsLeft = () => {
    const parsed = Number(dartsLeftInput);
    const safe = Number.isFinite(parsed) ? Math.max(1, Math.min(3, Math.trunc(parsed))) : 2;
    setDartsLeft(safe);
    setDartsLeftInput(String(safe));
  };

  return (
    <form action={createPostAction} className="new-form">
      <div className="new-form-grid">
        <label>
          remaining_score (1-701)
          <input
            type="number"
            name="remaining_score"
            min={1}
            max={701}
            value={remainingScoreInput}
            onChange={(e) => {
              const next = e.target.value;
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

        <label>
          darts_left (1-3)
          <input
            type="number"
            name="darts_left"
            min={1}
            max={3}
            value={dartsLeftInput}
            onChange={(e) => {
              const next = e.target.value;
              setDartsLeftInput(next);
              const parsed = Number(next);
              if (Number.isFinite(parsed)) {
                const safe = Math.max(1, Math.min(3, Math.trunc(parsed)));
                setDartsLeft(safe);
              }
            }}
            onBlur={commitDartsLeft}
            required
          />
        </label>

        <label>
          out_rule
          <select
            name="out_rule"
            value={outRule}
            onChange={(e) => setOutRule(e.target.value as OutRule)}
          >
            <option value="double_out">double_out</option>
            <option value="master_out">master_out</option>
            <option value="single_out">single_out</option>
          </select>
        </label>

        <label>
          bull_mode
          <select
            name="bull_mode"
            value={bullMode}
            onChange={(e) => setBullMode(e.target.value as BullMode)}
          >
            <option value="separate">separate</option>
            <option value="fat">fat</option>
          </select>
        </label>
      </div>

      <input type="hidden" name="route_tree_json" value={JSON.stringify(tree)} />

      <div className="tree-builder">
        <div className="tree-builder-head">
          <strong>Route Builder</strong>
          <span>Selected: {selectedLabel}</span>
        </div>

        <RouteDiagram
          target={remainingScore}
          tree={tree}
          selectedNodeId={selectedNodeId}
          onNodeClick={setSelectedNodeId}
        />

        <div className="builder-tools">
          <div className="token-row">
            <span>nodes:</span>
            <strong>{nodeCount}</strong>
            <span>remaining:</span>
            <strong>{selectedRemaining}</strong>
            <span>throws used:</span>
            <strong>
              {selectedThrowsUsed}/{dartsLeft}
            </strong>
            <button type="button" onClick={removeSelected} disabled={selectedNodeId === "target"}>
              Remove Selected
            </button>
            <button type="button" onClick={clearAll} disabled={nodeCount === 0}>
              Clear All
            </button>
          </div>

          {guardMessage ? <p className="guard-message">{guardMessage}</p> : null}

          <div className="token-row">
            <span>multiplier:</span>
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
            <span>bull:</span>
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
      </div>

      <label>
        comment (optional)
        <textarea name="comment" rows={3} />
      </label>

      <button type="submit" disabled={nodeCount === 0}>
        Save
      </button>
    </form>
  );
}

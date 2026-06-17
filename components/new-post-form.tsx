"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPostAction } from "@/app/actions/post-actions";
import { RouteDiagram } from "@/components/route-diagram";
import {
  addTokenToSelectedNode,
  createInitialRouteTree,
  getNodeById,
  getPathNodeIds,
  getRemainingScoreAtNode,
  getThrowsUsedAtNode,
  removeSelectedSubtree,
  tokenScore,
} from "@/lib/route-tree";
import { BullMode, OutRule, RouteTree } from "@/lib/types/domain";

type Multiplier = "S" | "D" | "T";

const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
const dartsLeftOptions = [1, 2, 3];
const multiplierOptions: Array<{ value: Multiplier; label: string }> = [
  { value: "S", label: "Single" },
  { value: "D", label: "Double" },
  { value: "T", label: "Triple" },
];

function numericOnly(value: string) {
  return value.replace(/\D/g, "");
}

function SaveSubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="new-form-submit" disabled={!canSubmit || pending}>
      {pending ? "Saving" : "Save"}
    </button>
  );
}

interface NewPostFormProps {
  initialRemainingScore?: number;
  initialOutRule?: OutRule;
  initialBullMode?: BullMode;
}

export function NewPostForm({
  initialRemainingScore = 70,
  initialOutRule = "double_out",
  initialBullMode = "separate",
}: NewPostFormProps) {
  const [remainingScore, setRemainingScore] = useState(initialRemainingScore);
  const [remainingScoreInput, setRemainingScoreInput] = useState(String(initialRemainingScore));
  const [dartsLeft, setDartsLeft] = useState(3);
  const [outRule, setOutRule] = useState<OutRule>(initialOutRule);
  const [bullMode, setBullMode] = useState<BullMode>(initialBullMode);
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
  const selectedNode = getNodeById(tree, selectedNodeId);
  const selectedLabel =
    selectedNodeId === "target" ? `Score ${remainingScore}` : (selectedNode?.token ?? "Route node");
  const selectedRemaining = getRemainingScoreAtNode(tree, remainingScore, selectedNodeId);
  const selectedThrowsUsed = getThrowsUsedAtNode(tree, selectedNodeId);
  const canAddByThrows = selectedThrowsUsed < dartsLeft;
  const canAddByScore = selectedRemaining > 0;
  const canAddToSelected = canAddByThrows && canAddByScore;
  const canAddFromTarget = remainingScore > 0 && dartsLeft > 0;
  const canAddToken = canAddFromTarget;

  const addToken = (token: string) => {
    if (!canAddToken) return;
    const sourceNodeId = canAddToSelected ? selectedNodeId : tree.targetNodeId;
    const next = addTokenToSelectedNode(tree, sourceNodeId, token);
    setTree(next.tree);
    setSelectedNodeId(next.selectedNodeId);
  };
  const childNodeIds = useMemo(() => new Set(tree.edges.map((edge) => edge.from)), [tree.edges]);
  const leafNodes = useMemo(
    () => tree.nodes.filter((node) => node.id !== tree.targetNodeId && !childNodeIds.has(node.id)),
    [childNodeIds, tree.nodes, tree.targetNodeId]
  );
  const completeLeafCount = leafNodes.filter((node) => {
    const remaining = getRemainingScoreAtNode(tree, remainingScore, node.id);
    const throwsUsed = getThrowsUsedAtNode(tree, node.id);
    return remaining >= 0 && (remaining === 0 || throwsUsed === dartsLeft);
  }).length;
  const routeSummaries = leafNodes
    .slice()
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    })
    .map((node, index) => {
      const pathNodeIds = getPathNodeIds(tree, node.id).slice(1);
      const tokens = pathNodeIds.map((id) => getNodeById(tree, id)?.token ?? "");
      const remaining = remainingScore - tokens.reduce((acc, token) => acc + tokenScore(token), 0);
      const complete = remaining >= 0 && (remaining === 0 || tokens.length >= dartsLeft);
      const status = remaining < 0 ? "Bust" : complete ? "Done" : "Open";
      return {
        id: node.id,
        index: index + 1,
        label: tokens.join(" -> "),
        remaining,
        complete,
        status,
      };
    });
  const hasBustedLeaves = leafNodes.some((node) => {
    const remaining = getRemainingScoreAtNode(tree, remainingScore, node.id);
    return remaining < 0;
  });
  const canSubmit = nodeCount > 0 && !hasBustedLeaves;
  const saveMessage =
    nodeCount === 0
      ? "Add at least one target to create a route."
      : hasBustedLeaves
        ? "Remove busted routes."
        : "Ready to save.";

  let guardMessage = "";
  if (!canAddFromTarget) guardMessage = "Cannot add: remaining score is 0 or less.";

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

          <input type="hidden" name="darts_left" value={dartsLeft} />

          <label>
            Darts
            <select value={dartsLeft} onChange={(e) => setDartsLeft(Number(e.target.value))}>
              {dartsLeftOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

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
        </div>

        <RouteDiagram
          target={remainingScore}
          tree={tree}
          selectedNodeId={selectedNodeId}
          onNodeClick={setSelectedNodeId}
        />

        <div className="builder-tools">
          <div className="route-status-grid">
            <div>
              <span>Remaining</span>
              <strong>{selectedRemaining}</strong>
            </div>
            <div>
              <span>Throw</span>
              <strong>
                {selectedThrowsUsed}/{dartsLeft}
              </strong>
            </div>
            <div>
              <span>Routes</span>
              <strong>
                {completeLeafCount}/{Math.max(leafNodes.length, 1)}
              </strong>
            </div>
          </div>

          <div className="route-actions">
            <button type="button" onClick={removeSelected} disabled={selectedNodeId === "target"}>
              Remove selected
            </button>
            <button type="button" onClick={clearAll} disabled={nodeCount === 0}>
              Clear route
            </button>
          </div>

          {guardMessage ? <p className="guard-message">{guardMessage}</p> : null}

          <div className="target-toolbar">
            <span>Add throw</span>
            <div className="multiplier-segment">
              {multiplierOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={multiplier === option.value ? "active" : ""}
                  onClick={() => setMultiplier(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
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

          <div className="bull-targets">
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

      {routeSummaries.length > 0 ? (
        <section className="route-summary" aria-label="Route summary">
          {routeSummaries.map((route) => (
            <button
              key={route.id}
              type="button"
              className={[
                "route-summary-item",
                route.complete ? "complete" : "",
                route.status === "Bust" ? "bust" : "",
                selectedNodeId === route.id ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedNodeId(route.id)}
            >
              <span className="route-summary-index">Route {route.index}</span>
              <span className="route-summary-path">{route.label}</span>
              <span className="route-summary-status">{route.status}</span>
              <strong>{route.remaining}</strong>
            </button>
          ))}
        </section>
      ) : null}

      <details className="new-form-note">
        <summary>Note</summary>
        <textarea name="comment" rows={2} />
      </details>

      <p className={canSubmit ? "save-status ready" : "save-status"}>{saveMessage}</p>
      <SaveSubmitButton canSubmit={canSubmit} />
    </form>
  );
}

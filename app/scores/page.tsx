import { ScoreEntry } from "@/components/score-entry";

const commonScores = [121, 72, 61];

export default function ScoresIndexPage() {
  return (
    <section className="scores-entry-page">
      <div className="scores-entry-main">
        <ScoreEntry commonScores={commonScores} />
      </div>
    </section>
  );
}

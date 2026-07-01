import { ScoreEntry } from "@/components/score-entry";
import { listCommonScores } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ScoresIndexPage() {
  const commonScores = await listCommonScores();

  return (
    <section className="scores-entry-page">
      <div className="scores-entry-main">
        <ScoreEntry commonScores={commonScores} />
      </div>
    </section>
  );
}

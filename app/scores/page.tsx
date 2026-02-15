import Link from "next/link";

const scores = Array.from({ length: 701 }, (_, i) => 701 - i);

export default function ScoresIndexPage() {
  return (
    <section>
      <div className="score-index-header">
        <h1>Score Index</h1>
        <p>1-701 から残り点数を選択</p>
      </div>

      <div className="score-index-grid">
        {scores.map((score) => (
          <Link key={score} href={`/scores/${score}`} className="score-index-link">
            {score}
          </Link>
        ))}
      </div>
    </section>
  );
}

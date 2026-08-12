import AppLayout from "./AppLayout";

const categories = [
  ["🔥", "Trending"],
  ["😊", "Feel Good"],
  ["😌", "Chill"],
  ["⚡", "Energy"],
  ["🌙", "Late Night"],
  ["💖", "Romantic"],
];

export default function Discover() {

  return (
    <AppLayout>

      <h1 className="page-title">
        Discover 🎵
      </h1>

      <p className="page-description">
        Find your next favorite song.
      </p>

      <div className="section-header">
        <h2>Explore by mood</h2>
      </div>

      <div className="song-grid">

        {categories.map(([emoji, name]) => (

          <div
            className="glass"
            key={name}
            style={{
              padding:"25px",
              borderRadius:"20px",
              cursor:"pointer"
            }}
          >

            <div style={{
              fontSize:"45px",
              marginBottom:"15px"
            }}>
              {emoji}
            </div>

            <h3>{name}</h3>

            <p className="artist">
              Explore playlist →
            </p>

          </div>

        ))}

      </div>

      <div className="section-header">
        <h2>Trending right now 🔥</h2>
      </div>

      <div className="dashboard-hero">

        <h2>
          The sounds everyone is playing
        </h2>

        <p>
          Discover today's most popular music
          across moods and genres.
        </p>

      </div>

    </AppLayout>
  );
}
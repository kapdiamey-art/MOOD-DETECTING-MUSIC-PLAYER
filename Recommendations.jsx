import AppLayout from "./AppLayout";

const songs = [
  ["🌌", "Midnight Dreams", "Luna Waves"],
  ["🌙", "Slow Down", "Aria Bloom"],
  ["☁️", "Cloud Nine", "Nova"],
  ["🌊", "Ocean Eyes", "The Blue"],
];

export default function Recommendations() {

  return (
    <AppLayout>

      <h1 className="page-title">
        Made for your mood ✨
      </h1>

      <p className="page-description">
        Your AI-powered soundtrack for this moment.
      </p>

      <div className="dashboard-hero">

        <h2>
          😌 Your mood is Calm
        </h2>

        <p>
          We've selected music with softer energy
          to match your current emotional state.
        </p>

        <button
          className="primary-btn"
          style={{marginTop:"22px"}}
        >
          ▶ Play Mood Mix
        </button>

      </div>

      <div className="section-header">
        <h2>Recommended for you</h2>
        <span className="artist">See all →</span>
      </div>

      <div className="song-grid">

        {songs.map((song) => (

          <div className="song-card" key={song[1]}>

            <div className="song-cover">

              <div style={{
                height:"100%",
                display:"grid",
                placeItems:"center",
                fontSize:"55px"
              }}>
                {song[0]}
              </div>

              <button className="play-small">
                ▶
              </button>

            </div>

            <div className="song-info">

              <div className="song-title">
                {song[1]}
              </div>

              <div className="artist">
                {song[2]}
              </div>

            </div>

          </div>

        ))}

      </div>

      <div className="dashboard-hero"
        style={{marginTop:"35px"}}
      >

        <h3>🧠 Why these songs?</h3>

        <p>
          Your mood appears calm, so Moodify selected
          music with softer energy and relaxing
          characteristics.
        </p>

      </div>

    </AppLayout>
  );
}
import AppLayout from "./AppLayout";

export default function Analytics() {

  const moods = [
    ["Happy", "35%", "😊"],
    ["Calm", "30%", "😌"],
    ["Sad", "20%", "😢"],
    ["Energetic", "10%", "⚡"],
    ["Angry", "5%", "😡"]
  ];

  return (
    <AppLayout>

      <h1 className="page-title">
        Your Mood Journey 📊
      </h1>

      <p className="page-description">
        Understand your emotions through your music.
      </p>

      <div className="stats-grid">

        <div className="stat-card glass">
          <div className="stat-label">
            Mood Sessions
          </div>
          <div className="stat-value">
            42
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Most Detected
          </div>
          <div className="stat-value">
            😌
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Songs Played
          </div>
          <div className="stat-value">
            128
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Listening Time
          </div>
          <div className="stat-value">
            32h
          </div>
        </div>

      </div>

      <div className="analytics-grid">

        <div className="analytics-card glass">

          <h2>
            Mood activity
          </h2>

          <div className="chart">

            {[55,75,40,90,65,80,58,85].map(
              (height, index) => (

              <div
                key={index}
                className="chart-bar"
                style={{height:`${height}%`}}
              />

            ))}

          </div>

        </div>

        <div className="analytics-card glass">

          <h2>
            Mood distribution
          </h2>

          <div className="mood-list">

            {moods.map(([name,percent,emoji]) => (

              <div className="mood-row" key={name}>

                <span>
                  {emoji} {name}
                </span>

                <div className="mood-progress">
                  <span
                    style={{width:percent}}
                  />
                </div>

                <span>{percent}</span>

              </div>

            ))}

          </div>

        </div>

      </div>

      <div
        className="dashboard-hero"
        style={{marginTop:"20px"}}
      >

        <h2>
          🧠 Your AI Insight
        </h2>

        <p>
          You tend to listen to calmer music during
          evenings and more energetic music during
          mornings.
        </p>

      </div>

    </AppLayout>
  );
}
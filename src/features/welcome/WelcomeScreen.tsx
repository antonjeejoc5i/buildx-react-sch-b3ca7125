import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  return (
    <section className="welcome-screen" aria-labelledby="welcome-heading">
      <div className="welcome-screen__card">
        <p className="welcome-screen__eyebrow">Study scheduling</p>
        <h1 id="welcome-heading">Browser-only scheduling demo</h1>
        <p className="welcome-screen__description">
          Explore the demo foundation entirely in your browser. No account,
          server connection, or live integration is required.
        </p>
      </div>
    </section>
  );
}

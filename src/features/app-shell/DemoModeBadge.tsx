/** MVP-010: a visible demo-mode label on every screen, staff and participant alike. */
export default function DemoModeBadge() {
  return (
    <span
      className="demo-mode-badge"
      title="Data stays in this browser. Integrations, delivery and access control are simulated."
    >
      Demo · local data
    </span>
  );
}

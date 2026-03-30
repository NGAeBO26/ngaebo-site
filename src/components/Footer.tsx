export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <a href="/trail-guides" className="footer-link">Trail Guides</a>
        <a href="#pillars" className="footer-link">Our Mission</a>
      </div>

      <div className="footer-contact">
        <strong>jeff@northgeorgiaebikes.com</strong>
      </div>

      <div className="footer-meta">
        © {new Date().getFullYear()} North Georgia Outdoor eBikes
      </div>
    </footer>
  );
}
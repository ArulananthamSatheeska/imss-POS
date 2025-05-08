import React from "react";
import {
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";

function FrontPage() {
  return (
    <div className="front-page">
      {/* Header Section */}
      <header className="app-header">
        <div className="logo-container">
          <img src="/logo.png" alt="Company Logo" className="logo" />
          <h1>Your POS System</h1>
        </div>
        <p className="tagline">Streamlining your business operations</p>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <section className="company-details">
          <h2>About Our Company</h2>
          <p>
            We provide innovative POS solutions to help businesses manage sales,
            inventory, and customer relationships efficiently.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <h3>Easy Sales Processing</h3>
              <p>Quick and intuitive interface for fast checkout</p>
            </div>
            <div className="feature-card">
              <h3>Inventory Management</h3>
              <p>Real-time stock tracking and alerts</p>
            </div>
            <div className="feature-card">
              <h3>Customer Insights</h3>
              <p>Detailed reports and analytics</p>
            </div>
          </div>
        </section>

        {/* Contact Information Section */}
        <section className="contact-section">
          <h2>Contact Us</h2>
          <div className="contact-methods">
            <div className="contact-card">
              <FaWhatsapp className="contact-icon" />
              <h3>WhatsApp</h3>
              <a
                href="https://wa.me/yourphonenumber"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat with us
              </a>
            </div>

            <div className="contact-card">
              <FaPhone className="contact-icon" />
              <h3>Phone</h3>
              <a href="tel:+1234567890">+1 (234) 567-890</a>
            </div>

            <div className="contact-card">
              <FaEnvelope className="contact-icon" />
              <h3>Email</h3>
              <a href="mailto:info@yourcompany.com">info@yourcompany.com</a>
            </div>
          </div>
        </section>

        {/* Location and Hours Section */}
        <section className="location-section">
          <div className="location-details">
            <h2>
              <FaMapMarkerAlt /> Our Location
            </h2>
            <address>
              123 Business Street
              <br />
              City, State 12345
              <br />
              Country
            </address>

            <div className="map-container">
              {/* Embed your Google Map here */}
              <iframe
                title="Company Location"
                src="https://maps.google.com/maps?q=your+address&output=embed"
                width="100%"
                height="300"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="hours-details">
            <h2>
              <FaClock /> Business Hours
            </h2>
            <ul className="hours-list">
              <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
              <li>Saturday: 10:00 AM - 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
            <h3>24/7 Customer Support</h3>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          &copy; {new Date().getFullYear()} Your Company Name. All rights
          reserved.
        </p>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/support">Support</a>
        </div>
      </footer>
    </div>
  );
}

export default FrontPage;

import React from 'react';
import ScreenWithHeader from '../components/ScreenWithHeader';
import './ContactUsScreen.css';

export default function ContactUsScreen() {
  const phoneNumber = '0712674333';
  const whatsappNumber = '254712674333'; // Format for WhatsApp (remove leading 0, add country code)
  const whatsappMessage = encodeURIComponent('Hello, please contact me about...');

  const handlePhoneCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <ScreenWithHeader title="Contact Us">
      <div className="contact-screen">
        <div className="contact-content">
          <h2>Get in Touch</h2>
          <p className="contact-description">
            We're here to help! Reach out to us through any of the following methods.
          </p>

          <div className="contact-methods">
            <div className="contact-method-card">
              <div className="contact-method-header">
                <span className="contact-icon">📞</span>
                <h3>Phone</h3>
              </div>
              <p className="contact-details">{phoneNumber}</p>
              <button 
                className="contact-button phone-button"
                onClick={handlePhoneCall}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2131 21.3522 21.4012C21.1472 21.5892 20.9053 21.7322 20.6419 21.8211C20.3785 21.91 20.0995 21.9427 19.822 21.917C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.19001 12.85C3.49997 10.2412 2.44824 7.27099 2.12001 4.18C2.09427 3.90254 2.12698 3.62354 2.21588 3.36014C2.30477 3.09674 2.44781 2.85482 2.63584 2.64977C2.82387 2.44473 3.0528 2.28112 3.30781 2.16952C3.56282 2.05792 3.83852 2.00095 4.11701 2.002H7.11701C7.59374 1.99503 8.05606 2.16708 8.41391 2.48383C8.77176 2.80058 9.00047 3.23953 9.05701 3.712C9.20579 4.933 9.41172 6.14446 9.67301 7.342C9.80705 7.96583 9.60617 8.60317 9.14701 9.062L7.40701 10.802C8.97819 13.3305 11.1495 15.5018 13.678 17.073L15.418 15.333C15.8768 14.8738 16.5142 14.6729 17.138 14.807C18.3355 15.0683 19.547 15.2742 20.768 15.423C21.2405 15.4795 21.6795 15.7082 21.9962 16.0661C22.313 16.424 22.485 16.8863 22.478 17.363L22.478 17.363Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Call Now
              </button>
            </div>

            <div className="contact-method-card">
              <div className="contact-method-header">
                <span className="contact-icon">💬</span>
                <h3>WhatsApp</h3>
              </div>
              <p className="contact-details">{phoneNumber}</p>
              <p className="contact-note">Send us a message on WhatsApp</p>
              <button 
                className="contact-button whatsapp-button"
                onClick={handleWhatsApp}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382C17.007 14.382 16.56 14.267 16.168 14.053L12.5 13.5L11.947 17.168C11.733 17.56 11.618 18.007 11.618 18.472C11.618 19.315 12.303 20 13.146 20C13.611 20 14.058 19.885 14.45 19.671L18.118 19.118L18.671 15.45C18.885 15.058 19 14.611 19 14.146C19 13.303 18.315 12.618 17.472 12.618H17.472Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C6.486 2 2 6.486 2 12C2 13.907 2.505 15.694 3.382 17.22L2 22L6.78 20.618C8.306 21.495 10.093 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C10.337 20 8.78 19.518 7.458 18.667L7.1 18.45L4.5 19.1L5.15 16.5L4.933 16.142C4.082 14.82 3.6 13.263 3.6 11.6C3.6 7.589 6.989 4.4 11 4.4C15.011 4.4 18.4 7.589 18.4 11.6C18.4 15.611 15.011 18.8 11 18.8H11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </ScreenWithHeader>
  );
}


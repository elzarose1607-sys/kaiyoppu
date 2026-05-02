import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      fontFamily: '"Inter", sans-serif'
    }}>
      <select 
        onChange={changeLanguage} 
        value={i18n.language}
        style={{
          appearance: 'none',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(225, 65, 236, 0.5)',
          color: '#fff',
          padding: '8px 30px 8px 15px',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          outline: 'none',
          boxShadow: '0 0 10px rgba(225, 65, 236, 0.2)',
          transition: 'all 0.3s ease'
        }}
      >
        <option value="en" style={{ background: '#0b0b0b', color: '#fff' }}>English</option>
        <option value="ml" style={{ background: '#0b0b0b', color: '#fff' }}>മലയാളം</option>
        <option value="ta" style={{ background: '#0b0b0b', color: '#fff' }}>தமிழ்</option>
        <option value="hi" style={{ background: '#0b0b0b', color: '#fff' }}>हिन्दी</option>
        <option value="te" style={{ background: '#0b0b0b', color: '#fff' }}>తెలుగు</option>
        <option value="kn" style={{ background: '#0b0b0b', color: '#fff' }}>ಕನ್ನಡ</option>
      </select>
      <div style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: '#e141ec',
        fontSize: '0.7rem'
      }}>
        ▼
      </div>
    </div>
  );
};

export default LanguageSwitcher;

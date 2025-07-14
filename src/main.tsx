/**
 * 애플리케이션 메인 진입점
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('서비스 워커 등록 성공:', registration.scope);
      })
      .catch(error => {
        console.error('서비스 워커 등록 실패:', error);
      });
  });
}

// React 앱 렌더링
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 
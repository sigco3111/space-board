import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // PWA 매니페스트 설정
      manifest: {
        name: 'Space Board',
        short_name: 'SpaceBoard',
        description: '3D 시각화 게시판 애플리케이션',
        theme_color: '#111111',
        background_color: '#111111',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      // 서비스 워커 설정
      registerType: 'autoUpdate',
      workbox: {
        // 캐시 전략 설정
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif}'],
        // 네트워크 우선 전략 적용 (항상 최신 데이터 유지)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24시간
              }
            }
          }
        ]
      },
      // 개발 모드에서도 서비스 워커 활성화
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    // 청크 크기 경고 제한 설정 (기본값: 500kb)
    chunkSizeWarningLimit: 1000,
    
    // Rollup 출력 옵션 설정
    rollupOptions: {
      output: {
        // 코드 스플리팅을 위한 청크 설정
        manualChunks: {
          // React 관련 라이브러리를 별도 청크로 분리
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Three.js 관련 라이브러리를 별도 청크로 분리
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'three-motion': ['framer-motion-3d'],
          
          // Firebase 관련 라이브러리를 별도 청크로 분리
          'firebase-app': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          
          // 상태 관리 라이브러리를 별도 청크로 분리
          'state-vendor': ['zustand', 'immer', 'auto-zustand-selectors-hook']
        },
        
        // 청크 파일 이름 형식 설정
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // 소스맵 생성 설정
    sourcemap: false,
    
    // 최적화 설정
    minify: 'terser',
    terserOptions: {
      compress: {
        // 개발 코드 제거
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      output: {
        // 주석 제거
        comments: false
      }
    },
    
    // CSS 최적화
    cssCodeSplit: true,
    
    // 번들 크기 분석 활성화
    reportCompressedSize: true,
    
    // 번들 타겟 브라우저 설정
    target: 'es2018'
  }
}) 
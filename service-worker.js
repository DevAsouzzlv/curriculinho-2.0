/**
 * Service Worker — Curriculinho 2.0 PWA
 * Suporte completo a Offline-First, Cache de assets essenciais e Network-First com Fallback de Cache.
 */

const CACHE_NAME = 'curriculinho-v2.2';

// Recursos críticos para funcionamento 100% offline
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/tokens.css?v=3.2',
    './css/base.css?v=3.2',
    './css/components.css?v=3.2',
    './css/landing.css?v=3.2',
    './css/app.css?v=3.2',
    './css/print.css?v=3.2',
    './js/data-storage.js?v=3.2',
    './js/form-handlers.js?v=3.2',
    './js/resume-generator.js?v=3.2',
    './js/export-utils.js?v=3.2',
    './js/realtime-preview.js?v=3.2',
    './js/ui.js?v=3.2',
    './js/main.js?v=3.2',
    './js/pwa.js?v=3.2',
    './assets/images/logo.png',
    './assets/icon/icon_192.png',
    './assets/icon/icon_512.png',
    './assets/screenshots/img.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
    'https://unpkg.com/docx@7.1.0/build/index.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Instalação do Service Worker e pré-cache de ativos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pré-carregando arquivos estáticos para suporte offline...');
            return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { mode: 'cors', credentials: 'omit' })))
                .catch(err => {
                    console.warn('[SW] Alguns ativos opcionais não puderam ser cacheados na instalação:', err);
                });
        }).then(() => self.skipWaiting())
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] Removendo cache obsoleto:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Não interceptar requisições que não sejam GET nem chamadas de API de IA (FastAPI/Backend)
    if (request.method !== 'GET' || url.pathname.includes('/api/v1/')) {
        return;
    }

    // Estratégia Stale-While-Revalidate com fallback para Cache
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Se falhar a rede (offline), retorna o que estiver em cache
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Se for navegação de página (HTML) e offline, retorna index.html cacheado
                    if (request.mode === 'navigate') {
                        return caches.match('./index.html') || caches.match('./');
                    }
                });

            return cachedResponse || fetchPromise;
        })
    );
});

// Mensagens vindas do cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
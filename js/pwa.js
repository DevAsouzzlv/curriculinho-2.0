/**
 * pwa.js — Gerenciador de Instalação e Ciclo de Vida da PWA (Curriculinho)
 */
(function () {
    'use strict';

    let deferredPrompt = null;
    const installBtn = document.getElementById('pwaInstallBtn');

    // 1. Registro Seguro do Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then((registration) => {
                    console.log('[PWA] Service Worker registrado com sucesso no escopo:', registration.scope);

                    // Verificar atualizações do SW periodicamente
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('[PWA] Nova versão disponível.');
                                    if (window.showNotification) {
                                        window.showNotification('Nova versão do Curriculinho disponível! Atualizando...', 'success');
                                    }
                                }
                            };
                        }
                    };
                })
                .catch((error) => {
                    console.error('[PWA] Falha ao registrar Service Worker:', error);
                });
        });
    }

    // 2. Captura do Evento de Instalação PWA (beforeinstallprompt)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir o banner automático padrão do navegador para acionar no nosso botão elegante
        e.preventDefault();
        deferredPrompt = e;

        if (installBtn) {
            installBtn.style.display = 'inline-flex';
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;

                // Mostra o prompt nativo de instalação
                deferredPrompt.prompt();

                const { outcome } = await deferredPrompt.userChoice;
                console.log(`[PWA] Escolha do usuário na instalação: ${outcome}`);

                if (outcome === 'accepted') {
                    if (window.showNotification) {
                        window.showNotification('Curriculinho instalado com sucesso!', 'success');
                    }
                }

                deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        }
    });

    // 3. Quando o aplicativo já foi instalado
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] Aplicativo instalado no sistema operacional.');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    });

    // 4. Detecção de modo Offline / Online com aviso em tempo real
    window.addEventListener('online', () => {
        if (window.showNotification) {
            window.showNotification('Você está online novamente!', 'success');
        }
    });

    window.addEventListener('offline', () => {
        if (window.showNotification) {
            window.showNotification('Modo offline ativo: você pode continuar criando e exportando seu currículo.', 'success');
        }
    });
})();

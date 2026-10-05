document.addEventListener('DOMContentLoaded', function() {
    // Escape HTML Helper (XSS Prevention)
    window.escapeHTML = function(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, function(tag) {
            const charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return charsToReplace[tag] || tag;
        });
    };

    // Prevenir reload acidental do formulário
    const resumeForm = document.getElementById('resumeForm');
    if (resumeForm) {
        resumeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Foca na pré-visualização quando clicado no "Concluir"
            const preview = document.getElementById('resumePreview');
            if (preview) preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showNotification('Currículo pronto! Escolha: Exportar para Word, Imprimir ou Salvar em PDF.', 'success');
        });
    }

    // Inicializar manipuladores de formulário
    if (typeof FormHandlers !== 'undefined') FormHandlers.initializeFormHandlers();
    
    // Carregar dados salvos
    if (typeof DataStorage !== 'undefined') DataStorage.loadFormData();
    
    // Adicionar eventos para botões de ação
    const saveBtn = document.getElementById('saveBtn');
    const exportWordBtn = document.getElementById('exportWordBtn');
    
    if (saveBtn) saveBtn.addEventListener('click', DataStorage.saveFormData);
    if (exportWordBtn) exportWordBtn.addEventListener('click', ExportUtils.exportToWord);
    
    // Inicializar a visualização em tempo real
    if (typeof RealtimePreview !== 'undefined') RealtimePreview.initialize();
    
    // Landing Page Logic
    const btnComecar = document.getElementById('btnComecar');
    if (btnComecar) {
        btnComecar.addEventListener('click', () => {
            document.getElementById('landing-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            
            // Garantir que a primeira aba comece visível (Gerador de Currículo)
            document.getElementById('gerador-section').style.display = 'grid';
        });
    }

    // TAB NAVIGATION LOGIC
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
                b.setAttribute('tabindex', '-1');
            });
            tabSections.forEach(s => s.style.display = 'none');
            
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            btn.setAttribute('tabindex', '0');
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            
            if (targetId === 'gerador-section') {
                targetEl.style.display = 'grid';
            } else {
                targetEl.style.display = 'block';
            }
        });
    });

    // URL da API:
    // Permite que o usuário use o backend local ou remoto conforme onde estiver rodando.
    // Pode ser sobrescrita definindo window.CURRICULINHO_API_BASE ou via localStorage.
    function getApiCandidates() {
        const custom = window.CURRICULINHO_API_BASE || localStorage.getItem('curriculinho_api_url');
        if (custom) return [custom.replace(/\/+$/, '')];

        const isLocalHost = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
        if (isLocalHost) {
            return ['http://127.0.0.1:8000/api/v1', 'http://localhost:8000/api/v1'];
        }
        // Se estiver no GitHub Pages ou Render, tenta o serviço publicado no Render primeiro,
        // com fallback para localhost se o usuário estiver com o backend local aberto.
        return [
            'https://curriculinho-api.onrender.com/api/v1',
            'http://127.0.0.1:8000/api/v1'
        ];
    }
    const MAX_PDF_BYTES = 5 * 1024 * 1024;

    // Função de enviar para a IA (Avaliador e Match)
    function sendToAI(fileInputId, endpoint, resultContainerId, textContentId, extraData = {}, kind = 'evaluate') {
        const fileInput = document.getElementById(fileInputId);
        const resultContainer = document.getElementById(resultContainerId);
        const aiResultContent = document.getElementById(textContentId);

        if (!fileInput.files || !fileInput.files[0]) {
            showNotification('Por favor, anexe um currículo em PDF!', 'error');
            return;
        }

        const file = fileInput.files[0];
        if (file.size > MAX_PDF_BYTES) {
            showNotification('O arquivo excede 5MB. Escolha um PDF menor.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        
        for (const key in extraData) {
            formData.append(key, extraData[key]);
        }

        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // UX de Carregamento Animado
        aiResultContent.innerHTML = `
            <div class="ai-loading-container" role="status" aria-live="polite">
                <div class="progress-percentage">0%</div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" id="aiProgressFill"></div>
                </div>
                <p class="progress-status" id="aiProgressStatus">Recebendo documento...</p>
            </div>
        `;

        const progressFill = document.getElementById('aiProgressFill');
        const progressStatus = document.getElementById('aiProgressStatus');
        const progressPercentage = document.querySelector('.progress-percentage');
        
        let progress = 0;
        const steps = [
            { threshold: 10, text: "Preparando documento em PDF..." },
            { threshold: 30, text: "Lendo e extraindo informações..." },
            { threshold: 60, text: "A IA está analisando seus dados..." },
            { threshold: 80, text: "Cruzando habilidades e perfil..." },
            { threshold: 95, text: "Formatando os resultados finais... (a primeira análise pode demorar um pouco mais)" }
        ];

        const progressInterval = setInterval(() => {
            if (progress < 95) {
                progress += Math.floor(Math.random() * 4) + 1;
                if (progress > 95) progress = 95;
                
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (progressPercentage) progressPercentage.textContent = `${progress}%`;

                const currentStep = steps.slice().reverse().find(s => progress >= s.threshold);
                if (currentStep && progressStatus) {
                    progressStatus.textContent = currentStep.text;
                }
            }
        }, 500);

        async function postToEndpoint() {
            const candidates = getApiCandidates();
            let lastError = null;

            for (const base of candidates) {
                try {
                    const response = await fetch(`${base}${endpoint}`, {
                        method: 'POST',
                        body: formData
                    });
                    if (!response.ok) {
                        const err = await response.json().catch(() => ({}));
                        throw new Error(err.detail || `Erro do servidor (${response.status})`);
                    }
                    return await response.json();
                } catch (err) {
                    lastError = err;
                    // Se for erro de rede/CORS, continua para o próximo candidato
                    console.warn(`Tentativa em ${base}${endpoint} falhou:`, err.message);
                }
            }
            throw lastError || new Error("Não foi possível conectar ao servidor.");
        }

        postToEndpoint()
        .then(data => {
            clearInterval(progressInterval);
            if (progressFill) progressFill.style.width = '100%';
            if (progressPercentage) progressPercentage.textContent = '100%';
            if (progressStatus) progressStatus.textContent = 'Análise concluída com sucesso!';
            
            setTimeout(() => {
                const text = data.feedback || data.match_analysis || "Análise concluída, mas sem texto retornado.";

                if (window.CurriculinhoUI && typeof window.CurriculinhoUI.renderAIResult === 'function') {
                    window.CurriculinhoUI.renderAIResult(aiResultContent, text, kind);
                } else {
                    const htmlOutput = window.escapeHTML(text)
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br>');
                    aiResultContent.innerHTML = `<p>${htmlOutput}</p>`;
                }
                showNotification('Análise concluída!', 'success');
            }, 800);
        })
        .catch(error => {
            clearInterval(progressInterval);
            console.error('Erro final na comunicação com IA:', error);
            const offline = error instanceof TypeError || error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
            const msg = offline
                ? 'Não foi possível conectar ao servidor de IA.<br><small style="color:var(--text-muted)">Certifique-se de que o backend FastAPI esteja rodando localmente (porta 8000) ou que o serviço no Render tenha sido iniciado.</small>'
                : error.message;
            aiResultContent.innerHTML = `<div class="ai-error" role="alert"><i class="bi bi-exclamation-octagon" aria-hidden="true"></i><div><strong>Houve um erro ao se comunicar com a IA.</strong><br>${msg}</div></div>`;
            showNotification('Falha ao analisar.', 'error');
        });
    }

    // Bind AI Buttons
    const evaluateBtn = document.getElementById('btnEvaluate');
    if (evaluateBtn) {
        evaluateBtn.addEventListener('click', () => {
            sendToAI('resumePdfAvaliador', '/resume/evaluate', 'aiResultContainer', 'aiResultContent', {}, 'evaluate');
        });
    }
    
    const matchBtn = document.getElementById('btnMatch');
    if (matchBtn) {
        matchBtn.addEventListener('click', () => {
            const jobDesc = document.getElementById('jobDescription');
            if (!jobDesc || !jobDesc.value.trim()) {
                showNotification('Por favor, cole a descrição da vaga para o Match!', 'error');
                return;
            }
            // O Match usa o mesmo contêiner de resultado compartilhado do Avaliador
            sendToAI('resumePdfMatch', '/jobs/match', 'aiResultContainer', 'aiResultContent', {
                job_description: jobDesc.value.trim()
            }, 'match');
        });
    }
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `toast toast--${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('is-leaving');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 3500);
}
window.showNotification = showNotification;

function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal" role="alertdialog" aria-modal="true" aria-label="Confirmação">
                <p></p>
                <div class="confirm-modal__actions">
                    <button type="button" class="btn btn--ghost" data-action="cancel">Cancelar</button>
                    <button type="button" class="btn btn--primary" data-action="confirm">Confirmar</button>
                </div>
            </div>`;
        overlay.querySelector('p').textContent = message;
        document.body.appendChild(overlay);

        const close = (value) => {
            document.body.removeChild(overlay);
            resolve(value);
        };
        overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
        overlay.querySelector('[data-action="confirm"]').focus();
    });
}
window.showConfirm = showConfirm;

// Dropzone file name display logic & drag/drop
document.addEventListener('DOMContentLoaded', () => {
    const setupDropzone = (inputId, displayId) => {
        const input = document.getElementById(inputId);
        const display = document.getElementById(displayId);
        if (input && display) {
            const dropzoneLabel = input.closest('.dropzone-label');
            
            // Change event (Click to select)
            input.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    display.textContent = '✅ Arquivo selecionado: ' + this.files[0].name;
                } else {
                    display.textContent = '';
                }
            });
            
            dropzoneLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzoneLabel.classList.add('is-dragover');
            });
            
            dropzoneLabel.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropzoneLabel.classList.remove('is-dragover');
            });
            
            dropzoneLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzoneLabel.classList.remove('is-dragover');
                
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    input.files = e.dataTransfer.files;
                    input.dispatchEvent(new Event('change'));
                }
            });
        }
    };
    
    setupDropzone('resumePdfAvaliador', 'file-name-avaliador');
    setupDropzone('resumePdfMatch', 'file-name-match');
});

// Phone Mask Logic
document.addEventListener('DOMContentLoaded', () => {
    const maskPhone = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        if (val.length > 2) {
            val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        }
        if (val.length > 10) {
            val = `${val.slice(0, 10)}-${val.slice(10)}`;
        }
        e.target.value = val;
    };
    const phone1 = document.getElementById('phone1');
    const phone2 = document.getElementById('phone2');
    if (phone1) phone1.addEventListener('input', maskPhone);
    if (phone2) phone2.addEventListener('input', maskPhone);
});
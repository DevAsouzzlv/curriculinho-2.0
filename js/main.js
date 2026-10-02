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
            // Apenas foca na pré-visualização quando clicado no "Visualizar & Concluir"
            document.querySelector('.preview-card').scrollIntoView({ behavior: 'smooth' });
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
            });
            tabSections.forEach(s => s.style.display = 'none');
            
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            
            if (targetId === 'gerador-section') {
                targetEl.style.display = 'grid';
            } else {
                targetEl.style.display = 'block';
            }
        });
    });

    // Função de enviar para a IA (Avaliador e Match)
    function sendToAI(fileInputId, endpoint, resultContainerId, textContentId, extraData = {}) {
        const fileInput = document.getElementById(fileInputId);
        const resultContainer = document.getElementById(resultContainerId);
        const aiResultContent = document.getElementById(textContentId);

        if (!fileInput.files || !fileInput.files[0]) {
            showNotification('Por favor, anexe um currículo em PDF!', 'error');
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        for (const key in extraData) {
            formData.append(key, extraData[key]);
        }

        resultContainer.style.display = 'block';
        
        // NOVO: UX de Carregamento Animado
        aiResultContent.innerHTML = `
            <div class="ai-loading-container">
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
            { threshold: 95, text: "Formatando os resultados finais..." }
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

        const API_BASE = "http://localhost:8000/api/v1";

        fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.detail || "Erro desconhecido") });
            }
            return response.json();
        })
        .then(data => {
            clearInterval(progressInterval);
            if (progressFill) progressFill.style.width = '100%';
            if (progressPercentage) progressPercentage.textContent = '100%';
            if (progressStatus) progressStatus.textContent = 'Análise concluída com sucesso!';
            
            setTimeout(() => {
                let markdownText = data.feedback || data.match_analysis || "Análise concluída, mas sem texto retornado.";
                markdownText = window.escapeHTML(markdownText);
                
                let htmlOutput = markdownText
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');
                
                aiResultContent.innerHTML = `<p>${htmlOutput}</p>`;
                showNotification('Análise concluída!', 'success');
            }, 800);
        })
        .catch(error => {
            clearInterval(progressInterval);
            console.error('Erro:', error);
            aiResultContent.innerHTML = `<p style="color: red;">Houve um erro ao se comunicar com a IA:<br>${window.escapeHTML(error.message)}</p>`;
            showNotification('Falha ao analisar.', 'error');
        });
    }

    // Bind AI Buttons
    const evaluateBtn = document.getElementById('btnEvaluate');
    if (evaluateBtn) {
        evaluateBtn.addEventListener('click', () => {
            sendToAI('resumePdfAvaliador', '/resume/evaluate', 'aiResultContainer', 'aiResultContent');
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
            sendToAI('resumePdfMatch', '/jobs/match', 'matchResultContainer', 'matchResultContent', {
                job_description: jobDesc.value.trim()
            });
        });
    }
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.5s';
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
            break;
        case 'info':
            notification.style.backgroundColor = '#2196F3';
            notification.style.color = 'white';
            break;
    }
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 3000);
}
window.showNotification = showNotification;

function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '30px';
        modal.style.borderRadius = '10px';
        modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        modal.style.maxWidth = '400px';
        modal.style.textAlign = 'center';

        const text = document.createElement('p');
        text.textContent = message;
        text.style.marginBottom = '20px';
        text.style.fontSize = '1.1rem';
        text.style.color = '#2d3748';

        const btnsContainer = document.createElement('div');
        btnsContainer.style.display = 'flex';
        btnsContainer.style.gap = '15px';
        btnsContainer.style.justifyContent = 'center';

        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Cancelar';
        btnCancel.style.padding = '8px 16px';
        btnCancel.style.border = '1px solid #cbd5e0';
        btnCancel.style.backgroundColor = '#f8fafc';
        btnCancel.style.borderRadius = '5px';
        btnCancel.style.cursor = 'pointer';

        const btnConfirm = document.createElement('button');
        btnConfirm.textContent = 'Confirmar';
        btnConfirm.style.padding = '8px 16px';
        btnConfirm.style.border = 'none';
        btnConfirm.style.backgroundColor = '#dc2626';
        btnConfirm.style.color = 'white';
        btnConfirm.style.borderRadius = '5px';
        btnConfirm.style.cursor = 'pointer';

        btnsContainer.appendChild(btnCancel);
        btnsContainer.appendChild(btnConfirm);

        modal.appendChild(text);
        modal.appendChild(btnsContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        btnCancel.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });

        btnConfirm.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });
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
                    display.textContent = '✅ Arquivo selecionado: ' + window.escapeHTML(this.files[0].name);
                } else {
                    display.textContent = '';
                }
            });
            
            // Drag over events
            dropzoneLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzoneLabel.style.backgroundColor = '#eaf2fb';
                dropzoneLabel.style.borderColor = '#155491';
            });
            
            dropzoneLabel.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropzoneLabel.style.backgroundColor = '';
                dropzoneLabel.style.borderColor = '';
            });
            
            // Drop event
            dropzoneLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzoneLabel.style.backgroundColor = '';
                dropzoneLabel.style.borderColor = '';
                
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    input.files = e.dataTransfer.files;
                    const event = new Event('change');
                    input.dispatchEvent(event);
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
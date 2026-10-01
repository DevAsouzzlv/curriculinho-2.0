document.addEventListener('DOMContentLoaded', function() {
    // Inicializar manipuladores de formulário
    FormHandlers.initializeFormHandlers();
    
    // Carregar dados salvos
    DataStorage.loadFormData();
    
    // Adicionar eventos para botões de ação
    document.getElementById('saveBtn').addEventListener('click', DataStorage.saveFormData);
    document.getElementById('exportWordBtn').addEventListener('click', ExportUtils.exportToWord);
    
    // Inicializar a visualização em tempo real
    RealtimePreview.initialize();
    
    // Landing Page Logic
    const btnComecar = document.getElementById('btnComecar');
    if (btnComecar) {
        btnComecar.addEventListener('click', () => {
            document.getElementById('landing-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            
            // Garantir que a primeira aba comece visível (Gerador de Currículo)
            document.getElementById('gerador-section').style.display = 'flex';
        });
    }

    // TAB NAVIGATION LOGIC
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabSections.forEach(s => s.style.display = 'none');
            
            // Adiciona active no clicado
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).style.display = targetId === 'gerador-section' ? 'flex' : 'block';
            
            // Oculta o resultado da IA ao trocar de aba
            document.getElementById('aiResultContainer').style.display = 'none';
        });
    });

    // Verificar se há dados salvos e mostrar notificação
    if (localStorage.getItem('resumeData')) {
        showNotification('Dados carregados do armazenamento local', 'info');
    }
});

/**
 * Exibe uma notificação temporária
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificação (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.5s';
    
    // Definir cor com base no tipo
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#2ecc71';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            notification.style.color = 'white';
            break;
        case 'info':
            notification.style.backgroundColor = '#3498db';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2ecc71';
            notification.style.color = 'white';
    }
    
    // Adicionar ao corpo do documento
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Tornar a função showNotification global
window.showNotification = showNotification;

// --- IA Analyzer Logic ---
document.addEventListener('DOMContentLoaded', function() {
    const btnEvaluate = document.getElementById('btnEvaluate');
    const btnMatch = document.getElementById('btnMatch');
    const aiResultContainer = document.getElementById('aiResultContainer');
    const aiResultTitle = document.getElementById('aiResultTitle');
    const aiResultContent = document.getElementById('aiResultContent');

    const API_BASE = "http://127.0.0.1:8000/api/v1";

    async function sendToAI(endpoint, formData, title) {
        // Exibe loading interativo
        aiResultContainer.style.display = 'block';
        aiResultTitle.innerHTML = `<span class="loading-text">⏳ ${title} (Analisando...)</span>`;
        aiResultContent.innerHTML = `<div style="text-align: center; padding: 20px;"><p style="color: #4a5568;">A Inteligência Artificial está processando seu documento.<br>Isso pode levar alguns segundos...</p></div>`;

        // Smooth scroll para o container de resultado
        aiResultContainer.scrollIntoView({ behavior: 'smooth' });

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Erro desconhecido');
            }

            const data = await response.json();
            aiResultTitle.innerHTML = `✅ ${title}`;
            
            // Pega o texto da IA
            let textOutput = data.feedback || data.match_analysis || "Nenhuma análise retornada.";
            
            // Parser básico de Markdown para HTML
            let htmlOutput = textOutput
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrito
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Itálico
                .replace(/\n\n/g, '</p><p>') // Parágrafos
                .replace(/\n- /g, '<br>• ') // Listas
                .replace(/\n/g, '<br>'); // Quebras de linha normais
                
            aiResultContent.innerHTML = `<p>${htmlOutput}</p>`;
            showNotification('Análise concluída com sucesso!', 'success');

        } catch (error) {
            aiResultTitle.innerHTML = "❌ Erro na Análise";
            aiResultContent.innerHTML = `<p style="color: red;">Houve um erro ao se comunicar com a IA:<br>${error.message}</p>`;
            showNotification('Falha ao analisar.', 'error');
        }
    }

    if (btnEvaluate) {
        btnEvaluate.addEventListener('click', () => {
            const fileInput = document.getElementById('resumePdfAvaliador');
            if (!fileInput.files[0]) {
                showNotification('Por favor, anexe um currículo em PDF!', 'error');
                return;
            }
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            sendToAI('/resume/evaluate', formData, 'Avaliação Diagnóstica do Currículo');
        });
    }

    if (btnMatch) {
        btnMatch.addEventListener('click', () => {
            const fileInput = document.getElementById('resumePdfMatch');
            const jobDescription = document.getElementById('jobDescription');
            
            if (!fileInput.files[0]) {
                showNotification('Por favor, anexe um currículo em PDF!', 'error');
                return;
            }
            if (!jobDescription.value.trim()) {
                showNotification('Por favor, cole a descrição da vaga para o Match!', 'error');
                return;
            }
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('job_description', jobDescription.value);
            sendToAI('/jobs/match', formData, 'Match com a Vaga (Gaps e Aderência)');
        });
    }
});
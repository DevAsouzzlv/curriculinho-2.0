/**
 * Módulo para gerenciar a visualização em tempo real do currículo
 */
const RealtimePreview = (function() {
    const esc = window.escapeHTML || (x => x);
    // Armazenar referências a elementos DOM frequentemente acessados
    let elements = {};
    
    // Armazenar timers para debounce
    let debounceTimers = {};
    
    /**
     * Inicializa a visualização em tempo real
     */
    function initialize() {
        // Criar a estrutura básica do currículo na visualização
        createInitialPreview();
        
        // Armazenar referências a elementos DOM
        cacheElements();
        
        // Adicionar listeners para todos os campos do formulário
        setupEventListeners();
        
        // Atualizar a visualização com os dados atuais (se houver)
        updateFullPreview();
    }
    
    /**
     * Cria a estrutura inicial do currículo na área de visualização
     */
    function createInitialPreview() {
        const previewContainer = document.getElementById('resumePreview');
        
        previewContainer.innerHTML = `
            <div class="resume" id="resumePaper">
                <!-- 1. DADOS PESSOAIS -->
                <header class="resume-header">
                    <h1 id="preview-name">Arthur Miguel Souza de Oliveira</h1>
                    <div class="resume-subtitle" id="preview-subtitle">Engenheiro Pleno de Software</div>
                    <div class="resume-meta" id="preview-meta">
                        <span id="preview-meta-location"><i class="bi bi-geo-alt" aria-hidden="true"></i> Santo Antônio de Jesus – BA</span>
                        <span class="meta-dot" aria-hidden="true">•</span>
                        <span id="preview-meta-phone">(75) 98145-0488</span>
                        <span class="meta-dot" aria-hidden="true">•</span>
                        <span id="preview-meta-email">ssouzarthur90@gmail.com</span>
                    </div>
                </header>
                
                <div class="resume-divider"></div>
                
                <!-- 2. OBJETIVO / SÍNTESE -->
                <div class="resume-section empty-section" id="section-qualification">
                    <h2>OBJETIVO / SÍNTESE DE QUALIFICAÇÕES</h2>
                    <p id="preview-qualification-summary">Sua síntese de qualificações aparecerá aqui.</p>
                </div>
                
                <!-- 3. FORMAÇÃO ACADÊMICA -->
                <div class="resume-section empty-section" id="section-education">
                    <h2>FORMAÇÃO ACADÊMICA</h2>
                    <div id="preview-education">
                        <p class="placeholder-text">Sua formação acadêmica aparecerá aqui.</p>
                    </div>
                </div>
                
                <!-- 4. CURSOS COMPLEMENTARES -->
                <div class="resume-section" id="preview-courses-section" style="display: none;">
                    <h2>CURSOS COMPLEMENTARES</h2>
                    <div id="preview-courses"></div>
                </div>
                
                <!-- 5. COMPETÊNCIAS -->
                <div class="resume-section" id="preview-competencies-section" style="display: none;">
                    <h2>COMPETÊNCIAS</h2>
                    <div id="preview-competencies-text"></div>
                </div>
                
                <!-- 6. TECNOLOGIAS E FERRAMENTAS -->
                <div class="resume-section" id="preview-tools-section" style="display: none;">
                    <h2>TECNOLOGIAS E FERRAMENTAS</h2>
                    <div id="preview-skills-chips" class="resume-chips-grid"></div>
                </div>
                
                <!-- 7. EXPERIÊNCIA PROFISSIONAL -->
                <div class="resume-section empty-section" id="section-experience">
                    <h2>EXPERIÊNCIA PROFISSIONAL</h2>
                    <div id="preview-experience">
                        <p class="placeholder-text">Suas experiências profissionais aparecerão aqui.</p>
                    </div>
                </div>
                
                <!-- INFORMAÇÕES COMPLEMENTARES (se houver) -->
                <div class="resume-section" id="preview-additional-info-section" style="display: none;">
                    <h2>INFORMAÇÕES COMPLEMENTARES</h2>
                    <p id="preview-additional-info"></p>
                </div>
            </div>

            <!-- Botões de ação da prévia (fora do papel do currículo) -->
            <div class="resume-actions only-screen">
                <button type="button" id="exportWordPreviewBtn" class="resume-action-btn resume-action-btn--word"><i class="bi bi-file-earmark-word" aria-hidden="true"></i> Exportar para Word</button>
                <button type="button" id="printResumeBtn" class="resume-action-btn resume-action-btn--print"><i class="bi bi-printer" aria-hidden="true"></i> Imprimir</button>
                <button type="button" id="savePdfBtn" class="btn-primary-pdf"><i class="bi bi-download" aria-hidden="true"></i> Salvar em PDF</button>
            </div>
        `;
    }
    
    /**
     * Armazena referências a elementos DOM frequentemente acessados
     */
    function cacheElements() {
        elements = {
            // Campos de informações pessoais
            name: document.getElementById('name'),
            birthplace: document.getElementById('birthplace'),
            maritalStatus: document.getElementById('maritalStatus'),
            age: document.getElementById('age'),
            neighborhood: document.getElementById('neighborhood'),
            city: document.getElementById('city'),
            state: document.getElementById('state'),
            phone1: document.getElementById('phone1'),
            phone2: document.getElementById('phone2'),
            email: document.getElementById('email'),
            license: document.getElementById('license'),
            
            // Objetivo e síntese
            objective: document.getElementById('objective'),
            qualificationSummary: document.getElementById('qualificationSummary'),
            
            // Informações adicionais
            additionalInfo: document.getElementById('additionalInfo'),
            
            // Outras habilidades
            otherHardSkills: document.getElementById('otherHardSkills'),
            otherSoftSkills: document.getElementById('otherSoftSkills'),
            
            // Elementos de visualização
            previewName: document.getElementById('preview-name'),
            previewSubtitle: document.getElementById('preview-subtitle'),
            previewMeta: document.getElementById('preview-meta'),
            previewMetaLocation: document.getElementById('preview-meta-location'),
            previewMetaPhone: document.getElementById('preview-meta-phone'),
            previewMetaEmail: document.getElementById('preview-meta-email'),
            previewQualificationSummary: document.getElementById('preview-qualification-summary'),
            previewEducation: document.getElementById('preview-education'),
            previewExperience: document.getElementById('preview-experience'),
            previewCourses: document.getElementById('preview-courses'),
            previewCoursesSection: document.getElementById('preview-courses-section'),
            previewCompetenciesSection: document.getElementById('preview-competencies-section'),
            previewCompetenciesText: document.getElementById('preview-competencies-text'),
            previewToolsSection: document.getElementById('preview-tools-section'),
            previewSkillsChips: document.getElementById('preview-skills-chips'),
            previewAdditionalInfo: document.getElementById('preview-additional-info'),
            previewAdditionalInfoSection: document.getElementById('preview-additional-info-section')
        };
    }
    
    /**
     * Configura os listeners de eventos para todos os campos do formulário
     */
    function setupEventListeners() {
        // Informações pessoais
        elements.name.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.birthplace.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.maritalStatus.addEventListener('change', () => updatePersonalInfo());
        elements.age.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.neighborhood.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.city.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.state.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.phone1.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.phone2.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.email.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.license.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        
        // Objetivo e síntese
        elements.objective.addEventListener('input', debounce(() => {
            const objVal = elements.objective.value;
            if (elements.previewSubtitle) {
                elements.previewSubtitle.textContent = objVal || 'Cargo / Área de Atuação';
            }
        }, 300));
        
        elements.qualificationSummary.addEventListener('input', debounce(() => {
            const qualVal = elements.qualificationSummary.value;
        elements.previewQualificationSummary.textContent = qualVal || 'Sua síntese de qualificações aparecerá aqui.';
        document.getElementById('section-qualification').classList.toggle('empty-section', !qualVal);
        }, 300));
        
        // Informações adicionais
        elements.additionalInfo.addEventListener('input', debounce(() => {
            const value = esc( elements.additionalInfo.value);
            elements.previewAdditionalInfo.textContent = value;
            elements.previewAdditionalInfoSection.style.display = value ? 'block' : 'none';
        }, 300));
        
        // Habilidades
        document.querySelectorAll('.hard-skill, .soft-skill').forEach(checkbox => {
            checkbox.addEventListener('change', debounce(() => updateSkills(), 300));
        });
        
        elements.otherHardSkills.addEventListener('input', debounce(() => updateSkills(), 300));
        elements.otherSoftSkills.addEventListener('input', debounce(() => updateSkills(), 300));
        
        // Configurar observadores para seções dinâmicas
        setupMutationObservers();
        
        // Adicionar listeners para botões de adicionar/remover
        document.getElementById('addEducation').addEventListener('click', () => {
            setTimeout(() => {
                addListenersToLastItem('education');
                updateEducation();
            }, 10);
        });
        
        document.getElementById('addExperience').addEventListener('click', () => {
            setTimeout(() => {
                addListenersToLastItem('experience');
                updateExperience();
            }, 10);
        });
        
        document.getElementById('addCourse').addEventListener('click', () => {
            setTimeout(() => {
                addListenersToLastItem('course');
                updateCourses();
            }, 10);
        });
        
        // Adicionar listeners aos itens iniciais
        addListenersToAllItems();
        
        // Listener para o botão de Exportar para Word na prévia
        const wordPreviewBtn = document.getElementById('exportWordPreviewBtn');
        if (wordPreviewBtn) {
            wordPreviewBtn.addEventListener('click', () => {
                if (typeof ExportUtils !== 'undefined' && ExportUtils.exportToWord) {
                    ExportUtils.exportToWord();
                }
            });
        }

        // Listener para o botão Imprimir (abre o modal de impressão nativo)
        const printBtn = document.getElementById('printResumeBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Listener para o botão Salvar em PDF (faz download direto do arquivo sem modal)
        const savePdfBtn = document.getElementById('savePdfBtn');
        if (savePdfBtn) {
            savePdfBtn.addEventListener('click', () => {
                if (typeof ExportUtils !== 'undefined' && ExportUtils.savePdfDirectly) {
                    ExportUtils.savePdfDirectly();
                } else {
                    window.print();
                }
            });
        }

        // Configurar seletor de paleta de cores para o currículo
        setupColorPicker();
    }

    /**
     * Configura o seletor de cores de destaque para o currículo (Estilo Foto 2)
     */
    function setupColorPicker() {
        const swatches = document.querySelectorAll('#colorSwatches .color-swatch');
        const atsBtn = document.getElementById('btnApplyAtsPb');
        const customColorInput = document.getElementById('customColorInput');
        
        // Recuperar cor salva anteriormente ou usar o padrão preto/grafite
        const savedColor = localStorage.getItem('curriculo_accent_color') || '#0f172a';
        applyResumeColor(savedColor);

        // Clique nas bolinhas de cores
        swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.getAttribute('data-color');
                applyResumeColor(color);
                try {
                    localStorage.setItem('curriculo_accent_color', color);
                } catch(e) {}
            });
        });

        // Botão "Aplicar Paleta P&B ATS"
        if (atsBtn) {
            atsBtn.addEventListener('click', () => {
                applyResumeColor('#0f172a');
                try {
                    localStorage.setItem('curriculo_accent_color', '#0f172a');
                } catch(e) {}
                if (window.showNotification) {
                    window.showNotification('Paleta P&B ATS aplicada com sucesso!', 'success');
                }
            });
        }

        // Input de cor customizada (Hex customizado)
        if (customColorInput) {
            customColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                applyResumeColor(color);
                try {
                    localStorage.setItem('curriculo_accent_color', color);
                } catch(e) {}
            });
        }

        // Salva e aplica a cor ativa
        window.applyResumeColor = applyResumeColor;

        function applyResumeColor(color) {
            const chosenColor = color || localStorage.getItem('curriculo_accent_color') || '#0f172a';
            const paper = document.getElementById('resumePaper');
            if (paper) {
                paper.style.setProperty('--resume-accent', chosenColor);
            }

            // Atualiza cor de elementos-chave diretamente para compatibilidade total
            const nameEl = document.getElementById('preview-name');
            if (nameEl) nameEl.style.color = chosenColor;

            const dividerEl = paper ? paper.querySelector('.resume-divider') : null;
            if (dividerEl) dividerEl.style.backgroundColor = chosenColor;

            const sectionTitles = paper ? paper.querySelectorAll('.resume-section h2') : [];
            sectionTitles.forEach(h2 => {
                h2.style.color = chosenColor;
            });

            // Atualizar estado ativo nas bolinhas
            swatches.forEach(s => {
                const swatchColor = s.getAttribute('data-color').toLowerCase();
                const isActive = swatchColor === chosenColor.toLowerCase();
                s.classList.toggle('is-active', isActive);
            });
        }
    }
    
    /**
     * Adiciona listeners a todos os itens existentes (educação, experiência, cursos)
     */
    function addListenersToAllItems() {
        // Educação
        document.querySelectorAll('.education-item').forEach(item => {
            addListenersToEducationItem(item);
        });
        
        // Experiência
        document.querySelectorAll('.experience-item').forEach(item => {
            addListenersToExperienceItem(item);
        });
        
        // Cursos
        document.querySelectorAll('.course-item').forEach(item => {
            addListenersToCourseItem(item);
        });
    }
    
    /**
     * Adiciona listeners ao último item adicionado de um determinado tipo
     * @param {string} type - Tipo de item (education, experience, course)
     */
    function addListenersToLastItem(type) {
        let container, selector, addListenersFunc;
        
        switch (type) {
            case 'education':
                container = document.getElementById('education-container');
                selector = '.education-item';
                addListenersFunc = addListenersToEducationItem;
                break;
            case 'experience':
                container = document.getElementById('experience-container');
                selector = '.experience-item';
                addListenersFunc = addListenersToExperienceItem;
                break;
            case 'course':
                container = document.getElementById('courses-container');
                selector = '.course-item';
                addListenersFunc = addListenersToCourseItem;
                break;
            default:
                return;
        }
        
        const items = container.querySelectorAll(selector);
        if (items.length > 0) {
            const lastItem = items[items.length - 1];
            addListenersFunc(lastItem);
        }
    }
    
    /**
     * Adiciona listeners a um item de educação
     * @param {HTMLElement} item - O item de educação
     */
    function addListenersToEducationItem(item) {
        const inputs = item.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => updateEducation(), 300));
            input.addEventListener('change', () => updateEducation());
        });
        
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                setTimeout(() => updateEducation(), 10);
            });
        }
    }
    
    /**
     * Adiciona listeners a um item de experiência
     * @param {HTMLElement} item - O item de experiência
     */
    function addListenersToExperienceItem(item) {
        const inputs = item.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => updateExperience(), 300));
            input.addEventListener('change', () => updateExperience());
        });
        
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                setTimeout(() => updateExperience(), 10);
            });
        }
    }
    
    /**
     * Adiciona listeners a um item de curso
     * @param {HTMLElement} item - O item de curso
     */
    function addListenersToCourseItem(item) {
        const inputs = item.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => updateCourses(), 300));
            input.addEventListener('change', () => updateCourses());
        });
        
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                setTimeout(() => updateCourses(), 10);
            });
        }
    }
    
    /**
     * Configura observadores de mutação para detectar alterações nas seções dinâmicas
     */
    function setupMutationObservers() {
        const educationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('education-item')) {
                            addListenersToEducationItem(node);
                        }
                    });
                    updateEducation();
                }
            }
        });
        
        educationObserver.observe(document.getElementById('education-container'), { childList: true });
        
        const experienceObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('experience-item')) {
                            addListenersToExperienceItem(node);
                        }
                    });
                    updateExperience();
                }
            }
        });
        
        experienceObserver.observe(document.getElementById('experience-container'), { childList: true });
        
        const coursesObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('course-item')) {
                            addListenersToCourseItem(node);
                        }
                    });
                    updateCourses();
                }
            }
        });
        
        coursesObserver.observe(document.getElementById('courses-container'), { childList: true });
    }
    
    /**
     * Atualiza todas as seções do currículo na visualização
     */
    function updateFullPreview() {
        updatePersonalInfo();
        
        // Subtítulo e síntese
        const qualVal = elements.qualificationSummary.value;
        if (elements.previewQualificationSummary) {
            elements.previewQualificationSummary.textContent = qualVal || 'Sua síntese de qualificações aparecerá aqui.';
        }
        const secQual = document.getElementById('section-qualification');
        if (secQual) secQual.classList.toggle('empty-section', !qualVal);
        
        // Seções dinâmicas
        updateEducation();
        updateExperience();
        updateCourses();
        updateSkills();
        
        // Informações adicionais
        const additionalInfo = esc( elements.additionalInfo.value);
        elements.previewAdditionalInfo.textContent = additionalInfo;
        elements.previewAdditionalInfoSection.style.display = additionalInfo ? 'block' : 'none';

        // Reaplicar cor de destaque ativa nos títulos e linhas
        if (typeof window.applyResumeColor === 'function') {
            window.applyResumeColor();
        }
    }
    
    /**
     * Atualiza as informações pessoais na visualização
     */
    function updatePersonalInfo() {
        // Nome
        const name = esc( elements.name.value);
        if (elements.previewName) elements.previewName.textContent = name || 'Nome Completo';
        
        // Cargo / Subtítulo
        const objVal = esc( elements.objective.value);
        if (elements.previewSubtitle) {
            elements.previewSubtitle.textContent = objVal || 'Cargo / Área de Atuação';
            elements.previewSubtitle.style.display = objVal ? 'block' : 'none';
        }
        
        // Localização (Cidade - UF ou Bairro)
        const city = esc( elements.city.value);
        const state = esc( elements.state.value);
        const neighborhood = esc( elements.neighborhood.value);
        let locText = '';
        if (city && state) locText = `${city} – ${state}`;
        else if (city) locText = city;
        else if (neighborhood) locText = neighborhood;
        
        if (elements.previewMetaLocation) {
            if (locText) {
                elements.previewMetaLocation.innerHTML = `<i class="bi bi-geo-alt" aria-hidden="true"></i> ${locText}`;
                elements.previewMetaLocation.style.display = 'inline';
            } else {
                elements.previewMetaLocation.style.display = 'none';
            }
        }
        
        // Telefone
        const phone1 = esc( elements.phone1.value);
        const phone2 = esc( elements.phone2.value);
        const phone = phone1 || phone2;
        if (elements.previewMetaPhone) {
            if (phone) {
                elements.previewMetaPhone.textContent = phone;
                elements.previewMetaPhone.style.display = 'inline';
            } else {
                elements.previewMetaPhone.style.display = 'none';
            }
        }
        
        // Email
        const email = esc( elements.email.value);
        if (elements.previewMetaEmail) {
            if (email) {
                elements.previewMetaEmail.textContent = email;
                elements.previewMetaEmail.style.display = 'inline';
            } else {
                elements.previewMetaEmail.style.display = 'none';
            }
        }
    }
    
    /**
     * Atualiza a seção de educação na visualização
     */
    function updateEducation() {
        const educationItems = document.querySelectorAll('.education-item');
        let educationHTML = '';
        
        if (educationItems.length === 0) {
            document.getElementById('section-education').classList.add('empty-section');
            elements.previewEducation.innerHTML = '<p class="placeholder-text">Sua formação acadêmica aparecerá aqui.</p>';
            return;
        }
        
        educationItems.forEach(item => {
            const level = esc( item.querySelector('.education-level').value);
            const course = esc( item.querySelector('.education-course').value);
            const institution = esc( item.querySelector('.institution').value);
            const status = esc( item.querySelector('.education-status').value);
            const year = esc( item.querySelector('.education-year').value);
            const shift = esc( item.querySelector('.education-shift').value);
            
            if (level || institution || status || year) {
                let educationText = `${level || 'Nível não especificado'}`;
                if (course) educationText += ` em ${course}`;
                educationText += ` – ${institution || 'Instituição não especificada'} – ${status || 'Status não especificado'}`;
                if (year) educationText += `, ${year}`;
                if (shift) educationText += `, ${shift}`;
                
                educationHTML += `
                    <div class="resume-item">
                        <p>● ${educationText}</p>
                    </div>
                `;
            }
        });
        
        if (educationHTML) {
            document.getElementById('section-education').classList.remove('empty-section');
            elements.previewEducation.innerHTML = educationHTML;
        } else {
            document.getElementById('section-education').classList.add('empty-section');
            elements.previewEducation.innerHTML = '<p class="placeholder-text">Sua formação acadêmica aparecerá aqui.</p>';
        }
    }
    
    /**
     * Atualiza a seção de experiência na visualização
     */
    function updateExperience() {
        const experienceItems = document.querySelectorAll('.experience-item');
        let experienceHTML = '';
        
        if (experienceItems.length === 0) {
            document.getElementById('section-experience').classList.add('empty-section');
            elements.previewExperience.innerHTML = '<p class="placeholder-text">Sem experiências profissionais anteriores.</p>';
            return;
        }
        
        let hasValidExperience = false;
        
        experienceItems.forEach(item => {
            const position = esc( item.querySelector('.position').value);
            const company = esc( item.querySelector('.company').value);
            const period = esc( item.querySelector('.job-period').value);
            const description = esc( item.querySelector('.job-description').value);
            
            if (position || company || period) {
                hasValidExperience = true;
                experienceHTML += `
                    <div class="resume-item">
                        <p>● ${position || 'Cargo não especificado'} | ${company || 'Empresa não especificada'} | ${period || 'Período não especificado'}</p>
                        <p>${description || 'Sem descrição de atividades.'}</p>
                    </div>
                `;
            }
        });
        
        if (hasValidExperience) {
            document.getElementById('section-experience').classList.remove('empty-section');
            elements.previewExperience.innerHTML = experienceHTML;
        } else {
            document.getElementById('section-experience').classList.add('empty-section');
            elements.previewExperience.innerHTML = '<p class="placeholder-text">Sem experiências profissionais anteriores.</p>';
        }
    }
    
    /**
     * Atualiza a seção de cursos na visualização
     */
    function updateCourses() {
        const courseItems = document.querySelectorAll('.course-item');
        let coursesHTML = '';
        
        if (courseItems.length === 0) {
            elements.previewCoursesSection.style.display = 'none';
            return;
        }
        
        let hasValidCourse = false;
        
        courseItems.forEach(item => {
            const courseName = esc( item.querySelector('.course-name').value);
            const institution = esc( item.querySelector('.course-institution').value);
            const hours = esc( item.querySelector('.course-hours').value);
            const year = esc( item.querySelector('.course-year').value);
            
            if (courseName || institution) {
                hasValidCourse = true;
                let courseText = `${courseName || 'Curso não especificado'} | ${institution || 'Instituição não especificada'}`;
                if (hours || year) {
                    courseText += ' | ';
                    if (hours) courseText += hours;
                    if (hours && year) courseText += ' ';
                    if (year) courseText += `(${year})`;
                }
                
                coursesHTML += `
                    <div class="resume-item">
                        <p>● ${courseText}</p>
                    </div>
                `;
            }
        });
        
        if (hasValidCourse) {
            elements.previewCourses.innerHTML = coursesHTML;
            elements.previewCoursesSection.style.display = 'block';
        } else {
            elements.previewCoursesSection.style.display = 'none';
        }
    }
    
    /**
     * Atualiza a seção de habilidades na visualização
     */
    function updateSkills() {
        const hardSkills = [];
        document.querySelectorAll('.hard-skill:checked').forEach(checkbox => {
            hardSkills.push(checkbox.value);
        });
        
        const softSkills = [];
        document.querySelectorAll('.soft-skill:checked').forEach(checkbox => {
            softSkills.push(checkbox.value);
        });
        
        // Adicionar outras habilidades
        const otherHardSkills = esc( elements.otherHardSkills.value);
        if (otherHardSkills) {
            otherHardSkills.split(',').forEach(skill => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                    hardSkills.push(trimmedSkill);
                }
            });
        }
        
        const otherSoftSkills = esc( elements.otherSoftSkills.value);
        if (otherSoftSkills) {
            otherSoftSkills.split(',').forEach(skill => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                    softSkills.push(trimmedSkill);
                }
            });
        }
        
        // 1. Tecnologias & Ferramentas Dominadas (Chips retangulares arredondados)
        if (elements.previewSkillsChips && elements.previewToolsSection) {
            const allChips = [...hardSkills];
            if (allChips.length > 0) {
                elements.previewSkillsChips.innerHTML = allChips
                    .map(skill => `<span class="resume-pill">${skill}</span>`)
                    .join('');
                elements.previewToolsSection.style.display = 'block';
            } else {
                elements.previewToolsSection.style.display = 'none';
            }
        }
        
        // 2. Principais Competências com marcadores (bullet dots)
        if (elements.previewCompetenciesText && elements.previewCompetenciesSection) {
            let compHTML = '';
            if (hardSkills.length > 0) {
                compHTML += `<p><strong>Hard Skills:</strong> ${hardSkills.join(' • ')}</p>`;
            }
            if (softSkills.length > 0) {
                compHTML += `<p><strong>Soft Skills:</strong> ${softSkills.join(' • ')}</p>`;
            }
            if (compHTML) {
                elements.previewCompetenciesText.innerHTML = compHTML;
                elements.previewCompetenciesSection.style.display = 'block';
            } else {
                elements.previewCompetenciesSection.style.display = 'none';
            }
        }
    }
    
    /**
     * Função de debounce para limitar a frequência de execução de uma função
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em milissegundos
     * @param {string} [id] - Identificador opcional para o timer
     * @returns {Function} Função com debounce
     */
    function debounce(func, wait, id) {
        return function() {
            const context = this;
            const args = arguments;
            const timerId = id || func.toString();
            
            clearTimeout(debounceTimers[timerId]);
            
            debounceTimers[timerId] = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // API pública
    return {
        initialize,
        updateFullPreview
    };
})();
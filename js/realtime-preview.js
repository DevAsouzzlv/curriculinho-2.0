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
            <div class="resume">
                <div class="resume-header">
                    <h1 id="preview-name">Nome Completo</h1>
                    <p id="preview-personal-info"></p>
                    <p id="preview-address"></p>
                </div>
                
                <div class="resume-contact">
                    <p id="preview-phones"></p>
                    <p id="preview-email"></p>
                    <p id="preview-license"></p>
                </div>
                
                <div class="resume-section empty-section" id="section-objective">
                    <h2>Objetivo</h2>
                    <p id="preview-objective">Seu objetivo profissional aparecerá aqui.</p>
                </div>
                
                <div class="resume-section empty-section" id="section-qualification">
                    <h2>Síntese de Qualificações</h2>
                    <p id="preview-qualification-summary">Sua síntese de qualificações aparecerá aqui.</p>
                </div>
                
                <div class="resume-section empty-section" id="section-education">
                    <h2>Educação</h2>
                    <div id="preview-education">
                        <p class="placeholder-text">Sua formação acadêmica aparecerá aqui.</p>
                    </div>
                </div>
                
                <div class="resume-section empty-section" id="section-experience">
                    <h2>Experiências Profissionais/Acadêmicas</h2>
                    <div id="preview-experience">
                        <p class="placeholder-text">Suas experiências profissionais aparecerão aqui.</p>
                    </div>
                </div>
                
                <div class="resume-section" id="preview-courses-section" style="display: none;">
                    <h2>Cursos Complementares</h2>
                    <div id="preview-courses"></div>
                </div>
                
                <div class="resume-section" id="preview-skills-section" style="display: none;">
                    <h2>Habilidades</h2>
                    <div id="preview-skills"></div>
                </div>
                
                <div class="resume-section" id="preview-additional-info-section" style="display: none;">
                    <h2>Informações Complementares</h2>
                    <p id="preview-additional-info"></p>
                </div>
                
                <div class="resume-section">
                    <p><em>Atualizado em novembro de 2025.</em></p>
                </div>
                
                <div class="resume-actions only-screen">
                    <button id="printBtn" onclick="window.print()">Imprimir / Salvar PDF</button>
                </div>
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
            previewPersonalInfo: document.getElementById('preview-personal-info'),
            previewAddress: document.getElementById('preview-address'),
            previewPhones: document.getElementById('preview-phones'),
            previewEmail: document.getElementById('preview-email'),
            previewLicense: document.getElementById('preview-license'),
            previewObjective: document.getElementById('preview-objective'),
            previewQualificationSummary: document.getElementById('preview-qualification-summary'),
            previewEducation: document.getElementById('preview-education'),
            previewExperience: document.getElementById('preview-experience'),
            previewCourses: document.getElementById('preview-courses'),
            previewCoursesSection: document.getElementById('preview-courses-section'),
            previewSkills: document.getElementById('preview-skills'),
            previewSkillsSection: document.getElementById('preview-skills-section'),
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
        elements.previewObjective.textContent = objVal || 'Seu objetivo profissional aparecerá aqui.';
        document.getElementById('section-objective').classList.toggle('empty-section', !objVal);
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
        
        // Objetivo e síntese
        const objVal = elements.objective.value;
        elements.previewObjective.textContent = objVal || 'Seu objetivo profissional aparecerá aqui.';
        document.getElementById('section-objective').classList.toggle('empty-section', !objVal);
        const qualVal = elements.qualificationSummary.value;
        elements.previewQualificationSummary.textContent = qualVal || 'Sua síntese de qualificações aparecerá aqui.';
        document.getElementById('section-qualification').classList.toggle('empty-section', !qualVal);
        
        // Seções dinâmicas
        updateEducation();
        updateExperience();
        updateCourses();
        updateSkills();
        
        // Informações adicionais
        const additionalInfo = esc( elements.additionalInfo.value);
        elements.previewAdditionalInfo.textContent = additionalInfo;
        elements.previewAdditionalInfoSection.style.display = additionalInfo ? 'block' : 'none';
    }
    
    /**
     * Atualiza as informações pessoais na visualização
     */
    function updatePersonalInfo() {
        // Nome
        const name = esc( elements.name.value);
        elements.previewName.textContent = name || 'Nome Completo';
        
        // Linha de naturalidade, estado civil e idade
        let personalInfoLine = '';
        const birthplace = esc( elements.birthplace.value);
        const maritalStatus = esc( elements.maritalStatus.value);
        const age = esc( elements.age.value);
        
        if (birthplace) personalInfoLine += `Natural de ${birthplace}`;
        if (birthplace && (maritalStatus || age)) personalInfoLine += ', ';
        if (maritalStatus) personalInfoLine += `${maritalStatus}`;
        if ((birthplace || maritalStatus) && age) personalInfoLine += ', ';
        if (age) personalInfoLine += `${age} anos`;
        
        elements.previewPersonalInfo.textContent = personalInfoLine;
        
        // Linha de endereço
        let addressLine = '';
        const neighborhood = esc( elements.neighborhood.value);
        const city = esc( elements.city.value);
        const state = esc( elements.state.value);
        
        if (neighborhood) addressLine += neighborhood;
        if (neighborhood && (city || state)) addressLine += ', ';
        if (city) addressLine += city;
        if ((neighborhood || city) && state) addressLine += ' - ';
        if (state) addressLine += state;
        
        elements.previewAddress.textContent = addressLine;
        
        // Linha de telefones
        let phoneLine = '';
        const phone1 = esc( elements.phone1.value);
        const phone2 = esc( elements.phone2.value);
        
        if (phone1) phoneLine += phone1;
        if (phone1 && phone2) phoneLine += '; ';
        if (phone2) phoneLine += `${phone2} (ligação, WhatsApp ou recado)`;
        
        elements.previewPhones.textContent = phoneLine;
        
        // Email
        elements.previewEmail.textContent = esc( elements.email.value);
        
        // CNH
        const license = esc( elements.license.value);
        elements.previewLicense.textContent = license ? `CNH: ${license}` : '';
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
        
        // Formatar habilidades
        let skillsHTML = '';
        if (hardSkills.length > 0 || softSkills.length > 0) {
            skillsHTML += '<div class="skills-list">';
            
            if (hardSkills.length > 0) {
                skillsHTML += '<div class="skills-column"><h3>Hard Skills</h3>';
                hardSkills.forEach(skill => {
                    skillsHTML += `<span class="skill-tag">${skill}</span>`;
                });
                skillsHTML += '</div>';
            }
            
            if (softSkills.length > 0) {
                skillsHTML += '<div class="skills-column"><h3>Soft Skills</h3>';
                softSkills.forEach(skill => {
                    skillsHTML += `<span class="skill-tag">${skill}</span>`;
                });
                skillsHTML += '</div>';
            }
            
            skillsHTML += '</div>';
            
            elements.previewSkills.innerHTML = skillsHTML;
            elements.previewSkillsSection.style.display = 'block';
        } else {
            elements.previewSkillsSection.style.display = 'none';
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
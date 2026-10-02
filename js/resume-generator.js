/**
 * Módulo para gerar o currículo a partir dos dados do formulário
 */
const ResumeGenerator = (function() {
    const esc = window.escapeHTML || (x => x);
    /**
     * Gera o currículo HTML com base nos dados do formulário
     */
    function generateResume() {
        // Coletar informações pessoais
        const name = esc( document.getElementById('name').value);
        const birthplace = esc( document.getElementById('birthplace').value);
        const maritalStatus = esc( document.getElementById('maritalStatus').value);
        const age = esc( document.getElementById('age').value);
        const neighborhood = esc( document.getElementById('neighborhood').value);
        const city = esc( document.getElementById('city').value);
        const state = esc( document.getElementById('state').value);
        const phone1 = esc( document.getElementById('phone1').value);
        const phone2 = esc( document.getElementById('phone2').value);
        const email = esc( document.getElementById('email').value);
        const license = esc( document.getElementById('license').value);
        
        // Coletar objetivo e síntese
        const objective = esc( document.getElementById('objective').value);
        const qualificationSummary = esc( document.getElementById('qualificationSummary').value);
        
        // Coletar formação acadêmica
        const educationHTML = generateEducationHTML();
        
        // Coletar experiência profissional
        const experienceHTML = generateExperienceHTML();
        
        // Coletar cursos complementares
        const coursesHTML = generateCoursesHTML();
        
        // Coletar habilidades
        const skillsHTML = generateSkillsHTML();
        
        // Coletar informações complementares
        const additionalInfo = esc( document.getElementById('additionalInfo').value);
        
        // Construir o cabeçalho do currículo
        let headerHTML = `<h1>${name}</h1>`;
        
        // Linha de naturalidade, estado civil e idade
        let personalInfoLine = '';
        if (birthplace) personalInfoLine += `Natural de ${birthplace}`;
        if (birthplace && (maritalStatus || age)) personalInfoLine += ', ';
        if (maritalStatus) personalInfoLine += `${maritalStatus}`;
        if ((birthplace || maritalStatus) && age) personalInfoLine += ', ';
        if (age) personalInfoLine += `${age} anos`;
        
        // Linha de endereço
        let addressLine = '';
        if (neighborhood) addressLine += neighborhood;
        if (neighborhood && (city || state)) addressLine += ', ';
        if (city) addressLine += city;
        if ((neighborhood || city) && state) addressLine += ' - ';
        if (state) addressLine += state;
        
        // Linha de telefones
        let phoneLine = '';
        if (phone1) phoneLine += phone1;
        if (phone1 && phone2) phoneLine += '; ';
        if (phone2) phoneLine += `${phone2} (ligação, WhatsApp ou recado)`;
        
        // Montar o currículo
        const resumeHTML = `
            <div class="resume">
                <div class="resume-header">
                    ${headerHTML}
                    ${personalInfoLine ? `<p>${personalInfoLine}</p>` : ''}
                    ${addressLine ? `<p>${addressLine}</p>` : ''}
                </div>
                
                <div class="resume-contact">
                    ${phoneLine ? `<p>${phoneLine}</p>` : ''}
                    ${email ? `<p>${email}</p>` : ''}
                    ${license ? `<p>CNH: ${license}</p>` : ''}
                </div>
                
                ${objective ? `
                <div class="resume-section">
                    <h2>Objetivo</h2>
                    <p>${objective}</p>
                </div>
                ` : ''}
                
                ${qualificationSummary ? `
                <div class="resume-section">
                    <h2>Síntese de Qualificações</h2>
                    <p>${qualificationSummary}</p>
                </div>
                ` : ''}
                
                ${educationHTML ? `
                <div class="resume-section">
                    <h2>Educação</h2>
                    ${educationHTML}
                </div>
                ` : ''}
                
                ${experienceHTML ? `
                <div class="resume-section">
                    <h2>Experiências Profissionais/Acadêmicas</h2>
                    ${experienceHTML}
                </div>
                ` : ''}
                
                ${coursesHTML ? `
                <div class="resume-section">
                    <h2>Cursos Complementares</h2>
                    ${coursesHTML}
                </div>
                ` : ''}
                
                ${skillsHTML ? `
                <div class="resume-section">
                    <h2>Habilidades</h2>
                    ${skillsHTML}
                </div>
                ` : ''}
                
                ${additionalInfo ? `
                <div class="resume-section">
                    <h2>Informações Complementares</h2>
                    <p>${additionalInfo}</p>
                </div>
                ` : ''}
                
                
                
                <div class="resume-actions only-screen">
                    <button id="printBtn" onclick="window.print()">Imprimir / Salvar PDF</button>
                </div>
            </div>
        `;
        
        // Exibir o currículo gerado
        document.getElementById('resumePreview').innerHTML = resumeHTML;
        
        // Rolar até a visualização do currículo
        document.getElementById('resumePreview').scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Gera o HTML para a seção de educação
     * @returns {string} HTML formatado
     */
    function generateEducationHTML() {
        const educationItems = document.querySelectorAll('.education-item');
        let educationHTML = '';
        
        educationItems.forEach(item => {
            const level = esc( item.querySelector('.education-level').value);
            const course = esc( item.querySelector('.education-course').value);
            const institution = esc( item.querySelector('.institution').value);
            const status = esc( item.querySelector('.education-status').value);
            const year = esc( item.querySelector('.education-year').value);
            const shift = esc( item.querySelector('.education-shift').value);
            
            if (level && institution && status && year) {
                let educationText = `${level}`;
                if (course) educationText += ` em ${course}`;
                educationText += ` – ${institution} – ${status}`;
                if (year) educationText += `, ${year}`;
                if (shift) educationText += `, ${shift}`;
                
                educationHTML += `
                    <div class="resume-item">
                        <p>● ${educationText}</p>
                    </div>
                `;
            }
        });
        
        return educationHTML;
    }

    /**
     * Gera o HTML para a seção de experiência
     * @returns {string} HTML formatado
     */
    function generateExperienceHTML() {
        const experienceItems = document.querySelectorAll('.experience-item');
        let experienceHTML = '';
        
        experienceItems.forEach(item => {
            const position = esc( item.querySelector('.position').value);
            const company = esc( item.querySelector('.company').value);
            const period = esc( item.querySelector('.job-period').value);
            const description = esc( item.querySelector('.job-description').value);
            
            if (position && company && period) {
                experienceHTML += `
                    <div class="resume-item">
                        <p>● ${position} | ${company} | ${period}</p>
                        <p>${description}</p>
                    </div>
                `;
            }
        });
        
        return experienceHTML;
    }

    /**
     * Gera o HTML para a seção de cursos complementares
     * @returns {string} HTML formatado
     */
    function generateCoursesHTML() {
        const courseItems = document.querySelectorAll('.course-item');
        let coursesHTML = '';
        
        courseItems.forEach(item => {
            const courseName = esc( item.querySelector('.course-name').value);
            const institution = esc( item.querySelector('.course-institution').value);
            const hours = esc( item.querySelector('.course-hours').value);
            const year = esc( item.querySelector('.course-year').value);
            
            if (courseName && institution) {
                let courseText = `${courseName} | ${institution}`;
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
        
        return coursesHTML;
    }

    /**
     * Gera o HTML para a seção de habilidades
     * @returns {string} HTML formatado
     */
    function generateSkillsHTML() {
        const hardSkills = [];
        document.querySelectorAll('.hard-skill:checked').forEach(checkbox => {
            hardSkills.push(checkbox.value);
        });
        
        const softSkills = [];
        document.querySelectorAll('.soft-skill:checked').forEach(checkbox => {
            softSkills.push(checkbox.value);
        });
        
        // Adicionar outras habilidades
        const otherHardSkills = esc( document.getElementById('otherHardSkills').value);
        if (otherHardSkills) {
            otherHardSkills.split(',').forEach(skill => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                    hardSkills.push(trimmedSkill);
                }
            });
        }
        
        const otherSoftSkills = esc( document.getElementById('otherSoftSkills').value);
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
        }
        
        return skillsHTML;
    }

    // API pública
    return {
        generateResume
    };
})();
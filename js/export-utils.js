/**
 * Módulo para exportar o currículo para diferentes formatos
 */
const ExportUtils = (function() {
    /**
     * Exporta o currículo para o formato Word (.docx)
     */
    async function exportToWord() {
        // Verificar se o currículo foi gerado
        const resumePreview = document.getElementById('resumePreview');
        if (!resumePreview.innerHTML.trim()) {
            window.showNotification('Por favor, gere o currículo antes de exportar para Word.', 'error');
            return;
        }
        
        // Obter os dados do currículo
        const name = document.getElementById('name').value;
        const birthplace = document.getElementById('birthplace').value;
        const maritalStatus = document.getElementById('maritalStatus').value;
        const age = document.getElementById('age').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const phone1 = document.getElementById('phone1').value;
        const phone2 = document.getElementById('phone2').value;
        const email = document.getElementById('email').value;
        const license = document.getElementById('license').value;
        const objective = document.getElementById('objective').value;
        const qualificationSummary = document.getElementById('qualificationSummary').value;
        const additionalInfo = document.getElementById('additionalInfo').value;
        
        try {
            // Criar um novo documento
            const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } = docx;
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Cabeçalho - Nome (Alinhado à esquerda)
                        new Paragraph({
                            text: name,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.LEFT
                        }),
                        
                        // Cargo / Subtítulo
                        objective ? new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                                new TextRun({
                                    text: objective,
                                    bold: true,
                                    size: 24, // 12pt
                                    color: "334155"
                                })
                            ]
                        }) : null,
                        
                        // Metadados (Localização • Telefone • Email)
                        new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                                new TextRun({
                                    text: `${city && state ? `${city} – ${state}` : city || neighborhood || ''}${(city || neighborhood) && (phone1 || phone2 || email) ? '  •  ' : ''}${phone1 || phone2 || ''}${(phone1 || phone2) && email ? '  •  ' : ''}${email || ''}`,
                                    color: "64748B",
                                    size: 20 // 10pt
                                })
                            ]
                        }),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // 2. OBJETIVO / SÍNTESE DE QUALIFICAÇÕES
                        new Paragraph({
                            text: "OBJETIVO / SÍNTESE DE QUALIFICAÇÕES",
                            heading: HeadingLevel.HEADING_2,
                        }),
                        
                        new Paragraph({
                            text: qualificationSummary || objective || "Profissional em busca de novas oportunidades e desenvolvimento contínuo.",
                        }),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // 3. FORMAÇÃO ACADÊMICA
                        new Paragraph({
                            text: "FORMAÇÃO ACADÊMICA",
                            heading: HeadingLevel.HEADING_2,
                        }),
                        
                        // Adicionar itens de educação
                        ...getEducationParagraphs(),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // 4. CURSOS COMPLEMENTARES (se houver)
                        ...getCoursesParagraphs(),
                        
                        // 5. COMPETÊNCIAS / TECNOLOGIAS E FERRAMENTAS (se houver)
                        ...getSkillsParagraphs(),
                        
                        // 6. EXPERIÊNCIA PROFISSIONAL
                        new Paragraph({
                            text: "EXPERIÊNCIA PROFISSIONAL",
                            heading: HeadingLevel.HEADING_2,
                        }),
                        
                        // Adicionar itens de experiência
                        ...getExperienceParagraphs(),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // 7. INFORMAÇÕES COMPLEMENTARES (se houver)
                        ...(additionalInfo ? [
                            new Paragraph({
                                text: "INFORMAÇÕES COMPLEMENTARES",
                                heading: HeadingLevel.HEADING_2,
                            }),
                            new Paragraph({
                                text: additionalInfo,
                            }),
                            new Paragraph({})
                        ] : []),
                        
                        // Data de atualização
                        new Paragraph({
                            text: "Atualizado em novembro de 2025.",
                            alignment: AlignmentType.LEFT,
                            style: "italic",
                        }),
                    ].filter(Boolean) // Remove null items
                }]
            });
            
            // Gerar e baixar o documento
            docx.Packer.toBlob(doc).then(blob => {
                saveAs(blob, `Currículo - ${name}.docx`);
            });
            
        } catch (error) {
            console.error('Erro ao exportar para Word:', error);
            window.showNotification('Ocorreu um erro ao exportar para Word. Por favor, tente novamente.', 'error');
        }
    }

    /**
     * Obtém parágrafos para a seção de educação
     * @returns {Array} Array de parágrafos
     */
    function getEducationParagraphs() {
        const educationItems = document.querySelectorAll('.education-item');
        const paragraphs = [];
        
        educationItems.forEach(item => {
            const level = item.querySelector('.education-level').value;
            const course = item.querySelector('.education-course').value;
            const institution = item.querySelector('.institution').value;
            const status = item.querySelector('.education-status').value;
            const year = item.querySelector('.education-year').value;
            const shift = item.querySelector('.education-shift').value;
            
            if (level && institution && status && year) {
                let educationText = `● ${level}`;
                if (course) educationText += ` em ${course}`;
                educationText += ` – ${institution} – ${status}`;
                if (year) educationText += `, ${year}`;
                if (shift) educationText += `, ${shift}`;
                
                paragraphs.push(
                    new docx.Paragraph({
                        text: educationText,
                    })
                );
            }
        });
        
        return paragraphs;
    }

    /**
     * Obtém parágrafos para a seção de experiência
     * @returns {Array} Array de parágrafos
     */
    function getExperienceParagraphs() {
        const experienceItems = document.querySelectorAll('.experience-item');
        const paragraphs = [];
        
        if (experienceItems.length === 0 || 
            (experienceItems.length === 1 && 
             !experienceItems[0].querySelector('.position').value)) {
            paragraphs.push(
                new docx.Paragraph({
                    text: "Sem experiências profissionais anteriores.",
                })
            );
            return paragraphs;
        }
        
        experienceItems.forEach(item => {
            const position = item.querySelector('.position').value;
            const company = item.querySelector('.company').value;
            const period = item.querySelector('.job-period').value;
            const description = item.querySelector('.job-description').value;
            
            if (position && company && period) {
                paragraphs.push(
                    new docx.Paragraph({
                        text: `● ${position} | ${company} | ${period}`,
                    }),
                    new docx.Paragraph({
                        text: description,
                    }),
                    new docx.Paragraph({}) // Espaçamento
                );
            }
        });
        
        return paragraphs;
    }

    /**
     * Obtém parágrafos para a seção de cursos
     * @returns {Array} Array de parágrafos
     */
    function getCoursesParagraphs() {
        const courseItems = document.querySelectorAll('.course-item');
        if (courseItems.length === 0 || 
            (courseItems.length === 1 && 
             !courseItems[0].querySelector('.course-name').value)) {
            return [];
        }
        
        const paragraphs = [
            new docx.Paragraph({
                text: "CURSOS COMPLEMENTARES",
                heading: docx.HeadingLevel.HEADING_2,
            })
        ];
        
        courseItems.forEach(item => {
            const courseName = item.querySelector('.course-name').value;
            const institution = item.querySelector('.course-institution').value;
            const hours = item.querySelector('.course-hours').value;
            const year = item.querySelector('.course-year').value;
            
            if (courseName && institution) {
                let courseText = `● ${courseName} | ${institution}`;
                if (hours || year) {
                    courseText += ' | ';
                    if (hours) courseText += hours;
                    if (hours && year) courseText += ' ';
                    if (year) courseText += `(${year})`;
                }
                
                paragraphs.push(
                    new docx.Paragraph({
                        text: courseText,
                    })
                );
            }
        });
        
        paragraphs.push(new docx.Paragraph({})); // Espaçamento
        return paragraphs;
    }

    /**
     * Obtém parágrafos para a seção de habilidades
     * @returns {Array} Array de parágrafos
     */
    function getSkillsParagraphs() {
        const hardSkills = [];
        document.querySelectorAll('.hard-skill:checked').forEach(checkbox => {
            hardSkills.push(checkbox.value);
        });
        
        const softSkills = [];
        document.querySelectorAll('.soft-skill:checked').forEach(checkbox => {
            softSkills.push(checkbox.value);
        });
        
        // Adicionar outras habilidades
        const otherHardSkills = document.getElementById('otherHardSkills').value;
        if (otherHardSkills) {
            otherHardSkills.split(',').forEach(skill => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                    hardSkills.push(trimmedSkill);
                }
            });
        }
        
        const otherSoftSkills = document.getElementById('otherSoftSkills').value;
        if (otherSoftSkills) {
            otherSoftSkills.split(',').forEach(skill => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                    softSkills.push(trimmedSkill);
                }
            });
        }
        
        if (hardSkills.length === 0 && softSkills.length === 0) {
            return [];
        }
        
        const paragraphs = [
            new docx.Paragraph({
                text: "HABILIDADES",
                heading: docx.HeadingLevel.HEADING_2,
            })
        ];
        
        if (hardSkills.length > 0) {
            paragraphs.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: "Hard Skills:",
                            bold: true
                        })
                    ]
                }),
                new docx.Paragraph({
                    text: hardSkills.join(", "),
                })
            );
        }
        
        if (softSkills.length > 0) {
            paragraphs.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: "Soft Skills:",
                            bold: true
                        })
                    ]
                }),
                new docx.Paragraph({
                    text: softSkills.join(", "),
                })
            );
        }
        
        paragraphs.push(new docx.Paragraph({})); // Espaçamento
        return paragraphs;
    }

    /**
     * Salva o currículo diretamente em PDF no computador (sem abrir modal de impressão)
     */
    async function savePdfDirectly() {
        const resumeElement = document.getElementById('resumePaper');
        if (!resumeElement) {
            window.showNotification('Currículo não encontrado para exportar.', 'error');
            return;
        }

        const nameInput = document.getElementById('name');
        const candidateName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Profissional';
        const cleanName = candidateName.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').trim();
        const filename = `Curriculo - ${cleanName}.pdf`;

        // Se html2pdf estiver disponível, usamos para download direto com fidelidade A4
        if (typeof html2pdf !== 'undefined') {
            window.showNotification('Gerando seu PDF com alta qualidade...', 'success');
            
            // Opções otimizadas para A4 sem corte e com preservação das cores
            const opt = {
                margin:       [10, 10, 10, 10], // margens em mm
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2, 
                    useCORS: true, 
                    letterRendering: true,
                    scrollY: 0,
                    scrollX: 0
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };

            try {
                await html2pdf().set(opt).from(resumeElement).save();
                window.showNotification('PDF salvo com sucesso!', 'success');
            } catch (err) {
                console.error('Erro ao gerar PDF com html2pdf:', err);
                window.showNotification('Erro ao gerar direto. Abrindo janela de impressão...', 'error');
                window.print();
            }
        } else {
            // Fallback caso a biblioteca externa ainda não tenha carregado
            window.print();
        }
    }

    /**
     * Imprime o currículo usando a função nativa do navegador
     */
    function printResume() {
        window.print();
    }

    // API pública
    return {
        exportToWord,
        printResume,
        savePdfDirectly
    };
})();
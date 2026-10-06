/**
 * ui.js — Camada de interface (somente UI; não altera regras de negócio).
 *  - Tema claro/escuro
 *  - Rotas por hash (#gerador, #avaliador, #match) com suporte ao botão "voltar"
 *  - Formulário em etapas (stepper) com validação por etapa
 *  - Renderização visual do resultado da IA (score + cards)
 *  - Botão flutuante formulário ↔ prévia (mobile)
 */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /* ------------------------------------------------------------------ */
  /* TEMA                                                                */
  /* ------------------------------------------------------------------ */
  const THEME_KEY = 'curriculinho-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = $('#themeToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
      const icon = $('i', btn);
      if (icon) icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a1020' : '#155491');
  }

  function initTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    const btn = $('#themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage indisponível */ }
    });
  }

  /* ------------------------------------------------------------------ */
  /* ROTAS (hash)                                                        */
  /* ------------------------------------------------------------------ */
  const ROUTES = {
    gerador: 'gerador-section',
    avaliador: 'avaliador-section',
    match: 'match-section'
  };
  const TITLES = {
    gerador: 'Gerador de Currículo',
    avaliador: 'Avaliador com IA',
    match: 'Match de Vagas'
  };

  function currentRoute() {
    const key = location.hash.replace('#', '');
    return ROUTES[key] ? key : null;
  }

  function renderRoute() {
    const key = currentRoute();
    const landing = $('#landing-screen');
    const app = $('#app-container');
    if (!landing || !app) return;

    if (!key) {
      landing.style.display = '';
      app.style.display = 'none';
      document.body.classList.remove('in-app');
      document.title = 'Curriculinho — Gerador de Currículo com IA';
      return;
    }

    landing.style.display = 'none';
    app.style.display = 'block';
    document.body.classList.add('in-app');
    document.title = TITLES[key] + ' · Curriculinho';

    // Reaproveita a lógica de abas já existente no main.js
    const tab = $(`.tab-btn[data-target="${ROUTES[key]}"]`);
    if (tab) tab.click();
    window.scrollTo({ top: 0 });
  }

  function initRouter() {
    $$('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = Object.keys(ROUTES).find((k) => ROUTES[k] === btn.dataset.target);
        if (key && location.hash !== '#' + key) location.hash = key;
      });
    });
    window.addEventListener('hashchange', renderRoute);
    // 1ª chamada ajusta a visibilidade na hora; a 2ª (após todos os DOMContentLoaded)
    // aciona a aba, já com os handlers do main.js registrados.
    renderRoute();
    setTimeout(renderRoute, 0);
  }

  /* ------------------------------------------------------------------ */
  /* FORMULÁRIO EM ETAPAS                                                */
  /* ------------------------------------------------------------------ */
  function initStepper() {
    const form = $('#resumeForm');
    if (!form) return;

    // Validação manual: campos de etapas ocultas não podem bloquear o envio nativo
    form.noValidate = true;

    const steps = $$('.step', form);
    const items = $$('.stepper__item');
    const bar = $('.stepper__bar');
    const label = $('#stepLabel');
    const prev = $('#stepPrev');
    const next = $('#stepNext');
    const actions = $('#formActions');
    const stepNav = $('#stepNav');
    const total = steps.length;
    let current = 0;

    // Experiência e cursos são opcionais: quem não preencher não aparece no PDF
    const relax = (root) => $$('input, select, textarea', root).forEach((el) => { el.required = false; });
    ['experience-container', 'courses-container'].forEach((id) => {
      const container = document.getElementById(id);
      if (!container) return;
      relax(container);
      new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) relax(n);
      }))).observe(container, { childList: true });
    });

    function show(index, scroll = true) {
      current = Math.max(0, Math.min(total - 1, index));
      steps.forEach((s, i) => { s.hidden = i !== current; });
      items.forEach((b, i) => {
        b.classList.toggle('is-active', i === current);
        b.classList.toggle('is-done', i < current);
        if (i === current) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (bar) bar.style.width = ((current + 1) / total) * 100 + '%';
      if (label) label.textContent = `Etapa ${current + 1} de ${total} · ${steps[current].dataset.title}`;
      if (prev) prev.disabled = current === 0;
      const last = current === total - 1;
      if (next) next.hidden = last;
      if (actions) actions.hidden = !last;
      if (scroll) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function firstInvalid(stepIndex) {
      return $$('input, select, textarea', steps[stepIndex]).find((el) => !el.disabled && !el.checkValidity());
    }

    // Valida da etapa atual até a de destino; se falhar, mostra a etapa com erro
    function canReach(target) {
      for (let k = current; k < target; k++) {
        const bad = firstInvalid(k);
        if (bad) {
          show(k, false);
          bad.reportValidity();
          bad.focus();
          return false;
        }
      }
      return true;
    }

    if (next) next.addEventListener('click', () => { if (canReach(current + 1)) show(current + 1); });
    if (prev) prev.addEventListener('click', () => show(current - 1));
    items.forEach((btn, i) => btn.addEventListener('click', () => {
      if (i <= current || canReach(i)) show(i);
    }));

    // Enter em um campo avança a etapa em vez de submeter o formulário inteiro
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('input')) {
        e.preventDefault();
        if (current < total - 1 && next) next.click();
      }
    });

    // Registrado antes do listener do main.js: bloqueia o envio se houver erro
    form.addEventListener('submit', (e) => {
      for (let k = 0; k < total; k++) {
        const bad = firstInvalid(k);
        if (bad) {
          e.preventDefault();
          e.stopImmediatePropagation();
          show(k, false);
          bad.reportValidity();
          bad.focus();
          return;
        }
      }
    });

    // "Restaurar padrão" volta para a primeira etapa
    form.addEventListener('reset', () => setTimeout(() => show(0), 0));

    show(0, false);
  }

  /* ------------------------------------------------------------------ */
  /* FAB (mobile): alternar formulário ↔ prévia                          */
  /* ------------------------------------------------------------------ */
  function initPreviewFab() {
    const fab = $('#previewFab');
    const preview = $('#resumePreview');
    const form = $('#resumeForm');
    if (!fab || !preview || !form) return;
    let previewVisible = false;
    const label = $('span', fab);
    const icon = $('i', fab);

    new IntersectionObserver((entries) => {
      previewVisible = entries[0].isIntersecting;
      if (label) label.textContent = previewVisible ? 'Voltar ao formulário' : 'Ver prévia';
      if (icon) icon.className = previewVisible ? 'bi bi-pencil-square' : 'bi bi-eye';
    }, { threshold: 0.25 }).observe(preview);

    fab.addEventListener('click', () => {
      (previewVisible ? form : preview).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Só aparece quando o gerador está visível
    const section = $('#gerador-section');
    if (section) {
      new MutationObserver(() => { fab.hidden = section.style.display === 'none'; })
        .observe(section, { attributes: true, attributeFilter: ['style'] });
    }
  }

  /* ------------------------------------------------------------------ */
  /* RESULTADO DA IA                                                     */
  /* ------------------------------------------------------------------ */
  function inline(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  }

  // Divide o texto da IA em seções "**Título**: conteúdo"
  function parseSections(text) {
    const header = /^\s{0,1}(?:[-*•]\s+|#{1,4}\s*|\d+[.)]\s+)?\*\*(.+?)\*\*\s*:?\s*(.*)$/;
    const sections = [];
    let intro = [];
    let cur = null;

    text.replace(/\r/g, '').split('\n').forEach((raw) => {
      const m = raw.match(header);
      if (m) {
        cur = { title: m[1].replace(/:\s*$/, '').trim(), lines: [] };
        if (m[2].trim()) cur.lines.push(m[2].trim());
        sections.push(cur);
      } else if (raw.trim()) {
        (cur ? cur.lines : intro).push(raw);
      }
    });
    return { intro, sections };
  }

  function linesToHtml(lines) {
    let html = '';
    let list = [];
    const flush = () => { if (list.length) { html += '<ul>' + list.map((li) => `<li>${inline(li)}</li>`).join('') + '</ul>'; list = []; } };
    lines.forEach((l) => {
      const b = l.match(/^\s*[-*•]\s+(.*)$/);
      if (b) list.push(b[1]); else { flush(); html += `<p>${inline(l.trim())}</p>`; }
    });
    flush();
    return html;
  }

  function cardMeta(title) {
    if (/forte|compat[ií]ve|positiv|acerto/i.test(title)) return { cls: 'good', icon: 'bi-check2-circle' };
    if (/melhor|falt|gap|aten[cç][aã]o|fraco/i.test(title)) return { cls: 'warn', icon: 'bi-exclamation-triangle' };
    return { cls: 'info', icon: 'bi-chat-left-text' };
  }

  function renderAIResult(container, text, kind) {
    const titleEl = $('#aiResultTitle');
    if (titleEl) titleEl.textContent = kind === 'match' ? 'Resultado do Match' : 'Resultado da Avaliação';

    const { intro, sections } = parseSections(text);
    if (!sections.length) { container.innerHTML = `<div class="ai-card ai-card--wide">${linesToHtml(text.split('\n').filter((l) => l.trim()))}</div>`; return; }

    // Pontuação (nota 0–10 ou porcentagem)
    let pct = null;
    let display = '';
    const rest = [];
    sections.forEach((s) => {
      if (pct === null && /nota|pontua[cç][aã]o|score/i.test(s.title)) {
        const m = s.lines.join(' ').match(/(\d+(?:[.,]\d+)?)\s*(\/\s*10|%)?/);
        if (m) {
          const n = parseFloat(m[1].replace(',', '.'));
          const isPct = m[2] === '%' || n > 10;
          pct = Math.max(0, Math.min(100, isPct ? n : n * 10));
          display = isPct ? `${Math.round(n)}<small>%</small>` : `${n % 1 ? n.toFixed(1) : n}<small>/10</small>`;
          return;
        }
      }
      rest.push(s);
    });

    let html = '';
    if (pct !== null) {
      const tone = pct >= 75 ? 'good' : pct >= 50 ? 'mid' : 'low';
      const verdict = pct >= 75 ? 'Excelente resultado' : pct >= 50 ? 'Bom, mas dá para melhorar' : 'Precisa de ajustes';
      html += `<div class="ai-result__head">
        <div class="score-ring score-ring--${tone}" style="--pct:${pct}" role="img" aria-label="Pontuação ${Math.round(pct)} de 100">
          <span class="score-ring__value">${display}</span>
        </div>
        <div><p class="ai-result__label">${kind === 'match' ? 'Compatibilidade com a vaga' : 'Nota geral do currículo'}</p>
        <p class="ai-result__verdict">${verdict}</p></div></div>`;
    }
    if (intro.length) html += `<div class="ai-card ai-card--wide ai-card--info" style="margin-bottom:var(--space-4)">${linesToHtml(intro)}</div>`;

    html += '<div class="ai-result__grid">';
    rest.forEach((s) => {
      const meta = cardMeta(s.title);
      const wide = /veredito|conclus|resumo/i.test(s.title) || s.lines.join(' ').length > 420;
      html += `<section class="ai-card ai-card--${meta.cls}${wide ? ' ai-card--wide' : ''}">
        <h4 class="ai-card__title"><i class="bi ${meta.icon}" aria-hidden="true"></i>${esc(s.title)}</h4>${linesToHtml(s.lines)}</section>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.CurriculinhoUI = { renderAIResult, applyTheme };

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initStepper();
    initPreviewFab();
    initRouter();
  });
})();

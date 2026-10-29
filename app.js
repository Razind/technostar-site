(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('js');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  const header = document.querySelector('.header');
  const progress = document.querySelector('.reading-progress');
  const hero = document.querySelector('.hero-visual');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-nav');
  let framePending = false;
  const updateScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 15);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0})`;
    if (!reducedMotion.matches && y < 1000) {
      hero.style.setProperty('--hero-shift', `${Math.min(y * 0.035, 30) - 18}px`);
    }
    framePending = false;
  };
  window.addEventListener('scroll', () => {
    if (!framePending) {
      framePending = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  const closeMenu = () => {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
  };
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileMenu.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', opening);
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !mobileMenu.hidden) {
      closeMenu();
      menuButton.focus();
    }
    if (e.key === 'Tab' && !mobileMenu.hidden) {
      const last = mobileMenu.querySelector('a:last-child');
      if (e.shiftKey && document.activeElement === menuButton) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); menuButton.focus(); }
    }
  });
  window.matchMedia('(min-width: 641px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  if ('IntersectionObserver' in window) {
    const navLinks = [...document.querySelectorAll('.desktop-nav a')];
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
  }

  document.querySelectorAll('.service-list, .hr-list').forEach(group => {
    group.querySelectorAll('details').forEach(details => {
      details.addEventListener('toggle', () => {
        if (details.open) group.querySelectorAll('details').forEach(other => {
          if (other !== details) other.open = false;
        });
      });
    });
  });

  const dialog = document.querySelector('.inquiry-dialog');
  const form = document.querySelector('#inquiry-form');
  const copyButton = document.querySelector('#copy-email');
  const notice = document.querySelector('.form-notice');
  const defaultNotice = 'Письмо откроется в вашем почтовом приложении.';
  document.querySelector('[data-open-inquiry]').addEventListener('click', () => {
    dialog.showModal();
    document.querySelector('.inquiry-fields').scrollTop = 0;
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  }});
  const prepareInquiry = () => {
    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const service = String(data.get('service'));
    const message = String(data.get('message')).trim();
    form.elements.name.setCustomValidity(name ? '' : 'Укажите ваше имя.');
    form.elements.message.setCustomValidity(message ? '' : 'Расскажите о вашей задаче.');
    if (!form.reportValidity()) return null;
    const body = `Здравствуйте!\n\nМеня зовут ${name}.\nИнтересующее направление: ${service}.\n\n${message}\n\nС уважением,\n${name}`;
    return { body, subject: `Задача для ТехноСтар — ${service}` };
  };
  form.addEventListener('input', e => {
    if (typeof e.target.setCustomValidity === 'function') e.target.setCustomValidity('');
    copyButton.classList.remove('copied');
    copyButton.querySelector('span').textContent = 'Скопировать';
    notice.textContent = defaultNotice;
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const inquiry = prepareInquiry();
    if (!inquiry) return;
    window.location.href = `mailto:info@technostar.info?subject=${encodeURIComponent(inquiry.subject)}&body=${encodeURIComponent(inquiry.body)}`;
    notice.textContent = 'Если почта не открылась, скопируйте письмо кнопкой рядом.';
  });
  copyButton.addEventListener('click', async () => {
    const inquiry = prepareInquiry();
    if (!inquiry) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inquiry.body);
      } else {
        const clipboardField = document.createElement('textarea');
        clipboardField.value = inquiry.body;
        clipboardField.setAttribute('aria-hidden', 'true');
        clipboardField.style.cssText = 'position:fixed;opacity:0;pointer-events:none;inset:0;width:1px;height:1px';
        form.append(clipboardField);
        clipboardField.select();
        try {
          if (!document.execCommand('copy')) throw new Error('Copy unavailable');
        } finally {
          clipboardField.remove();
          copyButton.focus({ preventScroll: true });
        }
      }
      copyButton.classList.add('copied');
      copyButton.querySelector('span').textContent = 'Скопировано';
      notice.textContent = 'Текст скопирован. Вставьте его в письмо на info@technostar.info.';
    } catch {
      notice.textContent = 'Копирование недоступно. Откройте письмо в почтовом приложении.';
    }
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());
})();

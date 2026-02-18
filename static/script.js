/* ══════════════════════════════════════════
   COSMIC PORTFOLIO — script.js
   ══════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {

    /* ─── MARK JS AS READY (enables CSS reveal hiding) ─── */
    document.body.classList.add('js-ready');

    /* ─── IMMEDIATELY SHOW HERO (already in viewport) ─── */
    document.querySelectorAll('.hero.reveal').forEach(el => el.classList.add('visible'));

    /* ─── TYPING ANIMATION ─── */
    const typingEl = document.querySelector('.typing');
    if (typingEl) {
        const fullText = typingEl.textContent.trim();
        typingEl.textContent = '';
        let i = 0;
        const type = () => {
            if (i < fullText.length) {
                typingEl.textContent += fullText.charAt(i++);
                setTimeout(type, 80 + Math.random() * 40);
            }
        };
        setTimeout(type, 600);
    }

    /* ─── REVEAL ON SCROLL ─── */
    // Fallback: if IntersectionObserver isn't supported, show everything
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    /* ─── STAGGER CHILDREN (skills, projects) ─── */
    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const children = entry.target.querySelectorAll(
                '.skill-card, .project-card, .glass-card'
            );
            children.forEach((child, i) => {
                child.style.transitionDelay = `${i * 60}ms`;
                child.style.opacity = '0';
                child.style.transform = 'translateY(24px)';
                setTimeout(() => {
                    child.style.transition = `opacity 500ms cubic-bezier(.25,.46,.45,.94), transform 500ms cubic-bezier(.25,.46,.45,.94)`;
                    child.style.opacity = '1';
                    child.style.transform = 'none';
                }, 80 + i * 60);
            });
            staggerObserver.unobserve(entry.target);
        });
    }, { threshold: 0.05 });

    document.querySelectorAll('.skills-grid, .projects-grid').forEach(g => staggerObserver.observe(g));

    /* ─── STICKY NAVBAR SHRINK ─── */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (!navbar) return;
        navbar.classList.toggle('shrink', window.scrollY > 60);
    }, { passive: true });

    /* ─── SMOOTH SCROLL NAV LINKS ─── */
    document.querySelectorAll('.nav-menu a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href.startsWith('#')) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (!target) return;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile nav
            const navMenu = document.getElementById('navMenu');
            const toggle = document.querySelector('.nav-toggle');
            if (navMenu?.classList.contains('open')) {
                navMenu.classList.remove('open');
                toggle?.setAttribute('aria-expanded', 'false');
            }
        });
    });

    /* ─── MOBILE NAV TOGGLE ─── */
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const open = navMenu.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(open));
        });
    }

    /* ─── ACTIVE NAV LINK ON SCROLL ─── */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const activeLinkObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(a => a.classList.remove('active'));
                const link = document.querySelector(`.nav-menu a[href="#${entry.target.id}"]`);
                if (link) link.classList.add('active');
            }
        });
    }, { threshold: 0.4 });
    sections.forEach(s => activeLinkObserver.observe(s));

    /* ─── SKILL CARD TILT EFFECT ─── */
    document.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(400px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    /* ─── PROJECT CARD PARALLAX MEDIA ─── */
    document.querySelectorAll('.project-card').forEach(card => {
        const media = card.querySelector('.project-media');
        if (!media) return;
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            media.style.backgroundPosition = `${x * 20}% ${y * 20}%`;
        });
    });

    /* ─── CONTACT FORM SUBMIT ─── */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Sending… <span class="btn-arrow">⟳</span>';
            btn.disabled = true;

            const formData = new FormData(this);
            const payload = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject') || '',
                message: formData.get('message')
            };

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (res.ok && result.success) {
                    const userName = document.getElementById('userName');
                    if (userName) userName.textContent = payload.name;
                    const modal = document.getElementById('successModal');
                    if (modal) modal.classList.add('active');
                    this.reset();
                } else {
                    alert(result.error || 'Failed to send message. Please try again.');
                }
            } catch (err) {
                alert('Network error. Please try again later.');
                console.error(err);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    /* ─── MODAL CLOSE HANDLERS ─── */
    const modal = document.getElementById('successModal');
    if (modal) {
        const hide = () => modal.classList.remove('active');
        document.getElementById('modalClose')?.addEventListener('click', hide);
        document.getElementById('modalOk')?.addEventListener('click', hide);
        modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) hide();
        });
    }

    /* ─── CURSOR GLOW (desktop only) ─── */
    if (window.matchMedia('(pointer: fine)').matches) {
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: fixed;
            width: 300px; height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(108,99,255,0.07) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
            transform: translate(-50%, -50%);
            transition: left 120ms linear, top 120ms linear;
        `;
        document.body.appendChild(glow);
        window.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        }, { passive: true });
    }

});

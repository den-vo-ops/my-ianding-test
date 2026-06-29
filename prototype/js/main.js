import { splitWords } from './kinetic-text.js';
import { computeMagneticOffset } from './magnetic.js';
import { isLikelyBot } from './honeypot.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointerFine = window.matchMedia('(pointer: fine)').matches;

function setupKineticHeading() {
  const heading = document.getElementById('hero-heading');
  if (!heading) return;

  if (reduceMotion) {
    return;
  }

  heading.innerHTML = splitWords(heading.textContent.trim());
  const words = heading.querySelectorAll('.kinetic-word');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          words.forEach((word, index) => {
            setTimeout(() => word.classList.add('is-visible'), index * 60);
          });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(heading);
}

function setupCursorObject() {
  const cursorObject = document.getElementById('cursor-object');
  if (!cursorObject || !pointerFine || reduceMotion) return;

  window.addEventListener('mousemove', (event) => {
    const rotateY = (event.clientX / window.innerWidth - 0.5) * 20;
    const rotateX = (event.clientY / window.innerHeight - 0.5) * -20;
    cursorObject.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
}

function setupMagneticButtons() {
  if (!pointerFine || reduceMotion) return;

  document.querySelectorAll('.magnetic-btn').forEach((button) => {
    button.addEventListener('mousemove', (event) => {
      const rect = button.getBoundingClientRect();
      const offset = computeMagneticOffset(event.clientX, event.clientY, rect, 0.3);
      button.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translate(0, 0)';
    });
  });
}

function setupNavMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupScrollReveal() {
  const sections = document.querySelectorAll('.reveal');
  if (!sections.length || reduceMotion) return;

  sections.forEach((section) => section.classList.add('reveal-pending'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-pending');
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupParallax() {
  const orbs = document.querySelectorAll('.glow-orb');
  if (!orbs.length || reduceMotion) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const offset = window.scrollY * 0.15;
      orbs.forEach((orb, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        orb.style.transform = `translateY(${offset * direction}px)`;
      });
      ticking = false;
    });
  });
}

function setupBackToTop() {
  const button = document.getElementById('back-to-top');
  if (!button) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight) {
      button.classList.add('is-visible');
    } else {
      button.classList.remove('is-visible');
    }
  });

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

function setupContactForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form || !success) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const formDataLike = { website: formData.get('website') };

    // Honeypot is checked, but both branches show the same success UI
    // either way — a bot gets no signal that it was caught, and there is
    // no real backend in this prototype regardless of the check's result.
    isLikelyBot(formDataLike);

    form.reset();
    form.hidden = true;
    success.hidden = false;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupKineticHeading();
  setupCursorObject();
  setupMagneticButtons();
  setupContactForm();
  setupNavMobileMenu();
  setupScrollReveal();
  setupParallax();
  setupBackToTop();
});

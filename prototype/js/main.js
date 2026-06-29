import { splitWords } from './kinetic-text.js';
import { computeMagneticOffset } from './magnetic.js';

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

document.addEventListener('DOMContentLoaded', () => {
  setupKineticHeading();
  setupCursorObject();
  setupMagneticButtons();
});

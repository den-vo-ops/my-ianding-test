export function computeMagneticOffset(mouseX, mouseY, rect, strength = 0.3) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;
  return { x: dx * strength, y: dy * strength };
}

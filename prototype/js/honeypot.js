export function isLikelyBot(formDataLike) {
  const value = formDataLike && formDataLike.website;
  return Boolean(value && value.trim().length > 0);
}

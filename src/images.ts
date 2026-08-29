// Central registry of the app's decorative images. They live in public/img/ so
// they are served as-is in dev (Vite) and copied into dist/ for production.
// Swapping an image is just replacing the file at the same path.
export const IMG = {
  aces: '/img/aces.png',
  vipps: '/img/vipps-icon.svg',
  happyWine: '/img/happy_wine.png',
  catCheers: '/img/cat_2.png',
  catWine: '/img/cat.png',
  oldLady: '/img/old_lady.webp',
  pouringWine: '/img/pouring_wine.png',
  pouringWineGif: '/img/pouring_wine_standing.gif',
  confettiGif: '/img/confetti_standing.gif',
  confettiBlock: '/img/confetti_block.png',
} as const;

// Payment configuration for the Vipps instruction shown on the Payment page.
// These are intentionally separate, easy-to-edit values — fill in the real
// amount and number here. Seeded with placeholders for now.

export const VIPPS_AMOUNT = 'X';
export const VIPPS_NUMBER = 'Y';

// Placeholders for the two dates in the payment hint ("betal innen X for å bli
// med i trekningen Y"), shown until an admin fills them in on the Payment page.
export const PAYMENT_DEADLINE = 'X';
export const DRAW_DATE = 'Y';

// Where the Vipps icon on the Payment page points. On a phone the custom scheme
// hands over to the installed Vipps app; anywhere else (desktop, no app) that
// URL does nothing, so those visitors get the website instead.
export const VIPPS_APP_LINK = 'vipps://';
export const VIPPS_WEB_LINK = 'https://vipps.no';

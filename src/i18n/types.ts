// The single source of truth for every user-facing string in the app.
//
// Rule: components MUST read all text through useStrings() — never hardcode
// text in JSX. Each locale is one file implementing this interface, so adding
// a language later is just a new file, and TypeScript flags anything missing.

export interface LocaleStrings {
  common: {
    appName: string;
    /** Shown when data fails to load from the backend. */
    loadError: string;
    loading: string;
  };
  nav: {
    payment: string;
    wheel: string;
    wines: string;
    stats: string;
  };
  payment: {
    heading: string;
    /** Builds the payment sentence, e.g. "Vipps X til Y". */
    instruction: (amount: string, number: string) => string;
    /** Builds the hint under the box, e.g. "Betal innen X for å bli med i trekningen Y." */
    hint: (deadline: string, drawDate: string) => string;
    /** Accessible label on the Vipps icon that opens the app. */
    openVipps: string;
    /** Formats the amount with its unit, e.g. "50 kr". */
    amount: (kroner: number) => string;
    /** Admin-only editor under the instruction box. */
    editHeading: string;
    fieldAmount: string;
    fieldPhone: string;
    fieldDeadline: string;
    fieldDrawDate: string;
    saveSettings: string;
    saving: string;
    saveFailed: string;
    saved: string;
  };
  wheel: {
    heading: string;
    spin: string;
    spinning: string;
    /** Label preceding the drawn winner's name. */
    winnerLabel: string;
    empty: string;
    /** Heading of the admin-only participant editor under the wheel. */
    rosterHeading: string;
    /** Placeholder in the admin-only "add participant" field. */
    addPlaceholder: string;
    addName: string;
    /** Explains that adding also fills the stats, while removing does not empty it. */
    rosterNote: string;
    /** Accessible label / tooltip on a chip's remove button. */
    removeName: (name: string) => string;
    /** Confirmation shown before a name leaves the wheel. */
    confirmRemove: (name: string) => string;
    addDuplicate: string;
    addFailed: string;
    removeFailed: string;
  };
  wines: {
    heading: string;
    empty: string;
    /** Label preceding the winner's name on a card / in the modal. */
    winnerLabel: string;
    priceLabel: string;
    keywordsLabel: string;
    close: string;
    /** Title of a single player's collection, e.g. "Navn 2s viner". */
    playerHeading: (name: string) => string;
    playerEmpty: (name: string) => string;
    back: string;
    /** Admin-only "add wine" button on a player's collection page. */
    addWine: string;
    /** Heading of the add-wine form, e.g. "Ny vin til Navn 2". */
    addWineHeading: (name: string) => string;
    fieldName: string;
    fieldYear: string;
    fieldLocation: string;
    fieldDate: string;
    fieldPrice: string;
    fieldKeywords: string;
    fieldDescription: string;
    /** Hint inside the drop zone / file picker. */
    imageHint: string;
    imageChange: string;
    save: string;
    saving: string;
    cancel: string;
    saveFailed: string;
    imageTooLarge: string;
    /** Explains that the wine also lands in the general list. */
    addWineNote: (name: string) => string;
  };
  stats: {
    heading: string;
    subtitle: string;
    colName: string;
    colPlayed: string;
    colWon: string;
    colCollection: string;
    /** Link text in the collection column, e.g. "Se 3 viner". */
    viewCollection: (count: number) => string;
    noCollection: string;
    empty: string;
  };
  sponsor: {
    prefix: string;
    brand: string;
  };
  admin: {
    /** Label on the unlock control in the header. */
    unlock: string;
    passwordPlaceholder: string;
    submit: string;
    wrongPassword: string;
    /** The ADMIN badge on the wheel page (click to exit admin mode). */
    badge: string;
    exitHint: string;
    /** Hint under the wheel, shown only when not in admin mode. */
    getRights: string;
  };
}

export type LocaleCode = 'nb';

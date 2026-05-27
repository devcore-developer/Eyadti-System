export const colors = {
  primaryMedical: {
    DEFAULT: "#5BC0BE",
    dark: "#4AA8A6",
    light: "#89D6D2",
  },
  premiumBlue: {
    DEFAULT: "#6B9CFF",
    dark: "#5280E0",
    light: "#AFCBFF",
  },
  background: {
    main: "#F5F9FF",
    secondary: "#EEF4FC",
    section: "#F8FBFF",
  },
  dark: {
    background: "#17212F",
    secondary: "#1D2A3B",
    sidebar: "#1B2838",
    cards: "#223247",
  },
  status: {
    success: "#6BCB77",
    warning: "#F4B860",
    danger: "#EF6B6B",
  },
  text: {
    primary: "#0F172A",
    secondary: "#64748B",
  },
  neutral: {
    300: "#CBD5E1",
    600: "#475569",
  }
};

export const typography = {
  fontSize: {
    pageTitle: "32px",
    sectionTitle: "20px",
    cardTitle: "15px",
    primaryValue: "32px",
    body: "14px",
    small: "12px",
  },
  fontWeight: {
    bold: "700",
    semibold: "600",
    medium: "500",
    regular: "400",
  },
};

// أضفنا الـ spacing والـ zIndexes عشان الـ theme.ts يقدر يقرأهم
export const spacing = {
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
};

export const zIndexes = {
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
};

export const radii = {
  card: "20px",
  input: "14px",
  button: "14px",
  sidebarItem: "14px",
};

export const shadows = {
  card: "0 10px 30px rgba(100,116,139,.12)",
  cardHover: "0 18px 40px rgba(100,116,139,.15)",
  sidebar: "0 8px 30px rgba(15,23,42,.08)",
  inputFocus: "0 0 0 4px rgba(107,156,255,.12)",
  buttonPrimary: "0 8px 20px rgba(107,156,255,.20)",
  activeSidebarItem: "0 8px 20px rgba(107,156,255,.15)",
};
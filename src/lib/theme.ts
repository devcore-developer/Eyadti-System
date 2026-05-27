import { colors, typography, spacing, radii, zIndexes, shadows } from "./design-tokens";

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  zIndexes,
  shadows,
  
  // Pre-configured Chart Colors (Soft & Premium as requested)
  chart: {
    primary: colors.primaryMedical.DEFAULT,   // Patients
    primaryLight: colors.primaryMedical.light,
    premiumBlue: colors.premiumBlue.DEFAULT,  // Revenue
    premiumBlueLight: colors.premiumBlue.light,
    success: colors.status.success,
    warning: colors.status.warning,
    danger: colors.status.danger,
    neutral: colors.neutral[300],
    neutralDark: colors.neutral[600],
  },
};
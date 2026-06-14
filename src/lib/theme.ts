// lib/theme.ts
import { colors, typography, spacing, radii, zIndexes, shadows } from "./design-tokens";

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  zIndexes,
  shadows,
  
  chart: {
    primary: colors.primaryMedical.DEFAULT,
    primaryLight: colors.primaryMedical.light,
    premiumBlue: colors.premiumBlue.DEFAULT,
    premiumBlueLight: colors.premiumBlue.light,
    success: colors.status.success,
    warning: colors.status.warning,
    danger: colors.status.danger,
    neutral: colors.neutral[300],
    neutralDark: colors.neutral[600],
  },
};
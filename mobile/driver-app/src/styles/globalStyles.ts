/**
 * Global styling constants for the Driver App
 */

import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/config';

export const globalStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Screen styles
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header styles
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold' as const,
    color: COLORS.textPrimary,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.sm,
    ...SHADOWS.medium,
  },

  // Button styles
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600' as const,
  },

  secondaryButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  secondaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600' as const,
  },

  outlineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  outlineButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600' as const,
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  // Text styles
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold' as const,
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },

  body: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },

  caption: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },

  successText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },

  // Status styles
  onlineStatus: {
    backgroundColor: COLORS.online,
    color: COLORS.white,
  },

  offlineStatus: {
    backgroundColor: COLORS.offline,
    color: COLORS.white,
  },

  busyStatus: {
    backgroundColor: COLORS.busy,
    color: COLORS.white,
  },

  // Layout styles
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  column: {
    flexDirection: 'column' as const,
  },

  spaceBetween: {
    justifyContent: 'space-between' as const,
  },

  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // Spacing utilities
  margin: {
    margin: SPACING.md,
  },

  marginHorizontal: {
    marginHorizontal: SPACING.md,
  },

  marginVertical: {
    marginVertical: SPACING.md,
  },

  padding: {
    padding: SPACING.md,
  },

  paddingHorizontal: {
    paddingHorizontal: SPACING.md,
  },

  paddingVertical: {
    paddingVertical: SPACING.md,
  },
};

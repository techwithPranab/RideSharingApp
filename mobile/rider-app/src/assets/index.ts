/**
 * Assets Index
 * Export asset references and constants
 */

// Placeholder for asset exports
// Add image requires, icon references, etc. here when assets are added

export const ASSETS = {
  // Images
  images: {
    logo: require('./images/logo.png'), // Placeholder - add actual logo
    placeholder: require('./images/placeholder.png'), // Placeholder
  },

  // Icons
  icons: {
    // Add icon references here
  },

  // Fonts
  fonts: {
    regular: 'System', // Default system font
    medium: 'System',
    bold: 'System',
  },
} as const;

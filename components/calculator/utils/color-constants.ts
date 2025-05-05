/**
 * Shared color constants for calculator components.
 * These values match the global theme variables in globals.css
 */

export const COLORS = {
  // Core brand colors
  bitcoinOrange: 'hsl(33 98% 54%)', // --bitcoin-orange
  success: 'hsl(142 76% 45%)', // --success
  error: 'hsl(0 84% 60%)', // --error
  satStacked: 'hsl(270, 70%, 65%)', // Light purple color for Sats Stacked
  
  // Theme colors
  primary: 'hsl(0 0% 98%)', // --primary
  secondary: 'hsl(240 3.7% 15.9%)', // --secondary
  muted: 'hsl(240 5% 64.9%)', // --muted-foreground
  background: 'hsl(240 10% 3.9%)', // --background
  foreground: 'hsl(0 0% 98%)', // --foreground
  border: 'hsl(240 3.7% 15.9%)', // --border
  
  // Chart specific colors
  chartGrid: 'hsl(240 3.7% 15.9%)', // --border
  chartText: 'hsl(240 5% 64.9%)', // --muted-foreground
  
  // Helper function to create transparent colors
  withOpacity: (color: string, opacity: number): string => {
    if (!color.startsWith('hsl')) {
      return color; // Return unchanged if not in HSL format
    }
    // Extract the HSL values and add opacity
    const hslMatch = color.match(/hsl\(([^)]+)\)/);
    if (hslMatch && hslMatch[1]) {
      return `hsla(${hslMatch[1]}, ${opacity})`;
    }
    return color;
  },
  
  // Helper to get gradient for chart backgrounds
  getGradient: (ctx: CanvasRenderingContext2D, color: string): CanvasGradient => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    
    if (color === COLORS.bitcoinOrange) {
      gradient.addColorStop(0, `hsla(33, 98%, 54%, 0.5)`);
      gradient.addColorStop(1, `hsla(33, 98%, 54%, 0)`);
    } else if (color === COLORS.success) {
      gradient.addColorStop(0, `hsla(142, 76%, 45%, 0.3)`);
      gradient.addColorStop(1, `hsla(142, 76%, 45%, 0)`);
    } else {
      // Default fallback gradient (for any other color)
      const hslMatch = color.match(/hsl\(([^)]+)\)/);
      if (hslMatch && hslMatch[1]) {
        gradient.addColorStop(0, `hsla(${hslMatch[1]}, 0.5)`);
        gradient.addColorStop(1, `hsla(${hslMatch[1]}, 0)`);
      } else {
        // Fallback if color format is not recognized
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
    }
    
    return gradient;
  }
}; 
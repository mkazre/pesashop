import { useBreakpoint } from '@/components/builder/context/BreakpointContext';

/**
 * Hook for admin grid elements to read responsive columns/gap per breakpoint.
 * Returns effective columns and gap based on the current admin breakpoint,
 * falling back to the desktop (default) values.
 *
 * @param {number} columns - Desktop column count
 * @param {string} gap - Desktop gap value
 * @param {object} responsiveProps - Per-breakpoint overrides { tablet: { columns, gap }, phone: { columns, gap } }
 * @returns {{ effectiveColumns: number, effectiveGap: string, breakpoint: string }}
 */
export function useResponsiveGridProps(columns, gap, responsiveProps = {}) {
  const { breakpoint } = useBreakpoint();
  const bpOverrides = (breakpoint !== 'desktop' && responsiveProps[breakpoint]) || {};
  const effectiveColumns = bpOverrides.columns || columns;
  const effectiveGap = bpOverrides.gap || gap;
  return { effectiveColumns, effectiveGap, breakpoint };
}

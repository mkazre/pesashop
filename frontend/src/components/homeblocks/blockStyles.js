/**
 * Extract card style props from a block config to pass to ProductCard.
 */
export function getCardStyleProps(block) {
  return {
    cardTitleClamp: block.cardTitleClamp ?? 2,
    cardTitleSize: block.cardTitleSize || '14px',
    cardPriceSize: block.cardPriceSize || '16px',
    cardCategorySize: block.cardCategorySize || '12px',
    cardEqualHeight: block.cardEqualHeight !== false,
    cardButtonText: block.cardButtonText || 'View Product',
    showSaleBadge: block.showSaleBadge !== false,
    showPercentOff: block.showPercentOff !== false,
    primaryColor: block.primaryColor || '#0F604B',
    buttonBgColor: block.buttonBgColor || block.primaryColor || '#0F604B',
    buttonTextColor: block.buttonTextColor || '#ffffff',
    buttonHoverBgColor: block.buttonHoverBgColor || '#0a4a39',
    priceColor: block.priceColor || block.primaryColor || '#0F604B',
    textColor: block.textColor || '',
    showBadges: block.showBadges !== false,
  };
}

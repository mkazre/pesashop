import { StyleSheet } from "react-native";

// Maps the shared block style-props shape (see admin's BlockStylePanel.jsx)
// onto an RN StyleSheet object. RN's style model doesn't need the
// CSS-specific bits (display:flex variants, box-shadow strings, blend
// modes) that a web renderer would — this translates rather than passing
// values straight through.
export function applyBlockStyle(style: any = {}) {
  const out: Record<string, any> = {};

  if (style.fontSize != null) out.fontSize = style.fontSize;
  if (style.fontWeight != null) out.fontWeight = String(style.fontWeight);
  if (style.color != null) out.color = style.color;
  if (style.textAlign != null) out.textAlign = style.textAlign;
  if (style.lineHeight != null) out.lineHeight = style.lineHeight;
  if (style.letterSpacing != null) out.letterSpacing = style.letterSpacing;

  if (style.paddingTop != null) out.paddingTop = style.paddingTop;
  if (style.paddingRight != null) out.paddingRight = style.paddingRight;
  if (style.paddingBottom != null) out.paddingBottom = style.paddingBottom;
  if (style.paddingLeft != null) out.paddingLeft = style.paddingLeft;
  if (style.marginTop != null) out.marginTop = style.marginTop;
  if (style.marginRight != null) out.marginRight = style.marginRight;
  if (style.marginBottom != null) out.marginBottom = style.marginBottom;
  if (style.marginLeft != null) out.marginLeft = style.marginLeft;

  if (style.backgroundColor != null) out.backgroundColor = style.backgroundColor;
  if (style.borderWidth != null) out.borderWidth = style.borderWidth;
  if (style.borderColor != null) out.borderColor = style.borderColor;
  if (style.borderRadius != null) out.borderRadius = style.borderRadius;

  if (style.width === "100%") out.width = "100%";
  else if (typeof style.width === "string" && style.width.endsWith("%")) out.width = style.width;
  else if (typeof style.width === "number") out.width = style.width;

  if (style.opacity != null) out.opacity = style.opacity;

  return StyleSheet.create({ block: out }).block;
}

import HeadingBlock from "./HeadingBlock";
import TextBlock from "./TextBlock";
import ImageBlock from "./ImageBlock";
import ButtonBlock from "./ButtonBlock";
import ContainerBlock from "./ContainerBlock";
import ListBlock from "./ListBlock";
import VideoBlock from "./VideoBlock";
import GalleryBlock from "./GalleryBlock";
import LinkTextBlock from "./LinkTextBlock";
import LinkWrapperBlock from "./LinkWrapperBlock";
import FancyIconBlock from "./FancyIconBlock";
import RichTextBlock from "./RichTextBlock";
import CodeBlockBlock from "./CodeBlockBlock";
import SvgIconBlock from "./SvgIconBlock";

// blockType -> native RN renderer. Split into its own file (rather than
// living inline in AppPageRenderer.tsx) so ContainerBlock can also import it
// to render its own children without a circular import between the two.
export const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ block: any }>> = {
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  button: ButtonBlock,
  container: ContainerBlock,
  list: ListBlock,
  video: VideoBlock,
  gallery: GalleryBlock,
  // Link Button is content-identical to Button (text/linkType/link/style) —
  // reuse the same renderer rather than duplicating it.
  "link-button": ButtonBlock,
  "link-text": LinkTextBlock,
  "link-wrapper": LinkWrapperBlock,
  "fancy-icon": FancyIconBlock,
  "rich-text": RichTextBlock,
  // Text Block ("HTML paragraph block") is content-identical to Rich Text —
  // both are an HTML string rendered through the same allow-listed parser.
  "text-block": RichTextBlock,
  // Span is a plain inline text run; reusing TextBlock is a reasonable
  // simplification since this app's block list has no true inline-flow
  // concept (each block is its own row).
  span: TextBlock,
  "code-block": CodeBlockBlock,
  "svg-icon": SvgIconBlock,
};

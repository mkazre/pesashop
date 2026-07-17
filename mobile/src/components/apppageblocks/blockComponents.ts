import HeadingBlock from "./HeadingBlock";
import TextBlock from "./TextBlock";
import ImageBlock from "./ImageBlock";
import ButtonBlock from "./ButtonBlock";
import ContainerBlock from "./ContainerBlock";
import ListBlock from "./ListBlock";

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
};

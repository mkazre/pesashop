import { View } from "react-native";

export default function SpacerBlock({ block }: { block: any }) {
  return <View style={{ height: parseInt(block.height) || 24 }} />;
}

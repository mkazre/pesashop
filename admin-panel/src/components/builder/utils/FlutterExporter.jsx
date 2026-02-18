// Flutter Export Utilities
// This prepares React/Craft.js components for Flutter conversion

const COMPONENT_MAPPINGS = {
  Container: {
    widget: 'Container',
    import: "import 'package:flutter/material.dart';",
    props: {
      padding: 'EdgeInsets',
      margin: 'EdgeInsets',
      decoration: 'BoxDecoration',
      child: 'Widget',
    },
  },
  Text: {
    widget: 'Text',
    import: "import 'package:flutter/material.dart';",
    props: {
      text: 'String',
      style: 'TextStyle',
    },
  },
  Heading: {
    widget: 'Text',
    import: "import 'package:flutter/material.dart';",
    props: {
      text: 'String',
      style: 'TextStyle',
    },
  },
  Image: {
    widget: 'Image',
    import: "import 'package:flutter/material.dart';",
    props: {
      src: 'String',
      fit: 'BoxFit',
    },
  },
  Button: {
    widget: 'ElevatedButton',
    import: "import 'package:flutter/material.dart';",
    props: {
      onPressed: 'VoidCallback',
      child: 'Widget',
    },
  },
};

const STYLE_MAPPINGS = {
  // Color mappings
  color: (value) => `Color(0x${value.replace('#', '')})`,
  backgroundColor: (value) => `Colors.${value}`, // Simplified
  
  // Spacing mappings
  padding: (value) => {
    if (typeof value === 'object') {
      const { top, right, bottom, left } = value;
      return `EdgeInsets.only(top: ${top}, right: ${right}, bottom: ${bottom}, left: ${left})`;
    }
    return `EdgeInsets.all(${value})`;
  },
  margin: (value) => {
    if (typeof value === 'object') {
      const { top, right, bottom, left } = value;
      return `EdgeInsets.only(top: ${top}, right: ${right}, bottom: ${bottom}, left: ${left})`;
    }
    return `EdgeInsets.all(${value})`;
  },
  
  // Typography mappings
  fontSize: (value) => value,
  fontWeight: (value) => {
    const weights = {
      normal: 'FontWeight.normal',
      bold: 'FontWeight.bold',
      '100': 'FontWeight.w100',
      '200': 'FontWeight.w200',
      '300': 'FontWeight.w300',
      '400': 'FontWeight.w400',
      '500': 'FontWeight.w500',
      '600': 'FontWeight.w600',
      '700': 'FontWeight.w700',
      '800': 'FontWeight.w800',
      '900': 'FontWeight.w900',
    };
    return weights[value] || 'FontWeight.normal';
  },
  
  // Layout mappings
  width: (value) => value === '100%' ? 'double.infinity' : value,
  height: (value) => value === 'auto' ? null : value,
  
  // Border mappings
  borderRadius: (value) => `BorderRadius.circular(${value})`,
  borderWidth: (value) => value,
  borderColor: (value) => `Color(0x${value.replace('#', '')})`,
};

export const convertToFlutter = (components, pageName = 'Page') => {
  const imports = new Set();
  const widgets = [];
  const dependencies = [];

  const convertComponent = (node, depth = 0) => {
    if (!node || !node.type) return '';

    const componentType = node.type.resolvedName || node.type;
    const mapping = COMPONENT_MAPPINGS[componentType];

    if (!mapping) {
      // Unknown component, return placeholder
      return `// Unknown component: ${componentType}`;
    }

    imports.add(mapping.import);

    const props = node.props || {};
    const style = props.style || {};
    
    // Convert props
    const flutterProps = [];
    
    // Convert style to Flutter style
    if (Object.keys(style).length > 0) {
      const styleProps = [];
      
      Object.entries(style).forEach(([key, value]) => {
        if (STYLE_MAPPINGS[key]) {
          const converted = STYLE_MAPPINGS[key](value);
          if (converted) {
            styleProps.push(`  ${key}: ${converted},`);
          }
        }
      });
      
      if (styleProps.length > 0) {
        flutterProps.push(`style: TextStyle(\n${styleProps.join('\n')}\n),`);
      }
    }

    // Convert children
    const children = [];
    if (node.nodes && node.nodes.length > 0) {
      node.nodes.forEach((childId) => {
        const childNode = components[childId];
        if (childNode) {
          const childWidget = convertComponent(childNode, depth + 1);
          if (childWidget) {
            children.push(childWidget);
          }
        }
      });
    }

    // Build Flutter widget
    let widgetCode = `${mapping.widget}(\n`;
    
    if (flutterProps.length > 0) {
      widgetCode += flutterProps.map(p => `  ${p}`).join(',\n') + ',\n';
    }
    
    if (children.length > 0) {
      widgetCode += `  child: ${children[0]},\n`;
    } else if (props.text || props.content) {
      widgetCode += `  '${props.text || props.content}',\n`;
    }
    
    widgetCode += ')';

    return widgetCode;
  };

  // Find root node
  const rootNodeId = Object.keys(components).find(id => {
    const node = components[id];
    return node && !node.parent;
  });

  if (rootNodeId) {
    const rootNode = components[rootNodeId];
    const rootWidget = convertComponent(rootNode);
    widgets.push(rootWidget);
  }

  // Generate Flutter code
  const flutterCode = `
import 'package:flutter/material.dart';

class ${pageName.replace(/\s+/g, '')}Page extends StatelessWidget {
  const ${pageName.replace(/\s+/g, '')}Page({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ${widgets[0] || 'Container()'},
    );
  }
}
`.trim();

  return {
    code: flutterCode,
    imports: Array.from(imports),
    dependencies: dependencies,
    widgets: widgets,
  };
};

export const exportAsFlutter = (pageData) => {
  if (!pageData.components || Object.keys(pageData.components).length === 0) {
    throw new Error('No components to export');
  }

  const flutterData = convertToFlutter(pageData.components, pageData.name);
  
  const blob = new Blob([flutterData.code], { type: 'text/dart' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${pageData.slug || 'page'}-${Date.now()}.dart`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return flutterData;
};

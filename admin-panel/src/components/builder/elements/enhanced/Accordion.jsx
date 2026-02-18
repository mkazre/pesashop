import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TextControl, ColorControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import { AccordionSettings } from './AccordionSettings';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';

export const Accordion = ({ items = [], className = '', style = {} }) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const [openItems, setOpenItems] = useState(new Set([0])); // First item open by default

  const {
    allowMultiple = false,
    iconPosition = 'right',
    iconColor = '#3b82f6',
    backgroundColor = '#ffffff',
    borderColor = '#e5e7eb',
    titleColor = '#111827',
    contentColor = '#6b7280',
    titleSize = '16px',
    contentSize = '14px',
    padding = '16px',
    borderRadius = '8px',
    animationDuration = '0.3s'
  } = style;

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    
    if (allowMultiple) {
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
    } else {
      newOpenItems.clear();
      newOpenItems.add(index);
    }
    
    setOpenItems(newOpenItems);
  };

  const defaultItems = [
    { title: 'Accordion Item 1', content: 'Content for the first accordion item.' },
    { title: 'Accordion Item 2', content: 'Content for the second accordion item.' },
    { title: 'Accordion Item 3', content: 'Content for the third accordion item.' }
  ];

  const accordionItems = items.length > 0 ? items : defaultItems;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`accordion ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        ...style,
        backgroundColor,
        borderColor,
        borderRadius,
        overflow: 'hidden'
      }}
    >
      {accordionItems.map((item, index) => (
        <div
          key={index}
          className="accordion-item"
          style={{
            borderBottom: index < accordionItems.length - 1 ? `1px solid ${borderColor}` : 'none'
          }}
        >
          <button
            className="accordion-header"
            onClick={() => toggleItem(index)}
            style={{
              width: '100%',
              padding,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: titleSize,
              color: titleColor,
              fontWeight: '500',
              transition: `all ${animationDuration} ease`
            }}
          >
            <span>{item.title}</span>
            <div
              className="accordion-icon"
              style={{
                transform: openItems.has(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${animationDuration} ease`,
                color: iconColor
              }}
            >
              <ChevronDown size={16} />
            </div>
          </button>
          
          <div
            className="accordion-content"
            style={{
              padding,
              fontSize: contentSize,
              color: contentColor,
              lineHeight: '1.6',
              maxHeight: openItems.has(index) ? '500px' : '0',
              overflow: 'hidden',
              transition: `max-height ${animationDuration} ease, padding ${animationDuration} ease`,
              paddingTop: openItems.has(index) ? padding : '0',
              paddingBottom: openItems.has(index) ? padding : '0'
            }}
          >
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
};

Accordion.craft = {
  displayName: 'Accordion',
  props: {
    className: '',
    style: {
      items: [],
      allowMultiple: false,
      iconPosition: 'right',
      iconColor: '#3b82f6',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      titleColor: '#111827',
      contentColor: '#6b7280',
      titleSize: '16px',
      contentSize: '14px',
      padding: '16px',
      borderRadius: '8px',
      animationDuration: '0.3s'
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Accordion'), // Dynamic check based on nesting rules
    canMoveOut: () => true,
  },
  isCanvas: true, // This allows the element to contain other elements
  related: {
    settings: AccordionSettings,
  },
};

export default Accordion;

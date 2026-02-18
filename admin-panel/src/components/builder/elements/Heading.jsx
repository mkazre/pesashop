import React, { useState, useRef, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Heading = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { content = 'Heading', level = 2, className = '', style = {} } = resolved;
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [editing, setEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const inputRef = useRef(null);

  // Sync from store only when not editing and content actually changes
  useEffect(() => {
    if (!editing && content !== localContent) {
      setLocalContent(content);
    }
  }, [content, editing, localContent]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
  };

  const handleBlur = () => {
    const value = inputRef.current?.value ?? localContent;
    setEditing(false);
    setLocalContent(value);
    console.log('Heading content updated:', value);
    setProp((props) => { props.content = value; });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const Tag = `h${level}`;

  if (editing) {
    return (
      <Tag className={className} style={style}>
        <input
          ref={inputRef}
          type="text"
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full font-inherit text-inherit bg-transparent border-none ring-2 ring-blue-500 outline-none px-0"
          style={{ margin: 0 }}
        />
      </Tag>
    );
  }

  return (
    <Tag
      ref={(ref) => connect(drag(ref))}
      onDoubleClick={handleDoubleClick}
      className={`heading ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''} cursor-text`}
      style={style}
    >
      {content}
    </Tag>
  );
};

Heading.craft = {
  displayName: 'Heading',
  props: {
    content: 'Heading',
    level: 2,
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Heading'), // Dynamic check based on nesting rules
    canMoveOut: () => true,
  },
};

import React, { useState, useRef, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Text = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { content = 'Text content', className = '', style = {} } = resolved;
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
    console.log('Text content updated:', value);
    setProp((props) => { props.content = value; });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`text w-full min-h-[1.5em] resize-y ${className} ring-2 ring-blue-500 outline-none`}
        style={style}
        rows={3}
      />
    );
  }

  return (
    <p
      ref={(ref) => connect(drag(ref))}
      onDoubleClick={handleDoubleClick}
      className={`text ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''} cursor-text`}
      style={style}
    >
      {content}
    </p>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    content: 'Text content',
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Text'), // Dynamic check based on nesting rules
    canMoveOut: () => true,
  },
};

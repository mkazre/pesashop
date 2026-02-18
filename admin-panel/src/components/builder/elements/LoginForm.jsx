import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const LoginForm = ({
  title = 'Sign In',
  showRemember = true,
  showForgot = true,
  buttonText = 'Log In',
  buttonColor = '#3b82f6',
  borderRadius = '8px',
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`login-form-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ maxWidth: '400px', ...style }}
    >
      <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {title && <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, textAlign: 'center' }}>{title}</h2>}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>Email</label>
          <input type="email" placeholder="you@example.com" style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius, fontSize: '14px', boxSizing: 'border-box' }} readOnly />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>Password</label>
          <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius, fontSize: '14px', boxSizing: 'border-box' }} readOnly />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          {showRemember && <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}><input type="checkbox" /> Remember me</label>}
          {showForgot && <a href="#" onClick={(e) => e.preventDefault()} style={{ color: buttonColor, textDecoration: 'none' }}>Forgot password?</a>}
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          {buttonText}
        </button>
      </form>
    </div>
  );
};

export const LoginFormSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { title = '', buttonText = '', showRemember = true, showForgot = true, buttonColor = '#3b82f6', borderRadius = '8px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Button Text</label><input type="text" value={buttonText} onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showRemember} onChange={(e) => setProp((p) => { p.showRemember = e.target.checked; })} />Show "Remember me"</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showForgot} onChange={(e) => setProp((p) => { p.showForgot = e.target.checked; })} />Show "Forgot password"</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Button Color</label><input type="color" value={buttonColor} onChange={(e) => setProp((p) => { p.buttonColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

LoginForm.craft = {
  displayName: 'Login Form',
  props: { title: 'Sign In', showRemember: true, showForgot: true, buttonText: 'Log In', buttonColor: '#3b82f6', borderRadius: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};

/**
 * ToolView Card for zotero_export.
 */

import React, { useState } from 'react';

export function ExportToolView(props: { block: any; toolName?: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { block } = props;

  const args = block?.arguments || {};
  const format = (args.format || 'bibtex').toUpperCase();
  const style = args.style ? `(${args.style})` : '';
  const result = block?.result || block?.output || {};
  const content = result.content || '';
  const isRunning = block?.status === 'running' || !block?.result;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--dsh-border-subtle, #e2e8f0)',
        borderRadius: '8px',
        margin: '6px 0',
        backgroundColor: 'var(--dsh-bg-card, #ffffff)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        fontSize: '13px',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          cursor: 'pointer',
          backgroundColor: 'var(--dsh-bg-muted, #f8fafc)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px' }}>📑</span>
          <span style={{ fontWeight: 600, color: 'var(--dsh-text-primary, #1e293b)' }}>
            学术导出: {format} {style}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#f3e8ff',
              color: '#7e22ce',
              fontWeight: 500,
            }}
          >
            {args.item_keys?.length || 1} 篇文献
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isRunning && content && (
            <button
              onClick={handleCopy}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                color: copied ? '#059669' : '#334155',
                fontWeight: 500,
              }}
            >
              {copied ? '✓ 已复制' : '复制内容'}
            </button>
          )}
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && !isRunning && (
        <div style={{ padding: '10px 12px' }}>
          <pre
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '12px',
              fontFamily: 'Consolas, Monaco, monospace',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {content || '[无导出数据]'}
          </pre>
        </div>
      )}
    </div>
  );
}

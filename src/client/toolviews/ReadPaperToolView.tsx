/**
 * ToolView Card for zotero_read_paper.
 */

import React, { useState } from 'react';

export function ReadPaperToolView(props: { block: any; toolName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { block } = props;

  const args = block?.arguments || {};
  const itemKey = args.item_key || '';
  const startPage = args.start_page;
  const endPage = args.end_page;

  const result = block?.result || block?.output || {};
  const title = result.title || `文献 [${itemKey}]`;
  const isRunning = block?.status === 'running' || !block?.result;
  const pdfText = result.pdf_text || '';

  const pageRange =
    startPage && endPage
      ? `第 ${startPage} - ${endPage} 页`
      : startPage
      ? `第 ${startPage} 页起`
      : '全文精读';

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
          <span style={{ fontSize: '15px' }}>📖</span>
          <span style={{ fontWeight: 600, color: 'var(--dsh-text-primary, #1e293b)' }}>
            论文阅读: {title}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontWeight: 500,
            }}
          >
            {pageRange}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isRunning ? (
            <span style={{ color: '#64748b', fontSize: '12px' }}>正在提取 PDF...</span>
          ) : (
            <span style={{ color: '#059669', fontWeight: 500, fontSize: '12px' }}>
              已解析 {pdfText.length} 字符
            </span>
          )}
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && !isRunning && (
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            作者: {result.creators || '未知'} | 日期: {result.date || '未知'}
            {result.doi ? ` | DOI: ${result.doi}` : ''}
          </div>
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '12px',
              fontFamily: 'monospace',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              color: '#334155',
            }}
          >
            {pdfText || '[暂未提取到有效文本]'}
          </div>
        </div>
      )}
    </div>
  );
}

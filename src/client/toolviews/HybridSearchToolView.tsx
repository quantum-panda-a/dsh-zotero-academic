/**
 * ToolView Card for zotero_hybrid_search & zotero_semantic_search.
 */

import React, { useState } from 'react';

export interface HybridSearchItem {
  item_key: string;
  title: string;
  date: string;
  creators: string;
  passage: string;
  page_number?: number;
  score: number;
  doi?: string;
  match_type?: 'hybrid' | 'semantic' | 'keyword';
}

export function HybridSearchToolView(props: { block: any; toolName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { block } = props;

  // Extract arguments and output from tool block
  const args = block?.arguments || {};
  const query = args.query || '';
  const mode = args.mode || 'hybrid';
  const rawResults: HybridSearchItem[] = Array.isArray(block?.result)
    ? block.result
    : Array.isArray(block?.output)
    ? block.output
    : [];

  const count = rawResults.length;
  const isRunning = block?.status === 'running' || !block?.result;

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
      {/* Header Summary Row */}
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
          <span style={{ fontSize: '15px' }}>📚</span>
          <span style={{ fontWeight: 600, color: 'var(--dsh-text-primary, #1e293b)' }}>
            学术检索: {query ? `"${query}"` : '文献库'}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              fontWeight: 500,
            }}
          >
            {mode === 'hybrid' ? 'RRF 混合模式' : mode === 'semantic' ? '纯向量模式' : '关键词模式'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isRunning ? (
            <span style={{ color: '#64748b', fontSize: '12px' }}>正在检索...</span>
          ) : (
            <span style={{ color: '#059669', fontWeight: 500, fontSize: '12px' }}>
              命中 {count} 条证据
            </span>
          )}
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded Content List */}
      {expanded && !isRunning && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {count === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>未匹配到相关文献证据片段。</div>
          ) : (
            rawResults.map((item, idx) => {
              const badgeBg =
                item.match_type === 'hybrid'
                  ? '#fef3c7'
                  : item.match_type === 'semantic'
                  ? '#ede9fe'
                  : '#f1f5f9';
              const badgeColor =
                item.match_type === 'hybrid'
                  ? '#b45309'
                  : item.match_type === 'semantic'
                  ? '#6d28d9'
                  : '#475569';
              const badgeText =
                item.match_type === 'hybrid'
                  ? '🌟 Hybrid'
                  : item.match_type === 'semantic'
                  ? '🧠 向量语义'
                  : '🔍 关键词命中';

              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                      [{idx + 1}] {item.title} {item.date ? `(${item.date})` : ''}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontWeight: 600,
                      }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    作者: {item.creators || '未知'} | Key: <code style={{ color: '#0284c7' }}>{item.item_key}</code>
                    {item.page_number ? ` | 第 ${item.page_number} 页` : ''}
                    {item.score ? ` | 评分: ${item.score}` : ''}
                  </div>

                  {item.passage && (
                    <blockquote
                      style={{
                        margin: '4px 0 0 0',
                        padding: '6px 10px',
                        borderLeft: '3px solid #3b82f6',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        color: '#334155',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.passage.trim()}
                    </blockquote>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

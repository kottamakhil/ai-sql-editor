import React from 'react';

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
  'AND', 'OR', 'NOT', 'IN', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'BETWEEN', 'LIKE', 'IS', 'NULL',
  'DESC', 'ASC', 'DISTINCT', 'WITH', 'INSERT', 'INTO', 'VALUES', 'UPDATE',
  'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'UNION', 'ALL',
  'EXISTS', 'CROSS', 'FULL', 'NATURAL', 'USING', 'OVER', 'PARTITION',
  'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW',
  'TRUE', 'FALSE', 'BOOLEAN', 'INT', 'INTEGER', 'TEXT', 'VARCHAR', 'NUMERIC',
  'DECIMAL', 'FLOAT', 'DATE', 'TIMESTAMP', 'INTERVAL',
]);

const SQL_FUNCTIONS = new Set([
  'DATEDIFF', 'DATEADD', 'GETDATE', 'GREATEST', 'LEAST', 'COALESCE',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'CAST', 'EXTRACT',
  'CONCAT', 'UPPER', 'LOWER', 'TRIM', 'LENGTH', 'SUBSTRING', 'REPLACE',
  'NOW', 'DATE_TRUNC', 'TO_CHAR', 'TO_DATE', 'NULLIF', 'IFNULL',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE',
  'LAST_VALUE', 'NTH_VALUE', 'NTILE', 'PERCENT_RANK', 'CUME_DIST',
]);

export function highlightSQL(sql: string): React.ReactNode[] {
  const lines = sql.split('\n');
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let i = 0;
    while (i < line.length) {
      if (line.substring(i, i + 2) === '--') {
        parts.push(<span key={`${lineIdx}-${i}`} style={{ color: '#6a9955' }}>{line.substring(i)}</span>);
        i = line.length;
      } else if (line[i] === "'") {
        let end = line.indexOf("'", i + 1);
        if (end === -1) end = line.length - 1;
        parts.push(<span key={`${lineIdx}-${i}`} style={{ color: '#ce9178' }}>{line.substring(i, end + 1)}</span>);
        i = end + 1;
      } else if (/\d/.test(line[i]) && (i === 0 || /[\s,=(]/.test(line[i - 1]))) {
        let end = i;
        while (end < line.length && /[\d.]/.test(line[end])) end++;
        parts.push(<span key={`${lineIdx}-${i}`} style={{ color: '#b5cea8' }}>{line.substring(i, end)}</span>);
        i = end;
      } else if (/[a-zA-Z_]/.test(line[i])) {
        let end = i;
        while (end < line.length && /[a-zA-Z_0-9]/.test(line[end])) end++;
        const word = line.substring(i, end);
        const upper = word.toUpperCase();
        if (SQL_KEYWORDS.has(upper)) {
          parts.push(<span key={`${lineIdx}-${i}`} style={{ color: '#569cd6', fontWeight: 600 }}>{word}</span>);
        } else if (SQL_FUNCTIONS.has(upper)) {
          parts.push(<span key={`${lineIdx}-${i}`} style={{ color: '#dcdcaa' }}>{word}</span>);
        } else if (word.includes('_') || /^[a-z]/.test(word)) {
          parts.push(<span key={`${lineIdx}-${i}`} style={{ color: '#9cdcfe' }}>{word}</span>);
        } else {
          parts.push(<span key={`${lineIdx}-${i}`}>{word}</span>);
        }
        i = end;
      } else {
        parts.push(<span key={`${lineIdx}-${i}`}>{line[i]}</span>);
        i++;
      }
    }
    return (
      <React.Fragment key={lineIdx}>
        {parts}
        {lineIdx < lines.length - 1 ? '\n' : null}
      </React.Fragment>
    );
  });
}

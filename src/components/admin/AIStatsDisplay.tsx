interface AIStatsDisplayProps {
  aiStats: any;
}

export function AIStatsDisplay({ aiStats }: AIStatsDisplayProps) {
  if (!aiStats) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#EADBC8]">
      <h5 className="font-medium text-sm text-[#4B4036] mb-2">🤖 AI生成統計</h5>
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium">模型：</span>
          <span>{aiStats.model || '未知'}</span>
        </div>
        {aiStats.usage && (
          <>
            {aiStats.usage.total_tokens && (
              <div>
                <span className="font-medium">總Token數：</span>
                <span>{aiStats.usage.total_tokens.toLocaleString()}</span>
              </div>
            )}
            {aiStats.usage.prompt_tokens && (
              <div>
                <span className="font-medium">輸入Token：</span>
                <span>{aiStats.usage.prompt_tokens.toLocaleString()}</span>
              </div>
            )}
            {aiStats.usage.completion_tokens && (
              <div>
                <span className="font-medium">輸出Token：</span>
                <span>{aiStats.usage.completion_tokens.toLocaleString()}</span>
              </div>
            )}
            {aiStats.usage.citation_tokens && (
              <div>
                <span className="font-medium">引用Token：</span>
                <span>{aiStats.usage.citation_tokens.toLocaleString()}</span>
              </div>
            )}
            {aiStats.usage.reasoning_tokens && (
              <div>
                <span className="font-medium">推理Token：</span>
                <span>{aiStats.usage.reasoning_tokens.toLocaleString()}</span>
              </div>
            )}
            {aiStats.usage.num_search_queries && (
              <div>
                <span className="font-medium">搜索查詢：</span>
                <span>{aiStats.usage.num_search_queries}次</span>
              </div>
            )}
            {aiStats.usage.cost?.total_cost && (
              <div>
                <span className="font-medium">總成本：</span>
                <span className="text-green-600">${aiStats.usage.cost.total_cost.toFixed(6)}</span>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 引用來源 */}
      {aiStats.citations && aiStats.citations.length > 0 && (
        <div className="mt-3">
          <h6 className="font-medium text-xs text-[#4B4036] mb-1">📚 引用來源 ({aiStats.citations.length})</h6>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {aiStats.citations.slice(0, 5).map((citation: string, index: number) => (
              <div key={index} className="text-xs text-blue-600 truncate">
                {citation}
              </div>
            ))}
            {aiStats.citations.length > 5 && (
              <div className="text-xs text-gray-500">
                還有 {aiStats.citations.length - 5} 個來源...
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 搜索結果 */}
      {aiStats.search_results && aiStats.search_results.length > 0 && (
        <div className="mt-3">
          <h6 className="font-medium text-xs text-[#4B4036] mb-1">🔍 搜索結果 ({aiStats.search_results.length})</h6>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {aiStats.search_results.slice(0, 3).map((result: any, index: number) => (
              <div key={index} className="text-xs">
                <div className="font-medium truncate">{result.title}</div>
                <div className="text-blue-600 truncate">{result.url}</div>
              </div>
            ))}
            {aiStats.search_results.length > 3 && (
              <div className="text-xs text-gray-500">
                還有 {aiStats.search_results.length - 3} 個結果...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
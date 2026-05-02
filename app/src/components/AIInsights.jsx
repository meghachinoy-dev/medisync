const TYPE_META = {
  CONSECUTIVE_MISS: { label: 'Consecutive Miss Pattern', icon: '🔴', color: '#ef4444' },
  DAY_OF_WEEK: { label: 'Day-of-Week Pattern', icon: '📅', color: '#f59e0b' },
  LOW_STOCK: { label: 'Low Stock Alert', icon: '⚠️', color: '#f59e0b' },
  EMPTY_COMPARTMENT: { label: 'Empty Compartment', icon: '🚨', color: '#ef4444' },
  COMPLIANCE_THRESHOLD: { label: 'Compliance Below Threshold', icon: '📉', color: '#ef4444' },
  EARLY_TAKE_PATTERN: { label: 'Early-Take Pattern', icon: '⏰', color: '#3b82f6' },
  INTERACTION_WINDOW: { label: 'Interaction Window', icon: '💡', color: '#8b5cf6' },
};

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? '#16a34a' : pct >= 70 ? '#d97706' : '#9ca3af';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function InsightCard({ insight }) {
  const meta = TYPE_META[insight.type] || { label: insight.type, icon: '🔍', color: '#6b7280' };

  return (
    <div className={`insight-card ${insight.severity}`}>
      <div className="insight-header">
        <span style={{ fontSize: 18 }}>{meta.icon}</span>
        <span className="insight-type" style={{ color: meta.color }}>{meta.label}</span>
        {insight.medicine && (
          <span style={{
            fontSize: 11, background: insight.medicine.colorHex + '22',
            color: insight.medicine.colorHex, padding: '1px 7px', borderRadius: 20, fontWeight: 600,
          }}>
            {insight.medicine.name}
          </span>
        )}
        <span className={`severity-badge severity-${insight.severity}`} style={{ marginLeft: 'auto' }}>
          {insight.severity}
        </span>
      </div>

      <p className="insight-desc">{insight.description}</p>

      <div className="insight-action">
        <span>→</span>
        <span>{insight.suggestedAction}</span>
        <span
          className={`auto-apply-badge ${insight.autoApply ? 'auto-applied' : 'manual-review'}`}
        >
          {insight.autoApply ? '⚡ Auto-Applied' : '👁️ Manual Review'}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Confidence Level</div>
        <ConfidenceBar value={insight.confidence} />
      </div>

      {insight.shiftMinutes > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
          ⏱ Schedule shifted {insight.shiftMinutes} min earlier
        </div>
      )}
    </div>
  );
}

export default function AIInsights({ insights, adaptiveRules, aiRules }) {
  const activeRules = Object.values(aiRules || {}).filter((r) => r.applied);
  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount = insights.filter((i) => i.severity === 'warning').length;
  const infoCount = insights.filter((i) => i.severity === 'info').length;

  return (
    <div>
      <div className="page-header">
        <h2>AI Insights</h2>
        <p>Pattern detection, adaptive scheduling rules, and recommendations</p>
      </div>

      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card red">
          <div className="stat-val">{criticalCount}</div>
          <div className="stat-label">Critical Patterns</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-val">{warningCount}</div>
          <div className="stat-label">Warnings</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-val">{infoCount}</div>
          <div className="stat-label">Suggestions</div>
        </div>
        <div className="stat-card green">
          <div className="stat-val">{activeRules.length}</div>
          <div className="stat-label">Active Rules</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Detected patterns */}
        <div>
          <div className="card-title" style={{ marginBottom: 14 }}>🧠 Detected Patterns ({insights.length})</div>
          {insights.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                No concerning patterns detected. Keep up the good compliance!
              </div>
            </div>
          ) : (
            insights.map((insight, idx) => <InsightCard key={idx} insight={insight} />)
          )}
        </div>

        {/* Active adaptive rules */}
        <div>
          <div className="card-title" style={{ marginBottom: 14 }}>⚙️ Active Adaptive Rules ({activeRules.length})</div>
          {activeRules.length === 0 ? (
            <div className="card">
              <div className="empty-state">No adaptive rules currently active.</div>
            </div>
          ) : (
            activeRules.map((rule) => {
              const meta = TYPE_META[rule.patternType] || { label: rule.patternType, icon: '🔧', color: '#6b7280' };
              return (
                <div
                  key={rule.id}
                  style={{
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                    padding: '14px 16px', marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                      APPLIED
                    </span>
                  </div>
                  {[
                    ['Action', rule.action.replace(/_/g, ' ')],
                    ['Confidence', `${Math.round(rule.confidence * 100)}%`],
                    ['Applied', new Date(rule.detectedAt).toLocaleDateString('en-IN')],
                    rule.shiftMinutes ? ['Time Shift', `${rule.shiftMinutes} min earlier`] : null,
                  ].filter(Boolean).map(([label, val]) => (
                    <div
                      key={label}
                      style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#6b7280', borderBottom: '1px solid #f9fafb' }}
                    >
                      <span>{label}</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{val}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}

          {/* How the AI engine works */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">📖 How the AI Engine Works</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 8 }}>
                MediSync's adaptive rule engine analyzes 30 days of dose logs to detect behavioral patterns:
              </p>
              {[
                ['Consecutive Miss', 'Detects when the same dose is missed 3+ days in a row → shifts reminder earlier'],
                ['Day-of-Week', 'Finds days where miss rate ≥ 65% → adds secondary alarm 30 min earlier'],
                ['Low Stock', 'Alerts caregiver when pills ≤ 5 → triggers refill notification'],
                ['Compliance Drop', '7-day compliance < 70% → escalates to doctor notification'],
                ['Early Take', 'Medicine taken consistently early → suggests moving schedule forward'],
                ['Interaction Window', 'Two medicines within 15 min → recommends staggering'],
              ].map(([name, desc]) => (
                <div key={name} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, minWidth: 120 }}>→ {name}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

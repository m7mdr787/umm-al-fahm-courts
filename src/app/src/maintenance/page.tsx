export default function MaintenancePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f9fafb',
      color: '#111827',
      direction: 'rtl',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>الموقع مغلق حالياً</h1>
        <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '24px' }}>
          نظام الحجز مغلق حالياً للصيانة والتحديث. يرجى العودة لاحقاً.
        </p>
        <span style={{ fontSize: '14px', color: '#9ca3af' }}>إدارة الملعب</span>
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function DataEntry() {
  const [factors, setFactors] = useState([]);
  const [selectedFactorId, setSelectedFactorId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dateLogged, setDateLogged] = useState('');
  const [userOrgId, setUserOrgId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formType, setFormType] = useState('activity'); // 'activity' or 'offset'
  const [offsetType, setOffsetType] = useState('Reforestation');
  
  // Conflicting duplicate records state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    setDateLogged(new Date().toISOString().split('T')[0]);
    
    const fetchContext = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: userData } = await supabase.from('users').select('organization_id').eq('id', session.user.id).single();
      if (userData?.organization_id) {
        setUserOrgId(userData.organization_id);
      }

      const { data: factorList } = await supabase.from('emission_factors').select('*');
      if (factorList) {
        setFactors(factorList);
        setSelectedFactorId(factorList[0]?.id || '');
      }
    };
    fetchContext();
  }, []);

  const activeFactor = factors.find(f => f.id === selectedFactorId);
  const previewEmission = activeFactor && quantity ? (parseFloat(quantity) * activeFactor.factor_value).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setDuplicateWarning(null);

    if (!userOrgId) {
      setMessage('Error: You are not assigned to an organization. Only authorized users can log data.');
      setLoading(false);
      return;
    }

    // Step 1: Duplicate validation check
    const { data: existingLogs } = await supabase
      .from('activity_data')
      .select('id, quantity')
      .eq('organization_id', userOrgId)
      .eq('emission_factor_id', selectedFactorId)
      .eq('date_logged', dateLogged);

    if (existingLogs && existingLogs.length > 0) {
      setDuplicateWarning(existingLogs);
      setLoading(false);
      return; // Wait for user decision
    }

    // If perfectly clean, insert
    if (formType === 'activity') {
      await executeInsert();
    } else {
      await executeOffsetInsert();
    }
  };

  const executeInsert = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from('activity_data').insert([{
      organization_id: userOrgId,
      user_id: session.user.id,
      emission_factor_id: selectedFactorId,
      quantity: parseFloat(quantity),
      date_logged: dateLogged
    }]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Success! Log seamlessly recorded and emissions tracked.');
      setQuantity('');
    }
    setLoading(false);
  };

  const executeOffsetInsert = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase.from('offsets').insert([{
      organization_id: userOrgId,
      user_id: session.user.id,
      type: offsetType,
      amount: parseFloat(quantity), // reusing the quantity numeric field
      date_logged: dateLogged
    }]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Success! Carbon offset of ${quantity}kg logged under ${offsetType}.`);
      setQuantity('');
    }
    setLoading(false);
  };

  const handleOverwrite = async () => {
    setLoading(true);
    const idsToDelete = duplicateWarning.map(l => l.id);
    await supabase.from('activity_data').delete().in('id', idsToDelete);
    
    await executeInsert();
    setDuplicateWarning(null);
  };

  const handleAddOn = async () => {
    setLoading(true);
    // Take the first existing log and add our new quantity to it
    const targetLog = duplicateWarning[0];
    const newQuantity = Number(targetLog.quantity) + Number(quantity);
    
    const { error } = await supabase.from('activity_data').update({ quantity: newQuantity }).eq('id', targetLog.id);
    
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      // If there were other random duplicates for the same day, clean them up to sanitize DB
      if (duplicateWarning.length > 1) {
        const extraIds = duplicateWarning.slice(1).map(l => l.id);
        await supabase.from('activity_data').delete().in('id', extraIds);
      }
      setMessage(`Success! Added ${quantity} to the existing record for a total of ${newQuantity}.`);
      setQuantity('');
    }
    setDuplicateWarning(null);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Data Entry</h2>
        <p style={{ opacity: 0.7, margin: 0 }}>Log new operational activities to calculate carbon footprint.</p>
      </header>

      <div className="glass" style={{ padding: '2.5rem', borderRadius: '1rem' }}>
        
        {duplicateWarning && (
          <div className="animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(255,165,0,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(255,165,0,0.3)', marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffb700', fontSize: '1.1rem' }}>⚠️ Existing Record Found</h4>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.5 }}>
              You have already logged data for <strong>{activeFactor?.category}</strong> on <strong>{dateLogged}</strong>. <br/>
              What would you like to do with this new {quantity} {activeFactor?.unit} entry?
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={handleOverwrite} type="button" style={{ padding: '0.75rem 1.25rem', background: '#ffb700', color: 'black', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.8} onMouseOut={e => e.target.style.opacity = 1}>
                Overwrite Existing
              </button>
              <button onClick={handleAddOn} type="button" style={{ padding: '0.75rem 1.25rem', background: 'transparent', color: '#ffb700', border: '1px solid #ffb700', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(255,165,0,0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>
                Add to Existing Log
              </button>
              <button onClick={() => setDuplicateWarning(null)} type="button" style={{ padding: '0.75rem 1.25rem', background: 'transparent', color: 'inherit', opacity: 0.7, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <button 
            type="button" 
            onClick={() => { setFormType('activity'); setMessage(''); }}
            style={{ padding: '0.5rem 1rem', background: formType === 'activity' ? 'hsl(var(--primary))' : 'transparent', color: formType === 'activity' ? 'white' : 'inherit', border: '1px solid hsl(var(--primary))', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Emit Activities
          </button>
          <button 
            type="button" 
            onClick={() => { setFormType('offset'); setMessage(''); }}
            style={{ padding: '0.5rem 1rem', background: formType === 'offset' ? 'hsl(var(--primary))' : 'transparent', color: formType === 'offset' ? 'white' : 'inherit', border: '1px solid hsl(var(--primary))', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Log Offsets
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: duplicateWarning ? 0.3 : 1, pointerEvents: duplicateWarning ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formType === 'activity' ? 'Activity Category' : 'Offset Type'}</label>
              {formType === 'activity' ? (
                <select 
                  value={selectedFactorId} 
                  onChange={(e) => setSelectedFactorId(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }}
                  required
                >
                  {factors.map(f => (
                    <option key={f.id} value={f.id} style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--background))' }}>{f.category} ({f.unit})</option>
                  ))}
                </select>
              ) : (
                <select 
                  value={offsetType} 
                  onChange={(e) => setOffsetType(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }}
                  required
                >
                  <option value="Reforestation" style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--background))' }}>Reforestation</option>
                  <option value="Solar Project" style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--background))' }}>Solar Infrastructure</option>
                  <option value="Wind Credits" style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--background))' }}>Verified Wind Credits</option>
                  <option value="Direct Air Capture" style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--background))' }}>Direct Air Capture (DAC)</option>
                </select>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Date Logged</label>
              <input 
                type="date" 
                value={dateLogged}
                onChange={(e) => setDateLogged(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formType === 'activity' ? `Quantity (${activeFactor?.unit || 'units'})` : 'Amount (kg CO2e Offset)'}</label>
            <input 
              type="number" 
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={formType === 'activity' ? "e.g. 150.5" : "e.g. 500.0"}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }}
              required
            />
          </div>

          {formType === 'activity' && (
            <div style={{ padding: '1.5rem', background: 'hsla(var(--primary), 0.1)', borderRadius: '0.5rem', border: '1px dashed hsl(var(--primary))' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.8 }}>Live Preview Emission</h4>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
                {previewEmission} <span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>kg CO₂e</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
                Formula: {quantity || '0'} × {activeFactor?.factor_value || '0'}
              </p>
            </div>
          )}

          {message && (
            <div style={{ padding: '1rem', borderRadius: '0.5rem', background: message.includes('Error') ? 'rgba(255,100,100,0.1)' : 'rgba(100,255,100,0.1)', color: message.includes('Error') ? '#ff6b6b' : '#51cf66' }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (formType === 'activity' && !factors.length)}
            style={{ padding: '1rem', borderRadius: '0.5rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', transition: 'opacity 0.2s' }}
            onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}
          >
            {loading ? 'Processing...' : (formType === 'activity' ? 'Log Activity' : 'Record Offset')}
          </button>
        </form>
      </div>
    </div>
  );
}

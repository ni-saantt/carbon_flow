-- Offset Factors Table
CREATE TABLE IF NOT EXISTS public.offset_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    factor_value DECIMAL NOT NULL, -- kg CO2e saved per unit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Data (Initial Factors)
INSERT INTO public.offset_factors (category, unit, factor_value) VALUES
('Reforestation', 'Trees', 21.8),
('Solar Infrastructure', 'kWh', 0.8),
('Wind Credit', 'MWh', 1000.0),
('DAC - Direct Air Capture', 'kg Gross', 1.0)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.offset_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read offset factors" ON public.offset_factors FOR SELECT USING (true);

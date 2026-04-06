-- CarbonFlow Offsets Table
CREATE TABLE IF NOT EXISTS public.offsets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- e.g., 'Reforestation', 'Solar Power', 'Wind Energy'
    amount DECIMAL NOT NULL, -- in kg CO2e
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.offsets ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policy
CREATE POLICY "Users can view and insert own org offsets" ON public.offsets
    FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE users.id = auth.uid()));

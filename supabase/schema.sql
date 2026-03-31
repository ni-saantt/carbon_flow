-- CarbonFlow Supabase Schema

-- 1. Organizations
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Custom User Roles (Enum)
CREATE TYPE user_role AS ENUM ('Administrator', 'Organization User', 'Analyst', 'Management');

-- 3. Users Table (Extends Supabase Auth Profiles)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role user_role DEFAULT 'Organization User',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We must create a trigger to automatically add users to public.users upon signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Emission Factors
CREATE TABLE public.emission_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    factor_value DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Activity Data
CREATE TABLE public.activity_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    emission_factor_id UUID NOT NULL REFERENCES public.emission_factors(id) ON DELETE RESTRICT,
    quantity DECIMAL NOT NULL,
    date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
    carbon_emission DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Use trigger to calculate emissions automatically based on factor
CREATE OR REPLACE FUNCTION public.calculate_carbon_emission()
RETURNS TRIGGER AS $$
DECLARE factor DECIMAL;
BEGIN
    SELECT factor_value INTO factor FROM public.emission_factors WHERE id = NEW.emission_factor_id;
    NEW.carbon_emission := NEW.quantity * factor;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_emission_trigger
    BEFORE INSERT OR UPDATE ON public.activity_data
    FOR EACH ROW
    EXECUTE PROCEDURE public.calculate_carbon_emission();

-- 6. Reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    report_period TEXT NOT NULL,
    total_emissions DECIMAL,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Row Level Security (RLS)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Organizations are viewable by their users" ON public.organizations
    FOR SELECT USING (id IN (SELECT organization_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Emission factors are readable by all authenticated users" ON public.emission_factors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Organization users can view and insert own org activities" ON public.activity_data
    FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "Organization users can view their org reports" ON public.reports
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.users WHERE users.id = auth.uid()));

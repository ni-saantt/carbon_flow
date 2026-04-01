-- Create organization_initiatives table
CREATE TABLE IF NOT EXISTS organization_initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scope_type TEXT,
    target_metric TEXT,
    target_value NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_initiatives table
CREATE TABLE IF NOT EXISTS user_initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES organization_initiatives(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'following',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, initiative_id)
);

-- RLS Policies
ALTER TABLE organization_initiatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View organization initiatives" ON organization_initiatives FOR SELECT USING ( organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()) );
CREATE POLICY "Manage organization initiatives" ON organization_initiatives FOR ALL USING ( organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin') );

ALTER TABLE user_initiatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View user initiatives" ON user_initiatives FOR SELECT USING ( initiative_id IN (SELECT id FROM organization_initiatives WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())) );
CREATE POLICY "Manage own user initiatives" ON user_initiatives FOR ALL USING ( user_id = auth.uid() );

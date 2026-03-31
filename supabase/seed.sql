-- Initial Emission Factors Seed
INSERT INTO public.emission_factors (category, factor_value, unit, description) VALUES
('Electricity (Grid)', 0.45, 'kWh', 'kg CO2e per kWh of grid electricity'),
('Diesel', 2.68, 'liters', 'kg CO2e per liter of diesel combusted'),
('Petrol', 2.31, 'liters', 'kg CO2e per liter of petrol combusted'),
('Natural Gas', 2.02, 'm3', 'kg CO2e per cubic meter of natural gas');

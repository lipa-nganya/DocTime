-- SQL script to insert facilities, payers, procedures, and team members into Cloud SQL
-- Run this via: gcloud sql connect doctime-db --project=drink-suite --user=postgres
-- Or via Cloud Console SQL Editor

-- Facilities
INSERT INTO facilities (id, name, "isSystemDefined", "createdAt", "updatedAt") VALUES 
('5aa02b9e-66a5-4e51-9a3f-54f7ddb2d369', 'Coptic', true, NOW(), NOW()),
('1d9c1e81-00ca-491f-be17-06b097ee5d59', 'Nairobi Hospital', true, NOW(), NOW()),
('a6b88da1-12cd-49a4-8ab3-29b0199265f7', 'Mater', true, NOW(), NOW()),
('b8c9d0e1-23de-5af6-9bc4-3a0c1d2e3f4a', 'Gertrudes', true, NOW(), NOW()),
('c9d0e1f2-34ef-6bg7-acd5-4b1d2e3f4a5b', 'Karen Hospital', true, NOW(), NOW()),
('d0e1f2a3-45fg-7ch8-bde6-5c2e3f4a5b6c', 'MP Shah', true, NOW(), NOW()),
('e1f2a3b4-56gh-8di9-cef7-6d3f4a5b6c7d', 'KNH', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Note: Run the actual export commands to get all facilities, payers, procedures, and team members
-- The above is just a sample. Use the SQL files generated earlier.


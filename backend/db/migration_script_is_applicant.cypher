
MATCH (p:Person)
WHERE NOT EXISTS(p.is_applicant)
SET p.is_applicant = false;


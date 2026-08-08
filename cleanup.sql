DELETE FROM allergy_dictionary
WHERE id NOT IN (SELECT MIN(id) FROM allergy_dictionary GROUP BY name);

DELETE FROM surgery_dictionary
WHERE id NOT IN (SELECT MIN(id) FROM surgery_dictionary GROUP BY name);

DELETE FROM diagnoses
WHERE id NOT IN (SELECT MIN(id) FROM diagnoses GROUP BY name);

DELETE FROM patient_allergies
WHERE id NOT IN (SELECT MIN(id) FROM patient_allergies GROUP BY "patientId", allergen);

DELETE FROM patient_medical_histories
WHERE id NOT IN (SELECT MIN(id) FROM patient_medical_histories GROUP BY "patientId", condition);

DELETE FROM patient_surgical_histories
WHERE id NOT IN (SELECT MIN(id) FROM patient_surgical_histories GROUP BY "patientId", procedure);
-- Сгенерировано автоматически 2026-10-13T05:09:07.452Z
INSERT INTO users (login, password_hash, name, role, region, phone) VALUES
('jahondv', '$2b$10$M6BC8ha0n79PXEobghiEs.EzcpmnQaAk7bfZ1hA66B3GWcNTMEaE2', 'Администратор системы', 'Администратор', 'Минздрав РУз', '998777592055'),
('b.djamuratov', '$2b$10$JYhZbsBTkfE3z3afNudYV.aNluS.o5CArkaWs1l6USqiiTwvUmgEK', 'DJAMURATOV BATIRBEK MURATBAEVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('n.barlikov', '$2b$10$4pdKzsHNmckp4AkSCMuNaeGgYr.BkuoIssKvfdWnL3SMqmXAi8ebq', 'BARLIKOV NAURZBAY KAMALATDINOVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('q.isakov', '$2b$10$N5WJlIG68KdVO5kBJi6Z5egc6QxQlL6sBK8ybMdiNz85kT0bHgpuG', 'ISAKOV QUWAT RUSTEMBAY ULI', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('s.doshniyazov', '$2b$10$Kv.3ObC5NYOkhFLHMvllMuRqeR./WKeYXAqr9skZ.tlWDfAjItpNq', 'DOSHNIYAZOV SALAMAT ORINBAYEVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('b.erimbetov', '$2b$10$2DV2YDl/qhtUTO.UJTaNVO2hCbOwXjxAzJeS0O.NMSiqenrGrBKsu', 'ERIMBETOV BEKJAN NURJANOVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('d.asanov', '$2b$10$zFWBOG4V8Oz0Zlu.xy1RfOfSkuGdZePoqcCB2153wexCbcZTCgqQG', 'ASANOV DAMIR KUANDIKOVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('t.rasulov', '$2b$10$xgqwQ0noT1XvKz.BpQdlbefwKUgExNbFOeCWZgFkE/c0VU7oVTzPG', 'RASULOV TIMUR VLADIMIROVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('b.utemisov', '$2b$10$w7SojJAbCZUckBQ7UQRRleZfWST0PP3M.RssWo8MWeV98GTQJkz4a', 'UTEMISOV BAXRAM KEUNIMJAEVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('m.jadigerov', '$2b$10$u652mKAwzeD0dvEv/XRax.4b/E1dFZANKFDzMCCM6mVHzerwTrjta', 'JADIGEROV MANSUR TOKTARBAEVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('m.erjanov', '$2b$10$i8w0o7JJ91VJBLMo82AxdOFcR7fLPsAiB0CEYOijx7ULMitmZjRte', 'ERJANOV MARAT SAGALATDINOVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL),
('s.soy', '$2b$10$Z7ulHgfZATxa2PiRK6819ewrF4wBZj2cJ/RQnYLSjeyTDAmhZFFSK', 'SOY SERGEY VYACHESLAVOVICH', 'Регион админ', 'Qoraqalpog''iston Respublikasi', NULL)
ON CONFLICT (login) DO NOTHING;

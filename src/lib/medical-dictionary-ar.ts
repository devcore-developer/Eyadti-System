// src/lib/medical-dictionary-ar.ts

const dictionary: Record<string, Record<string, string>> = {
  frequency: {
    "once daily": "مرة واحدة يومياً",
    "twice daily": "مرتين يومياً",
    "three times daily": "ثلاث مرات يومياً",
    "four times daily": "أربع مرات يومياً",
    "every 4-6 hours as needed": "كل 4-6 ساعات عند الحاجة",
    "every 6 hours as needed": "كل 6 ساعات عند الحاجة",
    "every 8 hours": "كل 8 ساعات",
    "two to three times daily": "مرتين إلى ثلاث مرات يومياً",
    "once or twice daily": "مرة أو مرتين يومياً",
    "once daily before breakfast": "مرة يومياً قبل الإفطار",
    "2 puffs as needed": "نفسان عند الحاجة",
    "2 puffs twice daily": "نفسان مرتين يومياً",
    "apply twice daily": "يدهن مرتين يومياً",
    "1-2 drops three times daily": "1-2 نقطة ثلاث مرات يومياً",
    "as directed": "حسب إرشادات الطبيب",
    "as needed": "عند الحاجة",
  },
  duration: {
    "3-5 days": "لمدة 3-5 أيام",
    "5-7 days": "لمدة 5-7 أيام",
    "7 days": "لمدة 7 أيام",
    "7-10 days": "لمدة 7-10 أيام",
    "7-14 days": "لمدة 7-14 أيام",
    "1-2 weeks": "لمدة 1-2 أسبوع",
    "2-4 weeks": "لمدة 2-4 أسابيع",
    "4-8 weeks": "لمدة 4-8 أسابيع",
    "ongoing": "مستمر",
    "days": "أيام",
    "weeks": "أسابيع",
  },
  instructions: {
    "after meals": "بعد الأكل",
    "before meals": "قبل الأكل",
    "before breakfast, 30 mins before eating": "قبل الإفطار بنصف ساعة",
    "with meals": "مع الأكل",
    "on empty stomach": "على معدة فارغة",
    "with plenty of water, avoid lying down for 30 mins": "مع كوب ماء، لا تستلقِ لمدة 30 دقيقة",
    "avoid alcohol": "يمنع تناول الكحوليات",
    "rinse mouth after use": "مضمضة الفم بعد الاستخدام",
    "avoid touching the eye/ear": "عدم لمس العين/الأذن",
    "apply a thin layer, wash hands": "وضع طبقة رقيقة وغسل اليدين",
    "same time every day": "في نفس الميعاد يومياً",
    "as needed": "عند الحاجة",
  },
  
  // ✅ قاموس التشخيصات ICD-10 (الأكثر شيوعاً في العيادات)
  diagnoses: {
    // أمراض معدية معوية (A00-A09)
    "cholera": "كوليرا",
    "typhoid and paratyphoid fevers": "حمى التيفود والباراتيفود",
    "shigellosis": "دوسنتاريا بكتيرية",
    "other bacterial intestinal infections": "التهابات معوية بكتيرية أخرى",
    "amoebiasis": "الدوسنتاريا الأميبية",
    "other gastroenteritis and colitis of infectious and unspecified origin": "التهاب معدة وأمعاء وتهاب قولون معدي وغير محدد المنشأ",

    // السل (A15-A19)
    "respiratory tuberculosis": "السل التنفسي",
    "tuberculosis of nervous system": "السل في الجهاز العصبي",
    "tuberculosis of other organs": "السل في أعضاء أخرى",
    "miliary tuberculosis": "السل الدخني",

    // أمراض معدية أخرى (A20-B99)
    "plague": "الطاعون",
    "anthrax": "الجمرة الخبيثة",
    "brucellosis": "حمى مالطا (البروسيلا)",
    "leprosy": "الجذام",
    "tetanus": "الكزاز",
    "diphtheria": "الخناق (الدفتيريا)",
    "whooping cough": "السعال الديكي",
    "meningococcal infection": "التهاب السحايا بالمكورات السحائية",
    "sepsis": "إنتان الدم",
    "syphilis": "الزهري",
    "gonococcal infection": "السيلان",
    "viral conjunctivitis": "التهاب الملتحمة الفيروسي",
    "mumps": "النكاف",
    "infectious mononucleosis": "كثرة الوحيدات العدوائية",
    "candidiasis": "الكانديدا (المبيضات)",
    "malaria": "الملاريا",
    "leishmaniasis": "الليشمانيا",
    "toxoplasmosis": "التوكسوبلازما",
    "scabies": "الجرب",
    "pediculosis": "قمل",

    // الأورام (C00-D49)
    "malignant neoplasm of lip": "ورم الشفة الخبيث",
    "malignant neoplasm of tongue": "ورم اللسان الخبيث",
    "malignant neoplasm of stomach": "ورم المعدة الخبيث",
    "malignant neoplasm of colon": "ورم القولون الخبيث",
    "malignant neoplasm of rectum": "ورم المستقيم الخبيث",
    "malignant neoplasm of liver and intrahepatic bile ducts": "ورم الكبد والقنوات الصفراوية الخبيث",
    "malignant neoplasm of pancreas": "ورم البنكرياس الخبيث",
    "malignant neoplasm of larynx": "ورم الحنجرة الخبيث",
    "malignant neoplasm of bronchus and lung": "ورم الرئة والقصبة الهوائية الخبيث",
    "malignant neoplasm of breast": "ورم الثدي الخبيث",
    "malignant neoplasm of cervix uteri": "ورم عنق الرحم الخبيث",
    "malignant neoplasm of ovary": "ورم المبيض الخبيث",
    "malignant neoplasm of prostate": "ورم البروستاتا الخبيث",
    "malignant neoplasm of kidney": "ورم الكلية الخبيث",
    "malignant neoplasm of bladder": "ورم المثانة الخبيث",
    "malignant neoplasm of brain": "ورم الدماغ الخبيث",
    "malignant neoplasm of thyroid gland": "ورم الغدة الدرقية الخبيث",
    "hodgkin lymphoma": "لمفوما هودجكين",
    "non-hodgkin lymphoma": "لمفوما لا هودجكين",
    "leukaemia": "ابيضاض الدم (اللوكميا)",
    "benign neoplasm": "ورم حميد",

    // أمراض الدم (D50-D89)
    "iron deficiency anaemia": "فقر الدم بعوز الحديد",
    "vitamin b12 deficiency anaemia": "فقر الدم بنقص فيتامين ب12",
    "thalassaemia": "الثلاسيميا",
    "sickle-cell disorders": "فقر الدم المنجلي",
    "haemophilia": "الهيموفيليا",
    "purpura": "الفرفرية",
    "sarcoidosis": "الساركويد",

    // أمراض الغدد والسكري (E00-E90)
    "congenital iodine-deficiency syndrome": "متلازمة نقص اليود الخلقية",
    "hypothyroidism": "قصور الغدة الدرقية",
    "hyperthyroidism": "فرط نشاط الغدة الدرقية",
    "thyrotoxicosis": "التسمم الدرقي",
    "thyroiditis": "التهاب الغدة الدرقية",
    "type 1 diabetes mellitus": "داء السكري من النوع الأول",
    "type 2 diabetes mellitus": "داء السكري من النوع الثاني",
    "malnutrition-related diabetes mellitus": "داء السكري المرتبط بسوء التغذية",
    "nondiabetic hypoglycaemic coma": "غيبوبة نقص السكر غير السكري",
    "hypoparathyroidism": "قصور جارات الدرق",
    "hyperparathyroidism": "فرط جارات الدرق",
    "cushing syndrome": "متلازمة كوشينغ",
    "hyperaldosteronism": "فرط الألدوستيرونية",
    "obesity": "السمنة",
    "hyperlipidemia": "ارتفاع دهون الدم",
    "high cholesterol": "ارتفاع الكوليسترول",
    "volume depletion": "نقص حجم السوائل",
    "disorders of fluid, electrolyte and acid-base balance": "اضطرابات السوائل والشوارد والقلوية",

    // الأمراض النفسية والعصبية (F00-G99)
    "dementia": "الخرف",
    "delirium": "الهذيان",
    "schizophrenia": "الفصام",
    "bipolar affective disorder": "اضطراب ثنائي القطب",
    "depressive episode": "نوبة اكتئابية",
    "anxiety disorders": "اضطرابات القلق",
    "obsessive-compulsive disorder": "الوسواس القهري",
    "adjustment disorders": "اضطرابات التكيف",
    "eating disorders": "اضطرابات الأكل",
    "insomnia": "الأرق",
    "mental retardation": "التخلف العقلي",
    "hyperkinetic disorders": "اضطراب فرط الحركة",
    "meningitis": "التهاب السحايا",
    "encephalitis": "التهاب الدماغ",
    "huntington disease": "مرض هنتنغتون",
    "parkinson disease": "مرض باركنسون (الشلل الرعاش)",
    "alzheimer disease": "مرض الزهايمر",
    "multiple sclerosis": "التصلب المتعدد",
    "epilepsy": "الصرع",
    "migraine": "الشقيقة (الصداع النصفي)",
    "cerebral palsy": "الشلل الدماغي",
    "hemiplegia": "شلل نصفي",
    "paraplegia": "شلل سفلي",
    "hydrocephalus": "استسقاء الرأس",
    "myasthenia gravis": "الوهن العضلي الوبيل",
    "neuropathy": "اعتلال الأعصاب",

    // أمراض القلب والضغط (I00-I99)
    "rheumatic fever": "حمى روماتيزمية",
    "essential hypertension": "ارتفاع ضغط الدم الأساسي",
    "hypertensive heart disease": "مرض القلب الضغطي",
    "hypertension": "ارتفاع ضغط الدم",
    "hypotension": "انخفاض ضغط الدم",
    "angina pectoris": "الذبحة الصدرية",
    "acute myocardial infarction": "احتشاء عضلة القلب الحاد",
    "ischaemic heart disease": "مرض القلب الإقفاري",
    "pulmonary embolism": "الانصمام الرئوي",
    "pericarditis": "التهاب التامور",
    "endocarditis": "التهاب الشغاف",
    "myocarditis": "التهاب عضلة القلب",
    "cardiomyopathy": "اعتلال عضلة القلب",
    "atrial fibrillation": "الرجفان الأذيني",
    "cardiac arrest": "توقف القلب",
    "heart failure": "قصور القلب",
    "cerebral infarction": "احتشاء الدماغ (الجلطة)",
    "stroke": "سكتة دماغية",
    "atherosclerosis": "تصلب الشرايين",
    "aortic aneurysm": "أم الدم الأبهرية",
    "varicose veins": "الدوالي",

    // أمراض الجهاز التنفسي (J00-J99)
    "acute nasopharyngitis": "الزكام (التهاب الأنف والبلعوم)",
    "acute sinusitis": "التهاب الجيوب الأنفية الحاد",
    "acute pharyngitis": "التهاب البلعوم الحاد",
    "acute tonsillitis": "التهاب اللوزتين الحاد",
    "acute laryngitis": "التهاب الحنجرة الحاد",
    "influenza": "الإنفلونزا",
    "pneumonia": "الالتهاب الرئوي",
    "acute bronchitis": "التهاب الشعب الهوائية الحاد",
    "chronic bronchitis": "التهاب الشعب الهوائية المزمن",
    "allergic rhinitis": "التهاب الأنف التحسسي",
    "chronic sinusitis": "التهاب الجيوب الأنفية المزمن",
    "asthma": "الربو",
    "copd": "مرض الانسداد الرئوي المزمن",
    "bronchiectasis": "توسع الشعب الهوائية",
    "pulmonary oedema": "الوذمة الرئوية",
    "pleural effusion": "انصباب جنبي",
    "pneumothorax": "استرواح صدر",
    "respiratory failure": "فشل تنفسي",

    // أمراض الجهاز الهضمي (K00-K93)
    "dental caries": "تسوس الأسنان",
    "gingivitis": "التهاب اللثة",
    "oesophagitis": "التهاب المريء",
    "gastro-oesophageal reflux disease": "ارتجاع المريء",
    "gastric ulcer": "قرحة المعدة",
    "duodenal ulcer": "قرحة الاثني عشر",
    "peptic ulcer": "قرحة هضمية",
    "gastritis": "التهاب المعدة",
    "functional dyspepsia": "عسر هضم وظيفي",
    "acute appendicitis": "التهاب الزائدة الدودية الحاد",
    "inguinal hernia": "فتق إربي",
    "crohn disease": "مرض كرون",
    "ulcerative colitis": "التهاب القولون التقرحي",
    "irritable bowel syndrome": "متلازمة القولون العصبي",
    "intestinal obstruction": "انسداد معوي",
    "diverticular disease": "الرتج المعوي",
    "haemorrhoids": "البواسير",
    "anal fissure": "شرخ شرجي",
    "peritonitis": "التهاب الصفاق",
    "alcoholic liver disease": "مرض الكبد الكحولي",
    "hepatic failure": "فشل كبدي",
    "chronic hepatitis": "التهاب كبدي مزمن",
    "liver cirrhosis": "تليف الكبد",
    "fatty liver": "الكبد الدهني",
    "cholelithiasis": "حصوات المرارة",
    "cholecystitis": "التهاب المرارة",
    "acute pancreatitis": "التهاب البنكرياس الحاد",

    // أمراض الجلد (L00-L99)
    "impetigo": "الحصف",
    "cellulitis": "التهاب النسيج الخلوي",
    "pemphigus": "الفقاع",
    "atopic dermatitis": "التهاب الجلد التأتبي",
    "seborrhoeic dermatitis": "التهاب الجلد الدهني",
    "contact dermatitis": "التهاب الجلد التماسي",
    "psoriasis": "الصدفية",
    "lichen planus": "الحزاز المسطح",
    "urticaria": "شرى (حساسية الجلد)",
    "erythema multiforme": "حمامى عديدة الأشكال",
    "alopecia areata": "الثعلبة البقعية",
    "acne": "حب الشباب",
    "rosacea": "الوردية",
    "vitiligo": "البهق (البهاق)",
    "decubitus ulcer": "قرحة الفراش",

    // أمراض العظام والمفاصل (M00-M99)
    "rheumatoid arthritis": "التهاب المفاصل الروماتويدي",
    "gout": "داء النقرس",
    "osteoarthritis": "خشونة المفاصل (التهاب عظمي مفصلي)",
    "systemic lupus erythematosus": "الذئبة الحمراء الجهازية",
    "scoliosis": "الجنف (انحراف العمود الفقري)",
    "ankylosing spondylitis": "التهاب الفقار اللاصق",
    "spondylosis": "التهاب الفقار",
    "intervertebral disc disorders": "انزلاق غضروفي",
    "dorsalgia": "ألم بالظهر",
    "myositis": "التهاب العضلات",
    "synovitis": "التهاب الغشاء الزليلي",
    "tenosynovitis": "التهاب غمد الوتر",
    "frozen shoulder": "كتف متجمدة",
    "osteoporosis": "هشاشة العظام",
    "osteomyelitis": "التهاب العظم والنقي",

    // أمراض الكلى والمسالك (N00-N39)
    "nephrotic syndrome": "متلازمة نفروزية",
    "acute renal failure": "فشل كلوي حاد",
    "chronic kidney disease": "مرض الكلى المزمن",
    "kidney stones": "حصوات الكلى",
    "renal colic": "مغص كلوي",
    "cystitis": "التهاب المثانة",
    "urinary tract infection": "التهاب المسالك البولية",
    "uti": "التهاب المسالك البولية",

    // أمراض الذكورة (N40-N51)
    "hyperplasia of prostate": "تضخم البروستاتا الحميد",
    "prostatitis": "التهاب البروستاتا",
    "hydrocele": "قيلة مائية",
    "orchitis": "التهاب الخصية",
    "erectile dysfunction": "ضعف الانتصاب",

    // أمراض الأنوثة (N60-N98)
    "fibroadenoma of breast": "ورم ليفي غدي في الثدي",
    "endometriosis": "بطانة الرحم المهاجرة",
    "pelvic inflammatory disease": "التهاب الحوض",
    "polycystic ovary syndrome": "متلازمة تكيس المبايض",
    "dysmenorrhea": "عسر الطمث (ألم الدورة)",
    "menopausal disorders": "اضطرابات سن اليأس",
    "infertility": "العقم",

    // الحمل والولادة (O00-O99)
    "ectopic pregnancy": "حمل خارج الرحم",
    "spontaneous abortion": "إجهاض تلقائي",
    "pre-eclampsia": "تسمم الحمل",
    "eclampsia": "الارتعاش الحملي",
    "preterm labour": "ولادة مبكرة",
    "postpartum haemorrhage": "نزيف ما بعد الولادة",

    // أعراض عامة (R00-R99)
    "abnormalities of heart beat": "اضطراب نبضات القلب",
    "haemorrhage": "نزيف",
    "cough": "سعال (كحة)",
    "dyspnea": "ضيق التنفس",
    "chest pain": "ألم بالصدر",
    "abdominal pain": "ألم بالبطن",
    "nausea and vomiting": "غثيان وقيء",
    "heartburn": "حرقة المعدة",
    "dysphagia": "عسر البلع",
    "rash": "طفح جلدي",
    "fever": "حمى (ارتفاع الحرارة)",
    "headache": "صداع",
    "pain": "ألم",
    "fatigue": "إرهاق",
    "dizziness": "دوار",
    "syncope": "إغماء",
    "oedema": "وذمة (تورم)",
    "anemia": "فقر الدم (الأنيميا)",
  }
};

// ✅ الذاكرة المؤقتة (الكاش الذكي): يحفظ أي كلمة الـ API يترجمها عشان مستدعيش الـ API تاني
const translationCache: Record<string, string> = {};

// ✅ دالة الترجمة الآلية الذكية
export async function translateToArabic(text: string | null | undefined, category: keyof typeof dictionary): Promise<string> {
  if (!text) return "";
  
  const lowerText = text.toLowerCase().trim();
  
  // 1. بحث في القاموس المحلي (أسرع وأدق)
  const categoryDict = dictionary[category];
  if (categoryDict && categoryDict[lowerText]) {
    return categoryDict[lowerText];
  }

  // 2. بحث في الكاش الذكي (لو الـ API ترجمها قبل كده النهاردة)
  if (translationCache[lowerText]) {
    return translationCache[lowerText];
  }

  // 3. الترجمة الآلية عبر API
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(lowerText)}&langpair=en|ar`
    );
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText && !data.responseData.translatedText.includes("MYMEMORY WARNING")) {
      let translated = data.responseData.translatedText;
      
      // لو الـ API رجع نفس الكلمة بالإنجليزي يبقى مش حفظها في الكاش عشان متغلطش بعدين
      if (translated.toLowerCase().trim() !== lowerText) {
         translationCache[lowerText] = translated; // ✅ حفظ في الكاش عشان المرات الجاية
         return translated;
      }
    }
  } catch (error) {
    console.error("Translation API Error:", error);
  }

  // 4. لو الـ API فشل أو رجع الكلمة زي ما هي، نرجع النص الإنجليزي الأصلي
  return text; 
}
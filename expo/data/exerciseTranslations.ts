import { LanguageCode } from '@/constants/i18n';

export interface ExerciseTranslation {
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];
}

type ExerciseTranslations = Record<string, Partial<Record<LanguageCode, ExerciseTranslation>>>;

export const EXERCISE_TRANSLATIONS: ExerciseTranslations = {
  b01: {
    en: {
      name: 'Brisk Walk',
      description: 'Low-impact cardio that improves endurance and supports fat loss. Perfect to build consistency.',
      instructions: [
        'Start with 2 minutes of easy walking to warm up',
        'Walk tall: chest open, shoulders relaxed, eyes forward',
        'Swing arms naturally and keep a steady pace',
        'Breathe through the nose if possible; slow down if you can\'t talk',
        'Finish with 2 minutes easy pace + light calf/hip stretches',
      ],
      targetMuscles: ['Legs', 'Glutes', 'Core'],
    },
    fr: {
      name: 'Marche Rapide',
      description: 'Cardio à faible impact qui améliore l\'endurance et favorise la perte de graisse. Parfait pour créer une routine.',
      instructions: [
        'Commence par 2 minutes de marche facile pour l\'échauffement',
        'Marche droit : poitrine ouverte, épaules détendues, regard vers l\'avant',
        'Balance tes bras naturellement et garde un rythme régulier',
        'Respire par le nez si possible ; ralentis si tu ne peux pas parler',
        'Termine avec 2 minutes à rythme facile + légers étirements mollets/hanches',
      ],
      targetMuscles: ['Jambes', 'Fessiers', 'Tronc'],
    },
    zh: {
      name: '快步走',
      description: '低冲击有氧运动，提高耐力并支持减脂。非常适合建立一致性。',
      instructions: [
        '从2分钟轻松步行开始热身',
        '站直行走：挺胸，放松肩膀，眼睛向前看',
        '自然摆动手臂，保持稳定的步伐',
        '尽可能用鼻子呼吸；如果不能说话就放慢速度',
        '以2分钟轻松步伐结束 + 轻度小腿/臀部拉伸',
      ],
      targetMuscles: ['腿部', '臀肌', '核心'],
    },
    pt: {
      name: 'Caminhada Rápida',
      description: 'Cardio de baixo impacto que melhora a resistência e apoia a perda de gordura. Perfeito para construir consistência.',
      instructions: [
        'Comece com 2 minutos de caminhada fácil para aquecer',
        'Caminhe ereto: peito aberto, ombros relaxados, olhos para frente',
        'Balance os braços naturalmente e mantenha um ritmo constante',
        'Respire pelo nariz se possível; diminua o ritmo se não conseguir falar',
        'Termine com 2 minutos de ritmo fácil + alongamentos leves de panturrilha/quadril',
      ],
      targetMuscles: ['Pernas', 'Glúteos', 'Core'],
    },
    es: {
      name: 'Caminata Rápida',
      description: 'Cardio de bajo impacto que mejora la resistencia y favorece la pérdida de grasa. Perfecto para crear consistencia.',
      instructions: [
        'Comienza con 2 minutos de caminata fácil para calentar',
        'Camina erguido: pecho abierto, hombros relajados, ojos hacia adelante',
        'Balancea los brazos naturalmente y mantén un ritmo constante',
        'Respira por la nariz si es posible; disminuye el ritmo si no puedes hablar',
        'Termina con 2 minutos de ritmo fácil + estiramientos ligeros de pantorrilla/cadera',
      ],
      targetMuscles: ['Piernas', 'Glúteos', 'Core'],
    },
    ar: {
      name: 'مشي سريع',
      description: 'تمرين قلبي منخفض التأثير يحسن التحمل ويدعم فقدان الدهون. مثالي لبناء الاتساق.',
      instructions: [
        'ابدأ بدقيقتين من المشي السهل للإحماء',
        'امشِ منتصبًا: صدر مفتوح، أكتاف مسترخية، عيون للأمام',
        'حرك ذراعيك بشكل طبيعي واحتفظ بوتيرة ثابتة',
        'تنفس من الأنف إن أمكن؛ أبطئ إذا لم تتمكن من التحدث',
        'أنهِ بدقيقتين بوتيرة سهلة + تمديدات خفيفة للسمانة/الورك',
      ],
      targetMuscles: ['الساقين', 'الألوية', 'الجذع'],
    },
  },
  b02: {
    en: {
      name: 'Jumping Jacks (Low Impact)',
      description: 'Simple full-body warm-up to raise heart rate. Step side-to-side if jumping is uncomfortable.',
      instructions: [
        'Stand tall with feet together and arms at sides',
        'Jump feet out while raising arms overhead (or step out)',
        'Return to start position in a smooth rhythm',
        'Land softly and keep knees slightly bent',
        'Work 20–30 seconds, rest, repeat',
      ],
      targetMuscles: ['Full Body', 'Shoulders', 'Calves'],
    },
    fr: {
      name: 'Jumping Jacks (Faible Impact)',
      description: 'Échauffement simple pour tout le corps qui augmente le rythme cardiaque. Fais des pas latéraux si sauter est inconfortable.',
      instructions: [
        'Tiens-toi droit, pieds joints et bras le long du corps',
        'Saute en écartant les pieds et en levant les bras au-dessus de la tête (ou fais un pas)',
        'Reviens à la position de départ avec un rythme fluide',
        'Atterris doucement et garde les genoux légèrement pliés',
        'Travaille 20–30 secondes, repose-toi, répète',
      ],
      targetMuscles: ['Corps Entier', 'Épaules', 'Mollets'],
    },
    zh: {
      name: '开合跳（低冲击）',
      description: '简单的全身热身运动，提高心率。如果跳跃不舒服，可以左右踏步。',
      instructions: [
        '站直，双脚并拢，手臂放在身体两侧',
        '跳起时双脚分开，同时举起手臂过头顶（或踏步）',
        '以流畅的节奏回到起始位置',
        '轻柔着地，保持膝盖微屈',
        '工作20-30秒，休息，重复',
      ],
      targetMuscles: ['全身', '肩膀', '小腿'],
    },
    pt: {
      name: 'Polichinelos (Baixo Impacto)',
      description: 'Aquecimento simples de corpo inteiro para aumentar a frequência cardíaca. Dê passos laterais se pular for desconfortável.',
      instructions: [
        'Fique ereto com os pés juntos e braços ao lado',
        'Pule abrindo os pés enquanto levanta os braços acima da cabeça (ou dê um passo)',
        'Retorne à posição inicial com ritmo suave',
        'Aterrisse suavemente e mantenha os joelhos levemente flexionados',
        'Trabalhe 20–30 segundos, descanse, repita',
      ],
      targetMuscles: ['Corpo Inteiro', 'Ombros', 'Panturrilhas'],
    },
    es: {
      name: 'Saltos de Tijera (Bajo Impacto)',
      description: 'Calentamiento simple de cuerpo completo para aumentar la frecuencia cardíaca. Da pasos laterales si saltar es incómodo.',
      instructions: [
        'Párate erguido con los pies juntos y brazos a los lados',
        'Salta abriendo los pies mientras levantas los brazos por encima de la cabeza (o da un paso)',
        'Vuelve a la posición inicial con ritmo suave',
        'Aterriza suavemente y mantén las rodillas ligeramente flexionadas',
        'Trabaja 20–30 segundos, descansa, repite',
      ],
      targetMuscles: ['Cuerpo Completo', 'Hombros', 'Pantorrillas'],
    },
    ar: {
      name: 'القفز المفتوح (تأثير منخفض)',
      description: 'إحماء بسيط لكامل الجسم لرفع معدل ضربات القلب. اتخذ خطوات جانبية إذا كان القفز غير مريح.',
      instructions: [
        'قف منتصبًا مع القدمين معًا والذراعين على الجانبين',
        'اقفز مع فتح القدمين ورفع الذراعين فوق الرأس (أو اتخذ خطوة)',
        'عد إلى وضع البداية بإيقاع سلس',
        'اهبط بلطف واحتفظ بالركبتين مثنيتين قليلاً',
        'اعمل 20-30 ثانية، استرح، كرر',
      ],
      targetMuscles: ['الجسم الكامل', 'الأكتاف', 'السمانة'],
    },
  },
  n01: {
    fr: {
      name: 'Élévations latérales',
      description: 'Développe la largeur et la stabilité des épaules. Commence avec un poids léger ou sans poids.',
      instructions: [
        'Tiens-toi droit avec les bras le long du corps',
        'Lève les bras sur les côtés à hauteur des épaules, coudes légèrement fléchis',
        'Marque une pause brève en haut',
        'Descends lentement avec contrôle',
        'Fais 2–3 séries de 10–15 répétitions',
      ],
      targetMuscles: ['Épaules', 'Deltoïdes'],
    },
    ln: {
      name: 'Kobuta mapapu ya maboko',
      description: 'Kolonga maboko na nse ya mapapu. Kobanda na bokito moke to na limpe.',
      instructions: [
        'Tela malamu, maboko le long du corps',
        'Buta maboko na bozwi tii na mozindo ya mapapu',
        'Koma moke na nse ya koleka',
        'Zongisa malembe na nse',
        'Sala misato ya 10-15',
      ],
      targetMuscles: ['Mapapu', 'Deltoïde'],
    },
  },
  n02: {
    fr: {
      name: 'Rotations du cou',
      description: 'Libère les tensions du cou et améliore la mobilité. Bouge lentement sans forcer.',
      instructions: [
        'Assieds-toi ou tiens-toi droit, épaules détendue',
        'Laisse tomber doucement le menton vers la poitrine',
        'Roule l\'oreille vers l\'épaule lentement',
        'Continue en demi-cercle de l\'autre côté',
        'Évite de basculer la tête complètement en arrière',
      ],
      targetMuscles: ['Cou', 'Trapèze supérieur'],
    },
    ln: {
      name: 'Kobongola molongo',
      description: 'Kolongola ntitibela ya molongo mpe kolonga kobongola.',
      instructions: [
        'Fanda malamu, mapapu ya nse',
        'Bakisa mongongo malembe na ntolo',
        'Bongola litoyi tii na mapapu',
        'Kende na bozwi mosusu',
        'Kanisa ko-bongola molongo na sima',
      ],
      targetMuscles: ['Molongo', 'Mapapu ya likolo'],
    },
  },
  n03: {
    fr: {
      name: 'Cercles des chevilles',
      description: 'Améliore la mobilité des chevilles et prépare les articulations pour la course et les sauts.',
      instructions: [
        'Assieds-toi ou équilibre-toi sur un pied',
        'Lève l\'autre pied et trace de grands cercles avec les orteils',
        '10 cercles dans le sens des aiguilles, puis 10 dans l\'autre sens',
        'Change de pied',
        'Bouge lentement sur toute la plage de mouvement',
      ],
      targetMuscles: ['Chevilles', 'Mollets'],
    },
    ln: {
      name: 'Mbonge ya makolo',
      description: 'Kolonga kobongola makolo liboso ya mikima mpe milongoni.',
      instructions: [
        'Fanda to tela na lolenge moko',
        'Buta libata ya mosusu mpe sala milongoni mikele',
        '10 liboso, 10 na sima',
        'Salela libata mosusu',
        'Kende malembe na mpenza',
      ],
      targetMuscles: ['Makolo', 'Molongo ya sima'],
    },
  },
  n04: {
    fr: {
      name: 'Marche sur place',
      description: 'Échauffement cardio doux. Idéal pour les débutants et comme repos actif entre les séries.',
      instructions: [
        'Tiens-toi droit et engage légèrement le gainage',
        'Lève les genoux à hauteur des hanches en alternance',
        'Pompe les bras en coordination avec les jambes',
        'Maintiens un rythme régulier et détendu',
        'Continue 1–3 minutes',
      ],
      targetMuscles: ['Jambes', 'Tronc', 'Mollets'],
    },
    ln: {
      name: 'Kotambola na esika moko',
      description: 'Kobanda motema malembe. Malamu pona bamobakazami mpe entre misato.',
      instructions: [
        'Tela malamu mpe kangisa nzoto na kati',
        'Buta mamboto na nse ya loketo na nse',
        'Salela maboko na lolenge moko na makolo',
        'Keba ntango ya malamu',
        'Kende miniti 1-3',
      ],
      targetMuscles: ['Makolo', 'Kati ya nzoto', 'Molongo ya sima'],
    },
  },
  n05: {
    fr: {
      name: 'Élévations de jambes assis',
      description: 'Activation du tronc et des quadriceps en position assise. Idéal pour les débutants.',
      instructions: [
        'Assieds-toi droit au bord d\'une chaise',
        'Tends une jambe à hauteur des hanches',
        'Maintiens 2–3 secondes et descends lentement',
        'Alterne les jambes',
        'Fais 10–15 répétitions de chaque côté',
      ],
      targetMuscles: ['Quadriceps', 'Tronc', 'Fléchisseurs de hanche'],
    },
    ln: {
      name: 'Kobuta makolo na fando',
      description: 'Kobanda kati ya nzoto na makolo na fando. Malamu pona bamobakazami.',
      instructions: [
        'Fanda malamu na nse ya kiti',
        'Tola lolenge moko ya loketo tii na loketo ya nse',
        'Koma miniti mibale to misato mpe zongisa malembe',
        'Bongola makolo',
        'Sala 10-15 na bozwi nionso',
      ],
      targetMuscles: ['Makolo ya liboso', 'Kati ya nzoto'],
    },
  },
  n06: {
    fr: {
      name: 'Étirement pectoraux au mur',
      description: 'Ouvre la poitrine et l\'épaule avant. Idéal après les pompes et le travail de bureau.',
      instructions: [
        'Tiens-toi à longueur de bras d\'un mur',
        'Place un avant-bras à plat contre le mur à hauteur d\'épaule',
        'Tourne le corps doucement jusqu\'à ressentir l\'étirement dans la poitrine',
        'Maintiens 20–30 secondes en respirant',
        'Change de côté',
      ],
      targetMuscles: ['Pectoraux', 'Épaules'],
    },
    ln: {
      name: 'Lokola ya ntolo na libanga',
      description: 'Fungola ntolo mpe mapapu ya liboso. Malamu sima ya pompe.',
      instructions: [
        'Tela mbala moko na libanga',
        'Tia boko na libanga na mozindo ya mapapu',
        'Bongola nzoto malembe tii na lokola na ntolo',
        'Koma santu 20-30 mpe yema',
        'Bongola bozwi',
      ],
      targetMuscles: ['Ntolo', 'Mapapu'],
    },
  },
  n07: {
    fr: {
      name: 'Étirement triceps au-dessus de la tête',
      description: 'Relâche la tension des triceps et des épaules après les exercices de poussée.',
      instructions: [
        'Lève un bras au-dessus de la tête et plie le coude derrière la tête',
        'Utilise l\'autre main pour appuyer doucement sur le coude en arrière',
        'Garde le torse droit sans arquer le dos',
        'Maintiens 20–30 secondes',
        'Change de côté',
      ],
      targetMuscles: ['Triceps', 'Épaules'],
    },
    ln: {
      name: 'Lokola ya likolo ya molongo',
      description: 'Kolongola ntitibela ya boko ya sima mpe mapapu.',
      instructions: [
        'Buta boko moko likolo mpe pinda lokodo na sima ya motó',
        'Salela boko mosusu kobota malembe lokodo na sima',
        'Keba nzoto ya malamu',
        'Koma santu 20-30',
        'Bongola bozwi',
      ],
      targetMuscles: ['Boko ya sima', 'Mapapu'],
    },
  },
  n08: {
    fr: {
      name: 'Squat Sumo',
      description: 'Squat en position large ciblant davantage les adducteurs et les fessiers.',
      instructions: [
        'Tiens-toi les pieds écartés, orteils tournés à 45 degrés',
        'Garde la poitrine haute et les mains jointes à la poitrine',
        'Descends les hanches droit entre les jambes',
        'Garde les genoux alignés sur les orteils',
        'Pousse à travers les talons pour te redresser',
      ],
      targetMuscles: ['Adducteurs', 'Fessiers', 'Quadriceps'],
    },
    ln: {
      name: 'Squat ya Sumo',
      description: 'Squat ya bozwi monene, kobanda mikosi ya kati mpe fessiers.',
      instructions: [
        'Tela makolo molayi, mayaka na 45 degrés',
        'Keba ntolo mpe maboko na kati',
        'Zika loketo entre makolo',
        'Keba mamboto na lolenge ya mayaka',
        'Buta na makolo tii na tela',
      ],
      targetMuscles: ['Mikosi ya kati', 'Fessiers', 'Makolo ya liboso'],
    },
  },
  n09: {
    fr: {
      name: 'Dips sur chaise',
      description: 'Exercice de triceps au poids du corps sur une chaise. Développe la force de poussée en toute sécurité.',
      instructions: [
        'Assieds-toi au bord d\'une chaise solide, mains sur le bord',
        'Glisse les hanches hors du siège et descends en pliant les coudes',
        'Garde les coudes proches du corps',
        'Remonte jusqu\'à ce que les bras soient presque tendus',
        'Fais 2–3 séries de 8–12 répétitions',
      ],
      targetMuscles: ['Triceps', 'Épaules', 'Pectoraux'],
    },
    ln: {
      name: 'Dips ya kiti',
      description: 'Mosala ya boko ya sima na kiti. Kolonga kobuta malembe.',
      instructions: [
        'Fanda na nse ya kiti, maboko na nse',
        'Longola loketo na nse ya kiti mpe zika na kobanda lokodo',
        'Keba lokodo pene na nzoto',
        'Buta lisusu tii maboko ezali malamu',
        'Sala misato mibale to misato ya 8-12',
      ],
      targetMuscles: ['Boko ya sima', 'Mapapu', 'Ntolo'],
    },
  },
  n10: {
    fr: {
      name: 'Étirement genou-poitrine',
      description: 'Relâche la tension du bas du dos et ouvre les hanches. Idéal le matin ou le soir.',
      instructions: [
        'Allonge-toi sur le dos, jambes tendues',
        'Ramène un genou vers la poitrine avec les deux mains',
        'Garde l\'autre jambe à plat ou légèrement pliée',
        'Maintiens 20–30 secondes en respirant profondément',
        'Change de jambe',
      ],
      targetMuscles: ['Bas du dos', 'Fessiers', 'Hanches'],
    },
    ln: {
      name: 'Lokola ya libolo na ntolo',
      description: 'Kolongola ntitibela ya sima ya sima mpe fungola loketo.',
      instructions: [
        'Lala na sima, makolo ya mpambampamba',
        'Kende na libolo moko tii na ntolo na maboko mibale',
        'Keba libata mosusu na sima',
        'Koma santu 20-30 mpe yema',
        'Bongola makolo',
      ],
      targetMuscles: ['Sima ya sima', 'Fessiers', 'Loketo'],
    },
  },
  n11: {
    fr: {
      name: 'Fentes latérales',
      description: 'Travaille le plan frontal, ciblant les adducteurs et les fessiers avec un défi d\'équilibre.',
      instructions: [
        'Tiens-toi pieds joints, fais un grand pas sur le côté',
        'Plie le genou de la jambe avancée et pousse les hanches en arrière',
        'Garde l\'autre jambe droite',
        'Pousse à travers le talon pour revenir',
        'Alterne les côtés pour les répétitions',
      ],
      targetMuscles: ['Fessiers', 'Quadriceps', 'Adducteurs'],
    },
    ln: {
      name: 'Fentes ya bozwi',
      description: 'Kobanda mikosi ya kati mpe fessiers.',
      instructions: [
        'Tela makolo esika, kende monene na bozwi',
        'Pinda libolo ya libata mpe buta loketo na sima',
        'Keba libata mosusu ya mpambampamba',
        'Buta na libata tii na tela',
        'Bongola bozwi na mbala na mbala',
      ],
      targetMuscles: ['Fessiers', 'Makolo ya liboso', 'Mikosi ya kati'],
    },
  },
  n12: {
    fr: {
      name: 'Rotations russes',
      description: 'Cible les obliques avec un mouvement de rotation. Ajoute du poids ou lève les pieds pour progresser.',
      instructions: [
        'Assieds-toi genoux pliés, incline le buste à 45 degrés',
        'Engage le gainage et lève les pieds si possible',
        'Tourne le torse d\'un côté à l\'autre avec contrôle',
        'Touche les mains ou le poids au sol de chaque côté',
        'Évite d\'arrondir le bas du dos',
      ],
      targetMuscles: ['Obliques', 'Abdominaux', 'Tronc'],
    },
    ln: {
      name: 'Kobongola ya Rusia',
      description: 'Kobanda obliques na kobongola.',
      instructions: [
        'Fanda mamboto ya kobanda, pinda sima na 45 degrés',
        'Kangisa kati mpe buta makolo soki ozali koka',
        'Bongola sima na bozwi nionso',
        'Koma maboko na sima na bozwi nionso',
        'Keba sima ya sima ekobanda te',
      ],
      targetMuscles: ['Obliques', 'Libumu', 'Kati ya nzoto'],
    },
  },
  n13: {
    fr: {
      name: 'Sauts sur boîte',
      description: 'Développement de la puissance des jambes. Commence avec une surface basse et concentre-toi sur des réceptions douces.',
      instructions: [
        'Tiens-toi devant une boîte stable ou une marche basse',
        'Recule les hanches et balance les bras en arrière',
        'Saute sur la boîte en atterrissant doucement en position accroupie',
        'Tiens-toi droit sur la boîte',
        'Descends prudemment et répète',
      ],
      targetMuscles: ['Quadriceps', 'Fessiers', 'Mollets', 'Tronc'],
    },
    ln: {
      name: 'Kobuka na boîte',
      description: 'Kolonga makolo ya nguya. Kobanda na sima ya mike mpe kanda malembe.',
      instructions: [
        'Tela liboso ya boîte na ntango ya malamu',
        'Buta loketo na sima mpe salela maboko na sima',
        'Buka na boîte na sima ya mpenza',
        'Tela malamu na boîte',
        'Zika malembe mpe lisusu',
      ],
      targetMuscles: ['Makolo ya liboso', 'Fessiers', 'Molongo ya sima', 'Kati ya nzoto'],
    },
  },
  n14: {
    fr: {
      name: 'Cercles des hanches',
      description: 'Mobilise l\'articulation de la hanche dans toutes les directions. Idéal avant l\'entraînement.',
      instructions: [
        'Tiens-toi pieds à largeur d\'épaules, mains sur les hanches',
        'Trace de grands cercles avec les hanches',
        '10 cercles dans chaque direction',
        'Garde le haut du corps relativement immobile',
        'Bouge sur toute la plage de mouvement confortable',
      ],
      targetMuscles: ['Hanches', 'Bas du dos', 'Fessiers'],
    },
    ln: {
      name: 'Milongoni ya loketo',
      description: 'Kobongola loketo na bozwi nionso. Malamu liboso ya mateya.',
      instructions: [
        'Tela makolo na bozwi ya mapapu, maboko na loketo',
        'Sala milongoni minene na loketo',
        '10 na bozwi nionso',
        'Keba nzoto ya likolo na tela',
        'Kende na bozwi nionso ya mpenza',
      ],
      targetMuscles: ['Loketo', 'Sima ya sima', 'Fessiers'],
    },
  },
  n15: {
    fr: {
      name: 'Crunch inversé',
      description: 'Cible les abdominaux inférieurs avec contrôle spinal. Utilise les abdos, pas l\'élan.',
      instructions: [
        'Allonge-toi sur le dos, mains sous les hanches pour soutien',
        'Ramène les genoux vers la poitrine en enroulant le coccyx',
        'Marque une pause en haut avec une grande expiration',
        'Descends lentement sans laisser tomber les jambes',
        'Garde le bas du dos doucement appuyé contre le sol',
      ],
      targetMuscles: ['Abdominaux inférieurs', 'Tronc'],
    },
    ln: {
      name: 'Crunch ya sima',
      description: 'Kobanda libumu ya sima na lolenge ya malamu.',
      instructions: [
        'Lala na sima, maboko na sima ya loketo',
        'Kende na mamboto tii na ntolo na kobongola libota',
        'Koma moke na likolo na yema monene',
        'Zika malembe sans kolongola makolo',
        'Keba sima ya sima na sima',
      ],
      targetMuscles: ['Libumu ya sima', 'Kati ya nzoto'],
    },
  },
  n16: {
    fr: {
      name: 'Fentes sautées',
      description: 'Développe la puissance explosive de la jambe unique. Atterris avec les genoux mous pour protéger les articulations.',
      instructions: [
        'Commence en position de fente',
        'Saute et change les jambes en l\'air',
        'Atterris en fente sur le côté opposé',
        'Garde le torse droit tout au long',
        'Fais des séries courtes de 8–10 répétitions avec repos',
      ],
      targetMuscles: ['Quadriceps', 'Fessiers', 'Mollets', 'Tronc'],
    },
    ln: {
      name: 'Fentes na kobuka',
      description: 'Kolonga nguya ya libata moko.',
      instructions: [
        'Kobanda na position ya fente',
        'Buka mpe bongola makolo na luzumu',
        'Kanda na fente na bozwi mosusu',
        'Keba nzoto ya tela',
        'Sala misato ya mike ya 8-10',
      ],
      targetMuscles: ['Makolo ya liboso', 'Fessiers', 'Molongo ya sima', 'Kati ya nzoto'],
    },
  },
  n17: {
    fr: {
      name: 'Crunch oblique debout',
      description: 'Exercice de gainage qui améliore aussi la coordination et l\'équilibre — sans se mettre au sol.',
      instructions: [
        'Tiens-toi debout, mains derrière la tête',
        'Lève un genou et amène le coude opposé à sa rencontre',
        'Expire en croisant et contracte les obliques',
        'Reviens et alterne les côtés',
        'Garde les hanches stables et évite de te balancer',
      ],
      targetMuscles: ['Obliques', 'Tronc', 'Fléchisseurs de hanche'],
    },
    ln: {
      name: 'Crunch oblique na tela',
      description: 'Mosala ya kati ya nzoto mpe bilongo ya tela.',
      instructions: [
        'Tela, maboko na sima ya motó',
        'Buta libolo moko mpe kaba lokodo ya sima na ye',
        'Yema na kobongola mpe kangisa obliques',
        'Zongisa mpe bongola bozwi',
        'Keba loketo ya tela',
      ],
      targetMuscles: ['Obliques', 'Kati ya nzoto', 'Loketo ya liboso'],
    },
  },
  n18: {
    fr: {
      name: 'Pompes en diamant',
      description: 'Focalisation intense sur les triceps. La position des mains en diamant augmente la sollicitation des triceps et du pectoral intérieur.',
      instructions: [
        'Place les mains proches l\'une de l\'autre en formant un diamant',
        'Descends la poitrine vers les mains en gardant les coudes près du corps',
        'Remonte complètement',
        'Garde le gainage engagé tout au long',
        'Utilise les genoux si nécessaire pour maintenir une bonne forme',
      ],
      targetMuscles: ['Triceps', 'Pectoraux', 'Tronc'],
    },
    ln: {
      name: 'Pompes ya diamant',
      description: 'Kobanda boko ya sima makasi. Position ya maboko na diamant.',
      instructions: [
        'Tia maboko pene moko na moko na lolenge ya diamant',
        'Zika ntolo na maboko na lokodo pene na nzoto',
        'Buta malamu tii na likolo',
        'Keba kati na nzoto ya tela',
        'Salela mamboto soki esengeli',
      ],
      targetMuscles: ['Boko ya sima', 'Ntolo', 'Kati ya nzoto'],
    },
  },
  n19: {
    fr: {
      name: 'Marche du ver de terre',
      description: 'Exercice de mobilité complète qui échauffe les ischio-jambiers, les épaules et le tronc ensemble.',
      instructions: [
        'Tiens-toi droit et incline-toi en avant, jambes tendues',
        'Avance les mains jusqu\'en position de planche',
        'Maintiens brièvement et avance les pieds vers les mains',
        'Redresse-toi et répète',
        'Bouge lentement et garde les jambes aussi droites que possible',
      ],
      targetMuscles: ['Ischio-jambiers', 'Épaules', 'Tronc'],
    },
    ln: {
      name: 'Kotambola ya konzo',
      description: 'Mosala ya kobongola nzoto mobimba - mapapu, maboko mpe kati.',
      instructions: [
        'Tela malamu mpe pinda liboso, makolo ya mpamba',
        'Kotambola maboko liboso tii na position ya planche',
        'Koma moke mpe kotambola makolo na maboko',
        'Zongisa mpe lisusu',
        'Kende malembe na makolo ya mpambampamba',
      ],
      targetMuscles: ['Makolo ya sima', 'Mapapu', 'Kati ya nzoto'],
    },
  },
  n20: {
    fr: {
      name: 'Poussée des hanches surélevée',
      description: 'Activation plus forte des fessiers avec les épaules surélevées sur un banc ou le bord d\'un canapé.',
      instructions: [
        'Assieds-toi contre un banc, le haut du dos appuyé dessus',
        'Pousse à travers les talons et contracte les fessiers en haut',
        'Marque une pause de 1–2 secondes en haut',
        'Descends les hanches sans te reposer complètement sur le sol',
        'Ajoute du poids sur les hanches pour progresser',
      ],
      targetMuscles: ['Fessiers', 'Ischio-jambiers', 'Tronc'],
    },
    ln: {
      name: 'Kobuta loketo na likolo',
      description: 'Kobanda fessiers makasi na mapapu na likolo ya banc.',
      instructions: [
        'Fanda na nse ya banc, likolo ya sima na banc',
        'Buta na makolo mpe kangisa fessiers na likolo',
        'Koma santu mibale to misato na likolo',
        'Zika loketo na nse te koleka na sima',
        'Bakisa bokito na loketo pona kolonga',
      ],
      targetMuscles: ['Fessiers', 'Makolo ya sima', 'Kati ya nzoto'],
    },
  },
  n21: {
    fr: {
      name: 'Squat pistol (assisté)',
      description: 'Squat sur une jambe exigeant force, équilibre et mobilité des chevilles.',
      instructions: [
        'Tiens une surface stable pour t\'aider à l\'équilibre',
        'Tiens-toi sur une jambe, l\'autre tendue devant toi',
        'Descends lentement sur une jambe en maintenant le contrôle',
        'Va aussi bas que possible sans douleur',
        'Pousse à travers le talon pour te redresser puis change de côté',
      ],
      targetMuscles: ['Quadriceps', 'Fessiers', 'Tronc', 'Chevilles'],
    },
    ln: {
      name: 'Squat pistol (na lisalisi)',
      description: 'Squat na libata moko na nguya, bilongo mpe kobongola chevilles.',
      instructions: [
        'Kangama na suki ya malamu',
        'Tela na libata moko, mosusu liboso',
        'Zika malembe na libata moko na lolenge',
        'Kende na sima ya malamu',
        'Buta na libata mpe bongola bozwi',
      ],
      targetMuscles: ['Makolo ya liboso', 'Fessiers', 'Kati ya nzoto', 'Makolo'],
    },
  },
  n22: {
    fr: {
      name: 'Dragon Flag (replié)',
      description: 'Exercice de tension abdominale extrême. Ne tente que si tu as une base solide de force de tronc.',
      instructions: [
        'Allonge-toi sur un banc et agrippe fermement derrière la tête',
        'Lève les hanches et amène les genoux à la poitrine',
        'Pousse le corps vers le haut de sorte que seules les épaules touchent le banc',
        'Descends lentement en position repliée',
        'Ne laisse jamais les hanches s\'affaisser en dessous des épaules',
      ],
      targetMuscles: ['Abdominaux', 'Tronc', 'Bas du dos'],
    },
    ln: {
      name: 'Dragon Flag (na kobanda)',
      description: 'Mosala ya libumu makasi. Kosala soki nzoto na yo ya kati ezali makasi.',
      instructions: [
        'Lala na banc mpe kangama na sima ya motó',
        'Buta loketo mpe kende na mamboto na ntolo',
        'Buta nzoto likolo tii mapapu kaka etele banc',
        'Zika malembe na kobanda',
        'Kanisa loketo kokelela na sima ya mapapu',
      ],
      targetMuscles: ['Libumu', 'Kati ya nzoto', 'Sima ya sima'],
    },
  },
  n23: {
    fr: {
      name: 'Appui renversé au mur',
      description: 'Développe la force des épaules et du tronc pour la stabilité en position renversée.',
      instructions: [
        'Tourne le dos au mur en position de planche',
        'Avance les pieds sur le mur pendant que les mains se rapprochent',
        'Maintiens la position inversée en engageant fermement le tronc',
        'Commence par des maintiens de 5–10 secondes',
        'Descends en sécurité et repose-toi entre les tentatives',
      ],
      targetMuscles: ['Épaules', 'Tronc', 'Poignets', 'Dos'],
    },
    ln: {
      name: 'Kotela na maboko na libanga',
      description: 'Kolonga mapapu mpe kati pona bilongo ya likolo.',
      instructions: [
        'Kaba na libanga na position ya planche',
        'Kotambola makolo na libanga mpe maboko na libanga',
        'Koma na position na kangisa kati makasi',
        'Kobanda na santu 5-10',
        'Zika na lolenge ya malamu mpe pumela',
      ],
      targetMuscles: ['Mapapu', 'Kati ya nzoto', 'Maboko', 'Sima'],
    },
  },
  n24: {
    fr: {
      name: 'Maintien L-sit (chaise)',
      description: 'Développe une sérieuse compression du tronc et force des triceps. Commence avec les genoux pliés.',
      instructions: [
        'Assieds-toi entre deux chaises, mains sur les bords des sièges',
        'Appuie vers le bas et soulève les hanches de la chaise',
        'Tends les jambes vers l\'avant autant que possible',
        'Maintiens 5–20 secondes en respirant régulièrement',
        'Descends et repose-toi le même temps',
      ],
      targetMuscles: ['Tronc', 'Triceps', 'Fléchisseurs de hanche'],
    },
    ln: {
      name: 'L-sit na kiti',
      description: 'Kolonga kati ya nzoto mpe boko ya sima makasi.',
      instructions: [
        'Fanda entre kiti mibale, maboko na bozwi ya kiti',
        'Buta na sima mpe buta loketo likolo ya kiti',
        'Longola makolo liboso na mpenza',
        'Koma santu 5-20 mpe yema malamu',
        'Zika mpe pumela ntango moko',
      ],
      targetMuscles: ['Kati ya nzoto', 'Boko ya sima', 'Loketo ya liboso'],
    },
  },
  n25: {
    fr: {
      name: 'Crunchs en V',
      description: 'Exercice abdominal avancé ciblant simultanément les abdominaux supérieurs et inférieurs.',
      instructions: [
        'Allonge-toi sur le dos, bras au-dessus de la tête et jambes tendues',
        'Lève simultanément les jambes et le haut du corps l\'un vers l\'autre',
        'Atteins les mains vers les pieds au sommet',
        'Descends lentement avec contrôle complet',
        'Évite d\'arquer agressivement le bas du dos',
      ],
      targetMuscles: ['Abdominaux', 'Fléchisseurs de hanche', 'Tronc'],
    },
    ln: {
      name: 'Crunch ya V',
      description: 'Mosala ya libumu makasi ya liboso mpe ya sima na ntango moko.',
      instructions: [
        'Lala na sima, maboko likolo mpe makolo ya mpambampamba',
        'Buta makolo mpe sima ya likolo moko na mosusu na ntango moko',
        'Kaba maboko na makolo na likolo',
        'Zika malembe na lolenge',
        'Keba sima ya sima ekobanda te makasi',
      ],
      targetMuscles: ['Libumu', 'Loketo ya liboso', 'Kati ya nzoto'],
    },
  },
  n26: {
    fr: {
      name: 'Pompes pliométriques',
      description: 'Pompe explosive pour la puissance du haut du corps. Atterris doucement et réinitialise chaque répétition.',
      instructions: [
        'Commence en position de pompe standard',
        'Descends avec contrôle puis explose vers le haut',
        'Laisse les mains quitter brièvement le sol',
        'Atterris avec les coudes fléchis pour absorber l\'impact',
        'Arrête quand la forme ou la puissance diminue',
      ],
      targetMuscles: ['Pectoraux', 'Triceps', 'Épaules', 'Tronc'],
    },
    ln: {
      name: 'Pompes ya nguya',
      description: 'Pompe ya nguya pona likolo ya nzoto. Kanda malembe mpe salela na mbala nionso.',
      instructions: [
        'Kobanda na position ya pompe ya malamu',
        'Zika na lolenge mpe buka likolo',
        'Maboko kokelela suka ya sima moke',
        'Kanda na lokodo ya kobanda',
        'Tika soki lolenge to nguya ekeleli',
      ],
      targetMuscles: ['Ntolo', 'Boko ya sima', 'Mapapu', 'Kati ya nzoto'],
    },
  },
  n27: {
    fr: {
      name: 'Curl nordique (assisté)',
      description: 'Exercice excentrique puissant pour les ischio-jambiers — très exigeant.',
      instructions: [
        'Agenouille-toi avec les pieds bloqués sous un canapé',
        'Croise les bras sur la poitrine et penche-toi lentement en avant',
        'Descends le torse vers le sol en utilisant les ischio-jambiers pour résister',
        'Utilise les mains pour revenir à la position de départ',
        'Fais 3–5 répétitions et augmente progressivement',
      ],
      targetMuscles: ['Ischio-jambiers', 'Tronc', 'Fessiers'],
    },
    ln: {
      name: 'Curl ya Nord (na lisalisi)',
      description: 'Mosala ya makolo ya sima makasi pona kobatela mibeba.',
      instructions: [
        'Fanda na mamboto, makolo na sima ya canapé',
        'Kangisa maboko na ntolo mpe pinda liboso malembe',
        'Zika nzoto na sima na kosalela makolo ya sima',
        'Salela maboko kozongela na esika ya kobanda',
        'Sala misato ya 3-5 mpe bakisa malembe',
      ],
      targetMuscles: ['Makolo ya sima', 'Kati ya nzoto', 'Fessiers'],
    },
  },
  n28: {
    fr: {
      name: 'Lever turc',
      description: 'Mouvement complet de coordination et de force. Maîtrise chaque phase avant d\'ajouter du poids.',
      instructions: [
        'Allonge-toi sur le dos, un bras tendu vers le haut (sans poids d\'abord)',
        'Roule vers le coude puis la main puis le genou',
        'Redresse-toi complètement en gardant le bras vertical',
        'Inverse tous les mouvements pour revenir au sol',
        'Fais 2–3 répétitions de chaque côté lentement et avec attention',
      ],
      targetMuscles: ['Nzoto mobimba', 'Épaules', 'Tronc', 'Fessiers'],
    },
    ln: {
      name: 'Kobanda ya Turquie',
      description: 'Mosala ya nzoto mobimba na bilongo mpe nguya. Koba phase nionso liboso ya kobakisa bokito.',
      instructions: [
        'Lala na sima, boko moko likolo (sans bokito liboso)',
        'Bongola na lokodo mpe maboko mpe libola',
        'Tela malamu na keba boko na tela',
        'Zongisa biloko nionso tii na sima',
        'Sala mibale to misato na bozwi nionso malembe',
      ],
      targetMuscles: ['Nzoto nionso', 'Mapapu', 'Kati ya nzoto', 'Fessiers'],
    },
  },
};

export function getExerciseTranslation(
  exerciseId: string,
  language: LanguageCode
): ExerciseTranslation | null {
  return EXERCISE_TRANSLATIONS[exerciseId]?.[language] ?? null;
}

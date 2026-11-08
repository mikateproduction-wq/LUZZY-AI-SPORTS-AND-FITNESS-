export interface SportConfig {
  id: string;
  emoji: string;
  exerciseIds: string[];
}

export const SPORTS: SportConfig[] = [
  { id: 'football', emoji: '⚽', exerciseIds: ['b01', 'b03', 'b05', 'b06', 'b08', 'b10', 'b12', 'b14', 'b16', 'i01', 'i03', 'i05', 'i07', 'e01', 'e03'] },
  { id: 'basketball', emoji: '🏀', exerciseIds: ['b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i03', 'i05', 'i07', 'e01', 'e03', 'e05'] },
  { id: 'tennis', emoji: '🎾', exerciseIds: ['b01', 'b03', 'b05', 'b08', 'b10', 'b14', 'b16', 'i01', 'i05', 'e01', 'e03'] },
  { id: 'swimming', emoji: '🏊', exerciseIds: ['b05', 'b06', 'b08', 'b10', 'b12', 'b14', 'b16', 'i01', 'i03', 'i05', 'e01'] },
  { id: 'running', emoji: '🏃', exerciseIds: ['b01', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i03', 'i05', 'e01', 'e03'] },
  { id: 'boxing', emoji: '🥊', exerciseIds: ['b02', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i03', 'i05', 'i07', 'e01', 'e03', 'e05'] },
  { id: 'cycling', emoji: '🚴', exerciseIds: ['b01', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i03', 'e01'] },
  { id: 'volleyball', emoji: '🏐', exerciseIds: ['b02', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i05', 'e01'] },
  { id: 'rugby', emoji: '🏉', exerciseIds: ['b03', 'b05', 'b06', 'b08', 'b10', 'b12', 'b14', 'i01', 'i03', 'i05', 'i07', 'e01', 'e03', 'e05'] },
  { id: 'mma', emoji: '🥋', exerciseIds: ['b02', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i03', 'i05', 'i07', 'e01', 'e03', 'e05'] },
  { id: 'athletics', emoji: '🏅', exerciseIds: ['b01', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'b16', 'i01', 'i03', 'i05', 'e01', 'e03'] },
  { id: 'handball', emoji: '🤾', exerciseIds: ['b02', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i03', 'i05', 'e01'] },
  { id: 'gymnastics', emoji: '🤸', exerciseIds: ['b05', 'b06', 'b08', 'b10', 'b12', 'b14', 'b16', 'i01', 'i03', 'i05', 'e01', 'e03'] },
  { id: 'badminton', emoji: '🏸', exerciseIds: ['b01', 'b02', 'b03', 'b05', 'b08', 'b10', 'b14', 'i01', 'i05', 'e01'] },
  { id: 'cricket', emoji: '🏏', exerciseIds: ['b01', 'b03', 'b05', 'b08', 'b10', 'b14', 'i01', 'i05', 'e01'] },
  { id: 'baseball', emoji: '⚾', exerciseIds: ['b01', 'b03', 'b05', 'b08', 'b10', 'b14', 'i01', 'i05', 'e01'] },
  { id: 'hockey', emoji: '🏒', exerciseIds: ['b01', 'b03', 'b05', 'b06', 'b08', 'b10', 'b14', 'i01', 'i03', 'i05', 'e01'] },
  { id: 'golf', emoji: '⛳', exerciseIds: ['b01', 'b05', 'b08', 'b10', 'b12', 'b14', 'b16', 'i05'] },
  { id: 'tableTennis', emoji: '🏓', exerciseIds: ['b01', 'b02', 'b03', 'b05', 'b08', 'b10', 'b14', 'i01', 'i05'] },
  { id: 'surfing', emoji: '🏄', exerciseIds: ['b05', 'b06', 'b08', 'b10', 'b12', 'b14', 'b16', 'i01', 'i03', 'i05', 'e01'] },
];

export const SPORT_NAMES: Record<string, Record<string, string>> = {
  football: { fr: 'Football', en: 'Football/Soccer', es: 'Fútbol', pt: 'Futebol', zh: '足球', ar: 'كرة القدم', tr: 'Futbol', hi: 'फुटबॉल', ru: 'Футбол', sw: 'Mpira wa miguu', ln: 'Motópi', bn: 'ফুটবল', de: 'Fußball', vi: 'Bóng đá', ko: '축구', ja: 'サッカー' },
  basketball: { fr: 'Basketball', en: 'Basketball', es: 'Baloncesto', pt: 'Basquete', zh: '篮球', ar: 'كرة السلة', tr: 'Basketbol', hi: 'बास्केटबॉल', ru: 'Баскетбол', sw: 'Mpira wa vikapu', ln: 'Basket', bn: 'বাস্কেটবল', de: 'Basketball', vi: 'Bóng rổ', ko: '농구', ja: 'バスケットボール' },
  tennis: { fr: 'Tennis', en: 'Tennis', es: 'Tenis', pt: 'Ténis', zh: '网球', ar: 'التنس', tr: 'Tenis', hi: 'टेनिस', ru: 'Теннис', sw: 'Tenisi', ln: 'Tenisi', bn: 'টেনিস', de: 'Tennis', vi: 'Quần vợt', ko: '테니스', ja: 'テニス' },
  swimming: { fr: 'Natation', en: 'Swimming', es: 'Natación', pt: 'Natação', zh: '游泳', ar: 'السباحة', tr: 'Yüzme', hi: 'तैराकी', ru: 'Плавание', sw: 'Kuogelea', ln: 'Kobéta', bn: 'সাঁতার', de: 'Schwimmen', vi: 'Bơi lội', ko: '수영', ja: '水泳' },
  running: { fr: 'Course à pied', en: 'Running', es: 'Correr', pt: 'Corrida', zh: '跑步', ar: 'الجري', tr: 'Koşu', hi: 'दौड़', ru: 'Бег', sw: 'Kukimbia', ln: 'Kopóta', bn: 'দৌড়', de: 'Laufen', vi: 'Chạy bộ', ko: '달리기', ja: 'ランニング' },
  boxing: { fr: 'Boxe', en: 'Boxing', es: 'Boxeo', pt: 'Boxe', zh: '拳击', ar: 'الملاكمة', tr: 'Boks', hi: 'मुक्केबाज़ी', ru: 'Бокс', sw: 'Ndondi', ln: 'Boxe', bn: 'বক্সিং', de: 'Boxen', vi: 'Boxing', ko: '복싱', ja: 'ボクシング' },
  cycling: { fr: 'Cyclisme', en: 'Cycling', es: 'Ciclismo', pt: 'Ciclismo', zh: '自行车', ar: 'ركوب الدراجات', tr: 'Bisiklet', hi: 'साइकिलिंग', ru: 'Велоспорт', sw: 'Baiskeli', ln: 'Vélo', bn: 'সাইক্লিং', de: 'Radfahren', vi: 'Đạp xe', ko: '사이클링', ja: 'サイクリング' },
  volleyball: { fr: 'Volleyball', en: 'Volleyball', es: 'Voleibol', pt: 'Vôlei', zh: '排球', ar: 'كرة الطائرة', tr: 'Voleybol', hi: 'वॉलीबॉल', ru: 'Волейбол', sw: 'Mpira wa wavu', ln: 'Volley', bn: 'ভলিবল', de: 'Volleyball', vi: 'Bóng chuyền', ko: '배구', ja: 'バレーボール' },
  rugby: { fr: 'Rugby', en: 'Rugby', es: 'Rugby', pt: 'Rúgbi', zh: '橄榄球', ar: 'الرغبي', tr: 'Ragbi', hi: 'रग्बी', ru: 'Регби', sw: 'Ragbi', ln: 'Rugby', bn: 'রাগবি', de: 'Rugby', vi: 'Bóng bầu dục', ko: '럭비', ja: 'ラグビー' },
  mma: { fr: 'Arts martiaux mixtes', en: 'MMA', es: 'Artes marciales mixtas', pt: 'MMA', zh: '综合格斗', ar: 'فنون القتال المختلطة', tr: 'Karma dövüş', hi: 'एमएमए', ru: 'ММА', sw: 'MMA', ln: 'MMA', bn: 'এমএমএ', de: 'MMA', vi: 'MMA', ko: 'MMA', ja: '総合格闘技' },
  athletics: { fr: 'Athlétisme', en: 'Athletics', es: 'Atletismo', pt: 'Atletismo', zh: '田径', ar: 'ألعاب القوى', tr: 'Atletizm', hi: 'एथलेटिक्स', ru: 'Лёгкая атлетика', sw: 'Riadha', ln: 'Athlétisme', bn: 'অ্যাথলেটিক্স', de: 'Leichtathletik', vi: 'Điền kinh', ko: '육상', ja: '陸上競技' },
  handball: { fr: 'Handball', en: 'Handball', es: 'Balonmano', pt: 'Handebol', zh: '手球', ar: 'كرة اليد', tr: 'Hentbol', hi: 'हैंडबॉल', ru: 'Гандбол', sw: 'Mpira wa mkono', ln: 'Handball', bn: 'হ্যান্ডবল', de: 'Handball', vi: 'Bóng ném', ko: '핸드볼', ja: 'ハンドボール' },
  gymnastics: { fr: 'Gymnastique', en: 'Gymnastics', es: 'Gimnasia', pt: 'Ginástica', zh: '体操', ar: 'الجمباز', tr: 'Jimnastik', hi: 'जिमनास्टिक', ru: 'Гимнастика', sw: 'Mazoezi', ln: 'Gymnastique', bn: 'জিমন্যাস্টিকস', de: 'Turnen', vi: 'Thể dục dụng cụ', ko: '체조', ja: '体操' },
  badminton: { fr: 'Badminton', en: 'Badminton', es: 'Bádminton', pt: 'Badminton', zh: '羽毛球', ar: 'الريشة الطائرة', tr: 'Badminton', hi: 'बैडमिंटन', ru: 'Бадминтон', sw: 'Badminton', ln: 'Badminton', bn: 'ব্যাডমিন্টন', de: 'Badminton', vi: 'Cầu lông', ko: '배드민턴', ja: 'バドミントン' },
  cricket: { fr: 'Cricket', en: 'Cricket', es: 'Críquet', pt: 'Críquete', zh: '板球', ar: 'الكريكيت', tr: 'Kriket', hi: 'क्रिकेट', ru: 'Крикет', sw: 'Kriketi', ln: 'Cricket', bn: 'ক্রিকেট', de: 'Cricket', vi: 'Cricket', ko: '크리켓', ja: 'クリケット' },
  baseball: { fr: 'Baseball', en: 'Baseball', es: 'Béisbol', pt: 'Beisebol', zh: '棒球', ar: 'البيسبول', tr: 'Beyzbol', hi: 'बेसबॉल', ru: 'Бейсбол', sw: 'Besiboli', ln: 'Baseball', bn: 'বেসবল', de: 'Baseball', vi: 'Bóng chày', ko: '야구', ja: '野球' },
  hockey: { fr: 'Hockey', en: 'Hockey', es: 'Hockey', pt: 'Hóquei', zh: '曲棍球', ar: 'الهوكي', tr: 'Hokey', hi: 'हॉकी', ru: 'Хоккей', sw: 'Hoki', ln: 'Hockey', bn: 'হকি', de: 'Hockey', vi: 'Khúc côn cầu', ko: '하키', ja: 'ホッケー' },
  golf: { fr: 'Golf', en: 'Golf', es: 'Golf', pt: 'Golfe', zh: '高尔夫', ar: 'الغولف', tr: 'Golf', hi: 'गोल्फ', ru: 'Гольф', sw: 'Gofu', ln: 'Golf', bn: 'গলফ', de: 'Golf', vi: 'Golf', ko: '골프', ja: 'ゴルフ' },
  tableTennis: { fr: 'Tennis de table', en: 'Table Tennis', es: 'Tenis de mesa', pt: 'Ténis de mesa', zh: '乒乓球', ar: 'تنس الطاولة', tr: 'Masa tenisi', hi: 'टेबल टेनिस', ru: 'Настольный теннис', sw: 'Tenisi ya meza', ln: 'Tennis ya mesa', bn: 'টেবিল টেনিস', de: 'Tischtennis', vi: 'Bóng bàn', ko: '탁구', ja: '卓球' },
  surfing: { fr: 'Surf', en: 'Surfing', es: 'Surf', pt: 'Surf', zh: '冲浪', ar: 'ركوب الأمواج', tr: 'Sörf', hi: 'सर्फिंग', ru: 'Сёрфинг', sw: 'Kutembea mawimbi', ln: 'Surf', bn: 'সার্ফিং', de: 'Surfen', vi: 'Lướt sóng', ko: '서핑', ja: 'サーフィン' },
};

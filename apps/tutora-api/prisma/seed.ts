import {
  ApplicationStatus,
  CertificateStatus,
  EducationLevel,
  LessonFormat,
  PlanTier,
  PricingPeriod,
  Prisma,
  PrismaClient,
  ReviewStatus,
  UserRole,
  VerificationStatus,
  Weekday,
} from '@prisma/client';

const prisma = new PrismaClient();

type SeedDistrict = { name: string; slug: string };
/** A district name with no explicit slug derives one via `.toLowerCase()`, matching the original Baku list. */
function district(name: string, slug = name.toLowerCase()): SeedDistrict {
  return { name, slug };
}

const CITIES: Array<{ name: string; slug: string; districts: SeedDistrict[] }> = [
  {
    name: 'Baku',
    slug: 'baku',
    districts: ['Nasimi', 'Yasamal', 'Sabail', 'Narimanov', 'Binagadi', 'Xatai', 'Nizami'].map(
      (n) => district(n),
    ),
  },
  {
    name: 'Ganja',
    slug: 'ganja',
    districts: [district('Kepez'), district('Nizami', 'ganja-nizami')],
  },
  {
    name: 'Sumgayit',
    slug: 'sumgayit',
    districts: [district('Sumgayit Merkezi', 'sumgayit-merkezi')],
  },
  {
    name: 'Mingachevir',
    slug: 'mingachevir',
    districts: [district('Mingachevir Merkezi', 'mingachevir-merkezi')],
  },
  { name: 'Sheki', slug: 'sheki', districts: [district('Sheki Merkezi', 'sheki-merkezi')] },
  {
    name: 'Lankaran',
    slug: 'lankaran',
    districts: [district('Lankaran Merkezi', 'lankaran-merkezi')],
  },
];
const LANGUAGES: Array<[name: string, code: string]> = [
  ['Azerbaijani', 'az'],
  ['English', 'en'],
  ['Russian', 'ru'],
  ['Turkish', 'tr'],
];
const CATEGORIES: Array<{ name: string; slug: string; subjects: Array<[string, string]> }> = [
  {
    name: 'Sciences',
    slug: 'sciences',
    subjects: [
      ['Mathematics', 'mathematics'],
      ['Physics', 'physics'],
      ['Chemistry', 'chemistry'],
      ['Biology', 'biology'],
      ['Computer Science', 'computer-science'],
    ],
  },
  {
    name: 'Languages',
    slug: 'languages',
    subjects: [
      ['English', 'english'],
      ['Russian Language', 'russian-language'],
      ['Azerbaijani Language', 'azerbaijani-language'],
      ['Turkish Language', 'turkish-language'],
    ],
  },
  {
    name: 'Humanities',
    slug: 'humanities',
    subjects: [
      ['History', 'history'],
      ['Literature', 'literature'],
      ['Geography', 'geography'],
    ],
  },
  {
    name: 'Exam Preparation',
    slug: 'exam-preparation',
    subjects: [
      ['IELTS Preparation', 'ielts-preparation'],
      ['SAT Preparation', 'sat-preparation'],
    ],
  },
];
const PLANS: Array<{ tier: PlanTier; name: string; priceMonthly: number }> = [
  { tier: PlanTier.FREE, name: 'Free', priceMonthly: 0 },
  { tier: PlanTier.PRO, name: 'Pro', priceMonthly: 19.99 },
];

// Baseline platform configuration (#70) so the admin Settings section is
// populated on a fresh install. Each is a starting point admins can tune.
const FEATURE_FLAGS: Array<{
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
}> = [
  {
    key: 'tutor_instant_booking',
    description: 'Let students book a lesson slot without a tutor confirmation step.',
    enabled: false,
    rolloutPercentage: 0,
  },
  {
    key: 'in_app_payments',
    description: 'Master switch for in-app subscription checkout.',
    enabled: true,
    rolloutPercentage: 100,
  },
  {
    key: 'ai_tutor_matching',
    description: 'Rank search results with the experimental matching model.',
    enabled: true,
    rolloutPercentage: 25,
  },
];

const SYSTEM_SETTINGS: Array<{ key: string; value: Prisma.InputJsonValue; description: string }> = [
  {
    key: 'support_email',
    value: 'support@tutora.app',
    description: 'Address shown to users for help and disputes.',
  },
  {
    key: 'max_active_applications_default',
    value: 3,
    description: 'Fallback cap on a student’s concurrent applications when no plan applies.',
  },
  {
    key: 'maintenance_mode',
    value: { enabled: false, message: '' },
    description: 'Toggle a read-only maintenance banner across the apps.',
  },
];

// Demo marketplace data so a fresh install has something to browse: tutors
// spread across districts/subjects/languages, students applying to them, and
// the reviews/favorites/chats that follow. Emails use the example.com
// convention already used by the test fixtures.
const TUTORS: Array<{
  name: string;
  email: string;
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  formats: LessonFormat[];
  verificationStatus: VerificationStatus;
  isPublished: boolean;
  districtSlug: string;
  languageCodes: string[];
  subjectSlugs: string[];
}> = [
  {
    name: 'Aysel Məmmədova',
    email: 'aysel.mammadova@example.com',
    bio: 'Riyaziyyat və fizika üzrə 8 illik təcrübəyə malik müəllim, buraxılış imtahanlarına hazırlıq üzrə ixtisaslaşıb.',
    experienceYears: 8,
    hourlyRate: 25,
    formats: [LessonFormat.ONLINE, LessonFormat.AT_STUDENT_HOME],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'nasimi',
    languageCodes: ['az', 'en'],
    subjectSlugs: ['mathematics', 'physics'],
  },
  {
    name: 'Elvin Hüseynov',
    email: 'elvin.huseynov@example.com',
    bio: 'Proqramlaşdırma və riyaziyyatı praktiki layihələr üzərindən öyrədən mühəndis-müəllim.',
    experienceYears: 5,
    hourlyRate: 30,
    formats: [LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'yasamal',
    languageCodes: ['az', 'en'],
    subjectSlugs: ['computer-science', 'mathematics'],
  },
  {
    name: 'Nərmin Əliyeva',
    email: 'nermin.aliyeva@example.com',
    bio: 'CELTA sertifikatlı ingilis dili müəllimi, IELTS hazırlığında 200-dən çox tələbəni müşayiət edib.',
    experienceYears: 10,
    hourlyRate: 35,
    formats: [LessonFormat.ONLINE, LessonFormat.AT_TUTOR_PLACE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'sabail',
    languageCodes: ['az', 'en'],
    subjectSlugs: ['english', 'ielts-preparation'],
  },
  {
    name: 'Tural Quliyev',
    email: 'tural.quliyev@example.com',
    bio: 'Kimya və biologiya fənlərini laborator nümunələrlə izah edən müəllim.',
    experienceYears: 6,
    hourlyRate: 22,
    formats: [LessonFormat.AT_STUDENT_HOME, LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'narimanov',
    languageCodes: ['az', 'ru'],
    subjectSlugs: ['chemistry', 'biology'],
  },
  {
    name: 'Günel Rzayeva',
    email: 'gunel.rzayeva@example.com',
    bio: 'Rus dili üzrə danışıq və qrammatikaya fokuslanan təcrübəli müəllim.',
    experienceYears: 7,
    hourlyRate: 20,
    formats: [LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'binagadi',
    languageCodes: ['az', 'ru'],
    subjectSlugs: ['russian-language'],
  },
  {
    name: 'Kamran İsmayılov',
    email: 'kamran.ismayilov@example.com',
    bio: 'Tarix və ədəbiyyat fənlərini müsahibə üsulu ilə maraqlı edən müəllim.',
    experienceYears: 3,
    hourlyRate: 18,
    formats: [LessonFormat.ONLINE, LessonFormat.AT_STUDENT_HOME],
    verificationStatus: VerificationStatus.PENDING,
    isPublished: false,
    districtSlug: 'nasimi',
    languageCodes: ['az'],
    subjectSlugs: ['history', 'literature'],
  },
  {
    name: 'Leyla Abbasova',
    email: 'leyla.abbasova@example.com',
    bio: 'Ana dili və ədəbiyyat üzrə orta məktəb şagirdlərinə dərs deyən müəllim.',
    experienceYears: 9,
    hourlyRate: 20,
    formats: [LessonFormat.AT_TUTOR_PLACE, LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'xatai',
    languageCodes: ['az', 'tr'],
    subjectSlugs: ['azerbaijani-language', 'literature'],
  },
  {
    name: 'Orxan Nəbiyev',
    email: 'orxan.nabiyev@example.com',
    bio: 'Fizika və riyaziyyatı olimpiada səviyyəsində tədris edən müəllim.',
    experienceYears: 12,
    hourlyRate: 40,
    formats: [LessonFormat.ONLINE, LessonFormat.AT_STUDENT_HOME],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'nizami',
    languageCodes: ['az', 'ru'],
    subjectSlugs: ['physics', 'mathematics'],
  },
  {
    name: 'Sevinc Cəfərova',
    email: 'sevinc.jafarova@example.com',
    bio: 'İngilis dili və IELTS hazırlığı üzrə fərdi proqramlar quran müəllim.',
    experienceYears: 4,
    hourlyRate: 28,
    formats: [LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'yasamal',
    languageCodes: ['az', 'en'],
    subjectSlugs: ['english', 'ielts-preparation'],
  },
  {
    name: 'Farid Məmmədli',
    email: 'farid.mammadli@example.com',
    bio: 'SAT hazırlığı və riyaziyyat üzrə yeni başlayan, lakin yüksək nəticələr göstərən müəllim.',
    experienceYears: 2,
    hourlyRate: 15,
    formats: [LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.UNVERIFIED,
    isPublished: false,
    districtSlug: 'sabail',
    languageCodes: ['az', 'en'],
    subjectSlugs: ['sat-preparation', 'mathematics'],
  },
  {
    name: 'Aytac Hacıyeva',
    email: 'aytac.hajiyeva@example.com',
    bio: 'Biologiya və kimya üzrə universitet qəbuluna hazırlaşan şagirdlərlə işləyən müəllim.',
    experienceYears: 6,
    hourlyRate: 24,
    formats: [LessonFormat.ONLINE, LessonFormat.AT_STUDENT_HOME],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'narimanov',
    languageCodes: ['az', 'en'],
    subjectSlugs: ['biology', 'chemistry'],
  },
  {
    name: 'Rəşad Vəliyev',
    email: 'rashad.valiyev@example.com',
    bio: 'Proqramlaşdırmaya yeni başlayanlar üçün addım-addım kurs quran mühəndis.',
    experienceYears: 3,
    hourlyRate: 26,
    formats: [LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.PENDING,
    isPublished: false,
    districtSlug: 'binagadi',
    languageCodes: ['az', 'en'],
    subjectSlugs: ['computer-science'],
  },
  {
    name: 'Nigar Süleymanova',
    email: 'nigar.suleymanova@example.com',
    bio: 'Coğrafiya və tarix fənlərini xəritə və vizual materiallarla izah edən müəllim.',
    experienceYears: 5,
    hourlyRate: 19,
    formats: [LessonFormat.AT_STUDENT_HOME, LessonFormat.ONLINE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'nasimi',
    languageCodes: ['az'],
    subjectSlugs: ['geography', 'history'],
  },
  {
    name: 'Emin Bağırov',
    email: 'emin.bagirov@example.com',
    bio: 'Türk dili və ingilis dili üzrə danışıq bacarıqlarına önəm verən müəllim.',
    experienceYears: 4,
    hourlyRate: 21,
    formats: [LessonFormat.ONLINE, LessonFormat.AT_TUTOR_PLACE],
    verificationStatus: VerificationStatus.VERIFIED,
    isPublished: true,
    districtSlug: 'xatai',
    languageCodes: ['az', 'tr', 'en'],
    subjectSlugs: ['turkish-language', 'english'],
  },
];

const CERTIFICATES: Array<{
  tutorEmail: string;
  title: string;
  fileUrl: string;
  status: CertificateStatus;
  reviewReason?: string;
}> = [
  {
    tutorEmail: 'aysel.mammadova@example.com',
    title: 'BSc in Mathematics — Baku State University',
    fileUrl: 'https://storage.tutora.app/seed/certificates/aysel-bsu-math.pdf',
    status: CertificateStatus.VERIFIED,
  },
  {
    tutorEmail: 'nermin.aliyeva@example.com',
    title: 'CELTA Certificate',
    fileUrl: 'https://storage.tutora.app/seed/certificates/nermin-celta.pdf',
    status: CertificateStatus.VERIFIED,
  },
  {
    tutorEmail: 'elvin.huseynov@example.com',
    title: 'AWS Certified Developer – Associate',
    fileUrl: 'https://storage.tutora.app/seed/certificates/elvin-aws.pdf',
    status: CertificateStatus.PENDING,
  },
  {
    tutorEmail: 'kamran.ismayilov@example.com',
    title: 'MA in History — ADU',
    fileUrl: 'https://storage.tutora.app/seed/certificates/kamran-adu-history.pdf',
    status: CertificateStatus.REJECTED,
    reviewReason: 'Sənəd oxunaqlı deyil, zəhmət olmasa daha keyfiyyətli skan yükləyin.',
  },
];

const STUDENTS: Array<{
  name: string;
  email: string;
  bio: string;
  educationLevel: EducationLevel;
}> = [
  {
    name: 'Ruslan Əhmədov',
    email: 'ruslan.ahmadov@example.com',
    bio: '9-cu sinif şagirdi, riyaziyyat və fizikada özünü inkişaf etdirmək istəyir.',
    educationLevel: EducationLevel.SCHOOL,
  },
  {
    name: 'Şəbnəm Quliyeva',
    email: 'shabnam.guliyeva@example.com',
    bio: 'IELTS imtahanına hazırlaşır, hədəfi 7.0 banddır.',
    educationLevel: EducationLevel.EXAM_PREP,
  },
  {
    name: 'Vüqar Talıbov',
    email: 'vugar.talibov@example.com',
    bio: 'Bakı Ali Texniki Məktəbdə informatika üzrə təhsil alır.',
    educationLevel: EducationLevel.UNIVERSITY,
  },
  {
    name: 'Aygün Məmmədova',
    email: 'aygun.mammadova@example.com',
    bio: '11-ci sinif şagirdi, kimya və fizika fənlərini gücləndirmək istəyir.',
    educationLevel: EducationLevel.SCHOOL,
  },
  {
    name: 'Elnur Abbasov',
    email: 'elnur.abbasov@example.com',
    bio: 'SAT imtahanına hazırlaşan abituriyent.',
    educationLevel: EducationLevel.EXAM_PREP,
  },
  {
    name: 'Nərgiz Hüseynova',
    email: 'nargiz.huseynova@example.com',
    bio: 'Universitetdə ingilis dilini ikinci ixtisas kimi öyrənir.',
    educationLevel: EducationLevel.UNIVERSITY,
  },
  {
    name: 'Kənan Rzayev',
    email: 'kanan.rzayev@example.com',
    bio: '8-ci sinif şagirdi, ana dili və ədəbiyyatda dəstək axtarır.',
    educationLevel: EducationLevel.SCHOOL,
  },
  {
    name: 'Ülviyyə Cəfərova',
    email: 'ulviyya.jafarova@example.com',
    bio: 'Yeni bir sahədə özünü sınamaq istəyən yetişkin tələbə.',
    educationLevel: EducationLevel.OTHER,
  },
  {
    name: 'Murad İsmayılov',
    email: 'murad.ismayilov@example.com',
    bio: 'İnformatika tələbəsi, proqramlaşdırma əsaslarını möhkəmləndirmək istəyir.',
    educationLevel: EducationLevel.UNIVERSITY,
  },
  {
    name: 'Zeynəb Əliyeva',
    email: 'zeyneb.aliyeva@example.com',
    bio: 'IELTS və biologiya üzrə paralel hazırlaşan abituriyent.',
    educationLevel: EducationLevel.EXAM_PREP,
  },
];

// One application per (student, tutor, subject) triple; `respondedAt` is set
// for anything past PENDING, mirroring what the applications service does.
const APPLICATIONS: Array<{
  studentEmail: string;
  tutorEmail: string;
  subjectSlug: string;
  format: LessonFormat;
  message: string;
  status: ApplicationStatus;
  review?: { rating: number; comment: string; status: ReviewStatus; hiddenReason?: string };
}> = [
  {
    studentEmail: 'ruslan.ahmadov@example.com',
    tutorEmail: 'aysel.mammadova@example.com',
    subjectSlug: 'mathematics',
    format: LessonFormat.AT_STUDENT_HOME,
    message: 'Buraxılış imtahanı üçün riyaziyyatdan dəstəyə ehtiyacım var.',
    status: ApplicationStatus.COMPLETED,
    review: {
      rating: 5,
      comment: 'Çox səbrli və izahatları aydın idi, imtahanı uğurla verdim!',
      status: ReviewStatus.PUBLISHED,
    },
  },
  {
    studentEmail: 'ruslan.ahmadov@example.com',
    tutorEmail: 'orxan.nabiyev@example.com',
    subjectSlug: 'physics',
    format: LessonFormat.ONLINE,
    message: 'Fizikadan mexanika bölməsini gücləndirmək istəyirəm.',
    status: ApplicationStatus.PENDING,
  },
  {
    studentEmail: 'shabnam.guliyeva@example.com',
    tutorEmail: 'nermin.aliyeva@example.com',
    subjectSlug: 'ielts-preparation',
    format: LessonFormat.ONLINE,
    message: 'IELTS Writing və Speaking bölmələrinə fokuslanmaq istəyirəm.',
    status: ApplicationStatus.COMPLETED,
    review: {
      rating: 4,
      comment: 'Speaking bölməsində çox inkişaf etdim, tövsiyə edirəm.',
      status: ReviewStatus.PUBLISHED,
    },
  },
  {
    studentEmail: 'vugar.talibov@example.com',
    tutorEmail: 'elvin.huseynov@example.com',
    subjectSlug: 'computer-science',
    format: LessonFormat.ONLINE,
    message: 'Alqoritmlər üzrə universitet layihəmə kömək lazımdır.',
    status: ApplicationStatus.ACCEPTED,
  },
  {
    studentEmail: 'aygun.mammadova@example.com',
    tutorEmail: 'tural.quliyev@example.com',
    subjectSlug: 'chemistry',
    format: LessonFormat.AT_STUDENT_HOME,
    message: 'Üzvi kimya mövzusunda çətinlik çəkirəm.',
    status: ApplicationStatus.COMPLETED,
    review: {
      rating: 5,
      comment: 'Laborator nümunələrlə izah etdi, çox anlaşıqlı oldu.',
      status: ReviewStatus.PUBLISHED,
    },
  },
  {
    studentEmail: 'elnur.abbasov@example.com',
    tutorEmail: 'farid.mammadli@example.com',
    subjectSlug: 'sat-preparation',
    format: LessonFormat.ONLINE,
    message: 'SAT Math bölməsi üçün hazırlıq planına ehtiyacım var.',
    status: ApplicationStatus.PENDING,
  },
  {
    studentEmail: 'nargiz.huseynova@example.com',
    tutorEmail: 'sevinc.jafarova@example.com',
    subjectSlug: 'english',
    format: LessonFormat.ONLINE,
    message: 'Danışıq bacarıqlarımı inkişaf etdirmək istəyirəm.',
    status: ApplicationStatus.COMPLETED,
    review: {
      rating: 3,
      comment: 'Yaxşı idi, amma tapşırıqlar bir az az idi.',
      status: ReviewStatus.PUBLISHED,
    },
  },
  {
    studentEmail: 'kanan.rzayev@example.com',
    tutorEmail: 'leyla.abbasova@example.com',
    subjectSlug: 'azerbaijani-language',
    format: LessonFormat.AT_TUTOR_PLACE,
    message: 'İnşa yazma bacarıqlarımı yaxşılaşdırmaq istəyirəm.',
    status: ApplicationStatus.DECLINED,
  },
  {
    studentEmail: 'ulviyya.jafarova@example.com',
    tutorEmail: 'nigar.suleymanova@example.com',
    subjectSlug: 'geography',
    format: LessonFormat.ONLINE,
    message: 'Regional coğrafiya üzrə əlavə dərslərə ehtiyacım var.',
    status: ApplicationStatus.ACCEPTED,
  },
  {
    studentEmail: 'murad.ismayilov@example.com',
    tutorEmail: 'rashad.valiyev@example.com',
    subjectSlug: 'computer-science',
    format: LessonFormat.ONLINE,
    message: 'Python əsasları üzrə köməyə ehtiyacım var.',
    status: ApplicationStatus.CANCELLED,
  },
  {
    studentEmail: 'zeyneb.aliyeva@example.com',
    tutorEmail: 'aytac.hajiyeva@example.com',
    subjectSlug: 'biology',
    format: LessonFormat.ONLINE,
    message: 'Universitet qəbulu üçün biologiyadan hazırlaşıram.',
    status: ApplicationStatus.COMPLETED,
    review: {
      rating: 5,
      comment: 'Əla müəllimdir, amma keçən dəfə bir az gecikmə oldu.',
      status: ReviewStatus.HIDDEN,
      hiddenReason: 'Şikayət araşdırılır — müəllimlə əlaqə saxlanılıb.',
    },
  },
  {
    studentEmail: 'ruslan.ahmadov@example.com',
    tutorEmail: 'emin.bagirov@example.com',
    subjectSlug: 'english',
    format: LessonFormat.ONLINE,
    message: 'İngilis dili danışıq klubuna qatılmaq istəyirəm.',
    status: ApplicationStatus.EXPIRED,
  },
  {
    studentEmail: 'shabnam.guliyeva@example.com',
    tutorEmail: 'kamran.ismayilov@example.com',
    subjectSlug: 'history',
    format: LessonFormat.ONLINE,
    message: 'Ümumi tarix fənnindən əlavə dərslərə ehtiyacım var.',
    status: ApplicationStatus.PENDING,
  },
  {
    studentEmail: 'vugar.talibov@example.com',
    tutorEmail: 'gunel.rzayeva@example.com',
    subjectSlug: 'russian-language',
    format: LessonFormat.ONLINE,
    message: 'İş yerində rus dilində sərbəst danışmaq istəyirəm.',
    status: ApplicationStatus.COMPLETED,
    review: {
      rating: 4,
      comment: 'Praktiki məşğələlər çox faydalı oldu.',
      status: ReviewStatus.PUBLISHED,
    },
  },
  {
    studentEmail: 'aygun.mammadova@example.com',
    tutorEmail: 'aysel.mammadova@example.com',
    subjectSlug: 'physics',
    format: LessonFormat.ONLINE,
    message: 'Fizikadan elektrik bölməsini öyrənmək istəyirəm.',
    status: ApplicationStatus.PENDING,
  },
  {
    studentEmail: 'elnur.abbasov@example.com',
    tutorEmail: 'orxan.nabiyev@example.com',
    subjectSlug: 'mathematics',
    format: LessonFormat.ONLINE,
    message: 'Riyaziyyatdan inteqral mövzusunu anlamaqda çətinlik çəkirəm.',
    status: ApplicationStatus.COMPLETED,
    review: {
      rating: 2,
      comment: 'Tempo mənim üçün çox sürətli idi.',
      status: ReviewStatus.PUBLISHED,
    },
  },
];

const FAVORITES: Array<{ studentEmail: string; tutorEmail: string }> = [
  { studentEmail: 'ruslan.ahmadov@example.com', tutorEmail: 'aysel.mammadova@example.com' },
  { studentEmail: 'ruslan.ahmadov@example.com', tutorEmail: 'emin.bagirov@example.com' },
  { studentEmail: 'shabnam.guliyeva@example.com', tutorEmail: 'nermin.aliyeva@example.com' },
  { studentEmail: 'shabnam.guliyeva@example.com', tutorEmail: 'kamran.ismayilov@example.com' },
  { studentEmail: 'vugar.talibov@example.com', tutorEmail: 'elvin.huseynov@example.com' },
  { studentEmail: 'vugar.talibov@example.com', tutorEmail: 'rashad.valiyev@example.com' },
  { studentEmail: 'aygun.mammadova@example.com', tutorEmail: 'tural.quliyev@example.com' },
  { studentEmail: 'nargiz.huseynova@example.com', tutorEmail: 'sevinc.jafarova@example.com' },
  { studentEmail: 'zeyneb.aliyeva@example.com', tutorEmail: 'aytac.hajiyeva@example.com' },
];

// Threads for pairs that already have an accepted/completed application, each
// with a short back-and-forth so the chat list/detail screens aren't empty.
const CHAT_THREADS: Array<{
  studentEmail: string;
  tutorEmail: string;
  messages: Array<{ from: 'student' | 'tutor'; body: string }>;
}> = [
  {
    studentEmail: 'ruslan.ahmadov@example.com',
    tutorEmail: 'aysel.mammadova@example.com',
    messages: [
      { from: 'student', body: 'Salam, dərsə nə vaxt başlaya bilərik?' },
      { from: 'tutor', body: 'Salam! Sabah saat 16:00 sizə uyğundurmu?' },
      { from: 'student', body: 'Bəli, uyğundur, təşəkkürlər!' },
      { from: 'tutor', body: 'Əla, onda sabah görüşürük.' },
    ],
  },
  {
    studentEmail: 'shabnam.guliyeva@example.com',
    tutorEmail: 'nermin.aliyeva@example.com',
    messages: [
      { from: 'student', body: 'Writing tapşırığını göndərdim, yoxlaya bilərsinizmi?' },
      { from: 'tutor', body: 'Baxdım, ümumilikdə yaxşıdır, bir neçə qeydim var.' },
      { from: 'student', body: 'Super, növbəti dərsdə müzakirə edərik.' },
    ],
  },
  {
    studentEmail: 'vugar.talibov@example.com',
    tutorEmail: 'elvin.huseynov@example.com',
    messages: [
      { from: 'student', body: 'Layihənin kodunu repoya yüklədim.' },
      { from: 'tutor', body: 'Gördüm, sabahkı dərsdə birlikdə debug edərik.' },
    ],
  },
  {
    studentEmail: 'aygun.mammadova@example.com',
    tutorEmail: 'tural.quliyev@example.com',
    messages: [
      { from: 'student', body: 'Sabahkı dərs üçün laboratoriya dəftərimi gətirimmi?' },
      { from: 'tutor', body: 'Bəli, gətirin, üzvi kimya nümunələrinə baxacağıq.' },
    ],
  },
  {
    studentEmail: 'ulviyya.jafarova@example.com',
    tutorEmail: 'nigar.suleymanova@example.com',
    messages: [
      { from: 'student', body: 'Xəritə tapşırığını haradan tapa bilərəm?' },
      { from: 'tutor', body: 'Sizə indi paylaşıram, dərsdən əvvəl nəzərdən keçirin.' },
    ],
  },
];

async function main(): Promise<void> {
  for (const city of CITIES) {
    const createdCity = await prisma.city.upsert({
      where: { slug: city.slug },
      update: {},
      create: { name: city.name, slug: city.slug },
    });
    for (const d of city.districts) {
      await prisma.district.upsert({
        where: { slug: d.slug },
        update: { cityId: createdCity.id },
        create: { name: d.name, slug: d.slug, cityId: createdCity.id },
      });
    }
  }

  for (const [name, code] of LANGUAGES) {
    await prisma.language.upsert({ where: { code }, update: {}, create: { name, code } });
  }

  for (const category of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { name: category.name, slug: category.slug },
    });
    for (const [subjectName, subjectSlug] of category.subjects) {
      await prisma.subject.upsert({
        where: { slug: subjectSlug },
        update: { categoryId: created.id },
        create: { name: subjectName, slug: subjectSlug, categoryId: created.id },
      });
    }
  }

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: { name: plan.name, priceMonthly: plan.priceMonthly },
      create: { tier: plan.tier, name: plan.name, priceMonthly: plan.priceMonthly },
    });
  }

  for (const flag of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  const subjectBySlug = new Map((await prisma.subject.findMany()).map((s) => [s.slug, s]));
  const districtBySlug = new Map((await prisma.district.findMany()).map((d) => [d.slug, d]));
  const languageByCode = new Map((await prisma.language.findMany()).map((l) => [l.code, l]));

  const tutorProfileByEmail = new Map<
    string,
    Awaited<ReturnType<typeof prisma.tutorProfile.upsert>>
  >();
  for (const [index, t] of TUTORS.entries()) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, role: UserRole.TUTOR },
      create: {
        email: t.email,
        name: t.name,
        role: UserRole.TUTOR,
        emailVerified: true,
        onboardingCompleted: true,
        googleId: `seed-tutor-${index}`,
      },
    });

    const tutorProfile = await prisma.tutorProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: t.bio,
        experienceYears: t.experienceYears,
        hourlyRateCache: t.hourlyRate,
        formats: t.formats,
        verificationStatus: t.verificationStatus,
        isPublished: t.isPublished,
      },
      create: {
        userId: user.id,
        bio: t.bio,
        experienceYears: t.experienceYears,
        hourlyRateCache: t.hourlyRate,
        formats: t.formats,
        verificationStatus: t.verificationStatus,
        isPublished: t.isPublished,
      },
    });
    tutorProfileByEmail.set(t.email, tutorProfile);

    // A nullable field inside a composite `@@unique` can't drive Prisma's
    // upsert-by-compound-key typing, so the base rate is replaced instead.
    await prisma.pricingTier.deleteMany({
      where: { tutorId: tutorProfile.id, tutorSubjectId: null, period: PricingPeriod.HOURLY },
    });
    await prisma.pricingTier.create({
      data: { tutorId: tutorProfile.id, period: PricingPeriod.HOURLY, amount: t.hourlyRate },
    });

    for (const subjectSlug of t.subjectSlugs) {
      const subject = subjectBySlug.get(subjectSlug);
      if (!subject) continue;
      await prisma.tutorSubject.upsert({
        where: { tutorId_subjectId: { tutorId: tutorProfile.id, subjectId: subject.id } },
        update: {},
        create: { tutorId: tutorProfile.id, subjectId: subject.id },
      });
    }

    const district = districtBySlug.get(t.districtSlug);
    if (district) {
      await prisma.tutorDistrict.upsert({
        where: { tutorId_districtId: { tutorId: tutorProfile.id, districtId: district.id } },
        update: {},
        create: { tutorId: tutorProfile.id, districtId: district.id },
      });
    }

    for (const code of t.languageCodes) {
      const language = languageByCode.get(code);
      if (!language) continue;
      await prisma.tutorLanguage.upsert({
        where: { tutorId_languageId: { tutorId: tutorProfile.id, languageId: language.id } },
        update: {},
        create: { tutorId: tutorProfile.id, languageId: language.id },
      });
    }

    const availabilityCount = await prisma.tutorAvailability.count({
      where: { tutorId: tutorProfile.id },
    });
    if (availabilityCount === 0) {
      const slots =
        index % 2 === 0
          ? [
              { weekday: Weekday.MON, startMinute: 960, endMinute: 1140 },
              { weekday: Weekday.SAT, startMinute: 600, endMinute: 780 },
            ]
          : [
              { weekday: Weekday.TUE, startMinute: 1020, endMinute: 1200 },
              { weekday: Weekday.SUN, startMinute: 660, endMinute: 840 },
            ];
      await prisma.tutorAvailability.createMany({
        data: slots.map((slot) => ({ tutorId: tutorProfile.id, ...slot })),
      });
    }
  }

  for (const cert of CERTIFICATES) {
    const tutorProfile = tutorProfileByEmail.get(cert.tutorEmail);
    if (!tutorProfile) continue;
    const existing = await prisma.certificate.findFirst({
      where: { tutorId: tutorProfile.id, title: cert.title },
    });
    if (existing) continue;
    await prisma.certificate.create({
      data: {
        tutorId: tutorProfile.id,
        title: cert.title,
        fileUrl: cert.fileUrl,
        status: cert.status,
        reviewReason: cert.reviewReason,
        reviewedAt: cert.status === CertificateStatus.PENDING ? null : new Date(),
      },
    });
  }

  const studentProfileByEmail = new Map<
    string,
    Awaited<ReturnType<typeof prisma.studentProfile.upsert>>
  >();
  for (const [index, s] of STUDENTS.entries()) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, role: UserRole.STUDENT },
      create: {
        email: s.email,
        name: s.name,
        role: UserRole.STUDENT,
        emailVerified: true,
        onboardingCompleted: true,
        googleId: `seed-student-${index}`,
      },
    });

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: { bio: s.bio, educationLevel: s.educationLevel },
      create: { userId: user.id, bio: s.bio, educationLevel: s.educationLevel },
    });
    studentProfileByEmail.set(s.email, studentProfile);
  }

  const touchedTutorIds = new Set<string>();
  for (const app of APPLICATIONS) {
    const student = studentProfileByEmail.get(app.studentEmail);
    const tutor = tutorProfileByEmail.get(app.tutorEmail);
    const subject = subjectBySlug.get(app.subjectSlug);
    if (!student || !tutor || !subject) continue;

    let application = await prisma.application.findFirst({
      where: { studentId: student.id, tutorId: tutor.id, subjectId: subject.id },
    });
    if (!application) {
      application = await prisma.application.create({
        data: {
          studentId: student.id,
          tutorId: tutor.id,
          subjectId: subject.id,
          format: app.format,
          message: app.message,
          status: app.status,
          respondedAt: app.status === ApplicationStatus.PENDING ? null : new Date(),
        },
      });
    }

    if (app.review) {
      await prisma.review.upsert({
        where: {
          studentId_applicationId: { studentId: student.id, applicationId: application.id },
        },
        update: {},
        create: {
          studentId: student.id,
          tutorId: tutor.id,
          applicationId: application.id,
          rating: app.review.rating,
          comment: app.review.comment,
          status: app.review.status,
          hiddenReason: app.review.hiddenReason,
        },
      });
      touchedTutorIds.add(tutor.id);
    }
  }

  // Recompute rating aggregates from PUBLISHED reviews, same as the app would
  // do at review time — the seed bypasses that service, so it does it here.
  for (const tutorId of touchedTutorIds) {
    const aggregate = await prisma.review.aggregate({
      where: { tutorId, status: ReviewStatus.PUBLISHED },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.tutorProfile.update({
      where: { id: tutorId },
      data: {
        ratingAvg: aggregate._avg.rating ?? 0,
        ratingCount: aggregate._count._all,
      },
    });
  }

  for (const fav of FAVORITES) {
    const student = studentProfileByEmail.get(fav.studentEmail);
    const tutor = tutorProfileByEmail.get(fav.tutorEmail);
    if (!student || !tutor) continue;
    await prisma.favorite.upsert({
      where: { studentId_tutorId: { studentId: student.id, tutorId: tutor.id } },
      update: {},
      create: { studentId: student.id, tutorId: tutor.id },
    });
  }

  for (const thread of CHAT_THREADS) {
    const student = studentProfileByEmail.get(thread.studentEmail);
    const tutor = tutorProfileByEmail.get(thread.tutorEmail);
    if (!student || !tutor) continue;

    const chatThread = await prisma.chatThread.upsert({
      where: { studentId_tutorId: { studentId: student.id, tutorId: tutor.id } },
      update: {},
      create: { studentId: student.id, tutorId: tutor.id },
    });

    const messageCount = await prisma.chatMessage.count({ where: { threadId: chatThread.id } });
    if (messageCount === 0) {
      let lastMessageAt: Date | null = null;
      for (const message of thread.messages) {
        const senderId = message.from === 'student' ? student.userId : tutor.userId;
        const created = await prisma.chatMessage.create({
          data: { threadId: chatThread.id, senderId, body: message.body },
        });
        lastMessageAt = created.createdAt;
      }
      await prisma.chatThread.update({ where: { id: chatThread.id }, data: { lastMessageAt } });
    }
  }

  console.log(
    'Seed complete: cities, districts, languages, categories, subjects, plans, feature flags, settings, ' +
      `${TUTORS.length} tutors, ${STUDENTS.length} students, applications, reviews, favorites, chats.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

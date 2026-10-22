const fa = {
  skip: 'رفتن به استودیو',
  private: 'اینجا بساز؛ همین‌جا نگه‌دار.',
  eyebrow: 'یک ایدهٔ کوچک؛ یک لوپ بی‌انتها.',
  headline: 'ریتم بعدی‌ات را پیدا کن.',
  intro: 'چند ضرب، کمی کنجکاوی؛ صدایی بساز که شبیه خودت باشد.',
  unsaved: 'جلسه ذخیره نشده',
  tempo: 'تمپو',
  swing: 'سوئینگ',
  audioIdle: 'صدا با اولین اجرا فعال می‌شود',
  export: 'خروجی WAV',
  sequencer: 'یک ریتم بساز',
  all: 'همهٔ صداها',
  drums: 'درام',
  melody: 'ملودی',
  samples: 'سمپل‌ها',
  stepTip: 'یک خانه را بزن؛ ریتم را شروع کن.',
  muteTip: 'نام ساز: قطع صدا · برای خانه‌های بیشتر اسکرول کن',
  pads: 'به سبک خودت بنواز',
  instruments: 'سازهای کوچک',
  piano: 'پیانو',
  guitar: 'گیتار',
  pianoMode: 'کلیدهای پیانو',
  keyTip: 'با فعال‌کردن کلیدهای پیانو، Z تا M نت می‌نوازند. Shift یک اکتاو بالاتر است.',
  sampleDeck: 'یک صدای مخصوص خودت',
  onDevice: 'روی دستگاه خودت',
  mic: 'ضبط میکروفن',
  importAudio: 'ورود صدا',
  sampleLimits: 'هر اسلات: تا ۲۰ مگابایت / ۳۰ ثانیه',
  sampleTip:
    'پیش از ضبط یا ورود صدا، اسلات را انتخاب کن. کلیدهای ۱ تا ۴ صدای اسلات‌ها را پخش می‌کنند.',
  soundRoom: 'صدایت شکوفا می‌شود',
  visualizerCopy: 'گاهی یک صدای کوچک، شروع یک اتفاق خوب است.',
  shaping: 'به صدایت شکل بده',
  scenes: 'حال‌وهوا را عوض کن',
  sunset: 'غبار غروب',
  club: 'کلوب کوچک',
  spaceScene: 'فضای دور',
  dry: 'صدای خالص',
  project: 'جلسهٔ تو',
  sessionName: 'نام جلسه',
  save: 'ذخیره اینجا',
  load: 'بازیابی ذخیره',
  projectFile: 'فایل پروژه',
  openFile: 'بازکردن فایل',
  tail: 'ادامهٔ صدا و افکت‌ها در WAV بماند',
  localNote: 'ذخیره در همین مرورگر است. برای نگه‌داشتن پروژه همراه صداها، فایل پروژه را دانلود کن.',
  eraseData: 'پاک‌کردن داده‌های محلی',
  littleTip: 'از یک الگو شروع کن، چند ضرب را تغییر بده و ببین ریتم تو را کجا می‌برد.',
  footer: 'فضایی کوچک برای ایده‌های بزرگ.',
  footerPrivacy: 'بدون حساب، بدون ردیابی؛ فقط تو و موسیقی.',
  helpTitle: 'اولین لوپ کوچک تو',
  help1: 'یک الگو انتخاب کن و پخش را بزن. با تغییر خانه‌ها آن را مال خودت کن.',
  help2: 'با پدها، پیانو یا گیتار بنواز. ضبط الگو، اجرا را به ریتم اضافه می‌کند.',
  help3: 'یک فایل صوتی وارد کن یا تا ۳۰ ثانیه در اسلات انتخاب‌شده ضبط کن.',
  help4: 'ذخیرهٔ محلی مخصوص همین مرورگر است؛ فایل پروژه همهٔ سمپل‌ها را هم در خود دارد.',
  helpKeys:
    'Space: پخش/مکث · ۱ تا ۴: سمپل‌ها · Ctrl/⌘ Z: بازگشت · Ctrl/⌘ S: ذخیره. برای نواختن با Z تا M، کلیدهای پیانو را فعال کن.',
  helpPrivacy:
    'میکروفن فقط با درخواست تو فعال می‌شود و با پایان ضبط قطع می‌شود. پاک‌کردن داده‌های محلی، پروژهٔ ذخیره‌شده و سمپل‌ها را حذف می‌کند. فایل پروژه شامل صداهای توست؛ هنگام اشتراک‌گذاری دقت کن.',
  filter: 'فیلتر',
  delay: 'تأخیر',
  space: 'فضا',
  master: 'صدای اصلی',
};
const en = {};
export let language = 'en';
export function tr(enText, faText) {
  return language === 'fa' ? faText : enText;
}
export function setLanguage(next) {
  language = next;
  document.documentElement.lang = next;
  document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const k = node.dataset.i18n;
    if (!en[k]) en[k] = node.textContent;
    node.textContent = next === 'fa' ? (fa[k] ?? en[k]) : en[k];
  });
}

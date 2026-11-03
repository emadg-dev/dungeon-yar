import React, { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Chip,
  Card,
  StatCard,
  ListRow,
  Input,
  Textarea,
  Select,
  NumberStepper,
  Switch,
  Checkbox,
  RadioGroup,
  TabStrip,
  BottomSheet,
  Dialog,
  Toast,
  Skeleton,
  EmptyState,
  ErrorState,
  ProgressBar,
  PipTracker,
  Avatar,
  SectionAccordion,
  Spinner,
  ScrollableRow,
} from '../ui';
import {
  Sun,
  Moon,
  Sparkles,
  Shield,
  Heart,
  Dice5,
  Search,
  Bell,
  Trash2,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

export const DevUiGallery: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ||
      (localStorage.getItem('zorvania_theme') as 'dark' | 'light') ||
      'dark';
  });
  const [activeTab, setActiveTab] = useState('buttons');
  const [stepperVal, setStepperVal] = useState(12);
  const [switchVal, setSwitchVal] = useState(true);
  const [checkVal, setCheckVal] = useState(true);
  const [radioVal, setRadioVal] = useState('2');
  const [pipsVal, setPipsVal] = useState(3);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Toggle theme
  const toggleTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('zorvania_theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ||
      (localStorage.getItem('zorvania_theme') as 'dark' | 'light') ||
      'dark';
    toggleTheme(current);
  }, []);

  const galleryTabs = [
    { id: 'buttons', label: 'دکمه‌ها' },
    { id: 'forms', label: 'فرم‌ها و ورودی‌ها' },
    { id: 'cards', label: 'کارت‌ها و آمار' },
    { id: 'chips', label: 'بج‌ها و چیپ‌ها' },
    { id: 'overlays', label: 'شیت و مدال' },
    { id: 'feedback', label: 'بازخورد و وضعیت‌ها' },
  ];

  return (
    <div className="min-h-screen bg-bg text-text-primary p-4 sm:p-8 space-y-8 transition-colors duration-200" dir="rtl">
      {/* Top Bar with Theme Switcher */}
      <header className="flex flex-wrap items-center justify-between gap-2 gap-4 border-b border-border pb-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent border border-accent/40 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-accent">گالری کامپوننت‌های پایه (UI Gallery)</h1>
            <p className="text-xs text-text-muted">محیط تست و اعتبارسنجی ظاهری و دسترسی‌پذیری</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#/"
            className="text-xs text-text-muted hover:text-text-primary ps-2 flex items-center gap-1"
          >
            <span>بازگشت به برنامه</span>
            <ChevronLeft className="w-4 h-4" />
          </a>

          <div className="flex items-center bg-surface-2 border border-border rounded-xl p-1 gap-1">
            <Button
              type="button"
              onClick={() => toggleTheme('dark')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                theme === 'dark' ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>تاریک</span>
            </Button>
            <Button
              type="button"
              onClick={() => toggleTheme('light')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                theme === 'light' ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>روشن</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto space-y-6">
        <TabStrip tabs={galleryTabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* 1. Buttons Showcase */}
        {activeTab === 'buttons' && (
          <section className="space-y-6">
            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">گونه‌های دکمه (Button Variants)</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">دکمه اصلی (Primary)</Button>
                <Button variant="secondary">دکمه ثانویه (Secondary)</Button>
                <Button variant="ghost">دکمه گست (Ghost)</Button>
                <Button variant="danger">دکمه هشدار (Danger)</Button>
                <Button variant="primary" disabled>
                  غیرفعال
                </Button>
                <Button variant="primary" isLoading loadingText="در حال ذخیره...">
                  لودینگ
                </Button>
              </div>
            </Card>

            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">اندازه‌های دکمه (Button Sizes)</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">
                  کوچک (sm - 40px)
                </Button>
                <Button size="md" variant="primary">
                  متوسط (md - 44px)
                </Button>
                <Button size="lg" variant="primary">
                  بزرگ (lg - 48px)
                </Button>
              </div>
            </Card>

            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">دکمه‌های آیکونی (IconButton ≥ 44px)</h2>
              <div className="flex flex-wrap items-center gap-3">
                <IconButton icon={<Heart className="w-5 h-5" />} aria-label="پسندیدن" variant="primary" />
                <IconButton icon={<Dice5 className="w-5 h-5" />} aria-label="پرتاب تاس" variant="secondary" />
                <IconButton icon={<Bell className="w-5 h-5" />} aria-label="اعلان‌ها" variant="ghost" />
                <IconButton icon={<Trash2 className="w-5 h-5" />} aria-label="حذف" variant="danger" />
                <IconButton icon={<Shield className="w-5 h-5" />} aria-label="حفاظ" shape="circle" variant="secondary" />
                <IconButton icon={<Search className="w-5 h-5" />} aria-label="جستجو" isLoading />
              </div>
            </Card>

            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">ردیف اسکرول‌پذیر دکمه‌ها و تب‌ها (ScrollableRow)</h2>
              <p className="text-xs text-text-muted">
                جلوگیری از شکستن خط متن در موبایل، عدم شکستن تب‌ها به دو ردیف، همراه با اسکرول افقی ملایم، فید لبه‌های راست/چپ RTL و تراز خودکار تب فعال:
              </p>
              <ScrollableRow activeKey="tab-3" className="gap-2">
                <Button variant="secondary" data-scroll-key="tab-1">برگه اصلی شخصیت</Button>
                <Button variant="secondary" data-scroll-key="tab-2">تجهیزات و کوله‌پشتی</Button>
                <Button variant="primary" data-scroll-key="tab-3">جادوها و اسلات‌ها</Button>
                <Button variant="secondary" data-scroll-key="tab-4">ویژگی‌های کلاسی و فیت‌ها</Button>
                <Button variant="secondary" data-scroll-key="tab-5">پیشینه داستانی و روابط</Button>
                <Button variant="secondary" data-scroll-key="tab-6">یادداشت‌های کمپین و کوئست‌ها</Button>
                <Button variant="secondary" data-scroll-key="tab-7">همراهان و احضارشدگان</Button>
              </ScrollableRow>
            </Card>
          </section>
        )}

        {/* 2. Form Controls Showcase */}
        {activeTab === 'forms' && (
          <section className="space-y-6">
            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">فیلدهای متنی و انتخابگرها</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="نام شخصیت" placeholder="مثلاً: آریامنش" />
                <Input
                  label="ایمیل (با آیکون)"
                  leftIcon={<Search className="w-4 h-4" />}
                  placeholder="name@domain.com"
                  dir="ltr"
                />
                <Input label="ورودی دارای خطا" error="وارد کردن این فیلد اجباری است." defaultValue="مقدار نامعتبر" />
                <Select
                  label="کلاس کاراکتر"
                  options={[
                    { value: 'azarin', label: 'موبد آذرین' },
                    { value: 'farhadar', label: 'فرهدار' },
                    { value: 'divanzad', label: 'دیوانزاد' },
                  ]}
                />
              </div>
              <Textarea label="شرح پیشینه داستانی" placeholder="توضیحات پیشینه شخصیت را بنویسید..." rows={3} />
            </Card>

            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">کنترل‌های عددی و وضعیت (Toggles)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <NumberStepper
                  label="امتیاز توانایی (تارگت لمسی 44px)"
                  value={stepperVal}
                  onChange={setStepperVal}
                  min={1}
                  max={30}
                />
                <div className="space-y-3 pt-2">
                  <Switch
                    label="اعلان‌های نبرد زنده"
                    description="ارسال پیام فوری هنگام آغاز نوبت مبارزه"
                    checked={switchVal}
                    onChange={setSwitchVal}
                  />
                  <Checkbox
                    label="پذیرش قوانین جهان زروانیا"
                    description="تعهد به حفظ لحن تاریک فانتزی و موازین بازی"
                    checked={checkVal}
                    onChange={setCheckVal}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="block text-xs font-semibold text-text-muted mb-2">انتخابگر رادیویی</span>
                <RadioGroup
                  value={radioVal}
                  onChange={setRadioVal}
                  options={[
                    { value: '1', label: 'استراحت کوتاه (Short Rest)', description: 'بازیابی منابع سبک و تاس‌های سلامت' },
                    { value: '2', label: 'استراحت طولانی (Long Rest)', description: 'بازیابی کامل سلامت و کلیه اسلات‌های جادو' },
                  ]}
                />
              </div>
            </Card>
          </section>
        )}

        {/* 3. Cards & Stats Showcase */}
        {activeTab === 'cards' && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="سلامت فعلی" value={38} subValue={45} icon={<Heart className="w-4 h-4 text-danger" />} />
              <StatCard label="کلاس زره (AC)" value={16} modifier={2} icon={<Shield className="w-4 h-4 text-accent" />} />
              <StatCard label="سرعت حرکت" value="30" subValue="فوت" />
              <StatCard label="ابتکار نبرد" value="+3" modifier="مدافع" />
            </div>

            <Card variant="surface" hasGoldTop>
              <h3 className="font-bold text-base text-text-primary mb-1">کارت ویژه با نوار بالایی طلا (card-gold-top)</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                این کارت دارای خط ظریف گرادینت کهربایی در لبه بالایی است که برای عناصر مهم مانند کاراکتر فعال، جلسه بعدی و ماموریت‌های افسانه‌ای کاربرد دارد.
              </p>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-accent mb-2">ردیف‌های لیستی (ListRow)</h3>
              <ListRow
                title="شمشیر آتشین موبدان"
                subtitle="سلاح افسانه‌ای — آسیب: 2d6+3 آذرین"
                badge={<Badge variant="accent">افسانه‌ای</Badge>}
                leading={<Avatar alt="شمشیر" name="ش" size="sm" shape="square" />}
                onClick={() => setToastMsg('آیتم شمشیر انتخاب شد')}
              />
              <ListRow
                title="شنل سایه‌خوان"
                subtitle="ابزار رازآلود — نیازمند پیوند روحی"
                badge={<Badge variant="neutral">کمیاب</Badge>}
                leading={<Avatar alt="شنل" name="ش" size="sm" shape="square" />}
                onClick={() => setToastMsg('آیتم شنل انتخاب شد')}
              />
            </div>
          </section>
        )}

        {/* 4. Badges & Chips Showcase */}
        {activeTab === 'chips' && (
          <section className="space-y-6">
            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">انواع نشان‌ها (Badges)</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">خنثی (Neutral)</Badge>
                <Badge variant="accent" dot>
                  کهربایی (Accent)
                </Badge>
                <Badge variant="success" dot>
                  موفقیت (Success)
                </Badge>
                <Badge variant="danger" dot>
                  خطر/اخگر (Danger)
                </Badge>
                <Badge variant="warning">هشدار (Warning)</Badge>
                <Badge variant="info">اطلاعات (Info)</Badge>
              </div>
            </Card>

            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">انواع چیپ‌ها (Chips)</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Chip label="همه اقلام" selected onClick={() => {}} badge={14} />
                <Chip label="سلاح‌ها" onClick={() => {}} badge={6} />
                <Chip label="زره و محافظ" onClick={() => {}} badge={3} />
                <Chip label="دست‌نوشته با قابلیت حذف" onRemove={() => setToastMsg('چیپ حذف شد')} />
                <Chip label="چیپ غیرفعال" disabled />
              </div>
            </Card>
          </section>
        )}

        {/* 5. Overlays (BottomSheet & Dialog) Showcase */}
        {activeTab === 'overlays' && (
          <section className="space-y-6">
            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">پنجره‌های رویه‌ای (Modals & Sheets)</h2>
              <p className="text-xs text-text-muted">
                پنجره‌های کشویی موبایل‌فرست با بسته‌شدن با درگ به پایین، کلید Escape، نوار امن زیرین و قفل اسکرول بدنه:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => setSheetOpen(true)}>
                  نمایش باتم‌شیت (BottomSheet)
                </Button>
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  نمایش دیالوگ تایید (Confirm Dialog)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setToastMsg('پیام آزمایشی توست با استاندارد aria-live!')}
                >
                  نمایش اعلان توست
                </Button>
              </div>
            </Card>

            <SectionAccordion
              title="بخش تاشو آکاردئونی (SectionAccordion)"
              subtitle="نمونه کامپوننت قابل جمع‌شدن برای لیست‌های فشرده موبایل"
              badge={<Badge variant="accent">3 آیتم</Badge>}
            >
              <p className="text-xs text-text-muted py-2 leading-relaxed">
                این کامپوننت به شکل کاملاً دسترسی‌پذیر با `aria-expanded` و انیمیشن آرام برای فشرده‌سازی اطلاعات طولانی در شیت کاراکتر و داشبورد مستر طراحی شده است.
              </p>
            </SectionAccordion>
          </section>
        )}

        {/* 6. Feedback & States Showcase */}
        {activeTab === 'feedback' && (
          <section className="space-y-6">
            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">نوارهای پیشرفت و ترکرها</h2>
              <div className="space-y-3">
                <ProgressBar label="نوار سلامت خودکار (Auto-HP)" value={65} max={100} color="auto-hp" showValueText />
                <ProgressBar label="نوار پیشرفت ماموریت" value={4} max={5} color="accent" showValueText />
              </div>
              <div className="pt-2">
                <PipTracker
                  label="اسلات‌های جادوی سطح 2 (کلیک برای فعال/غیرفعال)"
                  current={pipsVal}
                  max={4}
                  onChange={setPipsVal}
                />
              </div>
            </Card>

            <Card variant="surface" className="space-y-4">
              <h2 className="text-sm font-bold text-accent">اسکلت‌های بارگذاری (Skeleton & Spinner)</h2>
              <div className="flex items-center gap-3">
                <Spinner size="md" />
                <span className="text-xs text-text-muted">اسپینر لودینگ دسترسی‌پذیر</span>
              </div>
              <div className="space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="rectangular" height={40} />
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card variant="surface">
                <EmptyState
                  title="هیچ ماموریتی یافت نشد"
                  description="در حال حاضر هیچ ماموریت فعالی برای این کاراکتر ثبت نشده است."
                  actionLabel="ایجاد ماموریت تازه"
                  onAction={() => setToastMsg('کلیک روی ایجاد ماموریت')}
                />
              </Card>

              <Card variant="surface">
                <ErrorState
                  title="خطا در همگام‌سازی"
                  message="ارتباط با سرور برقرار نشد. داده‌ها در حافظه محلی ذخیره شدند."
                  onRetry={() => setToastMsg('درخواست تلاش مجدد')}
                />
              </Card>
            </div>
          </section>
        )}
      </main>

      {/* Interactive BottomSheet Demo */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="عنوان باتم‌شیت آزمایشی"
        description="این یک پنجره کشویی استاندارد است که از پایین باز می‌شود."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              بستن
            </Button>
            <Button variant="primary" onClick={() => setSheetOpen(false)}>
              تایید تغییرات
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-text-muted leading-relaxed">
          <p>
            پنجره‌های باتم‌شیت در موبایل به صورت خودکار لبه‌های امن پایین (Safe Area Insets) را لحاظ می‌کنند، بدنه را قفل می‌کنند و با لمس و کشیدن به سمت پایین یا کلید بازگشت مرورگر بسته می‌شوند.
          </p>
          <Input label="نام نمونه درون شیت" placeholder="متنی بنویسید..." />
        </div>
      </BottomSheet>

      {/* Interactive Dialog Demo */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="تایید حذف شخصیت"
        description="آیا از حذف این شخصیت اطمینان دارید؟ این عمل غیرقابل بازگشت است."
        confirmLabel="حذف قطعی"
        isDestructive
        onConfirm={() => {
          setDialogOpen(false);
          setToastMsg('شخصیت با موفقیت حذف گردید.');
        }}
      />

      {/* Toast Notification */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Compass,
  Wrench,
  Sparkles,
  Clock,
  Check,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { SupportedLang } from '../data/curriculum';
import { useI18n } from '../lib/i18n';
import { LANGUAGE_OPTIONS } from './FlagPickerModal';
import { LanguageFlagIcon, MadingoWordmark } from './BrandVisuals';
import {
  validateQuickEntryInput,
  safeParseApiJson,
  buildLocalQuickSession,
  saveQuickSessionToStorage,
} from '../lib/quickAuth';

interface OnboardingFlowProps {
  initialMode?: 'onboarding' | 'login';
  onBackToLanding: () => void;
  onAuthenticated: (token: string, dashboard: any) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialMode = 'onboarding',
  onBackToLanding,
  onAuthenticated,
}) => {
  const { lang, setLang, t } = useI18n();

  // Steps: 1=Lang, 2=Reason, 3=Goal, 4=Direct Name & Surname Entry
  const [step, setStep] = useState<number>(initialMode === 'login' ? 4 : 1);
  const isDirectLoginMode = initialMode === 'login';

  const [reason, setReason] = useState<'university' | 'travel' | 'work' | 'fun'>('university');
  const [goalMinutes, setGoalMinutes] = useState<5 | 10 | 20>(10);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateQuickEntryInput(firstName, lastName, lang);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }

    setIsSubmitting(true);

    // Prepare instant local session so static deployments (e.g. Netlify) or offline
    // environments never fail with <!DOCTYPE html> JSON errors.
    const localSession = buildLocalQuickSession({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      uiLang: lang,
      goalMinutes,
      learningReason: reason,
    });

    try {
      const res = await fetch('/api/auth/quick-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          uiLang: lang,
          goalMinutes,
          learningReason: reason,
        }),
      });

      const data = await safeParseApiJson<{
        token?: string;
        dashboard?: any;
        error?: string;
      }>(res);

      if (res.ok && data && data.token && data.dashboard) {
        saveQuickSessionToStorage({
          token: data.token,
          dashboard: data.dashboard,
        });
        onAuthenticated(data.token, data.dashboard);
        return;
      }

      // Fallback seamlessly to local session if running on static host (HTML response) or backend unavailable
      saveQuickSessionToStorage(localSession);
      onAuthenticated(localSession.token, localSession.dashboard);
    } catch {
      // Network error or offline: enter directly using local session
      saveQuickSessionToStorage(localSession);
      onAuthenticated(localSession.token, localSession.dashboard);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = [
    {
      id: 'university' as const,
      icon: GraduationCap,
      title: t('onboarding.reasonUniversity'),
      desc: t('onboarding.reasonUniversityDesc'),
    },
    {
      id: 'travel' as const,
      icon: Compass,
      title: t('onboarding.reasonTravel'),
      desc: t('onboarding.reasonTravelDesc'),
    },
    {
      id: 'work' as const,
      icon: Wrench,
      title: t('onboarding.reasonWork'),
      desc: t('onboarding.reasonWorkDesc'),
    },
    {
      id: 'fun' as const,
      icon: Sparkles,
      title: t('onboarding.reasonFun'),
      desc: t('onboarding.reasonFunDesc'),
    },
  ];

  const goals = [
    { minutes: 5 as const, title: t('onboarding.goal5'), desc: t('onboarding.goal5Desc') },
    { minutes: 10 as const, title: t('onboarding.goal10'), desc: t('onboarding.goal10Desc') },
    { minutes: 20 as const, title: t('onboarding.goal20'), desc: t('onboarding.goal20Desc') },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--surface-canvas)] text-[var(--text-primary)]"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => {
            if (step > 1 && !isDirectLoginMode) {
              setStep(step - 1);
            } else {
              onBackToLanding();
            }
          }}
          className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('common.back')}</span>
        </button>

        <div translate="no">
          <MadingoWordmark size="sm" />
        </div>

        {/* Step Indicator */}
        <div className="text-xs font-semibold text-slate-500 tabular-nums" translate="no">
          {step}/4
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg">
          {/* STEP 1: UI Language */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                  {t('onboarding.stepLanguageTitle')}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {t('onboarding.stepLanguageSub')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {LANGUAGE_OPTIONS.map((opt) => {
                  const selected = lang === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setLang(opt.code as SupportedLang)}
                      className={`min-h-[68px] p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition cursor-pointer ${
                        selected
                          ? 'border-brand-blue dark:border-accent-orange bg-blue-50/70 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-brand-blue/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <LanguageFlagIcon lang={opt.code} className="w-9 h-6" />
                        <div className="text-start">
                          <div className="font-display font-bold text-lg text-slate-900 dark:text-white">
                            {opt.nativeName}
                          </div>
                          <div className="text-xs text-slate-500">{opt.subLabel}</div>
                        </div>
                      </div>
                      {selected && (
                        <Check className="w-5 h-5 text-brand-blue dark:text-accent-orange" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full min-h-[52px] rounded-2xl bg-accent-orange text-brand-navy font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition cursor-pointer"
              >
                <span>{t('common.continue')}</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          )}

          {/* STEP 2: Learning Reason */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                  {t('onboarding.stepReasonTitle')}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {t('onboarding.stepReasonSub')}
                </p>
              </div>

              <div className="space-y-3">
                {reasons.map((r) => {
                  const Icon = r.icon;
                  const selected = reason === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReason(r.id)}
                      className={`w-full min-h-[68px] p-4 rounded-2xl border-2 flex items-center justify-between gap-4 text-start transition cursor-pointer ${
                        selected
                          ? 'border-brand-blue dark:border-accent-orange bg-blue-50/70 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-brand-blue/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/30 text-brand-blue dark:text-accent-orange flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                            {r.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {r.desc}
                          </div>
                        </div>
                      </div>
                      {selected && (
                        <Check className="w-5 h-5 text-brand-blue dark:text-accent-orange shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full min-h-[52px] rounded-2xl bg-accent-orange text-brand-navy font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition cursor-pointer"
              >
                <span>{t('common.continue')}</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          )}

          {/* STEP 3: Daily Goal */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                  {t('onboarding.stepGoalTitle')}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {t('onboarding.stepGoalSub')}
                </p>
              </div>

              <div className="space-y-3">
                {goals.map((g) => {
                  const selected = goalMinutes === g.minutes;
                  return (
                    <button
                      key={g.minutes}
                      type="button"
                      onClick={() => setGoalMinutes(g.minutes)}
                      className={`w-full min-h-[68px] p-4 rounded-2xl border-2 flex items-center justify-between gap-4 text-start transition cursor-pointer ${
                        selected
                          ? 'border-brand-blue dark:border-accent-orange bg-blue-50/70 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-brand-blue/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-accent-orange/15 text-accent-orange flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                            {g.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {g.desc}
                          </div>
                        </div>
                      </div>
                      {selected && (
                        <Check className="w-5 h-5 text-brand-blue dark:text-accent-orange shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full min-h-[52px] rounded-2xl bg-accent-orange text-brand-navy font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition cursor-pointer"
              >
                <span>{t('common.continue')}</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          )}

          {/* STEP 4: Direct Entry with First Name & Last Name Only */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/30 text-brand-blue dark:text-accent-orange flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                    {lang === 'ar'
                      ? 'الدخول إلى التطبيق'
                      : lang === 'ru'
                      ? 'Вход в приложение'
                      : lang === 'fr'
                      ? 'Entrer dans Madingo'
                      : 'Enter Madingo'}
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                    {lang === 'ar'
                      ? 'أدخل الاسم واللقب فقط للدخول المباشر واستعمال التطبيق فوراً'
                      : lang === 'ru'
                      ? 'Введите только имя и фамилию для мгновенного доступа к приложению'
                      : lang === 'fr'
                      ? 'Entrez simplement votre prénom et votre nom pour utiliser l’application immédiatement'
                      : 'Enter only your First Name and Last Name for instant access to the app'}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  data-testid="quick-entry-error"
                  className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-error text-error text-sm font-medium flex items-center gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleQuickEntrySubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="quick-first-name"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      {lang === 'ar'
                        ? 'الاسم الأول *'
                        : lang === 'ru'
                        ? 'Имя *'
                        : lang === 'fr'
                        ? 'Prénom *'
                        : 'First Name *'}
                    </label>
                    <input
                      id="quick-first-name"
                      data-testid="quick-first-name-input"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? 'مثال: بلال'
                          : lang === 'ru'
                          ? 'Например: Биلال / Алексей'
                          : lang === 'fr'
                          ? 'ex. Billel'
                          : 'e.g., Billel'
                      }
                      required
                      autoFocus
                      className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quick-last-name"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      {lang === 'ar'
                        ? 'اللقب / اسم العائلة'
                        : lang === 'ru'
                        ? 'Фамилия'
                        : lang === 'fr'
                        ? 'Nom de famille'
                        : 'Last Name'}
                    </label>
                    <input
                      id="quick-last-name"
                      data-testid="quick-last-name-input"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? 'مثال: أنيس'
                          : lang === 'ru'
                          ? 'Например: Анисс / Иванов'
                          : lang === 'fr'
                          ? 'ex. Anisse'
                          : 'e.g., Anisse'
                      }
                      className="w-full min-h-[48px] px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    data-testid="quick-entry-submit-btn"
                    disabled={isSubmitting}
                    className="w-full min-h-[54px] rounded-2xl bg-accent-orange text-brand-navy font-display font-extrabold text-lg shadow-md hover:brightness-105 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      t('common.loading')
                    ) : (
                      <>
                        <span>
                          {lang === 'ar'
                            ? 'دخول مباشر إلى التطبيق'
                            : lang === 'ru'
                            ? 'Войти в приложение'
                            : lang === 'fr'
                            ? 'Entrer dans l’application'
                            : 'Enter App Instantly'}
                        </span>
                        <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

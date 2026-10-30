import { SupportedLang } from '../data/curriculum';

export interface QuickEntryInput {
  firstName: string;
  lastName?: string;
  uiLang: SupportedLang;
  goalMinutes?: number;
  learningReason?: 'university' | 'travel' | 'work' | 'fun';
}

export interface QuickEntrySession {
  token: string;
  dashboard: {
    profile: {
      id: string;
      email: string;
      displayName: string;
      firstName: string;
      lastName: string;
      uiLang: SupportedLang;
      goalMinutes: number;
      avatarId: string;
      soundEnabled: boolean;
      notificationsEnabled: boolean;
      theme: 'light' | 'dark';
      learningReason: string;
    };
    progress: any[];
    streak: {
      current: number;
      best: number;
      lastActiveDate: string | null;
      spareTireAvailable: boolean;
      spareTireUsedDate: string | null;
    };
    totalFuel: number;
    todayMinutesCompleted: number;
    mistakes: any[];
    userWords: any[];
    reviewItems: any[];
  };
}

const QUICK_SESSION_STORAGE_KEY = 'madingo_quick_session_v1';

/**
 * Validates First Name and Last Name for direct app entry.
 */
export function validateQuickEntryInput(
  firstName: string,
  lastName: string,
  lang: SupportedLang
): { valid: boolean; error: string | null; fullName: string } {
  const fName = (firstName || '').trim();
  const lName = (lastName || '').trim();

  if (!fName) {
    const error =
      lang === 'ar'
        ? 'يرجى إدخال الاسم واللقب للبدء.'
        : lang === 'ru'
        ? 'Пожалуйста, введите имя и фамилию для входа.'
        : lang === 'fr'
        ? 'Veuillez entrer votre prénom et votre nom pour commencer.'
        : 'Please enter your First Name and Last Name to start.';
    return { valid: false, error, fullName: '' };
  }

  const fullName = lName ? `${fName} ${lName}` : fName;
  return { valid: true, error: null, fullName };
}

/**
 * Safely parses a Fetch Response as JSON.
 * On static hosts like Netlify, unknown `/api/*` routes often return `200 OK`
 * with `index.html` (`<!DOCTYPE html>...`), which causes `res.json()` to throw:
 * `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
 * This helper detects HTML / non-JSON payloads and returns `null` safely.
 */
export async function safeParseApiJson<T = any>(res: Response): Promise<T | null> {
  try {
    const contentType = (res.headers?.get?.('content-type') || '').toLowerCase();
    const text = await res.text();
    const trimmed = text.trim();
    if (
      !trimmed ||
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html') ||
      contentType.includes('text/html')
    ) {
      return null;
    }
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

/**
 * Creates a deterministic local session & dashboard so the app works
 * 100% offline or on static hosts (Netlify, GitHub Pages, Vercel static)
 * as well as with the Express backend.
 */
export function buildLocalQuickSession(input: QuickEntryInput): QuickEntrySession {
  const fName = (input.firstName || '').trim();
  const lName = (input.lastName || '').trim();
  const fullName = lName ? `${fName} ${lName}` : fName || 'MADI Student';
  const normalizedSlug = fullName
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF\u0600-\u06FF]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  const uid = `usr_quick_${normalizedSlug || 'student'}`;

  return {
    token: `local_token_${uid}_${Date.now()}`,
    dashboard: {
      profile: {
        id: uid,
        email: `${uid}@madi.student`,
        displayName: fullName,
        firstName: fName,
        lastName: lName,
        uiLang: input.uiLang || 'ar',
        goalMinutes: input.goalMinutes || 10,
        avatarId: 'misha-cap',
        soundEnabled: true,
        notificationsEnabled: true,
        theme: 'light',
        learningReason: input.learningReason || 'university',
      },
      progress: [],
      streak: {
        current: 1,
        best: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        spareTireAvailable: true,
        spareTireUsedDate: null,
      },
      totalFuel: 0,
      todayMinutesCompleted: 0,
      mistakes: [],
      userWords: [],
      reviewItems: [],
    },
  };
}

export function saveQuickSessionToStorage(session: QuickEntrySession): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(QUICK_SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function loadQuickSessionFromStorage(): QuickEntrySession | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(QUICK_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token && parsed.dashboard?.profile?.displayName) {
        return parsed as QuickEntrySession;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearQuickSessionFromStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(QUICK_SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { logViolation } from '../services/proctoringService';

const DEFAULT_MAX_VIOLATIONS = 3;
const VIOLATION_TYPES = {
  TAB_SWITCH: 'TAB_SWITCH',
  FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
  PASTE_ATTEMPT: 'PASTE_ATTEMPT',
  RELOAD_ATTEMPT: 'RELOAD_ATTEMPT',
  VISIBILITY_CHANGE: 'VISIBILITY_CHANGE',
  KEYBLOCK: 'KEYBLOCK',
};

/**
 * Lightweight, browser-only proctoring hook.
 * - Detects focus/visibility loss, fullscreen exit, blocked keys, paste attempts.
 * - Logs violations to backend and tracks local count.
 * - Auto-calls onThreshold when limit reached.
 */
export default function useProctoring({
  assessmentId,
  assessmentType,
  maxViolations = DEFAULT_MAX_VIOLATIONS,
  onViolation = () => {},
  onThreshold = () => {},
  enableFullscreen = true,
  allowPasteSelectors = ['[data-allow-paste="true"]', 'input', 'textarea', '[contenteditable="true"]'],
} = {}) {
  const [violationCount, setViolationCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [lastViolation, setLastViolation] = useState(null);

  const metaRef = useRef({ assessmentId, assessmentType });
  const activeRef = useRef(false);
  const thresholdRef = useRef(maxViolations);
  const onViolationRef = useRef(onViolation);
  const onThresholdRef = useRef(onThreshold);
  const allowPasteSelectorsRef = useRef(allowPasteSelectors);

  useEffect(() => {
    metaRef.current = { assessmentId, assessmentType };
    thresholdRef.current = maxViolations;
    onViolationRef.current = onViolation;
    onThresholdRef.current = onThreshold;
    allowPasteSelectorsRef.current = allowPasteSelectors;
  }, [assessmentId, assessmentType, maxViolations, onViolation, onThreshold, allowPasteSelectors]);

  const recordViolation = useCallback(async (violationType, meta = {}) => {
    if (!activeRef.current) return;
    const payload = {
      assessmentId: metaRef.current.assessmentId,
      assessmentType: metaRef.current.assessmentType,
      violationType,
      meta,
      timestamp: new Date().toISOString(),
    };

    setViolationCount((prev) => {
      const next = prev + 1;
      if (next >= thresholdRef.current) {
        onThresholdRef.current(payload);
      }
      return next;
    });
    setLastViolation(payload);
    onViolationRef.current(payload);

    try {
      await logViolation(payload);
    } catch (err) {
      console.warn('Violation log failed (client continuing):', err?.message || err);
    }
  }, []);

  const isPasteAllowed = (target) => {
    if (!target) return false;
    const selectors = allowPasteSelectorsRef.current || [];
    return selectors.some((sel) => {
      try {
        return target.closest(sel);
      } catch (e) {
        return false;
      }
    });
  };

  const keydownHandler = (e) => {
    if (!activeRef.current) return;

    const ctrl = e.ctrlKey || e.metaKey;
    const key = (e.key || '').toLowerCase();
    const inAllowedArea = isPasteAllowed(e.target);

    const clipboardCombo = ctrl && ['c', 'v', 'x', 'a'].includes(key);
    const newTabCombo = ctrl && ['t', 'n'].includes(key);
    const reloadCombo = e.key === 'F5' || (ctrl && key === 'r');
    const escExit = e.key === 'Escape';
    const backspaceNav = e.key === 'Backspace' && !['input', 'textarea'].includes((e.target?.tagName || '').toLowerCase());

    // Allow clipboard shortcuts inside explicitly allowed targets (e.g., code editor)
    if (clipboardCombo && inAllowedArea) return;

    const shouldBlock = clipboardCombo || newTabCombo || reloadCombo || escExit || backspaceNav;
    if (shouldBlock) {
      e.preventDefault();
      e.stopPropagation();
      recordViolation(VIOLATION_TYPES.KEYBLOCK, { key: e.key, ctrl, allowed: inAllowedArea });
    }
  };

  const pasteHandler = (e) => {
    if (!activeRef.current) return;
    if (isPasteAllowed(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    recordViolation(VIOLATION_TYPES.PASTE_ATTEMPT, { target: e.target?.tagName });
  };

  const copyHandler = (e) => {
    if (!activeRef.current) return;
    const selectable = e.target?.closest('[data-allow-copy="true"]');
    if (selectable) return;
    e.preventDefault();
    e.stopPropagation();
    recordViolation(VIOLATION_TYPES.KEYBLOCK, { action: 'copy' });
  };

  const visibilityHandler = () => {
    if (!activeRef.current) return;
    // Only log when page becomes hidden (actual tab switch)
    if (document.hidden) {
      recordViolation(VIOLATION_TYPES.TAB_SWITCH, { reason: 'browser-tab-switch' });
    }
  };

  const blurHandler = (e) => {
    if (!activeRef.current) return;
    // Only count blur as violation if it's switching to another application/window
    // Don't count internal clicks - those are legitimate
    if (document.hidden) {
      recordViolation(VIOLATION_TYPES.TAB_SWITCH, { reason: 'window-blur' });
    }
  };

  const altTabHandler = (e) => {
    if (!activeRef.current) return;
    // Detect Alt+Tab (system window switching)
    if ((e.altKey || e.metaKey) && e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      recordViolation(VIOLATION_TYPES.TAB_SWITCH, { reason: 'alt-tab-attempt' });
    }
  };

  const fullscreenHandler = () => {
    const isFs = !!document.fullscreenElement;
    setIsFullscreenActive(isFs);
    if (!isFs && activeRef.current && enableFullscreen) {
      recordViolation(VIOLATION_TYPES.FULLSCREEN_EXIT, {});
    }
  };

  const beforeUnloadHandler = (e) => {
    if (!activeRef.current) return;
    e.preventDefault();
    e.returnValue = '';
    recordViolation(VIOLATION_TYPES.RELOAD_ATTEMPT, {});
  };

  const attach = useCallback(() => {
    window.addEventListener('keydown', keydownHandler, true);
    window.addEventListener('paste', pasteHandler, true);
    window.addEventListener('copy', copyHandler, true);
    // Tab switching detection (browser tabs and Alt+Tab system switching)
    document.addEventListener('visibilitychange', visibilityHandler, true);
    window.addEventListener('keydown', altTabHandler, true);
    
    // Content protection (keyboard shortcuts, clipboard)
    window.addEventListener('keydown', keydownHandler, true);
    window.addEventListener('paste', pasteHandler, true);
    window.addEventListener('copy', copyHandler, true);
    document.addEventListener('fullscreenchange', fullscreenHandler, true);
    window.addEventListener('beforeunload', beforeUnloadHandler, true);
    document.body.classList.add('proctoring-block-select');
    document.body.classList.add('proctoring-active');
  }, []);

  const detach = useCallback(() => {
    window.removeEventListener('keydown', keydownHandler, true);
    window.removeEventListener('keydown', altTabHandler, true);
    window.removeEventListener('paste', pasteHandler, true);
    window.removeEventListener('copy', copyHandler, true);
    document.removeEventListener('visibilitychange', visibilityHandler, true);
    document.removeEventListener('fullscreenchange', fullscreenHandler, true);
    window.removeEventListener('beforeunload', beforeUnloadHandler, true);
    document.body.classList.remove('proctoring-block-select');
    document.body.classList.remove('proctoring-active');
  }, []);

  const startProctoring = useCallback(async () => {
    if (activeRef.current) return true;
    if (!metaRef.current.assessmentId || !metaRef.current.assessmentType) {
      console.warn('Proctoring start skipped: missing assessment context');
      return false;
    }

    activeRef.current = true;
    setIsActive(true);
    setViolationCount(0);
    setLastViolation(null);
    attach();

    if (enableFullscreen && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreenActive(true);
      } catch (err) {
        console.warn('Fullscreen request failed:', err?.message || err);
      }
    }
    return true;
  }, [attach, enableFullscreen]);

  const stopProctoring = useCallback(() => {
    activeRef.current = false;
    setIsActive(false);
    detach();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, [detach]);

  useEffect(() => () => stopProctoring(), [stopProctoring]);

  return {
    startProctoring,
    stopProctoring,
    violationCount,
    isActive,
    isFullscreenActive,
    lastViolation,
    VIOLATION_TYPES,
  };
}

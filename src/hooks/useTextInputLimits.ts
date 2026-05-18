import { useEffect } from 'react';
import {
  applyElementTextLimit,
  isTextLimitedElement,
} from '../utils/textLimitUtils';

function applyLimitsIn(root: ParentNode) {
  root
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
    .forEach((element) => {
      if (isTextLimitedElement(element)) {
        applyElementTextLimit(element);
      }
    });
}

export function useTextInputLimits() {
  useEffect(() => {
    applyLimitsIn(document);

    const handleInput = (event: Event) => {
      if (!isTextLimitedElement(event.target)) return;
      applyElementTextLimit(event.target);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (isTextLimitedElement(node)) {
            applyElementTextLimit(node);
          }
          applyLimitsIn(node);
        });
      });
    });

    document.addEventListener('beforeinput', handleInput, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('paste', handleInput, true);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('beforeinput', handleInput, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('paste', handleInput, true);
      observer.disconnect();
    };
  }, []);
}

'use client';

import { useEffect } from 'react';

export function HydrationFix() {
  useEffect(() => {
    // 抑制 hydration 错误
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Hydration failed') ||
         args[0].includes('hydration') ||
         args[0].includes('data-doubao-translate') ||
         args[0].includes('translate-traverse'))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    // 移除翻译插件添加的属性
    const removeTranslateAttributes = () => {
      const elements = document.querySelectorAll('[data-doubao-translate-traverse-mark]');
      elements.forEach(el => {
        el.removeAttribute('data-doubao-translate-traverse-mark');
      });
    };

    // 立即执行一次
    removeTranslateAttributes();

    // 定期清理
    const interval = setInterval(removeTranslateAttributes, 1000);

    // 监听DOM变化
    const observer = new MutationObserver(() => {
      removeTranslateAttributes();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-doubao-translate-traverse-mark']
    });

    return () => {
      console.error = originalError;
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}

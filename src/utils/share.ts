import { CATEGORIES, UNIT_LABELS } from '../constants';
import { Language, ShoppingItem } from '../types';

export function formatShoppingListForShare(
  items: ShoppingItem[],
  lang: Language = 'he'
): string {
  if (items.length === 0) {
    return lang === 'he' ? 'רשימת הקניות ריקה!' : 'Shopping list is empty!';
  }

  const isHe = lang === 'he';
  const title = isHe ? '🛒 *רשימת קניות:*' : '🛒 *Shopping List:*';

  // Group by category
  const activeItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  const lines: string[] = [title, ''];

  CATEGORIES.forEach((cat) => {
    const catItems = activeItems.filter((i) => i.categoryId === cat.id);
    if (catItems.length > 0) {
      const catName = isHe ? cat.nameHe : cat.nameEn;
      lines.push(`*${catName}:*`);
      catItems.forEach((item) => {
        const unit = UNIT_LABELS[item.unit][lang];
        const qty = item.quantity === 1 && item.unit === 'units' ? '' : ` (${item.quantity} ${unit})`;
        const note = item.notes ? ` - _${item.notes}_` : '';
        lines.push(`▫️ ${item.name}${qty}${note}`);
      });
      lines.push('');
    }
  });

  if (checkedItems.length > 0) {
    lines.push(isHe ? '*✅ נאספו כבר:*' : '*✅ Already in cart:*');
    checkedItems.forEach((item) => {
      lines.push(`~${item.name}~`);
    });
    lines.push('');
  }

  const dateStr = new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  lines.push(
    isHe
      ? `📅 ${dateStr} · נוצר באמצעות רשימת קניות`
      : `📅 ${dateStr} · Created with Reshimat Kniyot`
  );

  return lines.join('\n');
}

export function openWhatsAppShare(items: ShoppingItem[], lang: Language = 'he') {
  const text = formatShoppingListForShare(items, lang);
  const encodedText = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (err) {
    console.error('Failed to copy', err);
    return false;
  }
}

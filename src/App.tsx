import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  Share2,
  Search,
  Sparkles,
  Copy,
  ChevronDown,
  Layers,
  List,
  RotateCcw,
  BookOpen,
  Edit2,
  X,
  MessageCircle,
  Percent,
} from 'lucide-react';
import {
  Category,
  CategoryId,
  FilterStatus,
  Language,
  PresetList,
  ShoppingItem,
  UnitType,
} from './types';
import {
  CATEGORIES,
  KEYWORD_CATEGORY_MAP,
  PRESET_LISTS,
  QUICK_ADD_ITEMS,
  UNIT_LABELS,
} from './constants';
import { CategoryIcon } from './components/CategoryIcon';
import { copyToClipboard, formatShoppingListForShare, openWhatsAppShare } from './utils/share';

const STORAGE_KEY = 'reshimat_kniyot_items_v2';
const LANG_STORAGE_KEY = 'reshimat_kniyot_lang_v1';

const INITIAL_ITEMS: ShoppingItem[] = [
  {
    id: '1',
    name: 'חלב 3%',
    quantity: 2,
    unit: 'units',
    categoryId: 'dairy',
    checked: false,
    createdAt: Date.now() - 600000,
  },
  {
    id: '2',
    name: 'עגבניות שרי / מגי',
    quantity: 1.5,
    unit: 'kg',
    categoryId: 'produce',
    checked: false,
    notes: 'בשלות וקשות',
    createdAt: Date.now() - 500000,
  },
  {
    id: '3',
    name: 'מלפפונים',
    quantity: 1.5,
    unit: 'kg',
    categoryId: 'produce',
    checked: false,
    createdAt: Date.now() - 400000,
  },
  {
    id: '4',
    name: 'ביצים L (12)',
    quantity: 1,
    unit: 'pack',
    categoryId: 'dairy',
    checked: true,
    createdAt: Date.now() - 300000,
  },
  {
    id: '5',
    name: 'לחם שיפון פרוס',
    quantity: 1,
    unit: 'units',
    categoryId: 'bakery',
    checked: false,
    createdAt: Date.now() - 200000,
  },
  {
    id: '6',
    name: "קוטג' 5%",
    quantity: 2,
    unit: 'units',
    categoryId: 'dairy',
    checked: true,
    createdAt: Date.now() - 100000,
  },
];

export default function App() {
  // Language & Direction
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'en' ? 'en' : 'he';
  });

  const isHe = lang === 'he';

  // State
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading items from localStorage', e);
    }
    return INITIAL_ITEMS;
  });

  // Inputs
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<UnitType>('units');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('produce');
  const [userManuallySelectedCat, setUserManuallySelectedCat] = useState(false);
  const [itemNote, setItemNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Filters & Views
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Modals & Panels
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Editing Item
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isHe ? 'rtl' : 'ltr';
  }, [lang, isHe]);

  // Smart Auto-Categorization as user types
  useEffect(() => {
    if (userManuallySelectedCat) return;
    const clean = itemName.trim().toLowerCase();
    if (!clean) return;

    // Direct match
    if (KEYWORD_CATEGORY_MAP[clean]) {
      setSelectedCategory(KEYWORD_CATEGORY_MAP[clean]);
      return;
    }

    // Word prefix / substring check
    const words = clean.split(/\s+/);
    for (const w of words) {
      if (KEYWORD_CATEGORY_MAP[w]) {
        setSelectedCategory(KEYWORD_CATEGORY_MAP[w]);
        return;
      }
    }
    for (const [kw, cat] of Object.entries(KEYWORD_CATEGORY_MAP)) {
      if (clean.includes(kw) || kw.includes(clean)) {
        setSelectedCategory(cat);
        break;
      }
    }
  }, [itemName, userManuallySelectedCat]);

  // Handle Add Item
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = itemName.trim();
    if (!trimmed) return;

    // Check if item already exists (case-insensitive)
    const existingIndex = items.findIndex(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase() && !item.checked
    );

    if (existingIndex !== -1) {
      // Increase quantity of existing active item
      const updated = [...items];
      updated[existingIndex].quantity = Number((updated[existingIndex].quantity + quantity).toFixed(1));
      if (itemNote.trim()) {
        updated[existingIndex].notes = itemNote.trim();
      }
      setItems(updated);
    } else {
      const newItem: ShoppingItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        name: trimmed,
        quantity: Math.max(0.1, Number(quantity) || 1),
        unit,
        categoryId: selectedCategory,
        checked: false,
        notes: itemNote.trim() || undefined,
        createdAt: Date.now(),
      };
      setItems((prev) => [newItem, ...prev]);
    }

    // Reset input
    setItemName('');
    setQuantity(1);
    setItemNote('');
    setShowNoteInput(false);
    setUserManuallySelectedCat(false);
    inputRef.current?.focus();
  };

  // Quick Add Item click
  const handleQuickAdd = (quick: (typeof QUICK_ADD_ITEMS)[0]) => {
    const displayName = isHe ? quick.nameHe : quick.nameEn;
    const existingIndex = items.findIndex(
      (i) => i.name.toLowerCase() === displayName.toLowerCase() && !i.checked
    );

    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      const newItem: ShoppingItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        name: displayName,
        quantity: 1,
        unit: quick.defaultUnit,
        categoryId: quick.categoryId as CategoryId,
        checked: false,
        createdAt: Date.now(),
      };
      setItems((prev) => [newItem, ...prev]);
    }
  };

  // Toggle item checked
  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Delete item
  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item quantity
  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0.2, Number((item.quantity + delta).toFixed(1)));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Clear completed items
  const clearCompleted = () => {
    const hasCompleted = items.some((i) => i.checked);
    if (!hasCompleted) return;
    if (window.confirm(isHe ? 'למחוק את כל הפריטים שכבר נקנו מהרשימה?' : 'Remove all checked items?')) {
      setItems((prev) => prev.filter((i) => !i.checked));
    }
  };

  // Clear all items
  const clearAll = () => {
    if (items.length === 0) return;
    if (window.confirm(isHe ? 'האם לאפס את כל הרשימה?' : 'Clear all items from list?')) {
      setItems([]);
    }
  };

  // Load preset
  const handleLoadPreset = (preset: PresetList, mode: 'replace' | 'append') => {
    const newItems: ShoppingItem[] = preset.items.map((pi, idx) => ({
      id: Date.now().toString() + idx + Math.random().toString(36).substring(2, 5),
      name: isHe ? pi.nameHe : pi.nameEn,
      quantity: pi.quantity,
      unit: pi.unit,
      categoryId: pi.categoryId,
      checked: false,
      createdAt: Date.now() + idx,
    }));

    if (mode === 'replace') {
      setItems(newItems);
    } else {
      setItems((prev) => [...newItems, ...prev]);
    }
    setIsPresetsModalOpen(false);
  };

  // Save edited item
  const saveEditedItem = () => {
    if (!editingItem || !editingItem.name.trim()) return;
    setItems((prev) =>
      prev.map((it) => (it.id === editingItem.id ? { ...editingItem, name: editingItem.name.trim() } : it))
    );
    setEditingItem(null);
  };

  // Metrics
  const totalItemsCount = items.length;
  const completedCount = items.filter((i) => i.checked).length;
  const activeCount = totalItemsCount - completedCount;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedCount / totalItemsCount) * 100) : 0;

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (filterStatus === 'active' && item.checked) return false;
      if (filterStatus === 'completed' && !item.checked) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const cat = CATEGORIES.find((c) => c.id === item.categoryId);
        const matchesCat =
          cat?.nameHe.toLowerCase().includes(q) || cat?.nameEn.toLowerCase().includes(q);
        if (!matchesName && !matchesNotes && !matchesCat) return false;
      }

      return true;
    });
  }, [items, filterStatus, searchQuery]);

  // Grouped by Category
  const groupedData = useMemo(() => {
    const map = new Map<CategoryId, ShoppingItem[]>();
    CATEGORIES.forEach((cat) => map.set(cat.id, []));

    filteredItems.forEach((item) => {
      const list = map.get(item.categoryId) || [];
      list.push(item);
      map.set(item.categoryId, list);
    });

    return CATEGORIES.map((cat) => ({
      category: cat,
      items: map.get(cat.id) || [],
    })).filter((group) => group.items.length > 0);
  }, [filteredItems]);

  const handleCopyText = async () => {
    const text = formatShoppingListForShare(items, lang);
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-100 selection:text-emerald-900"
    >
      {/* 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand title, single line */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                {isHe ? 'רשימת קניות' : 'Reshimat Kniyot'}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                {isHe ? 'קניות חכמות ופשוטות' : 'Smart & Simple Grocery List'}
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Actions */}
          <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium text-slate-600">
            <button
              onClick={() => setIsPresetsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title={isHe ? 'רשימות מוכנות מראש' : 'Preset Templates'}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>{isHe ? 'תבניות' : 'Templates'}</span>
            </button>

            <button
              onClick={() => setLang(isHe ? 'en' : 'he')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title={isHe ? 'החלף לאנגלית' : 'Switch to Hebrew'}
            >
              <span className="font-semibold text-emerald-700 uppercase">{isHe ? 'EN' : 'עב'}</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{isHe ? 'שיתוף רשימה' : 'Share List'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* PROGRESS & SUMMARY BANNER */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {isHe ? 'התקדמות איסוף מוצרים' : 'Shopping Progress'}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                ({completedCount}/{totalItemsCount})
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
              <span>
                {activeCount} {isHe ? 'נותרו לקנות' : 'to buy'}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>
                {completedCount} {isHe ? 'בעגלה' : 'in cart'}
              </span>
              {completedCount > 0 && (
                <>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <button
                    onClick={clearCompleted}
                    className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    {isHe ? 'נקה נאספו' : 'Clear checked'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ADD ITEM CARD */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Item Name Input */}
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={
                    isHe ? 'מה צריך לקנות? (למשל: חלב, עגבניות, ביצים...)' : 'What to buy? (e.g. Milk, Bread, Apples...)'
                  }
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
                {itemName && (
                  <button
                    type="button"
                    onClick={() => {
                      setItemName('');
                      inputRef.current?.focus();
                    }}
                    className="absolute inset-y-0 end-2 flex items-center px-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quantity and Unit */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden h-11">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(0.5, Number((q - (q > 1 ? 1 : 0.5)).toFixed(1))))}
                    className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300 font-bold text-base transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-12 text-center bg-transparent border-0 text-slate-900 font-mono text-sm focus:outline-none tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Number((q + 1).toFixed(1)))}
                    className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300 font-bold text-base transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Unit Selector */}
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitType)}
                  aria-label={isHe ? 'יחידת מידה' : 'Unit'}
                  className="h-11 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="units">{UNIT_LABELS.units[lang]}</option>
                  <option value="kg">{UNIT_LABELS.kg[lang]}</option>
                  <option value="g">{UNIT_LABELS.g[lang]}</option>
                  <option value="pack">{UNIT_LABELS.pack[lang]}</option>
                  <option value="bottle">{UNIT_LABELS.bottle[lang]}</option>
                  <option value="box">{UNIT_LABELS.box[lang]}</option>
                </select>

                {/* Submit Add Button */}
                <button
                  type="submit"
                  disabled={!itemName.trim()}
                  className="h-11 px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isHe ? 'הוסף' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Category Selector Bar & Note Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                <span className="text-xs text-slate-500 whitespace-nowrap ps-0.5">
                  {isHe ? 'מחלקה בסופר:' : 'Aisle:'}
                </span>
                <div className="flex items-center gap-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setUserManuallySelectedCat(true);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/30 font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <CategoryIcon categoryId={cat.id} className="w-3.5 h-3.5" />
                        <span>{isHe ? cat.nameHe : cat.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline-offset-2 hover:underline whitespace-nowrap cursor-pointer"
              >
                {showNoteInput
                  ? isHe
                    ? '- הסתר הערה'
                    : '- Hide note'
                  : isHe
                  ? '+ הוסף הערה'
                  : '+ Add note'}
              </button>
            </div>

            {/* Optional Note Field */}
            {showNoteInput && (
              <div className="pt-1">
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder={
                    isHe
                      ? 'הערה למוצר (למשל: רק תנובה, לבדוק תאריך, ללא גלוטן...)'
                      : 'Item note (e.g. Brand preference, ripe only, gluten free...)'
                  }
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </form>

          {/* Quick Add Suggestions */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isHe ? 'הוספה מהירה של מוצרי יסוד:' : 'Quick tap staples:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ADD_ITEMS.map((quick, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickAdd(quick)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent rounded-lg text-xs text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  <span>{isHe ? quick.nameHe : quick.nameEn}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* LIST CONTROLS & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHe ? 'חיפוש ברשימה...' : 'Search items...'}
              className="w-full h-9 ps-9 pe-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHe ? 'הכל' : 'All'}
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'active'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHe ? 'לקנות' : 'To Buy'}
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === 'completed'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isHe ? 'נאספו' : 'Cart'}
              </button>
            </div>

            {/* View Mode Toggle: Grouped vs Flat */}
            <button
              onClick={() => setGroupByCategory(!groupByCategory)}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title={groupByCategory ? (isHe ? 'הצג כרשימה פשוטה' : 'Flat list') : isHe ? 'קבץ לפי מחלקות' : 'Group by category'}
            >
              {groupByCategory ? <List className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* SHOPPING LIST ITEMS */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                {searchQuery
                  ? isHe
                    ? 'לא נמצאו פריטים תואמים'
                    : 'No matching items found'
                  : filterStatus === 'completed'
                  ? isHe
                    ? 'עוד לא נאסף אף פריט'
                    : 'No items in cart yet'
                  : isHe
                  ? 'רשימת הקניות ריקה'
                  : 'Your shopping list is empty'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isHe
                  ? 'הוסיפו מוצרים באמצעות תיבת החיפוש למעלה או בחרו תבנית מוכנה'
                  : 'Add items above or pick a starter template to get rolling'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsPresetsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isHe ? 'פתח תבניות מומלצות' : 'Browse Templates'}</span>
              </button>
            )}
          </div>
        ) : groupByCategory ? (
          // Grouped by Category View
          <div className="space-y-4">
            {groupedData.map(({ category, items: catItems }) => (
              <div
                key={category.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Category Header */}
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200/60 text-emerald-700 shadow-2xs">
                      <CategoryIcon categoryId={category.id} className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {isHe ? category.nameHe : category.nameEn}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    {catItems.filter((i) => i.checked).length}/{catItems.length}
                  </span>
                </div>

                {/* Items in Category */}
                <div className="divide-y divide-slate-100">
                  {catItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      lang={lang}
                      onToggle={() => toggleItem(item.id)}
                      onDelete={() => deleteItem(item.id)}
                      onUpdateQuantity={(delta) => updateQuantity(item.id, delta)}
                      onEdit={() => setEditingItem(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat List View
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                lang={lang}
                onToggle={() => toggleItem(item.id)}
                onDelete={() => deleteItem(item.id)}
                onUpdateQuantity={(delta) => updateQuantity(item.id, delta)}
                onEdit={() => setEditingItem(item)}
              />
            ))}
          </div>
        )}

        {/* BOTTOM UTILITY ACTIONS */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500">
            <span>
              {isHe ? `סה"כ ${totalItemsCount} פריטים ברשימה` : `Total ${totalItemsCount} items on list`}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={clearAll}
                className="text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isHe ? 'אפס רשימה' : 'Clear all'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{isHe ? 'רשימת קניות ישראלית חכמה · מוכנה ל-GitHub' : 'Reshimat Kniyot · Israeli Smart Grocery List'}</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Local Storage</span>
            <span>·</span>
            <span>WhatsApp Ready</span>
            <span>·</span>
            <span>RTL / LTR</span>
          </div>
        </div>
      </footer>

      {/* SHARE / WHATSAPP MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isHe ? 'שיתוף רשימת הקניות' : 'Share Shopping List'}
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {isHe
                ? 'הרשימה ממוינת לפי מחלקות בסופר ומעוצבת באופן מושלם לשליחה בוואטסאפ לבני הזוג או המשפחה:'
                : 'Formatted by supermarket aisle and ready to send directly via WhatsApp or copy:'}
            </p>

            {/* Preview Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
              {formatShoppingListForShare(items, lang)}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => openWhatsAppShare(items, lang)}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isHe ? 'פתח ב-WhatsApp' : 'Open in WhatsApp'}</span>
              </button>
              <button
                onClick={handleCopyText}
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedNotification ? (isHe ? 'הועתק!' : 'Copied!') : isHe ? 'העתק ללוח' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRESETS MODAL */}
      {isPresetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isHe ? 'תבניות קניות מוכנות' : 'Starter List Templates'}
                </h3>
              </div>
              <button
                onClick={() => setIsPresetsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {isHe
                ? 'בחרו תבנית מוכנה כדי להוסיף אותה לרשימה הקיימת או להתחיל מחדש:'
                : 'Select a preset template to append or start fresh:'}
            </p>

            <div className="space-y-3">
              {PRESET_LISTS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {isHe ? preset.titleHe : preset.titleEn}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isHe ? preset.descriptionHe : preset.descriptionEn}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      {preset.items.length} {isHe ? 'מוצרים' : 'items'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      onClick={() => handleLoadPreset(preset, 'append')}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {isHe ? '+ הוסף לרשימה שלי' : '+ Append to my list'}
                    </button>
                    <button
                      onClick={() => handleLoadPreset(preset, 'replace')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    >
                      {isHe ? 'החלף את הרשימה' : 'Replace list'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {isHe ? 'עריכת מוצר' : 'Edit Item'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isHe ? 'שם המוצר' : 'Item Name'}
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isHe ? 'כמות' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={editingItem.quantity}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        quantity: Math.max(0.1, parseFloat(e.target.value) || 1),
                      })
                    }
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isHe ? 'יחידה' : 'Unit'}
                  </label>
                  <select
                    value={editingItem.unit}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        unit: e.target.value as UnitType,
                      })
                    }
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="units">{UNIT_LABELS.units[lang]}</option>
                    <option value="kg">{UNIT_LABELS.kg[lang]}</option>
                    <option value="g">{UNIT_LABELS.g[lang]}</option>
                    <option value="pack">{UNIT_LABELS.pack[lang]}</option>
                    <option value="bottle">{UNIT_LABELS.bottle[lang]}</option>
                    <option value="box">{UNIT_LABELS.box[lang]}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isHe ? 'מחלקה' : 'Category'}
                </label>
                <select
                  value={editingItem.categoryId}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      categoryId: e.target.value as CategoryId,
                    })
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isHe ? c.nameHe : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isHe ? 'הערה (אופציונלי)' : 'Note (optional)'}
                </label>
                <input
                  type="text"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder={isHe ? 'לדוגמה: ללא גלוטן' : 'e.g. Gluten-free'}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={saveEditedItem}
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                {isHe ? 'שמור שינויים' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                {isHe ? 'ביטול' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SUBCOMPONENT: Shopping Item Row
interface ShoppingItemRowProps {
  item: ShoppingItem;
  lang: Language;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateQuantity: (delta: number) => void;
  onEdit: () => void;
}

function ShoppingItemRow({
  item,
  lang,
  onToggle,
  onDelete,
  onUpdateQuantity,
  onEdit,
}: ShoppingItemRowProps) {
  const isHe = lang === 'he';
  const unitLabel = UNIT_LABELS[item.unit][lang];

  return (
    <div
      className={`group flex items-center justify-between px-4 py-3 transition-colors ${
        item.checked ? 'bg-slate-50/70 text-slate-400' : 'hover:bg-slate-50/50 text-slate-900'
      }`}
    >
      {/* Checkbox & Item Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0 me-2">
        <button
          type="button"
          onClick={onToggle}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
            item.checked
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
              : 'border-slate-300 hover:border-emerald-500 bg-white'
          }`}
          aria-label={item.checked ? 'Unmark item' : 'Mark item completed'}
        >
          {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        <div className="flex flex-col min-w-0">
          <span
            onClick={onToggle}
            className={`text-sm cursor-pointer select-none truncate font-medium transition-all ${
              item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-800'
            }`}
          >
            {item.name}
          </span>
          {item.notes && (
            <span className="text-[11px] text-slate-400 truncate italic">{item.notes}</span>
          )}
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quantity Controls */}
        <div
          className={`flex items-center rounded-lg border text-xs overflow-hidden ${
            item.checked
              ? 'border-slate-200 bg-slate-100/60 opacity-60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={() => onUpdateQuantity(-1)}
            disabled={item.quantity <= 0.5}
            className="w-6 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent font-bold cursor-pointer"
          >
            -
          </button>
          <span className="px-1.5 font-mono tabular-nums text-slate-700 min-w-10 text-center font-medium">
            {item.quantity} {unitLabel}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(1)}
            className="w-6 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={isHe ? 'ערוך מוצר' : 'Edit item'}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title={isHe ? 'מחק מוצר' : 'Delete item'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

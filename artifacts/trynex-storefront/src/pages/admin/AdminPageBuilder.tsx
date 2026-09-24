import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Loader } from "@/components/ui/Loader";
import { getAuthHeaders } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  GripVertical, Eye, EyeOff, Trash2, Plus, Save,
  Layout, Image as ImageIcon, ShoppingBag, Info, MessageSquare,
  BarChart3, ShieldCheck, Newspaper, MousePointer2, Megaphone,
  ChevronUp, ChevronDown, CreditCard, Grid, Flame, Award, Palette,
  Package, History, RotateCcw, ExternalLink, AlertCircle, type LucideIcon,
} from "lucide-react";
import {
  HOME_SECTION_INFO, HOME_SECTION_TYPES, defaultHomeLayout, parseHomeLayout, serializeHomeLayout,
  type HomeSectionConfig, type HomeSectionPadding, type HomeSectionSettings, type HomeSectionType,
} from "@/lib/homepageLayout";

const SECTION_ICONS: Record<HomeSectionType, LucideIcon> = {
  hero: ImageIcon,
  announcement: Megaphone,
  products: ShoppingBag,
  "payment-ribbon": CreditCard,
  categories: Grid,
  "flash-sale": Flame,
  features: Award,
  "how-it-works": Info,
  "studio-cta": Palette,
  "popular-products": Package,
  stats: BarChart3,
  testimonials: MessageSquare,
  "trust-badges": ShieldCheck,
  blog: Newspaper,
  "recently-viewed": History,
  cta: Megaphone,
};

export default function AdminPageBuilder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings({
    request: { headers: getAuthHeaders() },
    query: { staleTime: 0, refetchOnMount: "always" } as any
  });
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings({
    request: { headers: getAuthHeaders() }
  });

  const [layout, setLayout] = useState<HomeSectionConfig[]>([]);
  const [isCustomLayout, setIsCustomLayout] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOverTargetRef = useRef("");
  const loadedRef = useRef(false);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // On narrow screens the settings panel sits below the list; bring it into
  // view when a section is tapped so the edit controls are discoverable.
  const selectSection = (id: string) => {
    setSelectedSectionId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => settingsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  // Load once from the server. Later refetches (window focus etc.) must not
  // wipe unsaved edits in progress.
  useEffect(() => {
    if (!settings || loadedRef.current) return;
    loadedRef.current = true;
    const saved = parseHomeLayout((settings as { homepage_layout?: string | null }).homepage_layout);
    setIsCustomLayout(saved !== null);
    setLayout(saved ?? defaultHomeLayout());
  }, [settings]);

  const edit = (updater: (prev: HomeSectionConfig[]) => HomeSectionConfig[]) => {
    setLayout(updater);
    setDirty(true);
  };

  const saveLayout = async () => {
    try {
      const saved = await updateSettings({
        data: { homepage_layout: serializeHomeLayout(layout) } as any
      });
      const stored = parseHomeLayout((saved as { homepage_layout?: string | null } | undefined)?.homepage_layout);
      if (!stored) throw new Error("The server did not store the layout.");
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setIsCustomLayout(true);
      setDirty(false);
      toast({ title: "Layout published", description: "The homepage now uses this section order." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Failed to save layout", description: msg, variant: "destructive" });
    }
  };

  const resetToDefault = () => {
    setLayout(defaultHomeLayout());
    setSelectedSectionId(null);
    setDirty(true);
  };

  const usedTypes = new Set(layout.map(s => s.type));

  const addSection = (type: HomeSectionType) => {
    if (usedTypes.has(type)) return;
    const newSection: HomeSectionConfig = {
      id: Math.random().toString(36).slice(2, 11),
      type,
      visible: true,
      settings: {}
    };
    edit(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const removeSection = (id: string) => {
    edit(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const toggleVisibility = (id: string) => {
    edit(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const updateSectionSettings = (id: string, patch: Partial<HomeSectionSettings>) => {
    edit(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next: HomeSectionSettings = { ...s.settings, ...patch };
      (Object.keys(next) as (keyof HomeSectionSettings)[]).forEach(k => { if (!next[k]) delete next[k]; });
      return { ...s, settings: next };
    }));
  };

  // Drag and Drop (mouse). Touch devices use the up/down buttons.
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };
  const onDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!draggingId || draggingId === targetId || dragOverTargetRef.current === targetId) return;
    dragOverTargetRef.current = targetId;
    edit(prev => {
      const draggingIdx = prev.findIndex(s => s.id === draggingId);
      const targetIdx = prev.findIndex(s => s.id === targetId);
      if (draggingIdx === -1 || targetIdx === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(draggingIdx, 1);
      next.splice(targetIdx, 0, removed);
      return next;
    });
  };
  const onDragEnd = () => { setDraggingId(null); dragOverTargetRef.current = ""; };

  const move = (id: string, delta: -1 | 1) => edit(prev => {
    const idx = prev.findIndex(s => s.id === id);
    const target = idx + delta;
    if (idx === -1 || target < 0 || target >= prev.length) return prev;
    const next = [...prev];
    [next[idx], next[target]] = [next[target], next[idx]];
    return next;
  });

  const selectedSection = layout.find(s => s.id === selectedSectionId);
  const selectedInfo = selectedSection ? HOME_SECTION_INFO[selectedSection.type] : null;

  if (isLoading) return <AdminLayout><Loader /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Page Builder</h1>
            <p className="text-sm text-gray-500">Reorder, hide and customise your homepage sections, then publish.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" /> Unsaved changes
              </span>
            )}
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50">
              <ExternalLink className="w-4 h-4" /> View homepage
            </a>
            <button
              onClick={saveLayout}
              disabled={isPending || !dirty}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending ? "Saving..." : "Save & Publish"}
            </button>
          </div>
        </div>

        {!isCustomLayout && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-blue-50 border border-blue-200 text-blue-800">
            The homepage is using the built-in default layout shown below. Changes go live after you click <strong>Save &amp; Publish</strong>.
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Left Sidebar - Library */}
          <div className="lg:w-64 w-full bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col lg:max-h-none max-h-60">
            <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-xs uppercase tracking-widest text-gray-500">
              Available Sections
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {HOME_SECTION_TYPES.map(type => {
                const item = HOME_SECTION_INFO[type];
                const Icon = SECTION_ICONS[type];
                const added = usedTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    disabled={added}
                    title={added ? "Already on the page" : `Add ${item.name}`}
                    className="w-full text-left p-3 rounded-xl border border-transparent hover:border-orange-200 hover:bg-orange-50 group transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white flex items-center justify-center text-gray-500 group-hover:text-orange-600 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-800">{item.name}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{added ? "On the page" : item.description}</div>
                      </div>
                      {!added && <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button onClick={resetToDefault}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100">
                <RotateCcw className="w-3.5 h-3.5" /> Reset to default layout
              </button>
            </div>
          </div>

          {/* Center - Layout */}
          <div className="flex-1 bg-gray-100/50 border border-gray-200 rounded-2xl p-3 sm:p-4 lg:p-6 overflow-y-auto">
            <div className="max-w-xl mx-auto space-y-3">
              {layout.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-3xl">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Your page is empty</h3>
                  <p className="text-sm text-gray-500 mt-1">Add sections from the library to get started.</p>
                </div>
              )}
              {layout.map((section, idx) => {
                const info = HOME_SECTION_INFO[section.type];
                const Icon = SECTION_ICONS[section.type] ?? Layout;
                return (
                  <div
                    key={section.id}
                    data-testid={`builder-section-${section.type}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, section.id)}
                    onDragOver={(e) => onDragOver(e, section.id)}
                    onDrop={(e) => e.preventDefault()}
                    onDragEnd={onDragEnd}
                    onClick={() => selectSection(section.id)}
                    className={`
                      group relative flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white border rounded-2xl transition-all cursor-move select-none
                      ${selectedSectionId === section.id ? 'border-orange-400 ring-2 ring-orange-50' : 'border-gray-200 hover:border-gray-300 shadow-sm'}
                      ${draggingId === section.id ? 'opacity-40 scale-[0.98]' : ''}
                      ${!section.visible ? 'bg-gray-50/50 grayscale opacity-60' : ''}
                    `}
                  >
                    <div className="hidden sm:block text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    {/* Up/down buttons — work with touch as well as mouse */}
                    <div className="flex flex-col gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); move(section.id, -1); }} disabled={idx === 0}
                        aria-label={`Move ${info.name} up`} title="Move up"
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); move(section.id, 1); }} disabled={idx === layout.length - 1}
                        aria-label={`Move ${info.name} down`} title="Move down"
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                    <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gray-100 items-center justify-center text-gray-500 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{info.name}</div>
                      <div className="text-[10px] text-gray-400 font-medium truncate">
                        Position {idx + 1} of {layout.length}{section.settings.title ? ` · “${section.settings.title}”` : ""}{!section.visible ? " · Hidden" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(section.id); }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={section.visible ? "Hide section" : "Show section"}
                        aria-label={section.visible ? `Hide ${info.name}` : `Show ${info.name}`}
                      >
                        {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="Remove section"
                        aria-label={`Remove ${info.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar - Settings */}
          <div ref={settingsPanelRef} className="lg:w-80 w-full bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col scroll-mt-20">
            <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-xs uppercase tracking-widest text-gray-500">
              Section Settings
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {selectedSection && selectedInfo ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                      {(() => {
                        const Icon = SECTION_ICONS[selectedSection.type] ?? Layout;
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{selectedInfo.name}</div>
                      <div className="text-xs text-gray-400">{selectedInfo.description}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedInfo.supportsTitle && (
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={selectedSection.settings.title || ""}
                          onChange={(e) => updateSectionSettings(selectedSection.id, { title: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all"
                          placeholder="Leave blank for the default heading"
                          maxLength={160}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        Background Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          aria-label="Background color"
                          value={selectedSection.settings.bgColor || "#ffffff"}
                          onChange={(e) => updateSectionSettings(selectedSection.id, { bgColor: e.target.value })}
                          className="w-10 h-10 rounded-lg border border-gray-200 p-0.5"
                        />
                        <input
                          type="text"
                          value={selectedSection.settings.bgColor || ""}
                          onChange={(e) => updateSectionSettings(selectedSection.id, { bgColor: e.target.value.trim() })}
                          placeholder="Default"
                          className="flex-1 min-w-0 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                        />
                        {selectedSection.settings.bgColor && (
                          <button onClick={() => updateSectionSettings(selectedSection.id, { bgColor: undefined })}
                            className="px-3 text-xs font-bold text-gray-500 hover:text-gray-800">Reset</button>
                        )}
                      </div>
                      {selectedSection.settings.bgColor && !/^#[0-9a-f]{3,8}$/i.test(selectedSection.settings.bgColor) && (
                        <p className="text-xs text-red-500 mt-1">Use a hex colour like #FFF4EA — other values are ignored.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        Padding (Vertical)
                      </label>
                      <select
                        value={selectedSection.settings.padding || ""}
                        onChange={(e) => updateSectionSettings(selectedSection.id, { padding: (e.target.value || undefined) as HomeSectionPadding | undefined })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                      >
                        <option value="">Default</option>
                        <option value="none">None</option>
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">Settings apply when you click <strong>Save &amp; Publish</strong>.</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <MousePointer2 className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Select a section in the layout<br/>to edit its settings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

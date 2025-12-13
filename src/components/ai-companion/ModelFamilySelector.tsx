import React from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline'; // Using outline to match style
import { SparklesIcon } from '@heroicons/react/24/solid';

const DEFAULT_MODEL_SENTINEL = '__default__';

// Family names mapping
const FAMILY_DISPLAY_NAMES: Record<string, string> = {
    'openai': 'ChatGPT',
    'chatgpt': 'ChatGPT',
    'anthropic': 'Claude',
    'claude': 'Claude',
    'google': 'Gemini',
    'gemini': 'Gemini',
    'xai': 'Grok',
    'grok': 'Grok',
    'deepseek': 'DeepSeek',
    'qwen': 'Qwen',
    'alibaba': 'Qwen',
    'mistral': 'Mistral',
    'meta': 'Llama',
    'llama': 'Llama',
    'perplexity': 'Perplexity',
    'black forest labs': 'Flux'
};

interface ModelFamilySelectorProps {
    availableModels: any[];
    selectedModel: string; // single selection or sentinel
    setSelectedModel: (modelId: string) => void;
    selectedModelsMulti: string[]; // for multi-select (Mori)
    setSelectedModelsMulti: (modelIds: string[]) => void;
    isMori: boolean;
    roleDefaultModel?: string; // comma separated IDs for default
    user: any; // SaasUser or similar with subscription_plan_id
    modelSearch: string;
    saveFunction: (val: string | string[]) => void | Promise<void>;
    onClose?: () => void;
    displayMode?: 'family' | 'list';
}

// Helper to determine model tier
const getModelTier = (model: any): string => {
    // Check various metadata fields for level
    const level = model.metadata?.level ||
        model.metadata?.image_output_level ||
        model.metadata?.image_input_level; // fallback

    if (level && (level === 'L1' || level === 'L2' || level === 'L3')) {
        return level;
    }

    // Fallback heuristics if no metadata
    if (model.input_cost_usd > 10 || model.input_cost_hkd > 78) return 'L3';
    // DeepSeek V3/R1 logic or others could be L1/L2
    return 'L2'; // Default fallback? Or maybe L1?
};

const getTierCost = (tier: string): number => {
    switch (tier) {
        case 'L1': return 3;
        case 'L2': return 4;
        case 'L3': return 20;
        default: return 4; // Default to L2 cost
    }
};

export const ModelFamilySelector: React.FC<ModelFamilySelectorProps> = ({
    availableModels,
    selectedModel,
    setSelectedModel,
    selectedModelsMulti,
    setSelectedModelsMulti,
    isMori,
    roleDefaultModel,
    user,
    modelSearch,
    saveFunction,
    onClose,
    displayMode = 'family'
}) => {
    const models = availableModels || [];

    // --- LIST MODE (Flat View) ---
    if (displayMode === 'list') {
        // Filter by search
        const filteredModels = models.filter((m: any) =>
            !modelSearch.trim() || m.display_name?.toLowerCase().includes(modelSearch.toLowerCase())
        );

        // Sort by tier (L3 -> L2 -> L1) then name? Or just name?
        // User didn't specify sort, but grouping by tier might be nice.
        // For now keep simple sort by cost/tier.
        filteredModels.sort((a, b) => {
            const tierA = getModelTier(a);
            const tierB = getModelTier(b);
            const costA = getTierCost(tierA);
            const costB = getTierCost(tierB);
            // Expensive first ?
            return costB - costA;
        });

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto px-1">
                {filteredModels.map((model: any) => {
                    const isSelected = selectedModel === model.model_id;
                    const tier = getModelTier(model);
                    const cost = getTierCost(tier);

                    return (
                        <button
                            key={model.model_id}
                            onClick={() => {
                                setSelectedModel(model.model_id);
                                saveFunction(model.model_id);
                                if (onClose) onClose();
                            }}
                            className={`flex items-center p-3 rounded-xl border-2 transition-all text-left group hover:shadow-md
                                ${isSelected
                                    ? 'bg-[#FFF9F2] border-[#FFD59A] shadow-sm'
                                    : 'bg-white border-gray-100 hover:border-[#FFD59A]/30'
                                }`}
                        >
                            <div className={`p-2 rounded-lg mr-3 ${isSelected ? 'bg-[#FFD59A] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#FFF4E3] group-hover:text-[#AAA]'}`}>
                                <CpuChipIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-[#4B4036] truncate">
                                    {model.display_name}
                                </div>
                                <div className="text-xs text-[#8A7A70] flex items-center space-x-1 mt-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                        ${tier === 'L1' ? 'bg-gray-100 text-gray-600' :
                                            tier === 'L2' ? 'bg-amber-50 text-amber-700' :
                                                'bg-stone-800 text-stone-200'}
                                    `}>
                                        {tier}
                                    </span>
                                    <span className="flex items-center text-[#B0A090]">
                                        • {cost} <span className="text-[10px] ml-0.5">🍎</span>
                                    </span>
                                </div>
                            </div>
                            {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#FFD59A] flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    // --- FAMILY MODE (Grouped View) ---
    const families: Record<string, any[]> = {};
    const ALLOWED_FAMILIES = ['chatgpt', 'gemini', 'claude', 'grok', 'deepseek', 'qwen'];

    models.forEach((m: any) => {
        // Filter by search
        if (modelSearch.trim() && !m.display_name?.toLowerCase().includes(modelSearch.toLowerCase())) {
            return;
        }

        // Determine Family Key: Priority metadata.family -> provider
        let familyKey = 'Other';

        if (m.metadata?.family) {
            familyKey = m.metadata.family.toLowerCase();
        } else if (m.provider) {
            familyKey = m.provider.toLowerCase();
        }

        // Normalize keys to match ALLOWED_FAMILIES
        if (familyKey === 'openai') familyKey = 'chatgpt';
        if (familyKey === 'google') familyKey = 'gemini';
        if (familyKey === 'anthropic') familyKey = 'claude';
        if (familyKey === 'xai' || familyKey === 'x-ai') familyKey = 'grok';
        if (familyKey === 'alibaba') familyKey = 'qwen';

        // Initialize group if needed
        if (!families[familyKey]) families[familyKey] = [];
        // Dedup models by ID
        if (!families[familyKey].some((exist: any) => exist.model_id === m.model_id)) {
            families[familyKey].push(m);
        }
    });

    // 6 Main Families Order
    const sortedFamilies = ALLOWED_FAMILIES
        .map(key => [key, families[key] || []])
        .filter(([_, models]) => (models as any[]).length > 0) as [string, any[]][];

    // Determine plan status for cost display
    const isFreePlan = !user?.subscription_plan_id || user?.subscription_plan_id === 'free';

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            {sortedFamilies.map(([familyKey, familyModels]) => {
                if (familyModels.length === 0) return null;

                const displayName = FAMILY_DISPLAY_NAMES[familyKey] ||
                    // Capitalize first letter if not in map
                    familyKey.charAt(0).toUpperCase() + familyKey.slice(1);

                // Sort models by cost (USD or HKD converted)
                familyModels.sort((a, b) => {
                    const costA = a.input_cost_usd || (a.input_cost_hkd ? a.input_cost_hkd / 7.8 : 0);
                    const costB = b.input_cost_usd || (b.input_cost_hkd ? b.input_cost_hkd / 7.8 : 0);
                    return costA - costB;
                });

                // Identify Tiers: Smart Classification
                let remainingModels = [...familyModels];
                let l1Model: any = null;
                let l2Model: any = null;
                let l3Model: any = null;



                // 1. Strict Metadata Matching First (Prefer non-backup)
                l1Model = remainingModels.find(m => m.metadata?.level === 'L1' && !m.metadata?.is_backup) || remainingModels.find(m => m.metadata?.level === 'L1');
                if (l1Model) remainingModels = remainingModels.filter(m => m.model_id !== l1Model?.model_id);

                l3Model = remainingModels.find(m => m.metadata?.level === 'L3' && !m.metadata?.is_backup) || remainingModels.find(m => m.metadata?.level === 'L3');
                if (l3Model) remainingModels = remainingModels.filter(m => m.model_id !== l3Model?.model_id);

                l2Model = remainingModels.find(m => m.metadata?.level === 'L2' && !m.metadata?.is_backup) || remainingModels.find(m => m.metadata?.level === 'L2');
                if (l2Model) remainingModels = remainingModels.filter(m => m.model_id !== l2Model?.model_id);

                // 2. Heuristic Matching (if slots empty)

                // L3 Heuristics (Pro/Ultra/Opus - usually expensive or explicit high-end names)
                if (!l3Model) {
                    l3Model = remainingModels.find(m =>
                        m.model_id.includes('ultra') ||
                        m.model_id.includes('opus') ||
                        (m.display_name && m.display_name.toLowerCase().includes('ultra')) ||
                        (m.input_cost_usd && m.input_cost_usd > 10) || // > $10 USD
                        (m.input_cost_hkd && m.input_cost_hkd > 78) // > $100 HKD approx (safe margin)
                    );
                    if (l3Model) remainingModels = remainingModels.filter(m => m.model_id !== l3Model?.model_id);
                }

                // L1 Heuristics (Mini/Flash/Haiku - cheap/fast)
                if (!l1Model) {
                    l1Model = remainingModels.find(m =>
                        m.model_id.includes('mini') ||
                        m.model_id.includes('flash') ||
                        m.model_id.includes('haiku') ||
                        m.model_id.includes('micro') ||
                        m.is_free
                    );
                    if (l1Model) remainingModels = remainingModels.filter(m => m.model_id !== l1Model?.model_id);
                }

                // L2 Heuristics (Pro/Plus/Standard - middle ground)
                if (!l2Model) {
                    l2Model = remainingModels.find(m =>
                        m.model_id.includes('pro') ||
                        m.model_id.includes('plus') ||
                        m.model_id.includes('turbo')
                    );
                    if (l2Model) remainingModels = remainingModels.filter(m => m.model_id !== l2Model?.model_id);
                }

                // 3. Fallback / Leftover Distribution
                if (remainingModels.length > 0) {
                    // Sort remaining by cost
                    remainingModels.sort((a, b) => {
                        const costA = a.input_cost_usd || 0;
                        const costB = b.input_cost_usd || 0;
                        return costA - costB;
                    });

                    // Fill null slots from remaining
                    if (!l1Model) {
                        l1Model = remainingModels.shift();
                    }

                    if (!l3Model && remainingModels.length > 0) {
                        l3Model = remainingModels.pop();
                    }

                    if (!l2Model && remainingModels.length > 0) {
                        l2Model = remainingModels.shift();
                    }
                }

                let isFamilyActive = false;

                if (isMori) {
                    if (selectedModel === DEFAULT_MODEL_SENTINEL) {
                        const defaults = roleDefaultModel?.split(',').map((s: string) => s.trim()) || [];
                        isFamilyActive = familyModels.some(m => defaults.includes(m.model_id));
                    } else {
                        isFamilyActive = familyModels.some(m => selectedModelsMulti?.includes(m.model_id));
                    }
                } else {
                    isFamilyActive = familyModels.some(m => m.model_id === selectedModel);
                }


                const tiers = [
                    { label: 'L1', model: l1Model, desc: '綜合', costVal: isFreePlan ? 3 : '無限用' },
                    { label: 'L2', model: l2Model, desc: '思考', costVal: 4 },
                    { label: 'L3', model: l3Model, desc: '研究', costVal: 20 }
                ].filter(t => t.model);

                const uniqueTiers = tiers;

                return (
                    <div key={familyKey} className={`group rounded-3xl transition-all duration-300 ${isFamilyActive
                        ? 'bg-[#FFF5EB] shadow-md shadow-orange-100'
                        : 'bg-white shadow-sm hover:shadow-md hover:bg-[#FAFAFA]'
                        }`}>
                        {/* Family Header */}
                        <div>
                            <div className="flex items-center space-x-4">
                                <div className={`p-2.5 rounded-2xl transition-colors ${isFamilyActive ? 'bg-[#FFD8B1] text-[#5D4037]' : 'bg-[#F5F5F0] text-[#8D6E63] group-hover:bg-[#FFD8B1]/50'}`}>
                                    <CpuChipIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className={`block font-bold text-lg ${isFamilyActive ? 'text-[#5D4037]' : 'text-[#8D6E63]'}`}>{displayName}</span>
                                    <span className="text-xs text-[#BCAAA4] font-medium tracking-wide">AI 家族</span>
                                </div>
                            </div>
                            {isFamilyActive && (
                                <div className="h-2.5 w-2.5 rounded-full bg-[#FFB6C1] shadow-sm" />
                            )}
                        </div>

                        {/* Tiers Toggles */}
                        <div className="px-5 pb-5 pt-1 flex space-x-3">
                            {
                                uniqueTiers.map((tier) => {
                                    const m = tier.model;
                                    let isTierSelected = false;

                                    if (isMori) {
                                        if (selectedModel === DEFAULT_MODEL_SENTINEL) {
                                            const defaults = roleDefaultModel?.split(',').map((s: string) => s.trim()) || [];
                                            isTierSelected = defaults.includes(m.model_id);
                                        } else {
                                            isTierSelected = selectedModelsMulti?.includes(m.model_id) || false;
                                        }
                                    } else {
                                        isTierSelected = selectedModel === m.model_id;
                                    }

                                    return (
                                        <button
                                            key={m.model_id}
                                            onMouseDown={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // Import toast dynamically or pass as prop? Assuming react-hot-toast is available as standard.
                                                const { default: toast } = await import('react-hot-toast');

                                                if (isMori) {
                                                    let currentSelection = [...(selectedModelsMulti || [])];
                                                    if (selectedModel === DEFAULT_MODEL_SENTINEL) {
                                                        setSelectedModel('');
                                                        currentSelection = [];
                                                    }
                                                    if (currentSelection.includes(m.model_id)) {
                                                        currentSelection = currentSelection.filter(id => id !== m.model_id);
                                                    } else {
                                                        if (currentSelection.length >= 4) {
                                                            toast.error('最多選擇 4 個模型');
                                                            return;
                                                        }
                                                        currentSelection.push(m.model_id);
                                                    }
                                                    setSelectedModelsMulti(currentSelection);
                                                } else {
                                                    setSelectedModel(m.model_id);
                                                    saveFunction(m.model_id);
                                                    toast.success(`已選擇 ${displayName} ${tier.label}`);
                                                }
                                            }}
                                            className={`flex-1 py-3 px-2 rounded-2xl text-xs font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 ${isTierSelected
                                                ? tier.label === 'L1'
                                                    ? 'bg-[#FAFAFA] text-[#727272] border border-gray-100 shadow-md transform scale-[1.02]'
                                                    : tier.label === 'L2'
                                                        ? 'bg-[#FDF3C8] text-[#5D4037] border border-[#FDF3C8] shadow-md transform scale-[1.02]'
                                                        : 'bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] text-white shadow-md transform scale-[1.02]'
                                                : 'bg-[#F5F5F0] text-[#8D6E63] hover:bg-[#EFEBE9] hover:text-[#5D4037]'
                                                }`}
                                        >
                                            <span className="font-extrabold text-sm">{tier.label}</span>
                                            <span className="w-full text-center opacity-80 truncate px-1 scale-90 font-medium">{tier.desc}</span>
                                            <span className={`text-[10px] whitespace-nowrap opacity-75 font-semibold flex items-center justify-center gap-0.5 ${isTierSelected ? (tier.label === 'L1' ? 'text-gray-500' : tier.label === 'L2' ? 'text-[#5D4037]/80' : 'text-white/90') : 'text-[#8D6E63]/70'
                                                }`}>
                                                {typeof tier.costVal === 'number' ? (
                                                    <>
                                                        {tier.costVal}
                                                        <img src="/apple-icon.svg" alt="food" className="w-3 h-3 -mt-0.5" />
                                                    </>
                                                ) : (
                                                    tier.costVal
                                                )}
                                            </span>
                                        </button>
                                    );
                                })
                            }
                        </div>
                    </div>
                );
            })}

            {/* Footer for Multi-select Confirm (Mori only) */}
            {isMori && (
                <div className="p-4 border-t border-[#EADBC8] bg-[#F8F5EC] flex items-center justify-between rounded-b-lg">
                    <div className="text-xs text-[#4B4036] font-medium">
                        已選 {selectedModelsMulti?.length || 0} / 4 (至少 2 個)
                    </div>
                    <button
                        onMouseDown={async (e) => {
                            e.preventDefault();
                            const { default: toast } = await import('react-hot-toast');
                            try {
                                const selection = selectedModelsMulti || [];
                                if (selection.length < 2) {
                                    toast.error('請至少選擇 2 個模型');
                                    return;
                                }
                                await saveFunction(selection);
                                onClose?.();
                                toast.success('模型設定已更新');
                            } catch (err) {
                                console.error(err);
                                toast.error('儲存失敗');
                            }
                        }}
                        className="px-4 py-2 bg-[#FFD59A] hover:bg-[#FFC570] text-[#4B4036] font-bold rounded-lg transition-colors shadow-sm"
                    >
                        確認選擇
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper Subcomponent for Buttons
const ModelButton = ({ model, tierLabel, isSelected, onClick, isFreePlan }: any) => {
    let baseClasses = "flex flex-col items-start justify-center p-2 rounded-lg text-left transition-all w-full h-full min-h-[50px] relative border";
    let bgClass = "bg-white border-gray-200 hover:border-[#FFD59A]/50";
    let textClass = "text-[#4B4036]";

    if (isSelected) {
        if (tierLabel === 'L1') {
            bgClass = "bg-[#FAFAFA] border-gray-200 shadow-sm"; // Cool Gray
            textClass = "text-[#727272]";
        } else if (tierLabel === 'L2') {
            bgClass = "bg-[#FDF3C8] border-[#FDF3C8] shadow-sm"; // Butter
            textClass = "text-[#5D4037]";
        } else if (tierLabel === 'L3') {
            bgClass = "bg-gradient-to-br from-[#4A3B32] to-[#2C241F] border-transparent shadow-md"; // Dark Brown
            textClass = "text-[#EADBC8]";
        } else {
            bgClass = "bg-[#FFF9F2] border-[#FFD59A] shadow-sm"; // Default selected
            textClass = "text-[#4B4036]";
        }
    }

    // Determine cost to display
    const tierCost = getTierCost(tierLabel);

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${bgClass}`}
        >
            <div className="flex items-center space-x-1.5 w-full">
                <div className="font-semibold text-xs truncate flex-1 leading-tight text-left" style={{ color: isSelected && tierLabel === 'L3' ? '#EADBC8' : 'inherit' }}>
                    {model.display_name?.replace('ChatGPT', '').replace('Gemini', '').replace('Claude', '').trim() || model.model_id}
                </div>
                {isSelected && (
                    <div className="shrink-0 text-amber-500">
                        <SparklesIcon className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
            <div className="mt-1 flex items-center text-[10px]" style={{ color: isSelected && tierLabel === 'L3' ? '#D7CCC8' : '#8A7A70' }}>
                {(tierLabel === 'L1' && isFreePlan) ? (
                    <span>3 <span className="text-[8px]">🍎</span></span>
                ) : (
                    <span>{tierCost} <span className="text-[8px]">🍎</span></span>
                )}
                {tierLabel === 'L1' && !isFreePlan && <span className="ml-1">無限</span>}
            </div>
        </button>
    );
};

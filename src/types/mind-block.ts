export interface MindBlockAST {
  blocks: MindBlockNode[];
}

export type MindBlockType = 'role' | 'style' | 'context' | 'rule' | 'task' | 'variable' | 'search' | 'reason' | 'output';

export interface MindBlockNode {
  id: string;
  type: MindBlockType;
  params: {
    // Common params
    content?: string; // The main text content (e.g., "You are a chef")
    label?: string;   // User-friendly label (e.g., "Chef Persona")

    // Specific params (can be expanded)
    variableName?: string; // For 'variable' type
    defaultValue?: string; // For 'variable' type

    // Legacy/Flow params (kept for compatibility if needed)
    query?: string;
    prompt?: string;
    [key: string]: any;
  };
  children?: MindBlockNode[]; // For containers
}

export interface MindBlock {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  content_json: MindBlockAST;
  compiled_prompt: string | null;
  is_public: boolean;
  is_official: boolean;
  forked_from_id: string | null;
  usage_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;

  // Library & Template fields
  category?: string;
  tags?: string[];
  is_template?: boolean;
  block_type?: MindBlockType; // If it's a single-block template
}

export interface RoleMindBlock {
  id: string;
  role_id: string;
  mind_block_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
}

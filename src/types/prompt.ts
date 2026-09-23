export type PromptCategory = 'random' | 'motivation' | 'fun_fact' | 'tongue_twister';
export type ConcretePromptCategory = Exclude<PromptCategory, 'random'>;
export type PromptDifficulty = 'easy' | 'normal' | 'hard';

export type Prompt = {
  id: string;
  text: string;
  category: ConcretePromptCategory;
  difficulty: PromptDifficulty;
};

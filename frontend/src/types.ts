export type Level = 'clear' | 'partial' | 'missing';
export type Criterion = {key: 'relevance'|'ownership'|'reasoning'|'outcome'; label: string; level: Level; quote: string; feedback: string};
export type Question = {question: string; topic: string; resume_quote: string; job_quote: string; why: string};
export type Assessment = {summary: string; criteria: Criterion[]; followup: string; followup_reason: string; next_step: string; resume_hint_quote: string; resume_hint: string};
export type Attempt = {answer: string; assessment: Assessment};
export type Round = {question: Question; first?: Attempt; followup?: Attempt; retry?: Attempt; retries?: number};
export type Engine = 'local' | 'ai';

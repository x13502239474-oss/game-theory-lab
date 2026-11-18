export type QType = 'single' | 'multi' | 'judge' | 'scenario';

export interface Question {
  /** 全局唯一，形如 L01-1 */
  id: string;
  qtype: QType;
  stem: string;
  /** 单选/多选选项，形如 ['A. ...','B. ...'] */
  options?: string[];
  /** 单选 'B'；多选 ['A','C']；判断 true/false；情景题不使用该字段 */
  answer?: string | string[] | boolean;
  /** 情景分析题：每组是同义词数组，命中组数 ≥70% 判对 */
  keywords?: string[][];
  explanation: string;
}

export interface Lesson {
  id: string;
  no: number;
  stage: number;
  title: string;
  subtitle: string;
  minutes: number;
  /** 概念标签（展示用） */
  concepts: string[];
  goals: string[];
  /** 关联实验 id，见 lab/index */
  lab?: string;
  /** 与教材的对应关系说明 */
  source: string;
  content: string;
  quiz: Question[];
}

export interface Stage {
  no: number;
  title: string;
  en: string;
  summary: string;
  lessons: Lesson[];
  lab?: string;
}

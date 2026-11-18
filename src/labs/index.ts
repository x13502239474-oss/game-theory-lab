import type { ComponentType } from 'react';
import PrisonerDilemma from './PrisonerDilemma';
import PriceWar from './PriceWar';
import RepeatedGame from './RepeatedGame';
import Bargaining from './Bargaining';
import MarketEntry from './MarketEntry';
import Signaling from './Signaling';

export interface LabMeta {
  id: string;
  no: string;
  title: string;
  en: string;
  one: string;
  stage: number;
  lessons: string[];
  Comp: ComponentType;
}

export const LABS: LabMeta[] = [
  {
    id: 'pd',
    no: '01',
    title: '囚徒困境',
    en: 'PRISONER\'S DILEMMA',
    one: '在两个格子里看清「个人理性导致集体非最优」。',
    stage: 2,
    lessons: ['L10', 'L11'],
    Comp: PrisonerDilemma,
  },
  {
    id: 'price',
    no: '02',
    title: '价格战',
    en: 'PRICE COMPETITION',
    one: '调成本、调规模、调对手定价，看利润曲线被压平。',
    stage: 6,
    lessons: ['L41', 'L09'],
    Comp: PriceWar,
  },
  {
    id: 'repeat',
    no: '03',
    title: '重复博弈',
    en: 'REPEATED GAME',
    one: '与四种策略的对手反复对局，观察合作如何建立与崩塌。',
    stage: 4,
    lessons: ['L26', 'L28'],
    Comp: RepeatedGame,
  },
  {
    id: 'bargain',
    no: '04',
    title: '讨价还价',
    en: 'BARGAINING',
    one: '分配 100 单位资源，体验耐心与底线的价格。',
    stage: 6,
    lessons: ['L42', 'L15'],
    Comp: Bargaining,
  },
  {
    id: 'entry',
    no: '05',
    title: '市场进入',
    en: 'MARKET ENTRY',
    one: '走一遍博弈树，亲手测试威胁何时变得可信。',
    stage: 3,
    lessons: ['L21', 'L23', 'L24'],
    Comp: MarketEntry,
  },
  {
    id: 'signal',
    no: '06',
    title: '信号传递',
    en: 'SIGNALING',
    one: '只有你知道质量，靠浪费性的投入让消费者相信你。',
    stage: 5,
    lessons: ['L36', 'L38'],
    Comp: Signaling,
  },
];

export const LAB_MAP = Object.fromEntries(LABS.map((l) => [l.id, l]));

export type Level = 'Pre-A1' | 'A1' | 'A2' | 'B1' | 'B2'

// Scene / thematic category groups used for associative learning (v3 生活场景版).
export type CategoryId =
  | 'people'      // 人物与关系
  | 'body'        // 身体部位
  | 'health'      // 健康医疗
  | 'clothes'     // 衣着配饰
  | 'food'        // 食物与饮料
  | 'home'        // 家居与生活
  | 'animals'     // 动物
  | 'nature'      // 自然与天气
  | 'space'       // 方位与空间
  | 'time'        // 时间与频率
  | 'numbers'     // 数字与数量
  | 'colors'      // 颜色
  | 'size'        // 外形与尺寸
  | 'actions'     // 动作行为
  | 'emotions'    // 情感与感受
  | 'communication' // 沟通与语言
  | 'education'   // 学习教育
  | 'work'        // 工作与职业
  | 'travel'      // 旅行与交通
  | 'shopping'    // 购物与金钱
  | 'society'     // 社会与世界
  | 'science'     // 科学与技术
  | 'media'       // 媒体与网络
  | 'arts'        // 艺术与娱乐
  | 'thinking'    // 思维与概念
  | 'grammar'     // 基础功能词
  | 'questions'   // 疑问词
  | 'toys'        // 玩具与游戏

export interface CategoryMeta {
  id: CategoryId
  label: string   // 中文场景名
  en: string      // 英文场景名
  order: number   // 显示顺序
}

export interface Example {
  en: string
  zh: string
}

export interface Word {
  word: string
  level: Level
  ipa: string
  pos: string
  meaning: string
  examples: Example[]
  /** Scene category (assigned from categories.ts); used for grouped display. */
  category?: CategoryId
  /** High-frequency / everyday word — shown as 常用. */
  common?: boolean
  /** Marked true for words from the supplementary extension package (not in the
   *  official CEFR list); shown with an 扩展/补充 badge and excluded from stats. */
  extended?: boolean
}

export interface LevelMeta {
  id: Level
  label: string
  desc: string
  /** Tailwind-ish accent color token */
  accent: string
}

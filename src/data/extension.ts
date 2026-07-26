// LexiCore · 扩展/补充词库 (EXTENSION)
// 这些词来自旧版精解词库，但不在官方 CEFR 分级 PDF 提取结果中；
// 其中『该级别日常表达常用』的词已归入对应等级（见 a1/a2/b1/b2.ts，标记 extended）。
// 本文件仅保留未归入等级的扩展词，仍标记 extended: true，不计入官方统计。
import type { Word } from './types'

export const EXTENSION: Word[] = [
  { word: 'abolish', level: 'B2', ipa: '/əˈbɒlɪʃ/', pos: 'v.', meaning: '废除；废止', examples: [
    { en: 'The law was abolished.', zh: '这项法律被废除了。' },
    { en: 'They wanted to abolish slavery.', zh: '他们想废除奴隶制。' }
  ], extended: true },
  { word: 'abstract', level: 'B2', ipa: '/ˈæbstrækt/', pos: 'adj.', meaning: '抽象的', examples: [
    { en: 'This idea is too abstract.', zh: '这个想法太抽象了。' },
    { en: 'He prefers abstract art.', zh: '他更喜欢抽象艺术。' }
  ], extended: true },
  { word: 'accomplish', level: 'B2', ipa: '/əˈkʌmplɪʃ/', pos: 'v.', meaning: '完成；实现', examples: [
    { en: 'We accomplished the task.', zh: '我们完成了任务。' },
    { en: 'He accomplished his dream.', zh: '他实现了梦想。' }
  ], extended: true },
  { word: 'advocate', level: 'B2', ipa: '/ˈædvəkeɪt/', pos: 'v.', meaning: '倡导', examples: [
    { en: 'She advocates healthy eating.', zh: '她倡导健康饮食。' },
    { en: 'They advocate change.', zh: '他们倡导变革。' }
  ], extended: true },
  { word: 'alert', level: 'B2', ipa: '/əˈlɜːt/', pos: 'adj.', meaning: '警觉的', examples: [
    { en: 'Stay alert on the road.', zh: '在路上要保持警觉。' },
    { en: 'The dog is alert.', zh: '狗很警觉。' }
  ], extended: true },
  { word: 'alien', level: 'B2', ipa: '/ˈeɪliən/', pos: 'n.', meaning: '外星人；外侨', examples: [
    { en: 'The film is about aliens.', zh: '这部电影讲外星人。' },
    { en: 'He felt like an alien here.', zh: '他在这里感觉像个异乡人。' }
  ], extended: true },
  { word: 'ambiguous', level: 'B2', ipa: '/æmˈbɪɡjuəs/', pos: 'adj.', meaning: '模棱两可的', examples: [
    { en: 'His answer was ambiguous.', zh: '他的回答含糊不清。' },
    { en: 'Avoid ambiguous words.', zh: '避免模棱两可的词。' }
  ], extended: true },
  { word: 'ancestor', level: 'B2', ipa: '/ˈænsestə(r)/', pos: 'n.', meaning: '祖先', examples: [
    { en: 'My ancestors came from Italy.', zh: '我的祖先来自意大利。' },
    { en: 'These customs honour our ancestors.', zh: '这些习俗纪念我们的祖先。' }
  ], extended: true },
  { word: 'applaud', level: 'B2', ipa: '/əˈplɔːd/', pos: 'v.', meaning: '鼓掌', examples: [
    { en: 'The crowd applauded.', zh: '人群鼓起掌来。' },
    { en: 'We applaud her effort.', zh: '我们为她的努力鼓掌。' }
  ], extended: true },
  { word: 'approximate', level: 'B2', ipa: '/əˈprɒksɪmət/', pos: 'adj.', meaning: '大约的', examples: [
    { en: 'The cost is approximate.', zh: '费用只是大概。' },
    { en: 'Give an approximate number.', zh: '给一个近似的数字。' }
  ], extended: true },
  { word: 'arbitrary', level: 'B2', ipa: '/ˈɑːbɪtrəri/', pos: 'adj.', meaning: '任意的；武断的', examples: [
    { en: 'That was an arbitrary choice.', zh: '那是随意的选择。' },
    { en: 'The rule seems arbitrary.', zh: '这规定似乎很武断。' }
  ], extended: true },
  { word: 'arouse', level: 'B2', ipa: '/əˈraʊz/', pos: 'v.', meaning: '唤起；激起', examples: [
    { en: 'The speech aroused interest.', zh: '演讲引起了兴趣。' },
    { en: 'It aroused my curiosity.', zh: '它激起了我的好奇心。' }
  ], extended: true },
  { word: 'articulate', level: 'B2', ipa: '/ɑːˈtɪkjuleɪt/', pos: 'adj.', meaning: '表达清晰的', examples: [
    { en: 'She is very articulate.', zh: '她表达很清晰。' },
    { en: 'He articulated his view.', zh: '他清楚地表达了自己的观点。' }
  ], extended: true },
  { word: 'assemble', level: 'B2', ipa: '/əˈsembl/', pos: 'v.', meaning: '组装；集合', examples: [
    { en: 'We assembled the furniture.', zh: '我们组装了家具。' },
    { en: 'The team assembled.', zh: '队伍集合了。' }
  ], extended: true },
  { word: 'assert', level: 'B2', ipa: '/əˈsɜːt/', pos: 'v.', meaning: '断言；坚持', examples: [
    { en: 'He asserted his rights.', zh: '他维护自己的权利。' },
    { en: 'She asserted it was true.', zh: '她坚称那是真的。' }
  ], extended: true },
  { word: 'assign', level: 'B2', ipa: '/əˈsaɪn/', pos: 'v.', meaning: '分配；指派', examples: [
    { en: 'She assigned us tasks.', zh: '她给我们分配了任务。' },
    { en: 'I was assigned a room.', zh: '我被安排了一个房间。' }
  ], extended: true },
  { word: 'assure', level: 'B2', ipa: '/əˈʃʊə(r)/', pos: 'v.', meaning: '向…保证', examples: [
    { en: 'I assure you it is safe.', zh: '我向你保证这很安全。' },
    { en: 'He assured her of his love.', zh: '他向她保证他的爱。' }
  ], extended: true },
  { word: 'attain', level: 'B2', ipa: '/əˈteɪn/', pos: 'v.', meaning: '达到；获得', examples: [
    { en: 'She attained her goal.', zh: '她达到了目标。' },
    { en: 'They attained success.', zh: '他们获得了成功。' }
  ], extended: true },
  { word: 'attribute', level: 'B2', ipa: '/əˈtrɪbjuːt/', pos: 'v.', meaning: '把…归因于', examples: [
    { en: 'We attribute it to luck.', zh: '我们把它归因于运气。' },
    { en: 'She attributed the win to hard work.', zh: '她把胜利归功于努力。' }
  ], extended: true },
  { word: 'automatic', level: 'B2', ipa: '/ˌɔːtəˈmætɪk/', pos: 'adj.', meaning: '自动的', examples: [
    { en: 'The door is automatic.', zh: '门是自动的。' },
    { en: 'It has an automatic system.', zh: '它有一套自动系统。' }
  ], extended: true },
  { word: 'badge', level: 'B2', ipa: '/bædʒ/', pos: 'n.', meaning: '徽章', examples: [
    { en: 'He wore a red badge.', zh: '他戴着一个红色徽章。' },
    { en: 'The badge shows his rank.', zh: '徽章显示他的级别。' }
  ], extended: true },
  { word: 'behalf', level: 'B2', ipa: '/bɪˈhɑːf/', pos: 'n.', meaning: '利益；代表', examples: [
    { en: 'I speak on his behalf.', zh: '我代表他发言。' },
    { en: 'We did it on your behalf.', zh: '我们为你做了这事。' }
  ], extended: true },
  { word: 'bias', level: 'B2', ipa: '/ˈbaɪəs/', pos: 'n.', meaning: '偏见', examples: [
    { en: 'The report shows a bias.', zh: '报告显示出偏见。' },
    { en: 'He has no bias.', zh: '他没有偏见。' }
  ], extended: true },
  { word: 'bound', level: 'B2', ipa: '/baʊnd/', pos: 'adj.', meaning: '必然的；受约束的', examples: [
    { en: 'We are bound to win.', zh: '我们必胜。' },
    { en: 'He is bound by the rules.', zh: '他受规则约束。' }
  ], extended: true },
  { word: 'boundary', level: 'B2', ipa: '/ˈbaʊndri/', pos: 'n.', meaning: '边界；界限', examples: [
    { en: 'The river marks the boundary.', zh: '这条河是边界线。' },
    { en: 'We set a clear boundary.', zh: '我们划定了清晰的界限。' }
  ], extended: true },
  { word: 'broaden', level: 'B2', ipa: '/ˈbrɔːdn/', pos: 'v.', meaning: '拓宽', examples: [
    { en: 'Travel broadens the mind.', zh: '旅行开阔眼界。' },
    { en: 'We broadened the road.', zh: '我们拓宽了道路。' }
  ], extended: true },
  { word: 'burden', level: 'B2', ipa: '/ˈbɜːdn/', pos: 'n./v.', meaning: '负担', examples: [
    { en: 'The debt is a burden.', zh: '债务是个负担。' },
    { en: 'Do not burden yourself.', zh: '别给自己太大负担。' }
  ], extended: true },
  { word: 'caution', level: 'B2', ipa: '/ˈkɔːʃn/', pos: 'n./v.', meaning: '小心；警告', examples: [
    { en: 'Use caution near the road.', zh: '在路边要小心。' },
    { en: 'She cautioned me about the risk.', zh: '她提醒我注意风险。' }
  ], extended: true },
  { word: 'cease', level: 'B2', ipa: '/siːs/', pos: 'v.', meaning: '停止；终止', examples: [
    { en: 'The rain ceased at noon.', zh: '雨在中午停了。' },
    { en: 'They ceased to argue.', zh: '他们停止了争论。' }
  ], extended: true },
  { word: 'circuit', level: 'B2', ipa: '/ˈsɜːkɪt/', pos: 'n.', meaning: '电路；巡回', examples: [
    { en: 'The circuit is broken.', zh: '电路断了。' },
    { en: 'He ran a circuit in the park.', zh: '他在公园里绕圈跑。' }
  ], extended: true },
  { word: 'cling', level: 'B2', ipa: '/klɪŋ/', pos: 'v.', meaning: '紧抱；依附；坚持', examples: [
    { en: 'The child clung to his mother.', zh: '孩子紧抱着母亲。' },
    { en: 'Do not cling to the past.', zh: '别拘泥于过去。' }
  ], extended: true },
  { word: 'combat', level: 'B2', ipa: '/ˈkɒmbæt/', pos: 'n./v.', meaning: '战斗；搏斗', examples: [
    { en: 'They combat crime.', zh: '他们打击犯罪。' },
    { en: 'In combat, training matters.', zh: '战斗中训练很重要。' }
  ], extended: true },
  { word: 'comprise', level: 'B2', ipa: '/kəmˈpraɪz/', pos: 'v.', meaning: '包含；由……组成', examples: [
    { en: 'The course comprises ten units.', zh: '这门课包含十个单元。' },
    { en: 'Women comprise half the team.', zh: '女性占团队的一半。' }
  ], extended: true },
  { word: 'confront', level: 'B2', ipa: '/kənˈfrʌnt/', pos: 'v.', meaning: '面对；对抗', examples: [
    { en: 'We must confront the truth.', zh: '我们必须面对真相。' },
    { en: 'He confronted his fear.', zh: '他直面了自己的恐惧。' }
  ], extended: true },
  { word: 'consent', level: 'B2', ipa: '/kənˈsent/', pos: 'n./v.', meaning: '同意；准许', examples: [
    { en: 'He gave his consent.', zh: '他同意了。' },
    { en: 'She consented to the plan.', zh: '她同意了计划。' }
  ], extended: true },
  { word: 'consult', level: 'B2', ipa: '/kənˈsʌlt/', pos: 'v.', meaning: '咨询；查阅', examples: [
    { en: 'Consult a doctor first.', zh: '先咨询医生。' },
    { en: 'I consulted the map.', zh: '我查了地图。' }
  ], extended: true },
  { word: 'controversy', level: 'B2', ipa: '/ˈkɒntrəvɜːsi/', pos: 'n.', meaning: '争议', examples: [
    { en: 'The plan caused controversy.', zh: '这个计划引发了争议。' },
    { en: 'There is much controversy.', zh: '存在很多争议。' }
  ], extended: true },
  { word: 'correspond', level: 'B2', ipa: '/ˌkɒrəˈspɒnd/', pos: 'v.', meaning: '符合；通信', examples: [
    { en: 'The result corresponds to the theory.', zh: '结果与理论相符。' },
    { en: 'We corresponded for years.', zh: '我们通信多年。' }
  ], extended: true },
  { word: 'crystal', level: 'B2', ipa: '/ˈkrɪstl/', pos: 'n./adj.', meaning: '水晶；晶莹的', examples: [
    { en: 'She wore a crystal necklace.', zh: '她戴着水晶项链。' },
    { en: 'The water was crystal clear.', zh: '水清澈见底。' }
  ], extended: true },
  { word: 'cultivate', level: 'B2', ipa: '/ˈkʌltɪveɪt/', pos: 'v.', meaning: '耕作；培养', examples: [
    { en: 'They cultivate rice here.', zh: '他们在这里种水稻。' },
    { en: 'Cultivate good habits.', zh: '培养好习惯。' }
  ], extended: true },
  { word: 'dedicate', level: 'B2', ipa: '/ˈdedɪkeɪt/', pos: 'v.', meaning: '致力于；献身', examples: [
    { en: 'She dedicated her life to art.', zh: '她把一生献给了艺术。' },
    { en: 'He dedicated the book to his teacher.', zh: '他把这本书献给了老师。' }
  ], extended: true },
  { word: 'delicate', level: 'B2', ipa: '/ˈdelɪkət/', pos: 'adj.', meaning: '精致的；脆弱的', examples: [
    { en: 'She wore a delicate dress.', zh: '她穿了一条精致的裙子。' },
    { en: 'The situation is delicate.', zh: '情况很微妙。' }
  ], extended: true },
  { word: 'descend', level: 'B2', ipa: '/dɪˈsend/', pos: 'v.', meaning: '下降；下来', examples: [
    { en: 'The plane descended slowly.', zh: '飞机缓缓下降。' },
    { en: 'They descended the stairs.', zh: '他们走下楼梯。' }
  ], extended: true },
  { word: 'diminish', level: 'B2', ipa: '/dɪˈmɪnɪʃ/', pos: 'v.', meaning: '减少；削弱', examples: [
    { en: 'The risk diminished.', zh: '风险降低了。' },
    { en: 'His influence diminished.', zh: '他的影响力减弱了。' }
  ], extended: true },
  { word: 'distinguish', level: 'B2', ipa: '/dɪˈstɪŋɡwɪʃ/', pos: 'v.', meaning: '区分；辨别', examples: [
    { en: 'Can you distinguish the two?', zh: '你能区分这两者吗？' },
    { en: 'He is distinguished by his smile.', zh: '他的微笑让他与众不同。' }
  ], extended: true },
  { word: 'disturb', level: 'B2', ipa: '/dɪˈstɜːb/', pos: 'v.', meaning: '打扰；使不安', examples: [
    { en: 'Sorry to disturb you.', zh: '抱歉打扰你。' },
    { en: 'The news disturbed her.', zh: '这消息让她不安。' }
  ], extended: true },
  { word: 'elaborate', level: 'B2', ipa: '/ɪˈlæbərət/', pos: 'adj./v.', meaning: '详尽的；详述', examples: [
    { en: 'She gave an elaborate plan.', zh: '她给出了详尽的计划。' },
    { en: 'Please elaborate on that.', zh: '请详细说明一下。' }
  ], extended: true },
  { word: 'exceed', level: 'B2', ipa: '/ɪkˈsiːd/', pos: 'v.', meaning: '超过；超出', examples: [
    { en: 'Costs exceeded the budget.', zh: '成本超出了预算。' },
    { en: 'The speed exceeded the limit.', zh: '速度超过了限速。' }
  ], extended: true },
  { word: 'exclude', level: 'B2', ipa: '/ɪkˈskluːd/', pos: 'v.', meaning: '排除；不包括', examples: [
    { en: 'We exclude children under 12.', zh: '12岁以下儿童除外。' },
    { en: 'The fee excludes tax.', zh: '费用不含税。' }
  ], extended: true },
  { word: 'exhibit', level: 'B2', ipa: '/ɪɡˈzɪbɪt/', pos: 'v./n.', meaning: '展出；展品', examples: [
    { en: 'The museum exhibits art.', zh: '博物馆展出艺术品。' },
    { en: 'This is a rare exhibit.', zh: '这是一件稀有展品。' }
  ], extended: true },
  { word: 'facilitate', level: 'B2', ipa: '/fəˈsɪlɪteɪt/', pos: 'v.', meaning: '促进；使便利', examples: [
    { en: 'The app facilitates learning.', zh: '这个应用方便了学习。' },
    { en: 'Good tools facilitate work.', zh: '好工具让工作更顺手。' }
  ], extended: true },
  { word: 'frustrate', level: 'B2', ipa: '/frʌˈstreɪt/', pos: 'v.', meaning: '使沮丧；挫败', examples: [
    { en: 'The delay frustrated him.', zh: '延误让他很沮丧。' },
    { en: 'They frustrated the plan.', zh: '他们破坏了计划。' }
  ], extended: true },
  { word: 'incline', level: 'B2', ipa: '/ɪnˈklaɪn/', pos: 'v.', meaning: '倾向于；使倾斜', examples: [
    { en: 'I incline to agree.', zh: '我倾向于同意。' },
    { en: 'The road inclines upward.', zh: '路向上倾斜。' }
  ], extended: true },
  { word: 'index', level: 'B2', ipa: '/ˈɪndeks/', pos: 'n.', meaning: '索引；指数', examples: [
    { en: 'Check the index at the back.', zh: '看书后的索引。' },
    { en: 'The price index rose.', zh: '物价指数上涨了。' }
  ], extended: true },
  { word: 'inevitable', level: 'B2', ipa: '/ɪnˈevɪtəbl/', pos: 'adj.', meaning: '不可避免的', examples: [
    { en: 'Change is inevitable.', zh: '变化不可避免。' },
    { en: 'An accident was inevitable.', zh: '事故在所难免。' }
  ], extended: true },
  { word: 'infer', level: 'B2', ipa: '/ɪnˈfɜː(r)/', pos: 'v.', meaning: '推断；推论', examples: [
    { en: 'We inferred his mood from his face.', zh: '我们从他的表情推断他的心情。' },
    { en: 'What can you infer?', zh: '你能推断出什么？' }
  ], extended: true },
  { word: 'instant', level: 'B2', ipa: '/ˈɪnstənt/', pos: 'adj./n.', meaning: '立即的；瞬间', examples: [
    { en: 'Instant coffee is quick.', zh: '速溶咖啡很快。' },
    { en: 'He replied in an instant.', zh: '他瞬间就回复了。' }
  ], extended: true },
  { word: 'integrate', level: 'B2', ipa: '/ˈɪntɪɡreɪt/', pos: 'v.', meaning: '整合；融入', examples: [
    { en: 'We integrated the systems.', zh: '我们把系统整合了。' },
    { en: 'She integrated into the team.', zh: '她融入了团队。' }
  ], extended: true },
  { word: 'isolate', level: 'B2', ipa: '/ˈaɪsəleɪt/', pos: 'v.', meaning: '孤立；隔离', examples: [
    { en: 'The village is isolated.', zh: '这个村子与世隔绝。' },
    { en: 'Do not isolate yourself.', zh: '别把自己孤立起来。' }
  ], extended: true },
  { word: 'legitimate', level: 'B2', ipa: '/ləˈdʒɪtɪmət/', pos: 'adj.', meaning: '合法的；合理的', examples: [
    { en: 'It is a legitimate concern.', zh: '这是个合理的担忧。' },
    { en: 'They have a legitimate claim.', zh: '他们的要求是合法的。' }
  ], extended: true },
  { word: 'manipulate', level: 'B2', ipa: '/məˈnɪpjuleɪt/', pos: 'v.', meaning: '操纵；操作', examples: [
    { en: 'He manipulated the data.', zh: '他篡改了数据。' },
    { en: 'She manipulated the tool.', zh: '她操作了工具。' }
  ], extended: true },
  { word: 'negotiate', level: 'B2', ipa: '/nɪˈɡəʊʃieɪt/', pos: 'v.', meaning: '谈判；协商', examples: [
    { en: 'They negotiated a deal.', zh: '他们谈成了一笔交易。' },
    { en: 'We negotiated the price.', zh: '我们议了价。' }
  ], extended: true },
  { word: 'oblige', level: 'B2', ipa: '/əˈblaɪdʒ/', pos: 'v.', meaning: '迫使；帮忙', examples: [
    { en: 'The law obliges us to report.', zh: '法律要求我们必须上报。' },
    { en: 'Could you oblige me?', zh: '能帮我个忙吗？' }
  ], extended: true },
  { word: 'occupation', level: 'B2', ipa: '/ˌɒkjuˈpeɪʃn/', pos: 'n.', meaning: '职业；占用', examples: [
    { en: 'What is your occupation?', zh: '你的职业是什么？' },
    { en: 'The army took occupation.', zh: '军队占领了此地。' }
  ], extended: true },
  { word: 'prevail', level: 'B2', ipa: '/prɪˈveɪl/', pos: 'v.', meaning: '流行；占上风', examples: [
    { en: 'Peace will prevail.', zh: '和平终将获胜。' },
    { en: 'The custom still prevails.', zh: '这个习俗依然存在。' }
  ], extended: true },
  { word: 'rigid', level: 'B2', ipa: '/ˈrɪdʒɪd/', pos: 'adj.', meaning: '僵硬的；严格的', examples: [
    { en: 'The rules are rigid.', zh: '规则很死板。' },
    { en: 'A rigid metal bar.', zh: '一根坚硬的金属杆。' }
  ], extended: true },
  { word: 'scope', level: 'B2', ipa: '/skəʊp/', pos: 'n.', meaning: '范围；余地', examples: [
    { en: 'The scope is limited.', zh: '范围有限。' },
    { en: 'There is scope for improvement.', zh: '还有改进的余地。' }
  ], extended: true },
  { word: 'simulate', level: 'B2', ipa: '/ˈsɪmjuleɪt/', pos: 'v.', meaning: '模拟；假装', examples: [
    { en: 'The model simulates flight.', zh: '这个模型模拟飞行。' },
    { en: 'They simulated the crisis.', zh: '他们模拟了危机。' }
  ], extended: true },
  { word: 'sole', level: 'B2', ipa: '/səʊl/', pos: 'adj.', meaning: '唯一的；单独的', examples: [
    { en: 'He is the sole owner.', zh: '他是唯一的所有者。' },
    { en: 'My sole aim is peace.', zh: '我唯一的目标是和平。' }
  ], extended: true },
  { word: 'subsequent', level: 'B2', ipa: '/ˈsʌbsɪkwənt/', pos: 'adj.', meaning: '随后的；后来的', examples: [
    { en: 'The subsequent events proved it.', zh: '随后的事件证实了这一点。' },
    { en: 'In subsequent years.', zh: '在随后的几年里。' }
  ], extended: true },
  { word: 'substitute', level: 'B2', ipa: '/ˈsʌbstɪtjuːt/', pos: 'n./v.', meaning: '替代物；代替', examples: [
    { en: 'Use oil as a substitute.', zh: '用油作为替代品。' },
    { en: 'She substituted for the teacher.', zh: '她代课。' }
  ], extended: true },
  { word: 'suspend', level: 'B2', ipa: '/səˈspend/', pos: 'v.', meaning: '暂停；悬挂', examples: [
    { en: 'The game was suspended.', zh: '比赛被暂停了。' },
    { en: 'A lamp was suspended above.', zh: '一盏灯悬挂在上方。' }
  ], extended: true },
  { word: 'sustain', level: 'B2', ipa: '/səˈsteɪn/', pos: 'v.', meaning: '维持；支撑', examples: [
    { en: 'The bridge sustains heavy load.', zh: '桥承受着重载。' },
    { en: 'We must sustain growth.', zh: '我们必须维持增长。' }
  ], extended: true },
  { word: 'tackle', level: 'B2', ipa: '/ˈtækl/', pos: 'v.', meaning: '处理；应对', examples: [
    { en: 'We must tackle the issue.', zh: '我们必须处理这个问题。' },
    { en: 'He tackled the task bravely.', zh: '他勇敢地应对了任务。' }
  ], extended: true },
  { word: 'theoretical', level: 'B2', ipa: '/ˌθɪəˈretɪkl/', pos: 'adj.', meaning: '理论的', examples: [
    { en: 'This is a theoretical model.', zh: '这是个理论模型。' },
    { en: 'He has theoretical knowledge.', zh: '他有理论知识。' }
  ], extended: true },
  { word: 'undergo', level: 'B2', ipa: '/ˌʌndəˈɡəʊ/', pos: 'v.', meaning: '经历；承受', examples: [
    { en: 'He underwent surgery.', zh: '他接受了手术。' },
    { en: 'The city underwent change.', zh: '这座城市经历了变迁。' }
  ], extended: true },
  { word: 'undertake', level: 'B2', ipa: '/ˌʌndəˈteɪk/', pos: 'v.', meaning: '承担；着手做', examples: [
    { en: 'She undertook the task.', zh: '她承担了这项任务。' },
    { en: 'We undertook a study.', zh: '我们着手一项研究。' }
  ], extended: true },
  { word: 'utilize', level: 'B2', ipa: '/ˈjuːtəlaɪz/', pos: 'v.', meaning: '利用；使用', examples: [
    { en: 'We utilize solar energy.', zh: '我们利用太阳能。' },
    { en: 'The tool is well utilized.', zh: '这个工具得到了充分利用。' }
  ], extended: true },
  { word: 'vanish', level: 'B2', ipa: '/ˈvænɪʃ/', pos: 'v.', meaning: '消失；突然不见', examples: [
    { en: 'The fog vanished.', zh: '雾散了。' },
    { en: 'The money vanished.', zh: '钱不翼而飞。' }
  ], extended: true }
]

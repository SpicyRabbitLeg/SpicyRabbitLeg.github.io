/* ============================================================
 * 全局配置 - 对齐pig-ui配置体系
 * ============================================================ */

const PWD_CONFIG = {
  // 系统名称
  title: '人员全生命周期一体化管控平台',
  // 版本
  version: '1.0.0',
  // API基础路径（原型模拟）
  apiBase: '/api',
  // 分页默认配置
  pagination: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100]
  },
  // 日期格式
  dateFormat: 'YYYY-MM-DD',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  // 脱敏规则
  maskRules: {
    phone: function(val) { if (!val) return '***'; return val.substring(0, 3) + '****' + val.substring(7); },
    idCard: function(val) { if (!val) return '***'; return val.substring(0, 6) + '********' + val.substring(14); },
    name: function(val) { if (!val) return '**'; return val.substring(0, 1) + '**'; }
  },
  // 菜单映射
  menuMap: {
    'workflow-issued-a':  { title: '准入办证-已发任务', breadcrumb: ['工作流模块', '准入办证服务', '已发任务'], module: 'a' },
    'workflow-pending-a': { title: '准入办证-待办任务', breadcrumb: ['工作流模块', '准入办证服务', '待办任务'], module: 'a' },
    'workflow-done-a':    { title: '准入办证-已办任务', breadcrumb: ['工作流模块', '准入办证服务', '已办任务'], module: 'a' },
    'workflow-issued-b':  { title: '访客管理-已发任务', breadcrumb: ['工作流模块', '访客管理服务', '已发任务'], module: 'b' },
    'workflow-pending-b': { title: '访客管理-待办任务', breadcrumb: ['工作流模块', '访客管理服务', '待办任务'], module: 'b' },
    'workflow-done-b':    { title: '访客管理-已办任务', breadcrumb: ['工作流模块', '访客管理服务', '已办任务'], module: 'b' },
    'workflow-issued-c':  { title: '离场准出-已发任务', breadcrumb: ['工作流模块', '离场准出服务', '已发任务'], module: 'c' },
    'workflow-pending-c': { title: '离场准出-待办任务', breadcrumb: ['工作流模块', '离场准出服务', '待办任务'], module: 'c' },
    'workflow-done-c':    { title: '离场准出-已办任务', breadcrumb: ['工作流模块', '离场准出服务', '已办任务'], module: 'c' },
    'workflow-issued-d':  { title: '安全考评-已发任务', breadcrumb: ['工作流模块', '安全考评服务', '已发任务'], module: 'd' },
    'workflow-pending-d': { title: '安全考评-待办任务', breadcrumb: ['工作流模块', '安全考评服务', '待办任务'], module: 'd' },
    'workflow-done-d':    { title: '安全考评-已办任务', breadcrumb: ['工作流模块', '安全考评服务', '已办任务'], module: 'd' },
    'org-dept':           { title: '组织管理', breadcrumb: ['组织权限服务', '组织管理'] },
    'org-role':           { title: '角色管理', breadcrumb: ['组织权限服务', '角色管理'] },
    'org-user':           { title: '用户管理', breadcrumb: ['组织权限服务', '用户管理'] },
    'org-menu':           { title: '菜单权限', breadcrumb: ['组织权限服务', '菜单权限'] },
    'personnel-archive':  { title: '一人一档', breadcrumb: ['人员主数据服务', '一人一档'] },
    'personnel-qualification': { title: '资质管理', breadcrumb: ['人员主数据服务', '资质管理'] },
    'personnel-qual-template': { title: '资质模板', breadcrumb: ['人员主数据服务', '资质模板'] },
    'personnel-training': { title: '培训记录', breadcrumb: ['人员主数据服务', '培训记录'] },
    'personnel-safety':   { title: '安全记录', breadcrumb: ['人员主数据服务', '安全记录'] },
    'onsite-violation':   { title: '违规事件', breadcrumb: ['在岗现场管控服务', '违规事件'] },
    'onsite-wo-issued':   { title: '工单管理-已发任务', breadcrumb: ['在岗现场管控服务', '工单管理', '已发任务'], module: 'wo' },
    'onsite-wo-pending':  { title: '工单管理-待办任务', breadcrumb: ['在岗现场管控服务', '工单管理', '待办任务'], module: 'wo' },
    'onsite-wo-done':     { title: '工单管理-已办任务', breadcrumb: ['在岗现场管控服务', '工单管理', '已办任务'], module: 'wo' },
    'onsite-geofence':    { title: '电子围栏', breadcrumb: ['在岗现场管控服务', '电子围栏'] },
    'onsite-location':    { title: '定位轨迹', breadcrumb: ['在岗现场管控服务', '定位轨迹'] },
    'safety-rule':        { title: '积分规则配置', breadcrumb: ['安全考评积分服务', '积分规则配置'] },
    'safety-calculate':   { title: '积分计算', breadcrumb: ['安全考评积分服务', '积分计算'] },
    'safety-score':       { title: '积分管理', breadcrumb: ['安全考评积分服务', '积分管理'] },
    'common-file':        { title: '文件管理', breadcrumb: ['公共能力服务', '文件管理'] },
    'common-message':     { title: '消息推送', breadcrumb: ['公共能力服务', '消息推送'] },
    'common-log':         { title: '日志审计', breadcrumb: ['公共能力服务', '日志审计'] }
  },
  // 业务类型映射
  bizTypeMap: {
    'a': '准入办证服务',
    'b': '访客管理服务',
    'c': '离场准出服务',
    'd': '安全考评服务'
  },
  // 流程节点（各模块BPMN流程）
  flowNodes: {
    a: ['提交申请', '企业负责人审批', '归口部门负责人审批', '证件管理岗审批', '公安备案', '证件制作'],
    a_qual: ['企业负责人审批', '归口部门负责人审批', '证件管理岗审批', '公安备案'],
    a_long: ['企业负责人审批', '归口部门负责人审批', '证件管理岗审批'],
    a_temp: ['归口部门负责人审批', '证件管理岗审批'],
    a_loss: ['归口部门负责人审批', '证件管理岗审批'],
    b_visitor: ['对接部门负责人审批', '访客管理岗审批'],
    b_construction: ['对接部门负责人审批', '安全管理岗审批', '访客管理岗审批'],
    b_vehicle: ['行政/物业岗审批', '访客管理岗审批'],
    b_revocation: ['对接部门负责人审批', '访客管理岗审批'],
    b: ['对接部门负责人审批', '访客管理岗审批'],
    c: ['离场申请', '主管审批', '设备归还确认', '安全审核', 'HR确认', '准出放行'],
    c_resign: ['离职申请', '直属负责人审批', '部门负责人审批', 'HR/人事岗审批', '资产管理员核对', '安全管理岗复核', '自动执行后置动作'],
    c_expel: ['清退申请', '部门负责人审批', '安全管理岗审批', '证件管理岗审批', '系统管理员执行'],
    d: ['考评启动', '数据采集', '积分核算', '结果公示', '申诉处理', '结果归档'],
    d_assessment: ['周期触发/手动启动', '系统自动汇总数据', '部门安全员复核微调', '部门负责人审批', '安全管理岗审批', '系统批量更新账户', '考评结果公示'],
    d_adjustment: ['新建调分单', '部门负责人审批', '安全管理岗审批', '系统更新积分账户', '流程归档'],
    d_appeal: ['发起积分申诉', '部门安全员复核', '安全管理岗复核', '安全负责人终审', '系统执行判定']
  },
  // 准入办证子类型
  flowSubTypes: {
    a: [
      { value: 'qual', label: '资质证书申请', nodeKey: 'a_qual', desc: '标准四级流程（含公安备案）' },
      { value: 'long', label: '长期通行证申请', nodeKey: 'a_long', desc: '三级审批流程' },
      { value: 'temp', label: '临时通行证申请', nodeKey: 'a_temp', desc: '二级审批（链路最短）' },
      { value: 'loss', label: '证件挂失/补办', nodeKey: 'a_loss', desc: '二级审批（内部管理）' }
    ],
    b: [
      { value: 'visitor', label: '普通临时访客通行申请', nodeKey: 'b_visitor', desc: '填写访客信息、对接人、通行时间、区域 → 对接部门负责人审批 → 访客管理岗审批 → 自动开通门禁/闸机' },
      { value: 'construction', label: '施工访客申请通行申请', nodeKey: 'b_construction', desc: '填写施工人员、作业区域、安全信息 → 部门负责人审批 → 安全管理岗审批 → 访客管理岗审批 → 开通作业区权限' },
      { value: 'vehicle', label: '车辆访客申请通行申请', nodeKey: 'b_vehicle', desc: '填写车牌、停放区域、随车人员 → 行政/物业岗审批 → 访客管理岗审批 → 道闸自动开通' },
      { value: 'revocation', label: '访客注销申请通行申请', nodeKey: 'b_revocation', desc: '关联有效访客单据、填写注销原因 → 部门负责人审批 → 访客管理岗审批 → 立即回收权限' }
    ]
  },
  // 离场准出子类型
  flowCSubTypes: {
    resign: {
      label: '主动离职申请',
      nodeKey: 'c_resign',
      desc: '填写离场信息 → 直属负责人 → 部门负责人 → HR → 资产管理员核对 → 安全管理岗复核 → 自动执行后置动作',
      flowNodes: ['离职申请', '直属负责人审批', '部门负责人审批', 'HR/人事岗审批', '资产管理员核对', '安全管理岗复核', '自动执行后置动作']
    },
    expel: {
      label: '违规清退申请',
      nodeKey: 'c_expel',
      desc: '由安全管理员/部门负责人发起，关联违规单号 → 部门负责人 → 安全管理岗 → 证件管理岗 → 系统管理员执行',
      flowNodes: ['清退申请', '部门负责人审批', '安全管理岗审批', '证件管理岗审批', '系统管理员执行']
    }
  },
  // 安全考评子类型
  flowDSubTypes: {
    assessment: {
      label: '周期安全考评单',
      nodeKey: 'd_assessment',
      desc: '系统定时/手动触发 → 自动汇总数据 → 部门安全员复核微调 → 部门负责人审批 → 安全管理岗审批 → 批量更新积分账户 → 结果公示',
      flowNodes: ['周期触发/手动启动', '系统自动汇总数据', '部门安全员复核微调', '部门负责人审批', '安全管理岗审批', '系统批量更新账户', '考评结果公示']
    },
    adjustment: {
      label: '人工积分调分单',
      nodeKey: 'd_adjustment',
      desc: '管理员/安全员新建调分单 → 部门负责人审批 → 安全管理岗审批 → 系统更新积分账户 → 流程归档',
      flowNodes: ['新建调分单', '部门负责人审批', '安全管理岗审批', '系统更新积分账户', '流程归档']
    },
    appeal: {
      label: '积分申诉流程',
      nodeKey: 'd_appeal',
      desc: '人员在积分台账发起申诉 → 部门安全员复核 → 安全管理岗复核 → 安全负责人终审 → 系统执行判定（成立/不成立）',
      flowNodes: ['发起积分申诉', '部门安全员复核', '安全管理岗复核', '安全负责人终审', '系统执行判定']
    }
  }
};

/* ============================================================
 * 模拟数据 - 涵盖所有业务模块
 * ============================================================ */

const MOCK = {
  // 通用人员数据（扩展字段）
  persons: [
    { id: 'P001', name: '张三', idCard: '320102199001011234', phone: '13800138001', dept: '生产部', position: '操作工', status: '在职', qualificationDate: '2025-08-15', score: 92, gender: '男', education: '大专', birthplace: '江苏南京', nationality: '汉族', maritalStatus: '已婚', email: 'zhangsan@hy.com', emergencyContact: '李芳', emergencyPhone: '13900139001', entryDate: '2020-03-15', contractType: '固定期限', contractEnd: '2027-03-14', rank: '初级', headship: '无', jobCategory: '生产操作' },
    { id: 'P002', name: '李四', idCard: '320102199102152345', phone: '13800138002', dept: '生产部', position: '班组长', status: '在职', qualificationDate: '2025-06-20', score: 85, gender: '男', education: '本科', birthplace: '江苏苏州', nationality: '汉族', maritalStatus: '已婚', email: 'lisi@hy.com', emergencyContact: '王芳', emergencyPhone: '13900139002', entryDate: '2019-06-01', contractType: '固定期限', contractEnd: '2026-05-31', rank: '中级', headship: '班组长', jobCategory: '生产管理' },
    { id: 'P003', name: '王五', idCard: '320102199203153456', phone: '13800138003', dept: '安全部', position: '安全员', status: '在职', qualificationDate: '2024-12-01', score: 78, gender: '男', education: '本科', birthplace: '安徽合肥', nationality: '汉族', maritalStatus: '已婚', email: 'wangwu@hy.com', emergencyContact: '赵丽', emergencyPhone: '13900139003', entryDate: '2021-02-10', contractType: '固定期限', contractEnd: '2028-02-09', rank: '中级', headship: '无', jobCategory: '安全管理' },
    { id: 'P004', name: '赵六', idCard: '320102199304164567', phone: '13800138004', dept: '技术部', position: '技术员', status: '在职', qualificationDate: '2025-03-10', score: 95, gender: '男', education: '硕士', birthplace: '浙江杭州', nationality: '汉族', maritalStatus: '未婚', email: 'zhaoliu@hy.com', emergencyContact: '赵刚', emergencyPhone: '13900139004', entryDate: '2022-09-01', contractType: '固定期限', contractEnd: '2029-08-31', rank: '高级', headship: '无', jobCategory: '技术研发' },
    { id: 'P005', name: '钱七', idCard: '320102199405175678', phone: '13800138005', dept: '行政部', position: '文员', status: '离职', qualificationDate: '2024-06-15', score: 70, gender: '女', education: '大专', birthplace: '江苏无锡', nationality: '汉族', maritalStatus: '已婚', email: 'qianqi@hy.com', emergencyContact: '钱父', emergencyPhone: '13900139005', entryDate: '2018-11-20', contractType: '固定期限', contractEnd: '2024-11-19', rank: '初级', headship: '无', jobCategory: '行政后勤' },
    { id: 'P006', name: '孙八', idCard: '320102199506186789', phone: '13800138006', dept: '生产部', position: '操作工', status: '在职', qualificationDate: '2026-01-10', score: 88, gender: '男', education: '中专', birthplace: '江苏徐州', nationality: '汉族', maritalStatus: '未婚', email: 'sunba@hy.com', emergencyContact: '孙母', emergencyPhone: '13900139006', entryDate: '2023-07-15', contractType: '固定期限', contractEnd: '2026-07-14', rank: '初级', headship: '无', jobCategory: '生产操作' },
    { id: 'P007', name: '周九', idCard: '320102199607197890', phone: '13800138007', dept: '安全部', position: '主管', status: '在职', qualificationDate: '2025-11-05', score: 90, gender: '男', education: '本科', birthplace: '山东济南', nationality: '汉族', maritalStatus: '已婚', email: 'zhoujiu@hy.com', emergencyContact: '钱华', emergencyPhone: '13900139007', entryDate: '2017-05-08', contractType: '无固定期限', contractEnd: '长期', rank: '高级', headship: '安全主管', jobCategory: '安全管理' },
    { id: 'P008', name: '吴十', idCard: '320102199708208901', phone: '13800138008', dept: '技术部', position: '工程师', status: '在职', qualificationDate: '2024-09-20', score: 60, gender: '男', education: '硕士', birthplace: '湖北武汉', nationality: '汉族', maritalStatus: '未婚', email: 'wushi@hy.com', emergencyContact: '吴父', emergencyPhone: '13900139008', entryDate: '2022-01-10', contractType: '固定期限', contractEnd: '2028-01-09', rank: '中级', headship: '无', jobCategory: '技术研发' },
    { id: 'P009', name: '郑十一', idCard: '320102199809219012', phone: '13800138009', dept: '生产部', position: '操作工', status: '在职', qualificationDate: '2025-05-30', score: 45, gender: '男', education: '高中', birthplace: '四川成都', nationality: '汉族', maritalStatus: '已婚', email: 'zhengshiyi@hy.com', emergencyContact: '郑梅', emergencyPhone: '13900139009', entryDate: '2024-03-01', contractType: '固定期限', contractEnd: '2027-02-28', rank: '初级', headship: '无', jobCategory: '生产操作' },
    { id: 'P010', name: '冯十二', idCard: '320102199910221023', phone: '13800138010', dept: '安全部', position: '巡检员', status: '待入职', qualificationDate: '2025-07-22', score: 82, gender: '女', education: '大专', birthplace: '湖南长沙', nationality: '汉族', maritalStatus: '未婚', email: 'fengshier@hy.com', emergencyContact: '冯强', emergencyPhone: '13900139010', entryDate: '2026-07-01', contractType: '固定期限', contractEnd: '2029-06-30', rank: '初级', headship: '无', jobCategory: '安全管理' }
  ],

  // 资质类型
  qualTypes: ['驾驶证', '焊工证', '安全员证', '特种设备操作证', '电工证', '高处作业证', '危化品管理证', '消防设施操作员'],

  // 发证机构
  issuingOrgs: ['江苏省应急管理厅', '南京市市场监督管理局', '中国安全生产协会', '国家能源局', '江苏省住房和城乡建设厅', '公安部交通管理局'],

  // 培训类型
  trainingTypes: ['安全培训', '技能培训', '新员工培训', '管理培训', '特种作业培训', '消防培训', '应急演练', '职业健康培训'],

  // 流程状态
  taskStatus: [
    { value: 'pending', label: '待处理', color: '#fa8c16' },
    { value: 'processing', label: '处理中', color: '#1890ff' },
    { value: 'done', label: '已完成', color: '#52c41a' },
    { value: 'rejected', label: '已驳回', color: '#f5222d' },
    { value: 'draft', label: '草稿', color: '#909399' }
  ],

  // 生成工作流任务
  generateTasks: function(module, taskType) {
    const bizNames = { a: '准入办证', b: '访客管理', c: '离场准出', d: '安全考评' };
    const aSubTypeLabels = ['资质证书申请', '长期通行证申请', '临时通行证申请', '证件挂失/补办'];
    const aSubTypeKeys = ['qual', 'long', 'temp', 'loss'];
    const bSubTypeLabels = ['普通临时访客', '施工访客', '车辆访客', '访客注销'];
    const bSubTypeKeys = ['visitor', 'construction', 'vehicle', 'revocation'];
    const cSubTypeLabels = ['主动离职申请', '违规清退申请'];
    const cSubTypeKeys = ['resign', 'expel'];
    const dSubTypeLabels = ['周期安全考评单', '人工积分调分单', '积分申诉流程'];
    const dSubTypeKeys = ['assessment', 'adjustment', 'appeal'];
    const tasks = [];
    const statuses = taskType === 'pending' ? ['pending', 'processing'] :
                     taskType === 'done' ? ['done', 'rejected'] :
                     ['draft', 'pending', 'processing', 'done', 'rejected'];
    for (let i = 1; i <= 23; i++) {
      const person = this.persons[Math.floor(Math.random() * this.persons.length)];
      let subType, bizType;
      if (module === 'a') {
        const idx = Math.floor(Math.random() * aSubTypeKeys.length);
        subType = aSubTypeKeys[idx];
        bizType = '准入办证-' + aSubTypeLabels[idx];
      } else if (module === 'b') {
        const idx = Math.floor(Math.random() * bSubTypeKeys.length);
        subType = bSubTypeKeys[idx];
        bizType = '访客管理-' + bSubTypeLabels[idx];
      } else if (module === 'c') {
        const idx = Math.floor(Math.random() * cSubTypeKeys.length);
        subType = cSubTypeKeys[idx];
        bizType = '离场准出-' + cSubTypeLabels[idx];
      } else if (module === 'd') {
        const idx = Math.floor(Math.random() * dSubTypeKeys.length);
        subType = dSubTypeKeys[idx];
        bizType = '安全考评-' + dSubTypeLabels[idx];
      } else {
        subType = undefined;
        bizType = bizNames[module];
      }
      tasks.push({
        id: 'WF-' + module.toUpperCase() + '-' + String(i).padStart(4, '0'),
        bizType: bizType,
        applicant: person.name,
        applicantId: person.id,
        applyTime: this.randomDate(2025, 2026),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        currentNode: taskType === 'done' ? 'END' : this.randomNode(module, subType),
        urgency: Math.random() > 0.7 ? 'urgent' : 'normal',
        module: module,
        subType: subType
      });
    }
    return tasks;
  },

  // 生成流转记录
  generateFlowRecords: function(module, subType) {
    let nodes;
    if ((module === 'a' || module === 'b') && subType) {
      const subTypeKey = module === 'a' ? 'a' : 'b';
      const subTypes = PWD_CONFIG.flowSubTypes[subTypeKey] || [];
      const st = subTypes.find(s => s.value === subType);
      nodes = PWD_CONFIG.flowNodes[st?.nodeKey || module] || PWD_CONFIG.flowNodes[module];
    } else if (module === 'c' && subType) {
      const cTypes = PWD_CONFIG.flowCSubTypes || {};
      const ct = cTypes[subType];
      nodes = ct ? ct.flowNodes : PWD_CONFIG.flowNodes.c;
    } else if (module === 'd' && subType) {
      const dTypes = PWD_CONFIG.flowDSubTypes || {};
      const dt = dTypes[subType];
      nodes = dt ? dt.flowNodes : PWD_CONFIG.flowNodes.d;
    } else {
      nodes = PWD_CONFIG.flowNodes[module];
    }
    // 子类型特定审批人
    const roleHandlers = {
      qual: ['企业负责人', '归口部门负责人', '证件管理岗', '公安备案'],
      long: ['企业负责人', '归口部门负责人', '证件管理岗'],
      temp: ['归口部门负责人', '证件管理岗'],
      loss: ['归口部门负责人', '证件管理岗'],
      visitor: ['对接部门负责人', '访客管理岗'],
      construction: ['对接部门负责人', '安全管理岗', '访客管理岗'],
      vehicle: ['行政/物业岗', '访客管理岗'],
      revocation: ['对接部门负责人', '访客管理岗'],
      resign: ['直属负责人', '部门负责人', 'HR人事岗', '资产管理员', '安全管理岗', '系统'],
      expel: ['部门负责人', '安全管理岗', '证件管理岗', '系统管理员'],
      assessment: ['系统自动', '系统自动', '部门安全员', '部门负责人', '安全管理岗', '系统批量', '系统'],
      adjustment: ['调分发起人', '部门负责人', '安全管理岗', '系统', '系统'],
      appeal: ['申诉人', '部门安全员', '安全管理岗', '安全负责人', '系统']
    };
    const defaultHandlers = ['管理员', '李主管', '王安全员', '张经理', '赵主任'];
    const handlers = ((module === 'a' || module === 'b' || module === 'c') && subType && roleHandlers[subType]) ? roleHandlers[subType] : defaultHandlers;
    const records = [];
    const now = new Date();
    const opinions = [
      '同意，资料齐全。', '审核通过，建议放行。', '经审查，符合要求。',
      '现场核验无误，同意下一环节。', '拟同意，请领导批示。',
      '同意办理。', '驳回，请补充安全培训证明。', '材料不完整，请重新提交。'
    ];
    for (let i = 0; i < nodes.length; i++) {
      const isDone = i < Math.min(nodes.length, Math.floor(Math.random() * 7) + 1);
      records.push({
        nodeName: nodes[i],
        handler: handlers[i] || handlers[Math.floor(Math.random() * handlers.length)],
        time: new Date(now.getTime() - (nodes.length - i) * 3600000 * 2),
        opinion: isDone ? opinions[Math.floor(Math.random() * opinions.length)] : '',
        actionType: isDone ? (i < Math.floor(Math.random() * 6) + 1 ? 'agree' : 'reject') : 'pending',
        isDone: isDone
      });
    }
    return records;
  },

  // 生成资质数据
  generateQualifications: function() {
    return this.persons.map(p => ({
      ...p,
      certType: ['安全操作证', '特种作业证', '职业资格证', '上岗证'][Math.floor(Math.random() * 4)],
      certNo: 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      issueDate: this.randomDate(2023, 2025),
      expireDate: this.randomDate(2026, 2028),
      status: Math.random() > 0.3 ? 'valid' : (Math.random() > 0.5 ? 'expiring' : 'expired')
    }));
  },

  // 生成违规事件（对标规范：违规事件页面）
  generateViolations: function() {
    const violationTypes = ['AI抓拍', '人工巡查'];
    const riskLevels = ['低', '中', '高'];
    const statuses = ['pending', 'processing', 'completed', 'rejected'];
    const locations = ['A车间-东区', 'B车间-西区', '仓库区-南门', '装卸区-2号', '配电室-高压区', '锅炉房-1号炉', '危化品存储区', '办公区-3楼'];
    const descriptions = [
      '未按规定佩戴安全帽进入作业区域',
      '违规操作叉车未鸣笛警示',
      '越区进入危险化学品存储区',
      '在禁烟区域吸烟',
      '未穿防静电工作服进入防爆区',
      '设备未按规定进行每日点检',
      '高空作业未系安全带',
      '动火作业未办理动火许可证',
      '临时用电私拉乱接',
      '未按规程操作冲压设备'
    ];
    const violations = [];
    for (let i = 1; i <= 24; i++) {
      const person = this.persons[Math.floor(Math.random() * this.persons.length)];
      const vioType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const status = (i <= 5 ? 'pending' : (i <= 12 ? 'processing' : (i <= 20 ? 'completed' : 'rejected')));
      const deductMap = { '低': 5, '中': 10, '高': 20 };
      violations.push({
        id: 'VIO-' + String(i).padStart(4, '0'),
        personName: person.name,
        personId: person.id,
        dept: person.dept,
        violationType: vioType,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        riskLevel: riskLevel,
        status: status,
        deductScore: deductMap[riskLevel],
        violationTime: this.randomDate(2026, 2026),
        reporter: ['王安全员', '李主管', 'AI系统', '赵主任', '张经理'][Math.floor(Math.random() * 5)]
      });
    }
    return violations;
  },

  // 违规事件状态中文
  getViolationStatusLabel: function(status) {
    const map = { pending: '待处理', processing: '处理中', completed: '已完成', rejected: '已驳回' };
    return map[status] || status;
  },

  // 生成工单（Flowable工作流版）
  generateWorkOrders: function() {
    const orderTypes = ['巡检', '隐患整改', '安全报修', '违规整改'];
    const statuses = ['草稿', '审批中', '处理中', '待验收', '已完成', '已驳回', '已作废'];
    const riskLevels = ['低风险', '中风险', '高风险'];
    const descriptions = [
      '发现车间消防通道堆放杂物，需立即清理',
      '配电箱门锁损坏，存在触电风险',
      '安全出口指示牌脱落，需重新安装',
      '现场发现违规使用大功率电器',
      '气体检测报警器未按期校验',
      '防护栏杆松动，存在坠落隐患',
      '应急照明灯故障需更换',
      '危化品存储未按规定分类摆放'
    ];
    const orders = [];
    for (let i = 1; i <= 20; i++) {
      const person = this.persons[Math.floor(Math.random() * this.persons.length)];
      const execPerson = this.persons[Math.floor(Math.random() * this.persons.length)];
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      // 按序号分配不同状态，确保各状态都有数据
      const status = (() => {
        if (i <= 2) return '草稿';
        if (i <= 5) return '审批中';
        if (i <= 9) return '处理中';
        if (i <= 12) return '待验收';
        if (i <= 16) return '已完成';
        if (i <= 18) return '已驳回';
        return '已作废';
      })();
      const createTime = this.randomDate(2026, 2026);
      const deadline = this.randomDate(2026, 2027);
      orders.push({
        id: 'WO-' + String(i).padStart(4, '0'),
        orderType: orderType,
        title: orderType + '工单-' + String(i) + '号',
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        responsibleDept: person.dept,
        executor: execPerson.name,
        executorId: execPerson.id,
        riskLevel: riskLevel,
        createTime: createTime,
        deadline: deadline,
        status: status,
        processInstId: status !== '草稿' ? 'flow-' + Math.random().toString(36).substring(2, 10).toUpperCase() : '',
        creator: ['王安全员', '李主管', '张经理', '赵主任'][Math.floor(Math.random() * 4)],
        creatorId: ['P003', 'P007', 'P001', 'P009'][Math.floor(Math.random() * 4)],
        relatedViolation: orderType === '违规整改' ? 'VIO-' + String(Math.floor(Math.random() * 24) + 1).padStart(4, '0') : '',
        attachments: [],
        currentTaskNode: status === '审批中' ? '审批中' : (status === '处理中' ? '执行处置' : (status === '待验收' ? '待验收' : ''))
      });
    }
    return orders;
  },

  // 工单状态中文（新版）
  getWorkOrderStatusLabel: function(status) {
    const map = { '草稿': '草稿', '审批中': '审批中', '处理中': '处理中', '待验收': '待验收', '已完成': '已完成', '已驳回': '已驳回', '已作废': '已作废' };
    return map[status] || status;
  },

  // 生成工单流转记录（供流程图/流转记录标签使用）
  generateOrderFlowRecords: function(orderId) {
    const nodes = ['发起审批', '部门审批', '安全管理岗审批', '派发执行', '现场处置', '验收'];
    const handlers = ['管理员', '张经理', '王安全员', '李主管', '执行人', '赵主任'];
    const opinions = ['同意，请继续处理。', '审核通过，符合要求。', '现场核验无误。', '已派发执行人处理。', '处置完成，申请验收。', '验收通过，工单闭环。'];
    const records = [];
    const now = new Date();
    // 随机决定哪些节点已完成
    const doneCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < nodes.length; i++) {
      const isDone = i < doneCount;
      const isActive = i === doneCount && doneCount < nodes.length;
      records.push({
        nodeName: nodes[i],
        handler: handlers[i] || '系统',
        time: new Date(now.getTime() - (nodes.length - i) * 3600000 * 4).toISOString().replace('T', ' ').substring(0, 16),
        opinion: isDone ? opinions[i] : '',
        actionType: isDone ? '同意' : (isActive ? '处理中' : '待处理'),
        status: isDone ? '已完成' : (isActive ? '处理中' : '待处理')
      });
    }
    return records;
  },

  // 生成积分规则
  generateScoreRules: function() {
    return [
      { id: 'R001', name: '安全培训参与', type: '加分', score: 5, unit: '次', description: '每参加一次安全培训加5分', status: 'enabled' },
      { id: 'R002', name: '隐患排查上报', type: '加分', score: 10, unit: '条', description: '每上报一条有效隐患加10分', status: 'enabled' },
      { id: 'R003', name: '违规操作扣分', type: '扣分', score: -20, unit: '次', description: '每次违规操作扣20分', status: 'enabled' },
      { id: 'R004', name: '安全建议采纳', type: '加分', score: 15, unit: '条', description: '每条被采纳的安全建议加15分', status: 'enabled' },
      { id: 'R005', name: '未参加安全会议', type: '扣分', score: -5, unit: '次', description: '无故缺席安全会议每次扣5分', status: 'enabled' },
      { id: 'R006', name: '月度安全之星', type: '加分', score: 30, unit: '次', description: '评为月度安全之星加30分', status: 'enabled' },
      { id: 'R007', name: '事故责任扣分', type: '扣分', score: -50, unit: '次', description: '负主要责任的安全事故扣50分', status: 'enabled' },
      { id: 'R008', name: '持证上岗考核', type: '加分', score: 20, unit: '次', description: '通过持证上岗考核加20分', status: 'disabled' }
    ];
  },

  // 生成日志
  generateLogs: function() {
    const modules = ['工作流模块', '组织权限', '人员主数据', '现场管控', '安全考评', '文件管理'];
    const actions = ['新增', '修改', '删除', '查询', '导出', '审批', '登录', '上传'];
    const logs = [];
    for (let i = 1; i <= 50; i++) {
      const person = this.persons[Math.floor(Math.random() * this.persons.length)];
      logs.push({
        id: 'LOG-' + String(i).padStart(4, '0'),
        operator: person.name,
        operatorId: person.id,
        module: modules[Math.floor(Math.random() * modules.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        target: '记录#' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        time: this.randomDate(2026, 2026),
        ip: '192.168.1.' + Math.floor(Math.random() * 255),
        detail: '用户操作记录详情'
      });
    }
    return logs;
  },

  // 生成资质数据（含详细字段，每人多条）
  generatePersonnelQualList: function() {
    const list = [];
    this.persons.forEach((p, idx) => {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        const issueDate = this.randomDate(2023, 2025);
        const expireYear = 2026 + Math.floor(Math.random() * 3);
        const expireDate = expireYear + '-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const now = new Date();
        const expire = new Date(expireDate);
        const diffDays = Math.ceil((expire - now) / (1000*60*60*24));
        let status;
        if (diffDays < 0) status = 'expired';
        else if (diffDays <= 30) status = 'expiring';
        else status = 'valid';
        list.push({
          id: 'QUAL-' + String(idx * 3 + i + 1).padStart(4, '0'),
          personId: p.id,
          personName: p.name,
          personDept: p.dept,
          qualType: this.qualTypes[Math.floor(Math.random() * this.qualTypes.length)],
          qualName: this.qualTypes[Math.floor(Math.random() * this.qualTypes.length)] + '证书',
          qualNo: 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          issuingOrg: this.issuingOrgs[Math.floor(Math.random() * this.issuingOrgs.length)],
          issueDate: issueDate,
          expireDate: expireDate,
          status: status,
          diffDays: diffDays,
          isVerified: Math.random() > 0.2,
          verifyDate: this.randomDate(2025, 2026)
        });
      }
    });
    return list;
  },

  // 生成培训记录
  generatePersonnelTrainingList: function() {
    const list = [];
    const now = new Date();
    for (let i = 1; i <= 18; i++) {
      const startDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + Math.random() * 8 * 60 * 60 * 1000);
      const type = this.trainingTypes[Math.floor(Math.random() * this.trainingTypes.length)];
      const participants = Math.floor(Math.random() * 20) + 5;
      const passed = Math.floor(participants * (0.7 + Math.random() * 0.28));
      const isDone = startDate < now;
      list.push({
        id: 'TRAIN-' + String(i).padStart(4, '0'),
        name: type + '——' + ['2026年度', '2026年第2期', '第' + i + '期', '专项'][Math.floor(Math.random() * 4)] + '培训',
        type: type,
        category: ['内部', '外部'][Math.floor(Math.random() * 2)],
        mode: ['线上', '线下', '线上+线下'][Math.floor(Math.random() * 3)],
        organizer: ['人力资源部', '安全部', '技术部', '外部培训机构'][Math.floor(Math.random() * 4)],
        trainer: ['张教授', '李老师', '王高工', '赵讲师', '外部专家'][Math.floor(Math.random() * 5)],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        duration: (Math.floor(Math.random() * 8) + 1) + '小时',
        location: ['A培训室', 'B会议室', '多媒体厅', '现场实训基地', '线上平台'][Math.floor(Math.random() * 5)],
        participants: participants,
        passed: passed,
        passRate: Math.round(passed / participants * 100) + '%',
        avgScore: Math.floor(Math.random() * 30) + 70,
        status: isDone ? 'completed' : (Math.random() > 0.5 ? 'planned' : 'in_progress'),
        hasExam: Math.random() > 0.3,
        attachments: ['培训课件.pdf', '签到表.xlsx', '考核成绩单.xlsx']
      });
    }
    return list;
  },

  // 生成某人员参与的培训记录
  generatePersonTrainingRecords: function(personId) {
    const all = this.generatePersonnelTrainingList();
    // 每人参与2~5条
    const count = Math.floor(Math.random() * 4) + 2;
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, count);
    return shuffled.map(t => ({
      ...t,
      personId: personId,
      attendance: Math.random() > 0.15 ? '已签到' : '未签到',
      score: t.hasExam ? Math.floor(Math.random() * 40) + 60 : null,
      examResult: t.hasExam ? (Math.random() > 0.1 ? '通过' : '未通过') : '无考核'
    }));
  },

  // 生成安全记录
  generatePersonnelSafetyList: function() {
    const list = [];
    const recordTypes = ['安全考核', '违规记录', '事故记录', '安全交底'];
    const riskLevels = ['无风险', '低风险', '中风险', '高风险'];
    const eventNames = [
      { type: '安全考核', names: ['季度安全考核', '月度安全考核', '专项安全考核', '年度安全考核'] },
      { type: '违规记录', names: ['未佩戴安全帽', '违规操作设备', '越区作业', '吸烟违规', '未穿防护服', '设备未按规定检查', '无证上岗', '酒后上岗'] },
      { type: '事故记录', names: ['轻微擦伤', '机械伤害', '电气短路火情', '高处坠落未遂', '化学品泄漏', '物体打击'] },
      { type: '安全交底', names: ['动火作业交底', '高处作业交底', '受限空间交底', '临时用电交底', '吊装作业交底'] }
    ];
    const results = ['警告', '罚款', '培训整改', '停工整改', '通报批评', '合格', '优秀'];

    this.persons.forEach((p, idx) => {
      const count = Math.floor(Math.random() * 3) + (idx < 3 ? 2 : 1);
      for (let i = 0; i < count; i++) {
        const rType = recordTypes[Math.floor(Math.random() * recordTypes.length)];
        const rEvents = eventNames.find(e => e.type === rType);
        const eventName = rEvents ? rEvents.names[Math.floor(Math.random() * rEvents.names.length)] : rType + '事件';
        const riskLevel = rType === '事故记录' ? (Math.random() > 0.5 ? '高风险' : '中风险') : (rType === '违规记录' ? ['低风险', '中风险'][Math.floor(Math.random() * 2)] : ['无风险', '低风险'][Math.floor(Math.random() * 2)]);
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 365);
        const recDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const isClosed = daysAgo > 30 || Math.random() > 0.3;
        list.push({
          id: 'SAFE-' + String(idx * 5 + i + 1).padStart(4, '0'),
          personId: p.id,
          personName: p.name,
          personDept: p.dept,
          recordType: rType,
          eventName: eventName,
          description: '在作业过程中' + eventName + '，违反安全操作规程第' + (Math.floor(Math.random() * 30) + 1) + '条',
          occurDate: recDate.toISOString().split('T')[0],
          occurTime: recDate.toISOString().split('T')[1].substring(0, 5),
          location: ['A车间', 'B车间', '仓库区', '装卸区', '配电室', '锅炉房', '办公区'][Math.floor(Math.random() * 7)],
          riskLevel: riskLevel,
          handler: ['张主管', '李经理', '王安全员', '赵主任'][Math.floor(Math.random() * 4)],
          handleResult: results[Math.floor(Math.random() * results.length)],
          handleDate: isClosed ? this.randomDate(2025, 2026) : '',
          deadline: isClosed ? '' : recDate.toISOString().split('T')[0],
          rectificationStatus: isClosed ? '已完成' : (Math.random() > 0.5 ? '进行中' : '未开始'),
          isClosed: isClosed,
          attachments: isClosed ? ['整改证明.pdf', '现场照片.jpg'] : ['现场照片.jpg'],
          relatedTraining: Math.random() > 0.5 ? '安全操作规范培训' : null
        });
      }
    });
    return list;
  },

  // 生成某次培训的参与者及考核数据
  generateTrainingParticipants: function(trainingId) {
    const training = this.generatePersonnelTrainingList().find(t => t.id === trainingId);
    const count = training ? training.participants : Math.floor(Math.random() * 15) + 8;
    const participants = [];
    const shuffled = [...this.persons].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const p = shuffled[i];
      const hasScore = Math.random() > 0.15;
      const score = hasScore ? Math.floor(Math.random() * 50) + 50 : null;
      const passed = score !== null ? score >= 60 : null;
      participants.push({
        id: 'TP-' + trainingId + '-' + String(i + 1).padStart(3, '0'),
        personId: p.id,
        personName: p.name,
        personDept: p.dept,
        personPhone: p.phone,
        attendance: Math.random() > 0.1 ? '已签到' : '未签到',
        score: score,
        scorePassed: passed,
        examStatus: score === null ? '未考核' : (passed ? '通过' : '未通过'),
        assessor: passed !== null ? (Math.random() > 0.3 ? '张主管' : '李安全员') : '-',
        assessTime: passed !== null ? this.randomDate(2026, 2026).split(' ')[0] : '-',
        remark: ''
      });
    }
    return participants;
  },

  // 生成待考核的培训列表（用于培训记录考核页面）
  generatePendingAssessmentTrainings: function() {
    const all = this.generatePersonnelTrainingList();
    // 筛选出已完成/进行中的培训，部分有考核需求
    return all.filter(t => t.status !== 'planned').map(t => {
      const participants = this.generateTrainingParticipants(t.id);
      const assessed = participants.filter(p => p.examStatus !== '未考核').length;
      const passed = participants.filter(p => p.examStatus === '通过').length;
      const failed = participants.filter(p => p.examStatus === '未通过').length;
      return {
        ...t,
        participantsList: participants,
        totalAssessed: assessed,
        totalPassed: passed,
        totalFailed: failed,
        pendingAssess: participants.length - assessed
      };
    });
  },

  // 资质证书模板数据
  qualTemplates: [
    { id: 'QT001', qualType: '1', qualTypeName: '特种作业证', qualName: '低压电工操作证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT002', qualType: '1', qualTypeName: '特种作业证', qualName: '高压电工操作证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT003', qualType: '1', qualTypeName: '特种作业证', qualName: '焊接与热切割作业证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT004', qualType: '1', qualTypeName: '特种作业证', qualName: '高处作业证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT005', qualType: '1', qualTypeName: '特种作业证', qualName: '危化品作业证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT006', qualType: '2', qualTypeName: '安全培训证', qualName: '安全生产培训证', standardValidDays: 730, warnDays: 60 },
    { id: 'QT007', qualType: '2', qualTypeName: '安全培训证', qualName: '消防培训合格证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT008', qualType: '2', qualTypeName: '安全培训证', qualName: '应急救援培训证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT009', qualType: '3', qualTypeName: '技能等级证', qualName: '中级工技能证', standardValidDays: 1095, warnDays: 90 },
    { id: 'QT010', qualType: '3', qualTypeName: '技能等级证', qualName: '高级工技能证', standardValidDays: 1095, warnDays: 90 },
    { id: 'QT011', qualType: '3', qualTypeName: '技能等级证', qualName: '技师技能证', standardValidDays: 1095, warnDays: 90 },
    { id: 'QT012', qualType: '4', qualTypeName: '外包准入证', qualName: '外包人员准入证', standardValidDays: 180, warnDays: 15 },
    { id: 'QT013', qualType: '4', qualTypeName: '外包准入证', qualName: '临时施工准入证', standardValidDays: 90, warnDays: 7 },
    { id: 'QT014', qualType: '5', qualTypeName: '身份证', qualName: '居民身份证', standardValidDays: 9999, warnDays: 90 },
    { id: 'QT015', qualType: '6', qualTypeName: '其他证件', qualName: '职业健康证', standardValidDays: 365, warnDays: 30 },
    { id: 'QT016', qualType: '6', qualTypeName: '其他证件', qualName: '驾驶员从业资格证', standardValidDays: 365, warnDays: 30 },
  ],

  // 获取字典标签
  getQualTypeLabel: function(typeCode) {
    const map = { '1': '特种作业证', '2': '安全培训证', '3': '技能等级证', '4': '外包准入证', '5': '身份证', '6': '其他证件' };
    return map[typeCode] || '未知';
  },

  // 生成黑名单数据（违规清退）
  generateBlacklist: function() {
    return [
      { id: 'BL-001', personName: '刘某某', personId: 'P099', idCard: '320102199001011234', reason: '严重违规操作导致事故', violator: '王安全员', blacklistTime: '2026-01-15 09:30', status: 'active', remark: '永久禁止入厂' },
      { id: 'BL-002', personName: '陈某某', personId: 'P088', idCard: '320102199102152345', reason: '盗窃公司财物', violator: '张经理', blacklistTime: '2025-12-20 14:00', status: 'active', remark: '永久禁止入厂' },
      { id: 'BL-003', personName: '黄某某', personId: 'P077', idCard: '320102199203153456', reason: '多次违反安全规定屡教不改', violator: '李主管', blacklistTime: '2026-03-08 10:15', status: 'active', remark: '1年内禁止入厂' },
      { id: 'BL-004', personName: '何某某', personId: 'P066', idCard: '320102199304164567', reason: '打架斗殴', violator: '赵主任', blacklistTime: '2026-04-22 16:45', status: 'active', remark: '永久禁止入厂' }
    ];
  },

  // 生成权限回收记录（离职/清退后自动生成）
  generateExitPermRevokeRecords: function() {
    return [
      { id: 'EPR-001', personName: '赵六', personId: 'P004', exitType: '主动离职', exitDate: '2026-05-20', items: ['门禁权限-厂区大门', '门禁权限-A车间', '系统账号-tec_zhaoliu', '通行证-长期'], revokeTime: '2026-05-20 18:00', operator: '系统自动', status: '已回收' },
      { id: 'EPR-002', personName: '钱七', personId: 'P005', exitType: '合同到期', exitDate: '2026-04-15', items: ['门禁权限-厂区大门', '门禁权限-办公区', '系统账号-adm_qianqi'], revokeTime: '2026-04-15 18:00', operator: '系统自动', status: '已回收' },
      { id: 'EPR-003', personName: '刘某某', personId: 'P099', exitType: '违规清退', exitDate: '2026-01-15', items: ['全部门禁权限', '所有通行证', '系统账号', '资质证书*3'], revokeTime: '2026-01-15 15:30', operator: '系统自动', status: '已回收' }
    ];
  },

  // 生成附件数据
  generateAttachments: function(category) {
    const fileMap = {
      basic: [
        { name: '身份证扫描件.pdf', size: '2.3 MB', type: 'pdf', icon: '📄' },
        { name: '学历学位证.jpg', size: '1.8 MB', type: 'image', icon: '🖼️' },
        { name: '个人简历.docx', size: '856 KB', type: 'word', icon: '📝' },
        { name: '入职登记表.pdf', size: '1.2 MB', type: 'pdf', icon: '📄' }
      ],
      contract: [
        { name: '劳动合同.pdf', size: '3.1 MB', type: 'pdf', icon: '📄' },
        { name: '保密协议.pdf', size: '1.5 MB', type: 'pdf', icon: '📄' },
        { name: '竞业限制协议.pdf', size: '1.1 MB', type: 'pdf', icon: '📄' }
      ],
      qualification: [
        { name: '资质证书原件.jpg', size: '2.7 MB', type: 'image', icon: '🖼️' },
        { name: '核验记录.pdf', size: '856 KB', type: 'pdf', icon: '📄' },
        { name: '复审记录.pdf', size: '920 KB', type: 'pdf', icon: '📄' }
      ],
      training: [
        { name: '培训课件.pdf', size: '5.2 MB', type: 'pdf', icon: '📄' },
        { name: '签到表.xlsx', size: '456 KB', type: 'excel', icon: '📊' },
        { name: '考核试卷.pdf', size: '1.8 MB', type: 'pdf', icon: '📄' },
        { name: '培训证明.jpg', size: '1.3 MB', type: 'image', icon: '🖼️' }
      ],
      safety: [
        { name: '现场照片.jpg', size: '3.4 MB', type: 'image', icon: '🖼️' },
        { name: '整改证明.pdf', size: '1.1 MB', type: 'pdf', icon: '📄' },
        { name: '处罚通知书.pdf', size: '780 KB', type: 'pdf', icon: '📄' }
      ]
    };
    return fileMap[category] || fileMap.basic;
  },

  // 生成资质到期提醒数据
  generateExpiringAlerts: function() {
    const quals = this.generatePersonnelQualList();
    return quals.filter(q => q.status === 'expiring' || q.status === 'expired').slice(0, 5);
  },

  // 生成电子围栏数据（对标规范：电子围栏页面）
  generateGeofences: function() {
    const fenceTypes = ['禁入区', '作业区', '通行区', '告警区'];
    const alertMethods = ['越界告警', '滞留告警', '离岗告警'];
    const areas = ['A车间-东区(500m²)', '危化品存储区(200m²)', '高压配电区(150m²)', '锅炉房区域(300m²)', '装卸平台(400m²)', '仓库南区(600m²)'];
    const depts = ['生产部', '安全部', '技术部', '全体人员'];
    const fences = [];
    for (let i = 1; i <= 10; i++) {
      const fenceType = fenceTypes[Math.floor(Math.random() * fenceTypes.length)];
      const alertCount = Math.floor(Math.random() * 3) + 1;
      const alertMethod = [];
      for (let j = 0; j < alertCount; j++) {
        const m = alertMethods[Math.floor(Math.random() * alertMethods.length)];
        if (!alertMethod.includes(m)) alertMethod.push(m);
      }
      fences.push({
        id: 'GF-' + String(i).padStart(4, '0'),
        name: ['生产区电子围栏', '危化品禁入围栏', '配电室安全围栏', '锅炉房作业围栏', '装卸区通行围栏', '仓库告警围栏', '办公区通行围栏', '卸货平台围栏', '停车场通行围栏', '实验室禁入围栏'][i - 1],
        fenceType: fenceType,
        area: areas[Math.floor(Math.random() * areas.length)],
        alertMethod: alertMethod.join('、'),
        associatedDept: depts[Math.floor(Math.random() * depts.length)],
        status: Math.random() > 0.2 ? 'enabled' : 'disabled',
        createTime: this.randomDate(2025, 2026)
      });
    }
    return fences;
  },

  // 生成定位轨迹数据（对标规范：定位轨迹页面）
  generateLocationTrails: function() {
    const positionStatuses = ['正常', '信号弱', '离线'];
    const trails = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    for (let i = 0; i < this.persons.length; i++) {
      const p = this.persons[i];
      const enterHour = 7 + Math.floor(Math.random() * 3);
      const enterMin = Math.floor(Math.random() * 60);
      const leaveHour = 17 + Math.floor(Math.random() * 3);
      const leaveMin = Math.floor(Math.random() * 60);
      const enterTime = String(enterHour).padStart(2, '0') + ':' + String(enterMin).padStart(2, '0');
      const leaveTime = String(leaveHour).padStart(2, '0') + ':' + String(leaveMin).padStart(2, '0');
      const status = positionStatuses[Math.floor(Math.random() * positionStatuses.length)];
      trails.push({
        id: 'TRAIL-' + String(i + 1).padStart(4, '0'),
        personName: p.name,
        personId: p.id,
        dept: p.dept,
        trackDate: today,
        enterTime: enterTime,
        leaveTime: status === '离线' ? '-' : leaveTime,
        trackPoints: status === '离线' ? 0 : Math.floor(Math.random() * 800) + 200,
        positionStatus: status
      });
    }
    return trails;
  },

  // 生成安全积分账户数据
  generateSecurityAccounts: function() {
    return this.persons.map(p => ({
      personId: p.id,
      personName: p.name,
      dept: p.dept,
      totalScore: p.score,
      baseScore: 80,
      addedScore: Math.floor(Math.random() * 30),
      deductedScore: Math.floor(Math.random() * 40),
      rating: p.score >= 90 ? '优秀' : (p.score >= 70 ? '良好' : (p.score >= 50 ? '合格' : '不合格')),
      freezeStatus: p.score < 50 ? '已冻结' : (p.score < 60 ? '预警中' : '正常'),
      lastUpdate: this.randomDate(2026, 2026).split(' ')[0]
    }));
  },

  // 生成积分流水数据
  generateScoreFlows: function(personId) {
    const flowTypes = ['周期考评加分', '安全培训加分', '隐患上报加分', '安全建议加分', '月度安全之星加分', '违规扣分', '事故扣分', '未参会扣分', '人工调分', '申诉冲抵'];
    const flows = [];
    const count = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < count; i++) {
      const type = flowTypes[Math.floor(Math.random() * flowTypes.length)];
      const isPositive = ['周期考评加分', '安全培训加分', '隐患上报加分', '安全建议加分', '月度安全之星加分', '人工调分', '申诉冲抵'].includes(type);
      const score = isPositive ? Math.floor(Math.random() * 20) + 5 : -(Math.floor(Math.random() * 20) + 5);
      flows.push({
        id: 'SF-' + personId + '-' + String(i + 1).padStart(3, '0'),
        personId: personId,
        flowType: type,
        score: score,
        balance: 80 + flows.reduce((s, f) => s + f.score, 0) + score,
        occurTime: this.randomDate(2026, 2026),
        source: type === '人工调分' ? '调分单据' : (type === '申诉冲抵' ? '申诉单据' : '系统自动'),
        remark: type + ' - 周期内自动汇总/人工操作'
      });
    }
    return flows;
  },

  // 生成周期考评数据（系统自动汇总的数据摘要）
  generateAssessmentSummary: function(personId) {
    const person = this.persons.find(p => p.id === personId) || this.persons[0];
    return {
      personId: personId,
      personName: person.name,
      dept: person.dept,
      period: '2026年Q2',
      trainingCount: Math.floor(Math.random() * 5) + 1,
      trainingPassRate: Math.floor(Math.random() * 30) + 70 + '%',
      violationCount: Math.floor(Math.random() * 4),
      violationDeduct: Math.floor(Math.random() * 30),
      workOrderCompleted: Math.floor(Math.random() * 8) + 2,
      workOrderOverdue: Math.floor(Math.random() * 3),
      baseScore: 80,
      autoCalculatedScore: Math.floor(Math.random() * 30) + 55
    };
  },

  // 生成积分申诉数据
  generateAppealData: function(personId) {
    const person = this.persons.find(p => p.id === personId) || this.persons[0];
    const flows = this.generateScoreFlows(personId);
    const disputedFlow = flows.find(f => f.score < 0) || flows[0];
    return {
      appealId: 'APPEAL-' + personId + '-' + Date.now().toString(36).toUpperCase(),
      personId: personId,
      personName: person.name,
      dept: person.dept,
      disputedFlowId: disputedFlow?.id || 'SF-001',
      disputedScore: disputedFlow?.score || -10,
      disputedReason: disputedFlow?.remark || '违规扣分',
      appealReason: '对该笔扣分有异议，当时已按规程操作，建议重新核查现场监控记录',
      demand: '请求撤销该笔扣分，恢复积分',
      status: '待处理'
    };
  },

  // 工具函数
  randomDate: function(startYear, endYear) {
    const start = new Date(startYear, 0, 1).getTime();
    const end = new Date(endYear, 11, 31).getTime();
    const d = new Date(start + Math.random() * (end - start));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' +
           String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  randomNode: function(module, subType) {
    let nodes;
    if ((module === 'a' || module === 'b') && subType) {
      const subTypeKey = module === 'a' ? 'a' : 'b';
      const subTypes = PWD_CONFIG.flowSubTypes[subTypeKey] || [];
      const st = subTypes.find(s => s.value === subType);
      nodes = PWD_CONFIG.flowNodes[st?.nodeKey || module] || PWD_CONFIG.flowNodes[module];
    } else if (module === 'c' && subType) {
      const cTypes = PWD_CONFIG.flowCSubTypes || {};
      const ct = cTypes[subType];
      nodes = ct ? ct.flowNodes : PWD_CONFIG.flowNodes.c;
    } else if (module === 'd' && subType) {
      const dTypes = PWD_CONFIG.flowDSubTypes || {};
      const dt = dTypes[subType];
      nodes = dt ? dt.flowNodes : PWD_CONFIG.flowNodes.d;
    } else {
      nodes = PWD_CONFIG.flowNodes[module];
    }
    return nodes[Math.floor(Math.random() * nodes.length)];
  },

  getStatusLabel: function(status) {
    const map = { pending: '待处理', processing: '处理中', done: '已完成', rejected: '已驳回', draft: '草稿' };
    return map[status] || status;
  },

  getQualStatusLabel: function(status) {
    const map = { valid: '有效', expiring: '即将过期', expired: '已过期', pending_review: '待审核', revoked: '已作废' };
    return map[status] || status;
  },

  getRiskLevelColor: function(level) {
    const map = { '无风险': '#52c41a', '低风险': '#faad14', '中风险': '#fa8c16', '高风险': '#f5222d' };
    return map[level] || '#909399';
  },

  getTrainingStatusLabel: function(status) {
    const map = { completed: '已完成', in_progress: '进行中', planned: '计划中' };
    return map[status] || status;
  },

  formatDate: function(dateStr) {
    if (!dateStr) return '-';
    return dateStr.split(' ')[0];
  }
};

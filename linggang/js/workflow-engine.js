/* ============================================================
 * 工作流引擎 - BPMN流程图渲染 & 流程逻辑
 * ============================================================ */

const WorkflowEngine = {
  /**
   * 渲染BPMN流程图（SVG/CSS模拟）
   * @param {string} module - 业务模块(a/b/c/d)
   * @param {Array} records - 流转记录
   * @param {string} containerId - 容器元素ID
   * @param {string} subType - 准入办证子类型(qual/long/temp/loss)
   */
  renderFlowDiagram: function(module, records, containerId, subType) {
    // 根据子类型获取节点
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
    const container = document.getElementById(containerId);
    if (!container) return;

    // 找到当前活跃节点
    const activeIndex = records.findIndex(r => !r.isDone);
    const currentNodeIndex = activeIndex === -1 ? nodes.length - 1 : activeIndex;

    let html = '<div class="bpmn-container"><div class="bpmn-flow">';

    // 开始节点
    html += `
      <div class="bpmn-node bpmn-node--start bpmn-node--done" data-node="start">
        <div class="bpmn-node__title">开始</div>
        <div class="bpmn-node-tooltip">
          <div style="font-weight:600;margin-bottom:4px;">流程发起</div>
          <div style="font-size:12px;color:#666;">发起人: ${records[0]?.handler || '-'}</div>
          <div style="font-size:12px;color:#666;">时间: ${records[0]?.time || '-'}</div>
        </div>
      </div>
      <div class="bpmn-arrow bpmn-arrow--done"></div>
    `;

    // 流程节点
    nodes.forEach((node, index) => {
      let nodeClass = 'bpmn-node--pending';
      if (index < currentNodeIndex) nodeClass = 'bpmn-node--done';
      else if (index === currentNodeIndex) nodeClass = 'bpmn-node--active';

      const record = records[index] || {};
      const isLast = index === nodes.length - 1;

      html += `
        <div class="bpmn-node ${nodeClass}" data-node="${node}">
          <div class="bpmn-node__title">${node}</div>
          <div class="bpmn-node__desc">${record.handler || '待处理'}</div>
          <div class="bpmn-node-tooltip">
            <div style="font-weight:600;margin-bottom:4px;">${node}</div>
            <div style="font-size:12px;color:#666;">处理人: ${record.handler || '未分配'}</div>
            <div style="font-size:12px;color:#666;">时间: ${record.time || '-'}</div>
            <div style="font-size:12px;color:#666;">意见: ${record.opinion || '-'}</div>
          </div>
        </div>
      `;

      if (!isLast) {
        html += `<div class="bpmn-arrow ${index < currentNodeIndex ? 'bpmn-arrow--done' : ''}"></div>`;
      }
    });

    // 结束节点
    const isAllDone = activeIndex === -1;
    html += `
      <div class="bpmn-arrow ${isAllDone ? 'bpmn-arrow--done' : ''}"></div>
      <div class="bpmn-node bpmn-node--end ${isAllDone ? 'bpmn-node--done' : 'bpmn-node--pending'}" data-node="end">
        <div class="bpmn-node__title">结束</div>
      </div>
    `;

    html += '</div></div>';
    container.innerHTML = html;
  },

  /**
   * 渲染流转记录时间轴
   */
  renderFlowTimeline: function(records, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div class="timeline">';
    records.forEach((record, index) => {
      let dotClass = '';
      if (record.isDone) {
        dotClass = record.actionType === 'reject' ? 'timeline-item__dot--rejected' : 'timeline-item__dot--done';
      }
      const actionLabels = { agree: '同意', reject: '驳回', cc: '抄送', pending: '待处理' };
      html += `
        <div class="timeline-item">
          <div class="timeline-item__dot ${dotClass}"></div>
          <div class="timeline-item__content">
            <div class="timeline-item__header">
              <span class="timeline-item__name">${record.nodeName}</span>
              <span class="timeline-item__time">${record.time || '-'}</span>
            </div>
            <div style="margin-bottom:4px;">
              <span style="color:#909399;">处理人：</span>${record.handler}
              <span style="margin-left:16px;color:#909399;">操作类型：</span>
              <span class="status-tag status-tag--${record.actionType === 'reject' ? 'rejected' : (record.isDone ? 'done' : 'pending')}">${actionLabels[record.actionType] || record.actionType}</span>
            </div>
            ${record.opinion ? `<div class="timeline-item__opinion"><span style="color:#909399;">处理意见：</span>${record.opinion}</div>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * 获取下一步可用操作
   */
  getAvailableActions: function(records, userRole) {
    const activeIndex = records.findIndex(r => !r.isDone);
    const isAllDone = activeIndex === -1;
    const isRejected = records.some(r => r.actionType === 'reject');

    const actions = {
      next: { enabled: !isAllDone && !isRejected, label: '下一步', type: 'primary' },
      cc: { enabled: !isAllDone && !isRejected, label: '抄送', type: 'default' },
      reject: { enabled: !isAllDone && !isRejected, label: '驳回', type: 'warning' },
      terminate: { enabled: !isAllDone, label: '终止', type: 'danger' },
      save: { enabled: true, label: '保存草稿', type: 'default' },
      back: { enabled: true, label: '返回', type: 'default' }
    };

    // 模拟角色权限控制
    if (userRole === 'viewer') {
      Object.keys(actions).forEach(k => { if (k !== 'back') actions[k].enabled = false; });
    }

    return actions;
  },

  /**
   * 检查联动场景
   */
  checkLinkageScenarios: function(personId, module) {
    const person = MOCK.persons.find(p => p.id === personId);
    const scenarios = [];

    if (person) {
      // 资质过期检查
      const qualDate = new Date(person.qualificationDate);
      const now = new Date();
      if (qualDate < now) {
        scenarios.push({
          type: 'qualification_expired',
          message: `该人员资质已于 ${person.qualificationDate} 过期，系统已冻结其证件办理权限`,
          severity: 'error',
          actionBlocked: true
        });
      }

      // 积分低分检查
      if (person.score < 50) {
        scenarios.push({
          type: 'low_score',
          message: `该人员安全积分仅剩 ${person.score} 分，已触发低分冻结阈值（50分），证件权限已被冻结`,
          severity: 'warning',
          actionBlocked: true
        });
      } else if (person.score < 70) {
        scenarios.push({
          type: 'score_warning',
          message: `该人员安全积分偏低（${person.score} 分），请关注其安全表现`,
          severity: 'warning',
          actionBlocked: false
        });
      }
    }

    return scenarios;
  }
};

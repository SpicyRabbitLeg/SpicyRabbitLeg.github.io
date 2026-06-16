/* ============================================================
 * 模块页面渲染 - 生成所有业务模块的HTML内容
 * ============================================================ */

const PageRenderer = {
  /**
   * 根据菜单标识渲染对应页面
   */
  render: function(menuKey) {
    const container = document.getElementById('pageContainer');
    if (!container) return;

    let html = '';
    if (menuKey.startsWith('workflow-')) {
      html = this.renderWorkflowTaskList(menuKey);
    } else if (menuKey.startsWith('org-')) {
      html = this.renderOrgPage(menuKey);
    } else if (menuKey.startsWith('personnel-')) {
      html = this.renderPersonnelPage(menuKey);
    } else if (menuKey.startsWith('onsite-')) {
      html = this.renderOnsitePage(menuKey);
    } else if (menuKey.startsWith('safety-')) {
      html = this.renderSafetyPage(menuKey);
    } else if (menuKey.startsWith('common-')) {
      html = this.renderCommonPage(menuKey);
    } else {
      html = this.renderHomePage();
    }
    container.innerHTML = html;
  },

  /* ========== 首页 ========== */
  renderHomePage: function() {
    return `
      <div class="page-container">
        <h2 style="margin-bottom:20px;">欢迎使用人员全生命周期一体化管控平台</h2>
        <div class="stat-cards">
          <div class="stat-card" onclick="app.switchToMenu('workflow-pending-a')">
            <div class="stat-card__icon stat-card__icon--blue">📋</div>
            <div class="stat-card__info">
              <div class="stat-card__label">待办任务</div>
              <div class="stat-card__value">12</div>
            </div>
          </div>
          <div class="stat-card" onclick="app.switchToMenu('personnel-archive')">
            <div class="stat-card__icon stat-card__icon--green">👤</div>
            <div class="stat-card__info">
              <div class="stat-card__label">在岗人员</div>
              <div class="stat-card__value">1,286</div>
            </div>
          </div>
          <div class="stat-card" onclick="app.switchToMenu('onsite-violation')">
            <div class="stat-card__icon stat-card__icon--orange">⚠️</div>
            <div class="stat-card__info">
              <div class="stat-card__label">今日告警</div>
              <div class="stat-card__value">8</div>
            </div>
          </div>
          <div class="stat-card" onclick="app.switchToMenu('safety-score')">
            <div class="stat-card__icon stat-card__icon--red">📊</div>
            <div class="stat-card__info">
              <div class="stat-card__label">安全积分预警</div>
              <div class="stat-card__value">3</div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="pwd-card">
            <div class="pwd-card__header">待办事项</div>
            <div class="pwd-card__body">
              <table class="el-table" style="width:100%">
                <thead><tr><th>事项</th><th>类型</th><th>时间</th></tr></thead>
                <tbody>
                  <tr><td>张三-准入办证申请</td><td>准入办证</td><td>2026-05-29 09:30</td></tr>
                  <tr><td>李四-访客登记</td><td>访客管理</td><td>2026-05-29 10:00</td></tr>
                  <tr><td>王五-离场申请</td><td>离场准出</td><td>2026-05-29 08:45</td></tr>
                  <tr><td>赵六-安全考评</td><td>安全考评</td><td>2026-05-28 16:20</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="pwd-card">
            <div class="pwd-card__header">资质到期预警</div>
            <div class="pwd-card__body">
              <div class="warning-banner">
                <span class="warning-banner__icon">⚠️</span>
                <span class="warning-banner__text">即将到期资质：<span class="warning-banner__count">5</span> 人</span>
                <span style="font-size:12px;color:#999;">近30日内</span>
              </div>
              <table class="el-table" style="width:100%">
                <thead><tr><th>人员</th><th>证书类型</th><th>到期日期</th><th>剩余天数</th></tr></thead>
                <tbody>
                  <tr><td>王五</td><td>安全操作证</td><td>2026-06-15</td><td><span style="color:#fa8c16;font-weight:600">17天</span></td></tr>
                  <tr><td>钱七</td><td>特种作业证</td><td>2026-06-20</td><td><span style="color:#fa8c16;font-weight:600">22天</span></td></tr>
                  <tr><td>吴十</td><td>上岗证</td><td>2026-06-28</td><td><span style="color:#fa8c16;font-weight:600">30天</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ========== 工作流任务列表 ========== */
  renderWorkflowTaskList: function(menuKey) {
    const parts = menuKey.split('-'); // workflow-[type]-[module]
    const taskType = parts[1]; // issued/pending/done
    const module = parts[2]; // a/b/c/d
    const taskTypeName = taskType === 'issued' ? '已发任务' : (taskType === 'pending' ? '待办任务' : '已办任务');
    const tasks = MOCK.generateTasks(module, taskType);
    const id = 'wtbl_' + menuKey;

    // 延迟绑定表格数据
    setTimeout(() => {
      if (window.app && window.app.bindWorkflowTable) {
        window.app.bindWorkflowTable(id, tasks, module);
      }
    }, 50);

    return `
      <div class="page-container">
        <div class="filter-bar">
          <div class="el-input" style="width:200px;">
            <input class="el-input__inner" placeholder="任务编号" oninput="window._wfFilterTaskId='${module}:'+this.value"/>
          </div>
          <div class="el-input" style="width:200px;">
            <input class="el-input__inner" placeholder="人员姓名" oninput="window._wfFilterName=this.value"/>
          </div>
          <div class="el-select" style="width:160px;">
            <select class="el-input__inner" onchange="window._wfFilterStatus=this.value">
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="done">已完成</option>
              <option value="rejected">已驳回</option>
              <option value="draft">草稿</option>
            </select>
          </div>
          <div class="el-input" style="width:280px;">
            <input class="el-input__inner" type="date" placeholder="开始日期" onchange="window._wfFilterStart=this.value"/>
          </div>
          <div class="el-input" style="width:280px;">
            <input class="el-input__inner" type="date" placeholder="结束日期" onchange="window._wfFilterEnd=this.value"/>
          </div>
          <button class="el-button el-button--primary" onclick="app.filterWorkflowTable('${id}','${module}')">查询</button>
          <button class="el-button el-button--default" onclick="app.resetWorkflowFilter('${id}','${module}')">重置</button>
          ${(taskType === 'issued' && (module === 'a' || module === 'b' || module === 'c' || module === 'd')) ? `
          <button class="el-button el-button--primary" onclick="app.openFlowStarter('${module}')" style="margin-left:auto;font-weight:600;">
            <span style="font-size:16px;margin-right:4px;">🚀</span>启动流程
          </button>
          ` : ''}
          <button class="el-button el-button--success" onclick="app.exportTable('${id}')">导出Excel</button>
        </div>
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">${taskTypeName}列表</span>
            <span style="color:#909399;font-size:12px;">共 ${tasks.length} 条记录</span>
          </div>
          <div id="${id}">
            <table class="el-table" style="width:100%">
              <thead><tr>
                <th>任务ID</th><th>业务类型</th><th>申请人</th><th>申请时间</th><th>当前节点</th><th>状态</th><th>紧急程度</th><th>操作</th>
              </tr></thead>
              <tbody>
              ${tasks.map(t => `
                <tr>
                  <td style="color:var(--pwd-primary);cursor:pointer" onclick="app.openTaskEditor('${t.id}','${module}')">${t.id}</td>
                  <td>${t.bizType}</td>
                  <td>${PWD_CONFIG.maskRules.name(t.applicant)}</td>
                  <td>${t.applyTime}</td>
                  <td>${t.currentNode}</td>
                  <td><span class="status-tag status-tag--${t.status}">${MOCK.getStatusLabel(t.status)}</span></td>
                  <td>${t.urgency === 'urgent' ? '<span style="color:#f5222d;">⚠ 紧急</span>' : '<span style="color:#909399;">普通</span>'}</td>
                  <td>
                    <button class="el-button el-button--primary el-button--small" onclick="app.openTaskEditor('${t.id}','${module}')">查看</button>
                    ${taskType === 'pending' ? `<button class="el-button el-button--success el-button--small" onclick="app.openTaskEditor('${t.id}','${module}')">处理</button>` : ''}
                    ${taskType === 'issued' && t.status === 'draft' ? `<button class="el-button el-button--danger el-button--small" onclick="app.cancelTask('${t.id}')">撤销</button>` : ''}
                  </td>
                </tr>
              `).join('')}
              </tbody>
            </table>
            <div style="display:flex;justify-content:flex-end;padding:12px 0;">
              <div class="el-pagination">
                <button class="el-button el-button--default el-button--small" disabled>上一页</button>
                <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 2 页</span>
                <button class="el-button el-button--default el-button--small" onclick="ElMessage.info('已是最后一页')">下一页</button>
                <span style="margin-left:8px;line-height:32px;">共 ${tasks.length} 条</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ========== 工作流任务编辑器 ========== */
  renderTaskEditor: function(taskId, module) {
    // 优先使用 main.js 中已生成的记录（含子类型），否则回退生成默认记录
    let records = window._currentFlowRecords;
    let subType = window._currentSubType;
    if (!records) {
      subType = (module === 'a' ? 'qual' : undefined);
      records = MOCK.generateFlowRecords(module, subType);
    }
    // 消费后清除，避免干扰后续
    window._currentFlowRecords = null;
    window._currentSubType = null;

    const person = MOCK.persons[Math.floor(Math.random() * MOCK.persons.length)];
    const scenarios = WorkflowEngine.checkLinkageScenarios(person.id, module);
    const isBlocked = scenarios.some(s => s.actionBlocked);
    const actions = WorkflowEngine.getAvailableActions(records, 'operator');

    setTimeout(() => {
      WorkflowEngine.renderFlowDiagram(module, records, 'flowDiagramContainer', subType);
      WorkflowEngine.renderFlowTimeline(records, 'flowTimelineContainer');
    }, 50);

    // 各模块表单字段
    const formFields = this.getFormFields(module, person);

    return `
      <div class="workflow-editor" style="height:auto;min-height:calc(100vh - 200px);">
        <!-- 联动场景提示 -->
        ${scenarios.map(s => `
          <div class="alert-info alert-info--${s.severity}">
            <strong>${s.type === 'qualification_expired' ? '资质过期通知' : (s.type === 'low_score' ? '积分冻结通知' : '积分预警通知')}：</strong>
            ${s.message}
            ${s.actionBlocked ? '<span style="margin-left:8px;color:#f5222d;">【表单提交按钮已禁用】</span>' : ''}
          </div>
        `).join('')}

        <!-- 操作按钮区 -->
        <div class="workflow-editor__toolbar">
          <span style="font-weight:600;">任务编号：${taskId}</span>
          <span class="spacer"></span>
          ${module === 'c' && subType === 'resign' ? `
            <button class="el-button el-button--success" onclick="app.confirmAssetCheck('${taskId}')">📋 资产核对确认</button>
            <button class="el-button el-button--warning" onclick="app.confirmSecurityReview('${taskId}')">🔒 安全管理复核</button>
            <button class="el-button el-button--danger" onclick="app.executeExitPostActions('${person.id}','${taskId}')">⚡ 执行后置动作</button>
          ` : ''}
          ${module === 'c' && subType === 'expel' ? `
            <button class="el-button el-button--danger" onclick="app.executeExpelActions('${person.id}','${taskId}')">⛔ 执行清退动作</button>
            <button class="el-button el-button--default" onclick="app.viewRelatedViolation(document.getElementById('expelViolation')?.value)">🔗 关联违规</button>
          ` : ''}
          ${module === 'd' && subType === 'assessment' ? `
            <button class="el-button el-button--success" onclick="app.executeAutoScoreCalc()">📊 执行自动积分计算</button>
            <button class="el-button el-button--warning" onclick="app.previewThresholdLinkage()">⚡ 阈值联动预览</button>
            <button class="el-button el-button--primary" onclick="app.batchUpdateAccounts()">📤 批量更新积分账户</button>
          ` : ''}
          ${module === 'd' && subType === 'adjustment' ? `
            <button class="el-button el-button--primary" onclick="app.previewAdjustedScore()">📐 预览调整后积分</button>
          ` : ''}
          ${module === 'd' && subType === 'appeal' ? `
            <button class="el-button el-button--info" onclick="app.viewOriginalRecord()">🔍 查看原始安全记录</button>
          ` : ''}
          <button class="el-button el-button--primary" ${isBlocked ? 'disabled' : ''} onclick="app.workflowNext('${taskId}')">${actions.next.label}</button>
          <button class="el-button el-button--default" ${!actions.cc.enabled ? 'disabled' : ''} onclick="app.workflowCC('${taskId}')">${actions.cc.label}</button>
          <button class="el-button el-button--warning" ${!actions.reject.enabled ? 'disabled' : ''} onclick="app.workflowReject('${taskId}')">${actions.reject.label}</button>
          <button class="el-button el-button--danger" ${!actions.terminate.enabled ? 'disabled' : ''} onclick="app.workflowTerminate('${taskId}')">${actions.terminate.label}</button>
          <button class="el-button el-button--default" onclick="app.saveDraft('${taskId}')">${actions.save.label}</button>
          <button class="el-button el-button--default" onclick="app.closeTaskEditor()">${actions.back.label}</button>
        </div>

        <!-- 联动场景禁止提示 -->
        ${isBlocked ? '<div class="permission-frozen">当前任务因上述原因被冻结，提交/审批功能已禁用。请联系管理员处理。</div>' : ''}

        <!-- Tabs标签页 -->
        <div class="workflow-editor__tabs" style="margin-top:8px;">
          <div class="el-tabs" style="height:100%;display:flex;flex-direction:column;">
            <div class="el-tabs__header" style="margin:0;padding:0 20px;">
              <div class="el-tabs__nav" style="display:flex;gap:0;">
                <div class="el-tabs__item is-active" style="padding:0 20px;height:40px;line-height:40px;cursor:pointer;border-bottom:2px solid var(--pwd-primary);color:var(--pwd-primary);" onclick="app.switchEditorTab(event,'form')">表单</div>
                <div class="el-tabs__item" style="padding:0 20px;height:40px;line-height:40px;cursor:pointer;color:#606266;" onclick="app.switchEditorTab(event,'flow')">流程图</div>
                <div class="el-tabs__item" style="padding:0 20px;height:40px;line-height:40px;cursor:pointer;color:#606266;" onclick="app.switchEditorTab(event,'record')">流转记录</div>
              </div>
            </div>
            <div class="el-tabs__content" style="flex:1;overflow-y:auto;padding:20px;">
              <!-- 表单标签页 -->
              <div id="editorTabForm" class="workflow-form">
                ${formFields}
                <div class="workflow-form__section">
                  <div class="workflow-form__section-title">附件上传</div>
                  <div style="border:2px dashed var(--pwd-border-light);border-radius:8px;padding:40px;text-align:center;cursor:pointer;color:var(--pwd-text-secondary);" onclick="app.simulateFileUpload()">
                    <div style="font-size:40px;margin-bottom:8px;">📎</div>
                    <div>点击或拖拽文件到此区域上传</div>
                    <div style="font-size:12px;margin-top:4px;">支持 .pdf .jpg .png .docx 格式，单文件不超过10MB</div>
                  </div>
                  <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                    <div class="file-card" style="width:180px;">
                      <div class="file-card__icon">📄</div>
                      <div class="file-card__name">身份证扫描件.pdf</div>
                      <div class="file-card__size">2.3 MB</div>
                    </div>
                    <div class="file-card" style="width:180px;">
                      <div class="file-card__icon">🖼️</div>
                      <div class="file-card__name">一寸照片.jpg</div>
                      <div class="file-card__size">856 KB</div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 流程图标签页 -->
              <div id="editorTabFlow" class="workflow-diagram" style="display:none;">
                <div id="flowDiagramContainer" style="width:100%;height:100%;min-height:500px;"></div>
                <div class="workflow-diagram__controls">
                  <button class="el-button el-button--default el-button--small" onclick="app.zoomDiagram(1)">🔍+</button>
                  <button class="el-button el-button--default el-button--small" onclick="app.zoomDiagram(-1)">🔍-</button>
                  <button class="el-button el-button--default el-button--small" onclick="app.resetDiagramZoom()">↺</button>
                </div>
              </div>
              <!-- 流转记录标签页 -->
              <div id="editorTabRecord" style="display:none;">
                <div id="flowTimelineContainer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* 各业务模块表单字段 */
  getFormFields: function(module, person) {
    let fields = '';

    // 申请人信息（通用）
    fields += `
      <div class="workflow-form__section">
        <div class="workflow-form__section-title">申请人信息</div>
        <div class="form-grid">
          <div class="el-form-item">
            <label class="el-form-item__label">姓名</label>
            <div class="el-input"><input class="el-input__inner" value="${person.name}" /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">身份证号</label>
            <div class="el-input"><input class="el-input__inner masked-field" value="${PWD_CONFIG.maskRules.idCard(person.idCard)}" onclick="app.viewSensitive('idCard','${person.idCard}','${person.id}')" readonly /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">手机号</label>
            <div class="el-input"><input class="el-input__inner masked-field" value="${PWD_CONFIG.maskRules.phone(person.phone)}" onclick="app.viewSensitive('phone','${person.phone}','${person.id}')" readonly /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">所属部门</label>
            <div class="el-input"><input class="el-input__inner" value="${person.dept}" /></div>
          </div>
        </div>
      </div>
    `;

    // A模块：准入办证
    if (module === 'a') {
      const subTypes = PWD_CONFIG.flowSubTypes.a || [];
      fields += `
        <div class="workflow-form__section">
          <div class="workflow-form__section-title">流程类型选择</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">流程类型 <span style="color:#f5222d;">*</span></label>
              <div class="el-select">
                <select class="el-input__inner" id="flowSubType" onchange="app.onFlowSubTypeChange()">
                  ${subTypes.map(st => `<option value="${st.value}" data-node-key="${st.nodeKey}">${st.label}</option>`).join('')}
                </select>
              </div>
              <div style="font-size:12px;color:#909399;margin-top:4px;" id="flowSubTypeDesc">${subTypes[0]?.desc || ''}</div>
            </div>
          </div>
        </div>
        <div id="flowSubTypeForms">
        <!-- ====== 资质证书申请（默认） ====== -->
        <div class="workflow-form__section" id="formQual">
          <div class="workflow-form__section-title">资质证书申请信息</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-QUAL-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">单据类型</label>
              <div class="el-input"><input class="el-input__inner" value="资质证申请" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">关联培训批次</label>
              <div class="el-select"><select class="el-input__inner"><option>TR-2026-001（取证培训-焊工班）</option><option>TR-2026-002（安全员培训）</option><option>TR-2026-003（电工证培训）</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">资质模板</label>
              <div class="el-select"><select class="el-input__inner"><option>特种作业操作证（焊接）</option><option>安全员资格证</option><option>电工进网作业许可证</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">证书名称</label>
              <div class="el-input"><input class="el-input__inner" placeholder="如：焊接与热切割作业证" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">有效期起</label>
              <div class="el-input"><input class="el-input__inner" type="date" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">有效期止</label>
              <div class="el-input"><input class="el-input__inner" type="date" /></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">申请事由</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请输入申请事由"></textarea></div>
            </div>
          </div>
        </div>
        <!-- ====== 长期通行证申请 ====== -->
        <div class="workflow-form__section" id="formLong" style="display:none;">
          <div class="workflow-form__section-title">长期通行证申请信息</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-LONG-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">单据类型</label>
              <div class="el-input"><input class="el-input__inner" value="长期通行证申请" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">关联资质</label>
              <div class="el-select"><select class="el-input__inner"><option>特种作业操作证（有效至2027-06）</option><option>安全员资格证（有效至2026-12）</option><option>电工证（有效至2027-03）</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">关联合同</label>
              <div class="el-select"><select class="el-input__inner"><option>HT-2025-001（固定期限至2027-03）</option><option>HT-2025-008（固定期限至2028-06）</option><option>不适用（内部员工）</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行证有效期起</label>
              <div class="el-input"><input class="el-input__inner" type="date" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行证有效期止</label>
              <div class="el-input"><input class="el-input__inner" type="date" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行区域</label>
              <div class="el-select"><select class="el-input__inner"><option>全厂区</option><option>生产区</option><option>办公区</option><option>仓储区</option><option>指定区域（需填写）</option></select></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">申请事由</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请输入申请事由"></textarea></div>
            </div>
          </div>
        </div>
        <!-- ====== 临时通行证申请 ====== -->
        <div class="workflow-form__section" id="formTemp" style="display:none;">
          <div class="workflow-form__section-title">临时通行证申请信息</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-TEMP-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">单据类型</label>
              <div class="el-input"><input class="el-input__inner" value="临时通行证申请" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">临时人员姓名</label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入姓名" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">身份证号</label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入身份证号" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">所属单位</label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入所属单位" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行起止时间</label>
              <div class="el-input" style="display:flex;gap:8px;">
                <input class="el-input__inner" type="datetime-local" style="flex:1;" placeholder="开始" />
                <span style="line-height:36px;">至</span>
                <input class="el-input__inner" type="datetime-local" style="flex:1;" placeholder="结束" />
              </div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行区域</label>
              <div class="el-select"><select class="el-input__inner"><option>指定作业区</option><option>办公区</option><option>仅限门岗-指定区域</option><option>全厂区（需审批）</option></select></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">作业事由</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请输入作业事由"></textarea></div>
            </div>
          </div>
        </div>
        <!-- ====== 证件挂失/补办 ====== -->
        <div class="workflow-form__section" id="formLoss" style="display:none;">
          <div class="workflow-form__section-title">证件挂失/补办信息</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-LOSS-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">操作类型</label>
              <div class="el-select"><select class="el-input__inner" id="lossType"><option value="挂失">证件挂失</option><option value="补办">证件补办</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">原证件编号</label>
              <div class="el-input"><input class="el-input__inner" placeholder="请选择或输入原证件编号" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">原证件类型</label>
              <div class="el-select"><select class="el-input__inner"><option>资质证书</option><option>长期通行证</option><option>临时通行证</option></select></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">挂失/补办理由</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请输入挂失/补办理由"></textarea></div>
            </div>
          </div>
        </div>
        </div>
      `;
    }
    // B模块：访客管理（含4种子类型）
    else if (module === 'b') {
      const subTypes = PWD_CONFIG.flowSubTypes.b || [];
      fields += `
        <div class="workflow-form__section">
          <div class="workflow-form__section-title">访客申请类型选择</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">申请类型 <span style="color:#f5222d;">*</span></label>
              <div class="el-select">
                <select class="el-input__inner" id="flowSubType" onchange="app.onVisitorSubTypeChange()">
                  ${subTypes.map(st => `<option value="${st.value}" data-node-key="${st.nodeKey}">${st.label}</option>`).join('')}
                </select>
              </div>
              <div style="font-size:12px;color:#909399;margin-top:4px;" id="flowSubTypeDesc">${subTypes[0]?.desc || ''}</div>
            </div>
          </div>
        </div>
        <div id="flowSubTypeForms">
        <!-- ====== 普通临时访客（默认） ====== -->
        <div class="workflow-form__section" id="formVisitor">
          <div class="workflow-form__section-title">普通临时访客通行申请</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-VISITOR-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">访客姓名 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入访客姓名" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">身份证号 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入身份证号" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">手机号 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入手机号" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">所属单位</label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入所属单位" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">对接人 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入对接人姓名" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">对接人部门</label>
              <div class="el-select"><select class="el-input__inner"><option>生产部</option><option>安全部</option><option>技术部</option><option>行政部</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行开始时间 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="datetime-local" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行结束时间 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="datetime-local" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行区域 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner"><option>办公区</option><option>生产区</option><option>仓储区</option><option>指定区域（需填写）</option></select></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">来访事由</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请输入来访事由"></textarea></div>
            </div>
          </div>
        </div>
        <!-- ====== 施工访客 ====== -->
        <div class="workflow-form__section" id="formConstruction" style="display:none;">
          <div class="workflow-form__section-title">施工访客通行申请</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-CONS-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">施工负责人 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入施工负责人姓名" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">施工人员数量 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="number" placeholder="如：5" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">施工人员清单</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请列出所有施工人员姓名、身份证号"></textarea></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">作业区域 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner"><option>A车间</option><option>B车间</option><option>配电室</option><option>锅炉房</option><option>危化品存储区</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">作业开始时间 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="datetime-local" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">作业结束时间 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="datetime-local" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">安全交底人</label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入安全交底人姓名" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">安全防护措施</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请描述安全防护措施，如：安全帽、安全带、灭火器等"></textarea></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">施工内容</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请输入施工内容"></textarea></div>
            </div>
          </div>
        </div>
        <!-- ====== 车辆访客 ====== -->
        <div class="workflow-form__section" id="formVehicle" style="display:none;">
          <div class="workflow-form__section-title">车辆访客通行申请</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-VEH-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">车牌号 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="如：苏A·88888" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">车辆类型</label>
              <div class="el-select"><select class="el-input__inner"><option>小型轿车</option><option>SUV</option><option>面包车</option><option>轻型货车</option><option>中型货车</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">驾驶员姓名 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入驾驶员姓名" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">驾驶员手机</label>
              <div class="el-input"><input class="el-input__inner" placeholder="请输入驾驶员手机号" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">随车人员</label>
              <div class="el-input"><input class="el-input__inner" placeholder="随车人员姓名（多个用逗号分隔）" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">停放区域 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner"><option>访客停车场</option><option>东区停车场</option><option>西区停车场</option><option>办公区停车场</option><option>装卸区</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行开始时间 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="datetime-local" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">通行结束时间 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="datetime-local" /></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">进入事由</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请输入车辆进入事由"></textarea></div>
            </div>
          </div>
        </div>
        <!-- ====== 访客注销 ====== -->
        <div class="workflow-form__section" id="formRevocation" style="display:none;">
          <div class="workflow-form__section-title">访客注销申请</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-REVOKE-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">关联在效单据 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner"><option>WF-VISITOR-001（张三-临时访客）</option><option>WF-CONS-003（施工队-施工访客）</option><option>WF-VEH-005（苏A·88888-车辆访客）</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">关联访客姓名</label>
              <div class="el-input"><input class="el-input__inner" value="张三" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">原通行有效期</label>
              <div class="el-input"><input class="el-input__inner" value="2026-06-11 09:00 至 2026-06-11 18:00" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item" style="grid-column:1/-1;">
              <label class="el-form-item__label">注销原因 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="请详细说明注销原因"></textarea></div>
            </div>
          </div>
        </div>
        </div>
      `;
    }
    // C模块：离场准出（主动离职 / 违规清退）
    else if (module === 'c') {
      const cTypes = PWD_CONFIG.flowCSubTypes || {};
      fields += `
        <div class="workflow-form__section">
          <div class="workflow-form__section-title">离场流程类型选择</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">流程类型 <span style="color:#f5222d;">*</span></label>
              <div class="el-select">
                <select class="el-input__inner" id="flowCType" onchange="app.onCSubTypeChange()">
                  <option value="resign" data-node-key="c_resign">主动离职申请</option>
                  <option value="expel" data-node-key="c_expel">违规清退申请</option>
                </select>
              </div>
              <div style="font-size:12px;color:#909399;margin-top:4px;" id="flowCTypeDesc">${cTypes.resign?.desc || ''}</div>
            </div>
          </div>
        </div>
        <div id="flowCTypeForms">
        <!-- ====== 主动离职申请 ====== -->
        <div class="workflow-form__section" id="cFormResign">
          <div class="workflow-form__section-title">📋 主动离职申请信息</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-EXIT-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">离场人员 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner" id="exitPerson"><option value="">请选择离场人员</option>
                ${MOCK.persons.filter(p => p.status === '在职' || p.status === '试用期').map(p => `<option value="${p.id}">${p.name}（${p.dept} - ${p.position}）</option>`).join('')}
              </select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">最后工作日 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" type="date" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">交接人 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner"><option value="">请选择交接人</option>
                ${MOCK.persons.map(p => `<option value="${p.id}">${p.name}（${p.dept} - ${p.position}）</option>`).join('')}
              </select></div>
            </div>
            <div class="el-form-item form-full">
              <label class="el-form-item__label">离职原因</label>
              <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="请说明离职原因，如：个人发展、家庭原因、合同到期不续签等"></textarea></div>
            </div>
          </div>

          <!-- 系统自动回填数据 -->
          <div style="margin-top:16px;padding:12px 16px;background:#e6f7ff;border-radius:6px;border:1px solid #91d5ff;">
            <div style="font-size:13px;font-weight:600;color:#1890ff;margin-bottom:8px;">🔄 系统自动回填数据</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:#555;">
              <div><span style="color:#999;">合同信息：</span>固定期限合同（2024-03-15 ~ 2027-03-14）</div>
              <div><span style="color:#999;">资质证书：</span>焊工证（有效至2027-06）、安全员证（有效至2026-12）</div>
              <div><span style="color:#999;">通行证件：</span>长期通行证（全厂区，有效至2027-03-14）</div>
              <div><span style="color:#999;">系统账号：</span>zhangsan（已绑定邮箱）</div>
              <div><span style="color:#999;">未办结工单：</span>WO-0015（整改中）、WO-0018（待验收）</div>
            </div>
          </div>

          <!-- 资产归还清单 -->
          <div style="margin-top:16px;" class="workflow-form__section">
            <div class="workflow-form__section-title">📦 资产归还清单（交接清单）</div>
            <div class="form-grid">
              <div class="el-form-item">
                <label class="el-form-item__label">工牌</label>
                <div class="el-select"><select class="el-input__inner"><option value="">请选择状态</option><option value="returned">已归还</option><option value="lost">丢失/未归还</option></select></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">办公设备（电脑/平板等）</label>
                <div class="el-select"><select class="el-input__inner"><option value="">请选择状态</option><option value="returned">已归还</option><option value="lost">丢失/未归还</option><option value="na">不适用</option></select></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">门禁卡/钥匙</label>
                <div class="el-select"><select class="el-input__inner"><option value="">请选择状态</option><option value="returned">已归还</option><option value="lost">丢失/未归还</option></select></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">劳保用品/PPE</label>
                <div class="el-select"><select class="el-input__inner"><option value="">请选择状态</option><option value="returned">已归还</option><option value="lost">丢失/未归还</option><option value="na">不适用</option></select></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">工具/仪器</label>
                <div class="el-select"><select class="el-input__inner"><option value="">请选择状态</option><option value="returned">已归还</option><option value="lost">丢失/未归还</option><option value="na">不适用</option></select></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">园区车辆/停车位</label>
                <div class="el-select"><select class="el-input__inner"><option value="">请选择状态</option><option value="returned">已归还</option><option value="lost">丢失/未归还</option><option value="na">不适用</option></select></div>
              </div>
            </div>
            <div style="margin-top:12px;">
              <label class="el-form-item__label">上传交接清单附件</label>
              <div style="border:2px dashed var(--pwd-border-light);border-radius:8px;padding:30px;text-align:center;cursor:pointer;color:var(--pwd-text-secondary);margin-top:8px;" onclick="app.simulateFileUpload()">
                <div style="font-size:36px;margin-bottom:8px;">📎</div>
                <div>点击上传交接清单（支持 .pdf .jpg .docx）</div>
              </div>
            </div>
          </div>

          <!-- 安全管理复核（预填参考） -->
          <div style="margin-top:16px;padding:12px 16px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;">
            <div style="font-size:13px;font-weight:600;color:#fa8c16;margin-bottom:8px;">🔒 安全管理复核参考</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px;color:#555;">
              <div><span style="color:#999;">违规记录：</span>近12个月违规 <strong style="color:#f5222d;">2</strong> 次</div>
              <div><span style="color:#999;">安全积分：</span><strong style="color:#52c41a;">92</strong> 分</div>
              <div><span style="color:#999;">未闭环安全工单：</span><strong style="color:#fa8c16;">2</strong> 项</div>
            </div>
          </div>
        </div>

        <!-- ====== 违规清退申请 ====== -->
        <div class="workflow-form__section" id="cFormExpel" style="display:none;">
          <div class="workflow-form__section-title">⚠️ 违规清退申请信息</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-EXPEL-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">发起人（安全管理员/部门负责人）</label>
              <div class="el-input"><input class="el-input__inner" value="王安全员" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">关联违规单号 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner" id="expelViolation">
                <option value="">请选择关联违规事件</option>
                ${MOCK.generateViolations().map(v => `<option value="${v.id}">${v.id} - ${v.personName}（${v.description.substring(0, 20)}...）</option>`).join('')}
              </select></div>
            </div>
            <div class="el-form-item form-full">
              <label class="el-form-item__label">清退人员 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><input class="el-input__inner" placeholder="选择关联违规单号后自动回填人员信息" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">扣分记录</label>
              <div class="el-input"><input class="el-input__inner" value="违规扣分：20分（高风险违规）" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item form-full">
              <label class="el-form-item__label">处置依据 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="请填写处置依据，如：《安全生产管理条例》第XX条、《园区管理规定》第XX条等"></textarea></div>
            </div>
            <div class="el-form-item form-full">
              <label class="el-form-item__label">清退原因说明</label>
              <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="请详细说明清退原因及经过"></textarea></div>
            </div>
          </div>

          <!-- 清退后自动执行操作 -->
          <div style="margin-top:16px;padding:12px 16px;background:#fff1f0;border-radius:6px;border:1px solid #ffa39e;">
            <div style="font-size:13px;font-weight:600;color:#f5222d;margin-bottom:8px;">⛔ 审批通过后自动执行</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:#555;">
              <div>① 加入黑名单（sys_blacklist）</div>
              <div>② 注销所有证件/通行证</div>
              <div>③ 回收全部门禁/现场权限</div>
              <div>④ 禁用系统账号</div>
              <div>⑤ 更新人员状态为「已清退」</div>
              <div>⑥ 单据永久归档标记</div>
            </div>
          </div>

          <!-- 附件上传 -->
          <div class="workflow-form__section" style="margin-top:16px;">
            <div class="workflow-form__section-title">📎 处置证据附件</div>
            <div style="border:2px dashed var(--pwd-border-light);border-radius:8px;padding:30px;text-align:center;cursor:pointer;color:var(--pwd-text-secondary);" onclick="app.simulateFileUpload()">
              <div style="font-size:36px;margin-bottom:8px;">📎</div>
              <div>点击上传违规证据、处置决定书等附件</div>
            </div>
          </div>
        </div>
        </div>
      `;
    }
    // D模块：安全考评服务（周期考评 / 人工调分 / 积分申诉）
    else if (module === 'd') {
      const dTypes = PWD_CONFIG.flowDSubTypes || {};
      fields += `
        <div class="workflow-form__section">
          <div class="workflow-form__section-title">安全考评流程类型选择</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">流程类型 <span style="color:#f5222d;">*</span></label>
              <div class="el-select">
                <select class="el-input__inner" id="flowDType" onchange="app.onDSubTypeChange()">
                  <option value="assessment" data-node-key="d_assessment">周期安全考评单</option>
                  <option value="adjustment" data-node-key="d_adjustment">人工积分调分单</option>
                  <option value="appeal" data-node-key="d_appeal">积分申诉流程</option>
                </select>
              </div>
              <div style="font-size:12px;color:#909399;margin-top:4px;" id="flowDTypeDesc">${dTypes.assessment?.desc || ''}</div>
            </div>
          </div>
        </div>
        <div id="flowDTypeForms">
        <!-- ====== 周期安全考评单 ====== -->
        <div class="workflow-form__section" id="dFormAssessment">
          <div class="workflow-form__section-title">📊 周期安全考评单</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-ASMT-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">考评周期 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner"><option>2026年Q1</option><option selected>2026年Q2</option><option>2026年Q3</option><option>2026年Q4</option><option>2026年上半年</option><option>2026年年度</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">触发方式</label>
              <div class="el-input"><input class="el-input__inner" value="系统定时触发" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">考评类型</label>
              <div class="el-select"><select class="el-input__inner"><option>月度考评</option><option selected>季度考评</option><option>年度考评</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">考评部门</label>
              <div class="el-select"><select class="el-input__inner"><option>生产部</option><option>安全部</option><option>技术部</option><option>行政部</option><option>全部门</option></select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">参评人数</label>
              <div class="el-input"><input class="el-input__inner" value="286 人" readonly style="background:#f5f5f5;" /></div>
            </div>
          </div>

          <!-- 系统自动汇总数据 -->
          <div style="margin-top:16px;padding:12px 16px;background:#e6f7ff;border-radius:6px;border:1px solid #91d5ff;">
            <div style="font-size:13px;font-weight:600;color:#1890ff;margin-bottom:8px;">🔄 系统自动汇总周期内数据</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px;color:#555;">
              <div><span style="color:#999;">安全培训：</span>完成 186 人次 · 通过率 92%</div>
              <div><span style="color:#999;">违规事件：</span>发生 24 起 · 总扣分 280 分</div>
              <div><span style="color:#999;">安全工单：</span>闭环 156 项 · 逾期 8 项</div>
            </div>
          </div>

          <!-- 预设积分计算规则 -->
          <div style="margin-top:16px;padding:12px 16px;background:#f6ffed;border-radius:6px;border:1px solid #b7eb8f;">
            <div style="font-size:13px;font-weight:600;color:#52c41a;margin-bottom:8px;">📐 预设积分计算规则</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:#555;">
              <div>基础分：80 分（每人）</div>
              <div>培训完成 ≥90%：+10 分</div>
              <div>无违规事件：+15 分</div>
              <div>每次违规扣分：-5~20 分（按风险等级）</div>
              <div>工单按时闭环率 ≥95%：+10 分</div>
              <div>逾期工单：-5 分/项</div>
            </div>
          </div>

          <!-- 部门安全员复核微调区 -->
          <div style="margin-top:16px;" class="workflow-form__section">
            <div class="workflow-form__section-title">✏️ 人工复核微调（部门安全员操作）</div>
            <div class="form-grid">
              <div class="el-form-item">
                <label class="el-form-item__label">系统计算基础积分</label>
                <div class="el-input"><input class="el-input__inner" value="85.5" readonly style="background:#f5f5f5;" /></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">安全员微调分值</label>
                <div class="el-input"><input class="el-input__inner" type="number" value="0" step="0.5" placeholder="可微调 ±10 分" /></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">微调后最终积分</label>
                <div class="el-input"><input class="el-input__inner" value="85.5" readonly style="background:#f5f5f5;color:#1890ff;font-weight:600;" /></div>
              </div>
              <div class="el-form-item form-full">
                <label class="el-form-item__label">安全员评语</label>
                <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="请填写考评评语，如：该周期内该部门整体安全表现良好，培训参与率高，但存在2起轻微违规..."></textarea></div>
              </div>
            </div>
          </div>

          <!-- 批量人员积分预览 -->
          <div class="workflow-form__section">
            <div class="workflow-form__section-title">👥 批量人员考评积分预览（前5名）</div>
            <div style="border:1px solid #e8e8e8;border-radius:4px;overflow:hidden;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead><tr style="background:#fafafa;">
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">姓名</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">部门</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">基础分</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">培训加分</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">违规扣分</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">工单加分</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">最终积分</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">评级</th>
                </tr></thead>
                <tbody>
                ${MOCK.persons.slice(0, 5).map(p => {
                  const base = 80;
                  const trainAdd = Math.floor(Math.random() * 15) + 5;
                  const vioDeduct = -(Math.floor(Math.random() * 20));
                  const woAdd = Math.floor(Math.random() * 10);
                  const total = Math.max(0, Math.min(100, base + trainAdd + vioDeduct + woAdd));
                  const rating = total >= 90 ? '优秀' : (total >= 70 ? '良好' : (total >= 50 ? '合格' : '不合格'));
                  return `<tr>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">${p.name}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:#909399;">${p.dept}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">${base}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:#52c41a;">+${trainAdd}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:#f5222d;">${vioDeduct}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:#52c41a;">+${woAdd}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;font-weight:600;color:${total >= 70 ? '#52c41a' : (total >= 50 ? '#faad14' : '#f5222d')};">${total}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;"><span class="status-tag ${rating === '优秀' ? 'status-tag--done' : (rating === '不合格' ? 'status-tag--rejected' : 'status-tag--pending')}" style="font-size:11px;">${rating}</span></td>
                  </tr>`;
                }).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:8px;font-size:12px;color:#909399;text-align:right;">共 286 人 · 预览仅显示前 5 名</div>
          </div>

          <!-- 阈值联动提醒 -->
          <div style="margin-top:16px;padding:12px 16px;background:#fff7e6;border-radius:6px;border:1px solid #ffd591;">
            <div style="font-size:13px;font-weight:600;color:#fa8c16;margin-bottom:8px;">⚡ 积分阈值联动提醒</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:#555;">
              <div>⚠ 积分 &lt; 60 分预警：<strong>3</strong> 人</div>
              <div>⛔ 积分 &lt; 50 分冻结证件：<strong>1</strong> 人</div>
              <div>🚫 积分 &lt; 30 分回收权限/黑名单：<strong>0</strong> 人</div>
              <div>✅ 自动联动将在审批通过后执行</div>
            </div>
          </div>
        </div>

        <!-- ====== 人工积分调分单 ====== -->
        <div class="workflow-form__section" id="dFormAdjustment" style="display:none;">
          <div class="workflow-form__section-title">✏️ 人工积分调分单</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">单据编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-ADJ-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">调分发起人</label>
              <div class="el-input"><input class="el-input__inner" value="王安全员（安全部）" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">调分人员 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner">
                <option value="">请选择调分对象</option>
                ${MOCK.persons.map(p => `<option value="${p.id}">${p.name}（${p.dept} - ${p.position} · 当前积分: ${p.score}分）</option>`).join('')}
              </select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">调分类型 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner">
                <option value="">请选择</option>
                <option value="add">加分</option>
                <option value="deduct">扣分</option>
              </select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">调分分值 <span style="color:#f5222d;">*</span></label>
              <div class="el-input" style="display:flex;gap:8px;align-items:center;">
                <input class="el-input__inner" type="number" placeholder="请输入分值" style="flex:1;" />
                <span style="color:#909399;font-size:12px;">分</span>
              </div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">调整后预计积分</label>
              <div class="el-input"><input class="el-input__inner" value="（选择人员和分值后自动计算）" readonly style="background:#f5f5f5;color:#909399;" /></div>
            </div>
            <div class="el-form-item form-full">
              <label class="el-form-item__label">调分原因 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="请详细说明调分原因，如：发现历史违规记录误判、安全表现突出需奖励加分等"></textarea></div>
            </div>
          </div>

          <!-- 佐证材料上传 -->
          <div class="workflow-form__section">
            <div class="workflow-form__section-title">📎 佐证材料</div>
            <div style="border:2px dashed var(--pwd-border-light);border-radius:8px;padding:30px;text-align:center;cursor:pointer;color:var(--pwd-text-secondary);" onclick="app.simulateFileUpload()">
              <div style="font-size:36px;margin-bottom:8px;">📎</div>
              <div>点击上传佐证材料（支持 .pdf .jpg .png .docx）</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
              <div class="file-card" style="width:180px;">
                <div class="file-card__icon">📄</div>
                <div class="file-card__name">违规复核记录.pdf</div>
                <div class="file-card__size">1.2 MB</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 积分申诉流程 ====== -->
        <div class="workflow-form__section" id="dFormAppeal" style="display:none;">
          <div class="workflow-form__section-title">📝 积分申诉单</div>
          <div class="form-grid">
            <div class="el-form-item">
              <label class="el-form-item__label">申诉编号</label>
              <div class="el-input"><input class="el-input__inner" value="WF-APPEAL-${Date.now().toString(36).toUpperCase()}" readonly style="background:#f5f5f5;" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">申诉人 <span style="color:#f5222d;">*</span></label>
              <div class="el-select"><select class="el-input__inner">
                ${MOCK.persons.map(p => `<option value="${p.id}">${p.name}（${p.dept} - ${p.position} · 当前积分: ${p.score}分）</option>`).join('')}
              </select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">异议积分流水</label>
              <div class="el-select"><select class="el-input__inner">
                <option value="">请选择有异议的积分流水</option>
                <option value="SF-001">违规扣分 -20分（违规操作设备 · 2026-05-20）</option>
                <option value="SF-002">事故扣分 -50分（轻微擦伤 · 2026-05-10）</option>
                <option value="SF-003">未参会扣分 -5分（安全会议缺席 · 2026-04-15）</option>
              </select></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label">异议扣分</label>
              <div class="el-input"><input class="el-input__inner" value="-20 分" readonly style="background:#f5f5f5;color:#f5222d;" /></div>
            </div>
            <div class="el-form-item form-full">
              <label class="el-form-item__label">申诉理由 <span style="color:#f5222d;">*</span></label>
              <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="请详细说明申诉理由，如：当时已按规定操作，建议重新核查现场监控记录..."></textarea></div>
            </div>
            <div class="el-form-item form-full">
              <label class="el-form-item__label">申诉诉求</label>
              <div class="el-input"><textarea class="el-input__inner" rows="2" placeholder="请说明您的诉求，如：请求撤销该笔扣分，恢复积分至原分值"></textarea></div>
            </div>
          </div>

          <!-- 复核参考信息 -->
          <div style="margin-top:16px;padding:12px 16px;background:#fafafa;border-radius:6px;border:1px solid #e8e8e8;">
            <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">🔍 复核参考信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:#555;">
              <div><span style="color:#999;">原扣分规则：</span>违规操作设备 · 高风险 · 扣20分</div>
              <div><span style="color:#999;">扣分依据：</span>《安全操作考核细则》第12条第3款</div>
              <div><span style="color:#999;">关联安全记录：</span>SAFE-012（违规记录-未按规定操作冲压设备）</div>
              <div><span style="color:#999;">扣分执行时间：</span>2026-05-20 14:30</div>
            </div>
          </div>

          <!-- 处理意见区 -->
          <div style="margin-top:16px;padding:12px 16px;background:#fffbe6;border-radius:6px;border:1px solid #ffe58f;">
            <div style="font-size:13px;font-weight:600;color:#ad8b00;margin-bottom:8px;">📋 处理意见（审批人填写）</div>
            <div class="form-grid">
              <div class="el-form-item form-full">
                <label class="el-form-item__label">复核意见</label>
                <div class="el-input"><textarea class="el-input__inner" rows="3" placeholder="经复核，原扣分记录准确/有误..."></textarea></div>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">判定结果</label>
                <div class="el-select"><select class="el-input__inner"><option value="">请选择</option><option value="established">申诉成立</option><option value="not_established">申诉不成立</option></select></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      `;
    }

    return fields;
  },

  /* ========== 组织权限服务 ========== */
  renderOrgPage: function(menuKey) {
    switch(menuKey) {
      case 'org-dept': return this.renderOrgDept();
      case 'org-role': return this.renderOrgRole();
      case 'org-user': return this.renderOrgUser();
      case 'org-menu': return this.renderOrgMenu();
      default: return '';
    }
  },

  renderOrgDept: function() {
    return `
      <div class="page-container" style="display:flex;gap:16px;height:calc(100vh - 180px);">
        <div class="org-tree" style="width:280px;flex-shrink:0;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <strong>组织架构</strong>
            <button class="el-button el-button--primary el-button--small" onclick="app.addDept()">+ 新增</button>
          </div>
          <div class="el-tree" style="font-size:14px;">
            <div style="padding:4px 0;cursor:pointer;"><span>📁 华远集团总公司</span>
              <div style="padding-left:20px;">
                <div style="padding:4px 0;cursor:pointer;color:var(--pwd-primary);">📂 生产部</div>
                <div style="padding-left:20px;">
                  <div style="padding:4px 0;cursor:pointer;">📄 A车间</div>
                  <div style="padding:4px 0;cursor:pointer;">📄 B车间</div>
                </div>
                <div style="padding:4px 0;cursor:pointer;">📂 安全部</div>
                <div style="padding-left:20px;">
                  <div style="padding:4px 0;cursor:pointer;">📄 安全监察科</div>
                  <div style="padding:4px 0;cursor:pointer;">📄 消防管理科</div>
                </div>
                <div style="padding:4px 0;cursor:pointer;">📂 技术部</div>
                <div style="padding:4px 0;cursor:pointer;">📂 行政部</div>
              </div>
            </div>
          </div>
        </div>
        <div class="pwd-card" style="flex:1;overflow-y:auto;">
          <div class="pwd-card__header">部门信息 <button class="el-button el-button--primary el-button--small" onclick="ElMessage.info('模拟编辑部门信息')">编辑</button></div>
          <div class="pwd-card__body">
            <div class="form-grid">
              <div class="el-form-item"><label class="el-form-item__label">部门名称</label><div class="el-input"><input class="el-input__inner" value="生产部" /></div></div>
              <div class="el-form-item"><label class="el-form-item__label">部门编码</label><div class="el-input"><input class="el-input__inner" value="DEPT-001" /></div></div>
              <div class="el-form-item"><label class="el-form-item__label">上级部门</label><div class="el-input"><input class="el-input__inner" value="华远集团总公司" /></div></div>
              <div class="el-form-item"><label class="el-form-item__label">负责人</label><div class="el-input"><input class="el-input__inner" value="张经理" /></div></div>
              <div class="el-form-item"><label class="el-form-item__label">排序</label><div class="el-input"><input class="el-input__inner" value="1" type="number" /></div></div>
              <div class="el-form-item"><label class="el-form-item__label">状态</label><div class="el-select"><select class="el-input__inner"><option>启用</option><option>禁用</option></select></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderOrgRole: function() {
    const roles = [
      { id: 'R001', name: '系统管理员', code: 'admin', dept: '信息技术部', users: 2, status: '启用' },
      { id: 'R002', name: '安全主管', code: 'safety_mgr', dept: '安全部', users: 5, status: '启用' },
      { id: 'R003', name: '部门经理', code: 'dept_mgr', dept: '各部门', users: 12, status: '启用' },
      { id: 'R004', name: '普通操作员', code: 'operator', dept: '生产部', users: 35, status: '启用' },
      { id: 'R005', name: '访客管理员', code: 'visitor_admin', dept: '行政部', users: 3, status: '启用' },
      { id: 'R006', name: 'HR专员', code: 'hr_staff', dept: '人力资源部', users: 4, status: '禁用' }
    ];
    return `
      <div class="page-container">
        <div class="filter-bar">
          <button class="el-button el-button--primary" onclick="app.addRole()">新增角色</button>
          <div class="el-input" style="width:200px;"><input class="el-input__inner" placeholder="角色名称" /></div>
          <button class="el-button el-button--primary" style="margin-left:auto;" onclick="app.genericSearch()">查询</button>
        </div>
        <div class="table-container">
          <table class="el-table" style="width:100%">
            <thead><tr><th>角色ID</th><th>角色名称</th><th>角色编码</th><th>所属部门</th><th>用户数</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
            ${roles.map(r => `
              <tr>
                <td>${r.id}</td><td>${r.name}</td><td>${r.code}</td><td>${r.dept}</td><td>${r.users}</td>
                <td><span class="status-tag ${r.status === '启用' ? 'status-tag--done' : 'status-tag--draft'}">${r.status}</span></td>
                <td>
                  <button class="el-button el-button--primary el-button--small" onclick="app.configPermission('R001')">权限配置</button>
                  <button class="el-button el-button--default el-button--small" onclick="ElMessage.info('模拟编辑')">编辑</button>
                  <button class="el-button el-button--danger el-button--small" onclick="ElMessage.success('已删除')">删除</button>
                </td>
              </tr>
            `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderOrgUser: function() {
    const users = MOCK.persons.slice(0, 8);
    return `
      <div class="page-container">
        <div class="filter-bar">
          <button class="el-button el-button--primary" onclick="app.addUser()">新增用户</button>
          <div class="el-input" style="width:200px;"><input class="el-input__inner" placeholder="用户姓名" /></div>
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部部门</option><option>生产部</option><option>安全部</option><option>技术部</option></select></div>
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部状态</option><option>在职</option><option>离职</option></select></div>
          <button class="el-button el-button--primary" style="margin-left:auto;" onclick="app.genericSearch()">查询</button>
        </div>
        <div class="table-container">
          <table class="el-table" style="width:100%">
            <thead><tr><th>用户ID</th><th>姓名</th><th>手机号</th><th>部门</th><th>岗位</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
            ${users.map(u => `
              <tr>
                <td>${u.id}</td><td>${u.name}</td>
                <td><span class="masked-field" onclick="app.viewSensitive('phone','${u.phone}','${u.id}')">${PWD_CONFIG.maskRules.phone(u.phone)}</span></td>
                <td>${u.dept}</td><td>${u.position}</td>
                <td><span class="status-tag ${u.status === '在职' ? 'status-tag--done' : 'status-tag--rejected'}">${u.status}</span></td>
                <td>
                  <button class="el-button el-button--primary el-button--small" onclick="app.editPersonnel('${u.id}')">编辑</button>
                  <button class="el-button el-button--warning el-button--small" onclick="ElMessage.success('密码已重置')">重置密码</button>
                  <button class="el-button el-button--danger el-button--small" onclick="ElMessage.success('用户已禁用')">禁用</button>
                </td>
              </tr>
            `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderOrgMenu: function() {
    return `
      <div class="page-container">
        <div class="pwd-card">
          <div class="pwd-card__header">菜单权限配置 <button class="el-button el-button--primary el-button--small" onclick="ElMessage.success('权限配置已保存')">保存</button></div>
          <div class="pwd-card__body">
            <table class="el-table" style="width:100%">
              <thead><tr><th style="width:50px;"></th><th>菜单名称</th><th>类型</th><th>权限标识</th><th>查看</th><th>新增</th><th>修改</th><th>删除</th><th>导出</th></tr></thead>
              <tbody>
                <tr><td><input type="checkbox" checked /></td><td><strong>工作流模块</strong></td><td>目录</td><td>workflow</td><td colspan="5"></td></tr>
                <tr><td></td><td style="padding-left:30px;">准入办证服务</td><td>菜单</td><td>workflow:a</td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" /></td><td><input type="checkbox" checked /></td></tr>
                <tr><td></td><td style="padding-left:60px;">已发任务</td><td>按钮</td><td>workflow:a:issued</td><td colspan="5"></td></tr>
                <tr><td></td><td style="padding-left:30px;">访客管理服务</td><td>菜单</td><td>workflow:b</td><td><input type="checkbox" checked /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" /></td><td><input type="checkbox" /></td><td><input type="checkbox" /></td></tr>
                <tr><td><input type="checkbox" checked /></td><td><strong>组织权限服务</strong></td><td>目录</td><td>org</td><td colspan="5"></td></tr>
                <tr><td></td><td style="padding-left:30px;">组织管理</td><td>菜单</td><td>org:dept</td><td><input type="checkbox" checked /></td><td><input type="checkbox" /></td><td><input type="checkbox" checked /></td><td><input type="checkbox" /></td><td><input type="checkbox" /></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ========== 人员主数据服务 ========== */
  renderPersonnelPage: function(menuKey) {
    // 检查是否在详情视图状态
    const detailState = window._personnelDetailState;
    if (detailState && detailState.menuKey === menuKey) {
      switch(menuKey) {
        case 'personnel-archive': return this.renderPersonnelArchiveDetail(detailState.personId);
        case 'personnel-qualification': return this.renderPersonnelQualificationDetail(detailState.itemId);
        case 'personnel-training': return this.renderPersonnelTrainingDetail(detailState.itemId);
        case 'personnel-safety': return this.renderPersonnelSafetyDetail(detailState.itemId);
        default: return '';
      }
    }
    switch(menuKey) {
      case 'personnel-archive': return this.renderPersonnelArchive();
      case 'personnel-qualification': return this.renderPersonnelQualification();
      case 'personnel-qual-template': return this.renderPersonnelQualTemplate();
      case 'personnel-training': return this.renderPersonnelTraining();
      case 'personnel-safety': return this.renderPersonnelSafety();
      default: return '';
    }
  },

  /* ---------- 一人一档：列表页 ---------- */
  renderPersonnelArchive: function() {
    const persons = MOCK.persons;
    const statusColor = { '在职': 'status-tag--done', '离职': 'status-tag--rejected', '已清退': 'status-tag--rejected', '试用期': 'status-tag--pending', '待入职': 'status-tag--draft' };
    return `
      <div class="page-container">
        <!-- 快捷操作区 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.addPersonnel()">
            <span style="font-size:16px;margin-right:4px;">➕</span>新增人员档案
          </button>
          <button class="el-button el-button--default" onclick="app.batchImport()">
            <span style="font-size:16px;margin-right:4px;">📥</span>批量导入
          </button>
          <button class="el-button el-button--default" onclick="app.genericExport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>批量导出
          </button>
          <button class="el-button el-button--warning" onclick="app.batchModifyPersonnel()">
            <span style="font-size:16px;margin-right:4px;">✏️</span>批量修改
          </button>
          <button class="el-button el-button--default" onclick="app.remindExpiring()">
            <span style="font-size:16px;margin-right:4px;">🔔</span>到期提醒设置
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 筛选区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:180px;">
            <input class="el-input__inner" placeholder="姓名/工号" id="archiveSearchName" />
          </div>
          <div class="el-select" style="width:160px;">
            <select class="el-input__inner" id="archiveSearchDept">
              <option value="">全部部门</option>
              <option value="生产部">生产部</option>
              <option value="安全部">安全部</option>
              <option value="技术部">技术部</option>
              <option value="行政部">行政部</option>
            </select>
          </div>
          <div class="el-select" style="width:140px;">
            <select class="el-input__inner" id="archiveSearchStatus">
              <option value="">人员状态</option>
              <option value="在职">在职</option>
              <option value="离职">离职</option>
              <option value="试用期">试用期</option>
              <option value="待入职">待入职</option>
            </select>
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="入职起" id="archiveDateStart" />
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="入职止" id="archiveDateEnd" />
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetPersonnelFilter('archive')">重置</button>
          <button class="el-button el-button--text" onclick="app.toggleAdvancedFilter('archive')" style="font-size:12px;">
            ▼ 高级筛选
          </button>
        </div>

        <!-- 高级筛选面板 -->
        <div class="advanced-filter" id="advancedFilterArchive">
          <div class="advanced-filter__grid">
            <div class="el-form-item">
              <label class="el-form-item__label" style="width:60px;">性别</label>
              <div class="el-select" style="flex:1;">
                <select class="el-input__inner"><option value="">全部</option><option>男</option><option>女</option></select>
              </div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label" style="width:60px;">岗位</label>
              <div class="el-input" style="flex:1;"><input class="el-input__inner" placeholder="岗位名称" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label" style="width:60px;">职级</label>
              <div class="el-select" style="flex:1;">
                <select class="el-input__inner"><option value="">全部</option><option>初级</option><option>中级</option><option>高级</option></select>
              </div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label" style="width:60px;">学历</label>
              <div class="el-select" style="flex:1;">
                <select class="el-input__inner"><option value="">全部</option><option>高中</option><option>中专</option><option>大专</option><option>本科</option><option>硕士</option></select>
              </div>
            </div>
          </div>
          <div class="advanced-filter__actions">
            <button class="el-button el-button--primary el-button--small" onclick="app.genericSearch()">查询</button>
            <button class="el-button el-button--default el-button--small" onclick="app.toggleAdvancedFilter('archive')">收起</button>
            <button class="el-button el-button--text el-button--small" onclick="app.saveFilterCondition('archive')">保存为常用筛选</button>
          </div>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">人员档案列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${persons.length} 条记录</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox" onchange="app.toggleAllCheckbox(this, 'archive')" /></th>
                <th>工号</th>
                <th>姓名</th>
                <th>所属部门</th>
                <th>岗位</th>
                <th>入职日期</th>
                <th>人员状态</th>
                <th style="width:200px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${persons.map(p => `
              <tr>
                <td><input type="checkbox" class="archive-checkbox" value="${p.id}" /></td>
                <td style="color:var(--pwd-text-secondary);">${p.id}</td>
                <td>
                  <a style="color:var(--pwd-primary);cursor:pointer;font-weight:500;" onclick="app.viewPersonnelDetail('archive','${p.id}')">
                    ${p.name}
                  </a>
                </td>
                <td>${p.dept}</td>
                <td>${p.position}</td>
                <td>${p.entryDate || '-'}</td>
                <td>
                  <span class="status-tag ${statusColor[p.status] || 'status-tag--draft'}">${p.status}</span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="el-button el-button--primary el-button--small" onclick="app.viewPersonnelDetail('archive','${p.id}')">查看</button>
                    <button class="el-button el-button--default el-button--small" onclick="app.editPersonnel('${p.id}')">编辑</button>
                    <button class="el-button el-button--warning el-button--small" onclick="app.archivePerson('${p.id}')">归档</button>
                  </div>
                </td>
              </tr>
            `).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${persons.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 一人一档：详情页（标签页+卡片布局） ---------- */
  renderPersonnelArchiveDetail: function(personId) {
    const p = MOCK.persons.find(x => x.id === personId) || MOCK.persons[0];
    const quals = MOCK.generatePersonnelQualList().filter(q => q.personId === p.id).slice(0, 3);
    const trainings = MOCK.generatePersonTrainingRecords(p.id);
    const safeties = MOCK.generatePersonnelSafetyList().filter(s => s.personId === p.id).slice(0, 3);
    const basicAttachments = MOCK.generateAttachments('basic');
    const contractAttachments = MOCK.generateAttachments('contract');
    const statusColor = { '在职': 'status-tag--done', '离职': 'status-tag--rejected', '试用期': 'status-tag--pending', '待入职': 'status-tag--draft' };
    const isContractExpiring = p.contractEnd && p.contractEnd !== '长期' && (new Date(p.contractEnd) - new Date()) < 30 * 24 * 60 * 60 * 1000;

    return `
      <div class="page-container personnel-detail">
        <!-- 详情头 -->
        <div class="personnel-detail__header">
          <div class="personnel-detail__title">
            <span>👤 人员档案详情</span>
            <span style="font-size:12px;font-weight:400;color:var(--pwd-text-secondary);">${p.id}</span>
          </div>
          <div class="personnel-detail__actions">
            <button class="el-button el-button--default" onclick="app.closePersonnelDetail('personnel-archive')">
              <span style="font-size:14px;margin-right:4px;">⬅</span>返回列表
            </button>
            <button class="el-button el-button--primary" onclick="app.editPersonnel('${p.id}')">✏️ 编辑</button>
            <button class="el-button el-button--default" onclick="app.printPersonnel('${p.id}')">🖨️ 打印</button>
            <button class="el-button el-button--warning" onclick="app.archivePerson('${p.id}')">📁 归档</button>
          </div>
        </div>

        <!-- 人员头部大卡片 -->
        <div class="person-header-card">
          <div class="person-header-card__avatar">${p.name[0]}</div>
          <div class="person-header-card__info">
            <div class="person-header-card__name">
              ${p.name}
              <span class="status-tag ${statusColor[p.status] || 'status-tag--draft'}">${p.status}</span>
              ${p.score < 60 ? '<span class="status-tag status-tag--rejected">⛔ 积分预警</span>' : ''}
            </div>
            <div class="person-header-card__meta">
              <span><span class="meta-label">工号：</span>${p.id}</span>
              <span><span class="meta-label">部门：</span>${p.dept}</span>
              <span><span class="meta-label">岗位：</span>${p.position}</span>
              <span><span class="meta-label">职级：</span>${p.rank || '-'}</span>
              <span><span class="meta-label">入职日期：</span>${p.entryDate || '-'}</span>
              <span><span class="meta-label">安全积分：</span>
                <span style="color:${p.score >= 80 ? '#52c41a' : (p.score >= 60 ? '#faad14' : '#f5222d')};font-weight:600;">${p.score}分</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 标签页导航 -->
        <div class="detail-tabs">
          <div class="detail-tab-item is-active" data-tab="tabBasic" onclick="app.switchDetailTab(event, 'archive', 'tabBasic')">基础信息</div>
          <div class="detail-tab-item" data-tab="tabOrg" onclick="app.switchDetailTab(event, 'archive', 'tabOrg')">组织信息</div>

           <!-- 标签页导航 
          <div class="detail-tab-item" data-tab="tabContract" onclick="app.switchDetailTab(event, 'archive', 'tabContract')">
            合同信息 ${isContractExpiring ? '<span style="color:#f5222d;margin-left:4px;">●</span>' : ''}
          </div>
          -->
          <div class="detail-tab-item" data-tab="tabRelated" onclick="app.switchDetailTab(event, 'archive', 'tabRelated')">关联数据</div>
          <div class="detail-tab-item" data-tab="tabAttachment" onclick="app.switchDetailTab(event, 'archive', 'tabAttachment')">附件</div>
        </div>

        <!-- ====== 基础信息Tab ====== -->
        <div id="archiveTabBasic" class="detail-tab-content">
          <div class="info-card">
            <div class="info-card__header">
              <span>📋 基础信息</span>
              <button class="el-button el-button--text el-button--small" onclick="app.editPersonnel('${p.id}')">编辑</button>
            </div>
            <div class="info-card__body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">姓名</span>
                  <span class="info-item__value">${p.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">工号</span>
                  <span class="info-item__value">${p.id}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">性别</span>
                  <span class="info-item__value">${p.gender || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">身份证号</span>
                  <span class="info-item__value">
                    <span class="masked-field" onclick="app.viewSensitive('idCard','${p.idCard}','${p.id}')">
                      ${PWD_CONFIG.maskRules.idCard(p.idCard)}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">手机号</span>
                  <span class="info-item__value">
                    <span class="masked-field" onclick="app.viewSensitive('phone','${p.phone}','${p.id}')">
                      ${PWD_CONFIG.maskRules.phone(p.phone)}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">邮箱</span>
                  <span class="info-item__value">${p.email || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">出生地</span>
                  <span class="info-item__value">${p.birthplace || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">民族</span>
                  <span class="info-item__value">${p.nationality || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">婚姻状况</span>
                  <span class="info-item__value">${p.maritalStatus || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">学历</span>
                  <span class="info-item__value">${p.education || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">紧急联系人</span>
                  <span class="info-item__value">${p.emergencyContact || '-'}（${p.emergencyPhone ? PWD_CONFIG.maskRules.phone(p.emergencyPhone) : '-'}）</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 组织信息Tab ====== -->
        <div id="archiveTabOrg" class="detail-tab-content" style="display:none;">
          <div class="info-card">
            <div class="info-card__header">
              <span>🏢 组织信息</span>
              <button class="el-button el-button--text el-button--small" onclick="app.editPersonnel('${p.id}')">编辑</button>
            </div>
            <div class="info-card__body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">所属部门</span>
                  <span class="info-item__value">${p.dept}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">岗位</span>
                  <span class="info-item__value">${p.position}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">职级</span>
                  <span class="info-item__value">${p.rank || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">职务</span>
                  <span class="info-item__value">${p.headship || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">岗位类别</span>
                  <span class="info-item__value">${p.jobCategory || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">汇报关系</span>
                  <span class="info-item__value">${p.dept} - ${p.headship && p.headship !== '无' ? p.headship : p.position}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">编制类型</span>
                  <span class="info-item__value">${['正式编制', '劳务派遣', '外包'][Math.floor(Math.random() * 3)]}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">人员状态</span>
                  <span class="info-item__value"><span class="status-tag ${statusColor[p.status] || 'status-tag--draft'}">${p.status}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <!-- ====== 合同信息Tab ====== -->
        <div id="archiveTabContract" class="detail-tab-content" style="display:none;">
          <div class="info-card">
            <div class="info-card__header">
              <span>📄 合同信息</span>
              <button class="el-button el-button--text el-button--small" onclick="app.editPersonnel('${p.id}')">编辑</button>
            </div>
            <div class="info-card__body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">合同类型</span>
                  <span class="info-item__value">${p.contractType || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">合同开始日期</span>
                  <span class="info-item__value">${p.entryDate || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">合同结束日期</span>
                  <span class="info-item__value ${isContractExpiring ? 'info-item__value--warning' : ''}">
                    ${p.contractEnd || '-'}
                    ${isContractExpiring ? '<span style="color:#f5222d;font-size:12px;margin-left:8px;">⚠ 即将到期</span>' : ''}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">续签次数</span>
                  <span class="info-item__value">${Math.floor(Math.random() * 3)} 次</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">试用期</span>
                  <span class="info-item__value">${Math.floor(Math.random() * 3) + 1} 个月</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">合同状态</span>
                  <span class="info-item__value">
                    <span class="status-tag ${isContractExpiring ? 'status-tag--pending' : 'status-tag--done'}">
                      ${isContractExpiring ? '即将到期' : '正常'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 关联数据Tab ====== -->
        <div id="archiveTabRelated" class="detail-tab-content" style="display:none;">
          <div class="info-card">
            <div class="info-card__header">
              <span>🎯 资质管理 <span style="font-weight:400;font-size:12px;color:var(--pwd-text-secondary);">（点击跳转资质详情）</span></span>
              <button class="el-button el-button--text el-button--small" onclick="app.switchToMenu('personnel-qualification')">查看全部</button>
            </div>
            <div class="info-card__body" style="padding:0;">
              ${quals.length > 0 ? quals.map(q => `
                <div class="related-record-item">
                  <div class="related-record-item__info">
                    <span class="related-record-item__title" onclick="app.viewPersonnelDetail('qualification','${q.id}')">${q.qualName}</span>
                    <span class="related-record-item__meta">编号：${q.qualNo} · 到期：${q.expireDate}</span>
                  </div>
                  <span class="related-record-item__status">
                    <span class="status-tag ${q.status === 'valid' ? 'status-tag--done' : (q.status === 'expiring' ? 'status-tag--pending' : 'status-tag--rejected')}">
                      ${MOCK.getQualStatusLabel(q.status)}
                    </span>
                  </span>
                </div>
              `).join('') : '<div style="padding:20px;text-align:center;color:var(--pwd-text-secondary);">暂无资质记录</div>'}
            </div>
          </div>

          <div class="info-card">
            <div class="info-card__header">
              <span>📚 培训记录 <span style="font-weight:400;font-size:12px;color:var(--pwd-text-secondary);">（最近3条）</span></span>
              <button class="el-button el-button--text el-button--small" onclick="app.switchToMenu('personnel-training')">查看全部</button>
            </div>
            <div class="info-card__body" style="padding:0;">
              ${trainings.length > 0 ? trainings.map(t => `
                <div class="related-record-item">
                  <div class="related-record-item__info">
                    <span class="related-record-item__title">${t.name}</span>
                    <span class="related-record-item__meta">${t.startDate} · ${t.duration} · ${t.examResult || '无考核'}</span>
                  </div>
                  <span class="related-record-item__status">
                    <span class="status-tag status-tag--done">${MOCK.getTrainingStatusLabel(t.status)}</span>
                  </span>
                </div>
              `).join('') : '<div style="padding:20px;text-align:center;color:var(--pwd-text-secondary);">暂无培训记录</div>'}
            </div>
          </div>

          <div class="info-card">
            <div class="info-card__header">
              <span>🔒 安全记录 <span style="font-weight:400;font-size:12px;color:var(--pwd-text-secondary);">（最近3条）</span></span>
              <button class="el-button el-button--text el-button--small" onclick="app.switchToMenu('personnel-safety')">查看全部</button>
            </div>
            <div class="info-card__body" style="padding:0;">
              ${safeties.length > 0 ? safeties.map(s => `
                <div class="related-record-item">
                  <div class="related-record-item__info">
                    <span class="related-record-item__title">${s.eventName}</span>
                    <span class="related-record-item__meta">${s.occurDate} · ${s.recordType}</span>
                  </div>
                  <span class="related-record-item__status">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${MOCK.getRiskLevelColor(s.riskLevel)};margin-right:6px;"></span>
                    <span class="status-tag ${s.isClosed ? 'status-tag--done' : 'status-tag--pending'}">${s.isClosed ? '已结案' : '处理中'}</span>
                  </span>
                </div>
              `).join('') : '<div style="padding:20px;text-align:center;color:var(--pwd-text-secondary);">暂无安全记录</div>'}
            </div>
          </div>
        </div>

        <!-- ====== 附件Tab ====== -->
        <div id="archiveTabAttachment" class="detail-tab-content" style="display:none;">
          <div class="info-card">
            <div class="info-card__header">
              <span>📎 身份证件与入职材料</span>
              <button class="el-button el-button--text el-button--small" onclick="app.uploadFile()">上传附件</button>
            </div>
            <div class="info-card__body">
              <div class="attachment-grid">
                ${basicAttachments.map(f => `
                  <div class="attachment-card" onclick="app.downloadFile('${f.name}')">
                    <div class="attachment-card__icon">${f.icon}</div>
                    <div class="attachment-card__name">${f.name}</div>
                    <div class="attachment-card__meta">${f.size}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="info-card">
            <div class="info-card__header">
              <span>📎 劳动合同与协议</span>
              <button class="el-button el-button--text el-button--small" onclick="app.uploadFile()">上传附件</button>
            </div>
            <div class="info-card__body">
              <div class="attachment-grid">
                ${contractAttachments.map(f => `
                  <div class="attachment-card" onclick="app.downloadFile('${f.name}')">
                    <div class="attachment-card__icon">${f.icon}</div>
                    <div class="attachment-card__name">${f.name}</div>
                    <div class="attachment-card__meta">${f.size}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 资质管理：列表页 ---------- */
  renderPersonnelQualification: function() {
    const quals = MOCK.generatePersonnelQualList();
    const expiringCount = quals.filter(q => q.status === 'expiring').length;
    const expiredCount = quals.filter(q => q.status === 'expired').length;

    return `
      <div class="page-container">
        <!-- 预警横幅 -->
        <div class="warning-banner">
          <span class="warning-banner__icon">⚠️</span>
          <span class="warning-banner__text">
            资质即将到期人员：<span class="warning-banner__count">${expiringCount}</span> 人
            | 资质已过期人员：<span class="warning-banner__count">${expiredCount}</span> 人
          </span>
          <button class="el-button el-button--warning el-button--small" onclick="app.filterExpiringQual()">查看即将到期</button>
          <button class="el-button el-button--default el-button--small" onclick="app.remindExpiring()">全部提醒</button>
        </div>

        <!-- 快捷操作区 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.addQualification()">
            <span style="font-size:16px;margin-right:4px;">➕</span>新增资质
          </button>
          <button class="el-button el-button--default" onclick="app.batchImport()">
            <span style="font-size:16px;margin-right:4px;">📥</span>批量导入
          </button>
          <button class="el-button el-button--default" onclick="app.genericExport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>导出
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 筛选区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:180px;">
            <input class="el-input__inner" placeholder="人员姓名/工号" id="qualSearchName" />
          </div>
          <div class="el-select" style="width:180px;">
            <select class="el-input__inner" id="qualSearchType">
              <option value="">全部资质类型</option>
              ${MOCK.qualTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="el-select" style="width:140px;">
            <select class="el-input__inner" id="qualSearchStatus">
              <option value="">全部状态</option>
              <option value="valid">有效</option>
              <option value="expiring">即将过期</option>
              <option value="expired">已过期</option>
              <option value="pending_review">待审核</option>
            </select>
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="有效期起" id="qualDateStart" />
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="有效期止" id="qualDateEnd" />
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetPersonnelFilter('qual')">重置</button>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">资质列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${quals.length} 条记录</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox" onchange="app.toggleAllCheckbox(this, 'qual')" /></th>
                <th>人员信息</th>
                <th>资质类型</th>
                <th>资质名称</th>
                <th>资质编号</th>
                <th>发证机构</th>
                <th>有效期起</th>
                <th>有效期止</th>
                <th>资质状态</th>
                <th style="width:260px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${quals.map(q => {
              const statusClass = q.status === 'valid' ? 'status-tag--done' : (q.status === 'expiring' ? 'status-tag--pending' : (q.status === 'expired' ? 'status-tag--rejected' : 'status-tag--draft'));
              const expireClass = q.status === 'expired' ? 'info-item__value--expired' : (q.status === 'expiring' ? 'info-item__value--expiring' : '');
              return `
                <tr>
                  <td><input type="checkbox" class="qual-checkbox" value="${q.id}" /></td>
                  <td>
                    <a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.viewPersonnelDetail('archive','${q.personId}')">
                      ${q.personName}
                    </a>
                    <span style="font-size:12px;color:var(--pwd-text-secondary);">${q.personId}</span>
                  </td>
                  <td>${q.qualType}</td>
                  <td>
                    <a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.viewPersonnelDetail('qualification','${q.id}')">
                      ${q.qualName}
                    </a>
                  </td>
                  <td style="font-size:12px;">${q.qualNo}</td>
                  <td style="font-size:12px;">${q.issuingOrg}</td>
                  <td>${MOCK.formatDate(q.issueDate)}</td>
                  <td class="${expireClass}">${q.expireDate}</td>
                  <td>
                    <span class="status-tag ${statusClass}">
                      ${MOCK.getQualStatusLabel(q.status)}
                    </span>
                    ${q.diffDays <= 30 && q.diffDays > 0 ? '<div style="font-size:11px;color:#fa8c16;margin-top:2px;">剩余' + q.diffDays + '天</div>' : ''}
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="el-button el-button--primary el-button--small" onclick="app.viewPersonnelDetail('qualification','${q.id}')">查看</button>
                      <button class="el-button el-button--default el-button--small" onclick="app.editQualification('${q.id}')">编辑</button>
                      <button class="el-button el-button--danger el-button--small" onclick="app.revokeQualification('${q.id}')">作废</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${quals.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 资质管理：详情页 ---------- */
  renderPersonnelQualificationDetail: function(itemId) {
    const allQuals = MOCK.generatePersonnelQualList();
    const q = allQuals.find(x => x.id === itemId) || allQuals[0];
    const p = MOCK.persons.find(x => x.id === q.personId) || MOCK.persons[0];
    const attachments = MOCK.generateAttachments('qualification');

    return `
      <div class="page-container personnel-detail">
        <div class="personnel-detail__header">
          <div class="personnel-detail__title">
            <span>🎫 资质详情</span>
            <span style="font-size:12px;font-weight:400;color:var(--pwd-text-secondary);">${q.qualNo}</span>
          </div>
          <div class="personnel-detail__actions">
            <button class="el-button el-button--default" onclick="app.closePersonnelDetail('personnel-qualification')">
              <span style="font-size:14px;margin-right:4px;">⬅</span>返回列表
            </button>
            <button class="el-button el-button--primary" onclick="app.editQualification('${q.id}')">✏️ 编辑</button>
            <button class="el-button el-button--success" onclick="app.verifyQualification('${q.id}')">✅ 核验</button>
            <button class="el-button el-button--warning" onclick="app.renewQualification('${q.qualNo}')">🔄 续期</button>
            <button class="el-button el-button--danger" onclick="app.revokeQualification('${q.id}')">🗑 作废</button>
          </div>
        </div>

        <!-- 资质预警 -->
        ${q.status === 'expired' ? '<div class="alert-info alert-info--error">⛔ 资质已过期，请立即处理续期或复审。</div>' : ''}
        ${q.status === 'expiring' ? '<div class="alert-info alert-info--warning">⚠ 资质即将过期（剩余' + q.diffDays + '天），请及时安排复审。</div>' : ''}

        <!-- 资质基础信息 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>📋 资质基础信息</span>
          </div>
          <div class="info-card__body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">资质名称</span>
                <span class="info-item__value">${q.qualName}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">资质编号</span>
                <span class="info-item__value">${q.qualNo}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">资质类型</span>
                <span class="info-item__value">${q.qualType}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">发证机构</span>
                <span class="info-item__value">${q.issuingOrg}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">发证日期</span>
                <span class="info-item__value">${MOCK.formatDate(q.issueDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">有效期至</span>
                <span class="info-item__value ${q.status === 'expired' ? 'info-item__value--expired' : (q.status === 'expiring' ? 'info-item__value--expiring' : '')}">
                  ${q.expireDate}
                  ${q.status === 'expired' ? '（已过期）' : (q.status === 'expiring' ? '（即将过期）' : '')}
                </span>
              </div>
              <div class="info-item">
                <span class="info-item__label">资质状态</span>
                <span class="info-item__value">
                  <span class="status-tag ${q.status === 'valid' ? 'status-tag--done' : (q.status === 'expiring' ? 'status-tag--pending' : 'status-tag--rejected')}">
                    ${MOCK.getQualStatusLabel(q.status)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 人员关联信息 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>👤 人员关联信息</span>
            <button class="el-button el-button--text el-button--small" onclick="app.bindPersonToQual('${q.id}')">绑定人员</button>
          </div>
          <div class="info-card__body">
            <div class="info-grid info-grid--2">
              <div class="info-item">
                <span class="info-item__label">姓名</span>
                <span class="info-item__value">
                  <a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.viewPersonnelDetail('archive','${p.id}')">${p.name}</a>
                </span>
              </div>
              <div class="info-item">
                <span class="info-item__label">工号</span>
                <span class="info-item__value">${p.id}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">部门</span>
                <span class="info-item__value">${p.dept}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">岗位</span>
                <span class="info-item__value">${p.position}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 附件区 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>📎 资质附件</span>
            <button class="el-button el-button--text el-button--small" onclick="app.uploadFile()">上传附件</button>
          </div>
          <div class="info-card__body">
            <div class="attachment-grid">
              ${attachments.map(f => `
                <div class="attachment-card" onclick="app.downloadFile('${f.name}')">
                  <div class="attachment-card__icon">${f.icon}</div>
                  <div class="attachment-card__name">${f.name}</div>
                  <div class="attachment-card__meta">${f.size}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 提醒设置 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>🔔 提醒设置</span>
          </div>
          <div class="info-card__body">
            <div class="reminder-config">
              <span style="white-space:nowrap;">到期前</span>
              <div class="el-select" style="width:120px;">
                <select class="el-input__inner">
                  <option>15天</option>
                  <option selected>30天</option>
                  <option>45天</option>
                  <option>60天</option>
                </select>
              </div>
              <span style="white-space:nowrap;">提醒以下对象：</span>
              <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" checked /> 本人</label>
              <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" checked /> 直属上级</label>
              <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" checked /> HR管理员</label>
              <button class="el-button el-button--primary el-button--small" onclick="app.saveReminderSetting()">保存设置</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 资质模板：列表页 ---------- */
  renderPersonnelQualTemplate: function() {
    const templates = MOCK.qualTemplates;

    return `
      <div class="page-container">
        <!-- 快捷操作区 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.addQualTemplate()">
            <span style="font-size:16px;margin-right:4px;">➕</span>新增资质模板
          </button>
          <button class="el-button el-button--default" onclick="app.batchImport()">
            <span style="font-size:16px;margin-right:4px;">📥</span>批量导入
          </button>
          <button class="el-button el-button--default" onclick="app.genericExport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>导出
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 筛选区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:200px;">
            <input class="el-input__inner" placeholder="证书名称" id="qtSearchName" />
          </div>
          <div class="el-select" style="width:180px;">
            <select class="el-input__inner" id="qtSearchType">
              <option value="">全部证书类型</option>
              <option value="1">特种作业证</option>
              <option value="2">安全培训证</option>
              <option value="3">技能等级证</option>
              <option value="4">外包准入证</option>
              <option value="5">身份证</option>
              <option value="6">其他证件</option>
            </select>
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetPersonnelFilter('qt')">重置</button>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">资质证书模板列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${templates.length} 条记录</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox" onchange="app.toggleAllCheckbox(this, 'qt')" /></th>
                <th>模板编号</th>
                <th>证书类型</th>
                <th>证书名称</th>
                <th>默认有效期（天）</th>
                <th>提前预警天数</th>
                <th>排序</th>
                <th>状态</th>
                <th style="width:180px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${templates.map(t => `
              <tr>
                <td><input type="checkbox" class="qt-checkbox" value="${t.id}" /></td>
                <td style="color:var(--pwd-text-secondary);font-size:12px;">${t.id}</td>
                <td><span class="tag" style="background:#e6f7ff;color:#1890ff;padding:2px 8px;border-radius:3px;font-size:12px;">${t.qualTypeName}</span></td>
                <td><strong>${t.qualName}</strong></td>
                <td>${t.standardValidDays === 9999 ? '长期' : t.standardValidDays + ' 天'}</td>
                <td>${t.warnDays} 天</td>
                <td><span style="color:var(--pwd-text-secondary);">-</span></td>
                <td><span class="status-tag status-tag--done">启用</span></td>
                <td>
                  <div class="action-btns">
                    <button class="el-button el-button--primary el-button--small" onclick="app.editQualTemplate('${t.id}')">编辑</button>
                    <button class="el-button el-button--default el-button--small" onclick="app.copyQualTemplate('${t.id}')">复制</button>
                    <button class="el-button el-button--danger el-button--small" onclick="app.deleteQualTemplate('${t.id}')">删除</button>
                  </div>
                </td>
              </tr>
            `).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${templates.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 培训记录：列表页 ---------- */
  renderPersonnelTraining: function() {
    const trainings = MOCK.generatePersonnelTrainingList();
    const completedCount = trainings.filter(t => t.status === 'completed').length;
    const plannedCount = trainings.filter(t => t.status === 'planned').length;

    return `
      <div class="page-container">
        <!-- 统计看板 -->
        <div class="dashboard-entry">
          <div class="dashboard-stat">
            <div class="dashboard-stat__value dashboard-stat__value--primary">${trainings.length}</div>
            <div class="dashboard-stat__label">总培训次数</div>
          </div>
          <div class="dashboard-stat">
            <div class="dashboard-stat__value dashboard-stat__value--success">${completedCount}</div>
            <div class="dashboard-stat__label">已完成培训</div>
          </div>
          <div class="dashboard-stat">
            <div class="dashboard-stat__value dashboard-stat__value--warning">${plannedCount}</div>
            <div class="dashboard-stat__label">计划中培训</div>
          </div>
          <div class="dashboard-stat">
            <div class="dashboard-stat__value dashboard-stat__value--primary">${Math.round(trainings.reduce((s,t) => s + (t.passRate ? parseInt(t.passRate) : 0), 0) / trainings.length)}%</div>
            <div class="dashboard-stat__label">平均通过率</div>
          </div>
        </div>

        <!-- 快捷操作区 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.addTraining()">
            <span style="font-size:16px;margin-right:4px;">➕</span>新增培训记录
          </button>
          <button class="el-button el-button--default" onclick="app.batchImport()">
            <span style="font-size:16px;margin-right:4px;">📥</span>按批次导入
          </button>
          <button class="el-button el-button--warning" onclick="app.switchToTrainingAssessment()">
            <span style="font-size:16px;margin-right:4px;">📋</span>培训记录考核
          </button>
          <button class="el-button el-button--success" onclick="app.inputExamResults()">
            <span style="font-size:16px;margin-right:4px;">📝</span>考核结果录入
          </button>
          <button class="el-button el-button--default" onclick="app.genericExport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>培训记录导出
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 筛选区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:180px;">
            <input class="el-input__inner" placeholder="人员姓名/工号" id="trainSearchName" />
          </div>
          <div class="el-select" style="width:180px;">
            <select class="el-input__inner" id="trainSearchType">
              <option value="">全部培训类型</option>
              ${MOCK.trainingTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="el-select" style="width:140px;">
            <select class="el-input__inner" id="trainSearchStatus">
              <option value="">全部状态</option>
              <option value="completed">已完成</option>
              <option value="in_progress">进行中</option>
              <option value="planned">计划中</option>
            </select>
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="培训起" id="trainDateStart" />
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="培训止" id="trainDateEnd" />
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetPersonnelFilter('train')">重置</button>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">培训记录列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${trainings.length} 条记录</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox" onchange="app.toggleAllCheckbox(this, 'train')" /></th>
                <th>培训名称</th>
                <th>培训类型</th>
                <th>培训时间</th>
                <th>时长</th>
                <th>参与人数</th>
                <th>考核通过率</th>
                <th>培训状态</th>
                <th style="width:200px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${trainings.map(t => `
              <tr>
                <td><input type="checkbox" class="train-checkbox" value="${t.id}" /></td>
                <td>
                  <a style="color:var(--pwd-primary);cursor:pointer;font-weight:500;" onclick="app.viewPersonnelDetail('training','${t.id}')">
                    ${t.name}
                  </a>
                </td>
                <td>${t.type}</td>
                <td>${t.startDate} ~ ${t.endDate}</td>
                <td>${t.duration}</td>
                <td>${t.participants} 人</td>
                <td>${t.passRate || '-'}</td>
                <td>
                  <span class="status-tag ${t.status === 'completed' ? 'status-tag--done' : (t.status === 'in_progress' ? 'status-tag--processing' : 'status-tag--pending')}">
                    ${MOCK.getTrainingStatusLabel(t.status)}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="el-button el-button--primary el-button--small" onclick="app.viewPersonnelDetail('training','${t.id}')">详情</button>
                    <button class="el-button el-button--default el-button--small" onclick="app.editTraining('${t.id}')">编辑</button>
                    <button class="el-button el-button--warning el-button--small" onclick="app.viewTrainingAssessmentDetail('${t.id}')">考核</button>
                  </div>
                </td>
              </tr>
            `).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${trainings.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 培训记录考核：列表页 ---------- */
  renderPersonnelTrainingAssessment: function() {
    const trainings = MOCK.generatePendingAssessmentTrainings();
    const pendingCount = trainings.reduce((s, t) => s + t.pendingAssess, 0);
    const totalCount = trainings.reduce((s, t) => s + t.participants, 0);

    return `
      <div class="page-container">
        <!-- 顶部统计 -->
        <div class="assessment-stats">
          <div class="assessment-stat-card">
            <div class="stat-num blue">${trainings.length}</div>
            <div class="stat-label">待考核培训</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num blue">${totalCount}</div>
            <div class="stat-label">总参训人次</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num orange">${pendingCount}</div>
            <div class="stat-label">待考核人次</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num green">${totalCount - pendingCount}</div>
            <div class="stat-label">已考核人次</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num" style="color:var(--pwd-primary);">${Math.round((totalCount - pendingCount) / (totalCount || 1) * 100)}%</div>
            <div class="stat-label">考核完成率</div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.inputExamResults()">
            <span style="font-size:16px;margin-right:4px;">📝</span>考核结果录入
          </button>
          <button class="el-button el-button--default" onclick="app.genericExport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>导出考核结果
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 筛选区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:200px;">
            <input class="el-input__inner" placeholder="培训名称" id="assessSearchName" />
          </div>
          <div class="el-select" style="width:160px;">
            <select class="el-input__inner" id="assessSearchStatus">
              <option value="">全部状态</option>
              <option value="completed">已完成</option>
              <option value="in_progress">进行中</option>
            </select>
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="培训起" id="assessDateStart" />
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="培训止" id="assessDateEnd" />
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetPersonnelFilter('assess')">重置</button>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">培训考核列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${trainings.length} 条记录</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th>培训名称</th>
                <th>培训类型</th>
                <th>培训时间</th>
                <th>参训人数</th>
                <th>已考核</th>
                <th>通过人数</th>
                <th>未通过</th>
                <th>待考核</th>
                <th>考核状态</th>
                <th style="width:200px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${trainings.map(t => {
              const assessed = t.totalAssessed;
              const total = t.participants;
              const rate = total > 0 ? Math.round(assessed / total * 100) : 0;
              const allDone = assessed === total;
              return `
                <tr>
                  <td>
                    <a style="color:var(--pwd-primary);cursor:pointer;font-weight:500;" onclick="app.viewTrainingAssessmentDetail('${t.id}')">
                      ${t.name}
                    </a>
                  </td>
                  <td>${t.type}</td>
                  <td>${t.startDate}</td>
                  <td>${total} 人</td>
                  <td>${assessed} 人</td>
                  <td style="color:var(--pwd-success);font-weight:500;">${t.totalPassed}</td>
                  <td style="color:${t.totalFailed > 0 ? 'var(--pwd-danger)' : 'var(--pwd-text-secondary)'};font-weight:${t.totalFailed > 0 ? '500' : '400'};">${t.totalFailed > 0 ? t.totalFailed : '-'}</td>
                  <td style="color:${t.pendingAssess > 0 ? 'var(--pwd-warning)' : 'var(--pwd-success)'};font-weight:500;">${t.pendingAssess > 0 ? t.pendingAssess + ' 人' : '已完成'}</td>
                  <td>
                    <span class="status-tag ${allDone ? 'status-tag--done' : 'status-tag--pending'}">
                      ${allDone ? '考核完成' : '考核中'}
                    </span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="el-button el-button--primary el-button--small" onclick="app.viewTrainingAssessmentDetail('${t.id}')">考核</button>
                      <button class="el-button el-button--success el-button--small" onclick="app.inputExamResults('${t.id}')">录入</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${trainings.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 培训考核详情：某次培训的参与者考核 ---------- */
  renderTrainingAssessmentDetail: function(trainingId) {
    const allTrainings = MOCK.generatePendingAssessmentTrainings();
    const t = allTrainings.find(x => x.id === trainingId);
    if (!t) return '<div class="page-container"><p style="color:#999;text-align:center;padding:40px;">未找到该培训记录</p></div>';

    const participants = t.participantsList || [];
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

    return `
      <div class="page-container personnel-detail">
        <!-- 头部 -->
        <div class="personnel-detail__header">
          <div class="personnel-detail__title">
            <span>📋 培训考核 - ${t.name}</span>
            <span style="font-size:12px;font-weight:400;color:var(--pwd-text-secondary);">${t.id}</span>
          </div>
          <div class="personnel-detail__actions">
            <button class="el-button el-button--default" onclick="app.closeAssessmentView()">
              <span style="font-size:14px;margin-right:4px;">⬅</span>返回考核列表
            </button>
            <button class="el-button el-button--primary" onclick="app.inputExamResults('${t.id}')">📝 录入考核结果</button>
            <button class="el-button el-button--default" onclick="app.genericExport()">📤 导出</button>
          </div>
        </div>

        <!-- 培训信息卡片 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>📋 培训基础信息</span>
          </div>
          <div class="info-card__body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">培训名称</span>
                <span class="info-item__value">${t.name}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训类型</span>
                <span class="info-item__value">${t.type}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训时间</span>
                <span class="info-item__value">${t.startDate} ~ ${t.endDate}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训方式</span>
                <span class="info-item__value">${t.mode || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">举办方</span>
                <span class="info-item__value">${t.organizer || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">讲师</span>
                <span class="info-item__value">${t.trainer || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 考核统计 -->
        <div class="assessment-stats">
          <div class="assessment-stat-card">
            <div class="stat-num blue">${participants.length}</div>
            <div class="stat-label">参训总人数</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num green">${t.totalPassed}</div>
            <div class="stat-label">已通过</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num red">${t.totalFailed}</div>
            <div class="stat-label">未通过</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num orange">${t.pendingAssess}</div>
            <div class="stat-label">待考核</div>
          </div>
          <div class="assessment-stat-card">
            <div class="stat-num" style="color:var(--pwd-primary);">
              ${participants.length > 0 ? Math.round((t.totalAssessed) / participants.length * 100) : 0}%
            </div>
            <div class="stat-label">考核完成率</div>
          </div>
        </div>

        <!-- 批量操作栏 -->
        <div class="assessment-batch-bar">
          <div class="batch-info">
            已选择 <strong id="selectedCount">0</strong> 人
            <span style="color:var(--pwd-text-secondary);font-size:12px;margin-left:8px;">
              （全选 <input type="checkbox" onchange="app.toggleAllParticipants(this)" style="vertical-align:middle;" />）
            </span>
          </div>
          <div class="batch-actions">
            <button class="el-button el-button--success el-button--small" onclick="app.batchApproveParticipants('${t.id}')">
              ✅ 批量通过
            </button>
            <button class="el-button el-button--danger el-button--small" onclick="app.batchRejectParticipants('${t.id}')">
              ❌ 批量未通过
            </button>
          </div>
        </div>

        <!-- 参训人员列表 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">参训人员考核结果</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${participants.length} 人</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:36px;"><input type="checkbox" class="participant-select-all" onchange="app.toggleAllParticipants(this)" /></th>
                <th>姓名</th>
                <th>部门</th>
                <th>考勤</th>
                <th>考核成绩</th>
                <th>考核结果</th>
                <th>考核人</th>
                <th>考核时间</th>
                <th style="width:150px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${participants.map((p, idx) => {
              const avatarColor = colors[idx % colors.length];
              return `
                <tr class="${p.examStatus === '未通过' ? 'el-table__row--danger' : (p.examStatus === '通过' ? 'el-table__row--success' : '')}">
                  <td><input type="checkbox" class="participant-checkbox" value="${p.id}" data-name="${p.personName}" onchange="app.updateSelectedCount()" /></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div style="width:28px;height:28px;border-radius:50%;background:${avatarColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">
                        ${p.personName[0]}
                      </div>
                      <a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.viewPersonnelDetail('archive','${p.personId}')">${p.personName}</a>
                    </div>
                  </td>
                  <td style="font-size:12px;color:var(--pwd-text-secondary);">${p.personDept}</td>
                  <td>
                    <span class="status-tag ${p.attendance === '已签到' ? 'status-tag--done' : 'status-tag--rejected'}">${p.attendance}</span>
                  </td>
                  <td>
                    ${p.score !== null
                      ? `<span class="score-input score-${p.scorePassed ? 'pass' : 'fail'}" style="display:inline-block;width:60px;text-align:center;">${p.score}</span>`
                      : '<span style="color:var(--pwd-text-placeholder);">未录入</span>'}
                  </td>
                  <td>
                    <span class="assessment-status">
                      <span class="dot ${p.examStatus === '通过' ? 'green' : (p.examStatus === '未通过' ? 'red' : 'gray')}"></span>
                      <span style="color:${p.examStatus === '通过' ? 'var(--pwd-success)' : (p.examStatus === '未通过' ? 'var(--pwd-danger)' : 'var(--pwd-text-placeholder)')};">${p.examStatus}</span>
                    </span>
                  </td>
                  <td style="font-size:12px;">${p.assessor}</td>
                  <td style="font-size:12px;color:var(--pwd-text-secondary);">${p.assessTime}</td>
                  <td>
                    <div class="action-btns">
                      <button class="el-button el-button--success el-button--small" onclick="app.singleApproveParticipant('${t.id}','${p.id}')" ${p.examStatus === '通过' ? 'disabled' : ''}>通过</button>
                      <button class="el-button el-button--danger el-button--small" onclick="app.singleRejectParticipant('${t.id}','${p.id}')" ${p.examStatus === '未通过' ? 'disabled' : ''}>未通过</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ---------- 培训记录：详情页 ---------- */
  renderPersonnelTrainingDetail: function(itemId) {
    const allTrainings = MOCK.generatePersonnelTrainingList();
    const t = allTrainings.find(x => x.id === itemId) || allTrainings[0];
    const attachments = MOCK.generateAttachments('training');

    return `
      <div class="page-container personnel-detail">
        <div class="personnel-detail__header">
          <div class="personnel-detail__title">
            <span>📚 培训详情</span>
            <span style="font-size:12px;font-weight:400;color:var(--pwd-text-secondary);">${t.id}</span>
          </div>
          <div class="personnel-detail__actions">
            <button class="el-button el-button--default" onclick="app.closePersonnelDetail('personnel-training')">
              <span style="font-size:14px;margin-right:4px;">⬅</span>返回列表
            </button>
            <button class="el-button el-button--primary" onclick="app.editTraining('${t.id}')">✏️ 编辑</button>
            <button class="el-button el-button--success" onclick="app.inputExamResults()">📝 录入考核结果</button>
            <button class="el-button el-button--default" onclick="app.genericExport()">📤 导出</button>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-mini-card">
            <div class="stat-mini-card__value">${t.participants}</div>
            <div class="stat-mini-card__label">参与人数</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-card__value" style="color:var(--pwd-success);">${t.passRate || '-'}</div>
            <div class="stat-mini-card__label">通过率</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-card__value" style="color:var(--pwd-primary);">${t.avgScore || '-'}</div>
            <div class="stat-mini-card__label">平均得分</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-card__value" style="color:${t.status === 'completed' ? 'var(--pwd-success)' : 'var(--pwd-warning)'};">${MOCK.getTrainingStatusLabel(t.status)}</div>
            <div class="stat-mini-card__label">培训状态</div>
          </div>
        </div>

        <!-- 培训基础信息 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>📋 培训基础信息</span>
          </div>
          <div class="info-card__body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">培训名称</span>
                <span class="info-item__value">${t.name}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训类型</span>
                <span class="info-item__value">${t.type}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训类别</span>
                <span class="info-item__value">${t.category || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训方式</span>
                <span class="info-item__value">${t.mode || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">举办方</span>
                <span class="info-item__value">${t.organizer || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">讲师</span>
                <span class="info-item__value">${t.trainer || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训时间</span>
                <span class="info-item__value">${t.startDate} ~ ${t.endDate}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训时长</span>
                <span class="info-item__value">${t.duration}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">培训地点</span>
                <span class="info-item__value">${t.location || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">有无考核</span>
                <span class="info-item__value">${t.hasExam ? '有' : '无'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 附件区 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>📎 培训附件</span>
            <button class="el-button el-button--text el-button--small" onclick="app.uploadFile()">上传附件</button>
          </div>
          <div class="info-card__body">
            <div class="attachment-grid">
              ${attachments.map(f => `
                <div class="attachment-card" onclick="app.downloadFile('${f.name}')">
                  <div class="attachment-card__icon">${f.icon}</div>
                  <div class="attachment-card__name">${f.name}</div>
                  <div class="attachment-card__meta">${f.size}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 安全记录：列表页 ---------- */
  renderPersonnelSafety: function() {
    const records = MOCK.generatePersonnelSafetyList();
    const highRisk = records.filter(r => r.riskLevel === '高风险').length;
    const pending = records.filter(r => !r.isClosed).length;

    return `
      <div class="page-container">
        <!-- 统计看板 -->
        <div class="dashboard-entry">
          <div class="dashboard-stat" onclick="app.switchToMenu('personnel-safety')">
            <div class="dashboard-stat__value dashboard-stat__value--primary">${records.length}</div>
            <div class="dashboard-stat__label">总记录数</div>
          </div>
          <div class="dashboard-stat" onclick="app.filterHighRiskSafety()">
            <div class="dashboard-stat__value dashboard-stat__value--danger">${highRisk}</div>
            <div class="dashboard-stat__label">⛔ 高风险</div>
          </div>
          <div class="dashboard-stat" onclick="app.filterPendingSafety()">
            <div class="dashboard-stat__value dashboard-stat__value--warning">${pending}</div>
            <div class="dashboard-stat__label">⏳ 待处理</div>
          </div>
          <div class="dashboard-stat" onclick="app.generateSafetyReport()">
            <div class="dashboard-stat__value dashboard-stat__value--success">📊</div>
            <div class="dashboard-stat__label">生成报表</div>
          </div>
        </div>

        <!-- 快捷操作区 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.addSafetyRecord()">
            <span style="font-size:16px;margin-right:4px;">➕</span>新增安全记录
          </button>
          <button class="el-button el-button--default" onclick="app.batchImport()">
            <span style="font-size:16px;margin-right:4px;">📥</span>批量导入
          </button>
          <button class="el-button el-button--warning" onclick="app.setRectifyReminder()">
            <span style="font-size:16px;margin-right:4px;">🔔</span>整改提醒
          </button>
          <button class="el-button el-button--danger" onclick="app.reportHighRisk()">
            <span style="font-size:16px;margin-right:4px;">🚨</span>高风险上报
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 筛选区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:180px;">
            <input class="el-input__inner" placeholder="人员姓名/工号" id="safeSearchName" />
          </div>
          <div class="el-select" style="width:160px;">
            <select class="el-input__inner" id="safeSearchType">
              <option value="">全部记录类型</option>
              <option value="安全考核">安全考核</option>
              <option value="违规记录">违规记录</option>
              <option value="事故记录">事故记录</option>
              <option value="安全交底">安全交底</option>
            </select>
          </div>
          <div class="el-select" style="width:140px;">
            <select class="el-input__inner" id="safeSearchRisk">
              <option value="">全部风险等级</option>
              <option value="无风险">无风险</option>
              <option value="低风险">低风险</option>
              <option value="中风险">中风险</option>
              <option value="高风险">高风险</option>
            </select>
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="记录起" id="safeDateStart" />
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="记录止" id="safeDateEnd" />
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetPersonnelFilter('safe')">重置</button>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">安全记录列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${records.length} 条记录</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox" onchange="app.toggleAllCheckbox(this, 'safe')" /></th>
                <th>人员信息</th>
                <th>记录类型</th>
                <th>事件名称</th>
                <th>记录时间</th>
                <th>风险等级</th>
                <th>处理结果</th>
                <th>状态</th>
                <th style="width:200px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${records.map(r => {
              const riskColor = MOCK.getRiskLevelColor(r.riskLevel);
              return `
                <tr style="${r.riskLevel === '高风险' ? 'background:#fff1f0;' : (r.riskLevel === '中风险' ? 'background:#fffbe6;' : '')}">
                  <td><input type="checkbox" class="safe-checkbox" value="${r.id}" /></td>
                  <td>
                    <a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.viewPersonnelDetail('archive','${r.personId}')">
                      ${r.personName}
                    </a>
                    <span style="font-size:12px;color:var(--pwd-text-secondary);">${r.personDept}</span>
                  </td>
                  <td>${r.recordType}</td>
                  <td>
                    <a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.viewPersonnelDetail('safety','${r.id}')">
                      ${r.eventName}
                    </a>
                  </td>
                  <td>${r.occurDate}</td>
                  <td>
                    <span style="display:inline-flex;align-items:center;gap:4px;">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${riskColor};"></span>
                      <span style="color:${riskColor};font-weight:500;">${r.riskLevel}</span>
                    </span>
                  </td>
                  <td style="font-size:12px;">${r.handleResult || '-'}</td>
                  <td>
                    <span class="status-tag ${r.isClosed ? 'status-tag--done' : 'status-tag--pending'}">
                      ${r.isClosed ? '已结案' : '处理中'}
                    </span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="el-button el-button--primary el-button--small" onclick="app.viewPersonnelDetail('safety','${r.id}')">查看</button>
                      <button class="el-button el-button--default el-button--small" onclick="app.editSafetyRecord('${r.id}')">编辑</button>
                      ${!r.isClosed ? '<button class="el-button el-button--success el-button--small" onclick="app.submitRectifyProof(\'' + r.id + '\')">整改</button>' : ''}
                      <button class="el-button el-button--warning el-button--small" onclick="app.linkSafetyTraining('${r.id}')">关联培训</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${records.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 安全记录：详情页 ---------- */
  renderPersonnelSafetyDetail: function(itemId) {
    const allRecords = MOCK.generatePersonnelSafetyList();
    const r = allRecords.find(x => x.id === itemId) || allRecords[0];
    const p = MOCK.persons.find(x => x.id === r.personId) || MOCK.persons[0];
    const attachments = MOCK.generateAttachments('safety');
    const riskColor = MOCK.getRiskLevelColor(r.riskLevel);

    return `
      <div class="page-container personnel-detail">
        <div class="personnel-detail__header">
          <div class="personnel-detail__title">
            <span>🔒 安全记录详情</span>
            <span style="font-size:12px;font-weight:400;color:var(--pwd-text-secondary);">${r.id}</span>
          </div>
          <div class="personnel-detail__actions">
            <button class="el-button el-button--default" onclick="app.closePersonnelDetail('personnel-safety')">
              <span style="font-size:14px;margin-right:4px;">⬅</span>返回列表
            </button>
            <button class="el-button el-button--primary" onclick="app.editSafetyRecord('${r.id}')">✏️ 编辑</button>
            <button class="el-button el-button--warning" onclick="app.linkSafetyTraining('${r.id}')">📚 关联培训</button>
            <button class="el-button el-button--danger" onclick="app.reportHighRisk()">🚨 上报</button>
            ${!r.isClosed ? '<button class="el-button el-button--success" onclick="app.submitRectifyProof(\'' + r.id + '\')">✅ 提交整改</button>' : ''}
          </div>
        </div>

        <!-- 风险预警 -->
        ${r.riskLevel === '高风险' ? '<div class="alert-info alert-info--error">🚨 高风险记录！已自动同步至人员档案，作为岗位调整/资质审核参考依据。</div>' : ''}
        ${r.riskLevel === '中风险' ? '<div class="alert-info alert-info--warning">⚠ 中风险记录，请及时安排整改并提交整改证明。</div>' : ''}
        ${!r.isClosed ? '<div class="alert-info alert-info--info">⏳ 该记录尚未结案，请跟进整改进度。</div>' : ''}

        <!-- 事件基础信息 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>📋 事件基础信息</span>
          </div>
          <div class="info-card__body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">记录类型</span>
                <span class="info-item__value">${r.recordType}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">事件名称</span>
                <span class="info-item__value">${r.eventName}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">发生时间</span>
                <span class="info-item__value">${r.occurDate} ${r.occurTime || ''}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">发生地点</span>
                <span class="info-item__value">${r.location || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">风险等级</span>
                <span class="info-item__value">
                  <span style="color:${riskColor};font-weight:600;">${r.riskLevel}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-item__label">事件状态</span>
                <span class="info-item__value">
                  <span class="status-tag ${r.isClosed ? 'status-tag--done' : 'status-tag--pending'}">
                    ${r.isClosed ? '已结案' : '处理中'}
                  </span>
                </span>
              </div>
              <div class="info-item form-full">
                <span class="info-item__label">事件描述</span>
                <span class="info-item__value">${r.description}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 处理信息 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>⚙️ 处理信息</span>
          </div>
          <div class="info-card__body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">处理人</span>
                <span class="info-item__value">${r.handler || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">处理结果</span>
                <span class="info-item__value">${r.handleResult || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">处理日期</span>
                <span class="info-item__value">${r.handleDate ? MOCK.formatDate(r.handleDate) : '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">整改期限</span>
                <span class="info-item__value ${!r.isClosed ? 'info-item__value--warning' : ''}">
                  ${r.deadline || '-'}
                  ${!r.isClosed && r.deadline ? '<span style="color:#f5222d;font-size:12px;margin-left:8px;">⚠ 请按时整改</span>' : ''}
                </span>
              </div>
              <div class="info-item">
                <span class="info-item__label">整改状态</span>
                <span class="info-item__value">
                  <span class="status-tag ${r.rectificationStatus === '已完成' ? 'status-tag--done' : (r.rectificationStatus === '进行中' ? 'status-tag--processing' : 'status-tag--pending')}">
                    ${r.rectificationStatus || '-'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 关联信息 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>🔗 关联信息</span>
          </div>
          <div class="info-card__body">
            <div class="info-grid info-grid--2">
              <div class="info-item">
                <span class="info-item__label">关联人员</span>
                <span class="info-item__value">
                  <a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.viewPersonnelDetail('archive','${p.id}')">${p.name}</a>
                  <span style="font-size:12px;color:var(--pwd-text-secondary);margin-left:8px;">${p.dept} · ${p.position}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-item__label">关联安全培训</span>
                <span class="info-item__value">
                  ${r.relatedTraining ? '<a style="color:var(--pwd-primary);cursor:pointer;" onclick="app.genericSearch()">' + r.relatedTraining + '</a>' : '<span style="color:var(--pwd-text-secondary);">无关联培训</span>'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 附件区 -->
        <div class="info-card">
          <div class="info-card__header">
            <span>📎 事件附件</span>
            <button class="el-button el-button--text el-button--small" onclick="app.uploadFile()">上传附件</button>
          </div>
          <div class="info-card__body">
            <div class="attachment-grid">
              ${attachments.map(f => `
                <div class="attachment-card" onclick="app.downloadFile('${f.name}')">
                  <div class="attachment-card__icon">${f.icon}</div>
                  <div class="attachment-card__name">${f.name}</div>
                  <div class="attachment-card__meta">${f.size}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ============================================================
   * 在岗现场管控服务（4大页面 - 完全对齐需求文档）
   * ============================================================ */
  renderOnsitePage: function(menuKey) {
    // 检查是否在违规详情视图状态
    const detailState = window._onsiteDetailState;
    if (detailState) {
      if (menuKey === 'onsite-violation' && detailState.view === 'violationDetail') {
        return this.renderOnsiteViolationDetail(detailState.violationId);
      }
      if (menuKey === 'onsite-violation' && detailState.view === 'addViolation') {
        return this.renderOnsiteAddViolationForm();
      }
      if (menuKey.startsWith('onsite-wo-') && detailState.view === 'taskEditor') {
        return this.renderWorkOrderTaskEditor(detailState.orderId, detailState.taskType);
      }
    }
    switch(menuKey) {
      case 'onsite-violation': return this.renderOnsiteViolation();
      case 'onsite-wo-issued':
      case 'onsite-wo-pending':
      case 'onsite-wo-done': return this.renderWorkOrderTaskList(menuKey);
      case 'onsite-geofence': return this.renderOnsiteGeofence();
      case 'onsite-location': return this.renderOnsiteLocation();
      default: return '';
    }
  },

  /* ---------- 一、违规事件页面 ---------- */
  renderOnsiteViolation: function() {
    const violations = MOCK.generateViolations();
    const statPending = violations.filter(v => v.status === 'pending').length;
    const statProcessing = violations.filter(v => v.status === 'processing').length;
    const statCompleted = violations.filter(v => v.status === 'completed').length;

    return `
      <div class="page-container">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--red">🚨</div>
            <div class="stat-card__info">
              <div class="stat-card__label">总违规事件</div>
              <div class="stat-card__value">${violations.length}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--orange">⏳</div>
            <div class="stat-card__info">
              <div class="stat-card__label">待处理</div>
              <div class="stat-card__value">${statPending}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--blue">🔄</div>
            <div class="stat-card__info">
              <div class="stat-card__label">处理中</div>
              <div class="stat-card__value">${statProcessing}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--green">✅</div>
            <div class="stat-card__info">
              <div class="stat-card__label">已完成</div>
              <div class="stat-card__value">${statCompleted}</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮区 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.addViolation()">
            <span style="font-size:16px;margin-right:4px;">➕</span>新增违规（人工上报）
          </button>
          <button class="el-button el-button--default" onclick="app.genericExport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>批量导出
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 查询条件区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" placeholder="违规人员姓名" id="vioSearchName" />
          </div>
          <div class="el-input" style="width:140px;">
            <input class="el-input__inner" placeholder="人员工号" id="vioSearchId" />
          </div>
          <div class="el-select" style="width:150px;">
            <select class="el-input__inner" id="vioSearchDept">
              <option value="">所属部门/单位</option>
              <option value="生产部">生产部</option>
              <option value="安全部">安全部</option>
              <option value="技术部">技术部</option>
              <option value="行政部">行政部</option>
            </select>
          </div>
          <div class="el-select" style="width:150px;">
            <select class="el-input__inner" id="vioSearchType">
              <option value="">违规类型</option>
              <option value="AI抓拍">AI抓拍</option>
              <option value="人工巡查">人工巡查</option>
            </select>
          </div>
          <div class="el-select" style="width:130px;">
            <select class="el-input__inner" id="vioSearchRisk">
              <option value="">风险等级</option>
              <option value="低">低</option>
              <option value="中">中</option>
              <option value="高">高</option>
            </select>
          </div>
          <div class="el-select" style="width:150px;">
            <select class="el-input__inner" id="vioSearchStatus">
              <option value="">处理状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
          <div class="el-input" style="width:150px;">
            <input class="el-input__inner" type="date" placeholder="违规开始" id="vioDateStart" />
          </div>
          <div class="el-input" style="width:150px;">
            <input class="el-input__inner" type="date" placeholder="违规结束" id="vioDateEnd" />
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetOnsiteFilter('vio')">重置</button>
          <button class="el-button el-button--text" onclick="app.toggleAdvancedFilter('vio')" style="font-size:12px;">▼ 高级筛选</button>
        </div>

        <!-- 高级筛选面板 -->
        <div class="advanced-filter" id="advancedFilterVio">
          <div class="advanced-filter__grid">
            <div class="el-form-item">
              <label class="el-form-item__label" style="width:80px;">上报人</label>
              <div class="el-input" style="flex:1;"><input class="el-input__inner" placeholder="上报人姓名" /></div>
            </div>
            <div class="el-form-item">
              <label class="el-form-item__label" style="width:80px;">违规地点</label>
              <div class="el-input" style="flex:1;"><input class="el-input__inner" placeholder="违规地点" /></div>
            </div>
          </div>
          <div class="advanced-filter__actions">
            <button class="el-button el-button--primary el-button--small" onclick="app.genericSearch()">查询</button>
            <button class="el-button el-button--default el-button--small" onclick="app.toggleAdvancedFilter('vio')">收起</button>
          </div>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">违规事件列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${violations.length} 条记录</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:50px;">序号</th>
                <th>人员姓名</th>
                <th>工号</th>
                <th>部门/单位</th>
                <th>违规类型</th>
                <th>违规内容描述</th>
                <th>违规地点</th>
                <th>风险等级</th>
                <th>处理状态</th>
                <th>扣分分值</th>
                <th>违规时间</th>
                <th>上报人</th>
                <th style="width:200px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${violations.map((v, idx) => {
              const riskColor = v.riskLevel === '高' ? '#f5222d' : (v.riskLevel === '中' ? '#fa8c16' : '#faad14');
              const statusClass = v.status === 'pending' ? 'status-tag--pending' : (v.status === 'processing' ? 'status-tag--processing' : (v.status === 'completed' ? 'status-tag--done' : 'status-tag--rejected'));
              return `
                <tr style="${v.riskLevel === '高' ? 'background:#fff1f0;' : (v.riskLevel === '中' ? 'background:#fffbe6;' : '')}">
                  <td>${idx + 1}</td>
                  <td><a style="color:var(--pwd-primary);cursor:pointer;font-weight:500;" onclick="app.viewViolationDetail('${v.id}')">${v.personName}</a></td>
                  <td style="color:var(--pwd-text-secondary);font-size:12px;">${v.personId}</td>
                  <td>${v.dept}</td>
                  <td><span class="tag" style="background:${v.violationType === 'AI抓拍' ? '#e6f7ff' : '#fff7e6'};color:${v.violationType === 'AI抓拍' ? '#1890ff' : '#fa8c16'};padding:2px 8px;border-radius:3px;font-size:12px;">${v.violationType}</span></td>
                  <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v.description}">${v.description}</td>
                  <td style="font-size:12px;">${v.location}</td>
                  <td><span style="color:${riskColor};font-weight:600;">${v.riskLevel}</span></td>
                  <td><span class="status-tag ${statusClass}" style="font-size:12px;">${MOCK.getViolationStatusLabel(v.status)}</span></td>
                  <td style="color:#f5222d;font-weight:600;">-${v.deductScore}</td>
                  <td style="font-size:12px;">${v.violationTime}</td>
                  <td style="font-size:12px;">${v.reporter}</td>
                  <td>
                    <div class="action-btns">
                      <button class="el-button el-button--primary el-button--small" onclick="app.viewViolationDetail('${v.id}')">查看</button>
                      ${v.status === 'pending' ? `<button class="el-button el-button--success el-button--small" onclick="app.dispatchRectify('${v.id}')">处理</button>` : ''}
                      ${v.status === 'completed' ? `<button class="el-button el-button--default el-button--small" onclick="app.archiveViolation('${v.id}')">归档</button>` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${violations.length} 条</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 一-A：违规事件详情子页面 ---------- */
  renderOnsiteViolationDetail: function(violationId) {
    const allViolations = MOCK.generateViolations();
    const v = allViolations.find(x => x.id === violationId) || allViolations[0];
    const p = MOCK.persons.find(x => x.id === v.personId) || MOCK.persons[0];
    const riskColor = v.riskLevel === '高' ? '#f5222d' : (v.riskLevel === '中' ? '#fa8c16' : '#faad14');
    const statusClass = v.status === 'pending' ? 'status-tag--pending' : (v.status === 'processing' ? 'status-tag--processing' : (v.status === 'completed' ? 'status-tag--done' : 'status-tag--rejected'));
    const relatedOrders = MOCK.generateWorkOrders().slice(0, 2);
    const handleRecords = (v.status === 'pending') ? [
      { action: '违规上报', time: v.violationTime, operator: v.reporter, remark: v.description }
    ] : (v.status === 'processing' ? [
      { action: '违规上报', time: v.violationTime, operator: v.reporter, remark: v.description },
      { action: '下发整改工单', time: v.violationTime, operator: '系统自动', remark: '已生成整改工单并派发至责任部门' }
    ] : [
      { action: '违规上报', time: v.violationTime, operator: v.reporter, remark: v.description },
      { action: '下发整改工单', time: v.violationTime, operator: '系统自动', remark: '已生成整改工单并派发至责任部门' },
      { action: '整改完成', time: v.violationTime, operator: '管理员', remark: '现场已整改完成，验收通过' }
    ]);

    return `
      <div class="page-container personnel-detail">
        <div class="personnel-detail__header">
          <div class="personnel-detail__title">
            <span>🚨 违规事件详情</span>
            <span style="font-size:12px;font-weight:400;color:var(--pwd-text-secondary);">${v.id}</span>
          </div>
          <div class="personnel-detail__actions">
            <button class="el-button el-button--default" onclick="app.closeOnsiteDetail('onsite-violation')">
              <span style="font-size:14px;margin-right:4px;">⬅</span>返回列表
            </button>
            ${v.status === 'pending' ? `<button class="el-button el-button--success" onclick="app.dispatchRectify('${v.id}')">📋 处理（下发整改工单）</button>` : ''}
            ${v.status === 'completed' ? `<button class="el-button el-button--default" onclick="app.archiveViolation('${v.id}')">📁 归档</button>` : ''}
          </div>
        </div>

        ${v.riskLevel === '高' ? '<div class="alert-info alert-info--error">🚨 高风险违规！建议立即处理并下发整改工单。</div>' : ''}
        ${v.riskLevel === '中' ? '<div class="alert-info alert-info--warning">⚠ 中风险违规，请及时安排整改。</div>' : ''}
        ${v.status === 'pending' ? '<div class="alert-info alert-info--info">⏳ 该事件待处理，请下发整改工单。</div>' : ''}
        ${v.status === 'rejected' ? '<div class="alert-info alert-info--error">⛔ 整改不通过，需重新处理。</div>' : ''}

        <div class="person-header-card" style="background:linear-gradient(135deg, #fff1f0 0%, #fff7e6 100%);border-color:#ffa39e;">
          <div class="person-header-card__avatar" style="background:var(--pwd-danger);">${v.personName[0]}</div>
          <div class="person-header-card__info">
            <div class="person-header-card__name">
              ${v.personName}
              <span class="status-tag ${statusClass}">${MOCK.getViolationStatusLabel(v.status)}</span>
              <span style="color:${riskColor};font-weight:600;font-size:14px;">${v.riskLevel}风险</span>
            </div>
            <div class="person-header-card__meta">
              <span><span class="meta-label">工号：</span>${v.personId}</span>
              <span><span class="meta-label">部门：</span>${v.dept}</span>
              <span><span class="meta-label">岗位：</span>${p.position}</span>
              <span><span class="meta-label">安全积分：</span><span style="color:${p.score >= 80 ? '#52c41a' : (p.score >= 60 ? '#faad14' : '#f5222d')};font-weight:600;">${p.score}分</span></span>
              <span><span class="meta-label">扣分：</span><span style="color:#f5222d;font-weight:600;">-${v.deductScore}分</span></span>
            </div>
          </div>
        </div>

        <div class="detail-tabs">
          <div class="detail-tab-item is-active" data-tab="tabVioBasic" onclick="app.switchOnsiteDetailTab(event, 'vio', 'tabVioBasic')">违规详情</div>
          <div class="detail-tab-item" data-tab="tabVioRecord" onclick="app.switchOnsiteDetailTab(event, 'vio', 'tabVioRecord')">处理记录</div>
          <div class="detail-tab-item" data-tab="tabVioOrder" onclick="app.switchOnsiteDetailTab(event, 'vio', 'tabVioOrder')">关联工单</div>
        </div>

        <div id="vioTabVioBasic" class="detail-tab-content">
          <div class="info-card">
            <div class="info-card__header">
              <span>📋 违规基本信息</span>
              <button class="el-button el-button--text el-button--small" onclick="app.editViolation('${v.id}')">编辑</button>
            </div>
            <div class="info-card__body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-item__label">违规编号</span>
                  <span class="info-item__value">${v.id}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">违规类型</span>
                  <span class="info-item__value"><span class="tag" style="background:${v.violationType === 'AI抓拍' ? '#e6f7ff' : '#fff7e6'};color:${v.violationType === 'AI抓拍' ? '#1890ff' : '#fa8c16'};">${v.violationType}</span></span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">风险等级</span>
                  <span class="info-item__value" style="color:${riskColor};font-weight:600;">${v.riskLevel}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">处理状态</span>
                  <span class="info-item__value"><span class="status-tag ${statusClass}">${MOCK.getViolationStatusLabel(v.status)}</span></span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">扣分分值</span>
                  <span class="info-item__value" style="color:#f5222d;font-weight:600;">-${v.deductScore} 分</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">违规时间</span>
                  <span class="info-item__value">${v.violationTime}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">违规地点</span>
                  <span class="info-item__value">${v.location}</span>
                </div>
                <div class="info-item">
                  <span class="info-item__label">上报人</span>
                  <span class="info-item__value">${v.reporter}</span>
                </div>
                <div class="info-item" style="grid-column:1/-1;">
                  <span class="info-item__label">违规内容描述</span>
                  <span class="info-item__value" style="font-weight:400;line-height:1.6;">${v.description}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="vioTabVioRecord" class="detail-tab-content" style="display:none;">
          <div class="info-card">
            <div class="info-card__header">
              <span>⚙️ 处理记录</span>
            </div>
            <div class="info-card__body" style="padding:0;">
              ${handleRecords.map((r, idx) => `
                <div class="related-record-item">
                  <div class="related-record-item__info">
                    <span class="related-record-item__title" style="color:var(--pwd-text-primary);">${r.action}</span>
                    <span class="related-record-item__meta">${r.operator} · ${r.time}</span>
                    <span style="font-size:12px;color:var(--pwd-text-secondary);margin-top:2px;">${r.remark}</span>
                  </div>
                  <span style="font-size:11px;color:var(--pwd-text-secondary);white-space:nowrap;">
                    ${idx === 0 ? '🟢' : (idx === handleRecords.length - 1 && v.status === 'completed' ? '✅' : '🔄')}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div id="vioTabVioOrder" class="detail-tab-content" style="display:none;">
          <div class="info-card">
            <div class="info-card__header">
              <span>📋 关联整改工单</span>
              ${v.status === 'pending' ? `<button class="el-button el-button--text el-button--small" onclick="app.dispatchRectify('${v.id}')">下发整改工单</button>` : ''}
            </div>
            <div class="info-card__body" style="padding:0;">
              ${relatedOrders.map(o => `
                <div class="related-record-item">
                  <div class="related-record-item__info">
                    <span class="related-record-item__title" onclick="app.viewWorkOrderDetail('${o.id}')">${o.title}</span>
                    <span class="related-record-item__meta">${o.orderType} · ${o.responsibleDept} · 执行人：${o.executor} · ${o.deadline}</span>
                  </div>
                  <span class="related-record-item__status">
                    <span class="status-tag ${o.status === 'completed' ? 'status-tag--done' : (o.status === 'processing' ? 'status-tag--processing' : 'status-tag--pending')}" style="font-size:11px;">
                      ${MOCK.getWorkOrderStatusLabel(o.status)}
                    </span>
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 一-B：新增违规（人工上报）子页面 ---------- */
  renderOnsiteAddViolationForm: function() {
    const persons = MOCK.persons;
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
    const locationOptions = ['A车间-东区', 'A车间-西区', 'B车间-1线', 'B车间-2线', '仓库区-南门', '仓库区-北门', '装卸区-2号', '配电室-高压区', '锅炉房-1号炉', '危化品存储区', '办公区-3楼', '停车场'];
    const today = new Date().toISOString().split('T')[0];
    const nowHour = String(new Date().getHours()).padStart(2, '0');
    const nowMin = String(new Date().getMinutes()).padStart(2, '0');

    return `
      <div class="page-container personnel-detail">
        <div class="personnel-detail__header">
          <div class="personnel-detail__title">
            <span>➕ 新增违规事件（人工上报）</span>
          </div>
          <div class="personnel-detail__actions">
            <button class="el-button el-button--default" onclick="app.closeOnsiteDetail('onsite-violation')">
              <span style="font-size:14px;margin-right:4px;">⬅</span>返回列表
            </button>
            <button class="el-button el-button--primary" onclick="app.submitAddViolation()">✅ 提交上报</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="info-card" style="grid-column:1/-1;">
            <div class="info-card__header">
              <span>📋 违规基本信息</span>
            </div>
            <div class="info-card__body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div class="el-form-item">
                  <label class="el-form-item__label">违规类型 <span style="color:#f5222d;">*</span></label>
                  <div class="el-select">
                    <select id="vioFormType" class="el-input__inner">
                      <option value="人工巡查">人工巡查</option>
                      <option value="AI抓拍">AI抓拍</option>
                    </select>
                  </div>
                </div>
                <div class="el-form-item">
                  <label class="el-form-item__label">风险等级 <span style="color:#f5222d;">*</span></label>
                  <div class="el-select">
                    <select id="vioFormRisk" class="el-input__inner" onchange="app.onViolationRiskChange()">
                      <option value="低">低（扣5分）</option>
                      <option value="中" selected>中（扣10分）</option>
                      <option value="高">高（扣20分）</option>
                    </select>
                  </div>
                </div>
                <div class="el-form-item" style="grid-column:1/-1;">
                  <label class="el-form-item__label">违规内容描述 <span style="color:#f5222d;">*</span></label>
                  <div class="el-input">
                    <textarea id="vioFormDesc" class="el-input__inner" rows="3" placeholder="请详细描述违规行为，包括时间、地点、涉及人员、具体违规情况等" style="resize:vertical;width:100%;"></textarea>
                  </div>
                </div>
                <div class="el-form-item">
                  <label class="el-form-item__label">违规地点 <span style="color:#f5222d;">*</span></label>
                  <div class="el-select">
                    <select id="vioFormLocation" class="el-input__inner">
                      <option value="">请选择违规地点</option>
                      ${locationOptions.map(l => `<option value="${l}">${l}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="el-form-item">
                  <label class="el-form-item__label">扣分分值 <span style="color:#f5222d;">*</span></label>
                  <div class="el-input">
                    <input id="vioFormScore" class="el-input__inner" type="number" value="10" min="0" max="100" />
                  </div>
                </div>
                <div class="el-form-item">
                  <label class="el-form-item__label">违规日期 <span style="color:#f5222d;">*</span></label>
                  <div class="el-input">
                    <input id="vioFormDate" class="el-input__inner" type="date" value="${today}" />
                  </div>
                </div>
                <div class="el-form-item">
                  <label class="el-form-item__label">违规时间</label>
                  <div class="el-input">
                    <input id="vioFormTime" class="el-input__inner" type="time" value="${nowHour}:${nowMin}" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-card" style="grid-column:1/-1;">
            <div class="info-card__header">
              <span>👤 违规人员选择 <span style="color:#f5222d;">*</span></span>
              <span style="font-size:12px;font-weight:400;color:var(--pwd-text-secondary);">已选 <strong id="vioSelectedPersonCount">0</strong> 人</span>
            </div>
            <div class="info-card__body">
              <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;">
                <input id="vioPersonSearch" style="flex:1;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="搜索人员姓名/工号..." oninput="app.filterVioPersonList()" />
              </div>
              <div style="border:1px solid #e8e8e8;border-radius:4px;max-height:280px;overflow-y:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:#fafafa;">
                      <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:36px;"></th>
                      <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">姓名</th>
                      <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">工号</th>
                      <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">部门</th>
                      <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">岗位</th>
                      <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">安全积分</th>
                      <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                  ${persons.map((p, idx) => {
                    const avatarColor = colors[idx % colors.length];
                    return `
                      <tr class="vio-person-row" data-name="${p.name}" data-id="${p.id}" data-dept="${p.dept}">
                        <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                          <input type="radio" name="vioPerson" class="vio-person-radio" data-id="${p.id}" data-name="${p.name}" data-dept="${p.dept}" data-position="${p.position}" onchange="app.updateVioPersonSelect()" />
                        </td>
                        <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                          <div style="display:flex;align-items:center;gap:6px;">
                            <div style="width:24px;height:24px;border-radius:50%;background:${avatarColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">${p.name[0]}</div>
                            <span>${p.name}</span>
                          </div>
                        </td>
                        <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:var(--pwd-text-secondary);font-size:12px;">${p.id}</td>
                        <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:var(--pwd-text-secondary);">${p.dept}</td>
                        <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:var(--pwd-text-secondary);">${p.position}</td>
                        <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                          <span style="color:${p.score >= 80 ? '#52c41a' : (p.score >= 60 ? '#faad14' : '#f5222d')};font-weight:500;">${p.score}</span>
                        </td>
                        <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                          <span class="status-tag ${p.status === '在职' ? 'status-tag--done' : (p.status === '离职' ? 'status-tag--rejected' : 'status-tag--pending')}" style="font-size:11px;">${p.status}</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  </tbody>
                </table>
              </div>
              <div id="vioSelectedPersonTag" style="margin-top:8px;min-height:24px;"></div>
            </div>
          </div>

          <div class="info-card" style="grid-column:1/-1;">
            <div class="info-card__header">
              <span>📎 现场照片/附件（选填）</span>
            </div>
            <div class="info-card__body">
              <div style="border:2px dashed #d9d9d9;border-radius:6px;padding:30px;text-align:center;cursor:pointer;background:#fafafa;" onclick="document.getElementById('vioFileInput').click()">
                <span style="font-size:36px;display:block;margin-bottom:8px;">📤</span>
                <span style="font-size:13px;color:#909399;">点击上传现场照片或相关文件（支持 jpg/png/pdf，最多 20MB）</span>
                <input id="vioFileInput" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" style="display:none;" onchange="document.getElementById('vioFileName').textContent = this.files.length + ' 个文件已选择'" />
              </div>
              <div id="vioFileName" style="margin-top:6px;font-size:12px;color:var(--pwd-text-secondary);"></div>
            </div>
          </div>

          <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;padding:12px 0;">
            <button class="el-button el-button--default" onclick="app.closeOnsiteDetail('onsite-violation')">取消</button>
            <button class="el-button el-button--primary" onclick="app.submitAddViolation()">✅ 提交上报</button>
          </div>
        </div>
      </div>
    `;
  },

  /* ========== 工单管理（工作流版）========== */

  /* ---------- 工单任务列表（已发/待办/已办） ---------- */
  renderWorkOrderTaskList: function(menuKey) {
    const parts = menuKey.split('-'); // onsite-wo-[type]
    const taskType = parts[2]; // issued / pending / done
    const taskTypeName = taskType === 'issued' ? '已发任务' : (taskType === 'pending' ? '待办任务' : '已办任务');
    const orders = MOCK.generateWorkOrders();

    // 按任务类型过滤
    let filtered = [];
    if (taskType === 'issued') {
      filtered = orders.filter(o => o.creator === '王安全员' || o.creator === '李主管' || o.creator === '张经理');
    } else if (taskType === 'pending') {
      filtered = orders.filter(o => ['审批中', '处理中', '待验收'].includes(o.status));
    } else {
      filtered = orders.filter(o => ['已完成', '已驳回', '已作废'].includes(o.status));
    }

    // 统计
    const statAll = orders.length;
    const statDraft = orders.filter(o => o.status === '草稿').length;
    const statApproving = orders.filter(o => o.status === '审批中').length;
    const statProcessing = orders.filter(o => o.status === '处理中').length;
    const statPendingAccept = orders.filter(o => o.status === '待验收').length;
    const statCompleted = orders.filter(o => o.status === '已完成').length;
    const riskColors = { '低风险': '#faad14', '中风险': '#fa8c16', '高风险': '#f5222d' };
    const statusClassMap = {
      '草稿': 'status-tag--draft', '审批中': 'status-tag--pending', '处理中': 'status-tag--processing',
      '待验收': 'status-tag--pending', '已完成': 'status-tag--done', '已驳回': 'status-tag--rejected', '已作废': 'status-tag--rejected'
    };

    const id = 'wo_tbl_' + taskType;

    return `
      <div class="page-container">
        <!-- 操作按钮区 -->
        <div class="operate-bar">
          ${taskType === 'issued' ? '<button class="el-button el-button--primary" onclick="app.openWorkOrderForm()"><span style="font-size:16px;margin-right:4px;">➕</span>新建工单</button>' : ''}
          <button class="el-button el-button--default" onclick="app.genericExport()"><span style="font-size:16px;margin-right:4px;">📤</span>批量导出</button>
          <button class="el-button el-button--default" onclick="app.refreshPage()"><span style="font-size:16px;margin-right:4px;">🔄</span>刷新</button>
          <div style="margin-left:auto;display:flex;gap:4px;">
            <button class="el-button ${taskType === 'issued' ? 'el-button--primary' : 'el-button--default'} el-button--small" onclick="app.switchToMenu('onsite-wo-issued')">已发任务</button>
            <button class="el-button ${taskType === 'pending' ? 'el-button--primary' : 'el-button--default'} el-button--small" onclick="app.switchToMenu('onsite-wo-pending')">待办任务</button>
            <button class="el-button ${taskType === 'done' ? 'el-button--primary' : 'el-button--default'} el-button--small" onclick="app.switchToMenu('onsite-wo-done')">已办任务</button>
          </div>
        </div>

        <!-- 查询条件区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:150px;">
            <input class="el-input__inner" placeholder="工单编号" id="woSearchId_${taskType}" />
          </div>
          <div class="el-select" style="width:130px;">
            <select class="el-input__inner" id="woSearchType_${taskType}">
              <option value="">工单类型</option>
              <option value="巡检">巡检</option>
              <option value="隐患整改">隐患整改</option>
              <option value="安全报修">安全报修</option>
              <option value="违规整改">违规整改</option>
            </select>
          </div>
          <div class="el-select" style="width:130px;">
            <select class="el-input__inner" id="woSearchDept_${taskType}">
              <option value="">责任部门</option>
              <option value="生产部">生产部</option>
              <option value="安全部">安全部</option>
              <option value="技术部">技术部</option>
              <option value="行政部">行政部</option>
            </select>
          </div>
          <div class="el-input" style="width:130px;">
            <input class="el-input__inner" placeholder="执行人" id="woSearchExecutor_${taskType}" />
          </div>
          <div class="el-select" style="width:140px;">
            <select class="el-input__inner" id="woSearchStatus_${taskType}">
              <option value="">流程状态</option>
              <option value="草稿">草稿</option>
              <option value="审批中">审批中</option>
              <option value="处理中">处理中</option>
              <option value="待验收">待验收</option>
              <option value="已完成">已完成</option>
              <option value="已驳回">已驳回</option>
              <option value="已作废">已作废</option>
            </select>
          </div>
          <div class="el-select" style="width:110px;">
            <select class="el-input__inner" id="woSearchRisk_${taskType}">
              <option value="">风险等级</option>
              <option value="低风险">低风险</option>
              <option value="中风险">中风险</option>
              <option value="高风险">高风险</option>
            </select>
          </div>
          <div class="el-input" style="width:130px;">
            <input class="el-input__inner" type="date" placeholder="创建开始" id="woDateStart_${taskType}" />
          </div>
          <div class="el-input" style="width:130px;">
            <input class="el-input__inner" type="date" placeholder="创建结束" id="woDateEnd_${taskType}" />
          </div>
          <button class="el-button el-button--primary" onclick="app.searchWorkOrders()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetWoFilter()">重置</button>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">${taskTypeName}列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${filtered.length} 条记录</span>
          </div>
          <div id="${id}">
            <table class="el-table" style="width:100%">
              <thead>
                <tr>
                  <th style="width:50px;">序号</th>
                  <th>工单编号</th>
                  <th>工单类型</th>
                  <th>工单标题</th>
                  <th>隐患/问题描述</th>
                  <th>责任部门</th>
                  <th>执行人</th>
                  <th>风险等级</th>
                  <th>创建时间</th>
                  <th>要求完成时间</th>
                  <th>流程状态</th>
                  <th>创建人</th>
                  <th style="width:180px;">操作</th>
                </tr>
              </thead>
              <tbody>
              ${filtered.map((o, idx) => {
                const statusCls = statusClassMap[o.status] || 'status-tag--draft';
                const riskColor = riskColors[o.riskLevel] || '#909399';
                const isHighRisk = o.riskLevel === '高风险';
                return `
                  <tr style="${isHighRisk ? 'background:#fff1f0;' : (o.riskLevel === '中风险' ? 'background:#fffbe6;' : '')}">
                    <td>${idx + 1}</td>
                    <td style="color:var(--pwd-primary);cursor:pointer;font-weight:500;" onclick="app.openWoTaskEditor('${o.id}','${taskType}')">${o.id}</td>
                    <td><span class="tag" style="background:#e6f7ff;color:#1890ff;padding:2px 8px;border-radius:3px;font-size:12px;">${o.orderType}</span></td>
                    <td style="font-weight:500;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${o.title}">${o.title}</td>
                    <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${o.description}">${o.description}</td>
                    <td>${o.responsibleDept}</td>
                    <td>${o.executor || '-'}</td>
                    <td><span style="color:${riskColor};font-weight:600;">${o.riskLevel}</span></td>
                    <td style="font-size:12px;">${o.createTime}</td>
                    <td style="font-size:12px;">${o.deadline}</td>
                    <td><span class="status-tag ${statusCls}" style="font-size:12px;">${MOCK.getWorkOrderStatusLabel(o.status)}</span></td>
                    <td style="font-size:12px;">${o.creator}</td>
                    <td>
                      <div class="action-btns">
                        <button class="el-button el-button--primary el-button--small" onclick="app.openWoTaskEditor('${o.id}','${taskType}')">查看</button>
                        ${taskType === 'pending' ? `<button class="el-button el-button--success el-button--small" onclick="app.openWoTaskEditor('${o.id}','${taskType}')">处理</button>` : ''}
                        ${taskType === 'issued' && o.status === '草稿' ? `<button class="el-button el-button--danger el-button--small" onclick="app.cancelWorkOrder('${o.id}')">撤销</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              </tbody>
            </table>
            <div style="display:flex;justify-content:flex-end;padding:12px 0;">
              <div class="el-pagination">
                <button class="el-button el-button--default el-button--small" disabled>上一页</button>
                <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
                <button class="el-button el-button--default el-button--small" disabled>下一页</button>
                <span style="margin-left:8px;line-height:32px;">共 ${filtered.length} 条</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 工单任务编辑器（表单/流程图/流转记录） ---------- */
  renderWorkOrderTaskEditor: function(orderId, taskType) {
    const orders = MOCK.generateWorkOrders();
    const o = orders.find(x => x.id === orderId) || orders[0];
    const records = MOCK.generateOrderFlowRecords(orderId);
    const riskColors = { '低风险': '#faad14', '中风险': '#fa8c16', '高风险': '#f5222d' };
    const statusClassMap = {
      '草稿': 'status-tag--draft', '审批中': 'status-tag--pending', '处理中': 'status-tag--processing',
      '待验收': 'status-tag--pending', '已完成': 'status-tag--done', '已驳回': 'status-tag--rejected', '已作废': 'status-tag--rejected'
    };
    const riskColor = riskColors[o.riskLevel] || '#909399';
    const statusCls = statusClassMap[o.status] || 'status-tag--draft';
    const isPending = taskType === 'pending';

    // 构造表单字段
    const formFields = this.getWorkOrderFormFields(o);

    // 延迟渲染流程图和流转记录（模拟）
    setTimeout(() => {
      this.renderWoFlowDiagram('woFlowDiagramContainer', records);
      this.renderWoFlowTimeline('woFlowTimelineContainer', records);
    }, 50);

    return `
      <div class="workflow-editor" style="height:auto;min-height:calc(100vh - 200px);">
        <!-- 操作按钮区 -->
        <div class="workflow-editor__toolbar">
          <span style="font-weight:600;">工单编号：${o.id}</span>
          <span style="font-size:12px;color:var(--pwd-text-secondary);margin-left:8px;">${o.title}</span>
          <span class="spacer"></span>
          ${isPending ? `
            <button class="el-button el-button--success" onclick="app.handleWoTaskApprove('${o.id}')">✅ 同意/提交</button>
            <button class="el-button el-button--warning" onclick="app.handleWoTaskReject('${o.id}')">⛔ 驳回</button>
          ` : ''}
          ${o.status === '草稿' ? `
            <button class="el-button el-button--primary" onclick="app.submitWorkOrderApproval('${o.id}')">🚀 发起审批</button>
            <button class="el-button el-button--default" onclick="app.editWorkOrder('${o.id}')">✏️ 编辑</button>
          ` : ''}
          ${(o.status === '草稿' || o.status === '审批中') ? `
            <button class="el-button el-button--danger" onclick="app.cancelWorkOrder('${o.id}')">🗑 作废</button>
          ` : ''}
          ${o.status === '审批中' ? `
            <button class="el-button el-button--warning" onclick="app.urgeWorkOrder('${o.id}')">🔔 催办</button>
          ` : ''}
          <button class="el-button el-button--default" onclick="app.closeWoTaskEditor('${taskType}')">⬅ 返回</button>
        </div>

        <!-- 状态提示 -->
        ${o.status === '已驳回' ? '<div class="alert-info alert-info--error">⛔ 工单已被驳回，请编辑后重新发起审批或作废工单。</div>' : ''}
        ${o.status === '已作废' ? '<div class="alert-info alert-info--error">⛔ 工单已作废，流程已终止。</div>' : ''}
        ${o.relatedViolation ? '<div class="alert-info alert-info--warning">🔗 本工单由违规事件 <strong>' + o.relatedViolation + '</strong> 触发</div>' : ''}

        <!-- 工单头部摘要 -->
        <div style="display:flex;gap:16px;padding:16px;background:linear-gradient(135deg,#f0f5ff,#e6f7ff);border-radius:8px;border:1px solid #91d5ff;margin-bottom:12px;flex-wrap:wrap;">
          <div><span style="color:#909399;font-size:12px;">工单类型</span><br><span style="font-weight:500;">${o.orderType}</span></div>
          <div><span style="color:#909399;font-size:12px;">流程状态</span><br><span class="status-tag ${statusCls}" style="font-size:12px;">${MOCK.getWorkOrderStatusLabel(o.status)}</span></div>
          <div><span style="color:#909399;font-size:12px;">风险等级</span><br><span style="color:${riskColor};font-weight:600;">${o.riskLevel}</span></div>
          <div><span style="color:#909399;font-size:12px;">责任部门</span><br><span>${o.responsibleDept}</span></div>
          <div><span style="color:#909399;font-size:12px;">执行人</span><br><span>${o.executor || '-'}</span></div>
          <div><span style="color:#909399;font-size:12px;">要求完成</span><br><span>${o.deadline}</span></div>
        </div>

        <!-- Tabs标签页 -->
        <div class="workflow-editor__tabs">
          <div class="el-tabs" style="height:100%;display:flex;flex-direction:column;">
            <div class="el-tabs__header" style="margin:0;padding:0 20px;">
              <div class="el-tabs__nav" style="display:flex;gap:0;">
                <div class="el-tabs__item is-active" style="padding:0 20px;height:40px;line-height:40px;cursor:pointer;border-bottom:2px solid var(--pwd-primary);color:var(--pwd-primary);" onclick="app.switchWoEditorTab(event,'form')">📋 表单</div>
                <div class="el-tabs__item" style="padding:0 20px;height:40px;line-height:40px;cursor:pointer;color:#606266;" onclick="app.switchWoEditorTab(event,'flow')">🗺️ 流程图</div>
                <div class="el-tabs__item" style="padding:0 20px;height:40px;line-height:40px;cursor:pointer;color:#606266;" onclick="app.switchWoEditorTab(event,'record')">📜 流转记录</div>
              </div>
            </div>
            <div class="el-tabs__content" style="flex:1;overflow-y:auto;padding:20px;">
              <!-- 表单标签页 -->
              <div id="woEditorTabForm" class="workflow-form">
                ${formFields}
                <div class="workflow-form__section">
                  <div class="workflow-form__section-title">📎 附件材料</div>
                  <div style="border:2px dashed var(--pwd-border-light);border-radius:8px;padding:40px;text-align:center;cursor:pointer;color:var(--pwd-text-secondary);" onclick="app.simulateFileUpload()">
                    <div style="font-size:40px;margin-bottom:8px;">📎</div>
                    <div>点击或拖拽文件到此区域上传</div>
                    <div style="font-size:12px;margin-top:4px;">支持 .pdf .jpg .png .docx 格式</div>
                  </div>
                  <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                    <div class="file-card" style="width:180px;">
                      <div class="file-card__icon">🖼️</div>
                      <div class="file-card__name">现场照片.jpg</div>
                      <div class="file-card__size">3.4 MB</div>
                    </div>
                    <div class="file-card" style="width:180px;">
                      <div class="file-card__icon">📄</div>
                      <div class="file-card__name">整改方案.pdf</div>
                      <div class="file-card__size">1.2 MB</div>
                    </div>
                  </div>
                </div>
                <!-- 联动信息 -->
                <div class="workflow-form__section">
                  <div class="workflow-form__section-title">🔗 跨模块联动</div>
                  <div class="form-grid">
                    <div class="el-form-item">
                      <label class="el-form-item__label">违规事件</label>
                      <div class="el-input"><input class="el-input__inner" value="${o.relatedViolation || '无关联'}" readonly /></div>
                    </div>
                    <div class="el-form-item">
                      <label class="el-form-item__label">安全记录</label>
                      <div class="el-input"><input class="el-input__inner" value="${o.status === '已完成' ? '✅ 已同步' : '⏳ 待同步'}" readonly /></div>
                    </div>
                    <div class="el-form-item">
                      <label class="el-form-item__label">安全考评积分</label>
                      <div class="el-input"><input class="el-input__inner" value="${o.status === '已完成' ? '⚡ 已触发' : '⏳ 待触发'}" readonly /></div>
                    </div>
                    <div class="el-form-item">
                      <label class="el-form-item__label">电子围栏核验</label>
                      <div class="el-input"><input class="el-input__inner" value="${o.status === '已完成' ? '✅ 已核验' : '⏳ 待核验'}" readonly /></div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 流程图标签页 -->
              <div id="woEditorTabFlow" class="workflow-diagram" style="display:none;">
                <div id="woFlowDiagramContainer" style="width:100%;height:100%;min-height:400px;"></div>
              </div>
              <!-- 流转记录标签页 -->
              <div id="woEditorTabRecord" style="display:none;">
                <div id="woFlowTimelineContainer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* 工单表单字段 */
  getWorkOrderFormFields: function(o) {
    return `
      <div class="workflow-form__section">
        <div class="workflow-form__section-title">📋 工单基础信息</div>
        <div class="form-grid">
          <div class="el-form-item">
            <label class="el-form-item__label">工单编号</label>
            <div class="el-input"><input class="el-input__inner" value="${o.id}" readonly /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">工单类型</label>
            <div class="el-input"><input class="el-input__inner" value="${o.orderType}" readonly /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">工单标题</label>
            <div class="el-input"><input class="el-input__inner" value="${o.title}" /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">风险等级</label>
            <div class="el-select">
              <select class="el-input__inner">
                <option ${o.riskLevel === '低风险' ? 'selected' : ''}>低风险</option>
                <option ${o.riskLevel === '中风险' ? 'selected' : ''}>中风险</option>
                <option ${o.riskLevel === '高风险' ? 'selected' : ''}>高风险</option>
              </select>
            </div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">责任部门</label>
            <div class="el-input"><input class="el-input__inner" value="${o.responsibleDept}" /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">执行人</label>
            <div class="el-input"><input class="el-input__inner" value="${o.executor || '待派发'}" /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">创建人</label>
            <div class="el-input"><input class="el-input__inner" value="${o.creator}" readonly /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">创建时间</label>
            <div class="el-input"><input class="el-input__inner" value="${o.createTime}" readonly /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">要求完成时间</label>
            <div class="el-input"><input class="el-input__inner" type="date" value="${o.deadline ? o.deadline.split(' ')[0] : ''}" /></div>
          </div>
          <div class="el-form-item">
            <label class="el-form-item__label">流程状态</label>
            <div class="el-input"><input class="el-input__inner" value="${MOCK.getWorkOrderStatusLabel(o.status)}" readonly /></div>
          </div>
          <div class="el-form-item" style="grid-column:1/-1;">
            <label class="el-form-item__label">问题/隐患描述</label>
            <div class="el-input">
              <textarea class="el-input__inner" rows="3" style="resize:vertical;width:100%;">${o.description}</textarea>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* 渲染流程图 */
  renderWoFlowDiagram: function(containerId, records) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:30px;">';
    records.forEach((r, idx) => {
      const isDone = r.status === '已完成';
      const isActive = r.status === '处理中';
      html += '<div style="display:flex;align-items:center;gap:6px;">';
      html += '<div style="padding:10px 18px;border-radius:20px;font-size:13px;font-weight:500;' +
        (isDone ? 'background:#f6ffed;color:#52c41a;border:2px solid #b7eb8f;' :
         isActive ? 'background:#e6f7ff;color:#1890ff;border:2px solid #91d5ff;box-shadow:0 0 8px rgba(24,144,255,0.3);' :
         'background:#f5f5f5;color:#bfbfbf;border:2px solid #d9d9d9;') + '">';
      html += (isDone ? '✅ ' : isActive ? '🔄 ' : '⏳ ') + r.nodeName;
      html += '</div>';
      if (idx < records.length - 1) {
        html += '<span style="color:#bfbfbf;font-size:18px;font-weight:300;">→</span>';
      }
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  },

  /* 渲染流转记录时间线 */
  renderWoFlowTimeline: function(containerId, records) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '<div style="padding:12px 20px;">';
    records.forEach((r, idx) => {
      const isDone = r.status === '已完成';
      const isActive = r.status === '处理中';
      html += '<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-left:2px solid ' +
        (isDone ? '#52c41a' : isActive ? '#1890ff' : '#e8e8e8') +
        ';margin-left:12px;padding-left:20px;position:relative;">';
      html += '<div style="position:absolute;left:-9px;top:14px;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid ' +
        (isDone ? '#52c41a' : isActive ? '#1890ff' : '#d9d9d9') + ';"></div>';
      html += '<div style="flex:1;">';
      html += '<div style="font-weight:500;font-size:14px;">' + r.nodeName + '</div>';
      html += '<div style="font-size:12px;color:#909399;margin-top:2px;">' + r.handler + ' · ' + r.time + '</div>';
      if (r.opinion) {
        html += '<div style="font-size:12px;color:#666;margin-top:4px;background:#fafafa;padding:6px 10px;border-radius:4px;">意见：' + r.opinion + '</div>';
      }
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  },

  /* ---------- 三、电子围栏页面 ---------- */
  renderOnsiteGeofence: function() {
    const geofences = MOCK.generateGeofences();
    const enabledCount = geofences.filter(g => g.status === 'enabled').length;
    const disabledCount = geofences.filter(g => g.status === 'disabled').length;

    return `
      <div class="page-container">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--blue">🗺️</div>
            <div class="stat-card__info">
              <div class="stat-card__label">围栏总数</div>
              <div class="stat-card__value">${geofences.length}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--green">✅</div>
            <div class="stat-card__info">
              <div class="stat-card__label">已启用</div>
              <div class="stat-card__value">${enabledCount}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--red">⛔</div>
            <div class="stat-card__info">
              <div class="stat-card__label">已禁用</div>
              <div class="stat-card__value">${disabledCount}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--orange">🔔</div>
            <div class="stat-card__info">
              <div class="stat-card__label">今日告警</div>
              <div class="stat-card__value">${Math.floor(Math.random() * 10) + 2}</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮区 -->
        <div class="operate-bar">
          <button class="el-button el-button--primary" onclick="app.addGeofence()">
            <span style="font-size:16px;margin-right:4px;">➕</span>新增围栏
          </button>
          <button class="el-button el-button--default" onclick="app.editGeofence()">
            <span style="font-size:16px;margin-right:4px;">✏️</span>编辑围栏
          </button>
          <button class="el-button el-button--danger" onclick="app.deleteGeofence()">
            <span style="font-size:16px;margin-right:4px;">🗑️</span>删除围栏
          </button>
          <button class="el-button el-button--warning" onclick="app.toggleGeofence()">
            <span style="font-size:16px;margin-right:4px;">🔘</span>启用/禁用
          </button>
          <button class="el-button el-button--success" onclick="app.viewGeofenceMap()">
            <span style="font-size:16px;margin-right:4px;">🗺️</span>查看围栏地图
          </button>
          <button class="el-button el-button--default" onclick="app.genericExport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>批量导出
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 查询条件区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:180px;">
            <input class="el-input__inner" placeholder="围栏名称" id="gfSearchName" />
          </div>
          <div class="el-select" style="width:150px;">
            <select class="el-input__inner" id="gfSearchType">
              <option value="">围栏类型</option>
              <option value="禁入区">禁入区</option>
              <option value="作业区">作业区</option>
              <option value="通行区">通行区</option>
              <option value="告警区">告警区</option>
            </select>
          </div>
          <div class="el-select" style="width:140px;">
            <select class="el-input__inner" id="gfSearchStatus">
              <option value="">启用状态</option>
              <option value="enabled">启用</option>
              <option value="disabled">禁用</option>
            </select>
          </div>
          <div class="el-input" style="width:150px;">
            <input class="el-input__inner" type="date" placeholder="创建时间" id="gfDateStart" />
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetOnsiteFilter('gf')">重置</button>
        </div>

        <!-- 列表 + 地图 -->
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <div class="table-container" style="flex:1;min-width:600px;">
            <div class="table-header">
              <span class="table-header__title">电子围栏列表</span>
              <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${geofences.length} 条记录</span>
            </div>
            <table class="el-table" style="width:100%">
              <thead>
                <tr>
                  <th style="width:50px;">序号</th>
                  <th>围栏名称</th>
                  <th>围栏类型</th>
                  <th>覆盖区域</th>
                  <th>告警方式</th>
                  <th>关联人员/部门</th>
                  <th>启用状态</th>
                  <th>创建时间</th>
                  <th style="width:180px;">操作</th>
                </tr>
              </thead>
              <tbody>
              ${geofences.map((g, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="font-weight:500;">${g.name}</td>
                  <td><span class="tag" style="background:${g.fenceType === '禁入区' ? '#fff1f0' : (g.fenceType === '作业区' ? '#e6f7ff' : (g.fenceType === '通行区' ? '#f6ffed' : '#fff7e6'))};color:${g.fenceType === '禁入区' ? '#f5222d' : (g.fenceType === '作业区' ? '#1890ff' : (g.fenceType === '通行区' ? '#52c41a' : '#fa8c16'))};padding:2px 8px;border-radius:3px;font-size:12px;">${g.fenceType}</span></td>
                  <td style="font-size:12px;">${g.area}</td>
                  <td style="font-size:12px;">${g.alertMethod}</td>
                  <td style="font-size:12px;">${g.associatedDept}</td>
                  <td><span class="status-tag ${g.status === 'enabled' ? 'status-tag--done' : 'status-tag--draft'}" style="font-size:12px;">${g.status === 'enabled' ? '启用' : '禁用'}</span></td>
                  <td style="font-size:12px;">${g.createTime}</td>
                  <td>
                    <div class="action-btns">
                      <button class="el-button el-button--primary el-button--small" onclick="app.editGeofence('${g.id}')">编辑</button>
                      <button class="el-button el-button--warning el-button--small" onclick="app.toggleGeofence('${g.id}')">${g.status === 'enabled' ? '禁用' : '启用'}</button>
                      <button class="el-button el-button--danger el-button--small" onclick="app.deleteGeofence('${g.id}')">删除</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              </tbody>
            </table>
            <div style="display:flex;justify-content:flex-end;padding:12px 0;">
              <div class="el-pagination">
                <button class="el-button el-button--default el-button--small" disabled>上一页</button>
                <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
                <button class="el-button el-button--default el-button--small" disabled>下一页</button>
                <span style="margin-left:8px;line-height:32px;">共 ${geofences.length} 条</span>
              </div>
            </div>
          </div>
          <div class="map-placeholder" style="flex:0.8;min-width:320px;height:auto;min-height:500px;">
            <div style="text-align:center;padding:40px 20px;">
              <div style="font-size:56px;margin-bottom:16px;">🗺️</div>
              <div style="font-size:16px;font-weight:600;margin-bottom:8px;">电子围栏地图</div>
              <div style="font-size:13px;color:var(--pwd-text-secondary);margin-bottom:12px;">实时围栏边界可视化</div>
              <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
                <span class="status-tag status-tag--done" style="font-size:12px;">● 禁入区: 3个</span>
                <span class="status-tag status-tag--pending" style="font-size:12px;">● 作业区: 4个</span>
                <span class="status-tag status-tag--draft" style="font-size:12px;">● 通行区: 2个</span>
                <span class="status-tag status-tag--rejected" style="font-size:12px;">● 告警区: 1个</span>
              </div>
              <div style="margin-top:16px;font-size:12px;color:#999;">（集成GIS地图后可展示实时围栏边界）</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ---------- 四、定位轨迹页面 ---------- */
  renderOnsiteLocation: function() {
    const trails = MOCK.generateLocationTrails();
    const onlineCount = trails.filter(t => t.positionStatus === '正常').length;
    const weakCount = trails.filter(t => t.positionStatus === '信号弱').length;
    const offlineCount = trails.filter(t => t.positionStatus === '离线').length;

    return `
      <div class="page-container">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--green">📍</div>
            <div class="stat-card__info">
              <div class="stat-card__label">在线人员</div>
              <div class="stat-card__value">${onlineCount}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--orange">📶</div>
            <div class="stat-card__info">
              <div class="stat-card__label">信号弱</div>
              <div class="stat-card__value">${weakCount}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--red">📴</div>
            <div class="stat-card__info">
              <div class="stat-card__label">离线</div>
              <div class="stat-card__value">${offlineCount}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--blue">🚶</div>
            <div class="stat-card__info">
              <div class="stat-card__label">今日总轨迹点数</div>
              <div class="stat-card__value">${trails.reduce((s, t) => s + t.trackPoints, 0)}</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮区 -->
        <div class="operate-bar">
          <button class="el-button el-button--success" onclick="app.viewLocationTrail()">
            <span style="font-size:16px;margin-right:4px;">🗺️</span>查看轨迹（地图展示）
          </button>
          <button class="el-button el-button--default" onclick="app.exportTrailReport()">
            <span style="font-size:16px;margin-right:4px;">📤</span>导出轨迹报表
          </button>
          <button class="el-button el-button--primary" onclick="app.quickLocatePerson()">
            <span style="font-size:16px;margin-right:4px;">🔍</span>人员快速定位
          </button>
          <button class="el-button el-button--default" onclick="app.refreshPage()" style="margin-left:auto;">
            <span style="font-size:16px;margin-right:4px;">🔄</span>刷新
          </button>
        </div>

        <!-- 查询条件区 -->
        <div class="filter-bar">
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" placeholder="人员姓名" id="locSearchName" />
          </div>
          <div class="el-input" style="width:140px;">
            <input class="el-input__inner" placeholder="工号" id="locSearchId" />
          </div>
          <div class="el-select" style="width:150px;">
            <select class="el-input__inner" id="locSearchDept">
              <option value="">部门/单位</option>
              <option value="生产部">生产部</option>
              <option value="安全部">安全部</option>
              <option value="技术部">技术部</option>
              <option value="行政部">行政部</option>
            </select>
          </div>
          <div class="el-input" style="width:160px;">
            <input class="el-input__inner" type="date" placeholder="查询日期" id="locSearchDate" value="${trails.length > 0 ? trails[0].trackDate : ''}" />
          </div>
          <div class="el-select" style="width:140px;">
            <select class="el-input__inner" id="locSearchStatus">
              <option value="">定位状态</option>
              <option value="正常">正常</option>
              <option value="信号弱">信号弱</option>
              <option value="离线">离线</option>
            </select>
          </div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" onclick="app.resetOnsiteFilter('loc')">重置</button>
          <button class="el-button el-button--default" onclick="app.filterDateTrail()">筛选日期</button>
        </div>

        <!-- 列表区 -->
        <div class="table-container">
          <div class="table-header">
            <span class="table-header__title">定位轨迹列表</span>
            <span style="color:var(--pwd-text-secondary);font-size:12px;">共 ${trails.length} 条记录（数据保存90天以上）</span>
          </div>
          <table class="el-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:50px;">序号</th>
                <th>人员姓名</th>
                <th>工号</th>
                <th>部门</th>
                <th>定位日期</th>
                <th>进入厂区时间</th>
                <th>离开厂区时间</th>
                <th>轨迹点数</th>
                <th>定位状态</th>
                <th style="width:160px;">操作</th>
              </tr>
            </thead>
            <tbody>
            ${trails.map((t, idx) => {
              const statusClass = t.positionStatus === '正常' ? 'status-tag--done' : (t.positionStatus === '信号弱' ? 'status-tag--pending' : 'status-tag--rejected');
              return `
                <tr style="${t.positionStatus === '离线' ? 'background:#f5f5f5;' : ''}">
                  <td>${idx + 1}</td>
                  <td><a style="color:var(--pwd-primary);cursor:pointer;font-weight:500;" onclick="app.viewLocationTrail('${t.personId}')">${t.personName}</a></td>
                  <td style="color:var(--pwd-text-secondary);font-size:12px;">${t.personId}</td>
                  <td>${t.dept}</td>
                  <td>${t.trackDate}</td>
                  <td>${t.enterTime}</td>
                  <td>${t.leaveTime}</td>
                  <td style="font-weight:500;">${t.trackPoints > 0 ? t.trackPoints.toLocaleString() : '-'}</td>
                  <td><span class="status-tag ${statusClass}" style="font-size:12px;">${t.positionStatus}</span></td>
                  <td>
                    <div class="action-btns">
                      <button class="el-button el-button--success el-button--small" onclick="app.viewLocationTrail('${t.personId}')">查看轨迹</button>
                      <button class="el-button el-button--default el-button--small" onclick="app.exportTrailReport('${t.personId}')">导出</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;padding:12px 0;">
            <div class="el-pagination">
              <button class="el-button el-button--default el-button--small" disabled>上一页</button>
              <span style="padding:0 8px;line-height:32px;">第 1 页 / 共 1 页</span>
              <button class="el-button el-button--default el-button--small" disabled>下一页</button>
              <span style="margin-left:8px;line-height:32px;">共 ${trails.length} 条</span>
            </div>
          </div>
        </div>

        <!-- 轨迹地图模拟 -->
        <div class="map-placeholder" style="height:360px;margin-top:16px;">
          <div style="text-align:center;padding:40px 20px;">
            <div style="font-size:48px;margin-bottom:12px;">📍</div>
            <div style="font-size:16px;font-weight:600;margin-bottom:8px;">人员定位轨迹地图</div>
            <div style="font-size:13px;color:var(--pwd-text-secondary);margin-bottom:12px;">
              点击【查看轨迹】展示全天移动路径，支持播放轨迹、查看停留点、越界点
            </div>
            <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:12px;height:3px;background:#1890ff;border-radius:2px;"></span>
                <span style="font-size:12px;">正常轨迹</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:12px;height:3px;background:#f5222d;border-radius:2px;"></span>
                <span style="font-size:12px;">越界点</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:8px;height:8px;background:#fa8c16;border-radius:50%;"></span>
                <span style="font-size:12px;">停留点</span>
              </div>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
              <button class="el-button el-button--primary el-button--small" onclick="ElMessage.info('模拟播放轨迹')">▶ 播放轨迹</button>
              <button class="el-button el-button--default el-button--small" onclick="ElMessage.info('模拟查看停留点')">⏸ 查看停留点</button>
              <button class="el-button el-button--danger el-button--small" onclick="ElMessage.info('模拟查看越界点')">⚠ 查看越界点</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ========== 安全考评积分服务 ========== */
  renderSafetyPage: function(menuKey) {
    switch(menuKey) {
      case 'safety-rule': return this.renderSafetyRule();
      case 'safety-calculate': return this.renderSafetyCalculate();
      case 'safety-score': return this.renderSafetyScore();
      default: return '';
    }
  },

  renderSafetyRule: function() {
    const rules = MOCK.generateScoreRules();
    return `
      <div class="page-container">
        <div class="filter-bar">
          <button class="el-button el-button--primary" onclick="app.addScoreRule()">新增规则</button>
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部类型</option><option>加分</option><option>扣分</option></select></div>
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部状态</option><option>启用</option><option>禁用</option></select></div>
          <button class="el-button el-button--primary" style="margin-left:auto;" onclick="app.genericSearch()">查询</button>
        </div>
        ${rules.map(r => `
          <div class="rule-card">
            <div class="rule-card__header">
              <span class="rule-card__title">${r.name}</span>
              <div>
                <span class="status-tag ${r.status === 'enabled' ? 'status-tag--done' : 'status-tag--draft'}">${r.status === 'enabled' ? '启用' : '禁用'}</span>
                <button class="el-button el-button--primary el-button--small" style="margin-left:8px;" onclick="ElMessage.info('编辑规则: ${r.id}')">编辑</button>
                <button class="el-button el-button--danger el-button--small" onclick="ElMessage.success('规则已删除')">删除</button>
              </div>
            </div>
            <div class="rule-card__body">
              <div>规则类型：<span style="color:${r.type === '加分' ? '#52c41a' : '#f5222d'};font-weight:600;">${r.type}</span></div>
              <div>积分值：<span style="font-weight:600;color:${r.score >= 0 ? '#52c41a' : '#f5222d'};">${r.score > 0 ? '+' : ''}${r.score}分/${r.unit}</span></div>
              <div>规则描述：${r.description}</div>
              <div>规则ID：${r.id}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderSafetyCalculate: function() {
    const persons = MOCK.persons;
    return `
      <div class="page-container">
        <div class="filter-bar">
          <div class="el-select" style="width:200px;"><select class="el-input__inner"><option>2026年Q1</option><option>2026年Q2</option><option>2026年上半年</option></select></div>
          <button class="el-button el-button--primary" onclick="app.startCalculate()">开始计算</button>
          <button class="el-button el-button--success" style="margin-left:auto;" onclick="app.genericExport()">导出结果</button>
        </div>
        <div class="table-container">
          <table class="el-table" style="width:100%">
            <thead><tr><th>人员</th><th>部门</th><th>基础分</th><th>加分项</th><th>扣分项</th><th>最终积分</th><th>评级</th><th>操作</th></tr></thead>
            <tbody>
            ${persons.slice(0, 8).map(p => {
              const base = 80;
              const add = Math.floor(Math.random() * 30);
              const deduct = Math.floor(Math.random() * 40);
              const total = Math.max(0, Math.min(100, base + add - deduct));
              const rating = total >= 90 ? '优秀' : (total >= 70 ? '良好' : (total >= 50 ? '合格' : '不合格'));
              return `
                <tr>
                  <td>${p.name}</td><td>${p.dept}</td><td>${base}</td>
                  <td style="color:#52c41a;">+${add}</td>
                  <td style="color:#f5222d;">-${deduct}</td>
                  <td style="font-weight:600;color:${total >= 70 ? '#52c41a' : (total >= 50 ? '#faad14' : '#f5222d')};">${total}</td>
                  <td><span class="status-tag ${rating === '优秀' ? 'status-tag--done' : (rating === '不合格' ? 'status-tag--rejected' : 'status-tag--pending')}">${rating}</span></td>
                  <td><button class="el-button el-button--primary el-button--small" onclick="ElMessage.info('积分明细: ${p.name}')">查看明细</button></td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSafetyScore: function() {
    const persons = MOCK.persons;
    return `
      <div class="page-container">
        <div class="stat-cards">
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--green">⭐</div><div class="stat-card__info"><div class="stat-card__label">平均积分</div><div class="stat-card__value">78.5</div></div></div>
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--blue">🏆</div><div class="stat-card__info"><div class="stat-card__label">优秀人员</div><div class="stat-card__value">${persons.filter(p=>p.score>=90).length}</div></div></div>
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--orange">⚠️</div><div class="stat-card__info"><div class="stat-card__label">低分预警</div><div class="stat-card__value">${persons.filter(p=>p.score<60).length}</div></div></div>
          <div class="stat-card"><div class="stat-card__icon stat-card__icon--red">🚫</div><div class="stat-card__info"><div class="stat-card__label">冻结人员</div><div class="stat-card__value">${persons.filter(p=>p.score<50).length}</div></div></div>
        </div>
        <div class="filter-bar">
          <div class="el-input" style="width:200px;"><input class="el-input__inner" placeholder="人员姓名" /></div>
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部部门</option><option>生产部</option><option>安全部</option></select></div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
        </div>
        <div class="table-container">
          <table class="el-table" style="width:100%">
            <thead><tr><th>人员</th><th>部门</th><th>积分</th><th>积分进度</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
            ${persons.map(p => {
              const status = p.score >= 80 ? '优秀' : (p.score >= 60 ? '合格' : (p.score >= 50 ? '预警' : '冻结'));
              const frozen = p.score < 50;
              return `
                <tr style="${frozen ? 'background:#fff1f0;' : ''}">
                  <td>${p.name}${frozen ? ' <span class="status-tag status-tag--rejected">冻结</span>' : ''}</td>
                  <td>${p.dept}</td>
                  <td style="font-weight:600;color:${p.score >= 80 ? '#52c41a' : (p.score >= 60 ? '#faad14' : '#f5222d')};">${p.score}</td>
                  <td>
                    <div class="score-bar">
                      <div style="flex:1;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;">
                        <div style="height:100%;width:${p.score}%;background:${p.score >= 80 ? '#52c41a' : (p.score >= 60 ? '#faad14' : '#f5222d')};border-radius:4px;"></div>
                      </div>
                      <span style="font-size:12px;color:#909399;">${p.score}/100</span>
                    </div>
                  </td>
                  <td><span class="status-tag ${status === '优秀' ? 'status-tag--done' : (status === '冻结' ? 'status-tag--rejected' : 'status-tag--pending')}">${status}</span></td>
                  <td>
                    <button class="el-button el-button--primary el-button--small" onclick="ElMessage.info('积分明细: ${p.name}')">明细</button>
                    <button class="el-button el-button--default el-button--small" onclick="app.adjustScore('${p.id}')">调整</button>
                  </td>
                </tr>
              `;
            }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ========== 公共能力服务 ========== */
  renderCommonPage: function(menuKey) {
    switch(menuKey) {
      case 'common-file': return this.renderCommonFile();
      case 'common-message': return this.renderCommonMessage();
      case 'common-log': return this.renderCommonLog();
      default: return '';
    }
  },

  renderCommonFile: function() {
    const files = [
      { name: '安全操作手册2026.pdf', size: '15.2 MB', type: 'pdf', uploader: '管理员', time: '2026-05-20' },
      { name: '人员资质证书汇总.zip', size: '8.7 MB', type: 'zip', uploader: '王安全员', time: '2026-05-18' },
      { name: '培训签到表2026Q1.xlsx', size: '1.3 MB', type: 'excel', uploader: '李主管', time: '2026-05-15' },
      { name: '现场检查照片.jpg', size: '4.5 MB', type: 'image', uploader: '赵六', time: '2026-05-12' },
      { name: '应急预案文档.docx', size: '2.1 MB', type: 'word', uploader: '张经理', time: '2026-05-10' }
    ];
    const iconMap = { pdf: '📕', zip: '📦', excel: '📊', image: '🖼️', word: '📝' };
    return `
      <div class="page-container">
        <div class="filter-bar">
          <button class="el-button el-button--primary" onclick="app.uploadFile()">上传文件</button>
          <div class="el-input" style="width:200px;"><input class="el-input__inner" placeholder="文件名称" /></div>
          <button class="el-button el-button--primary" style="margin-left:auto;" onclick="app.genericSearch()">查询</button>
        </div>
        <div class="file-grid">
          ${files.map(f => `
            <div class="file-card">
              <div class="file-card__icon">${iconMap[f.type] || '📄'}</div>
              <div class="file-card__name">${f.name}</div>
              <div class="file-card__size">${f.size}</div>
              <div style="font-size:12px;color:#999;margin-top:2px;">${f.uploader} · ${f.time}</div>
              <div style="margin-top:8px;display:flex;gap:4px;justify-content:center;">
                <button class="el-button el-button--primary el-button--small" onclick="app.downloadFile('${f.name}')">下载</button>
                <button class="el-button el-button--danger el-button--small" onclick="ElMessage.success('文件已删除')">删除</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderCommonMessage: function() {
    const messages = [
      { id: 'M001', title: '系统通知：安全培训即将开始', type: '系统通知', sender: '系统', time: '2026-05-29 09:00', status: '未读' },
      { id: 'M002', title: '王五的准入办证申请已通过', type: '流程通知', sender: '工作流引擎', time: '2026-05-28 16:30', status: '已读' },
      { id: 'M003', title: '资质到期提醒：张三的安全操作证', type: '预警通知', sender: '预警系统', time: '2026-05-28 08:00', status: '未读' },
      { id: 'M004', title: '积分低分预警：吴十安全积分仅剩60', type: '预警通知', sender: '考评系统', time: '2026-05-27 14:20', status: '已读' },
      { id: 'M005', title: '电子围栏告警：高压配电区有人越界', type: '告警通知', sender: '围栏系统', time: '2026-05-27 10:05', status: '未读' }
    ];
    return `
      <div class="page-container">
        <div class="filter-bar">
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部类型</option><option>系统通知</option><option>流程通知</option><option>预警通知</option><option>告警通知</option></select></div>
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部状态</option><option>未读</option><option>已读</option></select></div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" style="margin-left:auto;" onclick="app.markAllRead()">全部标记已读</button>
        </div>
        <div class="table-container">
          <table class="el-table" style="width:100%">
            <thead><tr><th>消息编号</th><th>标题</th><th>类型</th><th>发送方</th><th>时间</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
            ${messages.map(m => `
              <tr style="${m.status === '未读' ? 'font-weight:600;' : ''}">
                <td>${m.id}</td><td>${m.title}</td><td>${m.type}</td><td>${m.sender}</td><td>${m.time}</td>
                <td><span class="status-tag ${m.status === '未读' ? 'status-tag--pending' : 'status-tag--draft'}">${m.status}</span></td>
                <td><button class="el-button el-button--primary el-button--small" onclick="ElMessage.info('模拟查看详情')">查看</button></td>
              </tr>
            `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderCommonLog: function() {
    const logs = MOCK.generateLogs();
    return `
      <div class="page-container">
        <div class="filter-bar">
          <div class="el-input" style="width:200px;"><input class="el-input__inner" placeholder="操作人" /></div>
          <div class="el-select" style="width:160px;"><select class="el-input__inner"><option value="">全部模块</option><option>工作流模块</option><option>组织权限</option><option>人员主数据</option></select></div>
          <div class="el-input" style="width:280px;"><input class="el-input__inner" type="date" /></div>
          <button class="el-button el-button--primary" onclick="app.genericSearch()">查询</button>
          <button class="el-button el-button--default" style="margin-left:auto;" onclick="app.genericExport()">导出日志</button>
        </div>
        <div class="table-container log-table">
          <table class="el-table" style="width:100%">
            <thead><tr><th>日志ID</th><th>操作人</th><th>模块</th><th>操作</th><th>目标</th><th>IP地址</th><th>时间</th><th>操作</th></tr></thead>
            <tbody>
            ${logs.slice(0, 15).map(l => `
              <tr>
                <td>${l.id}</td><td>${l.operator}</td><td>${l.module}</td><td>${l.action}</td><td>${l.target}</td><td>${l.ip}</td>
                <td>${l.time}</td>
                <td><button class="el-button el-button--primary el-button--small" onclick="ElMessage.info('模拟查看详情')">详情</button></td>
              </tr>
            `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

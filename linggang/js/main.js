/* ============================================================
 * 主应用逻辑 - Vue 3 应用入口 & 全局事件处理
 * ============================================================ */

const { createApp, ref, reactive, computed, watch, nextTick, onMounted } = Vue;

// 安全获取 ElementPlus 服务（兼容不同 CDN 构建版本）
const EP = ElementPlus || {};
const ElMessage = EP.ElMessage || window.ElMessage || {};
const ElMessageBox = EP.ElMessageBox || window.ElMessageBox || {};
const ElNotification = EP.ElNotification || window.ElNotification || {};
const ElLoading = EP.ElLoading || window.ElLoading || {};

// 确保核心方法存在（提供降级降级）
if (!ElMessage.success) ElMessage.success = (msg) => alert('✅ ' + msg);
if (!ElMessage.error) ElMessage.error = (msg) => alert('❌ ' + msg);
if (!ElMessage.warning) ElMessage.warning = (msg) => alert('⚠ ' + msg);
if (!ElMessage.info) ElMessage.info = (msg) => alert('ℹ ' + msg);
if (!ElMessageBox.confirm) ElMessageBox.confirm = (msg, title, opts) => {
  return Promise.resolve(confirm(msg)).then(r => r ? Promise.resolve() : Promise.reject());
};
if (!ElMessageBox.prompt) ElMessageBox.prompt = (msg, title, opts) => {
  const val = prompt(msg);
  return val ? Promise.resolve({ value: val }) : Promise.reject();
};
if (!ElNotification) {
  ElNotification = function(opts) { alert(opts.title + ': ' + opts.message); };
}
if (!ElLoading.service) {
  ElLoading.service = () => ({ close: () => {} });
}

const vueApp = createApp({
  setup() {
    // --- 响应式状态 ---
    const activeMenu = ref('');
    const sidebarCollapsed = ref(false);
    const breadcrumb = ref([]);
    const openedTabs = ref([]);
    const maskDialogVisible = ref(false);
    const currentSensitiveData = ref(null);

    // 当前任务编辑器状态
    const currentEditorTask = ref({ taskId: '', module: '' });
    const currentFlowRecords = ref([]);

    // --- 菜单选中处理 ---
    const handleMenuSelect = (index) => {
      switchToMenu(index);
    };

    // --- 选项卡切换 ---
    const switchToMenu = (menuKey) => {
      activeMenu.value = menuKey;

      // 切菜单时清除人员详情视图状态
      window._personnelDetailState = null;

      const menuInfo = PWD_CONFIG.menuMap[menuKey];
      if (!menuInfo) return;

      // 更新面包屑
      breadcrumb.value = menuInfo.breadcrumb || [menuInfo.title];

      // 更新标签页
      const existTab = openedTabs.value.find(t => t.path === menuKey);
      if (existTab) {
        // 已存在，激活即可
      } else {
        openedTabs.value.push({ path: menuKey, title: menuInfo.title });
        // 限制最多10个标签页
        if (openedTabs.value.length > 10) {
          openedTabs.value.shift();
        }
      }

      // 渲染页面
      PageRenderer.render(menuKey);

      // 滚动到顶部
      const content = document.querySelector('.pwd-content');
      if (content) content.scrollTop = 0;
    };

    // --- 选项卡切换 ---
    const switchTab = (tab) => {
      switchToMenu(tab.path);
    };

    const closeTab = (tab, index) => {
      openedTabs.value.splice(index, 1);
      // 清除详情视图状态
      window._personnelDetailState = null;
      if (activeMenu.value === tab.path) {
        if (openedTabs.value.length > 0) {
          const lastTab = openedTabs.value[Math.min(index, openedTabs.value.length - 1)];
          switchToMenu(lastTab.path);
        } else {
          activeMenu.value = '';
          breadcrumb.value = [];
          document.getElementById('pageContainer').innerHTML = PageRenderer.renderHomePage();
        }
      }
    };

    const closeAllTabs = () => {
      openedTabs.value = [];
      activeMenu.value = '';
      breadcrumb.value = [];
      document.getElementById('pageContainer').innerHTML = PageRenderer.renderHomePage();
    };

    const closeOtherTabs = () => {
      const currentTab = openedTabs.value.find(t => t.path === activeMenu.value);
      openedTabs.value = currentTab ? [currentTab] : [];
    };

    // --- 退出登录 ---
    const handleLogout = () => {
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('已安全退出');
        // 模拟退出后刷新到首页
        openedTabs.value = [];
        activeMenu.value = '';
        breadcrumb.value = [];
        document.getElementById('pageContainer').innerHTML = PageRenderer.renderHomePage();
      }).catch(() => {});
    };

    // --- 敏感信息查看 ---
    const viewSensitive = (type, value, personId) => {
      currentSensitiveData.value = { type, value, personId };
      maskDialogVisible.value = true;
    };

    const confirmViewSensitive = () => {
      maskDialogVisible.value = false;
      const d = currentSensitiveData.value;
      if (d) {
        ElMessage.success(`已查看${d.type === 'phone' ? '手机号' : '身份证号'}（操作已记录至审计日志）`);
        // 模拟日志记录
        console.log(`[AUDIT] 用户查看了人员${d.personId}的${d.type}: ${d.value}`);
        // 模拟显示完整信息
        ElNotification({
          title: '敏感信息',
          message: `完整信息：${d.value}`,
          type: 'warning',
          duration: 3000
        });
      }
    };

    // --- 工作流任务编辑器 ---
    const openTaskEditor = (taskId, module) => {
      currentEditorTask.value = { taskId, module };

      // 检测是否有预设子类型（新建流程时传入）
      let subType = undefined;
      if (module === 'a' || module === 'b' || module === 'c' || module === 'd') {
        if (window._newFlowTask && window._newFlowTask.taskId === taskId) {
          subType = window._newFlowTask.subType;
          window._newFlowTask = null; // 消费后清除
        } else {
          // 从已生成的任务中尝试获取子类型
          const allTasks = MOCK.generateTasks(module, 'pending');
          const thisTask = allTasks.find(t => t.id === taskId);
          subType = thisTask?.subType;
        }
      }

      // 生成流转记录，通过全局变量传递给 renderTaskEditor
      const records = MOCK.generateFlowRecords(module, subType);
      window._currentFlowRecords = records;
      window._currentSubType = subType;
      currentFlowRecords.value = records;

      // 渲染编辑器页面
      document.getElementById('pageContainer').innerHTML = PageRenderer.renderTaskEditor(taskId, module);

      // 更新标签页
      const editorMenuKey = 'workflow-editor-' + taskId;
      const existTab = openedTabs.value.find(t => t.path === editorMenuKey);
      if (!existTab) {
        openedTabs.value.push({ path: editorMenuKey, title: '任务编辑: ' + taskId });
      }
      activeMenu.value = editorMenuKey;

      // 滚动到顶部
      const content = document.querySelector('.pwd-content');
      if (content) content.scrollTop = 0;

      // 如果有子类型，延迟切换流程图和表单
      if (subType) {
        setTimeout(() => {
          const selAB = document.getElementById('flowSubType');
          const selC = document.getElementById('flowCType');
          const selD = document.getElementById('flowDType');
          if (selAB) {
            selAB.value = subType;
            const moduleInfo = currentEditorTask.value.module || module;
            const changeFn = moduleInfo === 'b' ? onVisitorSubTypeChange : onFlowSubTypeChange;
            if (typeof changeFn === 'function') changeFn();
          } else if (selC) {
            selC.value = subType;
            if (typeof onCSubTypeChange === 'function') onCSubTypeChange();
          } else if (selD) {
            selD.value = subType;
            if (typeof onDSubTypeChange === 'function') onDSubTypeChange();
          }
        }, 100);
      }
    };

    const closeTaskEditor = () => {
      // 返回到上一个工作流列表页
      const listMenu = activeMenu.value.startsWith('workflow-') && !activeMenu.value.startsWith('workflow-editor');
      if (currentEditorTask.value.module) {
        // 默认返回待办任务
        const backMenu = 'workflow-pending-' + currentEditorTask.value.module;
        switchToMenu(backMenu);
      }
    };

    // --- 编辑器Tabs切换 ---
    const switchEditorTab = (event, tabName) => {
      // 更新标签样式
      const tabs = event.target.parentElement.querySelectorAll('.el-tabs__item');
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.style.color = '#606266';
        t.style.borderBottom = 'none';
      });
      event.target.classList.add('is-active');
      event.target.style.color = 'var(--pwd-primary)';
      event.target.style.borderBottom = '2px solid var(--pwd-primary)';

      // 切换内容
      const formDiv = document.getElementById('editorTabForm');
      const flowDiv = document.getElementById('editorTabFlow');
      const recordDiv = document.getElementById('editorTabRecord');
      if (formDiv) formDiv.style.display = tabName === 'form' ? '' : 'none';
      if (flowDiv) flowDiv.style.display = tabName === 'flow' ? '' : 'none';
      if (recordDiv) recordDiv.style.display = tabName === 'record' ? '' : 'none';
    };

    // --- 工作流操作 ---
    const workflowNext = (taskId) => {
      ElMessageBox.confirm('确认提交至下一节点？', '流程操作', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'info'
      }).then(() => {
        const loading = ElLoading.service({ text: '正在提交...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.success('任务已提交至下一节点，流程继续流转');
          // 模拟操作日志
          console.log(`[AUDIT] 用户对任务${taskId}执行了[下一步]操作`);
        }, 800); // 模拟≤1s响应
      }).catch(() => {});
    };

    const workflowCC = (taskId) => {
      ElMessageBox.prompt('请输入抄送对象', '抄送', {
        confirmButtonText: '确定', cancelButtonText: '取消',
        inputPlaceholder: '请输入人员姓名或工号'
      }).then(({ value }) => {
        if (value) {
          ElMessage.success(`已抄送至：${value}（操作已记录）`);
          console.log(`[AUDIT] 用户对任务${taskId}抄送至${value}`);
        }
      }).catch(() => {});
    };

    const workflowReject = (taskId) => {
      ElMessageBox.prompt('请输入驳回理由', '驳回', {
        confirmButtonText: '确定', cancelButtonText: '取消',
        inputType: 'textarea', inputPlaceholder: '请填写驳回原因...'
      }).then(({ value }) => {
        const loading = ElLoading.service({ text: '处理中...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.warning('任务已驳回：' + (value || '无理由'));
          console.log(`[AUDIT] 用户对任务${taskId}执行了[驳回]操作，理由：${value}`);
        }, 600);
      }).catch(() => {});
    };

    const workflowTerminate = (taskId) => {
      ElMessageBox.confirm('终止后不可恢复，确定要终止该任务吗？', '终止确认', {
        confirmButtonText: '确定终止', cancelButtonText: '取消',
        type: 'error', confirmButtonClass: 'el-button--danger'
      }).then(() => {
        ElMessage.error('任务已终止');
        console.log(`[AUDIT] 用户对任务${taskId}执行了[终止]操作`);
        closeTaskEditor();
      }).catch(() => {});
    };

    const saveDraft = (taskId) => {
      const loading = ElLoading.service({ text: '保存中...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        ElMessage.success('草稿已保存');
        console.log(`[AUDIT] 用户对任务${taskId}保存了草稿`);
      }, 500);
    };

    const cancelTask = (taskId) => {
      ElMessageBox.confirm('确定要撤销该任务吗？', '撤销确认', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        ElMessage.success('任务已撤销');
        console.log(`[AUDIT] 用户撤销了任务${taskId}`);
      }).catch(() => {});
    };

    // --- 准入办证子类型切换 ---
    const onFlowSubTypeChange = () => {
      const sel = document.getElementById('flowSubType');
      if (!sel) return;
      const subType = sel.value;
      // 更新描述
      const subTypes = PWD_CONFIG.flowSubTypes.a || [];
      const st = subTypes.find(s => s.value === subType);
      const descEl = document.getElementById('flowSubTypeDesc');
      if (descEl && st) descEl.textContent = st.desc;

      // 切换表单区域显示
      ['formQual', 'formLong', 'formTemp', 'formLoss'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = id === 'form' + subType.charAt(0).toUpperCase() + subType.slice(1) ? '' : 'none';
        }
      });

      // 更新流程图节点
      if (st) {
        const nodeKey = st.nodeKey || 'a';
        const nodes = PWD_CONFIG.flowNodes[nodeKey] || PWD_CONFIG.flowNodes.a;
        // 重新生成流转记录
        const module = 'a';
        const records = MOCK.generateFlowRecords(module, subType);
        currentFlowRecords.value = records;
        // 重绘流程图
        WorkflowEngine.renderFlowDiagram(module, records, 'flowDiagramContainer', subType);
        WorkflowEngine.renderFlowTimeline(records, 'flowTimelineContainer');
      }

      ElMessage.info('已切换至「' + (st?.label || subType) + '」流程');
    };

    // --- 访客管理子类型切换 ---
    const onVisitorSubTypeChange = () => {
      const sel = document.getElementById('flowSubType');
      if (!sel) return;
      const subType = sel.value;
      // 更新描述
      const subTypes = PWD_CONFIG.flowSubTypes.b || [];
      const st = subTypes.find(s => s.value === subType);
      const descEl = document.getElementById('flowSubTypeDesc');
      if (descEl && st) descEl.textContent = st.desc;

      // 切换表单区域显示
      const formMap = {
        visitor: 'formVisitor',
        construction: 'formConstruction',
        vehicle: 'formVehicle',
        revocation: 'formRevocation'
      };
      Object.values(formMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      const targetId = formMap[subType];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.style.display = '';
      }

      // 更新流程图节点
      if (st) {
        const nodeKey = st.nodeKey || 'b';
        const records = MOCK.generateFlowRecords('b', subType);
        // 重绘流程图
        WorkflowEngine.renderFlowDiagram('b', records, 'flowDiagramContainer', subType);
        WorkflowEngine.renderFlowTimeline(records, 'flowTimelineContainer');
      }

      ElMessage.info('已切换至「' + (st?.label || subType) + '」申请');
    };

    // --- 安全考评子类型切换 ---
    const onDSubTypeChange = () => {
      const sel = document.getElementById('flowDType');
      if (!sel) return;
      const subType = sel.value;
      const dTypes = PWD_CONFIG.flowDSubTypes || {};
      const dt = dTypes[subType];
      const descEl = document.getElementById('flowDTypeDesc');
      if (descEl && dt) descEl.textContent = dt.desc;

      // 切换表单区域显示
      const formMap = { assessment: 'dFormAssessment', adjustment: 'dFormAdjustment', appeal: 'dFormAppeal' };
      Object.values(formMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      const targetId = formMap[subType];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.style.display = '';
      }

      // 更新流程图节点
      if (dt) {
        const records = MOCK.generateFlowRecords('d', subType);
        WorkflowEngine.renderFlowDiagram('d', records, 'flowDiagramContainer', subType);
        WorkflowEngine.renderFlowTimeline(records, 'flowTimelineContainer');
      }

      ElMessage.info('已切换至「' + (dt?.label || subType) + '」流程');
    };

    // 安全考评专项操作函数
    const executeAutoScoreCalc = () => {
      const loading = ElLoading.service({ text: '正在执行自动积分计算...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        ElMessage.success('✅ 自动积分计算完成！共计算 286 人\n培训完成率统计 | 违规扣分汇总 | 工单闭环率核算 | 基础积分已回填');
        console.log('[SCORE] 自动积分计算执行完成');
      }, 1500);
    };

    const previewThresholdLinkage = () => {
      const loading = ElLoading.service({ text: '正在计算阈值联动触达情况...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        ElMessageBox.alert(`
          <div style="font-size:13px;line-height:1.8;">
            <p><strong>⚡ 阈值联动触达预览</strong></p>
            <div style="margin-top:8px;padding:8px 12px;background:#fffbe6;border-radius:4px;">
              ⚠ 积分 &lt; 60 预警：<strong>3</strong> 人（将发送预警通知）
            </div>
            <div style="margin-top:4px;padding:8px 12px;background:#fff1f0;border-radius:4px;">
              ⛔ 积分 &lt; 50 冻结证件：<strong>1</strong> 人（系统将自动冻结）
            </div>
            <div style="margin-top:4px;padding:8px 12px;background:#f5222d10;border-radius:4px;">
              🚫 积分 &lt; 30 黑名单/回收权限：<strong>0</strong> 人
            </div>
            <p style="margin-top:12px;color:#909399;font-size:12px;">审批通过后系统将自动执行以上联动操作</p>
          </div>
        `, '阈值联动预览', { confirmButtonText: '知道了', dangerouslyUseHTMLString: true });
        console.log('[SCORE] 阈值联动预览已展示');
      }, 800);
    };

    const batchUpdateAccounts = () => {
      ElMessageBox.confirm('确认批量更新全部参评人员的积分账户？\n系统将：\n① 生成积分流水记录\n② 更新 security_account 账户总分\n③ 触发阈值联动检查', '批量更新确认', {
        confirmButtonText: '确认更新', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        const loading = ElLoading.service({ text: '正在批量更新积分账户...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.success('✅ 积分账户批量更新完成！\n共更新 286 个账户 | 生成 572 条积分流水 | 联动触发 4 条');
          console.log('[SCORE] 批量更新积分账户完成');
        }, 2000);
      }).catch(() => {});
    };

    const previewAdjustedScore = () => {
      ElMessageBox.alert(`
        <div style="font-size:13px;line-height:1.8;">
          <p><strong>📐 调整后积分预览</strong></p>
          <div style="margin-top:8px;">
            <div>当前积分：<strong>85</strong> 分</div>
            <div style="color:#52c41a;">调整分值：<strong>+10</strong> 分</div>
            <div style="font-size:16px;margin-top:8px;padding:8px;background:#f6ffed;border-radius:4px;">
              调整后积分：<strong style="color:#1890ff;font-size:20px;">95</strong> 分
            </div>
            <div style="margin-top:4px;color:#909399;font-size:12px;">评级变化：良好 → <strong style="color:#52c41a;">优秀</strong></div>
          </div>
        </div>
      `, '调整后积分预览', { confirmButtonText: '确认无误', dangerouslyUseHTMLString: true });
      console.log('[SCORE] 调分预览已展示');
    };

    const viewOriginalRecord = () => {
      ElMessage.info('模拟打开「原始安全记录」详情页，可查看关联的违规记录、安全工单等完整数据');
      console.log('[SCORE] 查看原始安全记录');
    };

    // --- 离场准出子类型切换 ---
    const onCSubTypeChange = () => {
      const sel = document.getElementById('flowCType');
      if (!sel) return;
      const subType = sel.value;
      // 更新描述
      const cTypes = PWD_CONFIG.flowCSubTypes || {};
      const ct = cTypes[subType];
      const descEl = document.getElementById('flowCTypeDesc');
      if (descEl && ct) descEl.textContent = ct.desc;

      // 切换表单区域显示
      const formMap = { resign: 'cFormResign', expel: 'cFormExpel' };
      Object.values(formMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      const targetId = formMap[subType];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.style.display = '';
      }

      // 更新流程图节点
      if (ct) {
        const nodeKey = ct.nodeKey || 'c';
        const records = MOCK.generateFlowRecords('c', subType);
        WorkflowEngine.renderFlowDiagram('c', records, 'flowDiagramContainer', subType);
        WorkflowEngine.renderFlowTimeline(records, 'flowTimelineContainer');
      }

      ElMessage.info('已切换至「' + (ct?.label || subType) + '」流程');
    };

    // --- 准入办证启动流程（选择流程类型弹窗） ---
    const openFlowStarter = (module = 'a') => {
      let subTypes;
      if (module === 'c') {
        const cTypes = PWD_CONFIG.flowCSubTypes || {};
        subTypes = Object.keys(cTypes).map(k => ({
          value: k,
          label: cTypes[k].label,
          nodeKey: cTypes[k].nodeKey,
          desc: cTypes[k].desc
        }));
      } else if (module === 'd') {
        const dTypes = PWD_CONFIG.flowDSubTypes || {};
        subTypes = Object.keys(dTypes).map(k => ({
          value: k,
          label: dTypes[k].label,
          nodeKey: dTypes[k].nodeKey,
          desc: dTypes[k].desc
        }));
      } else {
        subTypes = PWD_CONFIG.flowSubTypes[module] || [];
      }
      if (subTypes.length === 0) { ElMessage.warning('该模块暂无可用流程类型'); return; }

      const person = MOCK.persons[Math.floor(Math.random() * MOCK.persons.length)];
      const moduleTitle = module === 'a' ? '准入办证' : (module === 'b' ? '访客管理' : (module === 'c' ? '离场准出' : ''));

      const modalId = 'flowStarterModal';
      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      // 子类型图标/颜色配置
      const subTypeThemes = {
        a: { icons: ['🎫', '🪪', '⏱️', '🔁'], colors: ['#e6f7ff', '#f6ffed', '#fff7e6', '#fff0f6'], borderColors: ['#91d5ff', '#b7eb8f', '#ffd591', '#ffadd2'], textColors: ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96'] },
        b: { icons: ['🚶', '🔧', '🚗', '❌'], colors: ['#e6f7ff', '#f6ffed', '#fff7e6', '#fff0f6'], borderColors: ['#91d5ff', '#b7eb8f', '#ffd591', '#ffadd2'], textColors: ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96'] },
        c: { icons: ['🚪', '⚠️'], colors: ['#e6f7ff', '#fff1f0'], borderColors: ['#91d5ff', '#ffa39e'], textColors: ['#1890ff', '#f5222d'] },
        d: { icons: ['📊', '✏️', '📝'], colors: ['#e6f7ff', '#f6ffed', '#fff7e6'], borderColors: ['#91d5ff', '#b7eb8f', '#ffd591'], textColors: ['#1890ff', '#52c41a', '#fa8c16'] }
      };
      const theme = subTypeThemes[module] || subTypeThemes.a;

      const modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:560px;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:18px;font-weight:600;">🚀 启动${moduleTitle}流程</span>
            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#999;line-height:1;">&times;</button>
          </div>
          <div style="padding:24px;">
            <div style="font-size:14px;color:#555;margin-bottom:16px;">请选择需要发起的流程类型：</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              ${subTypes.map((st, idx) => {
                const i = idx % theme.icons.length;
                return `
                  <div onclick="app.startFlowByType('${st.value}', '${module}')"
                    style="display:flex;align-items:center;gap:12px;padding:16px;background:${theme.colors[i]};border:2px solid ${theme.borderColors[i]};border-radius:10px;cursor:pointer;transition:all 0.2s;"
                    onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.boxShadow='none';this.style.transform='none'">
                    <div style="font-size:32px;width:48px;text-align:center;">${theme.icons[i]}</div>
                    <div>
                      <div style="font-weight:600;font-size:15px;color:#303133;">${st.label}</div>
                      <div style="font-size:12px;color:#909399;margin-top:2px;">${st.desc}</div>
                      <div style="font-size:12px;color:${theme.textColors[i]};margin-top:4px;font-weight:500;">${idx === 0 ? (module === 'c' ? '7级流程' : (module === 'a' ? '4级流程' : (module === 'd' ? '7级流程' : '2级审批'))) : (idx === 1 ? (module === 'c' ? '5级流程' : (module === 'a' ? '3级流程' : (module === 'd' ? '5级流程' : '3级审批'))) : (idx === 2 ? (module === 'd' ? '5级流程' : '2级审批') : '2级审批'))}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;">
            <button class="el-button el-button--default" onclick="document.getElementById('${modalId}').remove()">取消</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    };

    // --- 根据选择的流程类型启动流程（创建草稿并打开编辑器） ---
    const startFlowByType = (subType, module = 'a') => {
      // 关闭选择弹窗
      const modal = document.getElementById('flowStarterModal');
      if (modal) modal.remove();

      let st;
      if (module === 'c') {
        const cTypes = PWD_CONFIG.flowCSubTypes || {};
        st = cTypes[subType];
        if (!st) { ElMessage.error('流程类型无效'); return; }
      } else if (module === 'd') {
        const dTypes = PWD_CONFIG.flowDSubTypes || {};
        st = dTypes[subType];
        if (!st) { ElMessage.error('流程类型无效'); return; }
      } else {
        const subTypeKey = module === 'a' ? 'a' : (module === 'b' ? 'b' : 'a');
        const subTypes = PWD_CONFIG.flowSubTypes[subTypeKey] || [];
        st = subTypes.find(s => s.value === subType);
        if (!st) { ElMessage.error('流程类型无效'); return; }
      }

      // 生成新任务ID
      const prefix = module.toUpperCase();
      const newId = 'WF-' + prefix + '-' + String(Date.now()).slice(-6);

      // 模拟新建草稿任务
      ElMessage.success('已创建「' + st.label + '」草稿单据：' + newId);

      // 保存新任务信息到内存，供编辑器使用
      window._newFlowTask = { taskId: newId, module: module, subType: subType };

      // 打开任务编辑器
      openTaskEditor(newId, module);
    };

    // --- 筛选与导出 ---
    const filterWorkflowTable = (tableId, module) => {
      // 模拟筛选
      ElMessage.success('筛选完成，共匹配到 ' + Math.floor(Math.random() * 15 + 3) + ' 条记录');
      console.log('[FILTER] 工作流任务筛选', {
        taskId: window._wfFilterTaskId || '',
        name: window._wfFilterName || '',
        status: window._wfFilterStatus || '',
        start: window._wfFilterStart || '',
        end: window._wfFilterEnd || ''
      });
    };

    const resetWorkflowFilter = (tableId, module) => {
      window._wfFilterTaskId = '';
      window._wfFilterName = '';
      window._wfFilterStatus = '';
      window._wfFilterStart = '';
      window._wfFilterEnd = '';
      // 重新渲染页面
      const menuKey = activeMenu.value;
      if (menuKey) PageRenderer.render(menuKey);
      ElMessage.info('筛选条件已重置');
    };

    const exportTable = (tableId) => {
      const loading = ElLoading.service({ text: '正在导出...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        ElMessage.success('导出成功！文件已生成（模拟）');
        console.log('[EXPORT] 导出表格数据');
      }, 1500);
    };

    // --- 流程图缩放 ---
    let diagramZoom = 1;
    const zoomDiagram = (delta) => {
      diagramZoom = Math.max(0.5, Math.min(2, diagramZoom + delta * 0.2));
      const container = document.getElementById('flowDiagramContainer');
      if (container) {
        container.style.transform = `scale(${diagramZoom})`;
        container.style.transformOrigin = 'center center';
        container.style.transition = 'transform 0.3s ease';
      }
    };
    const resetDiagramZoom = () => {
      diagramZoom = 1;
      const container = document.getElementById('flowDiagramContainer');
      if (container) {
        container.style.transform = 'scale(1)';
      }
    };

    // --- 文件上传模拟 ---
    const simulateFileUpload = () => {
      ElMessageBox.confirm('模拟文件上传（原型演示）', '上传文件', {
        confirmButtonText: '选择文件',
        cancelButtonText: '取消'
      }).then(() => {
        const loading = ElLoading.service({ text: '上传中...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.success('文件上传成功（模拟）');
          console.log('[FILE] 模拟文件上传完成');
        }, 1200);
      }).catch(() => {});
    };

    // --- 通用CRUD操作（供各模块按钮使用） ---
    const genericSearch = () => ElMessage.success('查询完成，共匹配结果');
    const genericExport = () => {
      const loading = ElLoading.service({ text: '正在导出...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => { loading.close(); ElMessage.success('导出成功！（模拟）'); }, 1200);
    };
    const batchImport = () => {
      const loading = ElLoading.service({ text: '正在导入数据，请稍候...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => { loading.close(); ElMessage.success('批量导入成功！共导入 156 条记录（模拟）'); }, 2000);
    };

    // ========== 人员主数据操作 ==========

    // 详情视图状态
    window._personnelDetailState = null;

    const viewPersonnelDetail = (type, id) => {
      // type: 'archive' | 'qualification' | 'training' | 'safety'
      const menuKeyMap = {
        'archive': 'personnel-archive',
        'qualification': 'personnel-qualification',
        'training': 'personnel-training',
        'safety': 'personnel-safety'
      };
      const menuKey = menuKeyMap[type] || 'personnel-archive';
      window._personnelDetailState = { menuKey: menuKey, personId: id, itemId: id };
      PageRenderer.render(menuKey);
    };

    const closePersonnelDetail = (menuKey) => {
      window._personnelDetailState = null;
      if (menuKey) {
        switchToMenu(menuKey);
      } else {
        PageRenderer.render(activeMenu.value);
      }
    };

    const switchDetailTab = (event, module, tabId) => {
      // Update tab styles
      const parent = event.target.closest('.detail-tabs');
      if (parent) {
        parent.querySelectorAll('.detail-tab-item').forEach(t => {
          t.classList.remove('is-active');
        });
      }
      event.target.classList.add('is-active');

      // Show/hide tab content
      const prefix = module === 'archive' ? 'archiveTab' : (module === 'qualification' ? 'qualTab' : (module === 'training' ? 'trainTab' : 'safeTab'));
      // For archive, use the tabId directly
      if (module === 'archive') {
        ['tabBasic', 'tabOrg', 'tabContract', 'tabRelated', 'tabAttachment'].forEach(tid => {
          const el = document.getElementById('archive' + tid.charAt(0).toUpperCase() + tid.slice(1));
          if (el) el.style.display = tid === tabId ? '' : 'none';
        });
      } else {
        // Generic: hide all and show the selected one
        const contentDivs = document.querySelectorAll('.detail-tab-content');
        contentDivs.forEach(d => d.style.display = 'none');
        const target = document.getElementById(tabId);
        if (target) target.style.display = '';
      }
    };

    const addPersonnel = () => {
      const modalId = 'addPersonnelModal';
      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      const deptOptions = ['生产部', '安全部', '技术部', '行政部', '财务部', '质量部'];
      const positionOptions = ['操作工', '班组长', '安全员', '主管', '技术员', '工程师', '文员', '巡检员', '经理'];
      const statusOptions = ['在职', '试用期', '待入职', '离职'];
      const educationOptions = ['高中', '中专', '大专', '本科', '硕士', '博士'];
      const contractTypeOptions = ['固定期限', '无固定期限', '实习协议', '劳务派遣', '外包'];
      const rankOptions = ['初级', '中级', '高级', '资深', '专家'];
      const jobCategoryOptions = ['生产操作', '生产管理', '安全管理', '技术研发', '行政后勤', '质量管理'];
      const maritalOptions = ['已婚', '未婚', '离异'];

      const modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:8px;width:860px;max-height:90vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <div style="padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;font-weight:600;">➕ 新增人员档案</span>
            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
          </div>
          <div style="padding:20px 24px;">
            <!-- 基础信息 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">📋 基础信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">姓名 <span style="color:#f5222d;">*</span></label>
                <input id="apName" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入姓名" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">工号 <span style="color:#f5222d;">*</span></label>
                <input id="apId" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：P011" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">身份证号 <span style="color:#f5222d;">*</span></label>
                <input id="apIdCard" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="18 位身份证号码" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">手机号 <span style="color:#f5222d;">*</span></label>
                <input id="apPhone" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入手机号" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">邮箱</label>
                <input id="apEmail" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入邮箱" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">性别 <span style="color:#f5222d;">*</span></label>
                <select id="apGender" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">出生地</label>
                <input id="apBirthplace" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：江苏南京" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">民族</label>
                <input id="apNationality" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：汉族" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">婚姻状况</label>
                <select id="apMarital" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择</option>
                  ${maritalOptions.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- 组织信息 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">🏢 组织信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">所属部门 <span style="color:#f5222d;">*</span></label>
                <select id="apDept" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择部门</option>
                  ${deptOptions.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">岗位 <span style="color:#f5222d;">*</span></label>
                <select id="apPosition" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择岗位</option>
                  ${positionOptions.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">人员状态 <span style="color:#f5222d;">*</span></label>
                <select id="apStatus" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="在职">在职</option>
                  <option value="试用期">试用期</option>
                  <option value="待入职">待入职</option>
                  <option value="离职">离职</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">职级</label>
                <select id="apRank" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择</option>
                  ${rankOptions.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">职务头衔</label>
                <input id="apHeadship" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：班组长" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">岗位类别</label>
                <select id="apJobCategory" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择</option>
                  ${jobCategoryOptions.map(j => `<option value="${j}">${j}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">学历 <span style="color:#f5222d;">*</span></label>
                <select id="apEducation" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择</option>
                  ${educationOptions.map(e => `<option value="${e}">${e}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- 入职与合同 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">📅 入职与合同</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">入职日期 <span style="color:#f5222d;">*</span></label>
                <input id="apEntryDate" type="date" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">合同类型</label>
                <select id="apContractType" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择</option>
                  ${contractTypeOptions.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">合同到期日</label>
                <input id="apContractEnd" type="date" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">资格日期</label>
                <input id="apQualDate" type="date" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" />
              </div>
            </div>

            <!-- 紧急联系人 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">📞 紧急联系人</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:8px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">联系人姓名</label>
                <input id="apEmergencyContact" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入紧急联系人" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">联系人手机</label>
                <input id="apEmergencyPhone" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入紧急联系电话" />
              </div>
            </div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;">
            <button class="el-button el-button--default" onclick="document.getElementById('${modalId}').remove()">取消</button>
            <button class="el-button el-button--primary" onclick="window.app.submitAddPersonnel()">保存</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    };

    // 提交新增人员
    const submitAddPersonnel = () => {
      const name = document.getElementById('apName')?.value;
      if (!name) { ElMessage.warning('请输入姓名'); return; }
      const id = document.getElementById('apId')?.value;
      if (!id) { ElMessage.warning('请输入工号'); return; }
      const idCard = document.getElementById('apIdCard')?.value;
      if (!idCard) { ElMessage.warning('请输入身份证号'); return; }
      const phone = document.getElementById('apPhone')?.value;
      if (!phone) { ElMessage.warning('请输入手机号'); return; }
      const dept = document.getElementById('apDept')?.value;
      if (!dept) { ElMessage.warning('请选择所属部门'); return; }
      const position = document.getElementById('apPosition')?.value;
      if (!position) { ElMessage.warning('请选择岗位'); return; }
      const education = document.getElementById('apEducation')?.value;
      if (!education) { ElMessage.warning('请选择学历'); return; }
      const entryDate = document.getElementById('apEntryDate')?.value;
      if (!entryDate) { ElMessage.warning('请选择入职日期'); return; }

      const loading = ElLoading.service({ text: '正在保存人员档案...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        const modal = document.getElementById('addPersonnelModal');
        if (modal) modal.remove();
        ElMessage.success(`人员「${name}」档案创建成功！`);
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }, 1200);
    };

    const editPersonnel = (id) => ElMessage.info('模拟打开「编辑人员」表单弹窗 → 人员ID: ' + (id || 'P001'));

    const archivePerson = (id) => {
      ElMessageBox.confirm('确定要归档该人员档案吗？归档后该人员将进入历史库。', '归档确认', {
        confirmButtonText: '确定归档', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        ElMessage.success('人员档案已归档（模拟操作）');
        closePersonnelDetail('personnel-archive');
      }).catch(() => {});
    };

    const batchModifyPersonnel = () => {
      ElMessageBox.confirm('模拟批量修改：将选中人员的部门/岗位批量调整？', '批量修改', {
        confirmButtonText: '确定修改', cancelButtonText: '取消', type: 'info'
      }).then(() => {
        ElMessage.success('批量修改成功！共修改 5 条记录（模拟）');
      }).catch(() => {});
    };

    const refreshPage = () => {
      const key = activeMenu.value;
      if (key) PageRenderer.render(key);
      ElMessage.success('页面已刷新');
    };

    const remindExpiring = () => ElMessage.info('模拟打开「到期提醒设置」弹窗，可选择提醒周期（30天/15天/7天）和提醒对象');

    const printPersonnel = (id) => {
      ElMessage.success('正在生成打印预览（模拟）...');
      setTimeout(() => ElMessage.success('打印预览已生成，请使用浏览器打印功能'), 800);
    };

    const resetPersonnelFilter = (module) => {
      const prefixes = { archive: 'archive', qual: 'qual', train: 'train', safe: 'safe', assess: 'assess', qt: 'qt' };
      const prefix = prefixes[module] || 'archive';
      const inputs = document.querySelectorAll(`#${prefix}SearchName, #${prefix}SearchDept, #${prefix}SearchStatus, #${prefix}SearchType, #${prefix}SearchRisk`);
      inputs.forEach(inp => { if (inp) inp.value = ''; });
      const dateInputs = document.querySelectorAll(`#${prefix}DateStart, #${prefix}DateEnd`);
      dateInputs.forEach(inp => { if (inp) inp.value = ''; });
      ElMessage.info('筛选条件已重置');
      const key = activeMenu.value;
      if (key) PageRenderer.render(key);
    };

    const toggleAdvancedFilter = (module) => {
      const panel = document.getElementById('advancedFilter' + module.charAt(0).toUpperCase() + module.slice(1));
      if (panel) {
        panel.classList.toggle('is-visible');
      }
    };

    const toggleAllCheckbox = (el, module) => {
      const checkboxes = document.querySelectorAll(`.${module}-checkbox`);
      checkboxes.forEach(cb => cb.checked = el.checked);
    };

    const saveFilterCondition = (module) => {
      ElMessageBox.prompt('请为当前筛选条件命名', '保存常用筛选', {
        confirmButtonText: '保存', cancelButtonText: '取消',
        inputPlaceholder: '例如：生产部在职人员'
      }).then(({ value }) => {
        if (value) ElMessage.success('筛选条件「' + value + '」已保存（模拟）');
      }).catch(() => {});
    };

    // 资质管理
    const addQualification = () => {
      const persons = MOCK.persons;
      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

      const modalId = 'addQualModal';
      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      const modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:8px;width:820px;max-height:90vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <div style="padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;font-weight:600;">➕ 新增资质</span>
            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
          </div>
          <div style="padding:20px 24px;">
            <!-- 基本信息 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">📋 资质基本信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">资质名称 <span style="color:#f5222d;">*</span></label>
                <input id="qualName" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入资质名称" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">资质类型 <span style="color:#f5222d;">*</span></label>
                <select id="qualType" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择资质类型</option>
                  ${MOCK.qualTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">资质编号 <span style="color:#f5222d;">*</span></label>
                <input id="qualNo" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入证书编号" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">发证机构 <span style="color:#f5222d;">*</span></label>
                <select id="qualIssuingOrg" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择发证机构</option>
                  ${MOCK.issuingOrgs.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">发证日期 <span style="color:#f5222d;">*</span></label>
                <input id="qualIssueDate" type="date" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">有效期至 <span style="color:#f5222d;">*</span></label>
                <input id="qualExpireDate" type="date" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" />
              </div>
              <div style="grid-column:1/-1;">
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">备注</label>
                <textarea id="qualRemarks" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;resize:vertical;min-height:60px;" placeholder="请输入备注信息（选填）"></textarea>
              </div>
            </div>

            <!-- 附件上传 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">📎 资质附件</div>
            <div style="margin-bottom:16px;">
              <div style="border:2px dashed #d9d9d9;border-radius:6px;padding:20px;text-align:center;cursor:pointer;background:#fafafa;" onclick="document.getElementById('qualFileInput').click()">
                <span style="font-size:28px;display:block;margin-bottom:8px;">📤</span>
                <span style="font-size:13px;color:#909399;">点击上传附件（支持 jpg/pdf/png，最多 20MB）</span>
                <input id="qualFileInput" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" style="display:none;" onchange="document.getElementById('qualFileName').textContent = this.files.length + ' 个文件已选择'" />
              </div>
              <div id="qualFileName" style="margin-top:6px;font-size:12px;color:var(--pwd-text-secondary);"></div>
            </div>

            <!-- 人员选择 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
              <span>👤 持证人员选择 <span style="color:#f5222d;">*</span></span>
              <span style="font-size:12px;font-weight:400;color:#909399;">
                已选 <strong id="selectedQualPersonCount">0</strong> 人
              </span>
            </div>
            <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;">
              <input id="qualPersonSearchInput" style="flex:1;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="搜索人员姓名/部门..." oninput="filterQualPersonList()" />
              <button class="el-button el-button--default el-button--small" onclick="document.querySelectorAll('.qual-person-cb').forEach(cb=>cb.checked=true);updateQualPersonCount()">全选</button>
              <button class="el-button el-button--default el-button--small" onclick="document.querySelectorAll('.qual-person-cb').forEach(cb=>cb.checked=false);updateQualPersonCount()">清空</button>
            </div>
            <div style="border:1px solid #e8e8e8;border-radius:4px;max-height:220px;overflow-y:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr style="background:#fafafa;">
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:36px;"></th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">姓名</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">工号</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">部门</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">岗位</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">状态</th>
                  </tr>
                </thead>
                <tbody>
                ${persons.map((p, idx) => {
                  const avatarColor = colors[idx % colors.length];
                  return `
                    <tr>
                      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                        <input type="checkbox" class="qual-person-cb" data-id="${p.id}" data-name="${p.name}" data-dept="${p.dept}" onchange="updateQualPersonCount()" />
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
                        <span class="status-tag ${p.status === '在职' ? 'status-tag--done' : (p.status === '离职' ? 'status-tag--rejected' : 'status-tag--pending')}" style="font-size:11px;">${p.status}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;" id="selectedQualPersonTags"></div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;">
            <button class="el-button el-button--default" onclick="document.getElementById('${modalId}').remove()">取消</button>
            <button class="el-button el-button--primary" onclick="window.app.submitAddQualification()">保存</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // 人员搜索和计数函数
      window.filterQualPersonList = function() {
        const keyword = document.getElementById('qualPersonSearchInput')?.value?.toLowerCase() || '';
        document.querySelectorAll('.qual-person-cb').forEach(cb => {
          const row = cb.closest('tr');
          const name = cb.dataset.name?.toLowerCase() || '';
          const dept = cb.dataset.dept?.toLowerCase() || '';
          const match = !keyword || name.includes(keyword) || dept.includes(keyword);
          if (row) row.style.display = match ? '' : 'none';
        });
      };
      window.updateQualPersonCount = function() {
        const checked = document.querySelectorAll('.qual-person-cb:checked');
        const countEl = document.getElementById('selectedQualPersonCount');
        if (countEl) countEl.textContent = checked.length;
        const tagsEl = document.getElementById('selectedQualPersonTags');
        if (tagsEl) {
          tagsEl.innerHTML = '';
          checked.forEach(cb => {
            const tag = document.createElement('span');
            tag.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:2px 10px;background:#e6f7ff;color:#1890ff;border-radius:12px;font-size:12px;';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = cb.dataset.name;
            const closeBtn = document.createElement('span');
            closeBtn.textContent = ' ×';
            closeBtn.style.cssText = 'cursor:pointer;margin-left:2px;font-size:14px;';
            closeBtn.onclick = function() {
              tag.remove();
              const cbEl = document.querySelector('.qual-person-cb[data-id="' + cb.dataset.id + '"]');
              if (cbEl) cbEl.checked = false;
              window.updateQualPersonCount();
            };
            tag.appendChild(nameSpan);
            tag.appendChild(closeBtn);
            tagsEl.appendChild(tag);
          });
        }
      };
    };

    // 提交新增资质
    const submitAddQualification = () => {
      const qualName = document.getElementById('qualName')?.value;
      if (!qualName) { ElMessage.warning('请输入资质名称'); return; }
      const qualType = document.getElementById('qualType')?.value;
      if (!qualType) { ElMessage.warning('请选择资质类型'); return; }
      const qualNo = document.getElementById('qualNo')?.value;
      if (!qualNo) { ElMessage.warning('请输入资质编号'); return; }
      const issuingOrg = document.getElementById('qualIssuingOrg')?.value;
      if (!issuingOrg) { ElMessage.warning('请选择发证机构'); return; }
      const issueDate = document.getElementById('qualIssueDate')?.value;
      if (!issueDate) { ElMessage.warning('请选择发证日期'); return; }
      const expireDate = document.getElementById('qualExpireDate')?.value;
      if (!expireDate) { ElMessage.warning('请选择有效期至'); return; }
      const checked = document.querySelectorAll('.qual-person-cb:checked');
      if (checked.length === 0) { ElMessage.warning('请至少选择一名持证人员'); return; }

      const loading = ElLoading.service({ text: '正在保存资质...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        const modal = document.getElementById('addQualModal');
        if (modal) modal.remove();
        ElMessage.success(`资质「${qualName}」创建成功！共关联 ${checked.length} 名人员`);
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }, 1200);
    };
    const renewQualification = (id) => ElMessage.success('已发起证书续期流程 → 证书ID: ' + (id || '-'));
    const filterExpiringQual = () => ElMessage.info('已筛选出所有即将到期（30天内）的资质记录（模拟）');
    const batchVerifyQual = () => {
      const loading = ElLoading.service({ text: '正在批量核验资质...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => { loading.close(); ElMessage.success('批量核验完成！共核验 8 条资质（模拟）'); }, 1500);
    };
    const editQualification = (id) => ElMessage.info('模拟打开「编辑资质」表单弹窗 → 资质ID: ' + id);
    const verifyQualification = (id) => {
      ElMessageBox.confirm('确认核验该资质证书的真实性？', '资质核验', {
        confirmButtonText: '确认核验', cancelButtonText: '取消', type: 'info'
      }).then(() => {
        ElMessage.success('资质核验通过（模拟操作）');
      }).catch(() => {});
    };
    const revokeQualification = (id) => {
      ElMessageBox.confirm('确定要作废该资质吗？作废后不可恢复。', '作废确认', {
        confirmButtonText: '确定作废', cancelButtonText: '取消', type: 'error'
      }).then(() => {
        ElMessage.warning('资质已作废（模拟操作）');
        closePersonnelDetail('personnel-qualification');
      }).catch(() => {});
    };
    const bindPersonToQual = (id) => {
      ElMessageBox.alert('模拟打开「绑定人员」弹窗，可搜索并选择多名人员绑定至该资质', '绑定人员', { confirmButtonText: '确定' });
    };
    const saveReminderSetting = () => ElMessage.success('提醒设置已保存（模拟）');

    // 培训
    const addTraining = () => {
      const persons = MOCK.persons;
      const templates = MOCK.qualTemplates;
      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

      const modalId = 'addTrainingModal';
      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      const modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:8px;width:780px;max-height:90vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <div style="padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;font-weight:600;">➕ 新增培训记录</span>
            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
          </div>
          <div style="padding:20px 24px;">
            <!-- 基本信息 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">📋 培训基本信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训名称 <span style="color:#f5222d;">*</span></label>
                <input id="trainName" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入培训名称" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训类型 <span style="color:#f5222d;">*</span></label>
                <select id="trainType" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  ${MOCK.trainingTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训方式</label>
                <select id="trainMode" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="线下">线下</option>
                  <option value="线上">线上</option>
                  <option value="线上+线下">线上+线下</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训类别</label>
                <select id="trainCategory" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="内部">内部</option>
                  <option value="外部">外部</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">举办方</label>
                <input id="trainOrganizer" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：人力资源部" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">讲师</label>
                <input id="trainTrainer" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入讲师姓名" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训开始时间 <span style="color:#f5222d;">*</span></label>
                <input id="trainStartDate" type="date" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训结束时间</label>
                <input id="trainEndDate" type="date" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训时长</label>
                <input id="trainDuration" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：2小时" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">培训地点</label>
                <input id="trainLocation" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：A培训室" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">有无考核</label>
                <select id="trainHasExam" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="true">有</option>
                  <option value="false">无</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">关联资质模板</label>
                <select id="trainQualTemplate" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">不关联</option>
                  ${templates.map(t => `<option value="${t.id}">[${t.qualTypeName}] ${t.qualName}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- 人员选择 -->
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
              <span>👥 参训人员选择 <span style="color:#f5222d;">*</span></span>
              <span style="font-size:12px;font-weight:400;color:#909399;">
                已选 <strong id="selectedPersonCount">0</strong> 人
              </span>
            </div>
            <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;">
              <input id="personSearchInput" style="flex:1;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="搜索人员姓名/部门..." oninput="filterPersonList()" />
              <button class="el-button el-button--default el-button--small" onclick="document.querySelectorAll('.person-select-cb').forEach(cb=>cb.checked=true);updatePersonCount()">全选</button>
              <button class="el-button el-button--default el-button--small" onclick="document.querySelectorAll('.person-select-cb').forEach(cb=>cb.checked=false);updatePersonCount()">清空</button>
            </div>
            <div style="border:1px solid #e8e8e8;border-radius:4px;max-height:220px;overflow-y:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr style="background:#fafafa;">
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:36px;"></th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">姓名</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">部门</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">岗位</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">状态</th>
                  </tr>
                </thead>
                <tbody>
                ${persons.map((p, idx) => {
                  const avatarColor = colors[idx % colors.length];
                  return `
                    <tr>
                      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                        <input type="checkbox" class="person-select-cb" data-id="${p.id}" data-name="${p.name}" data-dept="${p.dept}" onchange="updatePersonCount()" />
                      </td>
                      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                        <div style="display:flex;align-items:center;gap:6px;">
                          <div style="width:24px;height:24px;border-radius:50%;background:${avatarColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">${p.name[0]}</div>
                          <span>${p.name}</span>
                        </div>
                      </td>
                      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:var(--pwd-text-secondary);">${p.dept}</td>
                      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;color:var(--pwd-text-secondary);">${p.position}</td>
                      <td style="padding:6px 12px;border-bottom:1px solid #f5f5f5;">
                        <span class="status-tag ${p.status === '在职' ? 'status-tag--done' : (p.status === '离职' ? 'status-tag--rejected' : 'status-tag--pending')}" style="font-size:11px;">${p.status}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;" id="selectedPersonTags"></div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;">
            <button class="el-button el-button--default" onclick="document.getElementById('${modalId}').remove()">取消</button>
            <button class="el-button el-button--primary" onclick="window.app.submitAddTraining()">保存</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // 定义人员搜索和计数函数（挂到全局以便弹窗内调用）
      window.filterPersonList = function() {
        const keyword = document.getElementById('personSearchInput')?.value?.toLowerCase() || '';
        document.querySelectorAll('.person-select-cb').forEach(cb => {
          const row = cb.closest('tr');
          const name = cb.dataset.name?.toLowerCase() || '';
          const dept = cb.dataset.dept?.toLowerCase() || '';
          const match = !keyword || name.includes(keyword) || dept.includes(keyword);
          if (row) row.style.display = match ? '' : 'none';
        });
      };
      window.updatePersonCount = function() {
        const checked = document.querySelectorAll('.person-select-cb:checked');
        const countEl = document.getElementById('selectedPersonCount');
        if (countEl) countEl.textContent = checked.length;
        // 更新选中标签
        const tagsEl = document.getElementById('selectedPersonTags');
        if (tagsEl) {
          tagsEl.innerHTML = '';
          checked.forEach(cb => {
            const tag = document.createElement('span');
            tag.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:2px 10px;background:#e6f7ff;color:#1890ff;border-radius:12px;font-size:12px;';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = cb.dataset.name;
            const closeBtn = document.createElement('span');
            closeBtn.textContent = ' ×';
            closeBtn.style.cssText = 'cursor:pointer;margin-left:2px;font-size:14px;';
            closeBtn.onclick = function() {
              tag.remove();
              const cbEl = document.querySelector('.person-select-cb[data-id="' + cb.dataset.id + '"]');
              if (cbEl) cbEl.checked = false;
              window.updatePersonCount();
            };
            tag.appendChild(nameSpan);
            tag.appendChild(closeBtn);
            tagsEl.appendChild(tag);
          });
        }
      };
    };

    const editTraining = (id) => ElMessage.info('模拟打开「编辑培训」表单弹窗 → 培训ID: ' + id);

    // 提交新增培训
    const submitAddTraining = () => {
      const name = document.getElementById('trainName')?.value;
      if (!name) { ElMessage.warning('请输入培训名称'); return; }
      const checked = document.querySelectorAll('.person-select-cb:checked');
      if (checked.length === 0) { ElMessage.warning('请至少选择一名参训人员'); return; }
      const type = document.getElementById('trainType')?.value || '安全培训';
      const startDate = document.getElementById('trainStartDate')?.value;
      if (!startDate) { ElMessage.warning('请选择培训开始时间'); return; }

      const loading = ElLoading.service({ text: '正在保存培训记录...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        const modal = document.getElementById('addTrainingModal');
        if (modal) modal.remove();
        ElMessage.success(`培训「${name}」创建成功！共 ${checked.length} 人参训`);
        // 刷新培训记录列表
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }, 1200);
    };

    // 资质模板CRUD
    const addQualTemplate = () => {
      const modalId = 'addQualTemplateModal';
      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      const qualTypeOptions = [
        { value: '1', label: '特种作业证' },
        { value: '2', label: '安全培训证' },
        { value: '3', label: '技能等级证' },
        { value: '4', label: '外包准入证' },
        { value: '5', label: '身份证' },
        { value: '6', label: '其他证件' }
      ];

      const modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:8px;width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <div style="padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;font-weight:600;">➕ 新增资质模板</span>
            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
          </div>
          <div style="padding:20px 24px;">
            <div style="font-size:14px;font-weight:600;color:#303133;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;">📋 模板基本信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">证书类型 <span style="color:#f5222d;">*</span></label>
                <select id="qtQualType" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="">请选择证书类型</option>
                  ${qualTypeOptions.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">证书名称 <span style="color:#f5222d;">*</span></label>
                <input id="qtQualName" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="请输入证书名称" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">默认有效期（天） <span style="color:#f5222d;">*</span></label>
                <input id="qtValidDays" type="number" min="1" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：365" />
                <div style="font-size:11px;color:#909399;margin-top:2px;">填写 9999 表示长期有效</div>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">提前预警天数 <span style="color:#f5222d;">*</span></label>
                <input id="qtWarnDays" type="number" min="0" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="如：30" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">排序号</label>
                <input id="qtSortOrder" type="number" min="0" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;" placeholder="数值越小越靠前" />
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">状态</label>
                <select id="qtStatus" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="enabled">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </div>
              <div style="grid-column:1/-1;">
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">模板说明</label>
                <textarea id="qtDescription" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;resize:vertical;min-height:60px;" placeholder="请输入模板说明（选填）"></textarea>
              </div>
            </div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;">
            <button class="el-button el-button--default" onclick="document.getElementById('${modalId}').remove()">取消</button>
            <button class="el-button el-button--primary" onclick="window.app.submitAddQualTemplate()">保存</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    };

    // 提交新增资质模板
    const submitAddQualTemplate = () => {
      const qualType = document.getElementById('qtQualType')?.value;
      if (!qualType) { ElMessage.warning('请选择证书类型'); return; }
      const qualName = document.getElementById('qtQualName')?.value;
      if (!qualName) { ElMessage.warning('请输入证书名称'); return; }
      const validDays = document.getElementById('qtValidDays')?.value;
      if (!validDays) { ElMessage.warning('请输入默认有效期'); return; }
      const warnDays = document.getElementById('qtWarnDays')?.value;
      if (!warnDays && warnDays !== '0') { ElMessage.warning('请输入提前预警天数'); return; }

      const loading = ElLoading.service({ text: '正在保存资质模板...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        const modal = document.getElementById('addQualTemplateModal');
        if (modal) modal.remove();
        ElMessage.success(`资质模板「${qualName}」创建成功！`);
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }, 1200);
    };
    const editQualTemplate = (id) => {
      const t = MOCK.qualTemplates.find(x => x.id === id);
      ElMessageBox.alert(`
        <div style="font-size:13px;">
          <p><strong>编辑资质模板</strong></p>
          <ul style="margin-top:8px;padding-left:20px;line-height:1.8;">
            <li>模板编号：${t?.id || id}</li>
            <li>证书类型：${t?.qualTypeName || '-'}</li>
            <li>证书名称：${t?.qualName || '-'}</li>
            <li>默认有效期：${t?.standardValidDays || '-'} 天</li>
            <li>提前预警：${t?.warnDays || '-'} 天</li>
          </ul>
        </div>
      `, '编辑资质模板', { confirmButtonText: '确定', dangerouslyUseHTMLString: true });
    };
    const copyQualTemplate = (id) => {
      const loading = ElLoading.service({ text: '正在复制模板...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => { loading.close(); ElMessage.success('资质模板已复制（模拟）'); }, 600);
    };
    const deleteQualTemplate = (id) => {
      const t = MOCK.qualTemplates.find(x => x.id === id);
      ElMessageBox.confirm(`确定要删除资质模板「${t?.qualName || id}」吗？`, '删除确认', {
        confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'error'
      }).then(() => {
        ElMessage.success('资质模板已删除（模拟）');
      }).catch(() => {});
    };

    // 切换到培训记录考核视图
    const switchToTrainingAssessment = () => {
      // 重置详情状态
      window._personnelDetailState = null;
      // 直接在当前容器渲染考核页面
      const container = document.getElementById('pageContainer');
      if (container) {
        container.innerHTML = PageRenderer.renderPersonnelTrainingAssessment();
      }
    };

    // 查看某次培训的考核详情
    const viewTrainingAssessmentDetail = (trainingId) => {
      const container = document.getElementById('pageContainer');
      if (container) {
        container.innerHTML = PageRenderer.renderTrainingAssessmentDetail(trainingId);
      }
    };

    // 返回考核列表
    const closeAssessmentView = () => {
      const container = document.getElementById('pageContainer');
      if (container) {
        container.innerHTML = PageRenderer.renderPersonnelTrainingAssessment();
      }
    };

    // 更新选中的参训人员计数
    const updateSelectedCount = () => {
      const checked = document.querySelectorAll('.participant-checkbox:checked');
      const countEl = document.getElementById('selectedCount');
      if (countEl) countEl.textContent = checked.length;
    };

    // 全选/取消全选参训人员
    const toggleAllParticipants = (el) => {
      document.querySelectorAll('.participant-checkbox').forEach(cb => cb.checked = el.checked);
      updateSelectedCount();
    };

    // 批量通过参训人员
    const batchApproveParticipants = (trainingId) => {
      const checked = document.querySelectorAll('.participant-checkbox:checked');
      if (checked.length === 0) {
        ElMessage.warning('请先选择需要批量通过的人员');
        return;
      }
      const names = Array.from(checked).map(cb => cb.dataset.name).join('、');
      ElMessageBox.confirm(`确定要通过以下 ${checked.length} 人的考核？<br><br><span style="font-size:12px;color:#909399;">${names}</span>`, '批量通过确认', {
        confirmButtonText: '确定通过',
        cancelButtonText: '取消',
        type: 'success',
        dangerouslyUseHTMLString: true
      }).then(() => {
        const loading = ElLoading.service({ text: '正在提交...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          // 模拟更新界面 - 更新已选中的行
          checked.forEach(cb => {
            const row = cb.closest('tr');
            if (row) {
              // 更新状态显示
              const statusCell = row.querySelector('.assessment-status');
              if (statusCell) {
                statusCell.innerHTML = '<span class="dot green"></span><span style="color:#52c41a;">通过</span>';
              }
              const actionBtns = row.querySelector('.action-btns');
              if (actionBtns) {
                actionBtns.querySelectorAll('button').forEach(btn => btn.disabled = true);
              }
              row.classList.remove('el-table__row--danger');
              row.classList.add('el-table__row--success');
              // 更新成绩显示
              const scoreSpan = row.querySelector('.score-input');
              if (scoreSpan && scoreSpan.textContent === '未录入') {
                scoreSpan.textContent = '80';
                scoreSpan.className = 'score-input score-pass';
              }
              cb.checked = false;
            }
          });
          updateSelectedCount();
          ElMessage.success(`成功通过 ${checked.length} 人的考核！`);
        }, 800);
      }).catch(() => {});
    };

    // 批量未通过参训人员
    const batchRejectParticipants = (trainingId) => {
      const checked = document.querySelectorAll('.participant-checkbox:checked');
      if (checked.length === 0) {
        ElMessage.warning('请先选择需要标记为未通过的人员');
        return;
      }
      const names = Array.from(checked).map(cb => cb.dataset.name).join('、');
      ElMessageBox.confirm(`确定要将以下 ${checked.length} 人标记为考核未通过？<br><br><span style="font-size:12px;color:#909399;">${names}</span>`, '批量未通过确认', {
        confirmButtonText: '确定未通过',
        cancelButtonText: '取消',
        type: 'error',
        dangerouslyUseHTMLString: true
      }).then(() => {
        const loading = ElLoading.service({ text: '正在提交...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          checked.forEach(cb => {
            const row = cb.closest('tr');
            if (row) {
              const statusCell = row.querySelector('.assessment-status');
              if (statusCell) {
                statusCell.innerHTML = '<span class="dot red"></span><span style="color:#f5222d;">未通过</span>';
              }
              row.classList.remove('el-table__row--success');
              row.classList.add('el-table__row--danger');
              const scoreSpan = row.querySelector('.score-input');
              if (scoreSpan && scoreSpan.textContent === '未录入') {
                scoreSpan.textContent = '45';
                scoreSpan.className = 'score-input score-fail';
              }
              cb.checked = false;
            }
          });
          updateSelectedCount();
          ElMessage.success(`已标记 ${checked.length} 人考核未通过！`);
        }, 800);
      }).catch(() => {});
    };

    // 单人通过
    const singleApproveParticipant = (trainingId, participantId) => {
      ElMessageBox.confirm('确认该人员考核通过？', '考核通过', {
        confirmButtonText: '确认通过', cancelButtonText: '取消', type: 'success'
      }).then(() => {
        const row = document.querySelector(`.participant-checkbox[value="${participantId}"]`)?.closest('tr');
        if (row) {
          const statusCell = row.querySelector('.assessment-status');
          if (statusCell) statusCell.innerHTML = '<span class="dot green"></span><span style="color:#52c41a;">通过</span>';
          row.querySelectorAll('.action-btns button').forEach(btn => btn.disabled = true);
          row.classList.remove('el-table__row--danger');
          row.classList.add('el-table__row--success');
        }
        ElMessage.success('已标记为通过！');
      }).catch(() => {});
    };

    // 单人未通过
    const singleRejectParticipant = (trainingId, participantId) => {
      ElMessageBox.confirm('确认该人员考核未通过？', '考核未通过', {
        confirmButtonText: '确认未通过', cancelButtonText: '取消', type: 'error'
      }).then(() => {
        const row = document.querySelector(`.participant-checkbox[value="${participantId}"]`)?.closest('tr');
        if (row) {
          const statusCell = row.querySelector('.assessment-status');
          if (statusCell) statusCell.innerHTML = '<span class="dot red"></span><span style="color:#f5222d;">未通过</span>';
          row.querySelectorAll('.action-btns button').forEach(btn => btn.disabled = true);
          row.classList.remove('el-table__row--success');
          row.classList.add('el-table__row--danger');
        }
        ElMessage.success('已标记为未通过！');
      }).catch(() => {});
    };

    // 考核结果录入（增强版 - 弹窗展示）
    const inputExamResults = (trainingId) => {
      // 获取或生成培训及参与者数据
      const allTrainings = MOCK.generatePendingAssessmentTrainings();
      let training;
      if (trainingId) {
        training = allTrainings.find(t => t.id === trainingId);
      } else {
        // 没有指定ID，取第一个待考核的培训
        const pending = allTrainings.filter(t => t.pendingAssess > 0);
        training = pending.length > 0 ? pending[0] : allTrainings[0];
      }
      if (!training) {
        ElMessage.warning('暂无可录入考核结果的培训');
        return;
      }

      const participants = training.participantsList || [];
      const pendingParticipants = participants.filter(p => p.examStatus === '未考核');
      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

      // 构建弹窗HTML
      const modalId = 'examInputModal';
      // 移除旧弹窗
      const oldModal = document.getElementById(modalId);
      if (oldModal) oldModal.remove();

      const modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:8px;width:820px;max-height:85vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <div style="padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;font-weight:600;">📝 考核结果录入</span>
            <span style="font-size:14px;color:#909399;">${training.name}</span>
            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
          </div>
          <div style="padding:20px 24px;">
            <!-- 培训信息 -->
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;padding:12px;background:#fafafa;border-radius:6px;font-size:13px;">
              <div><span style="color:#999;">培训类型：</span>${training.type}</div>
              <div><span style="color:#999;">培训时间：</span>${training.startDate}</div>
              <div><span style="color:#999;">参训人数：</span>${participants.length} 人</div>
              <div><span style="color:#999;">待考核：</span><span style="color:#faad14;font-weight:600;">${pendingParticipants.length} 人</span></div>
            </div>

            <!-- 表单配置 -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">考核人</label>
                <select id="examAssessor" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option>张主管</option>
                  <option>李安全员</option>
                  <option>王培训专员</option>
                  <option selected>当前用户（管理员）</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:500;color:#555;margin-bottom:4px;">默认通过分数</label>
                <select id="examPassScore" style="width:100%;padding:7px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;outline:none;">
                  <option value="60">≥ 60 分</option>
                  <option value="70">≥ 70 分</option>
                  <option value="80" selected>≥ 80 分</option>
                  <option value="90">≥ 90 分</option>
                </select>
              </div>
            </div>

            <!-- 批量操作 -->
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#fafafa;border-radius:4px;margin-bottom:12px;border:1px solid #e8e8e8;">
              <span style="font-size:13px;color:#666;">⚡ 快捷操作：</span>
              <button class="el-button el-button--success el-button--small" onclick="window.app.batchSetExamResult(true)">全部通过</button>
              <button class="el-button el-button--danger el-button--small" onclick="window.app.batchSetExamResult(false)">全部未通过</button>
              <button class="el-button el-button--default el-button--small" onclick="window.app.clearExamResults()">清空结果</button>
              <span style="font-size:12px;color:#999;margin-left:auto;">已录入 <span id="examInputCount">0</span>/${participants.length} 人</span>
            </div>

            <!-- 参训人员列表 -->
            <div style="border:1px solid #e8e8e8;border-radius:4px;max-height:380px;overflow-y:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr style="background:#fafafa;">
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:36px;">
                      <input type="checkbox" id="examSelectAll" onchange="document.querySelectorAll('.exam-person-cb').forEach(cb=>cb.checked=this.checked)" />
                    </th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:80px;">姓名</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;">部门</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:60px;">考勤</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:100px;">成绩</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:100px;">结果</th>
                    <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0;width:60px;">操作</th>
                  </tr>
                </thead>
                <tbody>
                ${participants.map((p, idx) => {
                  const pending = p.examStatus === '未考核';
                  const avatarColor = colors[idx % colors.length];
                  return `
                    <tr style="${!pending ? 'opacity:0.6;' : ''}">
                      <td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">
                        <input type="checkbox" class="exam-person-cb" data-id="${p.id}" data-pending="${pending}" ${!pending ? 'disabled' : ''} />
                      </td>
                      <td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">
                        <div style="display:flex;align-items:center;gap:6px;">
                          <div style="width:24px;height:24px;border-radius:50%;background:${avatarColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">${p.personName[0]}</div>
                          <span style="font-weight:500;">${p.personName}</span>
                        </div>
                      </td>
                      <td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;font-size:12px;color:#909399;">${p.personDept}</td>
                      <td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">
                        <span class="status-tag ${p.attendance === '已签到' ? 'status-tag--done' : 'status-tag--rejected'}" style="font-size:11px;">${p.attendance}</span>
                      </td>
                      <td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">
                        <input type="number" class="exam-score-input" data-id="${p.id}" value="${p.score !== null ? p.score : ''}" placeholder="分数" min="0" max="100"
                          style="width:70px;padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;text-align:center;outline:none;${p.score !== null ? (p.scorePassed ? 'border-color:#52c41a;background:#f6ffed;' : 'border-color:#f5222d;background:#fff1f0;') : ''}"
                          ${!pending ? 'disabled' : ''} oninput="window.app.onExamScoreInput(this)" />
                      </td>
                      <td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">
                        <span id="examResult_${p.id}" style="color:${p.examStatus === '通过' ? '#52c41a' : (p.examStatus === '未通过' ? '#f5222d' : '#c0c4cc')};font-weight:500;">
                          ${p.examStatus === '未考核' ? '待录入' : p.examStatus}
                        </span>
                      </td>
                      <td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">
                        <button class="el-button el-button--success el-button--small" onclick="window.app.setSingleExamResult('${p.id}', true)" ${!pending ? 'disabled' : ''} style="font-size:11px;">通过</button>
                        <button class="el-button el-button--danger el-button--small" onclick="window.app.setSingleExamResult('${p.id}', false)" ${!pending ? 'disabled' : ''} style="font-size:11px;">未通过</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;">
            <button class="el-button el-button--default" onclick="document.getElementById('${modalId}').remove()">取消</button>
            <button class="el-button el-button--primary" onclick="window.app.submitExamResults('${training.id}')">提交录入结果</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      updateExamInputCount();
    };

    // 成绩输入时自动判断通过/未通过
    const onExamScoreInput = (input) => {
      const id = input.dataset.id;
      const passScoreEl = document.getElementById('examPassScore');
      const passThreshold = passScoreEl ? parseInt(passScoreEl.value) : 80;
      const score = parseInt(input.value);
      const resultEl = document.getElementById('examResult_' + id);
      if (resultEl) {
        if (!isNaN(score) && score >= 0) {
          const passed = score >= passThreshold;
          resultEl.textContent = passed ? '通过' : '未通过';
          resultEl.style.color = passed ? '#52c41a' : '#f5222d';
          input.style.borderColor = passed ? '#52c41a' : '#f5222d';
          input.style.background = passed ? '#f6ffed' : '#fff1f0';
        } else {
          resultEl.textContent = '待录入';
          resultEl.style.color = '#c0c4cc';
          input.style.borderColor = '#d9d9d9';
          input.style.background = '#fff';
        }
      }
      updateExamInputCount();
    };

    // 单人设置考核结果（录入弹窗内）
    const setSingleExamResult = (id, passed) => {
      const input = document.querySelector(`.exam-score-input[data-id="${id}"]`);
      if (!input) return;
      input.value = passed ? '85' : '45';
      input.style.borderColor = passed ? '#52c41a' : '#f5222d';
      input.style.background = passed ? '#f6ffed' : '#fff1f0';
      const resultEl = document.getElementById('examResult_' + id);
      if (resultEl) {
        resultEl.textContent = passed ? '通过' : '未通过';
        resultEl.style.color = passed ? '#52c41a' : '#f5222d';
      }
      updateExamInputCount();
    };

    // 批量设置考核结果（录入弹窗内）
    const batchSetExamResult = (passed) => {
      const cbs = document.querySelectorAll('.exam-person-cb:not(:disabled):checked');
      if (cbs.length === 0) {
        // 如果没有选中，则操作全部待考核人员
        const allPending = document.querySelectorAll('.exam-person-cb:not(:disabled)');
        if (allPending.length === 0) {
          ElMessage.warning('没有待考核的人员');
          return;
        }
        allPending.forEach(cb => {
          setSingleExamResult(cb.dataset.id, passed);
        });
        ElMessage.success(`已为全部 ${allPending.length} 人${passed ? '通过' : '未通过'}考核`);
      } else {
        cbs.forEach(cb => {
          setSingleExamResult(cb.dataset.id, passed);
        });
        ElMessage.success(`已为选中的 ${cbs.length} 人${passed ? '通过' : '未通过'}考核`);
      }
    };

    // 清空考核结果（录入弹窗内）
    const clearExamResults = () => {
      document.querySelectorAll('.exam-score-input').forEach(input => {
        input.value = '';
        input.style.borderColor = '#d9d9d9';
        input.style.background = '#fff';
        const id = input.dataset.id;
        const resultEl = document.getElementById('examResult_' + id);
        if (resultEl) {
          resultEl.textContent = '待录入';
          resultEl.style.color = '#c0c4cc';
        }
      });
      updateExamInputCount();
    };

    // 更新录入计数
    const updateExamInputCount = () => {
      const inputs = document.querySelectorAll('.exam-score-input');
      const total = inputs.length;
      const filled = Array.from(inputs).filter(input => input.value !== '').length;
      const countEl = document.getElementById('examInputCount');
      if (countEl) countEl.textContent = filled;
    };

    // 提交考核结果
    const submitExamResults = (trainingId) => {
      const inputs = document.querySelectorAll('.exam-score-input');
      const filled = Array.from(inputs).filter(input => input.value !== '').length;
      const total = document.querySelectorAll('.exam-score-input').length;
      if (filled === 0) {
        ElMessage.warning('请至少录入一项考核成绩');
        return;
      }
      ElMessageBox.confirm(`确认提交 ${filled}/${total} 人的考核结果？提交后将不可直接修改。`, '提交确认', {
        confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'info'
      }).then(() => {
        const loading = ElLoading.service({ text: '正在提交...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          // 关闭弹窗
          const modal = document.getElementById('examInputModal');
          if (modal) modal.remove();
          ElMessage.success(`考核结果录入成功！共提交 ${filled} 人`);
          // 如果当前在考核详情页，刷新它
          if (trainingId) {
            viewTrainingAssessmentDetail(trainingId);
          }
        }, 1000);
      }).catch(() => {});
    };

    // 安全记录
    const addSafetyRecord = () => {
      ElMessageBox.alert('模拟打开「新增安全记录」表单弹窗：选择记录类型、填写事件名称、发生时间/地点、风险等级、关联人员、处理结果等', '录入安全记录', { confirmButtonText: '确定' });
    };
    const editSafetyRecord = (id) => ElMessage.info('模拟打开「编辑安全记录」表单弹窗 → 记录ID: ' + id);
    const submitRectifyProof = (id) => {
      ElMessageBox.alert('模拟打开「提交整改证明」弹窗：上传整改完成照片/文件，填写整改说明', '提交整改证明', { confirmButtonText: '确定' });
    };
    const linkSafetyTraining = (id) => {
      ElMessageBox.alert('模拟打开「关联安全培训」弹窗：可选择已有培训或创建新培训进行关联', '关联安全培训', { confirmButtonText: '确定' });
    };
    const filterHighRiskSafety = () => ElMessage.info('已筛选出所有高风险安全记录（模拟）');
    const filterPendingSafety = () => ElMessage.info('已筛选出所有待处理安全记录（模拟）');
    const setRectifyReminder = () => ElMessage.info('模拟打开「整改提醒设置」弹窗：可设置整改进度提醒频率和提醒对象');
    const reportHighRisk = () => {
      ElMessageBox.confirm('确定要将高风险记录上报至管理层？上报后将发送通知给相关管理人员。', '高风险上报', {
        confirmButtonText: '确定上报', cancelButtonText: '取消', type: 'error'
      }).then(() => {
        ElMessage.success('高风险记录已上报（模拟）');
      }).catch(() => {});
    };
    const generateSafetyReport = () => {
      const loading = ElLoading.service({ text: '正在生成安全记录统计分析报表...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => { loading.close(); ElMessage.success('安全统计报表已生成（模拟）'); }, 1500);
    };

    // ========== 工单管理（工作流版） ==========
    const openWorkOrderForm = () => {
      const modalId = 'woFormModal';
      const old = document.getElementById(modalId);
      if (old) old.remove();
      const depts = ['生产部', '安全部', '技术部', '行政部'];
      const types = ['巡检', '隐患整改', '安全报修', '违规整改'];
      const persons = MOCK.persons;
      const modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:8px;width:720px;max-height:90vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <div style="padding:16px 24px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;font-weight:600;">➕ 新建工单（保存为草稿）</span>
            <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999;">&times;</button>
          </div>
          <div style="padding:20px 24px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
              <div class="el-form-item">
                <label class="el-form-item__label">工单类型 <span style="color:#f5222d;">*</span></label>
                <select id="woFormType" class="el-input__inner" style="width:100%;">${types.map(t => '<option value="' + t + '">' + t + '</option>').join('')}</select>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">风险等级 <span style="color:#f5222d;">*</span></label>
                <select id="woFormRisk" class="el-input__inner" style="width:100%;"><option value="低风险">低风险</option><option value="中风险" selected>中风险</option><option value="高风险">高风险</option></select>
              </div>
              <div style="grid-column:1/-1;">
                <label class="el-form-item__label">工单标题 <span style="color:#f5222d;">*</span></label>
                <input id="woFormTitle" class="el-input__inner" style="width:100%;" placeholder="请输入工单标题" />
              </div>
              <div style="grid-column:1/-1;">
                <label class="el-form-item__label">问题/隐患描述 <span style="color:#f5222d;">*</span></label>
                <textarea id="woFormDesc" class="el-input__inner" rows="3" style="width:100%;resize:vertical;" placeholder="请详细描述发现的问题或隐患"></textarea>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">责任部门 <span style="color:#f5222d;">*</span></label>
                <select id="woFormDept" class="el-input__inner" style="width:100%;"><option value="">请选择</option>${depts.map(d => '<option value="' + d + '">' + d + '</option>').join('')}</select>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">执行人</label>
                <select id="woFormExecutor" class="el-input__inner" style="width:100%;"><option value="">（审批通过后派发）</option>${persons.map(p => '<option value="' + p.name + '">' + p.name + '（' + p.dept + '）</option>').join('')}</select>
              </div>
              <div class="el-form-item">
                <label class="el-form-item__label">要求完成时间 <span style="color:#f5222d;">*</span></label>
                <input id="woFormDeadline" class="el-input__inner" type="date" style="width:100%;" />
              </div>
            </div>
            <div style="font-size:13px;color:#909399;background:#fafafa;padding:12px;border-radius:6px;">💡 工单保存为草稿后，可在「已发任务」中发起Flowable审批流程。</div>
          </div>
          <div style="padding:12px 24px;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:10px;">
            <button class="el-button el-button--default" onclick="document.getElementById('${modalId}').remove()">取消</button>
            <button class="el-button el-button--primary" onclick="app.submitWorkOrderDraft()">保存草稿</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    };

    const submitWorkOrderDraft = () => {
      const title = document.getElementById('woFormTitle')?.value;
      if (!title) { ElMessage.warning('请输入工单标题'); return; }
      const desc = document.getElementById('woFormDesc')?.value;
      if (!desc) { ElMessage.warning('请输入问题/隐患描述'); return; }
      const dept = document.getElementById('woFormDept')?.value;
      if (!dept) { ElMessage.warning('请选择责任部门'); return; }
      const loading = ElLoading.service({ text: '正在保存工单...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        const modal = document.getElementById('woFormModal');
        if (modal) modal.remove();
        ElMessage.success('工单已保存为草稿！请在「已发任务」中发起审批。');
        switchToMenu('onsite-wo-issued');
      }, 800);
    };

    // 打开工单任务编辑器（表单/流程图/流转记录）
    const openWoTaskEditor = (orderId, taskType) => {
      window._onsiteDetailState = { view: 'taskEditor', orderId: orderId, taskType: taskType };
      const editorMenuKey = 'wo-editor-' + orderId;
      const existTab = openedTabs.value.find(t => t.path === editorMenuKey);
      if (!existTab) {
        openedTabs.value.push({ path: editorMenuKey, title: '工单: ' + orderId });
      }
      activeMenu.value = editorMenuKey;
      PageRenderer.render('onsite-wo-' + taskType);
      const content = document.querySelector('.pwd-content');
      if (content) content.scrollTop = 0;
    };

    const closeWoTaskEditor = (taskType) => {
      window._onsiteDetailState = null;
      switchToMenu('onsite-wo-' + (taskType || 'issued'));
    };

    // 工单任务审批操作（待办页面的处理按钮）
    const handleWoTaskApprove = (id) => {
      ElMessageBox.confirm('确认提交至下一节点？', '流程操作', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'info'
      }).then(() => {
        const loading = ElLoading.service({ text: '正在提交...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.success('任务已提交至下一节点，流程继续流转');
        }, 800);
      }).catch(() => {});
    };

    const handleWoTaskReject = (id) => {
      ElMessageBox.prompt('请输入驳回理由', '驳回', {
        confirmButtonText: '确定', cancelButtonText: '取消',
        inputType: 'textarea', inputPlaceholder: '请填写驳回原因...'
      }).then(({ value }) => {
        const loading = ElLoading.service({ text: '处理中...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.warning('任务已驳回：' + (value || '无理由'));
        }, 600);
      }).catch(() => {});
    };

    // 工单编辑器Tab切换
    const switchWoEditorTab = (event, tabName) => {
      const tabs = event.target.parentElement.querySelectorAll('.el-tabs__item');
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.style.color = '#606266';
        t.style.borderBottom = 'none';
      });
      event.target.classList.add('is-active');
      event.target.style.color = 'var(--pwd-primary)';
      event.target.style.borderBottom = '2px solid var(--pwd-primary)';
      const formDiv = document.getElementById('woEditorTabForm');
      const flowDiv = document.getElementById('woEditorTabFlow');
      const recordDiv = document.getElementById('woEditorTabRecord');
      if (formDiv) formDiv.style.display = tabName === 'form' ? '' : 'none';
      if (flowDiv) flowDiv.style.display = tabName === 'flow' ? '' : 'none';
      if (recordDiv) recordDiv.style.display = tabName === 'record' ? '' : 'none';
    };

    // 提交工单审批（从编辑器发起）
    const submitWorkOrderApproval = (id) => {
      ElMessageBox.confirm('确认发起Flowable审批流程？工单将进入审批流转。', '发起审批', {
        confirmButtonText: '确认发起', cancelButtonText: '取消', type: 'success'
      }).then(() => {
        const loading = ElLoading.service({ text: '正在发起审批流程...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.success('审批流程已发起！请告知审批人前往「待办任务」处理。');
          window._onsiteDetailState = null;
          switchToMenu('onsite-wo-issued');
        }, 1000);
      }).catch(() => {});
    };

    // 编辑草稿工单
    const editWorkOrder = (id) => {
      ElMessageBox.alert('模拟打开工单编辑表单（工单ID: ' + id + '）<br>可修改：工单标题、描述、责任部门、执行人、风险等级、要求完成时间', '编辑工单', {
        confirmButtonText: '确定（模拟）', dangerouslyUseHTMLString: true
      });
    };

    // 查看工单详情（从编辑器查看完整信息）
    const viewWorkOrderDetail = (id) => {
      ElMessage.info('模拟打开工单详情 → 工单ID: ' + id + '\n包含：工单信息、处理记录、附件等');
    };

    // 作废工单
    const cancelWorkOrder = (id) => {
      ElMessageBox.confirm('确定要作废工单 ' + id + '？作废后流程将终止。', '作废确认', {
        confirmButtonText: '确定作废', cancelButtonText: '取消', type: 'error'
      }).then(() => {
        ElMessage.success('工单已作废，流程已终止');
        window._onsiteDetailState = null;
        const key = activeMenu.value;
        if (key && key.startsWith('wo-editor-')) {
          switchToMenu('onsite-wo-issued');
        } else if (key) {
          PageRenderer.render(key);
        }
      }).catch(() => {});
    };

    // 催办
    const urgeWorkOrder = (id) => {
      ElLoading.service({ text: '正在发送催办通知...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        ElLoading.service().close();
        ElMessage.success('催办通知已发送至当前审批人/执行人（站内信+消息提醒）');
      }, 500);
    };

    // 筛选
    const searchWorkOrders = () => ElMessage.success('工单筛选完成（模拟）');
    const resetWoFilter = () => {
      ['woSearchId','woSearchType','woSearchDept','woSearchExecutor','woSearchStatus','woSearchRisk'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      ['woDateStart','woDateEnd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      ElMessage.info('筛选条件已重置');
    };
    const filterWoTask = (taskType, status) => {
      const sel = document.getElementById('woSearchStatus_' + taskType);
      if (sel) sel.value = status;
      ElMessage.success(status ? '已筛选状态：' + status : '显示全部');
    };

    // 组织权限
    const addDept = () => ElMessageBox.alert('模拟打开「新增部门」表单弹窗', '新增部门', { confirmButtonText: '确定' });
    const addRole = () => ElMessageBox.alert('模拟打开「新增角色」表单弹窗', '新增角色', { confirmButtonText: '确定' });
    const addUser = () => ElMessageBox.alert('模拟打开「新增用户」表单弹窗', '新增用户', { confirmButtonText: '确定' });
    const editRole = (id) => ElMessage.info('模拟打开「编辑角色」→ ' + id);
    const configPermission = (id) => ElMessage.info('模拟打开「权限配置」→ 角色ID: ' + id);

    // 电子围栏
    const addGeofence = () => ElMessageBox.alert('模拟打开「新增电子围栏」表单弹窗：\n- 围栏名称\n- 围栏类型（禁入区/作业区/通行区/告警区）\n- 覆盖区域（地图绘制）\n- 告警方式（越界告警/滞留告警/离岗告警）\n- 关联人员/部门\n- 启用状态', '新增围栏', { confirmButtonText: '确定' });
    const editGeofence = (id) => ElMessage.info('模拟打开「编辑围栏」→ 围栏ID: ' + (id || '请选择'));
    const deleteGeofence = (id) => {
      if (id) {
        ElMessageBox.confirm('确定要删除围栏吗？', '删除确认', {
          confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'error'
        }).then(() => {
          ElMessage.success('围栏已删除（模拟）');
          const key = activeMenu.value;
          if (key) PageRenderer.render(key);
        }).catch(() => {});
      } else {
        ElMessage.warning('请先选择要删除的围栏');
      }
    };
    const toggleGeofence = (id) => {
      const action = '切换围栏状态（启用/禁用）';
      ElMessageBox.confirm('确认' + action + '？', '状态切换', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        ElMessage.success('围栏状态已切换（模拟）');
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }).catch(() => {});
    };
    const viewGeofenceMap = () => {
      ElMessage.info('模拟打开GIS地图界面，展示所有电子围栏边界和实时告警');
    };

    // 安全考评
    const addScoreRule = () => ElMessageBox.alert('模拟打开「新增积分规则」表单弹窗', '新增规则', { confirmButtonText: '确定' });
    const startCalculate = () => {
      const loading = ElLoading.service({ text: '正在计算积分，请稍候...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => { loading.close(); ElMessage.success('积分计算完成！共计算 1,286 人（模拟）'); }, 1800);
    };
    const adjustScore = (id) => ElMessage.info('模拟打开「调整积分」→ 人员ID: ' + id);

    // ========== 违规事件子页面（新增/详情）==========
    window._onsiteDetailState = null;

    const addViolation = () => {
      window._onsiteDetailState = { view: 'addViolation' };
      PageRenderer.render('onsite-violation');
    };
    const viewViolationDetail = (id) => {
      window._onsiteDetailState = { view: 'violationDetail', violationId: id };
      PageRenderer.render('onsite-violation');
    };
    const closeOnsiteDetail = (menuKey) => {
      window._onsiteDetailState = null;
      if (menuKey) {
        switchToMenu(menuKey);
      } else {
        PageRenderer.render(activeMenu.value);
      }
    };
    const submitAddViolation = () => {
      const personRadio = document.querySelector('.vio-person-radio:checked');
      if (!personRadio) { ElMessage.warning('请选择违规人员'); return; }
      const desc = document.getElementById('vioFormDesc');
      if (!desc || !desc.value.trim()) { ElMessage.warning('请填写违规内容描述'); return; }
      const location = document.getElementById('vioFormLocation');
      if (!location || !location.value) { ElMessage.warning('请选择违规地点'); return; }
      const date = document.getElementById('vioFormDate');
      if (!date || !date.value) { ElMessage.warning('请选择违规日期'); return; }

      const loading = ElLoading.service({ text: '正在提交违规事件...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        window._onsiteDetailState = null;
        ElMessage.success('违规事件上报成功！已自动扣分并生成安全记录。');
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }, 1200);
    };
    const onViolationRiskChange = () => {
      const risk = document.getElementById('vioFormRisk');
      const score = document.getElementById('vioFormScore');
      if (risk && score) {
        const map = { '低': 5, '中': 10, '高': 20 };
        score.value = map[risk.value] || 10;
      }
    };
    const filterVioPersonList = () => {
      const keyword = document.getElementById('vioPersonSearch')?.value?.toLowerCase() || '';
      document.querySelectorAll('.vio-person-row').forEach(row => {
        const name = (row.dataset.name || '').toLowerCase();
        const id = (row.dataset.id || '').toLowerCase();
        const dept = (row.dataset.dept || '').toLowerCase();
        row.style.display = (!keyword || name.includes(keyword) || id.includes(keyword) || dept.includes(keyword)) ? '' : 'none';
      });
    };
    const updateVioPersonSelect = () => {
      const checked = document.querySelector('.vio-person-radio:checked');
      const countEl = document.getElementById('vioSelectedPersonCount');
      if (countEl) countEl.textContent = checked ? '1' : '0';
      const tagEl = document.getElementById('vioSelectedPersonTag');
      if (tagEl) {
        if (checked) {
          tagEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;background:#e6f7ff;color:#1890ff;border-radius:12px;font-size:12px;">' +
            checked.dataset.name + ' · ' + checked.dataset.dept + ' · ' + checked.dataset.position + '</span>';
        } else {
          tagEl.innerHTML = '';
        }
      }
    };
    const switchOnsiteDetailTab = (event, module, tabId) => {
      const parent = event.target.closest('.detail-tabs');
      if (parent) {
        parent.querySelectorAll('.detail-tab-item').forEach(t => t.classList.remove('is-active'));
      }
      event.target.classList.add('is-active');
      if (module === 'vio') {
        // content IDs: vioTabVioBasic, vioTabVioRecord, vioTabVioOrder
        ['tabVioBasic', 'tabVioRecord', 'tabVioOrder'].forEach(tid => {
          const contentId = 'vio' + tid.charAt(0).toUpperCase() + tid.slice(1);
          const el = document.getElementById(contentId);
          if (el) el.style.display = tid === tabId ? '' : 'none';
        });
      }
    };
    const editViolation = (id) => ElMessage.info('模拟打开「编辑违规事件」→ 事件ID: ' + id);

    const dispatchRectify = (id) => {
      const loading = ElLoading.service({ text: '正在下发整改工单...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => {
        loading.close();
        ElMessage.success('违规事件已处理，整改工单已下发（模拟）');
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }, 1000);
    };
    const archiveViolation = (id) => {
      ElMessageBox.confirm('确认归档该违规事件？归档后进入历史记录。', '归档确认', {
        confirmButtonText: '确定归档', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        ElMessage.success('违规事件已归档（模拟）');
        const key = activeMenu.value;
        if (key) PageRenderer.render(key);
      }).catch(() => {});
    };

    // 定位轨迹
    const viewLocationTrail = (personId) => {
      ElMessage.info('模拟打开地图展示全天移动路径 → 人员ID: ' + (personId || '全部'));
      // 模拟在地图区展示轨迹
      const mapArea = document.querySelector('.map-placeholder');
      if (mapArea) {
        mapArea.style.transition = 'all 0.3s';
        mapArea.style.boxShadow = '0 0 0 2px var(--pwd-primary)';
        setTimeout(() => { mapArea.style.boxShadow = 'none'; }, 2000);
      }
    };
    const exportTrailReport = (personId) => {
      const loading = ElLoading.service({ text: '正在导出轨迹报表...', background: 'rgba(0,0,0,0.3)' });
      setTimeout(() => { loading.close(); ElMessage.success('轨迹报表导出成功（模拟）'); }, 1500);
    };
    const quickLocatePerson = () => {
      ElMessageBox.prompt('请输入要定位的人员姓名或工号', '人员快速定位', {
        confirmButtonText: '定位', cancelButtonText: '取消', inputPlaceholder: '姓名/工号'
      }).then(({ value }) => {
        if (value) {
          ElMessage.success('已定位到: ' + value + '（模拟展示地图位置）');
          viewLocationTrail(value);
        }
      }).catch(() => {});
    };
    const filterDateTrail = () => ElMessage.info('按所选日期筛选轨迹数据（模拟）');

    // onsite专用重置筛选函数
    const resetOnsiteFilter = (module) => {
      const prefixMap = { vio: 'vio', wo: 'wo', gf: 'gf', loc: 'loc' };
      const prefix = prefixMap[module] || 'vio';
      const inputs = document.querySelectorAll(`input[id^="${prefix}"]`);
      inputs.forEach(inp => { if (inp) inp.value = ''; });
      const selects = document.querySelectorAll(`select[id^="${prefix}"]`);
      selects.forEach(sel => { if (sel) sel.value = ''; });
      ElMessage.info('筛选条件已重置');
      const key = activeMenu.value;
      if (key) PageRenderer.render(key);
    };

    // 公共能力
    const uploadFile = () => ElMessageBox.confirm('模拟文件上传', '上传文件', { confirmButtonText: '选择文件', cancelButtonText: '取消' })
      .then(() => {
        const loading = ElLoading.service({ text: '上传中...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => { loading.close(); ElMessage.success('文件上传成功（模拟）'); }, 1200);
      }).catch(() => {});
    const downloadFile = (name) => ElMessage.success('开始下载: ' + name + '（模拟）');
    const markAllRead = () => ElMessage.success('已全部标记为已读（模拟）');

    // ========== 离场准出模块（C）专项操作 ==========

    // 主动离职：一键执行后置动作（审批通过后自动调用）
    const executeExitPostActions = (personId, taskId) => {
      ElMessageBox.confirm('确认执行离职后置动作？\n① 更新人员状态为「已离职」\n② 注销通行证/冻结资质\n③ 回收门禁权限\n④ 禁用系统账号', '后置动作确认', {
        confirmButtonText: '确认执行', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        const loading = ElLoading.service({ text: '正在执行后置动作...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.success('✅ 后置动作执行完成！\n人员状态已更新 | 通行证已注销 | 资质已冻结 | 门禁权限已回收 | 系统账号已禁用');
          console.log(`[EXIT] 离职后置动作已完成 for ${personId}, task ${taskId}`);
        }, 1500);
      }).catch(() => {});
    };

    // 主动离职：资产管理员核对确认
    const confirmAssetCheck = (taskId) => {
      ElMessageBox.confirm('请确认以下资产已全部归还：\n① 工牌 □ 已归还\n② 办公设备 □ 已归还\n③ 门禁卡/钥匙 □ 已归还\n④ 劳保用品 □ 已归还\n⑤ 工具仪器 □ 已归还\n⑥ 车辆/停车位 □ 已归还', '资产核对确认', {
        confirmButtonText: '全部已归还，确认通过', cancelButtonText: '有遗漏，返回', type: 'info'
      }).then(() => {
        ElMessage.success('资产核对通过！已全部归还确认。');
        console.log(`[EXIT] 资产管理员核对通过 for task ${taskId}`);
      }).catch(() => {});
    };

    // 主动离职：安全管理复核
    const confirmSecurityReview = (taskId) => {
      ElMessageBox.confirm('安全管理复核：\n① 违规记录核查 → 无未处理违规\n② 安全积分核查 → 正常\n③ 未闭环安全工单核查 → 2项（可在离职后标记为负责人变更）\n\n确认安全管理复核通过？', '安全管理复核', {
        confirmButtonText: '复核通过', cancelButtonText: '不通过', type: 'warning'
      }).then(() => {
        ElMessage.success('安全管理复核通过！');
        console.log(`[EXIT] 安全管理复核通过 for task ${taskId}`);
      }).catch(() => {});
    };

    // 违规清退：一键执行清退动作
    const executeExpelActions = (personId, taskId) => {
      ElMessageBox.confirm('确认执行违规清退动作？\n① 加入黑名单（sys_blacklist）\n② 注销所有证件\n③ 回收全部权限\n④ 禁用系统账号\n⑤ 更新人员状态为「已清退」', '清退动作确认', {
        confirmButtonText: '确认执行', cancelButtonText: '取消', type: 'error'
      }).then(() => {
        const loading = ElLoading.service({ text: '正在执行清退动作...', background: 'rgba(0,0,0,0.3)' });
        setTimeout(() => {
          loading.close();
          ElMessage.success('✅ 清退动作执行完成！\n已加入黑名单 | 所有证件已注销 | 权限已回收 | 账号已禁用');
          console.log(`[EXPEL] 清退动作已完成 for ${personId}, task ${taskId}`);
        }, 1500);
      }).catch(() => {});
    };

    // 违规清退：查看关联违规详情
    const viewRelatedViolation = (violationId) => {
      if (violationId) {
        // 切到违规事件详情
        window._onsiteDetailState = { view: 'violationDetail', violationId: violationId };
        switchToMenu('onsite-violation');
      } else {
        ElMessage.warning('请先选择关联违规单号');
      }
    };

    // --- 绑定外部调用 ---
    // 暴露到全局，供HTML中的onclick调用
    window.app = {
      switchToMenu,
      openTaskEditor, closeTaskEditor, switchEditorTab,
      viewSensitive, confirmViewSensitive: () => confirmViewSensitive(),
      workflowNext, workflowCC, workflowReject, workflowTerminate, saveDraft, cancelTask,
      filterWorkflowTable, resetWorkflowFilter, exportTable,
      zoomDiagram, resetDiagramZoom, simulateFileUpload,
      closeAllTabs, closeOtherTabs,
      // 通用操作
      genericSearch, genericExport, batchImport,
      // 准入办证 - 启动流程 & 子类型切换
      openFlowStarter, startFlowByType, onFlowSubTypeChange,
      // 访客管理 - 子类型切换
      onVisitorSubTypeChange,
      // 离场准出 - 子类型切换 & 专项操作
      onCSubTypeChange,
      executeExitPostActions, confirmAssetCheck, confirmSecurityReview,
      executeExpelActions, viewRelatedViolation,
      // 安全考评 - 子类型切换 & 专项操作
      onDSubTypeChange,
      executeAutoScoreCalc, previewThresholdLinkage, batchUpdateAccounts,
      previewAdjustedScore, viewOriginalRecord,
      // 人员主数据 - 详情视图
      viewPersonnelDetail, closePersonnelDetail, switchDetailTab,
      // 人员主数据 - 档案
      addPersonnel, editPersonnel, viewPersonnelDetail,
      submitAddPersonnel,
      archivePerson, batchModifyPersonnel, refreshPage,
      remindExpiring, printPersonnel, resetPersonnelFilter,
      toggleAdvancedFilter, toggleAllCheckbox, saveFilterCondition,
      // 人员主数据 - 资质管理
      addQualification, renewQualification, filterExpiringQual,
      batchVerifyQual, editQualification, verifyQualification,
      revokeQualification, bindPersonToQual, saveReminderSetting,
      submitAddQualification,
      // 人员主数据 - 资质模板
      addQualTemplate, editQualTemplate, copyQualTemplate, deleteQualTemplate,
      submitAddQualTemplate,
      // 人员主数据 - 培训记录
      addTraining, editTraining, inputExamResults,
      submitAddTraining,
      // 人员主数据 - 培训考核
      // 人员主数据 - 培训考核
      switchToTrainingAssessment, viewTrainingAssessmentDetail, closeAssessmentView,
      updateSelectedCount, toggleAllParticipants,
      batchApproveParticipants, batchRejectParticipants,
      singleApproveParticipant, singleRejectParticipant,
      // 考核结果录入（弹窗内）
      onExamScoreInput, setSingleExamResult, batchSetExamResult,
      clearExamResults, updateExamInputCount, submitExamResults,
      // 人员主数据 - 安全记录
      addSafetyRecord, editSafetyRecord, submitRectifyProof,
      linkSafetyTraining, filterHighRiskSafety, filterPendingSafety,
      setRectifyReminder, reportHighRisk, generateSafetyReport,
      // 工单（工作流版）
      openWorkOrderForm, submitWorkOrderDraft, openWoTaskEditor, closeWoTaskEditor,
      handleWoTaskApprove, handleWoTaskReject, switchWoEditorTab,
      submitWorkOrderApproval, editWorkOrder,
      viewWorkOrderDetail, cancelWorkOrder, urgeWorkOrder,
      searchWorkOrders, resetWoFilter, filterWoTask,
      // 组织权限
      addDept, addRole, addUser, editRole, configPermission,
      // 电子围栏（新）
      addGeofence, editGeofence, deleteGeofence, toggleGeofence, viewGeofenceMap,
      // 安全考评
      addScoreRule, startCalculate, adjustScore,
      // 违规事件（新）
      addViolation, viewViolationDetail, dispatchRectify, archiveViolation,
      closeOnsiteDetail, submitAddViolation, onViolationRiskChange,
      filterVioPersonList, updateVioPersonSelect, switchOnsiteDetailTab, editViolation,
      // 定位轨迹（新）
      viewLocationTrail, exportTrailReport, quickLocatePerson, filterDateTrail,
      // 通用 onsite 工具
      resetOnsiteFilter,
      // 公共能力
      uploadFile, downloadFile, markAllRead,
      bindWorkflowTable: (id, tasks, module) => {
        console.log('[TABLE] 绑定表格数据:', id, tasks.length, '条');
      }
    };

    // --- 生命周期 ---
    onMounted(() => {
      // 默认显示首页
      document.getElementById('pageContainer').innerHTML = PageRenderer.renderHomePage();
    });

    // --- 暴露给模板 ---
    return {
      activeMenu, sidebarCollapsed, breadcrumb, openedTabs, maskDialogVisible,
      handleMenuSelect, switchToMenu, switchTab, closeTab, closeAllTabs, closeOtherTabs,
      handleLogout, viewSensitive, confirmViewSensitive,
      openTaskEditor, closeTaskEditor, switchEditorTab,
      workflowNext, workflowCC, workflowReject, workflowTerminate, saveDraft, cancelTask,
      filterWorkflowTable, resetWorkflowFilter, exportTable,
      zoomDiagram, resetDiagramZoom, simulateFileUpload
    };
  }
});

// 注册Element Plus
vueApp.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  vueApp.component(key, component);
}

// 挂载
vueApp.mount('#app');

console.log('✅ 人员全生命周期一体化管控平台 - 原型启动成功');
console.log('📋 共包含以下模块：工作流模块 | 组织权限服务 | 人员主数据服务 | 在岗现场管控服务 | 安全考评积分服务 | 公共能力服务');
console.log('🔗 点击侧边栏菜单开始体验');

const Views = {
    login: () => `
        <div class="login-container">
            <div class="login-card">
                <div class="login-logo"><i class="ph ph-plant"></i></div>
                <h1 class="login-title">روان دايت</h1>
                <p class="login-subtitle">تسجيل الدخول للوحة التحكم</p>
                <form onsubmit="app.handleLogin(event)">
                    <div style="text-align:right; margin-bottom:16px;">
                        <input type="text" name="username" class="form-control" placeholder="اسم المستخدم" style="text-align:center;">
                    </div>
                    <div style="text-align:right; margin-bottom:24px;">
                        <input type="password" name="password" class="form-control" placeholder="كلمة المرور" style="text-align:center;">
                    </div>
                    <button type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:16px;">
                        دخول <i class="ph ph-sign-in"></i>
                    </button>
                </form>
            </div>
        </div>
    `,

    dashboard: (clients) => `
        <header class="top-bar">
            <h2 id="page-title">لوحة التحكم</h2>
            <div class="user-profile" onclick="app.showUserProfile()">
                <div class="user-info-text">
                    <span class="admin-name">${localStorage.getItem('rawan_admin_name') || 'المشرف'}</span>
                    <span class="admin-role">Admin</span>
                </div>
                <div class="avatar"><i class="ph ph-user"></i></div>
            </div>
        </header>

        <div class="hero-stats-grid">
            <!-- Hero Card 1: Clients -->
            <div class="hero-card">
                <i class="ph ph-users-three bg-icon"></i>
                <div class="hero-card-header">
                    <div class="hero-icon"><i class="ph ph-users"></i></div>
                    <div class="progress-ring" style="--percent: ${clients.length > 0 ? (clients.filter(c => c.status === 'active').length / clients.length) * 100 : 0}%">
                        <span class="progress-ring-text">${clients.length}</span>
                    </div>
                </div>
                <div class="hero-value">${clients.length}</div>
                <div class="hero-label">إجمالي المشتركين</div>
            </div>

            <!-- Hero Card 2: Total Weight Lost -->
            <div class="hero-card">
                <i class="ph ph-trend-down bg-icon"></i>
                <div class="hero-card-header">
                    <div class="hero-icon"><i class="ph ph-fire"></i></div>
                </div>
                <div class="hero-value">
                ${clients.reduce((acc, c) => {
        const start = parseFloat(c.startWeight) || 0;
        const curr = parseFloat(c.currentWeight) || 0;
        return acc + (start > curr ? (start - curr) : 0);
    }, 0).toFixed(1)} <span style="font-size:16px; color:#6b7280;">كجم</span>
                </div>
                <div class="hero-label">مجموع الوزن المفقود</div>
            </div>

            <!-- Hero Card 3: Active Status -->
            <div class="hero-card">
                 <i class="ph ph-lightning bg-icon"></i>
                <div class="hero-card-header">
                    <div class="hero-icon"><i class="ph ph-activity"></i></div>
                    <span style="font-size:18px; font-weight:800; color:var(--primary-600);">${clients.length > 0 ? Math.round((clients.filter(c => c.status === 'active').length / clients.length) * 100) : 0}%</span>
                </div>
                <div class="hero-value">${clients.filter(c => c.status === 'active').length}</div>
                <div class="hero-label">مشتركين نشطين</div>
            </div>
        </div>

        <div class="recent-clients-section">
            <div class="section-header">
                <h3>قائمة المشتركين</h3>
                <button class="btn-primary" onclick="app.navigate('add-client')">
                    <i class="ph ph-plus-circle"></i> إضافة مشترك
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>تاريخ الاشتراك</th>
                            <th>الوزن الحالي</th>
                            <th>الحالة</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(client => `
                            <tr>
                                <td>${client.name}</td>
                                <td>${client.joinDate}</td>
                                <td>${client.currentWeight} كجم</td>
                                <td><span class="status ${client.status}">${client.status === 'active' ? 'نشط' : 'غير فعال'}</span></td>
                                <td>
                                    <div style="display:flex; gap:8px; justify-content:flex-end;">
                                        <button class="btn-sm" onclick="app.viewClient('${client.id}')" title="عرض">
                                            <i class="ph ph-eye"></i>
                                        </button>
                                        <button class="btn-sm" style="background:#fef2f2; color:#ef4444;" onclick="app.confirmAction('هل أنت متأكد من حذف المشترك؟', () => app.deleteClient('${client.id}'))" title="حذف">
                                            <i class="ph ph-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `,

    clientForm: (client = null) => `
        <header class="top-bar">
            <h2 id="page-title">${client ? 'تعديل بيانات المشترك' : 'إضافة مشترك جديد'}</h2>
            <button class="btn-sm" onclick="app.navigate(${client ? `'client', '${client.id}'` : "'dashboard'"})">إلغاء</button>
             <div class="user-profile" onclick="app.showUserProfile()" style="margin-right:auto; margin-left:0;">
                <div class="avatar"><i class="ph ph-user"></i></div>
            </div>
        </header>
        
        <div class="form-card">
            <form id="client-form" onsubmit="app.handleClientSubmit(event, ${client ? `'${client.id}'` : 'null'})">
                <div class="form-grid">
                    <div class="form-group form-grid-full">
                        <label>الاسم الكامل</label>
                        <input type="text" name="name" class="form-control" required value="${client ? client.name : ''}" placeholder="الاسم الثلاثي">
                    </div>
                    <div class="form-group">
                        <label>تاريخ الاشتراك</label>
                        <input type="date" name="joinDate" class="form-control" required value="${client ? client.joinDate : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>العمر (سنة)</label>
                        <input type="number" name="age" class="form-control" value="${client ? client.age : ''}">
                    </div>
                    <div class="form-group">
                        <label>الطول (سم)</label>
                        <input type="number" name="height" class="form-control" value="${client ? client.height : ''}">
                    </div>
                    <div class="form-group">
                        <label>الوزن الابتدائي (كجم)</label>
                        <input type="number" name="startWeight" class="form-control" required value="${client ? (client.startWeight || client.currentWeight) : ''}" placeholder="الوزن عند التسجيل">
                    </div>
                    
                    <div class="form-group">
                        <label>الوزن الحالي (كجم)</label>
                        <input type="number" name="currentWeight" class="form-control" readonly style="background-color: #f3f4f6; color:#6b7280; cursor:not-allowed;" value="${client ? client.currentWeight : '0'}" title="يتم تحديث الوزن الحالي من خلال سجل المتابعة">
                        <small style="color:gray; font-size:10px;">يتم التحديث تلقائياً من سجل المتابعة أو يساوي الوزن الابتدائي عند الإضافة</small>
                    </div>
                    <div class="form-group">
                        <label>الوزن المستهدف (كجم)</label>
                        <input type="number" name="targetWeight" class="form-control" value="${client ? client.targetWeight : ''}">
                    </div>
                    <div class="form-group">
                        <label>حالة الاشتراك</label>
                        <select name="status" class="form-control">
                            <option value="active" ${client && client.status === 'active' ? 'selected' : ''}>نشط</option>
                            <option value="inactive" ${client && client.status === 'inactive' ? 'selected' : ''}>غير فعال</option>
                        </select>
                    </div>
                    <div class="form-group form-grid-full">
                        <label>ملاحظات صحية</label>
                        <textarea name="notes" class="form-control" rows="3">${client ? client.notes : ''}</textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        <i class="ph ph-floppy-disk"></i> حفظ البيانات
                    </button>
                </div>
            </form>
        </div>
    `,

    clientDetail: (client) => `
        <header class="top-bar">
            <div style="display:flex; align-items:center; gap:12px;">
                <button class="btn-sm" onclick="app.navigate('dashboard')">
                    <i class="ph ph-arrow-right"></i>
                </button>
                <h2 id="page-title">${client.name}</h2>
                <span class="status ${client.status}">${client.status === 'active' ? 'نشط' : 'غير فعال'}</span>
            </div>
            
            <div style="display:flex; gap:10px;">
                <button class="btn-sm" onclick="app.confirmAction('هل أنت متأكد من تغيير حالة الاشتراك؟', () => app.toggleStatus('${client.id}'))">
                    ${client.status === 'active' ? '<i class="ph ph-pause"></i> تجميد' : '<i class="ph ph-play"></i> تفعيل'}
                </button>
                <button class="btn-primary" onclick="app.navigate('edit-client', '${client.id}')">
                    <i class="ph ph-pencil-simple"></i> تعديل
                </button>
            </div>
        </header>

        <div class="goal-tracker-card">
            <div class="goal-header">
                <div>
                     ${(() => {
            const start = parseFloat(client.startWeight) || 0;
            const current = parseFloat(client.currentWeight) || 0;
            const target = parseFloat(client.targetWeight) || 0;

            const isGain = target > start;
            // const remaining = Math.abs(target - current);

            // Check reached
            const reached = isGain ? (current >= target) : (current <= target);

            let msg = "🚀 بداية موفقة، الرحلة بدأت للتو!";
            if (reached) msg = "🎉 مبروك! لقد وصل هذا المشترك إلى هدفه!";
            // Simple progress check
            const progress = Math.abs(current - start);
            if (!reached && progress > 2) msg = "💪 تقدم ممتاز، استمر في العمل الرائع!";

            return `
                        <h3>متتبع الهدف ${isGain ? '(زيادة وزن)' : '(خسارة وزن)'}</h3>
                        <div class="goal-message">${msg}</div>
                        `;
        })()}
                </div>
                <div style="text-align:left;">
                    <span style="font-size:14px; opacity:0.7;">باقي للهدف</span>
                    <div style="font-size:24px; font-weight:800;">
                        ${Math.abs(parseFloat(client.currentWeight || 0) - parseFloat(client.targetWeight || 0)).toFixed(1)} <span style="font-size:14px;">كجم</span>
                    </div>
                </div>
            </div>

            <div class="goal-progress-container">
                <div class="goal-progress-bar" style="width: 0%" id="client-progress-bar"></div>
            </div>
            
            <div class="goal-stats">
                 <div class="goal-stat-item">
                    <h4>البداية</h4>
                    <p>${client.startWeight || '--'}</p>
                 </div>
                 <div class="goal-stat-item">
                    <h4>الحالي</h4>
                    <p>${client.currentWeight || '--'}</p>
                 </div>
                 <div class="goal-stat-item">
                    <h4>الهدف</h4>
                    <p>${client.targetWeight || '--'}</p>
                 </div>
                 <div class="goal-stat-item" style="margin-right:auto;">
                    <h4>${(parseFloat(client.targetWeight) > parseFloat(client.startWeight)) ? 'زيادة' : 'تغيير'}</h4>
                    <p style="color:#4ade80; direction:ltr;">${(parseFloat(client.currentWeight || 0) - parseFloat(client.startWeight || 0)).toFixed(1)}</p>
                 </div>
            </div>
            
            <!-- Trigger animation after render -->
            <img src="" onerror="
                setTimeout(() => {
                    const start = ${parseFloat(client.startWeight) || 0};
                    const current = ${parseFloat(client.currentWeight) || 0};
                    const target = ${parseFloat(client.targetWeight) || 0};
                    
                    const totalDist = Math.abs(target - start);
                    const progressDist = Math.abs(current - start);
                    
                    let pct = 0;
                    if(totalDist > 0) {
                        const isGain = target > start;
                        // Only count progress if moving in right direction
                        const movingRightWay = isGain ? (current >= start) : (current <= start);
                        
                        if(movingRightWay) {
                            pct = (progressDist / totalDist) * 100;
                        }
                    }
                    if(start == target) pct = 100; // Edge case
                    
                    const bar = document.getElementById('client-progress-bar');
                    if(bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
                }, 100);
                this.style.display='none';
            ">
        </div>

        <div class="client-header">
            <div class="client-info-group">
                <div class="info-item"><h4>العمر</h4><p>${client.age || '--'} <span style="font-size:14px; font-weight:400; color:gray">سنة</span></p></div>
                <div class="info-item"><h4>الطول</h4><p>${client.height || '--'} <span style="font-size:14px; font-weight:400; color:gray">سم</span></p></div>
                 <!-- Removed weights from here since they are in the tracker now, keeping Age/Height -->
            </div>
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="app.switchTab('schedule', this)">الجدول الاسبوعي</button>
            <button class="tab-btn" onclick="app.switchTab('progress', this)">سجل المتابعة</button>
            <button class="tab-btn" onclick="app.switchTab('photos', this)">الصور</button>
            <button class="tab-btn" onclick="app.switchTab('system', this)">نظام المشترك</button>
        </div>

        <!-- Tab: Editable Schedule (Split Layout: Fixed Legend + Compact Scrollable Days) -->
        <div id="schedule" class="tab-content active">
            <div class="section-header">
                <h3>جدول التمارين والوجبات</h3>
                <div style="display:flex; gap:10px;">
                    ${(() => {
            const hasSchedule = client.systemPages && client.systemPages.some(p => p.type === 'schedule');
            return `
                            <button class="btn-sm" onclick="app.addSystemPage('schedule')" title="تضمين في النظام" ${hasSchedule ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
                                ${hasSchedule ? '<i class="ph ph-check-circle" style="color:#166534; font-weight:bold;"></i> تم التضمين' : '<i class="ph ph-plus-circle"></i> تضمين في النظام'}
                            </button>
                            <button class="btn-sm" onclick="app.removeSystemPageByType('schedule')" title="إخفاء من النظام" style="${hasSchedule ? 'background:#fee2e2; color:#dc2626; border:1px solid #fecaca;' : 'background:#f3f4f6; color:#9ca3af; border:1px solid #e5e7eb; cursor:not-allowed;'}" ${!hasSchedule ? 'disabled' : ''}>
                                <i class="ph ph-minus-circle"></i> إخفاء من النظام
                            </button>
                        `;
        })()}
                    <div style="width:1px; background:#ccc; margin:0 5px;"></div>
                    <button class="btn-sm" onclick="app.enableScheduleEdit('${client.id}')" id="edit-schedule-btn">
                        <i class="ph ph-pencil"></i> تعديل الجدول
                    </button>
                </div>
                <div id="save-schedule-actions" style="display:none; gap:10px;">
                    <button class="btn-sm" onclick="app.cancelScheduleEdit('${client.id}')">إلغاء</button>
                    <button class="btn-primary" onclick="app.saveSchedule('${client.id}')">حفظ التغييرات</button>
                </div>
            </div>

            <form id="schedule-form" class="schedule-split-container">
                <!-- Fixed Legend (Right) -->
                <div class="schedule-side-legend">
                    <div class="legend-header-cell">اليوم</div>
                    <div class="legend-item-cell"><i class="ph ph-coffee"></i> الفطور</div>
                    <div class="legend-item-cell"><i class="ph ph-bowl-food"></i> الغداء</div>
                    <div class="legend-item-cell"><i class="ph ph-moon"></i> العشاء</div>
                    <div class="legend-item-cell highlight"><i class="ph ph-barbell"></i> التمرين</div>
                </div>

                <!-- Scrollable Days Area -->
                <div class="schedule-days-scroll-area">
                    ${(client.schedule || []).map((day, index) => `
                        <div class="day-strip">
                            <div class="day-strip-header">${day.day}</div>
                            <div class="day-strip-body">
                                <div class="strip-input-wrapper">
                                    <textarea class="strip-input schedule-input" name="breakfast_${index}" readonly rows="1">${day.breakfast || ''}</textarea>
                                </div>
                                <div class="strip-input-wrapper">
                                    <textarea class="strip-input schedule-input" name="lunch_${index}" readonly rows="1">${day.lunch || ''}</textarea>
                                </div>
                                <div class="strip-input-wrapper">
                                    <textarea class="strip-input schedule-input" name="dinner_${index}" readonly rows="1">${day.dinner || ''}</textarea>
                                </div>
                                <div class="strip-input-wrapper highlight">
                                    <textarea class="strip-input schedule-input center-text" name="workout_${index}" readonly rows="1" placeholder="راحة">${day.workout || ''}</textarea>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </form>
        </div>

        <!-- Tab: Detailed Progress Stats -->
        <div id="progress" class="tab-content">
             <div class="recent-clients-section">
                <div class="section-header">
                    <h3>سجل القياسات والوزن</h3>
                    <div style="display:flex; gap:10px;">
                        ${(() => {
            const hasProgress = client.systemPages && client.systemPages.some(p => p.type === 'progress');
            return `
                                <button class="btn-sm" onclick="app.addSystemPage('progress')" title="تضمين في النظام" ${hasProgress ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}>
                                    ${hasProgress ? '<i class="ph ph-check-circle" style="color:#166534; font-weight:bold;"></i> تم التضمين' : '<i class="ph ph-plus-circle"></i> تضمين في النظام'}
                                </button>
                                <button class="btn-sm" onclick="app.removeSystemPageByType('progress')" title="إخفاء من النظام" style="${hasProgress ? 'background:#fee2e2; color:#dc2626; border:1px solid #fecaca;' : 'background:#f3f4f6; color:#9ca3af; border:1px solid #e5e7eb; cursor:not-allowed;'}" ${!hasProgress ? 'disabled' : ''}>
                                    <i class="ph ph-minus-circle"></i> إخفاء من النظام
                                </button>
                            `;
        })()}
                        <div style="width:1px; background:#ccc; margin:0 5px;"></div>
                        <button class="btn-sm" onclick="app.resetProgressForm(); document.getElementById('add-progress-form').style.display='block'">
                            <i class="ph ph-plus"></i> إضافة تحديث
                        </button>
                    </div>
                </div>

                <!-- Add/Edit Progress Form -->
                <div id="add-progress-form" style="display:none; background:var(--color-gray-50); padding:24px; border-radius:16px; margin-bottom:24px; border:1px solid var(--color-gray-200);">
                    <h4 id="progress-form-title" style="margin-bottom:16px;">إضافة تحديث جديد</h4>
                    <form id="real-progress-form" onsubmit="app.handleAddProgress(event, '${client.id}')">
                        <input type="hidden" name="logId" id="progress-log-id">
                        <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); gap:16px;">
                            <div class="form-group">
                                <label>التاريخ</label>
                                <input type="date" name="date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>الوزن (كجم)</label>
                                <input type="number" name="weight" class="form-control" required>
                            </div>
                             <div class="form-group">
                                <label>صورة (اختياري)</label>
                                <input type="file" name="photo" class="form-control" accept="image/*">
                            </div>

                            <div class="form-group">
                                <label>محيط الصدر (سم)</label>
                                <input type="number" name="chest" class="form-control">
                            </div>
                             <div class="form-group">
                                <label>محيط الخصر (سم)</label>
                                <input type="number" name="waist" class="form-control">
                            </div>
                             <div class="form-group">
                                <label>محيط الأرداف (سم)</label>
                                <input type="number" name="hips" class="form-control">
                            </div>
                        </div>
                        
                        <div class="form-actions" style="margin-top:16px;">
                            <button type="button" class="btn-secondary" onclick="app.resetProgressForm(); document.getElementById('add-progress-form').style.display='none'">إلغاء</button>
                            <button type="submit" class="btn-primary" id="progress-submit-btn">حفظ التحديث</button>
                        </div>
                    </form>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>الوزن</th>
                                <th>صدر</th>
                                <th>خصر</th>
                                <th>أرداف</th>
                                <th>الصورة</th>
                                <th>إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${client.progressLogs && client.progressLogs.length > 0 ? client.progressLogs.map(log => `
                                <tr>
                                    <td>${log.date}</td>
                                    <td style="font-weight:bold; color:var(--primary-600)">${log.weight} كجم</td>
                                    <td>${log.measurements?.chest || '-'}</td>
                                    <td>${log.measurements?.waist || '-'}</td>
                                    <td>${log.measurements?.hips || '-'}</td>
                                    <td>${log.photo ? `<img src="${log.photo}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; cursor:pointer;" onclick="app.viewImage('${log.photo}')">` : '-'}</td>
                                    <td>
                                        <div style="display:flex; gap:6px; justify-content:center;">
                                            <button class="btn-sm" style="color:var(--primary-600); background:transparent;" onclick="app.editProgress('${client.id}', ${log.id})" title="تعديل">
                                                <i class="ph ph-pencil-simple"></i>
                                            </button>
                                            <button class="btn-sm" style="color:#ef4444; background:transparent;" onclick="app.confirmAction('حذف هذا التحديث؟', () => app.deleteProgress('${client.id}', ${log.id}))" title="حذف">
                                                <i class="ph ph-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).reverse().join('') : '<tr><td colspan="7" style="text-align:center; padding:20px; color:gray">لا توجد سجلات بعد</td></tr>'}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>

        <!-- Tab: Photos (Gallery) -->
        <div id="photos" class="tab-content">
             <div class="recent-clients-section">
                <!-- Helper to upload specific gallery photos if needed, or just show from progress -->
                 <div class="gallery-grid">
                    ${client.progressLogs && client.progressLogs.filter(l => l.photo).length > 0 ?
            client.progressLogs.filter(l => l.photo).map(l => `
                            <div class="gallery-item">
                                <img src="${l.photo}" onclick="app.viewImage('${l.photo}')">
                            </div>
                        `).join('')
            :
            `<div style="text-align:center; color:gray; grid-column:1/-1; padding:40px;">
                        <i class="ph ph-image" style="font-size:32px;"></i>
                        <p>لا توجد صور. قم بإضافة تحديث جديد مع صورة لتظهر هنا.</p>
                    </div>`}
                </div>
            </div>
        </div>

        <!-- Tab: System (Word-like Editor) -->
        <div id="system" class="tab-content">
            <div class="section-header">
                    <h3>نظام المشترك</h3>
                    <div style="display:flex; gap:10px;">
                    
                    <button class="btn-sm" style="background:#fee2e2; color:#dc2626; border:1px solid #fecaca;" onclick="app.resetSystemPages()" title="حذف جميع الصفحات والبدء من جديد">
                        <i class="ph ph-trash"></i> تصفير
                    </button>
                    <button class="btn-sm" onclick="app.exportSystemPDF('${client.name}')">
                        <i class="ph ph-file-pdf"></i> تصدير PDF
                    </button>
                    <button class="btn-primary" onclick="app.saveSystemData('${client.id}')">
                        <i class="ph ph-floppy-disk"></i> حفظ النظام
                    </button>
                    </div>
            </div>
            
            <div class="editor-wrapper-a4">
                 <!-- Zoom Controls -->
                 <div class="zoom-toolbar" style="width:100%; display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:15px; direction:ltr;">
                    <button class="btn-sm" onclick="app.adjustZoom(-0.1)" title="تصغير" style="background:white;"><i class="ph ph-minus"></i></button>
                    <span id="zoom-level-indicator" style="font-variant-numeric: tabular-nums; font-weight:bold; color:var(--color-gray-600); min-width:45px; text-align:center;">100%</span>
                    <button class="btn-sm" onclick="app.adjustZoom(0.1)" title="تكبير" style="background:white;"><i class="ph ph-plus"></i></button>
                    <div style="width:1px; height:20px; background:#e5e7eb; margin:0 5px;"></div>
                    <button class="btn-sm" onclick="app.resetZoom()" title="fit" style="background:white; font-size:12px;">Fit</button>
                 </div>

                 <div class="scalable-content" style="transform-origin:top center; transition:transform 0.2s; display:flex; flex-direction:column; align-items:center;">
                     <!-- Tabs Container -->
                     <div class="system-tabs-container">
                        ${(() => {
            const pages = (client.systemPages && client.systemPages.length > 0) ? client.systemPages : [''];
            const activeIdx = app.currentSystemPageIndex || 0;
            let tabsHtml = '';
            pages.forEach((page, i) => {
                const pageData = (typeof page === 'object') ? page : { title: `صفحة ${i + 1}` };
                const pageTitle = pageData.title || `صفحة ${i + 1}`;
                const icon = pageData.type === 'schedule' ? '<i class="ph ph-table" style="font-size:12px; margin-left:4px;"></i> ' :
                    pageData.type === 'progress' ? '<i class="ph ph-chart-line-up" style="font-size:12px; margin-left:4px;"></i> ' : '';

                tabsHtml += `<div class="system-tab ${i === activeIdx ? 'active' : ''}" onclick="app.switchSystemPage(${i})" ondblclick="app.renameSystemPage(${i})">
                                    ${icon}<span class="tab-title">${pageTitle}</span>
                                    ${pages.length > 1 ? `<span class="close-tab" onclick="event.stopPropagation(); app.deleteSystemPage(${i})">&times;</span>` : ''}
                                 </div>`;
            });
            tabsHtml += `<button class="add-page-btn" onclick="app.addSystemPage()" title="إضافة صفحة">+</button>`;
            return tabsHtml;
        })()}
                     </div>

                     <!-- A4 Paper Visual -->
                     <div class="a4-page">
                          <!-- Watermark -->
                          <div class="watermark-overlay"></div>
                          
                          <!-- Header -->
                          <div class="a4-header">
                                <img src="img/company_logo.png" class="header-logo" alt="Logo">
                                
                                <div class="header-page-title" id="current-page-title">
                                    ${(() => {
            const pages = client.systemPages || [];
            const activeIdx = app.currentSystemPageIndex || 0;
            const page = pages[activeIdx];
            return (typeof page === 'object' && page.title) ? page.title : `صفحة ${activeIdx + 1}`;
        })()}
                                </div>

                                <img src="img/qr_code.png" class="header-qr" alt="Instagram">
                          </div>

                          <!-- Content -->
                          <div class="editor-wrapper-inner">
                            <textarea id="tinymce-editor"></textarea>
                            <!-- Dynamic Content Preview (Hidden by default) -->
                            <div id="dynamic-page-preview" style="display:none; width:100%; height:100%; overflow:hidden; padding:10px;"></div>
                          </div>
                     </div>
                 </div>
            </div>
        </div>
    `,

    renderScheduleTable: (client) => `
        <div class="schedule-print-view">
            <h3>الجدول الاسبوعي - ${client.name}</h3>
            <table class="schedule-table-print" style="width:100%; border-collapse:collapse; direction:rtl;">
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="border:1px solid #ccc; padding:8px;">اليوم</th>
                        <th style="border:1px solid #ccc; padding:8px;">الفطور</th>
                        <th style="border:1px solid #ccc; padding:8px;">الغداء</th>
                        <th style="border:1px solid #ccc; padding:8px;">العشاء</th>
                        <th style="border:1px solid #ccc; padding:8px;">التمرين</th>
                    </tr>
                </thead>
                <tbody>
                    ${(client.schedule || []).map(day => `
                        <tr>
                            <td style="border:1px solid #ccc; padding:8px; font-weight:bold;">${day.day}</td>
                            <td style="border:1px solid #ccc; padding:8px;">${day.breakfast || '-'}</td>
                            <td style="border:1px solid #ccc; padding:8px;">${day.lunch || '-'}</td>
                            <td style="border:1px solid #ccc; padding:8px;">${day.dinner || '-'}</td>
                            <td style="border:1px solid #ccc; padding:8px;">${day.workout || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `,

    renderProgressTable: (client) => {
        const start = parseFloat(client.startWeight) || 0;
        const current = parseFloat(client.currentWeight) || 0;
        const target = parseFloat(client.targetWeight) || 0;
        const totalToLose = Math.abs(start - target);
        const lost = Math.abs(start - current);
        let pct = 0;
        if (totalToLose > 0) {
            pct = (lost / totalToLose) * 100;
        }
        pct = Math.min(100, Math.max(0, pct));
        const isGain = target > start;
        const statusMsg = pct >= 100 ? "🎉 تم الوصول للهدف!" : (pct > 50 ? "🔥 اقتربت من الهدف!" : "💪 بداية قوية!");

        return `
        <div class="progress-print-view">
            <h3>سجل المتابعة - ${client.name}</h3>
            
            <!-- Progress Stats Highlight -->
            <div style="margin:20px 0; padding:15px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; display:flex; align-items:center; justify-content:space-between; direction:rtl;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 5px 0;">نسبة الإنجاز</h4>
                    <div style="font-size:14px; color:#6b7280;">${statusMsg}</div>
                </div>
                <div style="flex:2; margin:0 20px;">
                    <div style="height:12px; width:100%; background:#e5e7eb; border-radius:6px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%; background:${pct >= 100 ? '#22c55e' : 'var(--primary-500)'};"></div>
                    </div>
                </div>
                <div style="font-size:24px; font-weight:bold; color:var(--primary-700);">${pct.toFixed(1)}%</div>
            </div>

            <table class="data-table" style="width:100%; border-collapse:collapse; direction:rtl; margin-top:20px;">
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="border:1px solid #ccc; padding:8px;">التاريخ</th>
                        <th style="border:1px solid #ccc; padding:8px;">الوزن</th>
                        <th style="border:1px solid #ccc; padding:8px;">صدر</th>
                        <th style="border:1px solid #ccc; padding:8px;">خصر</th>
                        <th style="border:1px solid #ccc; padding:8px;">أرداف</th>
                    </tr>
                </thead>
                <tbody>
                    ${client.progressLogs && client.progressLogs.length > 0 ? client.progressLogs.map(log => `
                        <tr>
                            <td style="border:1px solid #ccc; padding:8px;">${log.date}</td>
                            <td style="border:1px solid #ccc; padding:8px;">${log.weight} كجم</td>
                            <td style="border:1px solid #ccc; padding:8px;">${log.measurements?.chest || '-'}</td>
                            <td style="border:1px solid #ccc; padding:8px;">${log.measurements?.waist || '-'}</td>
                            <td style="border:1px solid #ccc; padding:8px;">${log.measurements?.hips || '-'}</td>
                        </tr>
                    `).reverse().join('') : '<tr><td colspan="5" style="border:1px solid #ccc; padding:8px; text-align:center;">لا توجد سجلات</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
    },

    clientsPage: (clients) => `
        <header class="top-bar">
            <h2 id="page-title">المشتركين</h2>
            <div class="user-profile" onclick="app.showUserProfile()">
                <div class="user-info-text">
                    <span class="admin-name">${localStorage.getItem('rawan_admin_name') || 'المشرف'}</span>
                    <span class="admin-role">Admin</span>
                </div>
                <div class="avatar"><i class="ph ph-user"></i></div>
            </div>
        </header>

        <div class="recent-clients-section">
            <div class="section-header">
                <h3>إدارة المشتركين</h3>
                <button class="btn-primary" onclick="app.navigate('add-client')">
                    <i class="ph ph-plus-circle"></i> إضافة مشترك
                </button>
            </div>
            
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>تاريخ الانضمام</th>
                            <th>الوزن</th>
                            <th>الحالة</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(client => `
                            <tr>
                                <td>${client.name}</td>
                                <td>${client.joinDate}</td>
                                <td>${client.currentWeight} كجم</td>
                                <td><span class="status ${client.status}">${client.status === 'active' ? 'نشط' : 'غير فعال'}</span></td>
                                <td>
                                    <div style="display:flex; gap:8px; justify-content:flex-end;">
                                        <button class="btn-sm" onclick="app.viewClient('${client.id}')" title="عرض"><i class="ph ph-eye"></i></button>
                                        <button class="btn-sm" style="background:#fef2f2; color:#ef4444;" onclick="app.confirmAction('حذف المشترك؟', () => app.deleteClient('${client.id}'))" title="حذف"><i class="ph ph-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `,

    settings: () => `
        <header class="top-bar">
            <h2 id="page-title">الإعدادات</h2>
            <div class="user-profile" onclick="app.showUserProfile()">
                <div class="user-info-text">
                    <span class="admin-name">${localStorage.getItem('rawan_admin_name') || 'المشرف'}</span>
                    <span class="admin-role">Admin</span>
                </div>
                <div class="avatar"><i class="ph ph-user"></i></div>
            </div>
        </header>
        
        <div class="form-card">
            <h3>النسخ الاحتياطي والاستعادة</h3>
            <p>يمكنك تحميل نسخة من جميع بيانات المشتركين كملف JSON واستعادتها لاحقاً.</p>
            <div style="display:flex; gap:16px; margin-top:20px;">
                <button class="btn-primary" onclick="dataManager.downloadBackup()">
                    <i class="ph ph-download-simple"></i> تحميل نسخة احتياطية
                </button>
                
                <input type="file" id="backup-file" style="display:none;" onchange="dataManager.restoreBackup(this)">
                <button class="btn-secondary" onclick="document.getElementById('backup-file').click()">
                    <i class="ph ph-upload-simple"></i> استعادة نسخة (Restore)
                </button>
            </div>
        </div>
        
        <div class="form-card" style="margin-top:20px;">
            <h3>تسجيل الخروج</h3>
            <button class="btn-sm" style="background:#fee2e2; color:#dc2626; margin-top:10px;" onclick="app.handleLogout()">
                <i class="ph ph-sign-out"></i> تسجيل الخروج
            </button>
        </div>
        
        <!-- Hidden Image Viewer -->
        <div id="image-viewer-modal" class="image-viewer" onclick="this.style.display='none'">
            <span class="close-viewer">&times;</span>
            <img class="viewer-content" id="full-image">
        </div>
    `,

    modal: (msg, type = 1) => `
        <div class="modal-overlay" id="custom-modal" style="display:flex;">
            <div class="modal-card">
                <h3 style="margin-bottom:16px;">تأكيد</h3>
                <p>${msg}</p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="app.closeModal()">إلغاء</button>
                    <button class="btn-primary" onclick="app.executeConfirm(0)" style="background:#ef4444; border-color:#ef4444;">تأكيد</button>
                </div>
            </div>
        </div>
    `,

    userProfileModal: () => `
        <div class="modal-overlay" id="user-profile-modal" style="display:flex;" onclick="if(event.target === this) this.remove()">
            <div class="profile-card-modal">
                <div class="profile-header">
                    <div class="profile-avatar"><i class="ph ph-user"></i></div>
                    <h3>${localStorage.getItem('rawan_admin_name') || 'المشرف'}</h3>
                    <p>مدير النظام</p>
                </div>
                <div class="profile-body">
                    <div class="profile-item" onclick="app.openCustomInput('تغيير الاسم', 'الاسم الجديد', '${localStorage.getItem('rawan_admin_name') || ''}', app.changeName.bind(app))">
                        <i class="ph ph-pencil-simple"></i>
                        <span>تغيير الاسم</span>
                    </div>
                    <div class="profile-item" onclick="app.openCustomInput('تغيير كلمة المرور', 'كلمة المرور الجديدة', '', app.changePassword.bind(app))">
                        <i class="ph ph-lock-key"></i>
                        <span>تغيير كلمة المرور</span>
                    </div>
                     <div class="profile-item" onclick="setTheme('theme-orange')">
                        <div class="theme-circle" style="background:#f97316;"></div>
                        <span>ثيم برتقالي</span>
                    </div>
                     <div class="profile-item" onclick="setTheme('theme-green')">
                        <div class="theme-circle" style="background:#10b981;"></div>
                        <span>ثيم أخضر</span>
                    </div>
                     <div class="profile-item" onclick="setTheme('theme-blue')">
                        <div class="theme-circle" style="background:#3b82f6;"></div>
                        <span>ثيم أزرق</span>
                    </div>
                </div>
            </div>
        </div>
    `,

    inputModal: (title, label, value) => `
        <div class="modal-overlay" id="input-modal" style="display:flex;">
            <div class="modal-card">
                <h3>${title}</h3>
                <div class="form-group" style="margin:20px 0;">
                    <label>${label}</label>
                    <input type="text" id="modal-input-field" class="form-control" value="${value}">
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button class="btn-primary" onclick="app.submitInputModal()">حفظ</button>
                </div>
            </div>
        </div>
    `,

    imageModal: (src) => `
        <div class="image-viewer" style="display:flex;" onclick="this.remove()">
             <span class="close-viewer">&times;</span>
            <img class="viewer-content" src="${src}" style="max-height:90vh; max-width:90vw;">
        </div>
    `
};

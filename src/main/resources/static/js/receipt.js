(function () {
    'use strict';

    var currentPage  = 0;
    var totalPages   = 0;
    var pageSize     = 50;
    var modalMode    = null; // 'add' | 'edit'
    var editTargetId = null;
    var startPicker    = null;
    var endPicker      = null;
    var modalDatePicker = null;
    var settingQuick   = false;

    var receiptTableWrap = document.getElementById('receiptTableWrap');
    var receiptTbody     = document.getElementById('receiptTbody');
    var receiptEmpty     = document.getElementById('receiptEmpty');
    var receiptSummary   = document.getElementById('receiptSummary');
    var paginationEl     = document.getElementById('pagination');
    var pageSizeSelect   = document.getElementById('pageSizeSelect');
    var modalOverlay          = document.getElementById('modalOverlay');
    var modalTitle            = document.getElementById('modalTitle');
    var modalSaveBtn          = document.getElementById('modalSaveBtn');
    var modalName             = document.getElementById('modalName');
    var modalAmount           = document.getElementById('modalAmount');
    var modalUsedDate         = document.getElementById('modalUsedDate');
    var modalParentEl         = document.getElementById('modalParentCategory');
    var modalChildEl          = document.getElementById('modalChildCategory');
    var modalInstallmentGroup = document.getElementById('modalInstallmentGroup');
    var modalInstallmentEl    = document.getElementById('modalInstallment');
    var filterParentEl        = document.getElementById('filterParentCategory');
    var filterChildEl         = document.getElementById('filterChildCategory');
    var bulkAddBtn            = document.getElementById('bulkAddBtn');
    var bulkModalOverlay      = document.getElementById('bulkModalOverlay');
    var bulkTbody             = document.getElementById('bulkTbody');
    var bulkAddRowBtn         = document.getElementById('bulkAddRowBtn');
    var bulkCancelBtn         = document.getElementById('bulkCancelBtn');
    var bulkSaveBtn           = document.getElementById('bulkSaveBtn');
    var bulkSummary           = document.getElementById('bulkSummary');
    var excelUploadBtn        = document.getElementById('excelUploadBtn');
    var excelFileInput        = document.getElementById('excelFileInput');

    /* ─── 카테고리 이름 캐시 (목록 렌더링용) ────────────── */

    var RECEIPT_TYPE_LABEL = { F: '고정', O: '일회성' };
    var categoryNameMap = {}; // categoryId(소분류) -> { name, parentName }
    var parentNameMap   = {}; // parentCategoryId(대분류) -> name

    function buildCategoryNameMap() {
        var parentOptions = Array.prototype.slice.call(filterParentEl.options)
            .filter(function (o) { return o.value; });

        parentOptions.forEach(function (opt) {
            parentNameMap[opt.value] = opt.textContent;
        });

        var promises = parentOptions.map(function (opt) {
            return fetch('/category/list?parentId=' + opt.value)
                .then(function (r) { return r.json(); })
                .then(function (r) {
                    (r.data || []).forEach(function (c) {
                        categoryNameMap[c.id] = { name: c.name, parentName: opt.textContent };
                    });
                })
                .catch(function () {});
        });

        return Promise.all(promises);
    }

    /* ─── 초기화 ─────────────────────────────────────────── */

    function init() {
        initDatePickers();
        buildCategoryNameMap().then(apiSearch);
    }

    /* ─── Flatpickr 초기화 ───────────────────────────────── */

    var localeKo = {
        days:        ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
        daysShort:   ['일', '월', '화', '수', '목', '금', '토'],
        daysMin:     ['일', '월', '화', '수', '목', '금', '토'],
        months:      ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        monthsShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        today:       '오늘',
        clear:       '지우기',
        dateFormat:  'yyyy.MM.dd',
        timeFormat:  'HH:mm',
        firstDay:    0
    };

    function initDatePickers() {
        startPicker = new AirDatepicker('#filterStartDate', {
            locale:     localeKo,
            dateFormat: 'yyyy.MM.dd',
            autoClose:  true,
            onSelect: function (opts) {
                endPicker.update({minDate: opts.date || null});
                if (!settingQuick) clearQuickActive();
            }
        });

        endPicker = new AirDatepicker('#filterEndDate', {
            locale:     localeKo,
            dateFormat: 'yyyy.MM.dd',
            autoClose:  true,
            onSelect: function () {
                if (!settingQuick) clearQuickActive();
            }
        });

        modalDatePicker = new AirDatepicker('#modalUsedDate', {
            locale:     localeKo,
            dateFormat: 'yyyy.MM.dd',
            autoClose:  true
        });
    }

    function clearQuickActive() {
        document.querySelectorAll('.btn-quick').forEach(function (btn) {
            btn.classList.remove('btn-quick--active');
        });
    }

    function setQuickDate(start, end, activeBtn) {
        settingQuick = true;
        startPicker.selectDate(start);
        endPicker.update({minDate: start});
        endPicker.selectDate(end);
        settingQuick = false;
        clearQuickActive();
        activeBtn.classList.add('btn-quick--active');
    }

    /* ─── 카테고리 로드 ──────────────────────────────────── */

    function loadChildCategories(parentId, selectEl, placeholder, selectedId) {
        selectEl.innerHTML = '<option value="">' + placeholder + '</option>';
        selectEl.disabled = true;

        if (!parentId) return;

        fetch('/category/list?parentId=' + parentId)
        .then(function (res) { return res.json(); })
        .then(function (res) {
            var children = res.data || [];
            children.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                if (selectedId && Number(selectedId) === c.id) opt.selected = true;
                selectEl.appendChild(opt);
            });
            selectEl.disabled = false;
        })
        .catch(function () {});
    }

    /* ─── 렌더링 ─────────────────────────────────────────── */

    function renderPage(data) {
        totalPages  = data.totalPages  || 0;
        currentPage = data.currentPage || 0;

        receiptTbody.innerHTML = '';

        if (!data.content || data.content.length === 0) {
            receiptTableWrap.classList.add('hidden');
            receiptEmpty.classList.remove('hidden');
            paginationEl.innerHTML = '';
            renderSummary([]);
            return;
        }

        receiptTableWrap.classList.remove('hidden');
        receiptEmpty.classList.add('hidden');
        data.content.forEach(function (item) {
            receiptTbody.appendChild(makeRow(item));
        });

        renderSummary(data.content);
        renderPagination(totalPages, currentPage);
    }

    function makeRow(item) {
        var tr = document.createElement('tr');
        tr.dataset.id = item.id;

        var badgeClass        = item.receiptType === 'F' ? 'receipt-badge--fix' : 'receipt-badge--once';
        var receiptTypeLabel  = RECEIPT_TYPE_LABEL[item.receiptType] || item.receiptType;
        var parentName        = parentNameMap[item.parentCategoryId] || '';
        var categoryInfo      = item.categoryId ? categoryNameMap[item.categoryId] : null;
        var categoryCell      = categoryInfo ? esc(parentName) + ' &gt; ' + esc(categoryInfo.name) : esc(parentName);

        tr.innerHTML =
            '<td>' + formatDate(item.usedDate) + '</td>' +
            '<td class="col-name">' + esc(item.name) + '</td>' +
            '<td>' + categoryCell + '</td>' +
            '<td><span class="receipt-badge ' + badgeClass + '">' + esc(receiptTypeLabel) + '</span></td>' +
            '<td class="col-amount">' + Number(item.amount).toLocaleString() + '원</td>' +
            '<td class="col-actions">' +
                '<button class="btn btn--secondary btn--sm edit-btn">수정</button>' +
                '<button class="btn btn--secondary btn--sm delete-btn">삭제</button>' +
            '</td>';

        tr.querySelector('.edit-btn').addEventListener('click', function () {
            openEditModal(item);
        });
        tr.querySelector('.delete-btn').addEventListener('click', function () {
            showConfirmRow(tr, item.id);
        });

        return tr;
    }

    function showConfirmRow(tr, id) {
        var existing = receiptTbody.querySelector('.receipt-row--confirm');
        if (existing) existing.remove();

        var confirmTr = document.createElement('tr');
        confirmTr.className = 'receipt-row--confirm';
        confirmTr.innerHTML =
            '<td colspan="6">' +
                '<span class="receipt-confirm__text">정말 삭제하시겠습니까?</span>' +
                '<button class="btn btn--danger btn--sm confirm-btn">확인</button>' +
                '<button class="btn btn--secondary btn--sm cancel-btn">취소</button>' +
            '</td>';

        confirmTr.querySelector('.confirm-btn').addEventListener('click', function () {
            apiDelete(id, tr, confirmTr);
        });
        confirmTr.querySelector('.cancel-btn').addEventListener('click', function () {
            confirmTr.remove();
        });

        tr.insertAdjacentElement('afterend', confirmTr);
    }

    /* ─── 총계 렌더링 ────────────────────────────────────── */

    function renderSummary(content) {
        if (!content || content.length === 0) {
            receiptSummary.classList.add('hidden');
            return;
        }

        var totalCount = content.length;
        var fixedTotal = content
            .filter(function (item) { return item.receiptType === 'F'; })
            .reduce(function (sum, item) { return sum + Number(item.amount); }, 0);
        var onceTotal = content
            .filter(function (item) { return item.receiptType === 'O'; })
            .reduce(function (sum, item) { return sum + Number(item.amount); }, 0);
        var grandTotal = fixedTotal + onceTotal;

        receiptSummary.innerHTML =
            '<div class="receipt-summary__item">' +
                '<span class="receipt-summary__label">총 건수</span>' +
                '<span class="receipt-summary__value">' + totalCount + '건</span>' +
            '</div>' +
            '<div class="receipt-summary__sep"></div>' +
            '<div class="receipt-summary__item">' +
                '<span class="receipt-summary__label">고정</span>' +
                '<span class="receipt-summary__value">' + fixedTotal.toLocaleString() + '원</span>' +
            '</div>' +
            '<div class="receipt-summary__sep"></div>' +
            '<div class="receipt-summary__item">' +
                '<span class="receipt-summary__label">일회성</span>' +
                '<span class="receipt-summary__value">' + onceTotal.toLocaleString() + '원</span>' +
            '</div>' +
            '<div class="receipt-summary__sep"></div>' +
            '<div class="receipt-summary__item">' +
                '<span class="receipt-summary__label">합계</span>' +
                '<span class="receipt-summary__value receipt-summary__value--total">' + grandTotal.toLocaleString() + '원</span>' +
            '</div>';

        receiptSummary.classList.remove('hidden');
    }

    /* ─── 페이지네이션 ───────────────────────────────────── */

    function renderPagination(total, current) {
        paginationEl.innerHTML = '';
        if (total <= 1) return;

        var prevBtn = makePagBtn('‹', current === 0, function () {
            currentPage = current - 1;
            apiSearch();
        });
        paginationEl.appendChild(prevBtn);

        for (var i = 0; i < total; i++) {
            (function (pageIdx) {
                var btn = makePagBtn(pageIdx + 1, false, function () {
                    currentPage = pageIdx;
                    apiSearch();
                });
                if (pageIdx === current) btn.classList.add('pagination__btn--active');
                paginationEl.appendChild(btn);
            })(i);
        }

        var nextBtn = makePagBtn('›', current === total - 1, function () {
            currentPage = current + 1;
            apiSearch();
        });
        paginationEl.appendChild(nextBtn);
    }

    function makePagBtn(label, disabled, onClick) {
        var btn = document.createElement('button');
        btn.className = 'pagination__btn';
        btn.textContent = label;
        btn.disabled = disabled;
        if (!disabled) btn.addEventListener('click', onClick);
        return btn;
    }

    /* ─── 모달 ───────────────────────────────────────────── */

    function openAddModal() {
        modalMode = 'add';
        editTargetId = null;
        modalTitle.textContent = '사용내역 등록';
        modalSaveBtn.textContent = '저장';
        modalName.value = '';
        modalAmount.value = '';
        modalDatePicker.clear();
        document.querySelector('input[name="modalReceiptType"][value="O"]').checked = true;
        document.querySelector('input[name="modalPaymentType"][value="C"]').checked = true;
        modalInstallmentEl.value = '001';
        modalInstallmentGroup.classList.remove('hidden');
        resetModalCategories();
        clearModalErrors();
        modalOverlay.classList.remove('hidden');
        modalName.focus();
    }

    function openEditModal(item) {
        modalMode = 'edit';
        editTargetId = item.id;
        modalTitle.textContent = '사용내역 수정';
        modalSaveBtn.textContent = '수정';
        modalName.value = item.name;
        modalAmount.value = Number(item.amount).toLocaleString();
        modalDatePicker.selectDate(new Date(toInputDate(item.usedDate)));
        var typeRadio = document.querySelector('input[name="modalReceiptType"][value="' + item.receiptType + '"]');
        if (typeRadio) typeRadio.checked = true;
        var ptVal = item.paymentType || 'C';
        var ptRadio = document.querySelector('input[name="modalPaymentType"][value="' + ptVal + '"]');
        if (ptRadio) ptRadio.checked = true;
        modalInstallmentEl.value = item.installment || '001';
        modalInstallmentGroup.classList.toggle('hidden', ptVal === 'M');
        clearModalErrors();

        resetModalCategories();
        modalParentEl.value = item.parentCategoryId;
        loadChildCategories(item.parentCategoryId, modalChildEl, '소분류를 선택하세요', item.categoryId);

        modalOverlay.classList.remove('hidden');
    }

    function resetModalCategories() {
        modalParentEl.value = '';
        modalChildEl.innerHTML = '<option value="">소분류를 선택하세요</option>';
        modalChildEl.disabled = true;
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        modalMode = null;
        editTargetId = null;
    }

    function clearModalErrors() {
        ['modalNameError', 'modalAmountError', 'modalUsedDateError', 'modalParentError', 'modalChildError'].forEach(function (id) {
            document.getElementById(id).classList.add('hidden');
        });
    }

    /* ─── 일괄 등록 ──────────────────────────────────────── */

    var INSTALLMENT_OPTIONS_HTML =
        '<option value="001">일시불</option>' +
        '<option value="002">2개월 할부</option>' +
        '<option value="003">3개월 할부</option>' +
        '<option value="004">4개월 할부</option>' +
        '<option value="005">5개월 할부</option>' +
        '<option value="006">6개월 할부</option>' +
        '<option value="007">7개월 할부</option>' +
        '<option value="008">8개월 할부</option>' +
        '<option value="009">9개월 할부</option>' +
        '<option value="010">10개월 할부</option>' +
        '<option value="011">11개월 할부</option>' +
        '<option value="012">12개월 할부</option>';

    function openBulkModal() {
        destroyBulkDatePickers();
        bulkTbody.innerHTML = '';
        addBulkRow();
        bulkModalOverlay.classList.remove('hidden');
    }

    function destroyBulkDatePickers() {
        bulkTbody.querySelectorAll('.bulk-row').forEach(function (tr) {
            if (tr._datePicker) tr._datePicker.destroy();
        });
    }

    function closeBulkModal() {
        bulkModalOverlay.classList.add('hidden');
    }

    function addBulkRow() {
        var tr = document.createElement('tr');
        tr.className = 'bulk-row';
        tr.innerHTML =
            '<td><input type="text" class="form-input bulk-date" placeholder="날짜를 선택하세요" readonly></td>' +
            '<td><input type="text" class="form-input bulk-name" maxlength="32" placeholder="사용명"></td>' +
            '<td><input type="text" class="form-input bulk-amount" inputmode="numeric" placeholder="금액"></td>' +
            '<td>' +
                '<select class="form-select bulk-receipt-type">' +
                    '<option value="O">일회성</option>' +
                    '<option value="F">고정</option>' +
                '</select>' +
            '</td>' +
            '<td><select class="form-select bulk-parent">' + modalParentEl.innerHTML + '</select></td>' +
            '<td><select class="form-select bulk-child" disabled><option value="">소분류</option></select></td>' +
            '<td>' +
                '<select class="form-select bulk-payment">' +
                    '<option value="C">카드</option>' +
                    '<option value="M">현금</option>' +
                '</select>' +
            '</td>' +
            '<td><select class="form-select bulk-installment">' + INSTALLMENT_OPTIONS_HTML + '</select></td>' +
            '<td class="col-actions"><button type="button" class="btn btn--secondary btn--sm bulk-remove-btn">삭제</button></td>';

        tr._datePicker = new AirDatepicker(tr.querySelector('.bulk-date'), {
            locale:     localeKo,
            dateFormat: 'yyyy.MM.dd',
            autoClose:  true
        });

        tr.querySelector('.bulk-remove-btn').addEventListener('click', function () {
            removeBulkRow(tr);
        });
        tr.querySelector('.bulk-parent').addEventListener('change', function () {
            loadChildCategories(this.value, tr.querySelector('.bulk-child'), '소분류', null);
        });
        tr.querySelector('.bulk-payment').addEventListener('change', function () {
            var installmentSelect = tr.querySelector('.bulk-installment');
            if (this.value === 'M') {
                installmentSelect.value = '001';
                installmentSelect.disabled = true;
            } else {
                installmentSelect.disabled = false;
            }
        });
        tr.querySelector('.bulk-amount').addEventListener('input', function () {
            var digits = this.value.replace(/[^0-9]/g, '');
            this.value = digits ? Number(digits).toLocaleString() : '';
            updateBulkSummary();
        });

        bulkTbody.appendChild(tr);
        updateBulkSummary();
    }

    function removeBulkRow(tr) {
        if (bulkTbody.querySelectorAll('.bulk-row').length <= 1) return;
        if (tr._datePicker) tr._datePicker.destroy();
        tr.remove();
        updateBulkSummary();
    }

    function updateBulkSummary() {
        var rows  = Array.prototype.slice.call(bulkTbody.querySelectorAll('.bulk-row'));
        var total = rows.reduce(function (sum, row) {
            var amount = row.querySelector('.bulk-amount').value.replace(/,/g, '');
            return sum + (Number(amount) || 0);
        }, 0);
        bulkSummary.textContent = '총 ' + rows.length + '건 · ' + total.toLocaleString() + '원';

        var disableRemove = rows.length <= 1;
        rows.forEach(function (row) {
            row.querySelector('.bulk-remove-btn').disabled = disableRemove;
        });
    }

    function readBulkRow(tr) {
        var name        = tr.querySelector('.bulk-name').value.trim();
        var amount      = tr.querySelector('.bulk-amount').value.replace(/,/g, '').trim();
        var picker      = tr._datePicker;
        var usedDate    = picker && picker.selectedDates.length > 0 ? dateToYMD(picker.selectedDates[0]) : '';
        var receiptType = tr.querySelector('.bulk-receipt-type').value;
        var parentId    = tr.querySelector('.bulk-parent').value;
        var childId     = tr.querySelector('.bulk-child').value;
        var paymentType = tr.querySelector('.bulk-payment').value;
        var installment = paymentType === 'C' ? tr.querySelector('.bulk-installment').value : '001';

        var valid = !!(name && amount && usedDate && parentId);
        tr.classList.toggle('bulk-row--invalid', !valid);
        if (!valid) return null;

        return {
            name:             name,
            receiptType:      receiptType,
            paymentType:      paymentType,
            installment:      installment,
            amount:           Number(amount),
            usedDate:         usedDate,
            parentCategoryId: Number(parentId),
            categoryId:       childId ? Number(childId) : null
        };
    }

    function handleBulkSave() {
        var rows   = Array.prototype.slice.call(bulkTbody.querySelectorAll('.bulk-row'));
        var bodies = rows.map(readBulkRow);

        if (bodies.some(function (b) { return b === null; })) {
            showToast('입력값을 확인해 주세요.', 'error');
            return;
        }

        bulkSaveBtn.disabled = true;

        fetch('/receipt/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receipts: bodies })
        })
        .then(function (res) { return res.json(); })
        .then(function (res) {
            bulkSaveBtn.disabled = false;
            if (res.code === '200') {
                showToast(bodies.length + '건 등록되었습니다.', 'success');
                closeBulkModal();
                apiSearch();
            } else {
                showToast(res.message || '일괄 등록에 실패했습니다.', 'error');
            }
        })
        .catch(function () {
            bulkSaveBtn.disabled = false;
            showToast('일괄 등록에 실패했습니다.', 'error');
        });
    }

    /* ─── 엑셀 업로드 ────────────────────────────────────── */

    function handleExcelUpload() {
        var file = excelFileInput.files[0];
        if (!file) return;

        excelFileInput.value = ''; // 같은 파일 재선택 시에도 change 재발화 보장

        if (!/\.xlsx$/i.test(file.name)) {
            alert('엑셀 파일(.xlsx)만 업로드할 수 있습니다.');
            return;
        }

        var formData = new FormData();
        formData.append('file', file);

        excelUploadBtn.disabled = true;

        fetch('/receipt/excel', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (res) {
            excelUploadBtn.disabled = false;
            if (res.code === '200') {
                alert('엑셀 등록이 완료되었습니다.');
                apiSearch();
            } else {
                alert(res.message || '엑셀 업로드에 실패했습니다.');
            }
        })
        .catch(function () {
            excelUploadBtn.disabled = false;
            alert('엑셀 업로드에 실패했습니다.');
        });
    }

    /* ─── 저장 처리 ──────────────────────────────────────── */

    function handleSave() {
        var name        = modalName.value.trim();
        var amount      = modalAmount.value.replace(/,/g, '').trim();
        var usedDate    = modalDatePicker.selectedDates.length > 0 ? dateToYMD(modalDatePicker.selectedDates[0]) : '';
        var parentId    = modalParentEl.value;
        var childId     = modalChildEl.value;
        var type        = document.querySelector('input[name="modalReceiptType"]:checked').value;
        var paymentType = document.querySelector('input[name="modalPaymentType"]:checked').value;
        var installment = paymentType === 'C' ? modalInstallmentEl.value : '001';
        var valid       = true;

        document.getElementById('modalNameError').classList.toggle('hidden', !!name);
        document.getElementById('modalAmountError').classList.toggle('hidden', !!amount);
        document.getElementById('modalUsedDateError').classList.toggle('hidden', !!usedDate);
        document.getElementById('modalParentError').classList.toggle('hidden', !!parentId);

        if (!name || !amount || !usedDate || !parentId) valid = false;
        if (!valid) return;

        var body = {
            name:             name,
            receiptType:      type,
            paymentType:      paymentType,
            installment:      installment,
            amount:           Number(amount),
            usedDate:         usedDate,
            parentCategoryId: Number(parentId),
            categoryId:       childId ? Number(childId) : null
        };

        if (modalMode === 'add') {
            apiCreate(body);
        } else {
            apiUpdate(editTargetId, body);
        }
    }

    /* ─── API ────────────────────────────────────────────── */

    function apiSearch() {
        var name       = document.getElementById('filterName').value.trim();
        var parentId   = filterParentEl.value;
        var childId    = filterChildEl.value;
        var startDate  = startPicker.selectedDates.length > 0 ? dateToYMD(startPicker.selectedDates[0]) : '';
        var endDate    = endPicker.selectedDates.length   > 0 ? dateToYMD(endPicker.selectedDates[0])   : '';

        var params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate)   params.set('endDate', endDate);
        if (parentId)  params.set('parentCategoryId', parentId);
        if (childId)   params.set('categoryId', childId);
        if (name)      params.set('name', name);
        params.set('page', currentPage);
        params.set('size', pageSize);

        fetch('/receipt/list?' + params.toString())
        .then(function (res) { return res.json(); })
        .then(function (res) {
            if (res.code !== '200') {
                showToast(res.message || '조회에 실패했습니다.', 'error');
                return;
            }
            renderPage({
                content:       res.data || [],
                totalPages:    res.totalPages    || 0,
                totalElements: res.totalElements || 0,
                currentPage:   res.currentPage != null ? res.currentPage : currentPage,
                pageSize:      res.pageSize || pageSize
            });
        })
        .catch(function () {
            showToast('조회에 실패했습니다.', 'error');
        });
    }

    function apiCreate(body) {
        fetch('/receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (res) { return res.json(); })
        .then(function (res) {
            if (res.code === '200') {
                showToast('등록되었습니다.', 'success');
                closeModal();
                apiSearch();
            } else {
                showToast(res.message || '등록에 실패했습니다.', 'error');
            }
        })
        .catch(function () {
            showToast('등록에 실패했습니다.', 'error');
        });
    }

    function apiUpdate(id, body) {
        body.id = Number(id);

        fetch('/receipt', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (res) { return res.json(); })
        .then(function (res) {
            if (res.code === '200') {
                showToast('수정되었습니다.', 'success');
                closeModal();
                apiSearch();
            } else {
                showToast(res.message || '수정에 실패했습니다.', 'error');
            }
        })
        .catch(function () {
            showToast('수정에 실패했습니다.', 'error');
        });
    }

    function apiDelete(id, tr, confirmTr) {
        // TODO: DELETE /receipt/{id}
        showToast('API 연동 전입니다.', 'error');
        confirmTr.remove();
    }

    /* ─── 유틸 ───────────────────────────────────────────── */

    function formatDate(str) {
        if (!str || str.length !== 8) return str || '';
        return str.slice(0, 4) + '.' + str.slice(4, 6) + '.' + str.slice(6, 8);
    }

    function toInputDate(str) {
        if (!str || str.length !== 8) return '';
        return str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6, 8);
    }

    function dateToYMD(date) {
        var m = date.getMonth() + 1;
        var d = date.getDate();
        return '' + date.getFullYear() + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
    }

    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ─── 이벤트 바인딩 ──────────────────────────────────── */

    modalAmount.addEventListener('input', function () {
        var digits = this.value.replace(/[^0-9]/g, '');
        this.value = digits ? Number(digits).toLocaleString() : '';
    });

    document.getElementById('addReceiptBtn').addEventListener('click', openAddModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalSaveBtn').addEventListener('click', handleSave);

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (!bulkModalOverlay.classList.contains('hidden')) closeBulkModal();
        else closeModal();
    });

    excelUploadBtn.addEventListener('click', function () { excelFileInput.click(); });
    excelFileInput.addEventListener('change', handleExcelUpload);

    bulkAddBtn.addEventListener('click', openBulkModal);
    bulkAddRowBtn.addEventListener('click', addBulkRow);
    bulkCancelBtn.addEventListener('click', closeBulkModal);
    bulkSaveBtn.addEventListener('click', handleBulkSave);

    document.getElementById('searchBtn').addEventListener('click', function () {
        currentPage = 0;
        apiSearch();
    });

    document.getElementById('resetBtn').addEventListener('click', function () {
        startPicker.clear();
        endPicker.clear();
        endPicker.update({minDate: null});
        clearQuickActive();
        filterParentEl.value = '';
        filterChildEl.innerHTML = '<option value="">소분류 전체</option>';
        filterChildEl.disabled = true;
        document.getElementById('filterName').value = '';
        currentPage = 0;
        apiSearch();
    });

    document.querySelectorAll('.btn-quick').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var now = new Date();
            var quick = this.dataset.quick;
            var start, end;

            if (quick === 'this-month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (quick === 'last-month') {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end   = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (quick === 'last-3-months') {
                start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }

            setQuickDate(start, end, this);
        });
    });

    filterParentEl.addEventListener('change', function () {
        loadChildCategories(this.value, filterChildEl, '소분류 전체', null);
    });

    modalParentEl.addEventListener('change', function () {
        loadChildCategories(this.value, modalChildEl, '소분류를 선택하세요', null);
    });

    document.querySelectorAll('input[name="modalPaymentType"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            if (this.value === 'M') {
                modalInstallmentGroup.classList.add('hidden');
                modalInstallmentEl.value = '001';
            } else {
                modalInstallmentGroup.classList.remove('hidden');
            }
        });
    });

    pageSizeSelect.addEventListener('change', function () {
        pageSize    = Number(this.value);
        currentPage = 0;
        apiSearch();
    });

    /* ─── 시작 ───────────────────────────────────────────── */

    init();

})();

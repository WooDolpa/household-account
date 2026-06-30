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

    /* ─── 더미 데이터 (API 연동 전 임시) ────────────────── */

    var DUMMY_ALL = (function () {
        var templates = [
            { name: '스타벅스 아메리카노', receiptType: 'O', receiptTypeLabel: '일회성', amount: 5500,   categoryId: 2, categoryName: '카페',   parentCategoryName: '식비' },
            { name: '월세',               receiptType: 'F', receiptTypeLabel: '고정',   amount: 550000, categoryId: 5, categoryName: '주거비', parentCategoryName: '주거' },
            { name: '점심 식사',           receiptType: 'O', receiptTypeLabel: '일회성', amount: 12000,  categoryId: 3, categoryName: '식사',   parentCategoryName: '식비' },
            { name: '넷플릭스',            receiptType: 'F', receiptTypeLabel: '고정',   amount: 17000,  categoryId: 8, categoryName: '구독',   parentCategoryName: '여가' },
            { name: '편의점',              receiptType: 'O', receiptTypeLabel: '일회성', amount: 3200,   categoryId: 3, categoryName: '식사',   parentCategoryName: '식비' },
            { name: '버스비',              receiptType: 'O', receiptTypeLabel: '일회성', amount: 1500,   categoryId: 7, categoryName: '교통',   parentCategoryName: '교통' },
            { name: '헬스장',              receiptType: 'F', receiptTypeLabel: '고정',   amount: 70000,  categoryId: 9, categoryName: '운동',   parentCategoryName: '여가' },
            { name: '마트',                receiptType: 'O', receiptTypeLabel: '일회성', amount: 45000,  categoryId: 4, categoryName: '식료품', parentCategoryName: '식비' },
            { name: '통신비',              receiptType: 'F', receiptTypeLabel: '고정',   amount: 55000,  categoryId: 6, categoryName: '통신',   parentCategoryName: '생활' },
            { name: '영화',                receiptType: 'O', receiptTypeLabel: '일회성', amount: 14000,  categoryId: 8, categoryName: '구독',   parentCategoryName: '여가' },
        ];
        var result = [];
        for (var i = 0; i < 55; i++) {
            var t   = templates[i % templates.length];
            var day = ((i * 7) % 28) + 1;
            result.push({
                id:               i + 1,
                name:             t.name + (i >= templates.length ? ' ' + (Math.floor(i / templates.length) + 1) : ''),
                receiptType:      t.receiptType,
                receiptTypeLabel: t.receiptTypeLabel,
                amount:           t.amount,
                usedDate:         '202606' + (day < 10 ? '0' + day : '' + day),
                categoryId:       t.categoryId,
                categoryName:     t.categoryName,
                parentCategoryName: t.parentCategoryName
            });
        }
        return result;
    })();

    /* ─── 초기화 ─────────────────────────────────────────── */

    function init() {
        initDatePickers();
        apiSearch();
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

        var badgeClass = item.receiptType === 'F' ? 'receipt-badge--fix' : 'receipt-badge--once';

        tr.innerHTML =
            '<td>' + formatDate(item.usedDate) + '</td>' +
            '<td class="col-name">' + esc(item.name) + '</td>' +
            '<td>' + esc(item.parentCategoryName) + ' &gt; ' + esc(item.categoryName) + '</td>' +
            '<td><span class="receipt-badge ' + badgeClass + '">' + esc(item.receiptTypeLabel) + '</span></td>' +
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
        setModalParent(item);

        modalOverlay.classList.remove('hidden');
    }

    function resetModalCategories() {
        modalParentEl.value = '';
        modalChildEl.innerHTML = '<option value="">소분류를 선택하세요</option>';
        modalChildEl.disabled = true;
    }

    function setModalParent(item) {
        Array.prototype.slice.call(modalParentEl.options)
            .filter(function (o) { return o.value; })
            .forEach(function (opt) {
                fetch('/category/list?parentId=' + opt.value)
                .then(function (r) { return r.json(); })
                .then(function (r) {
                    var children = r.data || [];
                    var match = children.find(function (c) { return c.id === item.categoryId; });
                    if (match) {
                        modalParentEl.value = opt.value;
                        loadChildCategories(opt.value, modalChildEl, '소분류를 선택하세요', item.categoryId);
                    }
                })
                .catch(function () {});
            });
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
        document.getElementById('modalChildError').classList.toggle('hidden', !!childId);

        if (!name || !amount || !usedDate || !parentId || !childId) valid = false;
        if (!valid) return;

        var body = {
            name:        name,
            receiptType: type,
            paymentType: paymentType,
            installment: installment,
            amount:      Number(amount),
            usedDate:    usedDate,
            categoryId:  Number(childId)
        };

        if (modalMode === 'add') {
            apiCreate(body);
        } else {
            apiUpdate(editTargetId, body);
        }
    }

    /* ─── API ────────────────────────────────────────────── */

    function apiSearch() {
        // TODO: 백엔드 연동 시 아래 더미 로직을 fetch('GET /receipt/list') 로 교체
        var name      = document.getElementById('filterName').value.trim().toLowerCase();
        var childId   = filterChildEl.value;
        var startDate = startPicker.selectedDates.length > 0 ? startPicker.selectedDates[0] : null;
        var endDate   = endPicker.selectedDates.length   > 0 ? endPicker.selectedDates[0]   : null;
        var startStr  = startDate ? dateToYMD(startDate) : null;
        var endStr    = endDate   ? dateToYMD(endDate)   : null;

        var filtered = DUMMY_ALL.filter(function (item) {
            if (name    && item.name.toLowerCase().indexOf(name) === -1) return false;
            if (childId && String(item.categoryId) !== childId)          return false;
            if (startStr && item.usedDate < startStr)                    return false;
            if (endStr   && item.usedDate > endStr)                      return false;
            return true;
        });

        var total          = filtered.length;
        var totalPagesCalc = Math.max(1, Math.ceil(total / pageSize));
        if (currentPage >= totalPagesCalc) currentPage = 0;

        renderPage({
            content:       filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
            totalPages:    totalPagesCalc,
            totalElements: total,
            currentPage:   currentPage,
            pageSize:      pageSize
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
        // TODO: PUT /receipt
        showToast('API 연동 전입니다.', 'error');
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
        if (e.key === 'Escape') closeModal();
    });

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

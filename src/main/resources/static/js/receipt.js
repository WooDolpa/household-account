(function () {
    'use strict';

    var currentPage = 0;
    var totalPages = 0;
    var pageSize = 12;
    var modalMode = null; // 'add' | 'edit'
    var editTargetId = null;

    var receiptGrid    = document.getElementById('receiptGrid');
    var receiptEmpty   = document.getElementById('receiptEmpty');
    var paginationEl   = document.getElementById('pagination');
    var modalOverlay   = document.getElementById('modalOverlay');
    var modalTitle     = document.getElementById('modalTitle');
    var modalSaveBtn   = document.getElementById('modalSaveBtn');
    var modalName      = document.getElementById('modalName');
    var modalAmount    = document.getElementById('modalAmount');
    var modalUsedDate  = document.getElementById('modalUsedDate');
    var modalParentEl  = document.getElementById('modalParentCategory');
    var modalChildEl   = document.getElementById('modalChildCategory');
    var filterParentEl = document.getElementById('filterParentCategory');
    var filterChildEl  = document.getElementById('filterChildCategory');

    /* ─── 더미 데이터 (API 연동 전 임시) ────────────────── */

    var DUMMY_DATA = {
        content: [
            { id: 1, name: '스타벅스 아메리카노', receiptType: 'O', receiptTypeLabel: '일회성', amount: 5500,  usedDate: '20260601', categoryId: 2, categoryName: '카페', parentCategoryName: '식비' },
            { id: 2, name: '월세',               receiptType: 'F', receiptTypeLabel: '고정',   amount: 550000, usedDate: '20260601', categoryId: 5, categoryName: '주거비', parentCategoryName: '주거' },
            { id: 3, name: '점심 식사',           receiptType: 'O', receiptTypeLabel: '일회성', amount: 12000,  usedDate: '20260602', categoryId: 3, categoryName: '식사', parentCategoryName: '식비' },
            { id: 4, name: '넷플릭스',            receiptType: 'F', receiptTypeLabel: '고정',   amount: 17000,  usedDate: '20260601', categoryId: 8, categoryName: '구독', parentCategoryName: '여가' },
            { id: 5, name: '편의점',              receiptType: 'O', receiptTypeLabel: '일회성', amount: 3200,   usedDate: '20260603', categoryId: 3, categoryName: '식사', parentCategoryName: '식비' },
        ],
        totalPages: 1,
        totalElements: 5,
        currentPage: 0,
        pageSize: 12
    };

    /* ─── 초기화 ─────────────────────────────────────────── */

    function init() {
        loadCategories();
        renderPage(DUMMY_DATA);
    }

    /* ─── 카테고리 로드 (기존 API 활용) ──────────────────── */

    function loadCategories() {
        fetch('/category/parent/list')
        .then(function (res) { return res.json(); })
        .then(function (res) {
            var parents = res.data || [];
            populateParentSelect(filterParentEl, '대분류 전체', parents);
            populateParentSelect(modalParentEl, '대분류를 선택하세요', parents);
        })
        .catch(function () {});
    }

    function populateParentSelect(selectEl, placeholder, parents) {
        selectEl.innerHTML = '<option value="">' + placeholder + '</option>';
        parents.forEach(function (p) {
            var opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            selectEl.appendChild(opt);
        });
    }

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
        totalPages = data.totalPages || 0;
        currentPage = data.currentPage || 0;

        receiptGrid.innerHTML = '';

        if (!data.content || data.content.length === 0) {
            receiptEmpty.classList.remove('hidden');
            paginationEl.innerHTML = '';
            return;
        }

        receiptEmpty.classList.add('hidden');
        data.content.forEach(function (item) {
            receiptGrid.appendChild(makeCard(item));
        });

        renderPagination(totalPages, currentPage);
    }

    function makeCard(item) {
        var card = document.createElement('div');
        card.className = 'receipt-card';
        card.dataset.id = item.id;

        var badgeClass = item.receiptType === 'F' ? 'receipt-card__badge--fix' : 'receipt-card__badge--once';
        var usedDateFormatted = formatDate(item.usedDate);
        var amountFormatted = Number(item.amount).toLocaleString() + '원';

        card.innerHTML =
            '<div class="receipt-card__top">' +
                '<span class="receipt-card__name">' + esc(item.name) + '</span>' +
                '<span class="receipt-card__badge ' + badgeClass + '">' + esc(item.receiptTypeLabel) + '</span>' +
            '</div>' +
            '<div class="receipt-card__amount">' + amountFormatted + '</div>' +
            '<div class="receipt-card__meta">' +
                '<div class="receipt-card__meta-item">' +
                    '<span class="receipt-card__meta-label">사용일</span>' +
                    '<span>' + usedDateFormatted + '</span>' +
                '</div>' +
                '<div class="receipt-card__meta-item">' +
                    '<span class="receipt-card__meta-label">카테고리</span>' +
                    '<span>' + esc(item.parentCategoryName) + ' &gt; ' + esc(item.categoryName) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="receipt-card__divider"></div>' +
            '<div class="receipt-card__actions">' +
                '<button class="btn btn--secondary btn--sm edit-btn">수정</button>' +
                '<button class="btn btn--secondary btn--sm delete-btn">삭제</button>' +
            '</div>' +
            '<div class="receipt-card__confirm">' +
                '<span class="receipt-card__confirm-text">정말 삭제하시겠습니까?</span>' +
                '<button class="btn btn--danger btn--sm confirm-btn">확인</button>' +
                '<button class="btn btn--secondary btn--sm cancel-btn">취소</button>' +
            '</div>';

        card.querySelector('.edit-btn').addEventListener('click', function () {
            openEditModal(item);
        });
        card.querySelector('.delete-btn').addEventListener('click', function () {
            card.classList.add('receipt-card--confirming');
        });
        card.querySelector('.confirm-btn').addEventListener('click', function () {
            apiDelete(item.id, card);
        });
        card.querySelector('.cancel-btn').addEventListener('click', function () {
            card.classList.remove('receipt-card--confirming');
        });

        return card;
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
        modalUsedDate.value = '';
        document.querySelector('input[name="modalReceiptType"][value="O"]').checked = true;
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
        modalAmount.value = item.amount;
        modalUsedDate.value = toInputDate(item.usedDate);
        var typeRadio = document.querySelector('input[name="modalReceiptType"][value="' + item.receiptType + '"]');
        if (typeRadio) typeRadio.checked = true;
        clearModalErrors();

        resetModalCategories();
        setTimeout(function () {
            setModalParent(item, function () {
                loadChildCategories(item.categoryId ? modalParentEl.value : null, modalChildEl, '소분류를 선택하세요', item.categoryId);
            });
        }, 0);

        modalOverlay.classList.remove('hidden');
    }

    function resetModalCategories() {
        var firstParent = modalParentEl.options[0];
        modalParentEl.innerHTML = '';
        modalParentEl.appendChild(firstParent.cloneNode(true));
        modalParentEl.value = '';
        modalChildEl.innerHTML = '<option value="">소분류를 선택하세요</option>';
        modalChildEl.disabled = true;
    }

    function setModalParent(item, cb) {
        fetch('/category/parent/list')
        .then(function (res) { return res.json(); })
        .then(function (res) {
            var parents = res.data || [];
            populateParentSelect(modalParentEl, '대분류를 선택하세요', parents);
            if (item.categoryId) {
                fetch('/category/list?parentId=' + modalParentEl.value)
                .catch(function () {});
            }
            parents.forEach(function (p) {
                fetch('/category/list?parentId=' + p.id)
                .then(function (r) { return r.json(); })
                .then(function (r) {
                    var children = r.data || [];
                    var match = children.find(function (c) { return c.id === item.categoryId; });
                    if (match) {
                        modalParentEl.value = p.id;
                        loadChildCategories(p.id, modalChildEl, '소분류를 선택하세요', item.categoryId);
                    }
                })
                .catch(function () {});
            });
        })
        .catch(function () {});
        if (cb) cb();
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
        var name     = modalName.value.trim();
        var amount   = modalAmount.value.trim();
        var usedDate = modalUsedDate.value;
        var parentId = modalParentEl.value;
        var childId  = modalChildEl.value;
        var type     = document.querySelector('input[name="modalReceiptType"]:checked').value;
        var valid    = true;

        document.getElementById('modalNameError').classList.toggle('hidden', !!name);
        document.getElementById('modalAmountError').classList.toggle('hidden', !!amount);
        document.getElementById('modalUsedDateError').classList.toggle('hidden', !!usedDate);
        document.getElementById('modalParentError').classList.toggle('hidden', !!parentId);
        document.getElementById('modalChildError').classList.toggle('hidden', !!childId);

        if (!name || !amount || !usedDate || !parentId || !childId) valid = false;
        if (!valid) return;

        var body = {
            name: name,
            receiptType: type,
            amount: Number(amount),
            usedDate: usedDate.replace(/-/g, ''),
            categoryId: Number(childId)
        };

        if (modalMode === 'add') {
            apiCreate(body);
        } else {
            apiUpdate(editTargetId, body);
        }
    }

    /* ─── API (추후 연동) ────────────────────────────────── */

    function apiSearch() {
        // TODO: GET /receipt/list
        // query: startDate, endDate, categoryId, name, page, size
        showToast('API 연동 전입니다.', 'error');
    }

    function apiCreate(body) {
        // TODO: POST /receipt
        showToast('API 연동 전입니다.', 'error');
    }

    function apiUpdate(id, body) {
        // TODO: PUT /receipt
        showToast('API 연동 전입니다.', 'error');
    }

    function apiDelete(id, card) {
        // TODO: DELETE /receipt/{id}
        showToast('API 연동 전입니다.', 'error');
        card.classList.remove('receipt-card--confirming');
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

    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ─── 이벤트 바인딩 ──────────────────────────────────── */

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
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        filterParentEl.value = '';
        filterChildEl.innerHTML = '<option value="">소분류 전체</option>';
        filterChildEl.disabled = true;
        document.getElementById('filterName').value = '';
        currentPage = 0;
        renderPage(DUMMY_DATA);
    });

    filterParentEl.addEventListener('change', function () {
        loadChildCategories(this.value, filterChildEl, '소분류 전체', null);
    });

    modalParentEl.addEventListener('change', function () {
        loadChildCategories(this.value, modalChildEl, '소분류를 선택하세요', null);
    });

    /* ─── 시작 ───────────────────────────────────────────── */

    init();

})();

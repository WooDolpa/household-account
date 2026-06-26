(function () {
    'use strict';

    var selectedParentId = null;
    var selectedParentName = null;
    var modalMode = null; // 'add-parent' | 'add-child' | 'edit-parent' | 'edit-child'
    var editTargetId = null;
    var allParents = [];
    var allChildren = [];

    var parentList = document.getElementById('parentList');
    var childList = document.getElementById('childList');
    var childPanelTitle = document.getElementById('childPanelTitle');
    var addChildBtn = document.getElementById('addChildBtn');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalTitle = document.getElementById('modalTitle');
    var modalNameInput = document.getElementById('modalNameInput');
    var modalNameError = document.getElementById('modalNameError');
    var orderNumGroup = document.getElementById('orderNumGroup');
    var orderNumInputWrap = document.getElementById('orderNumInputWrap');
    var modalOrderNumInput = document.getElementById('modalOrderNumInput');
    var modalOrderNumError = document.getElementById('modalOrderNumError');

    /* ─── Modal ─────────────────────────────────────────── */

    function openModal(mode, prefillName, prefillOrderNum) {
        modalMode = mode;
        modalNameInput.value = prefillName || '';
        modalNameError.classList.add('hidden');
        modalOrderNumError.classList.add('hidden');

        var isEdit = mode === 'edit-parent' || mode === 'edit-child';
        var radioGroup = orderNumGroup.querySelector('.radio-group');

        if (isEdit) {
            radioGroup.classList.add('hidden');
            orderNumInputWrap.classList.remove('hidden');
            modalOrderNumInput.value = prefillOrderNum != null ? prefillOrderNum : '';
        } else {
            radioGroup.classList.remove('hidden');
            document.getElementById('orderNumAuto').checked = true;
            modalOrderNumInput.value = '';
            orderNumInputWrap.classList.add('hidden');
        }

        orderNumGroup.classList.remove('hidden');

        var titles = {
            'add-parent': '대분류 추가',
            'edit-parent': '대분류 수정',
            'add-child': '소분류 추가',
            'edit-child': '소분류 수정'
        };
        modalTitle.textContent = titles[mode];

        document.getElementById('modalSaveBtn').textContent = isEdit ? '수정' : '저장';

        modalOverlay.classList.remove('hidden');
        modalNameInput.focus();
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        modalMode = null;
        editTargetId = null;
    }

    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    /* ─── Modal Save ─────────────────────────────────────── */

    document.getElementById('modalSaveBtn').addEventListener('click', handleSave);

    modalNameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleSave();
    });

    modalOrderNumInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleSave();
    });

    document.querySelectorAll('input[name="orderNumType"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            var isManual = this.value === 'manual';
            orderNumInputWrap.classList.toggle('hidden', !isManual);
            if (!isManual) {
                modalOrderNumInput.value = '';
                modalOrderNumError.classList.add('hidden');
            }
        });
    });

    function handleSave() {
        var name = modalNameInput.value.trim();
        var valid = true;

        if (!name) {
            modalNameError.classList.remove('hidden');
            valid = false;
        } else {
            modalNameError.classList.add('hidden');
        }

        var orderNum = null;
        var orderType = 'auto';
        var isEdit = modalMode === 'edit-parent' || modalMode === 'edit-child';

        if (isEdit) {
            var orderNumVal = modalOrderNumInput.value.trim();
            if (!orderNumVal) {
                modalOrderNumError.classList.remove('hidden');
                valid = false;
            } else {
                modalOrderNumError.classList.add('hidden');
                orderNum = Number(orderNumVal);
                orderType = 'manual';
            }
        } else {
            var isManual = document.getElementById('orderNumManual').checked;
            orderType = isManual ? 'manual' : 'auto';
            if (isManual) {
                var orderNumVal = modalOrderNumInput.value.trim();
                if (!orderNumVal) {
                    modalOrderNumError.classList.remove('hidden');
                    valid = false;
                } else {
                    modalOrderNumError.classList.add('hidden');
                    orderNum = Number(orderNumVal);
                }
            }
        }

        if (!valid) return;

        if (modalMode === 'add-parent') {
            apiCreateParent({ name: name, orderType: orderType, orderNum: orderNum });
        } else if (modalMode === 'add-child') {
            apiCreate({ parentId: selectedParentId, name: name, orderType: orderType, orderNum: orderNum });
        } else if (modalMode === 'edit-parent' || modalMode === 'edit-child') {
            apiUpdate(editTargetId, { name: name, orderType: orderType, orderNum: orderNum });
        }
    }

    /* ─── API ────────────────────────────────────────────── */

    function apiLoadParents() {
        fetch('/category/parent/list')
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function (res) {
            allParents = res.data || [];
            var keyword = document.getElementById('parentSearchInput').value.trim();
            filterParents(keyword);
        })
        .catch(function () {
            parentList.innerHTML = '<li class="category-list__empty">불러오기에 실패했습니다</li>';
        });
    }

    function renderParents(list) {
        parentList.innerHTML = '';
        if (list.length === 0) {
            parentList.innerHTML = '<li class="category-list__empty">등록된 대분류가 없습니다</li>';
            return;
        }
        list.forEach(appendParentItem);
    }

    function filterParents(keyword) {
        if (!keyword) {
            renderParents(allParents);
            return;
        }
        var lower = keyword.toLowerCase();
        var filtered = allParents.filter(function (cat) {
            return cat.name.toLowerCase().indexOf(lower) !== -1;
        });
        if (filtered.length === 0) {
            parentList.innerHTML = '<li class="category-list__empty">검색 결과가 없습니다</li>';
            return;
        }
        renderParents(filtered);
    }

    function apiCreateParent(body) {
        fetch('/category/parent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function () {
            closeModal();
            showToast('대분류가 등록되었습니다.', 'success');
            apiLoadParents();
        })
        .catch(function () {
            showToast('저장에 실패했습니다.', 'error');
        });
    }

    function apiCreate(body) {
        fetch('/category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function () {
            closeModal();
            showToast('소분류가 등록되었습니다.', 'success');
            apiLoadChildren(selectedParentId);
        })
        .catch(function () {
            showToast('저장에 실패했습니다.', 'error');
        });
    }

    function apiUpdate(id, body) {
        fetch('/category/parent', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, name: body.name, orderNum: body.orderNum })
        })
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function () {
            closeModal();
            showToast('수정되었습니다.', 'success');
            apiLoadParents();
        })
        .catch(function () {
            showToast('수정에 실패했습니다.', 'error');
        });
    }

    function apiDeleteParent(id, item) {
        fetch('/category/parent/' + id, { method: 'DELETE' })
        .then(function (res) {
            if (!res.ok) throw new Error();
            showToast('삭제되었습니다.', 'success');
            if (selectedParentId === id) resetChildPanel();
            apiLoadParents();
        })
        .catch(function () {
            item.classList.remove('category-item--confirming');
            showToast('삭제에 실패했습니다.', 'error');
        });
    }

    function apiDelete(id, item) {
        fetch('/api/categories/' + id, { method: 'DELETE' })
        .then(function (res) {
            if (res.status === 400) {
                showDeleteError(item, '소분류가 있어 삭제할 수 없습니다');
                return;
            }
            if (!res.ok) throw new Error();
            item.remove();
        })
        .catch(function () {
            item.classList.remove('category-item--confirming');
            showToast('삭제에 실패했습니다.', 'error');
        });
    }

    function apiLoadChildren(parentId) {
        fetch('/category/list?parentId=' + parentId)
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function (res) {
            allChildren = res.data || [];
            var keyword = document.getElementById('childSearchInput').value.trim();
            filterChildren(keyword);
        })
        .catch(function () {
            childList.innerHTML = '<li class="category-list__empty">불러오기에 실패했습니다</li>';
        });
    }

    function renderChildren(list) {
        childList.innerHTML = '';
        if (list.length === 0) {
            childList.innerHTML = '<li class="category-list__empty">등록된 소분류가 없습니다</li>';
            return;
        }
        list.forEach(appendChildItem);
    }

    function filterChildren(keyword) {
        if (!keyword) {
            renderChildren(allChildren);
            return;
        }
        var lower = keyword.toLowerCase();
        var filtered = allChildren.filter(function (cat) {
            return cat.name.toLowerCase().indexOf(lower) !== -1;
        });
        if (filtered.length === 0) {
            childList.innerHTML = '<li class="category-list__empty">검색 결과가 없습니다</li>';
            return;
        }
        renderChildren(filtered);
    }

    /* ─── DOM Helpers ────────────────────────────────────── */

    function appendParentItem(cat) {
        var li = makeItem(cat.id, cat.name, null, null, null);
        li.dataset.orderNum = cat.orderNum;
        parentList.appendChild(li);
    }

    function appendChildItem(cat) {
        var li = makeItem(cat.id, cat.name, null, null, null);
        li.dataset.orderNum = cat.orderNum;
        childList.appendChild(li);
    }

    function makeItem(id, name, type, badgeClass, badgeLabel) {
        var li = document.createElement('li');
        li.className = 'category-item';
        li.dataset.id = id;
        li.dataset.name = name;
        if (type) li.dataset.type = type;

        var badgeHtml = badgeClass
            ? '<span class="category-item__badge ' + badgeClass + '">' + badgeLabel + '</span>'
            : '';

        li.innerHTML =
            '<div class="category-item__view">' +
                '<span class="category-item__name">' + esc(name) + '</span>' +
                badgeHtml +
                '<div class="category-item__actions">' +
                    '<button class="category-item__btn edit-btn">수정</button>' +
                    '<button class="category-item__btn delete-btn">삭제</button>' +
                '</div>' +
            '</div>' +
            '<div class="category-item__confirm">' +
                '<span class="category-item__confirm-text">정말 삭제하시겠습니까?</span>' +
                '<button class="category-item__btn category-item__btn--danger confirm-btn">확인</button>' +
                '<button class="category-item__btn cancel-btn">취소</button>' +
            '</div>';

        return li;
    }

    function removeEmptyState(list) {
        var empty = list.querySelector('.category-list__empty');
        if (empty) empty.remove();
    }

    function resetChildPanel() {
        selectedParentId = null;
        selectedParentName = null;
        allChildren = [];
        childPanelTitle.textContent = '소분류';
        addChildBtn.disabled = true;
        document.getElementById('childSearchInput').value = '';
        childList.innerHTML = '<li class="category-list__empty">대분류를 선택하세요</li>';
    }

    function showDeleteError(item, message) {
        item.querySelector('.category-item__confirm-text').textContent = message;
        setTimeout(function () {
            item.classList.remove('category-item--confirming');
            item.querySelector('.category-item__confirm-text').textContent = '정말 삭제하시겠습니까?';
        }, 2000);
    }

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ─── Event Delegation — Parent List ────────────────── */

    parentList.addEventListener('click', function (e) {
        var item = e.target.closest('.category-item');
        if (!item) return;

        if (e.target.classList.contains('edit-btn')) {
            editTargetId = Number(item.dataset.id);
            openModal('edit-parent', item.dataset.name, item.dataset.orderNum);
            return;
        }
        if (e.target.classList.contains('delete-btn')) {
            item.classList.add('category-item--confirming');
            return;
        }
        if (e.target.classList.contains('confirm-btn')) {
            apiDeleteParent(Number(item.dataset.id), item);
            return;
        }
        if (e.target.classList.contains('cancel-btn')) {
            item.classList.remove('category-item--confirming');
            return;
        }

        if (item.classList.contains('category-item--confirming')) return;

        document.querySelectorAll('#parentList .category-item').forEach(function (el) {
            el.classList.remove('category-item--selected');
        });
        item.classList.add('category-item--selected');
        selectedParentId = Number(item.dataset.id);
        selectedParentName = item.dataset.name;
        childPanelTitle.textContent = '소분류 — ' + selectedParentName;
        addChildBtn.disabled = false;
        apiLoadChildren(selectedParentId);
    });

    /* ─── Event Delegation — Child List ─────────────────── */

    childList.addEventListener('click', function (e) {
        var item = e.target.closest('.category-item');
        if (!item) return;

        if (e.target.classList.contains('edit-btn')) {
            editTargetId = Number(item.dataset.id);
            openModal('edit-child', item.dataset.name, item.dataset.orderNum);
            return;
        }
        if (e.target.classList.contains('delete-btn')) {
            item.classList.add('category-item--confirming');
            return;
        }
        if (e.target.classList.contains('confirm-btn')) {
            apiDelete(Number(item.dataset.id), item);
            return;
        }
        if (e.target.classList.contains('cancel-btn')) {
            item.classList.remove('category-item--confirming');
            return;
        }
    });

    /* ─── Add Buttons ────────────────────────────────────── */

    document.getElementById('addParentBtn').addEventListener('click', function () {
        openModal('add-parent');
    });

    addChildBtn.addEventListener('click', function () {
        if (!selectedParentId) return;
        openModal('add-child');
    });

    /* ─── Search ─────────────────────────────────────────── */

    document.getElementById('parentSearchInput').addEventListener('input', function () {
        filterParents(this.value.trim());
    });

    document.getElementById('childSearchInput').addEventListener('input', function () {
        filterChildren(this.value.trim());
    });

    /* ─── Init ───────────────────────────────────────────── */

    apiLoadParents();

})();

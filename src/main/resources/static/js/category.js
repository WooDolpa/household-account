(function () {
    'use strict';

    var selectedParentId = null;
    var selectedParentName = null;
    var modalMode = null; // 'add-parent' | 'add-child' | 'edit-parent' | 'edit-child'
    var editTargetId = null;

    var parentList = document.getElementById('parentList');
    var childList = document.getElementById('childList');
    var childPanelTitle = document.getElementById('childPanelTitle');
    var addChildBtn = document.getElementById('addChildBtn');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalTitle = document.getElementById('modalTitle');
    var modalNameInput = document.getElementById('modalNameInput');
    var modalNameError = document.getElementById('modalNameError');

    /* ─── Modal ─────────────────────────────────────────── */

    function openModal(mode, prefillName) {
        modalMode = mode;
        modalNameInput.value = prefillName || '';
        modalNameError.classList.add('hidden');

        var titles = {
            'add-parent': '대분류 추가',
            'edit-parent': '대분류 수정',
            'add-child': '소분류 추가',
            'edit-child': '소분류 수정'
        };
        modalTitle.textContent = titles[mode];

        modalOverlay.classList.remove('hidden');
        modalNameInput.focus();
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        modalMode = null;
        editTargetId = null;
    }

    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    /* ─── Modal Save ─────────────────────────────────────── */

    document.getElementById('modalSaveBtn').addEventListener('click', handleSave);

    modalNameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleSave();
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

        if (!valid) return;

        if (modalMode === 'add-parent') {
            apiCreate({ name: name, parentId: null });
        } else if (modalMode === 'add-child') {
            apiCreate({ name: name, parentId: selectedParentId });
        } else if (modalMode === 'edit-parent' || modalMode === 'edit-child') {
            apiUpdate(editTargetId, { name: name });
        }
    }

    /* ─── API ────────────────────────────────────────────── */

    function apiCreate(body) {
        fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function (data) {
            closeModal();
            if (body.parentId === null) {
                removeEmptyState(parentList);
                appendParentItem(data);
            } else {
                removeEmptyState(childList);
                appendChildItem(data);
            }
        })
        .catch(function () {
            alert('저장에 실패했습니다.');
        });
    }

    function apiUpdate(id, body) {
        fetch('/api/categories/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function (data) {
            closeModal();
            var item = document.querySelector('[data-id="' + id + '"]');
            if (!item) return;
            item.dataset.name = data.name;
            item.querySelector('.category-item__name').textContent = data.name;
            if (selectedParentId === id) {
                selectedParentName = data.name;
                childPanelTitle.textContent = '소분류 — ' + data.name;
            }
        })
        .catch(function () {
            alert('수정에 실패했습니다.');
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
            if (selectedParentId === id) resetChildPanel();
        })
        .catch(function () {
            item.classList.remove('category-item--confirming');
            alert('삭제에 실패했습니다.');
        });
    }

    function apiLoadChildren(parentId) {
        fetch('/api/categories/' + parentId + '/children')
        .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(function (data) {
            childList.innerHTML = '';
            if (data.length === 0) {
                childList.innerHTML = '<li class="category-list__empty">등록된 소분류가 없습니다</li>';
                return;
            }
            data.forEach(appendChildItem);
        })
        .catch(function () {
            childList.innerHTML = '<li class="category-list__empty">불러오기에 실패했습니다</li>';
        });
    }

    /* ─── DOM Helpers ────────────────────────────────────── */

    function appendParentItem(cat) {
        var li = makeItem(cat.id, cat.name, null, null, null);
        parentList.appendChild(li);
    }

    function appendChildItem(cat) {
        var li = makeItem(cat.id, cat.name, null, null, null);
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
        childPanelTitle.textContent = '소분류';
        addChildBtn.disabled = true;
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
            openModal('edit-parent', item.dataset.name);
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
            openModal('edit-child', item.dataset.name);
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

})();

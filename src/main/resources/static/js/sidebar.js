(function () {
    function openGroup(group) {
        var btn = group.querySelector('.sidebar-menu__group-title');
        var submenu = group.querySelector('.sidebar-submenu');
        btn.setAttribute('aria-expanded', 'true');
        submenu.style.maxHeight = submenu.scrollHeight + 'px';
    }

    function closeGroup(group) {
        var btn = group.querySelector('.sidebar-menu__group-title');
        var submenu = group.querySelector('.sidebar-submenu');
        btn.setAttribute('aria-expanded', 'false');
        submenu.style.maxHeight = '0';
    }

    document.querySelectorAll('.sidebar-menu__group-title').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var group = this.closest('.sidebar-menu__group');
            var isOpen = this.getAttribute('aria-expanded') === 'true';

            document.querySelectorAll('.sidebar-menu__group').forEach(closeGroup);

            if (!isOpen) {
                openGroup(group);
            }
        });
    });

    // 활성 서브메뉴 항목이 있는 그룹은 초기 오픈
    document.querySelectorAll('.sidebar-submenu__item--active').forEach(function (item) {
        var group = item.closest('.sidebar-menu__group');
        if (group) openGroup(group);
    });
})();

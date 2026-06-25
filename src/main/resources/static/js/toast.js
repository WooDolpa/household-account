function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'success');
    toast.textContent = message;
    container.appendChild(toast);

    toast.getBoundingClientRect();
    toast.classList.add('toast--visible');

    setTimeout(function () {
        toast.classList.remove('toast--visible');
        toast.classList.add('toast--hiding');
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 1500);
}

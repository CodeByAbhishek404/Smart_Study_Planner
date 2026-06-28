/* Smart Study Planner - Main App Initialization Entry */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Smart Study Planner client loaded successfully!');

    // Initialize global click handlers or notifications if needed
    const notificationBtn = document.getElementById('notif-bell-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            alert('Study Tip: Break study sessions into 50-minute blocks with 10-minute breaks to optimize memory retention!');
        });
    }
});

// =============================================
// UTILS - Funciones reutilizables
// =============================================

function createRatingCircle(rating) {
    const formattedRating = parseFloat(rating).toFixed(1);
    const percentage = Math.min(Math.max(parseFloat(rating) * 10, 0), 100);
    const circumference = 2 * Math.PI * 21;
    const offset = circumference - (circumference * percentage / 100);
    
    return `
        <svg class="rating-circle" width="52" height="52">
            <circle class="bg" cx="26" cy="26" r="21"
                    stroke="#333" stroke-width="5"/>
            <circle class="progress" cx="26" cy="26" r="21"
                    stroke="#22c55e" stroke-width="5"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"/>
        </svg>
        <span class="rating-value">${formattedRating}</span>
    `;
}

window.createRatingCircle = createRatingCircle;
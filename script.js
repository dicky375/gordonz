const templateLoader = document.getElementById('templateLoader');
const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

let templateImg = null;
let userImg = null;

const frameX = 250;
const frameY = 300;
const frameWidth = 400;
const frameHeight = 450;

// User-controlled transform state for the photo
let userScale = 1;       // multiplier on top of the base "fit" scale
let userOffsetX = 0;     // manual drag offset
let userOffsetY = 0;

// Drag tracking
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// --- Template upload ---
templateLoader.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        templateImg = new Image();
        templateImg.onload = function() {
            canvas.width = templateImg.width;
            canvas.height = templateImg.height;
            drawMergedImage();
        };
        templateImg.onerror = function() {
            alert('Could not load that flyer image. Try a different file.');
        };
        templateImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
}, false);

// --- User photo upload ---
imageLoader.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        userImg = new Image();
        userImg.onload = function() {
            // Reset transform each time a new photo is loaded
            userScale = 1;
            userOffsetX = 0;
            userOffsetY = 0;
            drawMergedImage();
            downloadBtn.disabled = false;
        };
        userImg.onerror = function() {
            alert('Could not load that photo. Try a different file.');
        };
        userImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
}, false);

// --- Draw everything ---
function drawMergedImage() {
    if (!templateImg) return;

    ctx.drawImage(templateImg, 0, 0);

    if (userImg) {
        const baseScale = Math.max(frameWidth / userImg.width, frameHeight / userImg.height);
        const scale = baseScale * userScale;

        const drawWidth = userImg.width * scale;
        const drawHeight = userImg.height * scale;

        // How much the image overhangs the frame on each axis
        const maxOffsetX = Math.max(0, (drawWidth - frameWidth) / 2);
        const maxOffsetY = Math.max(0, (drawHeight - frameHeight) / 2);

        // Clamp offsets so the image always fully covers the frame
        userOffsetX = Math.min(Math.max(userOffsetX, -maxOffsetX), maxOffsetX);
        userOffsetY = Math.min(Math.max(userOffsetY, -maxOffsetY), maxOffsetY);

        const x = frameX + (frameWidth / 2) - (drawWidth / 2) + userOffsetX;
        const y = frameY + (frameHeight / 2) - (drawHeight / 2) + userOffsetY;

        ctx.save();
        ctx.beginPath();
        ctx.rect(frameX, frameY, frameWidth, frameHeight);
        ctx.clip();
        ctx.drawImage(userImg, x, y, drawWidth, drawHeight);
        ctx.restore();
    }
}

// --- Dragging (mouse) ---
canvas.addEventListener('mousedown', function(e) {
    if (!userImg) return;
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStartX = (e.clientX - rect.left) * (canvas.width / rect.width) - userOffsetX;
    dragStartY = (e.clientY - rect.top) * (canvas.height / rect.height) - userOffsetY;
});

canvas.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    userOffsetX = mouseX - dragStartX;
    userOffsetY = mouseY - dragStartY;
    drawMergedImage();
});

canvas.addEventListener('mouseup', function() {
    isDragging = false;
});

canvas.addEventListener('mouseleave', function() {
    isDragging = false;
});

// --- Scaling (mouse wheel) ---
canvas.addEventListener('wheel', function(e) {
    if (!userImg) return;
    e.preventDefault();

    const zoomSpeed = 0.001;
    userScale -= e.deltaY * zoomSpeed;

    // Clamp so the image can't shrink to nothing or blow up absurdly
    userScale = Math.min(Math.max(userScale, 0.2), 5);

    drawMergedImage();
}, { passive: false });

// --- Download ---
downloadBtn.addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'My_Flyer_Edit_Experience.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
});
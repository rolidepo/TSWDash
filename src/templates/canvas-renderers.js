/**
 * Canvas-based Renderers
 * Speedometer and other canvas-based visualizations
 */

const CanvasRenderers = {
    drawSpeedometer(canvas, speed, config) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2.2;
        
        // Get CSS color values from computed styles
        const mainScreen = document.getElementById('mainScreen');
        const computedStyle = window.getComputedStyle(mainScreen);
        const screenBg = computedStyle.getPropertyValue('background-color').trim();
        const screenText = computedStyle.getPropertyValue('color').trim() || '#1A3E5F';
        
        // Clear canvas with background color
        ctx.fillStyle = screenBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw outer circle
        ctx.strokeStyle = screenText;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw speed markers and numbers in main color
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = screenText;
        
        const maxSpeed = config.max || 240;
        const angleRange = Math.PI * 1.8;
        const startAngle = Math.PI * 0.6;
        
        // Major ticks and numbers
        for (let i = 0; i <= maxSpeed; i += 20) {
            const ratio = i / maxSpeed;
            const angle = startAngle + (ratio * angleRange);
            
            const x1 = centerX + (radius - 30) * Math.cos(angle);
            const y1 = centerY + (radius - 30) * Math.sin(angle);
            const x2 = centerX + radius * Math.cos(angle);
            const y2 = centerY + radius * Math.sin(angle);
            
            ctx.lineWidth = 3;
            ctx.strokeStyle = screenText;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            const numX = centerX + (radius - 55) * Math.cos(angle);
            const numY = centerY + (radius - 55) * Math.sin(angle);
            ctx.fillStyle = screenText;
            ctx.fillText(i.toString(), numX, numY);
        }
        
        // Minor ticks
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = screenText;
        for (let i = 10; i <= maxSpeed; i += 20) {
            const ratio = i / maxSpeed;
            const angle = startAngle + (ratio * angleRange);
            
            const x1 = centerX + (radius - 15) * Math.cos(angle);
            const y1 = centerY + (radius - 15) * Math.sin(angle);
            const x2 = centerX + radius * Math.cos(angle);
            const y2 = centerY + radius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Draw needle
        const speedRatio = Math.min(speed / maxSpeed, 1);
        const needleAngle = startAngle + (speedRatio * angleRange);
        
        const needleLength = radius - 50;
        const needleX = centerX + needleLength * Math.cos(needleAngle);
        const needleY = centerY + needleLength * Math.sin(needleAngle);
        
        ctx.strokeStyle = screenText;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(needleX, needleY);
        ctx.stroke();
        
        // Center circle
        ctx.fillStyle = screenText;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Speed value
        ctx.fillStyle = screenText;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(speed).toString(), centerX, centerY + 80);
        
        ctx.font = '14px Arial';
        ctx.fillText(config.unit || 'km/h', centerX, centerY + 110);
    },
    drawSpeedometerV2(canvas, speed, config) {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height * 0.52;
        const radius = Math.min(width, height) * 0.45;

        const mainScreen = document.getElementById('mainScreen');
        const computedStyle = window.getComputedStyle(mainScreen);
        const screenBg = computedStyle.getPropertyValue('background-color').trim();
        const screenText = computedStyle.getPropertyValue('color').trim() || '#1A3E5F';

        ctx.fillStyle = screenBg;
        ctx.fillRect(0, 0, width, height);

        const min = Number.isFinite(Number(config.min)) ? Number(config.min) : 0;
        const max = Number.isFinite(Number(config.max)) ? Number(config.max) : 180;
        const safeMax = max > min ? max : min + 1;

        const degToRad = (deg) => (deg * Math.PI) / 180;
        const startAngle = degToRad(125);
        const angleRange = degToRad(290);

        ctx.strokeStyle = screenText;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angleRange);
        ctx.stroke();

        const tickStep = 5;
        const bigTickStep = 10;
        const labelStep = 20;
        const firstTick = Math.ceil(min / tickStep) * tickStep;
        const lastTick = Math.floor(safeMax / tickStep) * tickStep;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = screenText;

        for (let tick = firstTick; tick <= lastTick; tick += tickStep) {
            const ratio = (tick - min) / (safeMax - min);
            if (ratio < 0 || ratio > 1) continue;
            const angle = startAngle + (ratio * angleRange);

            const isBig = ((tick - min) % bigTickStep) === 0;
            const tickLength = isBig ? radius * 0.11 : radius * 0.065;
            const tickWidth = isBig ? 3.5 : 2;

            const x1 = centerX + (radius - tickLength) * Math.cos(angle);
            const y1 = centerY + (radius - tickLength) * Math.sin(angle);
            const x2 = centerX + radius * Math.cos(angle);
            const y2 = centerY + radius * Math.sin(angle);

            ctx.lineWidth = tickWidth;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            if (((tick - min) % labelStep) === 0) {
                const labelRadius = radius * 0.78;
                const lx = centerX + labelRadius * Math.cos(angle);
                const ly = centerY + labelRadius * Math.sin(angle);
                ctx.font = `bold ${Math.max(11, radius * 0.115)}px Arial`;
                ctx.fillText(tick.toString(), lx, ly);
            }
        }

        const speedRatio = Math.min(Math.max((speed - min) / (safeMax - min), 0), 1);
        const needleAngle = startAngle + (speedRatio * angleRange);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(needleAngle);
        ctx.fillStyle = screenText;

        const totalLength = radius * 0.88;
        const segment1 = totalLength * 0.7;
        const segment2 = totalLength * 0.05;
        const segment3 = totalLength * 0.25;
        const width1 = radius * 0.06;
        const width2 = width1 * 0.7;
        const width3 = width1 * 0.5;

        ctx.fillRect(0, -width1 / 2, segment1, width1);
        ctx.fillRect(segment1, -width2 / 2, segment2, width2);
        ctx.fillRect(segment1 + segment2, -width3 / 2, segment3, width3);
        ctx.restore();

        const centerRadius = radius * 0.18;
        ctx.fillStyle = screenText;
        ctx.strokeStyle = screenText;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = screenBg;
        ctx.font = `bold ${Math.max(12, centerRadius * 0.7)}px Arial`;
        ctx.fillText(Math.round(speed).toString(), centerX, centerY);

        const unitText = (config.unit || 'km/h').trim();
        const unitBoxHeight = radius * 0.16;
        ctx.font = `bold ${Math.max(10, unitBoxHeight * 0.55)}px Arial`;
        const unitTextWidth = ctx.measureText(unitText).width;
        const unitBoxPadding = Math.max(6, unitBoxHeight * 0.35);
        const unitBoxWidth = unitTextWidth + (unitBoxPadding * 2);
        const unitBoxX = centerX - unitBoxWidth / 2;
        const unitBoxY = centerY + centerRadius * 1.75;
        ctx.fillStyle = screenBg;
        ctx.strokeStyle = screenText;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(unitBoxX, unitBoxY, unitBoxWidth, unitBoxHeight);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = screenText;
        ctx.fillText(unitText.trim(), centerX, unitBoxY + unitBoxHeight / 2);

        const bottomBoxes = Array.isArray(config.bottomBoxes) ? config.bottomBoxes : [];
        const singleBox = config.bottomBox;
        const boxWidth = radius * 0.18;
        const boxHeight = boxWidth * 1.6;
        const totalBoxWidth = boxWidth * 3;
        const boxStartX = centerX - totalBoxWidth / 2;
        const boxY = centerY + radius * 0.6;

        let singleText = null;
        let singleColor = '#F6C90E';
        let singleFontSize = Math.max(10, boxHeight * 0.5);
        if (singleBox && singleBox.visible) {
            const rawValue = Number(singleBox.value);
            if (Number.isFinite(rawValue)) {
                const clamped = Math.max(0, Math.min(999, Math.round(rawValue)));
                singleText = String(clamped).padStart(3, '0');
                singleColor = singleBox.color || singleColor;
                singleFontSize = singleBox.fontSize || singleFontSize;
            }
        }

        for (let i = 0; i < 3; i += 1) {
            const boxX = boxStartX + (i * boxWidth);
            ctx.fillStyle = screenBg;
            ctx.strokeStyle = screenText;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(boxX, boxY, boxWidth, boxHeight);
            ctx.fill();
            ctx.stroke();

            if (singleText) {
                ctx.fillStyle = singleColor;
                ctx.font = `bold ${singleFontSize}px "Orbitron", "Courier New", monospace`;
                ctx.fillText(singleText[i], boxX + boxWidth / 2, boxY + boxHeight / 2);
            } else {
                const boxConfig = bottomBoxes[i];
                if (boxConfig && boxConfig.visible) {
                    const rawValue = Number(boxConfig.value);
                    if (Number.isFinite(rawValue)) {
                        const clamped = Math.max(0, Math.min(999, Math.round(rawValue)));
                        const text = String(clamped).padStart(3, '0');
                        ctx.fillStyle = boxConfig.color || '#F6C90E';
                        const fontSize = boxConfig.fontSize || Math.max(10, boxHeight * 0.5);
                        ctx.font = `bold ${fontSize}px "Orbitron", "Courier New", monospace`;
                        ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2);
                    }
                }
            }
        }

        if (config.rimPointer && config.rimPointer.visible) {
            const pointerValue = Number(config.rimPointer.value);
            if (Number.isFinite(pointerValue)) {
                const pointerRatio = Math.min(Math.max((pointerValue - min) / (safeMax - min), 0), 1);
                const pointerAngle = startAngle + (pointerRatio * angleRange);
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(pointerAngle);
                ctx.fillStyle = config.rimPointer.color || '#ff0000';
                const tipX = radius - 2;
                const baseX = radius + 14;
                const halfWidth = radius * 0.06;
                ctx.beginPath();
                ctx.moveTo(tipX, 0);
                ctx.lineTo(baseX, -halfWidth);
                ctx.lineTo(baseX, halfWidth);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        if (config.diamondPointer && config.diamondPointer.visible) {
            const pointerValue = Number(config.diamondPointer.value);
            if (Number.isFinite(pointerValue)) {
                const pointerRatio = Math.min(Math.max((pointerValue - min) / (safeMax - min), 0), 1);
                const pointerAngle = startAngle + (pointerRatio * angleRange);
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(pointerAngle);
                ctx.fillStyle = config.diamondPointer.color || '#ffd400';
                const diamondSize = radius * 0.055;
                const diamondCenter = radius - 16;
                ctx.beginPath();
                ctx.moveTo(diamondCenter + diamondSize, 0);
                ctx.lineTo(diamondCenter, -diamondSize);
                ctx.lineTo(diamondCenter - diamondSize, 0);
                ctx.lineTo(diamondCenter, diamondSize);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    },
    drawTractionDial(canvas, config) {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height * 0.52;
        const radius = Math.min(width, height) * 0.45;
        const thickness = radius * 0.22;
        const outerRadius = radius;
        const innerRadius = radius - thickness;
        const midRadius = (outerRadius + innerRadius) / 2;

        const mainScreen = document.getElementById('mainScreen');
        const computedStyle = window.getComputedStyle(mainScreen);
        const screenBg = computedStyle.getPropertyValue('background-color').trim();
        const screenText = computedStyle.getPropertyValue('color').trim() || '#0000FF';

        ctx.fillStyle = screenBg;
        ctx.fillRect(0, 0, width, height);

        const degToRad = (deg) => (deg * Math.PI) / 180;
        const topAngle = degToRad(270);
        const sideSpan = degToRad(145);

        const maxRight = Number(config.maxRight) || 0;
        const maxLeft = Number(config.maxLeft) || 0;
        const currentRight = Math.max(0, Number(config.currentRight) || 0);
        const currentLeft = Math.max(0, Number(config.currentLeft) || 0);

        const rightRatio = maxRight > 0 ? Math.min(currentRight / maxRight, 1) : 0;
        const leftRatio = maxLeft > 0 ? Math.min(currentLeft / maxLeft, 1) : 0;

        ctx.lineWidth = thickness;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = screenText;
        ctx.beginPath();
        ctx.arc(centerX, centerY, midRadius, topAngle - sideSpan, topAngle + sideSpan);
        ctx.stroke();

        if (rightRatio > 0) {
            ctx.strokeStyle = '#2f6fff';
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.arc(centerX, centerY, midRadius, topAngle, topAngle + (rightRatio * sideSpan));
            ctx.stroke();
        }

        if (leftRatio > 0) {
            ctx.strokeStyle = '#ffd400';
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.arc(centerX, centerY, midRadius, topAngle, topAngle - (leftRatio * sideSpan), true);
            ctx.stroke();
        }

        const ticksPerSide = 14;
        ctx.strokeStyle = screenBg;
        ctx.fillStyle = screenText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= ticksPerSide; i += 1) {
            const ratio = ticksPerSide > 0 ? i / ticksPerSide : 0;
            const angle = topAngle + (ratio * sideSpan);
            const x1 = centerX + innerRadius * Math.cos(angle);
            const y1 = centerY + innerRadius * Math.sin(angle);
            const x2 = centerX + outerRadius * Math.cos(angle);
            const y2 = centerY + outerRadius * Math.sin(angle);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        for (let i = 0; i <= ticksPerSide; i += 1) {
            const ratio = ticksPerSide > 0 ? i / ticksPerSide : 0;
            const angle = topAngle - (ratio * sideSpan);
            const x1 = centerX + innerRadius * Math.cos(angle);
            const y1 = centerY + innerRadius * Math.sin(angle);
            const x2 = centerX + outerRadius * Math.cos(angle);
            const y2 = centerY + outerRadius * Math.sin(angle);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        const maxRightLabel = Math.floor(maxRight / 50) * 50;
        for (let label = 0; label <= maxRightLabel; label += 50) {
            const ratio = maxRight > 0 ? label / maxRight : 0;
            const angle = topAngle + (ratio * sideSpan);
            const labelRadius = innerRadius - (thickness * 0.4);
            const lx = centerX + labelRadius * Math.cos(angle);
            const ly = centerY + labelRadius * Math.sin(angle);
            ctx.font = `bold ${Math.max(12, radius * 0.085)}px Arial`;
            ctx.fillText(label.toString(), lx, ly);
        }

        const maxLeftLabel = Math.floor(maxLeft / 20) * 20;
        for (let label = 0; label <= maxLeftLabel; label += 20) {
            const ratio = maxLeft > 0 ? label / maxLeft : 0;
            const angle = topAngle - (ratio * sideSpan);
            const labelRadius = innerRadius - (thickness * 0.4);
            const lx = centerX + labelRadius * Math.cos(angle);
            const ly = centerY + labelRadius * Math.sin(angle);
            ctx.font = `bold ${Math.max(12, radius * 0.085)}px Arial`;
            ctx.fillText(label.toString(), lx, ly);
        }

        ctx.fillStyle = screenText;
        ctx.font = `bold ${Math.max(14, radius * 0.20)}px Arial`;
        ctx.fillText('kN', centerX, centerY);

        const pointerRight = Math.max(0, Number(config.pointerRight) || 0);
        const pointerLeft = Math.max(0, Number(config.pointerLeft) || 0);
        const pointerValue = pointerRight > 0 ? pointerRight : pointerLeft;
        const pointerSide = pointerRight > 0 ? 'right' : (pointerLeft > 0 ? 'left' : 'right');

        if (pointerSide) {
            const maxValue = pointerSide === 'right' ? maxRight : maxLeft;
            const ratio = maxValue > 0 ? Math.min(pointerValue / maxValue, 1) : 0;
            const angle = pointerSide === 'right'
                ? topAngle + (ratio * sideSpan)
                : topAngle - (ratio * sideSpan);

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            ctx.fillStyle = '#ffd400';
            const tip = outerRadius + thickness * 0.05;
            const base = outerRadius + thickness * 0.65;
            const halfWidth = thickness * 0.3;
            ctx.beginPath();
            ctx.moveTo(tip, 0);
            ctx.lineTo(base, -halfWidth);
            ctx.lineTo(base, halfWidth);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        const narrowWidth = radius * 0.14;
        const wideWidth = narrowWidth * 3;
        const boxHeight = narrowWidth * 1.2;
        const gapY = centerY + radius * 0.55;
        const totalWidth = wideWidth + narrowWidth;
        const startX = centerX - totalWidth / 2;

        const percentRight = maxRight > 0 ? Math.round((currentRight / maxRight) * 100) : 0;
        const percentLeft = maxLeft > 0 ? Math.round((currentLeft / maxLeft) * 100) : 0;
        let percentText = '+0';
        if (currentRight > 0) {
            percentText = `+${percentRight}`;
        } else if (currentLeft > 0) {
            percentText = `-${percentLeft}`;
        }

        ctx.fillStyle = screenText;
        ctx.strokeStyle = screenText;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(startX, gapY, wideWidth, boxHeight);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(startX + wideWidth, gapY, narrowWidth, boxHeight);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = screenBg;
        ctx.beginPath();
        ctx.moveTo(startX + wideWidth, gapY);
        ctx.lineTo(startX + wideWidth, gapY + boxHeight);
        ctx.stroke();

        ctx.fillStyle = screenBg;
        ctx.font = `bold ${Math.max(10, boxHeight * 0.55)}px Arial`;
        ctx.fillText(percentText, startX + wideWidth / 2, gapY + boxHeight / 2);
        ctx.fillText('%', startX + wideWidth + (narrowWidth / 2), gapY + boxHeight / 2);

        const lineY1 = gapY + boxHeight;
        const lineY2 = lineY1 + (radius * 0.28);
        ctx.strokeStyle = screenText;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, lineY1);
        ctx.lineTo(centerX, lineY2);
        ctx.stroke();

        ctx.fillStyle = screenText;
        ctx.font = `bold ${Math.max(11, radius * 0.075)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('Zugkraft', centerX + 10, lineY2);
        ctx.textAlign = 'right';
        ctx.fillText('Bremsen', centerX - 10, lineY2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
    }
};

// Expose globally
window.CanvasRenderers = CanvasRenderers;

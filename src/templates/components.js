/**
 * MFD Component Registry
 * Centralized registry of all available widget types and their rendering logic
 */

/**
 * Helper function to resolve value with fallback support
 * Accepts a single value key or an array of keys, returns the first value found in data
 * @param {string|string[]} valueKey - Single key or array of keys to try
 * @param {Object} data - The data object to search in
 * @returns {*} The first found value, or undefined if none found
 */
function resolveValue(valueKey, data) {
    // If it's a single string, return the value directly
    if (typeof valueKey === 'string') {
        const value = data[valueKey];
        // Skip undefined, null, and empty strings
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
        return undefined;
    }
    
    // If it's an array, try each key or literal in order
    if (Array.isArray(valueKey)) {
        for (const key of valueKey) {
            if (typeof key === 'string') {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const value = data[key];
                    // Skip undefined, null, and empty strings
                    if (value !== undefined && value !== null && value !== '') {
                        return value;
                    }
                }
            } else if (key !== undefined && key !== null && key !== '') {
                return key;
            }
        }
    }
    
    return undefined;
}

function resolveVisibleWhen(visibleWhen, data) {
    if (!visibleWhen) return true;
    if (typeof visibleWhen === 'object' && !Array.isArray(visibleWhen)) {
        if (Object.prototype.hasOwnProperty.call(visibleWhen, 'variable')) {
            const resolved = resolveValue(visibleWhen.variable, data);
            if (Object.prototype.hasOwnProperty.call(visibleWhen, 'equals')) {
                return resolved == visibleWhen.equals;
            }
            return Boolean(resolved);
        }
    }
    return Boolean(resolveValue(visibleWhen, data));
}

/**
 * Helper function to apply styles to component elements
 * Supports:
 * - New: styles object with fontSize, bold, italic, underline per-component
 * - Old: font_sizes object for backward compatibility with page-level settings
 */
function applyElementStyles(element, className, componentConfig) {
    // Try new styles system first
    if (componentConfig.styles) {
        const styles = componentConfig.styles;
        let elementStyles = null;
        
        // Map class names to styles keys
        if (className === 'component-title' && styles.title) {
            elementStyles = styles.title;
        } else if (className === 'component-value' && styles.value) {
            elementStyles = styles.value;
        } else if (className === 'component-unit' && styles.unit) {
            elementStyles = styles.unit;
        }
        
        if (elementStyles) {
            // Apply font family
            if (elementStyles.fontFamily) {
                element.style.fontFamily = elementStyles.fontFamily;
            }
            
            // Apply font size
            if (elementStyles.fontSize) {
                element.style.fontSize = elementStyles.fontSize;
            }
            
            // Apply bold (fontWeight)
            if (elementStyles.bold === true) {
                element.style.fontWeight = 'bold';
            } else if (elementStyles.bold === false) {
                element.style.fontWeight = 'normal';
            }
            
            // Apply italic (fontStyle)
            if (elementStyles.italic === true) {
                element.style.fontStyle = 'italic';
            } else if (elementStyles.italic === false) {
                element.style.fontStyle = 'normal';
            }
            
            // Apply underline (textDecoration)
            if (elementStyles.underline === true) {
                element.style.textDecoration = 'underline';
            } else if (elementStyles.underline === false) {
                element.style.textDecoration = 'none';
            }
            
            return;  // Styles applied, skip font_sizes fallback
        }
    }
    
    // Fallback to old font_sizes system for backward compatibility
    if (componentConfig.font_sizes) {
        const fontSizes = componentConfig.font_sizes;
        let fontSize = null;
        
        // Map class names to font_sizes keys
        if (className === 'component-title' && fontSizes.title) {
            fontSize = fontSizes.title;
        } else if (className === 'component-value' && fontSizes.value) {
            fontSize = fontSizes.value;
        } else if (className === 'component-unit' && fontSizes.unit) {
            fontSize = fontSizes.unit;
        }
        
        if (fontSize) {
            element.style.fontSize = fontSize;
        }
    }
}

/**
 * Helper function to apply font sizes from component or page-level configuration
 * Kept for backward compatibility - now delegates to applyElementStyles
 */
function applyFontSizes(element, className, componentConfig) {
    applyElementStyles(element, className, componentConfig);
}

function resolveSpeedometerMaxValue(maxConfig, data) {
    if (Array.isArray(maxConfig)) {
        for (const candidate of maxConfig) {
            const resolved = resolveValue(candidate, data);
            const numeric = Number(resolved);
            if (
                resolved !== undefined
                && resolved !== null
                && resolved !== ''
                && Number.isFinite(numeric)
                && numeric > 20
            ) {
                return numeric;
            }
        }
        return undefined;
    }

    const resolved = resolveValue(maxConfig, data);
    if (resolved === undefined || resolved === null) {
        return undefined;
    }

    const numeric = Number(resolved);
    return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeIndicatorOperator(operator) {
    if (!operator) return '==';
    const op = String(operator).toLowerCase();
    if (op === '=' || op === '==' || op === '===' || op === 'equals') return '==';
    if (op === '!=' || op === '!==' || op === 'not_equals') return '!=';
    if (op === '>' || op === 'gt' || op === 'greater' || op === 'greater_than') return '>';
    if (op === '<' || op === 'lt' || op === 'less' || op === 'less_than') return '<';
    if (op === '>=' || op === 'gte' || op === 'greater_or_equal') return '>=';
    if (op === '<=' || op === 'lte' || op === 'less_or_equal') return '<=';
    return operator;
}

function resolveIndicatorOperand(operand, data) {
    if (operand && typeof operand === 'object' && !Array.isArray(operand)) {
        if (Object.prototype.hasOwnProperty.call(operand, 'value')) {
            return resolveValue(operand.value, data);
        }
        if (Object.prototype.hasOwnProperty.call(operand, 'literal')) {
            return operand.literal;
        }
    }

    const resolved = resolveValue(operand, data);
    if (resolved !== undefined) {
        return resolved;
    }

    return operand;
}

function evaluateSingleComparison(whenObj, data) {
    if (!whenObj) return false;
    const operator = normalizeIndicatorOperator(whenObj.operator || whenObj.compare || whenObj.condition);
    const leftValue = resolveIndicatorOperand(whenObj.left ?? whenObj.value, data);
    const rightValue = resolveIndicatorOperand(whenObj.right ?? whenObj.compare_to, data);

    if (operator === '==' || operator === '!=') {
        const result = leftValue == rightValue;
        return operator === '==' ? result : !result;
    }

    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) {
        return false;
    }

    switch (operator) {
        case '>':
            return leftNumber > rightNumber;
        case '<':
            return leftNumber < rightNumber;
        case '>=':
            return leftNumber >= rightNumber;
        case '<=':
            return leftNumber <= rightNumber;
        default:
            return false;
    }
}

function indicatorConditionMatches(condition, data) {
    if (!condition || !condition.when) return false;
    
    const whenObj = condition.when;
    
    // Support AND logic: "all" property contains array of conditions (ALL must match)
    if (Array.isArray(whenObj.all)) {
        return whenObj.all.every(subCondition => evaluateSingleComparison(subCondition, data));
    }
    
    // Support OR logic: "any" property contains array of conditions (ANY can match)
    if (Array.isArray(whenObj.any)) {
        return whenObj.any.some(subCondition => evaluateSingleComparison(subCondition, data));
    }
    
    // Simple condition: single left/right/operator comparison
    return evaluateSingleComparison(whenObj, data);
}

function resolveIndicatorDisplay(conditionConfig, componentConfig, data) {
    const display = conditionConfig && conditionConfig.display ? conditionConfig.display : conditionConfig;
    const displayValue = display && Object.prototype.hasOwnProperty.call(display, 'value')
        ? resolveValue(display.value, data)
        : resolveValue(componentConfig.value, data);
    if (display && Object.prototype.hasOwnProperty.call(display, 'text')) {
        return display.text;
    }
    if (displayValue !== undefined) {
        return displayValue;
    }
    if (display && typeof display === 'string') {
        return display;
    }
    if (typeof componentConfig.value === 'string') {
        return componentConfig.value;
    }
    return '';
}

function applyIndicatorStyles(container, textElement, conditionConfig, componentConfig, svg) {
    const display = conditionConfig && conditionConfig.display ? conditionConfig.display : conditionConfig;
    const fallbackColor = 'var(--current-screen-text-color)';
    const fontFamily = (display && display.fontFamily) || componentConfig.fontFamily;
    const fontSize = (display && display.fontSize) || componentConfig.fontSize;
    const color = (display && display.color) || componentConfig.color || fallbackColor;
    const backgroundColor = (display && display.backgroundColor) || componentConfig.backgroundColor;
    const bold = display && display.bold !== undefined ? display.bold : componentConfig.bold;
    const italic = display && display.italic !== undefined ? display.italic : componentConfig.italic;
    const underline = display && display.underline !== undefined ? display.underline : componentConfig.underline;
    const blinking = display && display.blinking !== undefined ? display.blinking : componentConfig.blinking;
    const blinkingTextColorOn = display && display.blinkingTextColorOn !== undefined
        ? display.blinkingTextColorOn
        : componentConfig.blinkingTextColorOn;
    const blinkingTextColorOff = display && display.blinkingTextColorOff !== undefined
        ? display.blinkingTextColorOff
        : componentConfig.blinkingTextColorOff;
    const strikethrough = display && display.strikethrough !== undefined ? display.strikethrough : componentConfig.strikethrough;
    const strikethroughColor = display && display.strikethroughColor !== undefined ? display.strikethroughColor : componentConfig.strikethroughColor;
    const strikethroughWidth = display && display.strikethroughWidth !== undefined ? display.strikethroughWidth : (componentConfig.strikethroughWidth || 3);
    const crossthrough = display && display.crossthrough !== undefined ? display.crossthrough : componentConfig.crossthrough;
    const crossthroughColor = display && display.crossthroughColor !== undefined ? display.crossthroughColor : componentConfig.crossthroughColor;
    const crossthroughWidth = display && display.crossthroughWidth !== undefined ? display.crossthroughWidth : (componentConfig.crossthroughWidth || 3);

    textElement.style.color = color || fallbackColor;
    textElement.style.fontFamily = fontFamily || '';
    textElement.style.fontSize = fontSize || '';
    textElement.style.fontWeight = bold === true ? 'bold' : (bold === false ? 'normal' : '');
    textElement.style.fontStyle = italic === true ? 'italic' : (italic === false ? 'normal' : '');
    textElement.style.textDecoration = underline === true ? 'underline' : (underline === false ? 'none' : '');

    container.style.setProperty('--blink-bg-color', backgroundColor || 'transparent');
    
    // Handle blinking animation
    // Remove all blinking classes first
    textElement.classList.remove('blinking-text', 'blinking-both', 'blinking-bg-text');
    container.classList.remove('blinking-bg', 'blinking-both');
    textElement.style.removeProperty('--blink-text-color-on');
    textElement.style.removeProperty('--blink-text-color-off');
    
    // Apply blinking based on mode
    if (blinking === true || blinking === 'both') {
        // Both text and background blink
        textElement.classList.add('blinking-both');
        container.classList.add('blinking-both');
        container.style.backgroundColor = backgroundColor || '';
    } else if (blinking === 'text') {
        // Only text blinks
        textElement.classList.add('blinking-text');
        container.style.backgroundColor = backgroundColor || '';
    } else if (blinking === 'background' || blinking === 'bg') {
        // Only background blinks
        container.classList.add('blinking-bg');
        container.style.backgroundColor = backgroundColor || '';
        if (blinkingTextColorOn || blinkingTextColorOff) {
            textElement.style.setProperty('--blink-text-color-on', blinkingTextColorOn || color || fallbackColor);
            textElement.style.setProperty('--blink-text-color-off', blinkingTextColorOff || color || fallbackColor);
            textElement.classList.add('blinking-bg-text');
        }
    } else {
        // No blinking
        container.style.backgroundColor = backgroundColor || '';
    }

    // Handle diagonal lines (strikethrough and crossthrough)
    if (svg) {
        svg.innerHTML = '';
        
        if (strikethrough === true || strikethrough === 'true') {
            const lineColor = strikethroughColor || '#ffffff';
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', '100%');
            line.setAttribute('x2', '100%');
            line.setAttribute('y2', '0');
            line.setAttribute('stroke', lineColor);
            line.setAttribute('stroke-width', strikethroughWidth);
            svg.appendChild(line);
        }
        
        if (crossthrough === true || crossthrough === 'true') {
            const lineColor = crossthroughColor || '#ffffff';
            
            // First diagonal (top-left to bottom-right)
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', '0');
            line1.setAttribute('y1', '0');
            line1.setAttribute('x2', '100%');
            line1.setAttribute('y2', '100%');
            line1.setAttribute('stroke', lineColor);
            line1.setAttribute('stroke-width', crossthroughWidth);
            svg.appendChild(line1);
            
            // Second diagonal (top-right to bottom-left)
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', '100%');
            line2.setAttribute('y1', '0');
            line2.setAttribute('x2', '0');
            line2.setAttribute('y2', '100%');
            line2.setAttribute('stroke', lineColor);
            line2.setAttribute('stroke-width', crossthroughWidth);
            svg.appendChild(line2);
        }
    }
}

const ComponentRegistry = {
    /**
     * TEXT_DISPLAY - Simple text with label and unit
     */
    text_display: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'no-padding');
            
            const title = document.createElement('div');
            title.className = 'component-title';
            title.textContent = componentConfig.title || '';
            applyFontSizes(title, 'component-title', componentConfig);
            
            const value = document.createElement('div');
            value.className = 'component-value';
            value.id = `${componentConfig.id}-value`;
            
            // Check if value exists in data, otherwise treat as literal text
            let displayValue;
            const apiValue = resolveValue(componentConfig.value, data);
            if (apiValue !== undefined) {
                // Value is a variable from API data
                displayValue = typeof apiValue === 'number' 
                    ? apiValue.toFixed(componentConfig.decimals || 1) 
                    : apiValue;
            } else {
                // Value is literal text (not found in data)
                // If hide_value_when_empty is true, show empty instead of variable name
                if (componentConfig.hide_value_when_empty) {
                    displayValue = '';
                } else {
                    displayValue = Array.isArray(componentConfig.value) ? '' : (componentConfig.value || '');
                }
            }
            
            value.textContent = displayValue;
            applyFontSizes(value, 'component-value', componentConfig);
            
            const unit = document.createElement('div');
            unit.className = 'component-unit';
            unit.textContent = componentConfig.unit || '';
            applyFontSizes(unit, 'component-unit', componentConfig);
            
            // Check if value is populated
            const isValuePopulated = displayValue !== undefined && displayValue !== null && displayValue !== '';
            
            // Only append title if value is populated OR if hide_title_when_empty is not enabled
            if (isValuePopulated || !componentConfig.hide_title_when_empty) {
                container.appendChild(title);
            }
            
            // Check if unit should be inline (next to value) or below
            if (componentConfig.unit_position === 'inline') {
                const valueUnitWrapper = document.createElement('div');
                valueUnitWrapper.style.display = 'flex';
                valueUnitWrapper.style.alignItems = 'baseline';
                valueUnitWrapper.style.gap = '6px';
                valueUnitWrapper.appendChild(value);
                valueUnitWrapper.appendChild(unit);
                container.appendChild(valueUnitWrapper);
            } else {
                container.appendChild(value);
                container.appendChild(unit);
            }
        },
        update: (container, componentConfig, data) => {
            const valueElement = container.querySelector('.component-value');
            if (valueElement) {
                // Check if value exists in data, otherwise treat as literal text
                let displayValue;
                const apiValue = resolveValue(componentConfig.value, data);
                if (apiValue !== undefined) {
                    displayValue = typeof apiValue === 'number' 
                        ? apiValue.toFixed(componentConfig.decimals || 1) 
                        : apiValue;
                } else {
                    // Value is literal text (doesn't update)
                    // If hide_value_when_empty is true, show empty instead of variable name
                    if (componentConfig.hide_value_when_empty) {
                        displayValue = '';
                    } else {
                        displayValue = Array.isArray(componentConfig.value) ? '' : (componentConfig.value || '');
                    }
                }
                valueElement.textContent = displayValue;
            }
        }
    },

    /**
     * TEXT_DISPLAY_V2 - Text display with variable substitution in template strings
     * Supports {variable_name} placeholders that get replaced with actual data values
     */
    text_display_v2: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'no-padding');
            
            const title = document.createElement('div');
            title.className = 'component-title';
            title.textContent = componentConfig.title || '';
            applyFontSizes(title, 'component-title', componentConfig);
            
            const value = document.createElement('div');
            value.className = 'component-value';
            value.id = `${componentConfig.id}-value`;
            
            // Parse template string and substitute variables
            let displayValue = '';
            let hasEmptyVariable = false;
            if (typeof componentConfig.value === 'string') {
                displayValue = componentConfig.value.replace(/\{([^}]+)\}/g, (match, varName) => {
                    const varValue = data[varName.trim()];
                    if (varValue !== undefined && varValue !== null && varValue !== '') {
                        if (typeof varValue === 'number') {
                            return componentConfig.decimals !== undefined 
                                ? varValue.toFixed(componentConfig.decimals)
                                : String(varValue);
                        }
                        return String(varValue);
                    }
                    hasEmptyVariable = true;
                    return match; // Keep placeholder if variable not found
                });
                
                // If hide_value_when_empty is true and any variable was empty, hide the component
                if (componentConfig.hide_value_when_empty && hasEmptyVariable) {
                    displayValue = '';
                }
            } else {
                displayValue = '';
            }
            
            value.textContent = displayValue;
            applyFontSizes(value, 'component-value', componentConfig);
            
            const unit = document.createElement('div');
            unit.className = 'component-unit';
            unit.textContent = componentConfig.unit || '';
            applyFontSizes(unit, 'component-unit', componentConfig);
            
            // Check if value is populated
            const isValuePopulated = displayValue !== undefined && displayValue !== null && displayValue !== '';
            
            // Only append title if value is populated OR if hide_title_when_empty is not enabled
            if (isValuePopulated || !componentConfig.hide_title_when_empty) {
                container.appendChild(title);
            }
            
            // Check if unit should be inline (next to value) or below
            if (componentConfig.unit_position === 'inline') {
                const valueUnitWrapper = document.createElement('div');
                valueUnitWrapper.style.display = 'flex';
                valueUnitWrapper.style.alignItems = 'baseline';
                valueUnitWrapper.style.gap = '6px';
                valueUnitWrapper.appendChild(value);
                valueUnitWrapper.appendChild(unit);
                container.appendChild(valueUnitWrapper);
            } else {
                container.appendChild(value);
                container.appendChild(unit);
            }
        },
        update: (container, componentConfig, data) => {
            const valueElement = container.querySelector('.component-value');
            if (valueElement) {
                // Parse template string and substitute variables
                let displayValue = '';
                let hasEmptyVariable = false;
                if (typeof componentConfig.value === 'string') {
                    displayValue = componentConfig.value.replace(/\{([^}]+)\}/g, (match, varName) => {
                        const varValue = data[varName.trim()];
                        if (varValue !== undefined && varValue !== null && varValue !== '') {
                            if (typeof varValue === 'number') {
                                return componentConfig.decimals !== undefined 
                                    ? varValue.toFixed(componentConfig.decimals)
                                    : String(varValue);
                            }
                            return String(varValue);
                        }
                        hasEmptyVariable = true;
                        return match; // Keep placeholder if variable not found
                    });
                    
                    // If hide_value_when_empty is true and any variable was empty, hide the component
                    if (componentConfig.hide_value_when_empty && hasEmptyVariable) {
                        displayValue = '';
                    }
                } else {
                    displayValue = '';
                }
                valueElement.textContent = displayValue;
            }
        }
    },

    /**
     * TEXT_INDICATOR - Conditional text display with styling rules
     */
    text_indicator: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.position = 'relative';

            const text = document.createElement('div');
            text.className = 'component-value';
            text.id = `${componentConfig.id}-indicator`;
            text.style.whiteSpace = 'pre-wrap';
            text.style.lineHeight = '1.2';
            text.style.position = 'relative';
            text.style.zIndex = '1';
            container.appendChild(text);

            // Create SVG overlay for diagonal lines
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'diagonal-lines');
            svg.id = `${componentConfig.id}-diagonal`;
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '0';
            container.appendChild(svg);

            ComponentRegistry.text_indicator.update(container, componentConfig, data);
        },
        update: (container, componentConfig, data) => {
            const textElement = container.querySelector(`#${componentConfig.id}-indicator`);
            const svg = container.querySelector(`#${componentConfig.id}-diagonal`);
            if (!textElement) return;

            const conditions = Array.isArray(componentConfig.conditions)
                ? componentConfig.conditions
                : [];

            let matched = null;
            for (const condition of conditions) {
                if (indicatorConditionMatches(condition, data)) {
                    matched = condition;
                    break;
                }
            }

            const defaultConfig = componentConfig.default || null;
            const activeConfig = matched || defaultConfig || componentConfig;

            const displayText = String(resolveIndicatorDisplay(activeConfig, componentConfig, data) || '');
            textElement.textContent = displayText;
            applyIndicatorStyles(container, textElement, activeConfig, componentConfig, svg);
        }
    },

    /**
     * PROGRESS_BAR - Horizontal bar showing percentage/ratio
     */
    progress_bar: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'progress-bar-component');
            
            const title = document.createElement('div');
            title.className = 'component-title';
            title.textContent = componentConfig.title || '';
            applyFontSizes(title, 'component-title', componentConfig);
            
            const barContainer = document.createElement('div');
            barContainer.className = 'progress-bar-container';
            barContainer.style.height = '20px';
            barContainer.style.backgroundColor = '#ddd';
            barContainer.style.borderRadius = '3px';
            barContainer.style.overflow = 'hidden';
            barContainer.style.marginY = '8px';
            
            const barFill = document.createElement('div');
            barFill.id = `${componentConfig.id}-fill`;
            barFill.className = 'progress-bar-fill';
            barFill.style.height = '100%';
            barFill.style.backgroundColor = componentConfig.color || '#0066cc';
            barFill.style.width = '0%';
            barFill.style.transition = 'width 0.3s ease';
            
            barContainer.appendChild(barFill);
            
            const unit = document.createElement('div');
            unit.className = 'component-unit';
            unit.textContent = componentConfig.unit || '';
            applyFontSizes(unit, 'component-unit', componentConfig);
            
            container.appendChild(title);
            container.appendChild(barContainer);
            container.appendChild(unit);
        },
        update: (container, componentConfig, data) => {
            const barFill = container.querySelector('.progress-bar-fill');
            if (barFill) {
                const value = resolveValue(componentConfig.value, data) || 0;
                const minValue = resolveValue(componentConfig.min, data);
                const maxValue = resolveValue(componentConfig.max, data);
                const min = minValue !== undefined
                    ? Number(minValue)
                    : (componentConfig.min !== undefined ? componentConfig.min : 0);
                const max = maxValue !== undefined
                    ? Number(maxValue)
                    : (componentConfig.max !== undefined ? componentConfig.max : 100);
                const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
                barFill.style.width = percentage + '%';
            }
        }
    },

    /**
     * VERTICAL_BAR - Vertical bar with indicator lines (for traction effort, etc)
     */
    vertical_bar: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'vertical-bar-component');
            
            const title = document.createElement('div');
            title.className = 'component-title';
            title.textContent = componentConfig.title || '';
            applyFontSizes(title, 'component-title', componentConfig);
            
            // Vertical bar container
            const barWrapper = document.createElement('div');
            barWrapper.style.display = 'flex';
            barWrapper.style.alignItems = 'flex-end';
            barWrapper.style.justifyContent = 'center';
            barWrapper.style.flex = '1';
            barWrapper.style.minHeight = '0';
            barWrapper.style.height = '100%';
            barWrapper.style.gap = '10px';
            barWrapper.style.margin = '10px 0';
            
            // Main bar
            const mainBar = document.createElement('div');
            mainBar.id = `${componentConfig.id}-bar`;
            mainBar.style.width = '30px';
            mainBar.style.height = '100%';
            mainBar.style.backgroundColor = 'currentColor'; // Uses text color
            mainBar.style.borderRadius = '2px';
            mainBar.style.transition = 'height 0.2s ease';
            mainBar.style.minHeight = '5px';
            
            // Indicator lines (reference markers)
            const indicatorContainer = document.createElement('div');
            indicatorContainer.style.position = 'relative';
            indicatorContainer.style.width = '50px';
            indicatorContainer.style.height = '100%';
            indicatorContainer.style.minHeight = '0';
            
            // Draw indicator lines for reference (e.g., 25%, 50%, 75%, 100%)
            const indicators = componentConfig.indicators || [25, 50, 75, 100];
            indicators.forEach(percent => {
                const line = document.createElement('div');
                line.style.position = 'absolute';
                line.style.bottom = percent + '%';
                line.style.left = '0';
                line.style.width = '40px';
                line.style.height = '1px';
                line.style.backgroundColor = 'currentColor';
                line.style.opacity = '0.5';
                indicatorContainer.appendChild(line);
                
                // Label for indicator
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.bottom = (percent - 5) + '%';
                label.style.left = '45px';
                const labelFontSize = componentConfig.font_sizes && componentConfig.font_sizes.value
                    ? componentConfig.font_sizes.value
                    : '25px';
                label.style.fontSize = labelFontSize;
                label.style.whiteSpace = 'nowrap';
                label.style.color = 'currentColor';
                label.style.opacity = '0.7';
                label.textContent = percent + '%';
                indicatorContainer.appendChild(label);
            });
            
            barWrapper.appendChild(mainBar);
            barWrapper.appendChild(indicatorContainer);
            
            const unit = document.createElement('div');
            unit.className = 'component-unit';
            unit.textContent = componentConfig.unit || '';
            
            container.appendChild(title);
            container.appendChild(barWrapper);
            container.appendChild(unit);
        },
        update: (container, componentConfig, data) => {
            const mainBar = container.querySelector(`#${componentConfig.id}-bar`);
            if (mainBar) {
                const value = resolveValue(componentConfig.value, data) || 0;
                const minValue = resolveValue(componentConfig.min, data);
                const maxValue = resolveValue(componentConfig.max, data);
                const min = minValue !== undefined
                    ? Number(minValue)
                    : (componentConfig.min !== undefined ? componentConfig.min : 0);
                const max = maxValue !== undefined
                    ? Number(maxValue)
                    : (componentConfig.max !== undefined ? componentConfig.max : 100);
                const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
                mainBar.style.height = percentage + '%';
            }
        }
    },

    /**
     * SEVEN_SEGMENT - 4-digit seven-segment display in yellow
     */
    seven_segment: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'no-padding');
            
            const title = document.createElement('div');
            title.className = 'component-title';
            title.textContent = componentConfig.title || '';
            applyFontSizes(title, 'component-title', componentConfig);
            
            const displayWrapper = document.createElement('div');
            displayWrapper.style.display = 'flex';
            displayWrapper.style.justifyContent = 'flex-start';
            displayWrapper.style.alignItems = 'center';
            displayWrapper.style.flex = '1';
            displayWrapper.style.minHeight = '0';
            displayWrapper.style.minWidth = '0';
            displayWrapper.id = `${componentConfig.id}-display`;
            
            const display = document.createElement('div');
            display.className = 'seven-segment-display';
            display.style.fontFamily = '"Orbitron", "Courier New", monospace';
            display.style.fontSize = 'clamp(16px, 5vh, 24px)';
            display.style.fontWeight = '900';
            display.style.color = '#F6C90E';
           
            display.style.letterSpacing = '0px';
            display.style.padding = '0';
            display.style.maxWidth = '100%';
            display.style.overflow = 'hidden';
            display.style.whiteSpace = 'nowrap';
            
            // Apply value font size if specified
            if (componentConfig.font_sizes && componentConfig.font_sizes.value) {
                display.style.fontSize = componentConfig.font_sizes.value;
            }
            
            const apiValue = data[componentConfig.value] || 0;
            const numValue = typeof apiValue === 'number' ? apiValue : parseFloat(apiValue) || 0;
            const roundedValue = Math.floor(numValue / 200) * 200;
            display.textContent = numValue === 0 ? '' : roundedValue.toString();
            
            displayWrapper.appendChild(display);
            
            container.appendChild(title);
            container.appendChild(displayWrapper);
        },
        update: (container, componentConfig, data) => {
            const display = container.querySelector('.seven-segment-display');
            if (display) {
                const apiValue = resolveValue(componentConfig.value, data) || 0;
                const numValue = typeof apiValue === 'number' ? apiValue : parseFloat(apiValue) || 0;
                const roundedValue = Math.floor(numValue / 200) * 200;
                display.textContent = numValue === 0 ? '' : roundedValue.toString();
            }
        }
    },

    /**
     * SCALED_VERTICAL_BAR - Non-linear scale vertical bar with custom increments
     */
    scaled_vertical_bar: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component');
            
            const title = document.createElement('div');
            title.className = 'component-title';
            title.textContent = componentConfig.title || '';
            
            const barWrapper = document.createElement('div');
            barWrapper.style.display = 'flex';
            barWrapper.style.flexDirection = 'row';
            barWrapper.style.alignItems = 'stretch';
            barWrapper.style.flex = '1';
            barWrapper.style.minHeight = '0';
            barWrapper.style.height = '100%';
            barWrapper.style.gap = '0px';
            barWrapper.style.padding = '0';
            
            // Scale container (ticks + numbers)
            const scaleContainer = document.createElement('div');
            scaleContainer.style.display = 'flex';
            scaleContainer.style.flexDirection = 'column-reverse';
            scaleContainer.style.position = 'relative';
            scaleContainer.style.height = '100%';
            scaleContainer.style.minHeight = '0';
            
            // Major scale values (non-linear)
            const majorTicks = [0, 100, 250, 500, 750, 1000, 2000, 3000, 4000];
            const totalSegments = majorTicks.length - 1;
            
            // Create scale with ticks and labels
            const scaleInner = document.createElement('div');
            scaleInner.style.position = 'relative';
            scaleInner.style.height = '100%';
            scaleInner.style.display = 'flex';
            scaleInner.style.flexDirection = 'row';
            scaleInner.style.alignItems = 'stretch';
            
            const tickContainer = document.createElement('div');
            tickContainer.style.position = 'relative';
            tickContainer.style.width = '15px';
            tickContainer.style.height = '100%';
            
            const labelContainer = document.createElement('div');
            labelContainer.style.position = 'relative';
            labelContainer.style.width = '25px';
            labelContainer.style.height = '100%';
            labelContainer.style.marginRight = '0px';
            
            // Draw ticks and labels
            for (let i = 0; i < majorTicks.length; i++) {
                const position = (i / totalSegments) * 100;
                
                // Major tick
                const majorTick = document.createElement('div');
                majorTick.style.position = 'absolute';
                majorTick.style.bottom = `${position}%`;
                majorTick.style.right = '0';
                majorTick.style.width = '12px';
                majorTick.style.height = '2px';
                majorTick.style.backgroundColor = 'var(--current-screen-text-color)';
                majorTick.style.transform = 'translateY(50%)';
                tickContainer.appendChild(majorTick);
                
                // Label
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.bottom = `${position}%`;
                label.style.right = '0';
                label.style.fontSize = '12px';
                label.style.color = 'var(--current-screen-text-color)';
                label.style.transform = 'translateY(50%)';
                label.style.textAlign = 'right';
                label.style.width = '100%';
                label.textContent = majorTicks[i];
                labelContainer.appendChild(label);
                
                // Minor ticks (5 between each major tick)
                if (i < majorTicks.length - 1) {
                    const segmentHeight = 100 / totalSegments;
                    for (let j = 1; j <= 5; j++) {
                        const minorPosition = position + (j / 6) * segmentHeight;
                        const minorTick = document.createElement('div');
                        minorTick.style.position = 'absolute';
                        minorTick.style.bottom = `${minorPosition}%`;
                        minorTick.style.right = '0';
                        minorTick.style.width = '6px';
                        minorTick.style.height = '1px';
                        minorTick.style.backgroundColor = 'var(--current-screen-text-color)';
                        minorTick.style.transform = 'translateY(50%)';
                        tickContainer.appendChild(minorTick);
                    }
                }
            }
            
            scaleInner.appendChild(labelContainer);
            scaleInner.appendChild(tickContainer);
            scaleContainer.appendChild(scaleInner);
            
            // Bar container
            const barContainer = document.createElement('div');
            barContainer.style.position = 'relative';
            barContainer.style.width = '30px';
            barContainer.style.height = '100%';
            barContainer.style.minHeight = '0';
            barContainer.style.border = '1px solid var(--current-screen-text-color)';
            barContainer.style.backgroundColor = 'transparent';
            
            // Bar fill
            const barFill = document.createElement('div');
            barFill.id = `${componentConfig.id}-fill`;
            barFill.style.position = 'absolute';
            barFill.style.bottom = '0';
            barFill.style.left = '0';
            barFill.style.right = '0';
            barFill.style.backgroundColor = '#FFD700';
            barFill.style.transition = 'height 0.3s ease';
            
            // Calculate initial height
            const value = Math.min(4000, Math.max(0, resolveValue(componentConfig.value, data) || 0));
            let percentage = 0;
            
            for (let i = 0; i < majorTicks.length - 1; i++) {
                if (value >= majorTicks[i] && value <= majorTicks[i + 1]) {
                    const segmentStart = majorTicks[i];
                    const segmentEnd = majorTicks[i + 1];
                    const segmentProgress = (value - segmentStart) / (segmentEnd - segmentStart);
                    const segmentHeight = 100 / (majorTicks.length - 1);
                    percentage = (i * segmentHeight) + (segmentProgress * segmentHeight);
                    break;
                }
            }
            
            if (value >= 4000) {
                percentage = 100;
            }
            
            barFill.style.height = `${percentage}%`;
            
            barContainer.appendChild(barFill);
            
            barWrapper.appendChild(scaleContainer);
            barWrapper.appendChild(barContainer);
            
            container.appendChild(title);
            container.appendChild(barWrapper);
        },
        update: (container, componentConfig, data) => {
            const barFill = container.querySelector(`#${componentConfig.id}-fill`);
            if (barFill) {
                const value = Math.min(4000, Math.max(0, resolveValue(componentConfig.value, data) || 0));
                const majorTicks = [0, 100, 250, 500, 750, 1000, 2000, 3000, 4000];
                
                // Find which segment the value falls into
                let percentage = 0;
                for (let i = 0; i < majorTicks.length - 1; i++) {
                    if (value >= majorTicks[i] && value <= majorTicks[i + 1]) {
                        const segmentStart = majorTicks[i];
                        const segmentEnd = majorTicks[i + 1];
                        const segmentProgress = (value - segmentStart) / (segmentEnd - segmentStart);
                        const segmentHeight = 100 / (majorTicks.length - 1);
                        percentage = (i * segmentHeight) + (segmentProgress * segmentHeight);
                        break;
                    }
                }
                
                if (value >= 4000) {
                    percentage = 100;
                }
                
                barFill.style.height = `${percentage}%`;
            }
        }
    },

    /**
     * SPEEDOMETER - Canvas-based circular speedometer gauge
     */
    speedometer: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'speedometer-component');

            // Initialize runtime variable if configured
            if (componentConfig.speed_unit_mph !== undefined && window.setComponentRuntimeVariable) {
                window.setComponentRuntimeVariable('speed_unit_mph', componentConfig.speed_unit_mph);
            }

            const size = typeof componentConfig.size === 'number' ? componentConfig.size : 220;
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.height = '100%';
            container.style.minHeight = '0';
            container.style.overflow = 'hidden';
            
            const canvas = document.createElement('canvas');
            canvas.id = `${componentConfig.id}-canvas`;
            canvas.width = size;
            canvas.height = size;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.objectFit = 'contain';
            canvas.style.aspectRatio = '1 / 1';
            container.appendChild(canvas);
        },
        update: (container, componentConfig, data) => {
            const canvas = container.querySelector(`#${componentConfig.id}-canvas`);
            if (!canvas) return;
            
            const {drawSpeedometer} = window.CanvasRenderers || {};
            if (drawSpeedometer) {
                // Check if we should display mph instead of km/h
                const speedUnitMph = data.speed_unit_mph === true;
                const conversionFactor = speedUnitMph ? 0.621371 : 1;

                let value = resolveValue(componentConfig.value, data) || 0;
                // Convert speed value if mph is selected
                if (speedUnitMph && value !== null && value !== undefined) {
                    value = Number(value) * conversionFactor;
                }
                
                // Create a modified config with resolved max value
                const resolvedConfig = {...componentConfig};
                
                // Set unit based on speed_unit_mph
                if (speedUnitMph) {
                    resolvedConfig.unit = 'mph';
                }
                
                // If max is a string or array, treat it as variable name(s) and look it up
                if ((typeof componentConfig.max === 'string' && isNaN(componentConfig.max)) || Array.isArray(componentConfig.max)) {
                    const maxValue = resolveSpeedometerMaxValue(componentConfig.max, data);
                    if (maxValue !== undefined && maxValue !== null) {
                        resolvedConfig.max = Number(maxValue) * conversionFactor;
                    }
                }
                
                drawSpeedometer(canvas, value, resolvedConfig);
            }
        }
    },

    /**
     * SPEEDOMETER_V2 - Advanced speedometer with custom ticks, center display, and extra indicators
     */
    speedometer_v2: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'speedometer-component');

            // Initialize runtime variable if configured
            if (componentConfig.speed_unit_mph !== undefined && window.setComponentRuntimeVariable) {
                window.setComponentRuntimeVariable('speed_unit_mph', componentConfig.speed_unit_mph);
            }

            const size = typeof componentConfig.size === 'number' ? componentConfig.size : 260;
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.height = '100%';
            container.style.minHeight = '0';
            container.style.overflow = 'hidden';
            
            const canvas = document.createElement('canvas');
            canvas.id = `${componentConfig.id}-canvas`;
            canvas.width = size;
            canvas.height = size;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.objectFit = 'contain';
            canvas.style.aspectRatio = '1 / 1';
            container.appendChild(canvas);
        },
        update: (container, componentConfig, data) => {
            const canvas = container.querySelector(`#${componentConfig.id}-canvas`);
            if (!canvas) return;

            const {drawSpeedometerV2} = window.CanvasRenderers || {};
            if (!drawSpeedometerV2) return;

            // Check if we should display mph instead of km/h
            const speedUnitMph = data.speed_unit_mph === true;
            const conversionFactor = speedUnitMph ? 0.621371 : 1;

            let value = resolveValue(componentConfig.value, data) || 0;
            // Convert speed value if mph is selected
            if (speedUnitMph && value !== null && value !== undefined) {
                value = Number(value) * conversionFactor;
            }
            
            const resolvedConfig = {...componentConfig};
            
            // Set unit based on speed_unit_mph
            if (speedUnitMph) {
                resolvedConfig.unit = 'mph';
            }

            if ((typeof componentConfig.min === 'string' && isNaN(componentConfig.min)) || Array.isArray(componentConfig.min)) {
                const minValue = resolveValue(componentConfig.min, data);
                if (minValue !== undefined && minValue !== null) {
                    resolvedConfig.min = Number(minValue) * conversionFactor;
                }
            }

            if ((typeof componentConfig.max === 'string' && isNaN(componentConfig.max)) || Array.isArray(componentConfig.max)) {
                const maxValue = resolveSpeedometerMaxValue(componentConfig.max, data);
                if (maxValue !== undefined && maxValue !== null) {
                    resolvedConfig.max = Number(maxValue) * conversionFactor;
                }
            }

            const bottomBoxesConfig = componentConfig.bottom_boxes || componentConfig.bottomBoxes || [];
            const bottomBoxes = Array.isArray(bottomBoxesConfig)
                ? bottomBoxesConfig.map((box, index) => {
                    let boxValue = resolveValue(box.value, data);
                    // Convert box value if mph is selected
                    if (speedUnitMph && boxValue !== null && boxValue !== undefined) {
                        boxValue = Number(boxValue) * conversionFactor;
                    }
                    return {
                        index,
                        value: boxValue,
                        visible: resolveVisibleWhen(box.visible_when || box.visibleWhen, data),
                        color: box.color,
                        fontSize: box.fontSize
                    };
                })
                : [];
            resolvedConfig.bottomBoxes = bottomBoxes;

            if (!Array.isArray(bottomBoxesConfig) && bottomBoxesConfig) {
                let bottomValue = resolveValue(bottomBoxesConfig.value, data);
                // Convert bottom box value if mph is selected
                if (speedUnitMph && bottomValue !== null && bottomValue !== undefined) {
                    bottomValue = Number(bottomValue) * conversionFactor;
                }
                resolvedConfig.bottomBox = {
                    value: bottomValue,
                    visible: resolveVisibleWhen(bottomBoxesConfig.visible_when || bottomBoxesConfig.visibleWhen, data),
                    color: bottomBoxesConfig.color,
                    fontSize: bottomBoxesConfig.fontSize
                };
            }

            const rimPointer = componentConfig.rim_pointer || componentConfig.rimPointer;
            if (rimPointer) {
                let rimValue = resolveValue(rimPointer.value, data);
                // Convert rim pointer value if mph is selected
                if (speedUnitMph && rimValue !== null && rimValue !== undefined) {
                    rimValue = Number(rimValue) * conversionFactor;
                }
                resolvedConfig.rimPointer = {
                    value: rimValue,
                    visible: resolveVisibleWhen(rimPointer.visible_when || rimPointer.visibleWhen, data),
                    color: rimPointer.color || '#ff0000'
                };
            }

            const diamondPointer = componentConfig.diamond_pointer || componentConfig.diamondPointer;
            if (diamondPointer) {
                let diamondValue = resolveValue(diamondPointer.value, data);
                // Convert diamond pointer value if mph is selected
                if (speedUnitMph && diamondValue !== null && diamondValue !== undefined) {
                    diamondValue = Number(diamondValue) * conversionFactor;
                }
                resolvedConfig.diamondPointer = {
                    value: diamondValue,
                    visible: resolveVisibleWhen(diamondPointer.visible_when || diamondPointer.visibleWhen, data),
                    color: diamondPointer.color || '#ffd400'
                };
            }

            drawSpeedometerV2(canvas, value, resolvedConfig);
        }
    },

    /**
     * TRACTION_DIAL - Bidirectional traction/brake dial with split arc and indicators
     */
    traction_dial: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'speedometer-component');

            const size = typeof componentConfig.size === 'number' ? componentConfig.size : 260;
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.height = '100%';
            container.style.minHeight = '0';
            container.style.overflow = 'hidden';

            const canvas = document.createElement('canvas');
            canvas.id = `${componentConfig.id}-canvas`;
            canvas.width = size;
            canvas.height = size;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.objectFit = 'contain';
            canvas.style.aspectRatio = '1 / 1';
            container.appendChild(canvas);
        },
        update: (container, componentConfig, data) => {
            const canvas = container.querySelector(`#${componentConfig.id}-canvas`);
            if (!canvas) return;

            const {drawTractionDial} = window.CanvasRenderers || {};
            if (!drawTractionDial) return;

            const resolvedConfig = {...componentConfig};
            const maxRight = resolveValue(componentConfig.MaxRight, data);
            const maxLeft = resolveValue(componentConfig.MaxLeft, data);
            const currentRight = resolveValue(componentConfig.CurrentRight, data);
            const currentLeft = resolveValue(componentConfig.CurrentLeft, data);
            const pointerRight = resolveValue(componentConfig.PointerRight, data);
            const pointerLeft = resolveValue(componentConfig.PointerLeft, data);

            resolvedConfig.maxRight = maxRight !== undefined ? maxRight : 0;
            resolvedConfig.maxLeft = maxLeft !== undefined ? maxLeft : 0;
            resolvedConfig.currentRight = currentRight !== undefined ? currentRight : 0;
            resolvedConfig.currentLeft = currentLeft !== undefined ? currentLeft : 0;
            resolvedConfig.pointerRight = pointerRight !== undefined ? pointerRight : 0;
            resolvedConfig.pointerLeft = pointerLeft !== undefined ? pointerLeft : 0;

            drawTractionDial(canvas, resolvedConfig);
        }
    },

    /**
     * EBULA_DATA_TABLE - Service timetable with schedule data matching and geolocation
     */
    ebula_data_table: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'ebula-data-table');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.overflow = 'hidden';
            container.style.padding = '0';
            container.style.border = 'none';
            container.style.gap = '0';
            
            // Initialize runtime variable if configured
            if (componentConfig.speed_unit_mph !== undefined && window.setComponentRuntimeVariable) {
                window.setComponentRuntimeVariable('speed_unit_mph', componentConfig.speed_unit_mph);
            }
            
            // Store state for navigation
            if (!window.ebulaTableState) {
                window.ebulaTableState = {};
            }
            const stateKey = componentConfig.id;
            if (!window.ebulaTableState[stateKey]) {
                window.ebulaTableState[stateKey] = {
                    scrollOffset: 0,
                    closestIndex: 0,
                    entries: [],
                    displayedRows: 0,
                    needsInitialOffset: true,
                    needsInitialSearch: true,
                    lastIsAltTimetable: null,
                    debugVisible: false,
                    previousClosestDistance: Infinity,
                    previousClosestIndex: 0,
                    // Schedule tracking
                    scheduleData: null,
                    gameTimeAtStart: null,
                    realTimeAtStart: null,
                    stationTracking: {},  // Track ATA/ATD per station index
                    currentDiff: null,
                    stoppedDuration: 0,
                    previousSpeed: null
                };
            }
            
            // Global debug toggle function
            if (!window.toggleEbulaDebug) {
                window.toggleEbulaDebug = function() {
                    Object.keys(window.ebulaTableState).forEach(key => {
                        window.ebulaTableState[key].debugVisible = !window.ebulaTableState[key].debugVisible;
                    });
                    if (typeof updateData === 'function') {
                        updateData();
                    }
                };
            }
            
            // Global picto icon cache to avoid reloading images on every render
            if (!window.pictoIconCache) {
                window.pictoIconCache = {};
                window.pictoIconLoader = {
                    getIcon: function(iconPath) {
                        // Check if already cached
                        if (window.pictoIconCache[iconPath]) {
                            return window.pictoIconCache[iconPath];
                        }
                        return null; // Not yet loaded
                    },
                    loadIcon: function(iconPath) {
                        // Avoid duplicate loading requests
                        if (window.pictoIconCache[iconPath] !== undefined) {
                            return; // Already loaded or loading
                        }
                        
                        // Mark as loading to prevent duplicate requests
                        window.pictoIconCache[iconPath] = 'loading';
                        
                        const img = new Image();
                        img.onload = function() {
                            window.pictoIconCache[iconPath] = img;
                        };
                        img.onerror = function() {
                            window.pictoIconCache[iconPath] = null; // Mark as failed
                        };
                        img.src = `/picto-icons/${iconPath}`;
                    }
                };
            }
            
            // Create table container with custom scrolling
            const tableContainer = document.createElement('div');
            tableContainer.id = `${componentConfig.id}-table`;
            tableContainer.style.flex = '1';
            tableContainer.style.overflow = 'hidden';
            tableContainer.style.display = 'flex';
            tableContainer.style.flexDirection = 'column';
            tableContainer.style.position = 'relative';
            tableContainer.style.fontSize = componentConfig.fontSize || '12px';
            tableContainer.style.fontFamily = 'Arial, sans-serif';
            tableContainer.style.color = 'var(--current-screen-text-color, #D0D0D0)';
            tableContainer.style.padding = '0';
            tableContainer.style.border = 'none';
            tableContainer.style.gap = '0';
            container.appendChild(tableContainer);
            
            // Create debug info panel
            const debugPanel = document.createElement('div');
            debugPanel.id = `${componentConfig.id}-debug`;
            debugPanel.style.position = 'absolute';
            debugPanel.style.top = '5px';
            debugPanel.style.right = '5px';
            debugPanel.style.background = 'rgba(0, 0, 0, 0.8)';
            debugPanel.style.color = '#00ff00';
            debugPanel.style.padding = '5px';
            debugPanel.style.fontSize = '10px';
            debugPanel.style.fontFamily = 'monospace';
            debugPanel.style.borderRadius = '3px';
            debugPanel.style.zIndex = '1000';
            debugPanel.style.pointerEvents = 'none';
            debugPanel.style.lineHeight = '1.3';
            debugPanel.style.display = 'none';
            container.appendChild(debugPanel);
            
            ComponentRegistry.ebula_data_table.update(container, componentConfig, data);
        },
        update: (container, componentConfig, data) => {
            const stateKey = componentConfig.id;
            const state = window.ebulaTableState[stateKey];
            if (!state) return;
            
            const tableContainer = container.querySelector(`#${componentConfig.id}-table`);
            if (!tableContainer) return;
            
            // Extract timetable and service timetable data
            const ttTimetable = data.tt_timetable || [];
            const isAltTimetableRequested = data.alt_timetable === true;
            const hasAltTimetableEntries = Array.isArray(data.st_entries_alt) && data.st_entries_alt.length > 0;
            const isAltTimetable = isAltTimetableRequested && hasAltTimetableEntries;
            const stEntries = isAltTimetable ? data.st_entries_alt : (data.st_entries || []);
            const gntActive = data.GNT_active === true;
            const speedUnitMph = data.speed_unit_mph === true;

            // When switching between base/alt timetable datasets, reset closest-distance tracking
            // so the pass-detection logic does not falsely advance index by one.
            if (state.lastIsAltTimetable === null || state.lastIsAltTimetable === undefined) {
                state.lastIsAltTimetable = isAltTimetable;
            } else if (state.lastIsAltTimetable !== isAltTimetable) {
                state.lastIsAltTimetable = isAltTimetable;
                state.needsInitialSearch = true;
                state.previousClosestDistance = Infinity;
            }
            
            // Helper function to convert speed from km/h to mph if needed
            const convertSpeed = (speedKmh) => {
                if (speedUnitMph && speedKmh !== null && speedKmh !== undefined) {
                    return Number(speedKmh) * 0.621371;
                }
                return speedKmh;
            };
            
            // Helper function to get unit string
            const getSpeedUnit = () => speedUnitMph ? 'mph' : 'km/h';

            const getDisplaySpeed = (entry) => {
                if (!entry) return null;
                const fallbackSpeed = entry.speed_limit;
                if (!gntActive) return fallbackSpeed;

                const gntSpeedValue = entry.GNTSpeed;
                if (gntSpeedValue === null || gntSpeedValue === undefined || gntSpeedValue === '') {
                    return fallbackSpeed;
                }

                const parsedGntSpeed = Number(gntSpeedValue);
                return Number.isFinite(parsedGntSpeed) ? parsedGntSpeed : fallbackSpeed;
            };

            // Derive dynamic speed limits from service entries
            let speedMin = Infinity;
            let speedMax = -Infinity;
            for (const entry of stEntries) {
                const value = Number(getDisplaySpeed(entry));
                if (Number.isFinite(value)) {
                    speedMin = Math.min(speedMin, value);
                    speedMax = Math.max(speedMax, value);
                }
            }
            if (!Number.isFinite(speedMin) || !Number.isFinite(speedMax) || speedMin === speedMax) {
                speedMin = 0;
                speedMax = 160;
            }
            
            if (stEntries.length === 0) {
                tableContainer.innerHTML = '<div style="padding: 10px;">No timetable data loaded</div>';
                return;
            }

            state.entries = stEntries;
            
            // Initialize schedule tracking on first load
            if (!state.scheduleData && ttTimetable.length > 0) {
                state.scheduleData = JSON.parse(JSON.stringify(ttTimetable));
                state.gameTimeAtStart = data['tod_data.WorldTimeISO8601_time_only'];
                state.realTimeAtStart = new Date().toISOString();
                // Initialize station tracking
                state.stationTracking = {};
                state.currentDiff = 0;
                state.stoppedDuration = 0;
                state.previousSpeed = 0;
            }
            
            // Get current speed and game time
            const currentSpeed = data['speed_ms.Speed_ms'] || 0;
            const gameTime = data['tod_data.WorldTimeISO8601_time_only'];
            
            // Get player location
            const playerLat = data['player_info.geoLocation.latitude'];
            const playerLon = data['player_info.geoLocation.longitude'];
            
            // Track progress: only advance to next location once current one has been passed
            // (distance to current starts increasing)
            let closestIndex = state.closestIndex || 0;
            let closestDistance = Infinity;
            let currentDistanceToClosure = Infinity;
            let distanceIncrease = 0;
            
            // On initial load, search all entries to find the true closest one
            if (state.needsInitialSearch && playerLat !== undefined && playerLon !== undefined) {
                closestIndex = 0;
                closestDistance = Infinity;
                
                for (let stIndex = 0; stIndex < stEntries.length; stIndex++) {
                    const stEntry = stEntries[stIndex];
                    if (stEntry.latitude !== undefined && stEntry.longitude !== undefined &&
                        stEntry.latitude !== null && stEntry.longitude !== null) {
                        
                        const latDiff = parseFloat(stEntry.latitude) - parseFloat(playerLat);
                        const lonDiff = parseFloat(stEntry.longitude) - parseFloat(playerLon);
                        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
                        
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestIndex = stIndex;
                        }
                    }
                }
                state.needsInitialSearch = false;
                currentDistanceToClosure = closestDistance;
            } else {
                // Regular operation: get distance to current closest location
                if (closestIndex < stEntries.length) {
                    const currentEntry = stEntries[closestIndex];
                    if (playerLat !== undefined && playerLon !== undefined && 
                        currentEntry.latitude !== undefined && currentEntry.longitude !== undefined &&
                        currentEntry.latitude !== null && currentEntry.longitude !== null) {
                        
                        const latDiff = parseFloat(currentEntry.latitude) - parseFloat(playerLat);
                        const lonDiff = parseFloat(currentEntry.longitude) - parseFloat(playerLon);
                        currentDistanceToClosure = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
                        closestDistance = currentDistanceToClosure;
                    }
                }
            }
            
            // Check if we've passed the current location (distance increasing significantly)
            // Add threshold to prevent GPS jitter from triggering false positives when stationary
            const DISTANCE_INCREASE_THRESHOLD = 0.0001; // ~10-15 meters depending on latitude
            distanceIncrease = currentDistanceToClosure - state.previousClosestDistance;
            
            if (distanceIncrease > DISTANCE_INCREASE_THRESHOLD && state.previousClosestDistance !== Infinity) {
                // We've passed the current location, try to advance to next
                closestIndex = closestIndex + 1;
                currentDistanceToClosure = Infinity;
                
                // Find closest among remaining entries
                for (let stIndex = closestIndex; stIndex < stEntries.length; stIndex++) {
                    const stEntry = stEntries[stIndex];
                    
                    if (playerLat !== undefined && playerLon !== undefined && 
                        stEntry.latitude !== undefined && stEntry.longitude !== undefined &&
                        stEntry.latitude !== null && stEntry.longitude !== null) {
                        
                        const latDiff = parseFloat(stEntry.latitude) - parseFloat(playerLat);
                        const lonDiff = parseFloat(stEntry.longitude) - parseFloat(playerLon);
                        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
                        
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestIndex = stIndex;
                            currentDistanceToClosure = distance;
                        } else if (currentDistanceToClosure !== Infinity && distance > closestDistance) {
                            // Getting further, stop checking
                            break;
                        }
                    }
                }
            }
            
            state.closestIndex = closestIndex;
            
            // Reset stopped duration when moving to a new station
            if (closestIndex !== state.previousClosestIndex) {
                state.stoppedDuration = 0;
                state.previousClosestIndex = closestIndex;
            }
            
            state.previousClosestDistance = currentDistanceToClosure;
            
            // Track ATA/ATD for closest station
            const SPEED_THRESHOLD = 0.2;  // m/s
            const isStopped = Math.abs(currentSpeed) < SPEED_THRESHOLD;
            const previousIsStopped = state.previousSpeed !== null && Math.abs(state.previousSpeed) < SPEED_THRESHOLD;
            
            // Detect transition EARLY
            const transitionedFromStop = previousIsStopped && !isStopped;
            
            // Track stopped duration (but don't reset yet - we need it for ATD check)
            if (isStopped) {
                state.stoppedDuration = (state.stoppedDuration || 0) + 0.1;  // Approximate 100ms per frame
            }
            // NOTE: Don't reset here - we'll do it AFTER ATD check
            
            // Initialize tracking for closest station if needed
            if (!state.stationTracking[closestIndex]) {
                state.stationTracking[closestIndex] = {
                    ataRecorded: false,
                    atdRecorded: false,
                    stoppingTime: null,
                    departingTime: null
                };
            }
            
            const stationTrack = state.stationTracking[closestIndex];
            
            // Find matching timetable entry by station name (not index)
            let matchedTtEntry = null;
            if (ttTimetable && closestIndex < stEntries.length) {
                const closestStEntry = stEntries[closestIndex];
                for (const ttEntry of ttTimetable) {
                    if (ttEntry.station === closestStEntry.location) {
                        matchedTtEntry = ttEntry;
                        break;
                    }
                }
            }
            
            // Update kmMark with the matching service timetable entry's km value
            if (matchedTtEntry && closestIndex < stEntries.length) {
                const closestStEntry = stEntries[closestIndex];
                if (closestStEntry.km !== undefined && closestStEntry.km !== null) {
                    matchedTtEntry.kmMark = closestStEntry.km;
                    // Also update scheduleData copy
                    const scheduleEntry = state.scheduleData.find(e => e.station === matchedTtEntry.station);
                    if (scheduleEntry) {
                        scheduleEntry.kmMark = closestStEntry.km;
                    }
                }
            }
            
            // Record ATA: 2+ seconds stopped at this station
            if (isStopped && state.stoppedDuration >= 2 && !stationTrack.ataRecorded && matchedTtEntry) {
                matchedTtEntry.ATA = gameTime;
                stationTrack.ataRecorded = true;
                // Also update scheduleData copy
                const scheduleEntry = state.scheduleData.find(e => e.station === matchedTtEntry.station);
                if (scheduleEntry) {
                    scheduleEntry.ATA = gameTime;
                }
                // Calculate diff: ETA - ATA
                const eta = matchedTtEntry.ETA;
                if (eta) {
                    try {
                        const etaDate = new Date(`2000-01-01T${eta}`);
                        const ataDate = new Date(`2000-01-01T${gameTime}`);
                        const diffMs = ataDate - etaDate;
                        const diffMins = Math.round(diffMs / 60000);
                        state.currentDiff = diffMins;
                        matchedTtEntry.diff = `${diffMins >= 0 ? '+' : ''}${diffMins}`;
                        if (scheduleEntry) {
                            scheduleEntry.diff = matchedTtEntry.diff;
                        }
                    } catch (e) {
                        console.error('Error calculating ATA diff:', e);
                    }
                }
            }

            // Record ATD for pass-through stations (stop: false)
            if (matchedTtEntry && matchedTtEntry.stop === false && !stationTrack.atdRecorded) {
                matchedTtEntry.ATD = gameTime;
                stationTrack.atdRecorded = true;
                // Also update scheduleData copy
                const scheduleEntry = state.scheduleData.find(e => e.station === matchedTtEntry.station);
                if (scheduleEntry) {
                    scheduleEntry.ATD = gameTime;
                }

                // Calculate diff: ETD - ATD
                const etd = matchedTtEntry.ETD;
                if (etd) {
                    try {
                        const etdDate = new Date(`2000-01-01T${etd}`);
                        const atdDate = new Date(`2000-01-01T${gameTime}`);
                        const diffMs = atdDate - etdDate;
                        const diffMins = Math.round(diffMs / 60000);
                        state.currentDiff = diffMins;
                        matchedTtEntry.diff = `${diffMins >= 0 ? '+' : ''}${diffMins}`;
                        if (scheduleEntry) {
                            scheduleEntry.diff = matchedTtEntry.diff;
                        }
                    } catch (e) {
                        console.error('Error calculating ATD diff:', e);
                    }
                }
            }
            
            // Record ATD: Simple transition from stopped to moving
            // Condition: Was stopped (previousIsStopped), now moving (!isStopped), stopped long enough (>= 10s)
            
            if (transitionedFromStop && state.stoppedDuration >= 10 && !stationTrack.atdRecorded && matchedTtEntry) {
                matchedTtEntry.ATD = gameTime;
                stationTrack.atdRecorded = true;
                // Also update scheduleData copy
                const scheduleEntry = state.scheduleData.find(e => e.station === matchedTtEntry.station);
                if (scheduleEntry) {
                    scheduleEntry.ATD = gameTime;
                }
                
                // Calculate stop duration: ATD - ATA (in seconds)
                if (matchedTtEntry.ATA) {
                    try {
                        const ataDate = new Date(`2000-01-01T${matchedTtEntry.ATA}`);
                        const atdDate = new Date(`2000-01-01T${gameTime}`);
                        const stpDurationMs = atdDate - ataDate;
                        const stpDurationSecs = Math.round(stpDurationMs / 1000);
                        matchedTtEntry.stpDurr = stpDurationSecs +2; // Add 2 seconds to account for the minimum stopped duration before recording ATD
                        if (scheduleEntry) {
                            scheduleEntry.stpDurr = stpDurationSecs;
                        }
                    } catch (e) {
                        console.error('Error calculating stop duration:', e);
                    }
                }
                
                // Calculate diff: ETD - ATD
                const etd = matchedTtEntry.ETD;
                if (etd) {
                    try {
                        const etdDate = new Date(`2000-01-01T${etd}`);
                        const atdDate = new Date(`2000-01-01T${gameTime}`);
                        const diffMs = atdDate - etdDate;
                        const diffMins = Math.round(diffMs / 60000);
                        state.currentDiff = diffMins;
                        matchedTtEntry.diff = `${diffMins >= 0 ? '+' : ''}${diffMins}`;
                        if (scheduleEntry) {
                            scheduleEntry.diff = matchedTtEntry.diff;
                        }
                    } catch (e) {
                        console.error('Error calculating ATD diff:', e);
                    }
                }
            }
            
            // NOW reset duration after all ATA/ATD checks are complete
            if (!isStopped) {
                state.stoppedDuration = 0;
            }
            
            state.previousSpeed = currentSpeed;
            
            // Expose current_diff to data - initialize if null
            if (state.currentDiff === null || state.currentDiff === undefined) {
                state.currentDiff = 0;
            }
            data.current_diff = `${state.currentDiff >= 0 ? '+' : ''}${state.currentDiff}`;

            // Find and expose next stop station (with "stop": true)
            let nextStopEntry = null;
            if (ttTimetable && stEntries && closestIndex >= 0) {
                // Search through service entries starting from closest index + 1
                for (let i = closestIndex; i < stEntries.length; i++) {
                    const stEntry = stEntries[i];
                    
                    // Find matching schedule entry by station name
                    const ttEntry = ttTimetable.find(tt => tt.station === stEntry.location);
                    
                    if (ttEntry && ttEntry.stop === true) {
                        nextStopEntry = ttEntry;
                        break;
                    }
                }
            }
            
            // Expose next stop information to data
            if (nextStopEntry) {
                data.next_stop_station = nextStopEntry.station || '';
                data.next_stop_eta = nextStopEntry.ETA || '';
                data.next_stop_etd = nextStopEntry.ETD || '';
            } else {
                data.next_stop_station = '';
                data.next_stop_eta = '';
                data.next_stop_etd = '';
            }

            // Calculate how many rows fit in the available height
            const computedFontSize = window.getComputedStyle(tableContainer).fontSize || '16px';
            const fontSizePx = parseInt(computedFontSize, 10) || 16;
            const estimatedRowHeight = fontSizePx + 8;
            const containerHeight = tableContainer.clientHeight || 0;
            const fallbackRows = 15;
            const baseRows = containerHeight > 0
                ? Math.max(1, Math.floor(containerHeight / estimatedRowHeight))
                : fallbackRows;
            // Reserve space for the double-height first row.
            const availableRows = Math.max(1, baseRows - 1);
            state.displayedRows = availableRows;
            
            // Initialize scroll offset to 0 on first load (automatic mode)
            if (state.needsInitialOffset) {
                state.scrollOffset = 0;
                state.needsInitialOffset = false;
            }

            // Calculate scroll boundaries
            // In automatic mode (scrollOffset = 0): closest station shows at top
            // maxScrollOffset: allow scrolling forward to show last stations
            const maxScrollOffset = Math.max(0, stEntries.length - availableRows - closestIndex + 1);
            
            // minScrollOffset: allow scrolling back to show first station at top
            const minScrollOffset = -closestIndex;
            state.scrollOffset = Math.min(Math.max(state.scrollOffset, minScrollOffset), maxScrollOffset);

            // Calculate start index: 
            // When scrollOffset = 0: closest is at top (automatic mode)
            // When scrollOffset > 0: scroll forward to show future entries
            // When scrollOffset < 0: scroll backward to show past entries
            let startIndex = closestIndex + state.scrollOffset - 1;
            
            // Clamp to valid range
            startIndex = Math.max(0, Math.min(startIndex, stEntries.length - availableRows));
            if (startIndex < 0) startIndex = 0;

            const displayIndices = [];
            for (let i = 0; i < availableRows && (startIndex + i) < stEntries.length; i++) {
                displayIndices.push(startIndex + i);
            }
            
            // Update debug panel
            const debugPanel = container.querySelector(`#${componentConfig.id}-debug`);
            if (debugPanel) {
                debugPanel.style.display = state.debugVisible ? 'block' : 'none';
                const stationTrack = state.stationTracking[closestIndex];
                const ataRecorded = stationTrack ? stationTrack.ataRecorded : false;
                const atdRecorded = stationTrack ? stationTrack.atdRecorded : false;
                const transitionedFromStop = previousIsStopped && !isStopped;
                const stEntryForDebug = stEntries[closestIndex];
                const stationName = stEntryForDebug ? stEntryForDebug.location : 'N/A';
                const ttEntryFound = matchedTtEntry ? 'YES' : 'NO';
                const ttStation = matchedTtEntry ? matchedTtEntry.station : 'N/A';
                
                // Check ATD conditions
                const atdCond1 = transitionedFromStop ? 'YES' : 'NO';
                const atdCond2 = (state.stoppedDuration >= 20) ? 'YES' : 'NO';
                const atdCond3 = (!stationTrack.atdRecorded) ? 'YES' : 'NO';
                const atdCond4 = matchedTtEntry ? 'YES' : 'NO';
                
                debugPanel.innerHTML = `
                    Total Entries: ${stEntries.length}<br>
                    Closest Index: ${closestIndex}<br>
                    ST Station: ${stationName}<br>
                    TT Entry Found: ${ttEntryFound}<br>
                    TT Station: ${ttStation}<br>
                    ---<br>
                    Speed: ${convertSpeed(currentSpeed).toFixed(2)} ${getSpeedUnit()}<br>
                    IsStopped: ${isStopped ? 'YES' : 'NO'}<br>
                    PrevIsStopped: ${previousIsStopped ? 'YES' : 'NO'}<br>
                    Transition: ${transitionedFromStop ? 'YES' : 'NO'}<br>
                    StoppedDur: ${state.stoppedDuration.toFixed(1)}s<br>
                    ---<br>
                    ATARecorded: ${ataRecorded ? 'YES' : 'NO'}<br>
                    ATDRecorded: ${atdRecorded ? 'YES' : 'NO'}<br>
                    ATD Cond1 (Transition): ${atdCond1}<br>
                    ATD Cond2 (Dur>=20s): ${atdCond2}<br>
                    ATD Cond3 (!Recorded): ${atdCond3}<br>
                    ATD Cond4 (Entry Found): ${atdCond4}<br>
                    CurrentDiff: ${state.currentDiff}<br>
                    ---<br>
                    NextStop: ${data.next_stop_station || 'N/A'}<br>
                    NextStop ETA: ${data.next_stop_eta || 'N/A'}<br>
                    NextStop ETD: ${data.next_stop_etd || 'N/A'}<br>
                    ---<br>
                    ScrollOffset: ${state.scrollOffset}<br>
                    AvailableRows: ${availableRows}<br>
                    DisplayedRows: ${state.displayedRows}<br>
                    StartIndex: ${startIndex}<br>
                    MinScrollOffset: ${minScrollOffset}<br>
                    MaxScrollOffset: ${maxScrollOffset}
                `;
            }
            
            // Render table (bottom to top, so reverse the display)
            tableContainer.innerHTML = '';
            tableContainer.style.display = 'flex';
            tableContainer.style.flexDirection = 'column';
            tableContainer.style.border = 'none';
            tableContainer.style.padding = '0';
            
            // Create rows in reverse order (closest at bottom)
            const rows = [];
            displayIndices.forEach((stIndex, displayOrder) => {
                const stEntry = stEntries[stIndex];
                
                // Match with schedule data by location/station
                let ttEntry = null;
                if (ttTimetable) {
                    for (const scheduleEntry of ttTimetable) {
                        if (scheduleEntry.station === stEntry.location) {
                            ttEntry = scheduleEntry;
                            break;
                        }
                    }
                }
                
                rows.push({
                    stEntry,
                    ttEntry,
                    isClosest: stIndex === closestIndex,
                    displayOrder,
                    stIndex
                });
            });
            
            // Reverse to show closest at bottom
            rows.reverse();
            
            // Create row elements
            const rowHeightPx = `${estimatedRowHeight}px`;
            const rowHeightDoublePx = `${estimatedRowHeight * 1}px`;
            rows.forEach((rowData, visualIndex) => {
                const row = document.createElement('div');
                row.style.display = 'grid';
                row.style.gridTemplateColumns = '12% 5% 6% 5% 33% 10% 3% 14% 14%';
                row.style.gap = '0';
                const isFirstStIndex = rowData.displayOrder === 0;
                const targetRowHeight = isFirstStIndex ? rowHeightDoublePx : rowHeightPx;
                row.style.minHeight = targetRowHeight;
                row.style.height = targetRowHeight;
                row.style.borderBottom = 'none';
                
                // Column 1: Speed Limit (with vertical indicator line)
                const speedCol = document.createElement('div');
                speedCol.style.borderRight = '2px solid var(--current-screen-border-color, #D0D0D0)';
                speedCol.style.padding = '2px 6px 2px 10px';
                speedCol.style.display = 'flex';
                speedCol.style.alignItems = 'flex-end';
                speedCol.style.justifyContent = 'flex-end';
                speedCol.style.position = 'relative';
                speedCol.style.overflow = 'hidden';
                speedCol.style.height = '100%';
                speedCol.style.minHeight = '100%';
                
                const speedValue = getDisplaySpeed(rowData.stEntry);
                const nextRow = visualIndex < rows.length - 1 ? rows[visualIndex + 1] : null;
                const nextSpeed = nextRow ? getDisplaySpeed(nextRow.stEntry) : null;
                const isSpeedGroupEnd = !nextRow || String(nextSpeed) !== String(speedValue);
                const isInvertedSpeedlimit = rowData.stEntry.invertedSpeedlimit === true;
                const speedText = document.createElement('div');
                speedText.style.fontWeight = 'bold';
                speedText.style.fontSize = 'inherit';
                const convertedSpeed = convertSpeed(speedValue);
                speedText.textContent = isSpeedGroupEnd ? (convertedSpeed !== null ? String(Math.round(convertedSpeed)) : '') : '';
                
                // Add yellow highlight if speedLimitFront is true
                if (rowData.stEntry.speedLimitFront === true) {
                    speedText.style.backgroundColor = 'yellow';
                    speedText.style.padding = '2px 4px';
                    speedText.style.borderRadius = '3px';
                    speedText.style.color = '#000';
                }

                // Apply inverted speed limit style with theme-aware colors
                if (isInvertedSpeedlimit && speedText.textContent !== '') {
                    speedText.style.backgroundColor = 'var(--current-screen-text-color, #D0D0D0)';
                    speedText.style.color = 'var(--current-screen-bg, #000000)';
                    speedText.style.padding = '2px 4px';
                    speedText.style.borderRadius = '0px';
                }
                
                speedCol.appendChild(speedText);
                
                // Add vertical indicator line
                const speedLine = document.createElement('div');
                speedLine.style.position = 'absolute';
                speedLine.style.width = '6px';
                speedLine.style.height = '100%';
                speedLine.style.top = '0';
                speedLine.style.backgroundColor = 'var(--current-screen-text-color, #D0D0D0)';
                const normalizedSpeed = Math.max(0, Math.min(1, (parseFloat(speedValue) - speedMin) / (speedMax - speedMin)));
                const lineLeftPercent = 5 + (normalizedSpeed * 60);
                speedLine.style.left = `${lineLeftPercent}%`;
                speedCol.appendChild(speedLine);
                
                // Column 2: KM
                const kmCol = document.createElement('div');
                kmCol.style.padding = '2px 0px';
                kmCol.style.display = 'flex';
                kmCol.style.alignItems = 'center';
                kmCol.style.justifyContent = 'center';
                kmCol.style.fontSize = 'inherit';
                kmCol.style.height = '100%';
                kmCol.style.minHeight = '100%';
                if (rowData.stEntry.line_change === true) {
                    kmCol.style.borderTop = '2px solid var(--current-screen-border-color, #D0D0D0)';
                }
                if (isInvertedSpeedlimit) {
                    kmCol.style.backgroundColor = 'var(--current-screen-text-color, #D0D0D0)';
                    kmCol.style.color = 'var(--current-screen-bg, #000000)';
                }
                const kmText = document.createElement('div');
                const kmRaw = Number(rowData.stEntry.km);
                kmText.textContent = Number.isFinite(kmRaw) ? kmRaw.toFixed(1) : '';
                kmCol.appendChild(kmText);
                
                // Column 3: Infrastructure (Tunnel/Track indicators)
                const infraCol = document.createElement('div');
                infraCol.style.padding = '0';
                infraCol.style.display = 'flex';
                infraCol.style.alignItems = 'center';
                infraCol.style.justifyContent = 'center';
                infraCol.style.position = 'relative';
                infraCol.style.height = '100%';
                infraCol.style.minHeight = '100%';
                infraCol.style.overflow = 'visible';
                
                const mainLineOffset = isAltTimetable ? 28 : 0;
                const dualLineOffset = isAltTimetable ? 0 : 28;
                const mainToDualMovesRight = dualLineOffset < mainLineOffset;

                // Continuous vertical line (active main track)
                const infraLine = document.createElement('div');
                infraLine.style.position = 'absolute';
                infraLine.style.width = '4px';
                infraLine.style.height = '100%';
                infraLine.style.top = '0';
                infraLine.style.right = `${mainLineOffset}px`;
                infraLine.style.backgroundColor = 'var(--current-screen-text-color, #D0D0D0)';
                infraCol.appendChild(infraLine);
                
                // Tunnel graphics
                if (rowData.stEntry.tunnelStart === true) {
                    const tunnelStart = document.createElement('div');
                    tunnelStart.style.position = 'absolute';
                    tunnelStart.style.top = '50%';
                    tunnelStart.style.transform = 'translateY(-50%)';
                    
                    tunnelStart.style.right = `${mainLineOffset - 11}px`;
                    
                    // Increased height for a "taller" look
                    tunnelStart.style.width = '20px'; 
                    tunnelStart.style.height = '100%'; 
                    
                    // Fill color
                    const color = 'var(--current-screen-text-color, #D0D0D0)';
                    tunnelStart.style.backgroundColor = color;

                    /* MASK LOGIC for "Skinnier Legs":
                    We create a mask that is transparent at the bottom-center.
                    The '15% 0' and '85% 0' define the thickness of the legs.
                    */
                    const maskValue = `linear-gradient(to top, transparent 60%, black 61%), 
                                    radial-gradient(circle at 50% 40%, transparent 35%, black 36%)`;
                    
                    // Using a simpler clip-path approach for cleaner "legs" and better performance:
                    tunnelStart.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 80% 100%, 80% 40%, 20% 40%, 20% 100%, 0% 100%)';
                    
                    // Note: If you want smooth rounded "shoulders" inside the U, 
                    // we use the mask approach instead:
                    tunnelStart.style.webkitMaskImage = 'linear-gradient(to bottom, black 40%, transparent 40%), radial-gradient(circle at 50% 40%, black 100%, transparent 100%)';
                    
                    // Recommendation: Use the Clip-Path below for the sharpest "long leg" look
                    tunnelStart.style.clipPath = 'path("M 0 0 H 14 V 25 H 11 V 25 Q 11 10 7 10 Q 3 10 3 25 V 25 H 0 Z")';

                    infraCol.appendChild(tunnelStart);
                }
                
                if (rowData.stEntry.tunnelEnd === true) {
                    // Tunnel exit: filled rectangle with U-shaped cutout at top
                    const tunnelEnd = document.createElement('div');
                    tunnelEnd.style.position = 'absolute';
                    tunnelEnd.style.top = '50%';
                    tunnelEnd.style.transform = 'translateY(-50%)';
                    
                    tunnelEnd.style.right = `${mainLineOffset - 11}px`;

                    // Matches your Start dimensions
                    tunnelEnd.style.width = '20px'; 
                    tunnelEnd.style.height = '100%'; 

                    // Fill color
                    const color = 'var(--current-screen-text-color, #D0D0D0)';
                    tunnelEnd.style.backgroundColor = color;

                    /* FLIPPED MASK LOGIC:
                    Transparent at the top-center instead of bottom.
                    We swap the 40% and 60% thresholds to flip the vertical orientation.
                    */
                    const maskValue = `linear-gradient(to bottom, transparent 60%, black 61%), 
                                    radial-gradient(circle at 50% 60%, transparent 35%, black 36%)`;

                    // Mirroring the polygon: Cutting from the TOP instead of the bottom
                    tunnelEnd.style.clipPath = 'polygon(0% 100%, 100% 100%, 100% 0%, 80% 0%, 80% 60%, 20% 60%, 20% 0%, 0% 0%)';

                    // Mirroring the Mask for rounded shoulders (flipped to top)
                    tunnelEnd.style.webkitMaskImage = 'linear-gradient(to top, black 40%, transparent 40%), radial-gradient(circle at 50% 60%, black 100%, transparent 100%)';

                    /* MIRRORED PATH: 
                    Flipped vertically. We change the starting M and the drawing directions 
                    so the cutout happens at the top of the rectangle.
                    */
                    tunnelEnd.style.clipPath = 'path("M 0 25 H 14 V 0 H 11 V 0 Q 11 15 7 15 Q 3 15 3 0 V 0 H 0 Z")';

                    infraCol.appendChild(tunnelEnd);
                }
                
                if (rowData.stEntry.tunnel === true) {
                    // Inside tunnel: dashed lines on both sides
                    const leftDash = document.createElement('div');
                    leftDash.style.position = 'absolute';
                    leftDash.style.right = `${mainLineOffset + 6}px`;
                    leftDash.style.width = '2px';
                    leftDash.style.height = '100%';
                    leftDash.style.top = '0';
                    leftDash.style.borderLeft = '2px dashed var(--current-screen-text-color, #D0D0D0)';
                    infraCol.appendChild(leftDash);
                    
                    const rightDash = document.createElement('div');
                    rightDash.style.position = 'absolute';
                    rightDash.style.right = `${mainLineOffset - 6}px`;
                    rightDash.style.width = '2px';
                    rightDash.style.height = '100%';
                    rightDash.style.top = '0';
                    rightDash.style.borderLeft = '2px dashed var(--current-screen-text-color, #D0D0D0)';
                    infraCol.appendChild(rightDash);
                }
                
                // Dual-track graphics
                if (rowData.stEntry.dualTrack === true) {
                    // Secondary line stays at fixed geometry; role swaps in alt mode
                    const dualLine = document.createElement('div');
                    dualLine.style.position = 'absolute';
                    dualLine.style.width = '2px';
                    dualLine.style.height = '99%';
                    dualLine.style.top = '4%';
                    dualLine.style.right = `${dualLineOffset}px`;
                    dualLine.style.backgroundColor = 'var(--current-screen-text-color, #D0D0D0)';
                    infraCol.appendChild(dualLine);
                }
                
                if (rowData.stEntry.dualTrackSart === true) {
                    // Diagonal line from main to dual track (splitting apart at 45 degrees)
                    const splitLine = document.createElement('div');
                    splitLine.style.position = 'absolute';
                    splitLine.style.width = '2px';
                    splitLine.style.height = '38px';
                    splitLine.style.bottom = '0';
                    splitLine.style.right = `${mainLineOffset}px`;
                    splitLine.style.transformOrigin = 'bottom center';
                    splitLine.style.transform = `rotate(${mainToDualMovesRight ? 48 : -48}deg)`;
                    splitLine.style.backgroundColor = 'var(--current-screen-text-color, #D0D0D0)';
                    infraCol.appendChild(splitLine);
                }
                
                if (rowData.stEntry.dualTrackEnd === true) {
                    // Diagonal line from dual track back to main (converging at 45 degrees)
                    const mergeLine = document.createElement('div');
                    mergeLine.style.position = 'absolute';
                    mergeLine.style.width = '2px';
                    mergeLine.style.height = '40px';
                    mergeLine.style.top = '0';
                    mergeLine.style.right = `${mainLineOffset}px`;
                    mergeLine.style.transformOrigin = 'top center';
                    mergeLine.style.transform = `rotate(${mainToDualMovesRight ? -45 : 45}deg)`;
                    mergeLine.style.backgroundColor = 'var(--current-screen-text-color, #D0D0D0)';
                    infraCol.appendChild(mergeLine);
                }
                
                // Column 4: Picto
                const pictoCol = document.createElement('div');
                pictoCol.style.padding = '0';
                pictoCol.style.display = 'flex';
                pictoCol.style.alignItems = 'flex-end';
                pictoCol.style.justifyContent = 'center';
                pictoCol.style.height = '100%';
                pictoCol.style.minHeight = '100%';
                
                const pictoDiv = document.createElement('div');
                pictoDiv.style.display = 'flex';
                pictoDiv.style.alignItems = 'center';
                pictoDiv.style.justifyContent = 'center';
                pictoDiv.style.fontSize = 'inherit';
                //pictoDiv.style.fontWeight = 'bold';
                pictoDiv.style.minWidth = '18px';
                pictoDiv.style.position = 'relative';
                pictoDiv.style.height = '100%';
                
                const pictoEntry = rowData.stEntry;
                
                // Handle icon display
                if (pictoEntry.picto_icon) {
                    // Pre-load the icon (asynchronously in background)
                    if (window.pictoIconLoader) {
                        window.pictoIconLoader.loadIcon(pictoEntry.picto_icon);
                    }
                    
                    // Try to get cached icon
                    const cachedIcon = window.pictoIconLoader ? window.pictoIconLoader.getIcon(pictoEntry.picto_icon) : null;
                    if (cachedIcon && typeof cachedIcon === 'object') {
                        // Icon is loaded, display it
                        const iconImg = document.createElement('img');
                        iconImg.src = cachedIcon.src;
                        iconImg.style.maxWidth = '100%';
                        iconImg.style.maxHeight = '100%';
                        iconImg.style.width = 'auto';
                        iconImg.style.height = 'auto';
                        iconImg.style.objectFit = 'contain';
                        iconImg.style.position = 'relative';
                        iconImg.style.zIndex = '1';
                        pictoDiv.appendChild(iconImg);
                    } else if (cachedIcon !== 'loading') {
                        // Icon failed to load, show text fallback
                        const pictoText = document.createElement('div');
                        pictoText.style.display = 'flex';
                        pictoText.style.alignItems = 'flex-end';
                        pictoText.style.fontSize = 'inherit';
                        pictoText.style.fontWeight = 'bold';
                        pictoText.style.position = 'relative';
                        pictoText.style.zIndex = '1';
                        pictoText.textContent = pictoEntry.picto || '';
                        pictoDiv.appendChild(pictoText);
                    }
                    // If still loading, show nothing (will re-render next cycle when cached)
                } else if (pictoEntry.picto) {
                    // No icon, just show text
                    const pictoText = document.createElement('div');
                    pictoText.style.display = 'flex';
                    pictoText.style.alignItems = 'flex-end';
                    pictoText.style.fontSize = pictoEntry.pictoFont || 'inherit';
                    pictoText.style.fontWeight = 'bold';
                    pictoText.style.position = 'relative';
                    pictoText.style.zIndex = '1';
                    pictoText.textContent = pictoEntry.picto;
                    pictoDiv.appendChild(pictoText);
                }
                
                // Apply rounded border if enabled
                if (pictoEntry.picto_border_radius) {
                    pictoDiv.style.border = '1px solid var(--current-screen-text-color, #D0D0D0)';
                    pictoDiv.style.borderRadius = '4px';
                    pictoDiv.style.padding = '2px 6px';
                    pictoDiv.style.minWidth = 'auto';
                }
                
                // Create SVG overlay for strikethrough lines
                const pictoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                pictoSvg.setAttribute('class', 'picto-strikethrough');
                pictoSvg.style.position = 'absolute';
                pictoSvg.style.top = '0';
                pictoSvg.style.left = '0';
                pictoSvg.style.width = '100%';
                pictoSvg.style.height = '100%';
                pictoSvg.style.pointerEvents = 'none';
                pictoSvg.style.zIndex = '2';
                
                // Add horizontal strikethrough if enabled
                if (pictoEntry.picto_strikethrough_horizontal) {
                    const horizLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    horizLine.setAttribute('x1', '0%');
                    horizLine.setAttribute('y1', '50%');
                    horizLine.setAttribute('x2', '100%');
                    horizLine.setAttribute('y2', '50%');
                    horizLine.setAttribute('stroke', 'var(--current-screen-text-color, #D0D0D0)');
                    horizLine.setAttribute('stroke-width', '2');
                    pictoSvg.appendChild(horizLine);
                }
                
                // Add diagonal strikethrough if enabled
                if (pictoEntry.picto_strikethrough_diagonal) {
                    const diagLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    diagLine.setAttribute('x1', '0%');
                    diagLine.setAttribute('y1', '0%');
                    diagLine.setAttribute('x2', '100%');
                    diagLine.setAttribute('y2', '100%');
                    diagLine.setAttribute('stroke', 'var(--current-screen-text-color, #D0D0D0)');
                    diagLine.setAttribute('stroke-width', '2');
                    pictoSvg.appendChild(diagLine);
                }
                
                if (pictoSvg.hasChildNodes()) {
                    pictoDiv.appendChild(pictoSvg);
                }
                
                pictoCol.appendChild(pictoDiv);
                
                // Column 5: Location
                const locationCol = document.createElement('div');
                locationCol.style.padding = '8px';
                locationCol.style.display = 'flex';
                locationCol.style.alignItems = 'center';
                locationCol.style.height = '100%';
                locationCol.style.minHeight = '100%';
                locationCol.style.borderBottom = '1px solid var(--current-screen-border-color, #D0D0D0)';
                
                const locationDiv = document.createElement('div');
                locationDiv.style.display = 'flex';
                locationDiv.style.alignItems = 'center';
                locationDiv.style.fontSize = 'inherit';
                locationDiv.style.whiteSpace = 'nowrap';
                locationDiv.style.overflow = 'hidden';
                locationDiv.style.textOverflow = 'ellipsis';
                locationDiv.style.flex = '1';
                locationDiv.style.paddingLeft = '0';
                if (rowData.isClosest) {
                    locationDiv.style.fontWeight = 'bold';
                    locationDiv.textContent = (rowData.stEntry.location || '') + ' ◄';
                } else if (rowData.ttEntry && rowData.ttEntry.stop === true) {
                    locationDiv.style.fontWeight = 'bold';
                    locationDiv.textContent = rowData.stEntry.location || '';
                } else {
                    locationDiv.textContent = rowData.stEntry.location || '';
                }
                
                locationCol.appendChild(locationDiv);

                // Column 6: Signal
                const signalCol = document.createElement('div');
                signalCol.style.padding = '8px';
                signalCol.style.display = 'flex';
                signalCol.style.alignItems = 'center';
                signalCol.style.height = '100%';
                signalCol.style.minHeight = '100%';
                signalCol.style.borderBottom = '1px solid var(--current-screen-border-color, #D0D0D0)';

                const signalDiv = document.createElement('div');
                signalDiv.style.display = 'flex';
                signalDiv.style.alignItems = 'center';
                signalDiv.style.fontSize = 'inherit';
                signalDiv.style.whiteSpace = 'nowrap';
                signalDiv.style.overflow = 'hidden';
                signalDiv.style.textOverflow = 'ellipsis';
                signalDiv.style.flex = '1';
                signalDiv.style.paddingLeft = '0';
                signalDiv.textContent = rowData.stEntry.signal !== undefined && rowData.stEntry.signal !== null
                    ? String(rowData.stEntry.signal)
                    : '';

                signalCol.appendChild(signalDiv);

                // Column 7: Incline indicator (zig-zag), right-aligned
                const inclineCol = document.createElement('div');
                inclineCol.style.padding = '0 6px 0 0';
                inclineCol.style.display = 'flex';
                inclineCol.style.alignItems = 'stretch';
                inclineCol.style.justifyContent = 'flex-end';
                inclineCol.style.height = '100%';
                inclineCol.style.minHeight = '100%';
                inclineCol.style.position = 'relative';
                inclineCol.style.overflow = 'hidden';

                const inclineRaw = Number(rowData.stEntry && rowData.stEntry.incline);
                const inclineValue = Number.isFinite(inclineRaw)
                    ? Math.max(0, Math.min(2, Math.round(inclineRaw)))
                    : 0;

                if (inclineValue > 0) {
                    // Alternate phase based on data index so adjacent rows connect into a continuous zig-zag.
                    // Even stIndex: peaks at top (y=0) and mid (y=66) on xRight side.
                    // Odd  stIndex: peaks at top (y=0) and mid (y=66) on xLeft side (phase-shifted by half period).
                    const isAltPhase = rowData.stIndex % 2 === 1;

                    const inclineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    inclineSvg.setAttribute('width', '20');
                    inclineSvg.setAttribute('height', '100%');
                    inclineSvg.setAttribute('viewBox', '0 0 20 100');
                    inclineSvg.setAttribute('preserveAspectRatio', 'none');
                    inclineSvg.style.width = '30px';
                    inclineSvg.style.height = '100%';
                    inclineSvg.style.display = 'block';

                    const drawInclineLine = (xRight) => {
                        const xLeft = xRight - 7;
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                        // Phase 0 (even): xRight,0 → xLeft,33 → xRight,66 → xLeft,100  (ends bottom-left)
                        // Phase 1 (odd):  xLeft,0 → xRight,33 → xLeft,66 → xRight,100  (ends bottom-right)
                        const points = isAltPhase
                            ? `${xLeft},0 ${xRight},33 ${xLeft},66 ${xRight},100`
                            : `${xRight},0 ${xLeft},33 ${xRight},66 ${xLeft},100`;
                        line.setAttribute('points', points);
                        line.setAttribute('fill', 'none');
                        line.setAttribute('stroke', 'var(--current-screen-text-color, #D0D0D0)');
                        line.setAttribute('stroke-width', '1.2');
                        line.setAttribute('stroke-linecap', 'round');
                        line.setAttribute('stroke-linejoin', 'round');
                        inclineSvg.appendChild(line);
                    };

                    drawInclineLine(17);
                    if (inclineValue >= 2) {
                        drawInclineLine(8);
                    }

                    inclineCol.appendChild(inclineSvg);
                }
                
                // Column 8: ETA / ATA
                const etaCol = document.createElement('div');
                etaCol.style.borderLeft = '2px solid var(--current-screen-border-color, #D0D0D0)';
                etaCol.style.borderRight = '2px solid var(--current-screen-border-color, #D0D0D0)';
                etaCol.style.padding = '2px 4px';
                etaCol.style.display = 'flex';
                etaCol.style.flexDirection = 'column';
                etaCol.style.alignItems = 'center';
                etaCol.style.justifyContent = 'center';
                etaCol.style.fontSize = 'inherit';
                etaCol.style.height = '100%';
                etaCol.style.minHeight = '100%';
                
                const etaDiv = document.createElement('div');
                if (rowData.ttEntry && rowData.ttEntry.stop === false) {
                    etaDiv.style.fontSize = '0.8em';
                    etaDiv.style.fontStyle = 'italic';
                    etaDiv.style.fontWeight = 'normal';
                } else {
                    etaDiv.style.fontWeight = 'bold';
                }
                etaDiv.textContent = (rowData.ttEntry ? rowData.ttEntry.ETA : '');
                etaCol.appendChild(etaDiv);
                
                if (rowData.ttEntry && rowData.ttEntry.ATA) {
                    const ataDiv = document.createElement('div');
                    ataDiv.style.fontSize = '0.8em';
                    ataDiv.style.fontStyle = 'italic';
                    ataDiv.style.fontWeight = 'normal';
                    ataDiv.textContent = rowData.ttEntry.ATA;
                    etaCol.appendChild(ataDiv);
                }

                // Column 9: ETD / ATD
                const etdCol = document.createElement('div');
                etdCol.style.padding = '2px 4px';
                etdCol.style.display = 'flex';
                etdCol.style.flexDirection = 'column';
                etdCol.style.alignItems = 'center';
                etdCol.style.justifyContent = 'center';
                etdCol.style.fontSize = 'inherit';
                etdCol.style.height = '100%';
                etdCol.style.minHeight = '100%';
                
                const etdDiv = document.createElement('div');
                if (rowData.ttEntry && rowData.ttEntry.stop === false) {
                    etdDiv.style.fontStyle = 'italic';
                    etdDiv.style.fontWeight = 'normal';
                } else {
                    etdDiv.style.fontWeight = 'bold';
                }
                etdDiv.textContent = (rowData.ttEntry ? rowData.ttEntry.ETD : '');
                etdCol.appendChild(etdDiv);
                
                if (rowData.ttEntry && rowData.ttEntry.ATD) {
                    const atdDiv = document.createElement('div');
                    atdDiv.style.fontSize = '0.8em';
                    atdDiv.style.fontStyle = 'italic';
                    atdDiv.style.fontWeight = 'normal';
                    atdDiv.textContent = rowData.ttEntry.ATD;
                    etdCol.appendChild(atdDiv);
                }
                
                if (isSpeedGroupEnd && nextRow) {
                    speedCol.style.borderBottom = '2px solid var(--current-screen-border-color, #D0D0D0)';
                }

                row.appendChild(speedCol);
                row.appendChild(kmCol);
                row.appendChild(infraCol);
                row.appendChild(pictoCol);
                row.appendChild(locationCol);
                row.appendChild(signalCol);
                row.appendChild(inclineCol);
                row.appendChild(etaCol);
                row.appendChild(etdCol);
                
                tableContainer.appendChild(row);
            });
        }
    },

    /**
     * LIST - A component that displays a rolling list of values from conditions
     * Similar to text_indicator but maintains a scrolling list of the latest N items
     * When more items are added than maxRows allows, the oldest item is removed
     * Displays items from oldest (top) to newest (bottom)
     */
    list: {
        render: (container, componentConfig, data) => {
            container.innerHTML = '';
            container.classList.add('component', 'list-component');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.overflow = 'hidden';
            container.style.padding = '0';
            container.style.gap = '0';

            // Initialize component state if not present
            const componentId = componentConfig.id;
            if (!window._listComponentStates) {
                window._listComponentStates = {};
            }
            if (!window._listComponentStates[componentId]) {
                window._listComponentStates[componentId] = {
                    items: [], // Array of {text, display, timestamp}
                    previousConditionStates: {} // Track which conditions were true in last update
                };
            }

            // Create rows container
            const listContainer = document.createElement('div');
            listContainer.id = `${componentId}-rows`;
            listContainer.style.display = 'flex';
            listContainer.style.flexDirection = 'column';
            listContainer.style.flex = '1';
            listContainer.style.overflow = 'hidden';
            container.appendChild(listContainer);

            ComponentRegistry.list.update(container, componentConfig, data);
        },
        update: (container, componentConfig, data) => {
            const componentId = componentConfig.id;
            const maxRows = componentConfig.maxRows || 5;
            const rowHeight = componentConfig.rowHeight || 'auto';
            const fontFamily = componentConfig.fontFamily || 'Arial';
            const fontSize = componentConfig.fontSize || '14px';
            const removeIfNotMet = componentConfig.removeIfNotMet === true;

            // Get or create component state
            if (!window._listComponentStates) {
                window._listComponentStates = {};
            }
            if (!window._listComponentStates[componentId]) {
                window._listComponentStates[componentId] = {
                    items: [],
                    previousConditionStates: {} // Track which conditions were true in last update
                };
            }
            const state = window._listComponentStates[componentId];

            // Ensure previousConditionStates exists (for backwards compatibility)
            if (!state.previousConditionStates) {
                state.previousConditionStates = {};
            }

            // Check all conditions and collect matched values
            const conditions = Array.isArray(componentConfig.conditions)
                ? componentConfig.conditions
                : [];
            const activeConditionStates = {};

            const currentTimestamp = Date.now();

            // Check each condition for state change (rising edge detection)
            for (let condIndex = 0; condIndex < conditions.length; condIndex++) {
                const condition = conditions[condIndex];
                const isCurrentlyActive = indicatorConditionMatches(condition, data);
                const wasPreviouslyActive = state.previousConditionStates[condIndex] === true;
                activeConditionStates[condIndex] = isCurrentlyActive;

                // Only add item if condition transitioned from false to true
                if (isCurrentlyActive && !wasPreviouslyActive) {
                    // Condition is now met (and wasn't before) - resolve the display value
                    const displayText = String(resolveIndicatorDisplay(condition, componentConfig, data) || '');
                    
                    // Add new item to list with display config
                    state.items.push({
                        text: displayText,
                        display: condition.display || componentConfig.default || {},
                        timestamp: currentTimestamp,
                        conditionIndex: condIndex
                    });
                }

                // Update the previous state for next update
                state.previousConditionStates[condIndex] = isCurrentlyActive;
            }

            if (removeIfNotMet) {
                state.items = state.items.filter((item) => {
                    if (item.conditionIndex === undefined || item.conditionIndex === null) {
                        return false;
                    }
                    return activeConditionStates[item.conditionIndex] === true;
                });
            }

            // Keep only the latest maxRows items
            if (state.items.length > maxRows) {
                state.items = state.items.slice(-maxRows);
            }

            // Clear the rows container
            const listContainer = container.querySelector(`#${componentId}-rows`);
            if (listContainer) {
                listContainer.innerHTML = '';

                // Render each item as a row
                state.items.forEach((item, index) => {
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'list-row';
                    rowDiv.style.display = 'flex';
                    rowDiv.style.alignItems = 'center';
                    rowDiv.style.padding = '4px 8px';
                    rowDiv.style.minHeight = rowHeight === 'auto' ? 'auto' : rowHeight;
                    rowDiv.style.height = rowHeight === 'auto' ? 'auto' : rowHeight;
                    rowDiv.style.fontFamily = fontFamily;
                    rowDiv.style.fontSize = fontSize;
                    rowDiv.style.flex = '0 0 auto';
                    rowDiv.style.position = 'relative';
                    rowDiv.style.overflow = 'hidden';

                    // Create text element for the row
                    const textElement = document.createElement('div');
                    textElement.className = 'list-row-text';
                    textElement.style.whiteSpace = 'nowrap';
                    textElement.style.overflow = 'hidden';
                    textElement.style.textOverflow = 'ellipsis';
                    textElement.style.flex = '1';
                    textElement.style.position = 'relative';
                    textElement.style.zIndex = '1';
                    textElement.textContent = item.text;
                    rowDiv.appendChild(textElement);

                    // Create SVG overlay for diagonal lines
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', 'list-row-diagonal');
                    svg.style.position = 'absolute';
                    svg.style.top = '0';
                    svg.style.left = '0';
                    svg.style.width = '100%';
                    svg.style.height = '100%';
                    svg.style.pointerEvents = 'none';
                    svg.style.zIndex = '0';
                    rowDiv.appendChild(svg);

                    // Add border between rows (but not above the first row)
                    if (index > 0) {
                        rowDiv.style.borderTop = '1px solid var(--current-screen-border-color, #D0D0D0)';
                    }

                    // Apply styles to the row
                    const itemDisplay = item.display || {};
                    applyIndicatorStyles(rowDiv, textElement, itemDisplay, componentConfig, svg);

                    listContainer.appendChild(rowDiv);
                });
            }
        }
    }
};

/**
 * Component Factory
 * Creates and manages component instances
 */
class ComponentFactory {
    static toCssSize(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
        if (typeof value === 'string') return value;
        return '';
    }

    static createComponent(type, id) {
        const renderer = ComponentRegistry[type];
        if (!renderer) {
            console.warn(`Unknown component type: ${type}`);
            return null;
        }
        return {
            type,
            id,
            render: renderer.render,
            update: renderer.update
        };
    }

    static renderComponent(container, componentConfig, data) {
        const component = this.createComponent(componentConfig.type, componentConfig.id);
        if (component) {
            const width = this.toCssSize(componentConfig.width);
            const height = this.toCssSize(componentConfig.height);
            const minWidth = this.toCssSize(componentConfig.minWidth);
            const minHeight = this.toCssSize(componentConfig.minHeight);
            container.style.width = width;
            container.style.height = height;
            container.style.minWidth = minWidth;
            container.style.minHeight = minHeight;
            component.render(container, componentConfig, data);
        }
    }

    static updateComponent(container, componentConfig, data) {
        const component = this.createComponent(componentConfig.type, componentConfig.id);
        if (component) {
            component.update(container, componentConfig, data);
        }
    }
}

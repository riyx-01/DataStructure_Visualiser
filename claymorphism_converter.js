const fs = require('fs');
const path = require('path');

const cssTransform = (content) => {
    // 1. Text Colors
    content = content.replace(/color:\s*(#[fffFFF]{3,6}|white|#e2e8f0|#f8fafc|#cbd5e1|#94a3b8|#f3f4f6|#9ca3af|#a7b8cc);/g, 'color: #4A5568;');
    
    // 2. Backgrounds
    content = content.replace(/background:\s*(#0f172a|#1e293b|rgba\([^)]+\)|linear-gradient\([^)]+\)|#2c3548|#1b2234|#2b3344|#181d2a|#242c3d|#151a24|#020617|#1e293b);/g, 'background: #E0E5EC;');
    content = content.replace(/background-color:\s*(#0f172a|#1e293b|rgba\([^)]+\)|#2c3548|#1b2234|#2b3344|#181d2a|#242c3d|#151a24|#020617|#1e293b);/g, 'background-color: #E0E5EC;');

    // Change gradient backgrounds to clay accent colors where appropriate
    content = content.replace(/background:\s*linear-gradient\([^\)]*10b981[^\)]*\);/gi, 'background: #FFB3C6;');
    content = content.replace(/background:\s*linear-gradient\([^\)]*34d399[^\)]*\);/gi, 'background: #90E0EF;');
    content = content.replace(/background:\s*linear-gradient\([^\)]*16a34a[^\)]*\);/gi, 'background: #FDFFB6;');
    content = content.replace(/background:\s*linear-gradient\([^\)]*22c55e[^\)]*\);/gi, 'background: #90E0EF;');

    // 3. Borders - remove all boundaries to emphasize shadows
    content = content.replace(/border:\s*[^\n;]+;/g, 'border: none;');
    content = content.replace(/border-(top|bottom|left|right):\s*[^\n;]+;/g, 'border-$1: none;');

    // 4. Box Shadows - Apply Claymorphism standard
    const clayShadowBase = 'box-shadow: 8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff, inset 4px 4px 8px rgba(255, 255, 255, 0.8), inset -4px -4px 8px rgba(163, 177, 198, 0.4);';
    content = content.replace(/box-shadow:\s*[^;]+;/g, clayShadowBase);

    // 5. Border Radiuses
    content = content.replace(/border-radius:\s*[^\n;]+;/g, 'border-radius: 20px;');

    // 6. Text Shadows
    content = content.replace(/text-shadow:\s*[^;]+;/g, 'text-shadow: none;');

    // Fix active items to look "pressed" into the clay
    const pressedShadow = 'box-shadow: inset 8px 8px 16px #a3b1c6, inset -8px -8px 16px #ffffff;';
    content = content.replace(/\.([a-zA-Z0-9_-]+):active\s*{[^}]*}/g, (match) => {
        return match.replace(/box-shadow:\s*[^;]+;/g, pressedShadow);
    });

    content = content.replace(/\.([a-zA-Z0-9_-]+)\.active\s*{[^}]*}/g, (match) => {
        return match.replace(/box-shadow:\s*[^;]+;/g, pressedShadow).replace(/background:\s*[^;]+;/g, 'background: #E0E5EC;');
    });

    return content;
};

const walk = (dir) => {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.css') && file !== 'index.css') { // preserve index.css if needed, or transform all
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = cssTransform(content);
            // Some specific overrides for Claymorphism
            if (file === 'App.css') {
                newContent = newContent.replace(/background: #0f172a;/g, 'background: #E0E5EC;');
            }
            fs.writeFileSync(fullPath, newContent, 'utf8');
            console.log(`Transformed ${fullPath}`);
        }
    });
};

walk('e:/ds_visualize/src');

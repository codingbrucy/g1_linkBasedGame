class Engine {

    static load(...args) {
        window.onload = () => new Engine(...args);
    }

    constructor(firstSceneClass, storyDataUrl) {

        this.firstSceneClass = firstSceneClass;
        this.storyDataUrl = storyDataUrl;

        this.header = document.body.appendChild(document.createElement("h1"));
        this.output = document.body.appendChild(document.createElement("div"));
        this.actionsContainer = document.body.appendChild(document.createElement("div"));

        // draggable backpack + expandable inventory panel
        this.backpackWrap = document.body.appendChild(document.createElement("div"));
        this.backpackWrap.id = "backpack-wrap";
        this.backpackWrap.innerHTML = `
            <svg id="backpack" width="80" height="90" viewBox="0 0 80 90">
                <rect x="30" y="2" width="20" height="12" rx="6" fill="none" stroke="#7a4a1e" stroke-width="4"/>
                <rect x="8" y="14" width="64" height="58" rx="10" fill="#A0522D"/>
                <rect x="18" y="38" width="44" height="26" rx="6" fill="#8B4513"/>
                <line x1="18" y1="51" x2="62" y2="51" stroke="#E8722A" stroke-width="2"/>
                <rect x="4" y="20" width="8" height="36" rx="4" fill="#7a4a1e"/>
                <rect x="68" y="20" width="8" height="36" rx="4" fill="#7a4a1e"/>
            </svg>`;

        this.inventoryPanel = document.body.appendChild(document.createElement("div"));
        this.inventoryPanel.id = "inventory-panel";
        this.inventoryPanel.innerHTML = `<span class='inv-label'>Inventory</span><ul id='inv-list'></ul><span class='inv-hint'>click anywhere to close bag</span>`;

        this.miniMap = document.body.appendChild(document.createElement("div"));
        this.miniMap.id = "mini-map";

        this.gameState = { inventory: [], coffeeCount: 0, have_won: false };
        this._initBackpackFollowCursor();

        fetch(storyDataUrl).then(
            (response) => response.json()
        ).then(
            (json) => {
                this.storyData = json;
                this.updateInventoryUI();
                this._buildMap();
                this.gotoScene(firstSceneClass);
            }
        );
    }

    gotoScene(sceneClass, data) {
        if (typeof data === 'string' && this.storyData && this.storyData.Locations && this.storyData.Locations[data]) {
            this._setCurrentLocation(data);
        }
        this.scene = new sceneClass(this);
        this.scene.create(data);
    }// this method takes a class name and constructs it.

    addChoice(action, data, delimiter = "›", delimiterSuffix = "") {
        let button = this.actionsContainer.appendChild(document.createElement("button"));
        button.innerHTML = `
            <span class="choice-text"></span>
            <svg class="walker" width="14" height="20" viewBox="0 0 14 20">
                <circle cx="7" cy="3" r="2.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
                <line x1="7" y1="5.5" x2="7" y2="13" stroke="currentColor" stroke-width="1.2"/>
                <line x1="7" y1="8" x2="2" y2="11" stroke="currentColor" stroke-width="1.2"/>
                <line x1="7" y1="8" x2="12" y2="11" stroke="currentColor" stroke-width="1.2"/>
                <line x1="7" y1="13" x2="3" y2="19" stroke="currentColor" stroke-width="1.2"/>
                <line x1="7" y1="13" x2="11" y2="19" stroke="currentColor" stroke-width="1.2"/>
            </svg>`;
        button.querySelector(".choice-text").innerText = action;
        button.onclick = () => {
            while(this.actionsContainer.firstChild) {
                this.actionsContainer.removeChild(this.actionsContainer.firstChild)
            }

            // action echo box with stick figure; hover swaps to descriptive-log
            const box = document.createElement("div");
            box.className = "action-echo";
            box.innerHTML = `
                <svg width="14" height="20" viewBox="0 0 14 20" style="vertical-align:middle; margin-right:6px;">
                    <circle cx="7" cy="3" r="2.5" stroke="#ccc" stroke-width="1.2" fill="none"/>
                    <line x1="7" y1="5.5" x2="7" y2="13" stroke="#ccc" stroke-width="1.2"/>
                    <line x1="7" y1="8" x2="2" y2="11" stroke="#ccc" stroke-width="1.2"/>
                    <line x1="7" y1="8" x2="12" y2="11" stroke="#ccc" stroke-width="1.2"/>
                    <line x1="7" y1="13" x2="3" y2="19" stroke="#ccc" stroke-width="1.2"/>
                    <line x1="7" y1="13" x2="11" y2="19" stroke="#ccc" stroke-width="1.2"/>
                </svg>
                <span class="echo-action"></span>
                <span class="echo-log"></span>`;
            box.querySelector(".echo-action").textContent = action;
            const log = (data && data["descriptive-log"]) || "";
            box.querySelector(".echo-log").textContent = log;
            if (log) box.classList.add("has-log");
            this.output.appendChild(box);
            this._scrollToBottom();

            // animate delimiter trail, then load scene
            const total = 32;
            const delay = 500 / total;
            const line = document.createElement("div");
            line.className = "scene-divider";
            const trail = document.createElement("span");
            const suffix = document.createElement("span");
            line.appendChild(trail);
            line.appendChild(suffix);
            const figure = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            figure.setAttribute("width", "14");
            figure.setAttribute("height", "20");
            figure.setAttribute("viewBox", "0 0 14 20");
            figure.style.verticalAlign = "middle";
            figure.style.marginLeft = "2px";
            figure.innerHTML = `
                <circle cx="7" cy="3" r="2.5" stroke="#aaa" stroke-width="1.2" fill="none"/>
                <line x1="7" y1="5.5" x2="7" y2="13" stroke="#aaa" stroke-width="1.2"/>
                <line x1="7" y1="8" x2="2" y2="11" stroke="#aaa" stroke-width="1.2"/>
                <line x1="7" y1="8" x2="12" y2="11" stroke="#aaa" stroke-width="1.2"/>
                <line x1="7" y1="13" x2="3" y2="19" stroke="#aaa" stroke-width="1.2"/>
                <line x1="7" y1="13" x2="11" y2="19" stroke="#aaa" stroke-width="1.2"/>`;
            line.appendChild(figure);
            this.output.appendChild(line);

            let count = 0;
            const interval = setInterval(() => {
                trail.textContent += delimiter;
                count++;
                this._scrollToBottom();
                if (count >= total) {
                    clearInterval(interval);
                    figure.remove();
                    if (delimiterSuffix) suffix.textContent = delimiterSuffix;
                    setTimeout(() => this.scene.handleChoice(data), 0);
                }
            }, delay);
        }
        return button;
    }

    setTitle(title) {
        document.title = title;
        this.header.innerText = title;
    }

    show(msg) {
        let div = document.createElement("div");
        div.innerHTML = msg;
        this.output.appendChild(div);
        this._scrollToBottom();
    }

    showImage(url, alt = "") {
        let img = document.createElement("img");
        img.src = url;
        img.alt = alt;
        img.style.maxWidth = "100%";
        img.onload = () => this._scrollToBottom();
        this.output.appendChild(img);
    }

    showToast(msg) {
        const toast = document.createElement("div");
        toast.className = "win-toast";
        toast.innerHTML = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("show"));
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 600);
        }, 4200);
    }

    _scrollToBottom() {
        this.output.scrollTo({ top: this.output.scrollHeight, behavior: 'smooth' });
    }

    _buildMap() {
        const locs = this.storyData.Locations;
        const initial = this.storyData.InitialLocation;
        const hidden = new Set(["keyTaken", "awardCoffeeBean"]);

        const depth = { [initial]: 0 };
        const queue = [initial];
        while (queue.length) {
            const k = queue.shift();
            const choices = (locs[k] && locs[k].Choices) || [];
            for (const c of choices) {
                if (locs[c.Target] && !(c.Target in depth)) {
                    depth[c.Target] = depth[k] + 1;
                    queue.push(c.Target);
                }
            }
        }
        for (const k of Object.keys(locs)) if (!(k in depth)) depth[k] = 0;
        for (const k of hidden) delete depth[k];

        const levels = {};
        for (const [k, d] of Object.entries(depth)) (levels[d] = levels[d] || []).push(k);

        const maxW = 160, rowH = 44, padY = 22;
        const depths = Object.keys(levels).map(Number).sort((a,b) => a - b);
        const height = padY * 2 + depths.length * rowH;

        const positions = {};
        for (const d of depths) {
            const keys = levels[d];
            const count = keys.length;
            keys.forEach((k, i) => {
                const x = count === 1 ? maxW / 2 : 14 + (maxW - 28) * (i / (count - 1));
                const y = padY + d * rowH;
                positions[k] = { x, y };
            });
        }

        const w = maxW;
        let svg = `<svg viewBox="0 0 ${w} ${height}" preserveAspectRatio="xMidYMid meet">`;
        for (const [k, loc] of Object.entries(locs)) {
            for (const c of (loc.Choices || [])) {
                const p1 = positions[k], p2 = positions[c.Target];
                if (p1 && p2) {
                    svg += `<line class="map-edge${c.LockedBy ? ' locked' : ''}" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"/>`;
                }
            }
        }
        const labelOverrides = { "Rachel Carson": "RCC", "secretGarden": "?" };
        for (const [k, p] of Object.entries(positions)) {
            const safeKey = k.replace(/"/g, '&quot;');
            const label = labelOverrides[k] || safeKey;
            svg += `<circle class="map-node" data-key="${safeKey}" cx="${p.x}" cy="${p.y}" r="3.5"/>`;
            svg += `<text class="map-label" data-key="${safeKey}" x="${p.x}" y="${p.y - 7}" text-anchor="middle">${label}</text>`;
        }
        svg += `</svg>`;
        this.miniMap.innerHTML = `<div class="map-title">Map</div>${svg}`;
    }

    _setCurrentLocation(key) {
        if (!this.miniMap) return;
        this.miniMap.querySelectorAll('.current').forEach(el => el.classList.remove('current'));
        this.miniMap.querySelectorAll(`[data-key="${CSS.escape(key)}"]`).forEach(el => el.classList.add('current'));
    }

    _initBackpackFollowCursor() {
        const wrap = this.backpackWrap;
        const panel = this.inventoryPanel;
        const bagW = 80, bagH = 90;
        const panelW = 360, panelH = 180;
        let placed = false;
        let dragging = false, moved = false, startX, startY, origLeft, origTop;
        let suppressClick = false;

        const openPanelAtBag = () => {
            const bagRect = wrap.getBoundingClientRect();
            let left = Math.max(8, Math.min(bagRect.left + bagW / 2 - panelW / 2, window.innerWidth  - panelW - 8));
            let top  = Math.max(8, Math.min(bagRect.top  + bagH / 2 - panelH / 2, window.innerHeight - panelH - 8));
            panel.style.left = left + 'px';
            panel.style.top  = top  + 'px';
            wrap.classList.add('expanded');
            panel.classList.add('open');
        };

        document.addEventListener('mousemove', (e) => {
            if (dragging) {
                const dx = e.clientX - startX, dy = e.clientY - startY;
                if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
                wrap.style.left = (origLeft + dx) + 'px';
                wrap.style.top  = (origTop  + dy) + 'px';
                return;
            }
            if (placed || wrap.classList.contains('expanded')) return;
            wrap.style.left = (e.clientX - bagW / 2) + 'px';
            wrap.style.top  = (e.clientY - bagH / 2) + 'px';
        });

        wrap.addEventListener('mousedown', (e) => {
            if (!placed || wrap.classList.contains('expanded')) return;
            dragging = true; moved = false;
            startX = e.clientX; startY = e.clientY;
            const rect = wrap.getBoundingClientRect();
            origLeft = rect.left; origTop = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                suppressClick = true;
            } else {
                openPanelAtBag();
                suppressClick = true;
            }
        });

        document.addEventListener('click', (e) => {
            if (suppressClick) { suppressClick = false; return; }
            if (panel.classList.contains('open')) {
                panel.classList.remove('open');
                wrap.classList.remove('expanded');
                if (!placed) {
                    placed = true;
                    wrap.classList.add('placed');
                }
                return;
            }
            if (e.target.closest('button, a, input')) return;
            if (placed) return;
            openPanelAtBag();
        });
    }

    updateInventoryUI() {        const list = document.getElementById("inv-list");
        list.innerHTML = "";
        const slots = 4;
        for (let i = 0; i < slots; i++) {
            const itemId = this.gameState.inventory[i];
            const itemData = itemId && this.storyData.Items && this.storyData.Items[itemId];
            let li = document.createElement("li");
            if (itemData) {
                li.innerHTML = `
                    <div class="inv-slot">
                        <img src="${itemData.image}" alt="${itemData.name}">
                    </div>
                    <span class="inv-slot-name">${itemData.name}</span>
                    <span class="inv-tooltip">${itemData.name}</span>`;
            } else {
                li.innerHTML = `<div class="inv-slot"></div><span class="inv-slot-name">&nbsp;</span>`;
            }
            list.appendChild(li);
        }
    }
}

class Scene {// virtual class, not to be used directly
    constructor(engine) {
        this.engine = engine;
    }

    create() { }

    update() { }

    handleChoice(action) {
        console.warn('no choice handler on scene ', this);
    }
}
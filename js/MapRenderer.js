import { GameState } from './GameState.js';

export const MapRenderer = {
    // Defines how far the map scrolls
    SCROLL_AMOUNT: 400,

    render(containerId, onNodeClick) {
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) return;

        const mapScreen = document.getElementById('map-screen');
        mapScreen.classList.remove('hidden-map');

        // 1. SAVE/CREATE TOKEN
        let token = document.getElementById('player-token');
        if (token) {
            token.remove();
        } else {
            token = document.createElement('div');
            token.id = 'player-token';
            token.innerHTML = '<img src="assets/images/helm.png" alt="Knight" class="token-img">';
        }

        mapContainer.innerHTML = '';

        // 2. PROCESS NODES (BFS for Ranks)
        const nodes = GameState.currentMapData.nodes;
        const ranks = [];
        const queue = [{ id: 0, depth: 0 }];
        const visited = new Set([0]);

        while (queue.length > 0) {
            const { id, depth } = queue.shift();
            if (!ranks[depth]) ranks[depth] = [];
            const node = nodes.find(n => n.id === id);
            if (node) {
                ranks[depth].push(node);
                if (node.connections) {
                    node.connections.forEach(nextId => {
                        if (!visited.has(nextId)) {
                            visited.add(nextId);
                            queue.push({ id: nextId, depth: depth + 1 });
                        }
                    });
                }
            }
        }

        // 3. RENDER RANKS
        let currentRankIndex = 0;
        ranks.forEach((rank, index) => {
            if (rank.find(n => n.id === GameState.player.currentNodeId)) {
                currentRankIndex = index;
            }
        });

        ranks.forEach((rank, index) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'map-row';

            if (index <= currentRankIndex) {
                rowDiv.classList.add('rank-expanded');
                rank.forEach(node => { if (node) rowDiv.appendChild(this.createNodeElement(node, 'visible', onNodeClick)); });
            } else if (index === currentRankIndex + 1) {
                // Expansion Logic
                const isFreshLoad = !document.getElementById('node-0');
                if (!isFreshLoad && GameState.player.previousNodeId !== undefined) {
                    rowDiv.classList.add('rank-collapsed');
                    rank.forEach(node => { if (node) rowDiv.appendChild(this.createNodeElement(node, 'visible', onNodeClick)); });
                    
                    setTimeout(() => {
                        rowDiv.classList.remove('rank-collapsed');
                        rowDiv.classList.add('rank-expanded');
                        this.trackLayoutShift();
                    }, 900);
                } else {
                    rowDiv.classList.add('rank-expanded');
                    rank.forEach(node => { if (node) rowDiv.appendChild(this.createNodeElement(node, 'visible', onNodeClick)); });
                }
            } else if (index === currentRankIndex + 2) {
                rowDiv.classList.add('rank-expanded');
                rank.forEach(node => { if (node) rowDiv.appendChild(this.createNodeElement(node, 'obscured', onNodeClick)); });
            } else {
                rowDiv.style.display = 'none';
            }

            if (rowDiv.style.display !== 'none') mapContainer.appendChild(rowDiv);
        });

        // 4. APPEND TOKEN
        mapContainer.appendChild(token);
        token.style.transition = 'none';
        
        // Snap to start position (either current or previous)
        const startId = GameState.player.previousNodeId !== undefined ? GameState.player.previousNodeId : GameState.player.currentNodeId;
        this.updatePlayerTokenPosition(startId);

        // 5. ANIMATE
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.setupScrolling();
                token.style.transition = 'top 0.8s ease-in-out, left 0.8s ease-in-out';
                this.updatePlayerTokenPosition(GameState.player.currentNodeId);
            });
        });
    },

    createNodeElement(node, visibility, onNodeClick) {
        const el = document.createElement('div');
        el.id = `node-${node.id}`;
        el.className = `map-node ${node.status}`;

        if (node.type === 'boss') el.classList.add('boss');
        else if (node.type === 'miniboss') el.style.border = "3px solid #e67e22";
        else if (node.type === 'lesson') {
            el.innerHTML = '<i class="fa-solid fa-scroll"></i>';
            el.style.borderColor = "#f1c40f";
        }

        if (visibility === 'obscured') {
            el.innerHTML = `<span>???</span>`;
            el.classList.add('obscured');
        } else if (node.type !== 'lesson') {
            el.innerHTML = `<span>${node.name}</span>`;
        }

        if ((node.status === 'unlocked' || node.status === 'available') && visibility !== 'obscured') {
            el.onclick = () => onNodeClick(node);
        }

        return el;
    },

    updatePlayerTokenPosition(targetNodeId) {
        const token = document.getElementById('player-token');
        const targetNodeEl = document.getElementById(`node-${targetNodeId}`);
        const mapContainer = document.getElementById('map-nodes-container');

        if (token && targetNodeEl && mapContainer) {
            const containerRect = mapContainer.getBoundingClientRect();
            const nodeRect = targetNodeEl.getBoundingClientRect();
            const relativeLeft = (nodeRect.left - containerRect.left) + mapContainer.scrollLeft;
            const relativeTop = (nodeRect.top - containerRect.top) + mapContainer.scrollTop;
            const centerOffsetX = (targetNodeEl.offsetWidth - token.offsetWidth) / 2;

            const finalLeft = Math.round(relativeLeft + centerOffsetX);
            const finalTop = Math.round(relativeTop + ((targetNodeEl.offsetHeight - token.offsetHeight) / 2) - 50);

            token.style.left = `${finalLeft}px`;
            token.style.top = `${finalTop}px`;
        }
    },

    setupScrolling() {
        const container = document.getElementById('map-nodes-container');
        const leftBtn = document.getElementById('btn-scroll-left');
        const rightBtn = document.getElementById('btn-scroll-right');

        if (!container || !leftBtn || !rightBtn) return;

        leftBtn.onclick = () => container.scrollBy({ left: -this.SCROLL_AMOUNT, behavior: 'smooth' });
        rightBtn.onclick = () => container.scrollBy({ left: this.SCROLL_AMOUNT, behavior: 'smooth' });

        const updateButtons = () => {
            const maxScroll = container.scrollWidth - container.clientWidth;
            if (maxScroll <= 0) {
                leftBtn.classList.remove('visible');
                rightBtn.classList.remove('visible');
                return;
            }
            if (container.scrollLeft > 20) leftBtn.classList.add('visible');
            else leftBtn.classList.remove('visible');

            if (container.scrollLeft < maxScroll - 20) rightBtn.classList.add('visible');
            else rightBtn.classList.remove('visible');
        };

        container.onscroll = updateButtons;
        updateButtons();
    },

    trackLayoutShift() {
        const trackingToken = document.getElementById('player-token');
        if (trackingToken) trackingToken.style.transition = 'none';
        const startTime = Date.now();
        const loop = () => {
            const now = Date.now();
            if (now - startTime < 1100) {
                this.updatePlayerTokenPosition(GameState.player.currentNodeId);
                requestAnimationFrame(loop);
            } else {
                this.updatePlayerTokenPosition(GameState.player.currentNodeId);
            }
        };
        loop();
    }
};
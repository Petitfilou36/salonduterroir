/**
 * Éditeur de plan pour le Salon du Terroir
 * Permet de placer et redimensionner les stands sur le plan
 */

class PlanEditor {
    constructor(stands, mapContainer, tooltipElement) {
        this.stands = stands;
        this.mapContainer = mapContainer;
        this.tooltipElement = tooltipElement;
        this.editMode = false;
        this.selectedStand = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.editorVisible = false; // Nouvel attribut pour suivre la visibilité de l'éditeur
        
        // Éléments UI
        this.editButton = null;
        this.coordinates = null;
        this.jsonButton = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Créer les éléments UI (cachés par défaut)
        this.createUIElements();
        
        // Ajouter le style pour les stands éditables
        this.addStyles();
        
        // Ajouter les gestionnaires d'événements
        this.setupEventListeners();
        
        // Ajouter l'écouteur pour la combinaison Ctrl+F2
        this.setupShortcutListener();
    }
    
    createUIElements() {
        const h1Element = document.querySelector('.col-md-12 h1');
        
        // Bouton d'édition (caché par défaut)
        this.editButton = document.createElement('button');
        this.editButton.textContent = "Mode Éditeur";
        this.editButton.classList.add('btn', 'btn-primary', 'mb-3', 'editor-ui');
        this.editButton.style.display = 'none';
        h1Element.insertAdjacentElement('afterend', this.editButton);
        
        // Affichage des coordonnées (caché par défaut)
        this.coordinates = document.createElement('div');
        this.coordinates.classList.add('alert', 'alert-info', 'editor-ui');
        this.coordinates.style.display = 'none';
        h1Element.insertAdjacentElement('afterend', this.coordinates);
        
        // Bouton pour afficher le JSON (caché par défaut)
        this.jsonButton = document.createElement('button');
        this.jsonButton.textContent = "Afficher JSON";
        this.jsonButton.classList.add('btn', 'btn-secondary', 'ml-2', 'mb-3', 'editor-ui');
        this.jsonButton.style.display = 'none';
        this.editButton.insertAdjacentElement('afterend', this.jsonButton);
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .stand-rect.editable {
                border: 2px dashed red !important;
            }
            .stand-rect.selected {
                border: 3px solid yellow !important;
                z-index: 100 !important;
            }
            .resize-handle {
                position: absolute;
                width: 10px;
                height: 10px;
                background-color: yellow;
                border: 1px solid black;
                z-index: 200;
                display: none;
            }
            .resize-handle.top-left { 
                top: -5px; 
                left: -5px; 
                cursor: nwse-resize; 
            }
            .resize-handle.top-right { 
                top: -5px; 
                right: -5px; 
                cursor: nesw-resize; 
            }
            .resize-handle.bottom-left { 
                bottom: -5px; 
                left: -5px; 
                cursor: nesw-resize; 
            }
            .resize-handle.bottom-right { 
                bottom: -5px; 
                right: -5px; 
                cursor: nwse-resize; 
            }
            .stand-rect.selected .resize-handle {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Activation/désactivation du mode éditeur
        this.editButton.addEventListener('click', this.toggleEditMode.bind(this));
        
        // Gestion du drag & drop
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', () => { this.isDragging = false; });
        
        // Affichage du JSON
        this.jsonButton.addEventListener('click', this.showJSON.bind(this));
        
        // Ajout des événements sur les stands
        this.setupStandEvents();
    }
    
    setupShortcutListener() {
        // Ajouter un écouteur pour détecter la combinaison Ctrl+F2
        document.addEventListener('keydown', (e) => {
            // Vérifier si c'est Ctrl+F2 (F2 a le keyCode 113)
            if (e.ctrlKey && e.keyCode === 113) {
                e.preventDefault(); // Empêcher le comportement par défaut
                this.toggleEditorVisibility();
            }
        });
    }
    
    toggleEditorVisibility() {
        this.editorVisible = !this.editorVisible;
        
        // Afficher ou cacher les éléments d'UI de l'éditeur
        const displayValue = this.editorVisible ? 'inline-block' : 'none';
        this.editButton.style.display = displayValue;
        this.jsonButton.style.display = displayValue;
        
        // Optionnellement ajouter une notification pour indiquer l'activation de l'éditeur
        if (this.editorVisible) {
            const notification = document.createElement('div');
            notification.textContent = 'Mode éditeur activé';
            notification.classList.add('alert', 'alert-success', 'editor-notification');
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.zIndex = '1000';
            document.body.appendChild(notification);
            
            // Faire disparaître la notification après 2 secondes
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s';
                setTimeout(() => notification.remove(), 500);
            }, 2000);
        }
        
        // Si on désactive l'éditeur, on s'assure que le mode édition est aussi désactivé
        if (!this.editorVisible && this.editMode) {
            this.toggleEditMode();
        }
    }
    
    toggleEditMode() {
        // Ne permettre le mode édition que si l'éditeur est visible
        if (!this.editorVisible) {
            return;
        }
        
        this.editMode = !this.editMode;
        this.editButton.textContent = this.editMode ? "Désactiver l'éditeur" : "Mode Éditeur";
        
        document.querySelectorAll('.stand-rect').forEach(el => {
            el.classList.toggle('editable', this.editMode);
            el.style.cursor = this.editMode ? 'move' : 'pointer';
            
            if (this.editMode) {
                this.createResizeHandles(el);
            } else {
                el.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
                el.classList.remove('selected');
            }
        });
        
        this.coordinates.style.display = this.editMode ? 'block' : 'none';
    }
    
    setupStandEvents() {
        this.stands.forEach((stand, index) => {
            const standElement = document.querySelector(`#stand-${stand.id}`);
            
            // Gestion du déplacement
            standElement.addEventListener('mousedown', (e) => {
                if (!this.editMode) return;
                
                e.preventDefault();
                this.isDragging = true;
                this.selectedStand = standElement;
                
                // Sélection visuelle
                document.querySelectorAll('.stand-rect').forEach(el => el.classList.remove('selected'));
                standElement.classList.add('selected');
                
                // Affichage des coordonnées
                const standId = standElement.id.split('-')[1];
                const standInfo = this.stands.find(s => s.id == standId);
                this.updateCoordinatesDisplay(standInfo);
                
                // Point de départ pour le déplacement
                this.dragStart.x = e.clientX;
                this.dragStart.y = e.clientY;
            });
        });
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.editMode || !this.selectedStand) return;
        
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        const planImage = document.getElementById('plan-image');
        const rect = planImage.getBoundingClientRect();
        
        // Conversion en pourcentage
        const deltaXPercent = (deltaX / rect.width) * 100;
        const deltaYPercent = (deltaY / rect.height) * 100;
        
        // Mise à jour du stand
        const standId = this.selectedStand.id.split('-')[1];
        const standIndex = this.stands.findIndex(s => s.id == standId);
        
        this.stands[standIndex].x += deltaXPercent;
        this.stands[standIndex].y += deltaYPercent;
        
        // Mise à jour visuelle
        this.selectedStand.style.left = `${this.stands[standIndex].x}%`;
        this.selectedStand.style.top = `${this.stands[standIndex].y}%`;
        
        // Mise à jour des informations affichées
        this.updateCoordinatesDisplay(this.stands[standIndex]);
        
        // Réinitialisation du point de départ
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
    }
    
    createResizeHandles(standElement) {
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        
        // Suppression des poignées existantes
        standElement.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        
        positions.forEach(position => {
            const handle = document.createElement('div');
            handle.classList.add('resize-handle', position);
            handle.dataset.position = position;
            standElement.appendChild(handle);
            
            handle.addEventListener('mousedown', this.handleResizeStart.bind(this, standElement, position));
        });
    }
    
    handleResizeStart(standElement, position, e) {
        if (!this.editMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const standId = standElement.id.split('-')[1];
        const standIndex = this.stands.findIndex(s => s.id == standId);
        const stand = this.stands[standIndex];
        
        const resizeData = {
            position: position,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: stand.width,
            startHeight: stand.height,
            startLeft: stand.x,
            startTop: stand.y
        };
        
        const handleResizeMove = (ev) => {
            const planImage = document.getElementById('plan-image');
            const rect = planImage.getBoundingClientRect();
            
            const deltaXPercent = ((ev.clientX - resizeData.startX) / rect.width) * 100;
            const deltaYPercent = ((ev.clientY - resizeData.startY) / rect.height) * 100;
            
            switch(resizeData.position) {
                case 'top-left':
                    stand.width = Math.max(1, resizeData.startWidth - deltaXPercent);
                    stand.height = Math.max(1, resizeData.startHeight - deltaYPercent);
                    stand.x = resizeData.startLeft + (resizeData.startWidth - stand.width);
                    stand.y = resizeData.startTop + (resizeData.startHeight - stand.height);
                    break;
                case 'top-right':
                    stand.width = Math.max(1, resizeData.startWidth + deltaXPercent);
                    stand.height = Math.max(1, resizeData.startHeight - deltaYPercent);
                    stand.y = resizeData.startTop + (resizeData.startHeight - stand.height);
                    break;
                case 'bottom-left':
                    stand.width = Math.max(1, resizeData.startWidth - deltaXPercent);
                    stand.height = Math.max(1, resizeData.startHeight + deltaYPercent);
                    stand.x = resizeData.startLeft + (resizeData.startWidth - stand.width);
                    break;
                case 'bottom-right':
                    stand.width = Math.max(1, resizeData.startWidth + deltaXPercent);
                    stand.height = Math.max(1, resizeData.startHeight + deltaYPercent);
                    break;
            }
            
            // Mise à jour visuelle
            standElement.style.left = `${stand.x}%`;
            standElement.style.top = `${stand.y}%`;
            standElement.style.width = `${stand.width}%`;
            standElement.style.height = `${stand.height}%`;
            
            // Mise à jour des informations
            this.updateCoordinatesDisplay(stand);
        };
        
        const handleResizeEnd = () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
        
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }
    
    updateCoordinatesDisplay(stand) {
        this.coordinates.innerHTML = `
            Stand ${stand.displayId || stand.id}: ${stand.nom}<br>
            Position: x: ${stand.x.toFixed(1)}%, y: ${stand.y.toFixed(1)}%<br>
            Dimensions: largeur: ${stand.width.toFixed(1)}%, hauteur: ${stand.height.toFixed(1)}%
        `;
    }
    
    showJSON() {
        const jsonOutput = document.createElement('textarea');
        jsonOutput.value = JSON.stringify(this.stands, null, 4);
        jsonOutput.style.width = '100%';
        jsonOutput.style.height = '300px';
        jsonOutput.style.marginTop = '20px';
        
        const existingJson = document.getElementById('json-output');
        if (existingJson) {
            existingJson.replaceWith(jsonOutput);
        } else {
            jsonOutput.id = 'json-output';
            document.querySelector('.plan-legend').insertAdjacentElement('afterend', jsonOutput);
        }
    }
}

// Export de la classe pour l'utiliser dans d'autres fichiers
window.PlanEditor = PlanEditor;
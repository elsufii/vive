class DisperseEffect {
  constructor() {
    this.svgFilter = `
      <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <defs>
          <filter id="disperse-filter" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="1" result="noise"/>
            <feComponentTransfer in="noise" result="adjustedNoise">
              <feFuncR type="linear" slope="3" intercept="-1"/>
              <feFuncG type="linear" slope="3" intercept="-1"/>
            </feComponentTransfer>
            <feTurbulence type="fractalNoise" baseFrequency="1" numOctaves="1" result="fineNoise"/>
            <feMerge result="mergedNoise">
              <feMergeNode in="adjustedNoise"/>
              <feMergeNode in="fineNoise"/>
            </feMerge>
            <feDisplacementMap in="SourceGraphic" in2="mergedNoise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>
    `;
    this.setupFilter();
  }

  setupFilter() {
    if (!document.getElementById('disperse-effects')) {
      const filterContainer = document.createElement('div');
      filterContainer.id = 'disperse-effects';
      filterContainer.innerHTML = this.svgFilter;
      document.body.appendChild(filterContainer);
    }
  }

  

  async disperseText(element) {
    const duration = 1000;
    const maxDisplacement = 2000;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        const scale = eased * maxDisplacement;
        element.style.filter = `url(#disperse-filter)`;
        document.querySelector('#disperse-filter feDisplacementMap')
          .setAttribute('scale', scale.toString());

        element.style.opacity = progress < 0.5 ? 1 : 1 - ((progress - 0.5) / 0.5);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }
}

function handleNewNote(note) {
  const writings = JSON.parse(localStorage.getItem('writings') || '[]');
  writings.push(note);
  localStorage.setItem('writings', JSON.stringify(writings));
  notesManager.updateNotesDisplay();  
}

class NotesManager {
  constructor() {
    this.checkForExistingNotes();
  }

  updateNotesDisplay() {
    const currentUrl = window.location.href;
    const writings = JSON.parse(localStorage.getItem('writings') || '[]');
    
    const currentUrlObj = new URL(currentUrl);
    const currentPageIdentifier = currentUrlObj.hostname + currentUrlObj.pathname;
    
    const pageNotes = writings.filter(note => {
      if (!note.url) return false;
      try {
        const noteUrlObj = new URL(note.url);
        const notePageIdentifier = noteUrlObj.hostname + noteUrlObj.pathname;
        return notePageIdentifier === currentPageIdentifier;
      } catch (e) {
        return false;
      }
    });

    this.createNotesButton(pageNotes);
  }

  checkForExistingNotes() {
    const currentUrl = window.location.href;
    const writings = JSON.parse(localStorage.getItem('writings') || '[]');
    
    const currentUrlObj = new URL(currentUrl);
    const currentPageIdentifier = currentUrlObj.hostname + currentUrlObj.pathname;
    
    const pageNotes = writings.filter(note => {
      if (!note.url) return false;
      try {
        const noteUrlObj = new URL(note.url);
        const notePageIdentifier = noteUrlObj.hostname + noteUrlObj.pathname;
        return notePageIdentifier === currentPageIdentifier;
      } catch (e) {
        return false;
      }
    });

    if (pageNotes.length > 0) {
      this.createNotesButton(pageNotes);
    }
  }

  createNotesButton(pageNotes) {

    const existingButton = document.querySelector('.page-notes-button');
    if (existingButton) {
      existingButton.remove();
    }
    const notesButton = document.createElement('div');
    notesButton.className = 'page-notes-button';
    
    let isDragging = false;
    let currentX;
    let currentY;

    notesButton.addEventListener('mousedown', (e) => {
      isDragging = true;
      currentX = e.clientX - notesButton.offsetLeft;
      currentY = e.clientY - notesButton.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        notesButton.style.left = (e.clientX - currentX) + 'px';
        notesButton.style.top = (e.clientY - currentY) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    notesButton.innerHTML = `
      <button title="View notes from this page">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="8" y1="7" x2="16" y2="7"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="17" x2="12" y2="17"/>
    </svg>
    <span>${pageNotes.length} note${pageNotes.length > 1 ? 's' : ''}</span>
      </button>
    `;

    document.body.appendChild(notesButton);
    notesButton.addEventListener('click', () => this.showNotesPanel(pageNotes));
  }

  showNotesPanel(pageNotes) {
    const notesPanel = document.createElement('div');
    notesPanel.className = 'saved-notes-panel';
    notesPanel.style.zIndex = '10001';
    
    const renderNotesList = (notes) => {
      return notes.map((note, index) => `
        <div class="note-item" data-index="${index}">
          <h3>${note.title || 'Untitled'}</h3>
          <p class="note-preview">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
          <div class="note-meta">
            <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
          </div>
        </div>
      `).join('');
    };

    notesPanel.innerHTML = `
      <div class="saved-notes-card">
        <div class="notes-header">
          <h2>Notes from this page</h2>
          <button class="close-notes">&times;</button>
        </div>
        <div class="notes-list">
          ${renderNotesList(pageNotes)}
        </div>
      </div>
    `;

    document.body.appendChild(notesPanel);
    
    notesPanel.querySelector('.close-notes').addEventListener('click', () => {
      notesPanel.remove();
    });

    notesPanel.addEventListener('click', (e) => {
      const noteItem = e.target.closest('.note-item');
      if (noteItem) {
        const index = noteItem.dataset.index;
        const note = pageNotes[index];
        notesPanel.remove();
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const centerX = viewportWidth / 2 - 250; 
        const centerY = viewportHeight / 2 - 200; 
        
        const writingPanel = document.createElement('div');
        writingPanel.className = 'writing-panel';
        writingPanel.style.cssText = `
          position: fixed;
          left: ${centerX}px;
          top: ${centerY}px;
          z-index: 10001;
        `;
        
        writingPanel.innerHTML = `
          <div class="writing-card">
            <button class="close-writing">&times;</button>
            <h2 class="writing-title" contenteditable="true">${note.title || ''}</h2>
            <textarea 
              class="writing-content" 
              spellcheck="true" 
              autocomplete="off"
              style="cursor: text !important; caret-color: #2c1810 !important; -webkit-appearance: none;"
            >${note.content || ''}</textarea>
          </div>
        `;

        document.body.appendChild(writingPanel);

        const textarea = writingPanel.querySelector('.writing-content');
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });

        const writingCard = writingPanel.querySelector('.writing-card');
        let isDragging = false;
        let startX, startY;

        writingCard.addEventListener('mousedown', (e) => {
          if (e.target.tagName === 'TEXTAREA' || 
              e.target.tagName === 'BUTTON' || 
              e.target.getAttribute('contenteditable')) {
            return;
          }
          isDragging = true;
          startX = e.clientX - writingPanel.offsetLeft;
          startY = e.clientY - writingPanel.offsetTop;
          document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          writingPanel.style.left = `${e.clientX - startX}px`;
          writingPanel.style.top = `${e.clientY - startY}px`;
        });

        document.addEventListener('mouseup', () => {
          isDragging = false;
          document.body.style.userSelect = 'auto';
        });

        const autoSave = () => {
          const writings = JSON.parse(localStorage.getItem('writings') || '[]');
          writings[index] = {
            ...note,
            title: writingPanel.querySelector('.writing-title').textContent,
            content: writingPanel.querySelector('.writing-content').value,
            lastEdited: new Date().toISOString()
          };
          localStorage.setItem('writings', JSON.stringify(writings));
          this.updateNotesDisplay();
        };

        writingPanel.querySelector('.writing-title').addEventListener('blur', autoSave);
        writingPanel.querySelector('.writing-content').addEventListener('blur', autoSave);

        writingPanel.querySelector('.close-writing').addEventListener('click', () => writingPanel.remove());
      }
    });
  }
}

class LocalTransition {
  constructor() {
    this.container = null;
    this.selectedImage = null;
  }

  async createTransitionEffect(box, text) {
    box.innerHTML = `
    <div class="transition-content">
      <div class="transition-header">
        <div class="header-controls">
          <div class="control-buttons">
            <button class="image-icon-button" title="Add image">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <button class="write-icon-button" title="Write reflection">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
            </button>
            <button class="summarize-icon-button" title="Summarize text">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M4 12h16M4 18h10"/>
              </svg>
            </button>
            <button class="save-to-notes-button" title="Save to Notes">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </button>
            <button class="saved-notes-button" title="View saved notes">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <line x1="8" y1="7" x2="16" y2="7"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="8" y1="17" x2="12" y2="17"/>
              </svg>
            </button>
          </div>
          <div class="image-input-container hidden">
            <input type="text" class="image-url-input" placeholder="Paste image URL and press Enter">
            <button class="cancel-image-input">&times;</button>
          </div>
          <button class="close-button" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
        <div class="writing-panel hidden"></div>
      <div class="page-images-grid hidden"></div>
      <div class="transition-3d-space">
        <div class="transition-panel front">
          <div class="text-content">${text}</div>
        </div>
        <div class="transition-panel back">
          <div class="image-content">
            <div class="image-placeholder">Click the image icon to add an image</div>
          </div>
        </div>
      </div>
      <div class="resize-handle"></div>
    </div>
  `;

    const imageIconButton = box.querySelector('.image-icon-button');
    const imageInputContainer = box.querySelector('.image-input-container');
    const imageInput = box.querySelector('.image-url-input');
    const cancelButton = box.querySelector('.cancel-image-input');
    const imagesGrid = box.querySelector('.page-images-grid');

    this.toggleImageInterface = (show) => {
      if (show) {
        imageInputContainer.classList.remove('hidden');
        imagesGrid.classList.remove('hidden');
        imageIconButton.classList.add('hidden');
        
        imagesGrid.innerHTML = '';
        const pageImages = this.collectPageImages().filter(img => 
          !this.selectedImage || img.src !== this.selectedImage
        );
        
        if (pageImages.length > 0) {
          this.showImageSelector(imagesGrid, pageImages, box);
        }
        
        imageInput.focus();
      } else {
        imageInputContainer.classList.add('hidden');
        imagesGrid.classList.add('hidden');
        imageIconButton.classList.remove('hidden');
        imageInput.value = '';
      }
    };

    imageIconButton.addEventListener('click', () => {
      this.toggleImageInterface(true);
    });

    cancelButton.addEventListener('click', () => {
      this.toggleImageInterface(false);
    });

    imageInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const imageUrl = e.target.value.trim();
        if (imageUrl) {
          const backPanel = box.querySelector('.transition-panel.back');
          backPanel.innerHTML = `
            <div class="image-content">
              <img src="${imageUrl}" alt="transition">
            </div>
          `;
          this.toggleImageInterface(false);
        }
      }
    });

    const transitionSpace = box.querySelector('.transition-3d-space');
    transitionSpace.addEventListener('click', () => {
      transitionSpace.classList.toggle('transition-active');
    });

    this.setupBoxDrag(box);
    this.setupResize(box);

    box.querySelector('.close-button').addEventListener('click', () => box.remove());

    const writeButton = box.querySelector('.write-icon-button');
    const writingPanel = box.querySelector('.writing-panel');

    writeButton.addEventListener('click', () => {
      const boxRect = box.getBoundingClientRect();
      const writingPanel = document.createElement('div');
      writingPanel.className = 'writing-panel';
      writingPanel.style.cssText = `
        position: fixed;
        z-index: 100000;  /* Increased z-index to be much higher than other elements */
      `;
      writingPanel.innerHTML = `
        <div class="writing-card">
          <div class="writing-card-header">
            <button class="close-writing">&times;</button>
          </div>
          <h2 class="writing-title" contenteditable="true" data-placeholder="Your Title Here..."></h2>
          <textarea class="writing-content" placeholder="Write your reflection here..."></textarea>
          <div class="writing-controls">
            <button class="save-writing">Save</button>
            <button class="cancel-writing">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(writingPanel);
      const writingCard = writingPanel.querySelector('.writing-card');
      
      writingCard.style.position = 'fixed';
      writingCard.style.left = `${boxRect.left}px`;
      writingCard.style.top = `${boxRect.top - writingCard.offsetHeight - 20}px`; 
      
      if (writingCard.getBoundingClientRect().top < 20) {
        writingCard.style.top = '20px';
      }

      let isDragging = false;
      let currentX;
      let currentY;

      writingCard.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'TEXTAREA' || 
            e.target.tagName === 'BUTTON' || 
            e.target.getAttribute('contenteditable')) {
          return;
        }
        isDragging = true;
        currentX = e.clientX - writingCard.offsetLeft;
        currentY = e.clientY - writingCard.offsetTop;
        e.preventDefault();
      });

      document.addEventListener('mousemove', function(e) {
        if (isDragging) {
          writingCard.style.left = (e.clientX - currentX) + 'px';
          writingCard.style.top = (e.clientY - currentY) + 'px';
        }
      });

      document.addEventListener('mouseup', function() {
        isDragging = false;
      });

      // Close handlers
      const closeButton = writingPanel.querySelector('.close-writing');
      const cancelButton = writingPanel.querySelector('.cancel-writing');
      [closeButton, cancelButton].forEach(btn => {
        btn.addEventListener('click', () => writingPanel.remove());
      });

      // Save handler
      writingPanel.querySelector('.save-writing').addEventListener('click', () => {
        const newNote = {
          title: writingPanel.querySelector('.writing-title').textContent,
          content: writingPanel.querySelector('.writing-content').value,
          date: new Date().toISOString(),
          originalText: text,
          url: window.location.href
        };
        
        handleNewNote(newNote); 
        showMessage('Writing saved successfully!');
        writingPanel.remove();
      });
    });

    await this.setupSummarizeButton(box, text);

    const savedNotesButton = box.querySelector('.saved-notes-button');
    savedNotesButton.addEventListener('click', () => {
      let writings = JSON.parse(localStorage.getItem('writings') || '[]');
      
      const notesPanel = document.createElement('div');
      notesPanel.className = 'saved-notes-panel';
      
      const renderNotesList = (notes) => {
        return notes.length ? notes.map((note, index) => {
          let urlDisplay = note.url ? 
            `<a href="${note.url}" class="note-url" target="_blank">Note's Link</a>` : 
            '';
      
          return `
            <div class="note-item" data-index="${index}">
              <h3>${note.title || 'Untitled'}</h3>
              <p class="note-preview">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
              <div class="note-meta">
                <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
                ${urlDisplay}
              </div>
              <button class="delete-note" data-index="${index}">&times;</button>
            </div>
          `;
        }).join('') : '<p class="no-notes">No saved notes yet</p>';
      };

      notesPanel.innerHTML = `
        <div class="saved-notes-card">
          <div class="notes-header">
            <h2>Saved Notes</h2>
            <button class="close-notes">&times;</button>
          </div>
          <div class="notes-list">
            ${renderNotesList(writings)}
          </div>
        </div>
      `;

      document.body.appendChild(notesPanel);

      const notesCard = notesPanel.querySelector('.saved-notes-card');
      let isDragging = false;
      let currentX;
      let currentY;

      notesCard.addEventListener('mousedown', function(e) {
        if (e.target.closest('.close-notes') || e.target.closest('.delete-note')) return;
        isDragging = true;
        currentX = e.clientX - notesCard.offsetLeft;
        currentY = e.clientY - notesCard.offsetTop;
        e.preventDefault();
      });

      document.addEventListener('mousemove', function(e) {
        if (isDragging) {
          notesCard.style.left = (e.clientX - currentX) + 'px';
          notesCard.style.top = (e.clientY - currentY) + 'px';
        }
      });

      document.addEventListener('mouseup', function() {
        isDragging = false;
      });

      const closeButton = notesPanel.querySelector('.close-notes');
      closeButton.addEventListener('click', () => notesPanel.remove());

      // Handle note actions (edit and delete)
      notesPanel.addEventListener('click', (e) => {
        const target = e.target;
        const noteItem = target.closest('.note-item');
        if (!noteItem) return;
        
        const index = parseInt(noteItem.dataset.index);

        if (target.classList.contains('delete-note')) {
          writings.splice(index, 1);
          localStorage.setItem('writings', JSON.stringify(writings));
          const notesList = notesPanel.querySelector('.notes-list');
          notesList.innerHTML = renderNotesList(writings);
          showMessage('Note deleted');
        } 
        else {
          const note = writings[index];
          const writingPanel = document.createElement('div');
          writingPanel.className = 'writing-panel';
          writingPanel.style.zIndex = '10001';
          writingPanel.innerHTML = `
            <div class="writing-card">
              <div class="writing-card-header">
                <button class="close-writing">&times;</button>
              </div>
              <h2 class="writing-title" contenteditable="true">${note.title || ''}</h2>
              <textarea class="writing-content">${note.content || ''}</textarea>
              <div class="writing-controls">
                <button class="save-writing">Save Changes</button>
                <button class="cancel-writing">Cancel</button>
              </div>
            </div>
          `;

          

          document.body.appendChild(writingPanel);
          notesPanel.remove();

          const writingCard = writingPanel.querySelector('.writing-card');
          
          const boxRect = box.getBoundingClientRect();
          writingCard.style.position = 'fixed';
          writingCard.style.left = `${boxRect.left}px`;
          writingCard.style.top = `${boxRect.top - writingCard.offsetHeight - 20}px`;
          
          if (writingCard.getBoundingClientRect().top < 20) {
            writingCard.style.top = '20px';
          }

          let isDragging = false;
          let currentX;
          let currentY;

          writingCard.addEventListener('mousedown', function(e) {
            if (e.target.tagName === 'TEXTAREA' || 
                e.target.tagName === 'BUTTON' || 
                e.target.getAttribute('contenteditable')) {
              return;
            }
            isDragging = true;
            currentX = e.clientX - writingCard.offsetLeft;
            currentY = e.clientY - writingCard.offsetTop;
            e.preventDefault();
          });

          document.addEventListener('mousemove', function(e) {
            if (isDragging) {
              writingCard.style.left = (e.clientX - currentX) + 'px';
              writingCard.style.top = (e.clientY - currentY) + 'px';
            }
          });

          document.addEventListener('mouseup', function() {
            isDragging = false;
          });

          writingPanel.querySelector('.save-writing').addEventListener('click', () => {
            const newTitle = writingPanel.querySelector('.writing-title').textContent;
            const newContent = writingPanel.querySelector('.writing-content').value;
            
            writings[index] = {
              ...note,
              title: newTitle,
              content: newContent,
              lastEdited: new Date().toISOString()
            };
            
            localStorage.setItem('writings', JSON.stringify(writings));
            showMessage('Changes saved successfully!');
            writingPanel.remove();
          });

          const closeEditor = () => writingPanel.remove();
          writingPanel.querySelector('.close-writing').addEventListener('click', closeEditor);
          writingPanel.querySelector('.cancel-writing').addEventListener('click', closeEditor);
        }
      });
    });

    const saveToNotesBtn = box.querySelector('.save-to-notes-button');
    saveToNotesBtn.addEventListener('click', () => {
      const textContent = box.querySelector('.text-content').innerHTML;
      const newNote = {
        title: 'Generated Text',
        content: textContent,
        date: new Date().toISOString(),
        url: window.location.href
      };
      
      handleNewNote(newNote);
      showMessage('Text saved to notes!');
    });
  }

  setupBoxDrag(box) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const header = box.querySelector('.transition-header');
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      if (e.target.closest('.image-icon-button') || 
          e.target.closest('.image-input-container') || 
          e.target.closest('.close-button')) {
        return;
      }
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, box);
      }
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd() {
      isDragging = false;
    }
  }

  setupResize(box) {
    const handle = box.querySelector('.resize-handle');
    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      e.preventDefault(); 

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = box.offsetWidth;
      const startHeight = box.offsetHeight;

      function onMouseMove(e) {
        if (!isResizing) return;

        const dampening = 0.5; 
        const widthDelta = (e.clientX - startX) * dampening;
        const heightDelta = (e.clientY - startY) * dampening;

        const newWidth = startWidth + widthDelta;
        const newHeight = startHeight + heightDelta;

        // minimum dimensions
        box.style.width = Math.max(300, newWidth) + 'px';
        box.style.height = Math.max(200, newHeight) + 'px';
      }

      function onMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  collectPageImages() {
    const images = Array.from(document.getElementsByTagName('img'));
    return images
      .filter(img => {
        const rect = img.getBoundingClientRect();
        return img.src && 
               rect.width >= 100 && 
               rect.height >= 100 && 
               !img.src.startsWith('data:') &&
               img.style.display !== 'none' &&
               img.style.visibility !== 'hidden';
      })
      .map(img => ({
        src: img.src,
        width: img.width,
        height: img.height,
        alt: img.alt
      }));
  }

  collectPageImages() {
    const images = Array.from(document.getElementsByTagName('img'));
    const uniqueUrls = new Set();
    
    return images
      .filter(img => {
        const rect = img.getBoundingClientRect();
        if (!(img.src && 
            rect.width >= 100 && 
            rect.height >= 100 && 
            !img.src.startsWith('data:') && 
            img.style.display !== 'none' &&
            img.style.visibility !== 'hidden')) {
          return false;
        }
        
        if (uniqueUrls.has(img.src)) {
          return false;
        }
        
        uniqueUrls.add(img.src);
        return true;
      })
      .map(img => ({
        src: img.src,
        width: img.width,
        height: img.height,
        alt: img.alt
      }));
  }

  showImageSelector(gridElement, images, box) {
    gridElement.innerHTML = `
      <div class="images-header">
        <h3>Images from this page</h3>
      </div>
      <div class="images-container">
        ${images.map(img => `
          <div class="page-image-item">
            <img src="${img.src}" alt="${img.alt || 'Page image'}" loading="lazy">
          </div>
        `).join('')}
      </div>
    `;

    // handling image selection
    const imageItems = gridElement.querySelectorAll('.page-image-item');
    imageItems.forEach(item => {
      item.addEventListener('click', () => {
        const selectedSrc = item.querySelector('img').src;
        this.selectedImage = selectedSrc;
        
        const backPanel = box.querySelector('.transition-panel.back');
        backPanel.innerHTML = `
          <div class="image-content">
            <img src="${selectedSrc}" alt="transition">
          </div>
        `;
        this.toggleImageInterface(false);
      });
    });
  }

  async setupSummarizeButton(box, text) {
    const summarizeButton = box.querySelector('.summarize-icon-button');
    const textContent = box.querySelector('.text-content');
    
    if (!summarizeButton) return;
  
    try {
      const summarizer = await this.initializeSummarizer();
      
      if (!summarizer) {
        summarizeButton.style.opacity = '0.5';
        summarizeButton.title = 'Summarizer not available';
        return;
      }
  
      // toggle --> didn't work
      let isSummary = false;
      let summaryText = '';
      let originalText = textContent.innerHTML; // Store original text
  
      summarizeButton.addEventListener('click', async () => {
        try {
          if (summaryText) {
            isSummary = !isSummary;
            textContent.innerHTML = isSummary ? summaryText : originalText;
            summarizeButton.title = isSummary ? 'Show original text' : 'Show summary';
            return;
          }
  
          textContent.innerHTML = '<div class="loading">Summarizing...</div>';
          
          summaryText = await summarizer.summarize(text);
          isSummary = true;
          
          textContent.innerHTML = summaryText;
          summarizeButton.title = 'Show original text';
          
          showMessage('Text summarized successfully!');
        } catch (error) {
          console.error('Summarization error:', error);
          textContent.innerHTML = originalText;
          isSummary = false;
          showError('Failed to summarize text');
        }
      });
    } catch (error) {
      console.error('Error setting up summarize button:', error);
      summarizeButton.style.opacity = '0.5';
      summarizeButton.title = 'Summarizer initialization failed';
    }
  }

  async initializeSummarizer() {
    try {
      const canSummarize = await ai.summarizer.capabilities();
      
      if (canSummarize && canSummarize.available !== 'no') {
        let summarizer;
        
        if (canSummarize.available === 'readily') {
          summarizer = await ai.summarizer.create();
        } else {
          summarizer = await ai.summarizer.create();
          summarizer.addEventListener('downloadprogress', (e) => {
            console.log(`Download progress: ${(e.loaded / e.total * 100).toFixed(1)}%`);
          });
          await summarizer.ready;
        }
        
        return summarizer;
      }
      
     
      return null;
    } catch (error) {
      console.error('Error initializing summarizer:', error);
      return null;
    }
  }
 

async setupSummarizeButton(box, text) {
  const summarizeButton = box.querySelector('.summarize-icon-button');
  const textContent = box.querySelector('.text-content');
  
  if (!summarizeButton) return;

  try {
    const summarizer = await this.initializeSummarizer();
    
    if (!summarizer) {
      summarizeButton.style.opacity = '0.5';
      summarizeButton.title = 'Summarizer not available';
      return;
    }

    summarizeButton.addEventListener('click', async () => {
      try {
        const originalContent = textContent.innerHTML;
        textContent.innerHTML = '<div class="loading">Summarizing...</div>';
        
        const summary = await summarizer.summarize(text);
        
        textContent.innerHTML = summary;
        
        const transformedContainer = document.querySelector('.transformed-container');
        if (transformedContainer) {
          transformedContainer.innerHTML = summary;
          
          const toggleButton = document.createElement('button');
          toggleButton.className = 'toggle-text-button';
          toggleButton.innerHTML = '↺';
          toggleButton.title = 'Show original text';
          transformedContainer.appendChild(toggleButton);
          
          transformedContainer.dataset.transformedText = summary;
          // setupToggleButton(toggleButton, transformedContainer, new DisperseEffect());
        }
        
        showMessage('Text summarized successfully!');
      } catch (error) {
        console.error('Summarization error:', error);
        textContent.innerHTML = originalContent;
        showError('Failed to summarize text');
      }
    });
  } catch (error) {
    console.error('Error setting up summarize button:', error);
    summarizeButton.style.opacity = '0.5';
    summarizeButton.title = 'Summarizer initialization failed';
  }
}
}

const notesManager = new NotesManager();

async function transformText(text) {
  console.log("Starting transformation with text:", text);
  
  try {
    if (!window.ai?.languageModel) {
      throw new Error('Language Model API not available');
    }

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const wrapper = document.createElement('span');
    wrapper.className = 'disperse-wrapper';
    wrapper.textContent = text;
    
    const transformedContainer = document.createElement('span');
    transformedContainer.className = 'transformed-container';
    transformedContainer.style.opacity = '0';
    transformedContainer.innerHTML = '<div class="loading">Transforming...</div>';
    
    transformedContainer.dataset.originalText = text;
    transformedContainer.dataset.isOriginal = 'false';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-text-button';
    toggleButton.innerHTML = '↺';
    toggleButton.title = 'Show original text';
    
    range.deleteContents();
    range.insertNode(transformedContainer);
    range.insertNode(wrapper);

    const disperseEffect = new DisperseEffect();
    await disperseEffect.disperseText(wrapper);
    wrapper.remove();

    const model = await window.ai.languageModel.create({
      systemPrompt: `You are a skilled writer tasked with providing background information and context for events while adhering to these STRICT guidelines:

      ABSOLUTE REQUIREMENTS:
      - Humanize the text: Make the content relatable and engaging for readers.
      - Contextualize facts: Explain the significance of events with clarity and depth.
      - Focus on engagement: Transform technical or dry content into narratives that resonate with the audience.
      - If unsure about any detail, exclude it entirely

      WRITING APPROACH:
      - Stay Accurate: Use only the information provided in the source material—never invent or embellish.
      - Bring Stories to Life: Highlight real human details, connections, and implications within the facts.
      - Clarity and Engagement: Write with accessible language and maintain a clear, flowing narrative.
      - Empathy and Insight: Use a thoughtful tone to connect readers with the events and their broader meaning.

      FORMAT:
      - Engaging and Digestible: Keep paragraphs concise and focus on clarity.
      - Informative: Ensure readers come away with a clear understanding of the events and their significance.
      - Human-Centric: Emphasize the real-life impact of the information, focusing on people, actions, and consequences.
      

      FORBIDDEN:
      - No Speculation: Avoid assuming thoughts, feelings, or events not explicitly provided.
      - No Fiction: Do not invent dialogue, characters, or scenarios.
      - No Embellishment: Stay grounded in facts, avoiding dramatic flourishes or exaggeration.`    
    });

    const stream = await model.promptStreaming(`
      Rewrite the text into an engaging, human-centered narrative while following these STRICT guidelines:

      
      CORE REQUIREMENTS:
      - Provide clear context and background.
      - Use only information explicitly stated in the text.
      - Keep the rewrite concise and focused.
      
      STYLE GUIDELINES:
      - Emphasize emotional depth and real-world connections.
      - Use simple, engaging language with a natural flow.
      - Highlight the significance of events without overanalyzing.
      
      AVOID:
      - Adding fictional details or speculative thoughts.
      - Overcomplicating the narrative or using clichés.
      - Dramatizing beyond the facts.
      - Expanding the content significantly beyond the original text's length.
      
      Text to transform: ${text}
    `);

    let result = '';
    let previousChunk = '';

    for await (const chunk of stream) {
      const newChunk = chunk.startsWith(previousChunk) ? 
        chunk.slice(previousChunk.length) : chunk;
      
      result += newChunk;
      
      if (transformedContainer.style.opacity === '0') {
        transformedContainer.style.opacity = '1';
      }
      
      transformedContainer.innerHTML = result;
      transformedContainer.appendChild(toggleButton);
      
      previousChunk = chunk;
    }

    const transitionBox = document.createElement('div');
    transitionBox.className = 'transition-box';
    document.body.appendChild(transitionBox);

    const transition = new LocalTransition();
    await transition.createTransitionEffect(transitionBox, result);

    // Add close button
    // const closeButton = document.createElement('button');
    // closeButton.className = 'close-transition-button';
    // closeButton.innerHTML = '×';
    // closeButton.onclick = () => transitionBox.remove();
    // transitionBox.appendChild(closeButton);

    // Store the transformed text and setup toggle
    transformedContainer.dataset.transformedText = result;
    // setupToggleButton(toggleButton, transformedContainer, disperseEffect);
    

  } catch (error) {
    console.error('Transformation error:', error);
    showError(error.message);
  }
}

// Helper function to setup toggle button
// function setupToggleButton(button, container, disperseEffect) {
//   button.addEventListener('click', async () => {
//     const isOriginal = container.dataset.isOriginal === 'true';
//     const targetText = isOriginal ? container.dataset.transformedText : container.dataset.originalText;
    
//     const tempWrapper = document.createElement('span');
//     tempWrapper.className = 'disperse-wrapper';
//     tempWrapper.textContent = container.textContent;
//     container.textContent = '';
//     container.appendChild(tempWrapper);
    
//     await disperseEffect.disperseText(tempWrapper);
//     tempWrapper.remove();
    
//     container.innerHTML = targetText;
//     container.appendChild(button);
//     container.dataset.isOriginal = (!isOriginal).toString();
//     button.title = isOriginal ? 'Show original text' : 'Show transformed text';
//   });
// }

const style = document.createElement('style');
style.textContent = `
  .disperse-wrapper {
    display: inline-block;
    transform-origin: center;
    will-change: transform, opacity, filter;
  }

  .transformed-container {
    display: inline-block;
    position: relative;
    background: rgba(253, 251, 247, 0.95);
    border-radius: 4px;
    padding: 8px 12px;
    margin: 2px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-family: Georgia, serif;
    line-height: 1.6;
    transition: opacity 0.3s ease;
  }

  .transformed-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    border-radius: inherit;
    z-index: -1;
    filter: blur(10px);
  }

  .loading {
    display: inline-block;
    color: #666;
    font-style: italic;
    padding: 4px 8px;
  }

  .loading::after {
    content: '...';
    animation: loading-dots 1.5s infinite;
  }

  @keyframes loading-dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60%, 100% { content: '...'; }
  }

  .error-message {
    color: #721c24;
    background-color: #f8d7da;
    padding: 8px 12px;
    border-radius: 4px;
    margin: 4px 0;
    font-size: 0.9em;
  }

  .toggle-text-button {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: #2c1810;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .toggle-text-button:hover {
    background: #3a2218;
  }

  .transformed-container {
    position: relative;
  }

  .transformed-container:hover .toggle-text-button {
    opacity: 1;
  }

  .transition-container {
    position: relative;
    width: 100%;
    height: 300px;
    margin: 20px 0;
    perspective: 1000px;
    transform-style: preserve-3d;
  }

  .transition-panel {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    transition: transform 1s ease;
  }

  .transition-panel img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .transition-panel.back {
    transform: rotateY(180deg);
  }

  .transition-container.transition-active .front {
    transform: rotateY(-180deg);
  }

  .transition-container.transition-active .back {
    transform: rotateY(0);
  }

  .image-url-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .image-url-modal .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
  }

  .image-url-modal input {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .image-url-modal button {
    background: #2c1810;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .image-url-modal button:hover {
    background: #3a2218;
  }
`;

const additionalStyles = `
  .transition-box {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;    /* Add minimum width */
    min-height: 200px;   /* Add minimum height */
    width: 450px;
    height: 80vh;
    background: #fdfbf7;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    z-index: 10000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: se-resize;
    z-index: 1;
  }

  .resize-handle::after {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 12px;
    height: 12px;
    background: linear-gradient(135deg, transparent 50%, #2c1810 50%);
    opacity: 0.3;
    transition: opacity 0.2s ease;
  }

  .resize-handle:hover::after {
    opacity: 0.6;
  }

  /* Ensure content adapts to resize */
  .transition-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .transition-3d-space {
    flex: 1;
    min-height: 0;  /* Allow shrinking */
  }

  .text-content, 
  .image-content {
    min-height: 0;  /* Allow shrinking */
    overflow-y: auto;
  }

  

  /* Improve scrollbar visibility */
  .text-content::-webkit-scrollbar,
  .image-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;  /* For horizontal scroll if needed */
  }

  .transition-header {
    padding: 12px 16px;
    background: #2c1810;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
    cursor: move;
    user-select: none;
  }

  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .close-transition-button {
    background: none;
    border: none;
    color: rgba(255,255,255,0.8);
    font-size: 24px;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: -8px;
    border-radius: 4px;
    line-height: 24px;
    height: 40px;
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-transition-button:hover {
    color: white;
    background: rgba(255,255,255,0.1);
  }

  .image-input-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .transition-3d-space {
    flex-grow: 1;
    position: relative;
    transform-style: preserve-3d;
    perspective: 1000px;
  }

  .transition-panel {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    transition: transform 0.6s;
    overflow: hidden;
    display: flex;
  }

  .transition-panel.back {
    transform: rotateY(180deg);
  }

  .transition-3d-space.transition-active .front {
    transform: rotateY(-180deg);
  }

  .transition-3d-space.transition-active .back {
    transform: rotateY(0);
  }

  .text-content {
    padding: 28px;
    height: 100%;
    width: 100%;
    overflow-y: auto;
    background: #fdfbf7;
    font-family: Georgia, serif;
    line-height: 1.6;
    color: #333;
    font-size: 15px;
  }

  .image-content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    background: #fff;
    display: flex;
    align-items: flex-start;
  }

  .image-content img {
    width: 100%;
    height: auto;
    display: block;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-style: italic;
    padding: 20px;
    text-align: center;
  }

  .text-content::-webkit-scrollbar,
  .image-content::-webkit-scrollbar {
    width: 8px;
  }

  .text-content::-webkit-scrollbar-track,
  .image-content::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.05);
  }

  .text-content::-webkit-scrollbar-thumb,
  .image-content::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.15);
    border-radius: 4px;
  }

  .text-content::-webkit-scrollbar-thumb:hover,
  .image-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.25);
  }

  .header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .image-input-wrapper {
    display: flex;
    align-items: center;
    flex-grow: 1;
    margin-right: 12px;
  }

  .transition-box {
    min-width: 300px;    /* Add minimum width */
    min-height: 200px;   /* Add minimum height */
  }

  .page-images-grid {
    background: #fff;
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;
    border-bottom: 1px solid rgba(0,0,0,0.1);
  }

  .images-header {
    margin-bottom: 12px;
  }

  .images-header h3 {
    margin: 0;
    color: #2c1810;
    font-size: 14px;
  }

  .close-grid {
    background: none;
    border: none;
    color: #666;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
  }

  .control-buttons {
    display: flex;
    gap: 8px;
  }

  .write-icon-button {
    background: none;
    border: none;
    padding: 8px;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .write-icon-button:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }

  .writing-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    pointer-events: none;
  }

  .writing-card {
  pointer-events: auto;
  position: absolute;
  background: url("https://img.freepik.com/foto-premium/vecchia-carta-pergamena-texture-di-sfondo-carta-da-parati-vintage_118047-11775.jpg");
  padding: 40px;
  width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  transform: perspective(850px) rotateY(5deg);
  cursor: grab;
  z-index: 10000;
  }

  .writing-card:active {
  cursor: grabbing;
}

  .writing-title {
    width: 100%;
    font-family: 'Dancing Script', serif;
    font-size: 2rem;
    font-weight: bold;
    padding: 8px;
    margin-bottom: 16px;
    border: none;
    background: transparent;
    color: #2c1810;
  }

  .writing-content {
    width: 100%;
    min-height: 300px;
    font-family: 'Dancing Script', serif;
    font-size: 1.4rem;
    line-height: 1.6;
    padding: 16px;
    margin: 1.8rem 0;
    border: none;
    background: transparent;
    color: #2c1810;
    resize: none;
  }

  .writing-content::first-letter {
    font-size: 3em;
    font-weight: bold;
    float: left;
    margin-right: 0.1em;
    line-height: 1;
    color: #8b4513;
  }

  .writing-controls {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }

  .writing-controls button {
    font-family: 'Dancing Script', serif;
    padding: 8px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
  }

  .save-writing {
    background: #8b4513;
    color: white;
  }

  .save-writing:hover {
    background: #6b3410;
  }

  .cancel-writing {
    background: #d3c4a3;
    color: #2c1810;
  }

  .cancel-writing:hover {
    background: #c3b493;
  }


  .images-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .page-image-item {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .page-image-item:hover {
    border-color: #2c1810;
  }

  .page-image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .save-to-notes-button {
    background: none;
    border: none;
    padding: 8px;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .save-to-notes-button:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
`;

style.textContent += additionalStyles;

document.head.appendChild(style);

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

function createImageUrlInput() {
  const modal = document.createElement('div');
  modal.className = 'image-url-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Enter Image URL</h3>
      <input type="text" placeholder="https://example.com/image.jpg">
      <button>Continue</button>
    </div>
  `;

  return new Promise(resolve => {
    const input = modal.querySelector('input');
    const button = modal.querySelector('button');
    
    button.addEventListener('click', () => {
      const url = input.value.trim();
      if (url) {
        modal.remove();
        resolve(url);
      }
    });

    document.body.appendChild(modal);
  });
  
}

function showMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #8b4513;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    font-family: 'Dancing Script', serif;
    font-size: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}


// listening for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze") {
    sendResponse({ status: "processing" });
    const selectedText = request.text || window.getSelection().toString();
    if (selectedText) {
      transformText(selectedText).catch(error => console.error('Error:', error));
    }
  }
});
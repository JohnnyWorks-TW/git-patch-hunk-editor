<template>
  <div 
    class="app-container"
    @dragover.prevent
    @drop.prevent
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop="handleDrop"
  >
    <header class="toolbar">
      <div class="title">
        Patch Hunk Editor 
        <span v-if="isDirty" class="dirty-indicator">*</span>
      </div>
      <div class="actions">
        <button @click="showOpenUI = true">Open Patch</button>
        <button @click="saveFile" :disabled="!files.length">Save Patch</button>
      </div>
    </header>
    
    <!-- Main Content: File Loaded -->
    <div class="main-content" v-if="files.length && !showOpenUI && !isDragging">
      <aside class="sidebar">
        <ul>
          <li 
            v-for="(file, idx) in files" 
            :key="file.id"
            :class="{ active: selectedFileIndex === idx }"
            @click="selectedFileIndex = idx"
          >
            {{ getFileName(file.header) }}
          </li>
        </ul>
      </aside>
      
      <main class="editor-area" v-if="selectedFile">
        <div class="file-header">{{ getFileName(selectedFile.header) }}</div>
        <div class="hunks">
          <HunkItem 
            v-for="(hunk, hIdx) in selectedFile.hunks" 
            :key="hunk.id" 
            :hunk="hunk"
            @split="handleSplit(hIdx, $event)"
          />
        </div>
      </main>
    </div>

    <!-- Empty State: No File Loaded -->
    <div v-else-if="!files.length && !showOpenUI && !isDragging" class="empty-state">
      <p>No file opened</p>
    </div>

    <!-- Open/Drop Overlay -->
    <div 
      v-else 
      class="open-overlay"
      @click="openFileSystemDialog"
    >
      <div class="drop-message">
        <button v-if="files.length > 0 || showOpenUI" @click.stop="showOpenUI = false" class="close-overlay-btn" title="Close">
          ✕
        </button>
        <div class="icon">📂</div>
        <p>Drag file to open or click to browse file</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { PatchParser } from './utils/patchParser';
import HunkItem from './components/HunkItem.vue';

const files = ref([]);
const selectedFileIndex = ref(0);
const currentFilePath = ref('');
const isDirty = ref(false);

// UI States
const showOpenUI = ref(false);
const isDragging = ref(false);
let dragCounter = 0;

const selectedFile = computed(() => files.value[selectedFileIndex.value]);

function getFileName(header) {
  const match = header.match(/diff --git a\/(.*) b\//);
  if (match) return match[1];
  return header.split('\n')[0];
}

/* Open Flow */
async function openFileSystemDialog() {
  const result = await window.electronAPI.openFile();
  if (result) {
    if (isDirty.value) {
       // Ideally ask here too, but for now just load (or we rely on user clicking save)
       // Let's reset dirty since it's a new file
    }
    loadFile(result.filePath, result.content);
  }
}

async function handleDrop(e) {
  isDragging.value = false;
  dragCounter = 0;
  
  const droppedFiles = e.dataTransfer.files;
  if (droppedFiles.length > 0) {
    const file = droppedFiles[0];
    const filePath = file.path; 
    
    if (filePath) {
       const result = await window.electronAPI.readFile(filePath);
       if (result.success) {
         loadFile(filePath, result.content);
       } else {
         alert('Error reading file: ' + result.error);
       }
    } else {
       alert('Cannot determine file path. Please use Browse.');
    }
  }
}

function loadFile(path, content) {
    currentFilePath.value = path;
    files.value = PatchParser.parse(content);
    selectedFileIndex.value = 0;
    showOpenUI.value = false;
    isDirty.value = false;
}

/* Drag Events */
function handleDragEnter(e) {
  dragCounter++;
  isDragging.value = true;
}

function handleDragLeave(e) {
  dragCounter--;
  if (dragCounter <= 0) {
    isDragging.value = false;
    dragCounter = 0;
  }
}

async function saveFile() {
  const content = PatchParser.stringify(files.value);
  const result = await window.electronAPI.saveFile({
    filePath: currentFilePath.value, 
    content
  });
  if (result.success) {
    isDirty.value = false;
    // alert('Saved successfully!'); // Optional: removed for smoother flow or keep it? existing had it.
    // Let's keep a small notification or just rely on dirty indicator clearing.
    // Existing code had alert, maybe annoying if frequent saving.
    // I'll leave the alert out for now as the dirty star clearing is feedback.
  } else {
    alert('Save failed: ' + result.error);
  }
}

function handleSplit(hunkIndex, lineIndex) {
  const hunkArray = selectedFile.value.hunks;
  const targetHunk = hunkArray[hunkIndex];
  
  const [h1, h2] = PatchParser.splitHunk(targetHunk, lineIndex);
  hunkArray.splice(hunkIndex, 1, h1, h2);
  isDirty.value = true;
}

/* Close Confirmation */
async function handleBeforeUnload(e) {
    if (isDirty.value) {
        e.returnValue = false; // Required for Electron/Chromium to pause
        
        // Show dialog
        const { response } = await window.electronAPI.showMessageBox({
            type: 'question',
            buttons: ['Save', "Don't Save", 'Cancel'],
            title: 'Unsaved Changes',
            message: 'Do you want to save your changes before quitting?'
        });

        if (response === 0) { // Save
            await saveFile(); 
            // After save, we need to allow close.
            isDirty.value = false; 
            // Re-trigger close? Window might not close automatically after async dialog.
            // We need to tell main process to close window now.
            // But we are in beforeunload which is tricky.
            // Standard trick: isDirty is now false, so next close works.
            window.close();
        } else if (response === 1) { // Don't Save
            isDirty.value = false;
            window.close();
        } 
        // Cancel (2) -> Do nothing, stay open.
    }
}

onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style>
body { margin: 0; font-family: sans-serif; height: 100vh; overflow: hidden; }
#app { height: 100vh; display: flex; flex-direction: column; }
</style>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative; /* For absolute overlay */
}

.title .dirty-indicator {
    color: #ffcc00;
    margin-left: 5px;
    font-weight: bold;
}

.toolbar {
  height: 50px;
  background: #333;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
  flex-shrink: 0;
  z-index: 20; 
}

.toolbar button {
  padding: 5px 15px;
  margin-left: 10px;
  cursor: pointer;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: #f0f0f0;
  border-right: 1px solid #ccc;
  overflow-y: auto;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar li:hover {
  background: #e0e0e0;
}

.sidebar li.active {
  background: #007acc;
  color: white;
}

.editor-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
}

.file-header {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 1.2rem;
}

/* Overlay Styles */
.open-overlay {
  position: absolute; /* Cover entire content area below toolbar? */
  top: 50px; /* Below toolbar */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(248, 249, 250, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border: 4px dashed #ccc; /* Border on the overlay itself? Or inner container? */
  /* Actually user wants a specific "Drag file to open" look. */
}

/* Let's style the overlay to look like a drop zone */
.open-overlay {
    margin: 0; /* Override previous margin */
    border: none;
    background: white; /* Opaque to hide content behind */
}


.open-overlay .drop-message {
    border: 4px dashed #ccc;
    border-radius: 10px;
    padding: 50px;
    width: calc(100% - 40px); /* 20px margin on each side = 40px total reduction */
    height: calc(100% - 100px - 40px);
    margin: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    transition: all 0.2s;
    position: relative; /* Context for absolute positioning of close button */
}

.open-overlay:hover .drop-message {
  background-color: #eefecf;
  border-color: #999;
}

.close-overlay-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    border: none;
    background: transparent;
    font-size: 24px;
    color: #666;
    cursor: pointer;
    font-weight: bold;
    padding: 5px 10px;
}

.close-overlay-btn:hover {
    color: #000;
}

/* If dragging active */
.app-container[data-dragging="true"] .open-overlay {
  /* This logic was handled via logic in template but CSS helps too */
}

/* If dragging is active, we might want to forcefully show overlay or style header */
</style>
<template>
  <div class="hunk-container">
    <div class="hunk-header">{{ header }}</div>
    <div class="hunk-content">
      <div 
        v-for="(line, idx) in formattedLines" 
        :key="idx" 
        class="hunk-line"
        :class="getLineClass(line.type)"
        @mouseenter="hoveredLine = idx"
        @mouseleave="hoveredLine = -1"
      >
        <span class="line-number old">{{ line.oldNum }}</span>
        <span class="line-number new">{{ line.newNum }}</span>
        <span class="line-marker">{{ line.marker }}</span>
        <pre class="line-text">{{ line.content }}</pre>
        
        <button 
          v-if="hoveredLine === idx && idx > 0 && idx < formattedLines.length"
          class="split-btn"
          @click="$emit('split', idx)"
          title="Split hunk here"
        >
          ✂️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  hunk: Object
});

const hoveredLine = ref(-1);

const header = computed(() => {
  // We can re-generate it to be sure it matches meta, 
  // or just use the string if we trust it. 
  // Let's generate a nice label.
  const { oldStart, oldLen, newStart, newLen } = props.hunk.headerMeta;
  return `@@ -${oldStart},${oldLen} +${newStart},${newLen} @@`;
});

const formattedLines = computed(() => {
  const lines = props.hunk.lines;
  const { oldStart, newStart } = props.hunk.headerMeta;
  
  let currentOld = oldStart;
  let currentNew = newStart;
  
  return lines.map(line => {
    const type = line[0]; // ' ', '-', '+'
    const content = line.substring(1);
    
    let oldNum = '';
    let newNum = '';
    
    if (type === ' ' || type === '-') {
      oldNum = currentOld++;
    }
    if (type === ' ' || type === '+') {
      newNum = currentNew++;
    }
    
    return {
      type,
      marker: type,
      content,
      oldNum,
      newNum
    };
  });
});

function getLineClass(type) {
  if (type === '+') return 'added';
  if (type === '-') return 'deleted';
  return '';
}
</script>

<style scoped>
.hunk-container {
  border: 1px solid #ddd;
  margin-bottom: 20px;
  background: white;
  border-radius: 4px;
}

.hunk-header {
  background: #eefecf;
  color: #555;
  padding: 5px 10px;
  font-family: monospace;
  font-size: 0.9rem;
  border-bottom: 1px solid #ddd;
}

.hunk-content {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

.hunk-line {
  display: flex;
  position: relative;
  line-height: 1.5;
}

.hunk-line:hover {
  background-color: #f5f5f5;
}

.line-number {
  width: 30px;
  text-align: right;
  padding: 0 5px;
  color: #aaa;
  user-select: none;
  border-right: 1px solid #eee;
}

.line-marker {
  width: 20px;
  text-align: center;
  user-select: none;
  color: #999;
}

.line-text {
  margin: 0;
  white-space: pre-wrap;
  flex: 1;
  padding-left: 5px;
}

.added {
  background-color: #e6ffec;
}

.deleted {
  background-color: #ffebe9;
}


.split-btn {
  display: block;
  position: absolute;
  right: 10px;
  top: 0;
  bottom: 0;
  margin: auto;
  height: 20px;
  background: white;
  border: 1px solid #ddd;
  cursor: pointer;
}
</style>

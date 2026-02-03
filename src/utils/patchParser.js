export class PatchParser {
  static parse(content) {
    const files = [];
    const rawFiles = content.split(/^diff --git /m);
    
    // The first chunk might be empty or contain prelude
    if (rawFiles[0].trim() === '') {
      rawFiles.shift();
    } else if (!content.startsWith('diff --git')) {
        // Handle case where prelude is before first diff
        // For now, treat as raw text or just skip? 
        // Standard git format starts with diff --git usually, 
        // or format-patch has mail headers. 
        // Let's assume standard diff or just ignore prelude for now.
    }

    rawFiles.forEach(raw => {
      if (!raw.trim()) return;
      const file = this.parseFileBlock('diff --git ' + raw);
      if (file) files.push(file);
    });

    return files;
  }

  static parseFileBlock(raw) {
    // Separate header and hunks
    // Hunks start with "@@ -"
    const hunkSplit = raw.split(/^@@ -/m);
    const header = hunkSplit[0];
    const rawHunks = hunkSplit.slice(1);

    const hunks = rawHunks.map(h => this.parseHunk('@@ -' + h));

    return {
      header,
      hunks,
      id: Math.random().toString(36).substr(2, 9)
    };
  }

  static parseHunk(raw) {
    const validLines = raw.split(/\r?\n/);
    const headerLine = validLines[0]; // @@ -1,2 +1,2 @@ ...
    const lines = validLines.slice(1); // Content lines

    // Parse header to get numbers (optional, but good for validation)
    // @@ -oldStart,oldLen +newStart,newLen @@
    const match = headerLine.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/);
    
    if (!match) return null;

    return {
      header: headerLine,
      headerMeta: {
          oldStart: parseInt(match[1]),
          oldLen: parseInt(match[2] || 1),
          newStart: parseInt(match[3]),
          newLen: parseInt(match[4] || 1),
          section: match[5]
      },
      lines: lines,
      id: Math.random().toString(36).substr(2, 9)
    };
  }

  static stringify(files) {
    return files.map(f => {
      const hunksStr = f.hunks.map(h => {
        // Recalculate header before stringifying? 
        // Ideally we keep internal state consistent.
        // But here we rely on the component to update the header string or meta.
        // Let's assume header is up to date or we regenerate it.
        const header = this.generateHunkHeader(h);
        // Ensure lines end with newline if needed
        const content = h.lines.join('\n');
        return `${header}\n${content}`;
      }).join('\n');
      
      return `${f.header}${hunksStr}`;
    }).join(''); // Header usually includes newline at end
  }

  static generateHunkHeader(hunk) {
      if (hunk.headerMeta) {
          const {oldStart, oldLen, newStart, newLen, section} = hunk.headerMeta;
          return `@@ -${oldStart},${oldLen} +${newStart},${newLen} @@${section || ''}`;
      }
      return hunk.header;
  }

  static splitHunk(hunk, splitIndex) {
      // splitIndex is the index in hunk.lines where the second hunk starts
      // This means lines[0...splitIndex-1] go to first hunk
      // lines[splitIndex...end] go to second hunk
      
      const lines1 = hunk.lines.slice(0, splitIndex);
      const lines2 = hunk.lines.slice(splitIndex);

      // We need to calculate the length/offsets for both.
      // We assume the original hunk's start positions are valid.
      // We need to "walk" the lines to find where the second hunk starts in terms of line numbers.
      
      let currentOldLine = hunk.headerMeta.oldStart;
      let currentNewLine = hunk.headerMeta.newStart;

      let h1OldLen = 0;
      let h1NewLen = 0;

      for (const line of lines1) {
          const type = line[0]; // ' ', '-', '+'
          if (type === ' ' || type === '-') {
              h1OldLen++;
              // currentOldLine doesn't effectively change "for the next line" in a simple counter way per se, 
              // but we are just counting length here.
              // Wait, strictly speaking:
              // - : consumes old line
              // + : consumes new line
              // ' ' : consumes both
          }
          if (type === ' ' || type === '+') {
              h1NewLen++;
          }
          
          // To find the START of the NEXT hunk, we interpret the lines:
           if (type === ' ' || type === '-') {
               currentOldLine++;
           }
           if (type === ' ' || type === '+') {
               currentNewLine++;
           }
      }

      // Hunk 2 starts where Hunk 1 ended
      const h2OldStart = currentOldLine;
      const h2NewStart = currentNewLine;
      
      // Calculate length for Hunk 2
      let h2OldLen = 0;
      let h2NewLen = 0;
      for (const line of lines2) {
          const type = line[0];
          if (type === ' ' || type === '-') h2OldLen++;
          if (type === ' ' || type === '+') h2NewLen++;
      }

      const h1Meta = {
          ...hunk.headerMeta,
          oldLen: h1OldLen,
          newLen: h1NewLen
      };

      const h2Meta = {
          oldStart: h2OldStart,
          oldLen: h2OldLen,
          newStart: h2NewStart,
          newLen: h2NewLen,
          section: hunk.headerMeta.section
      };

      return [
          {
              headerMeta: h1Meta,
              lines: lines1,
              id: hunk.id // Keep ID for first? Or new? Let's keep ID for first to replace it, create new ID for second
          },
          {
              headerMeta: h2Meta,
              lines: lines2,
              id: Math.random().toString(36).substr(2, 9)
          }
      ];
  }
}

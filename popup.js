document.addEventListener('DOMContentLoaded', () => {
  const getTitleBtn = document.getElementById('getTitleBtn');
  const titleOutput = document.getElementById('titleOutput');

  let counter = parseInt(localStorage.getItem('puzzle_counter') || '1');

  getTitleBtn.addEventListener('click', async () => {
    try {
      // Query the active tab in the current window
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab) {
        // Function to run in the page context
        function getKwdbText() {
          const elements = document.querySelectorAll('move');
          const texts = [];
          for (const el of elements) {
            const txt = el.textContent.trim();
            if (txt && txt != '...') {
              texts.push(txt);
            }
            if (el.classList.contains('active')) {
              break;
            }
          }
          const commentEl = document.getElementById('comment-text');
          const comment = commentEl ? commentEl.value.trim() : '';
          return { moves: texts, comment: comment };
        }

        const responses = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getKwdbText,
        });

        const { moves: texts, comment } = responses[0]?.result || { moves: [], comment: '' };

        if (texts.length > 0 || comment) {
          const formattedLines = [];
          for (let i = 0; i < texts.length; i += 2) {
            const lineNum = Math.floor(i / 2) + 1;
            const seg1 = texts[i];
            const seg2 = texts[i + 1];
            if (seg2) {
              formattedLines.push(`${lineNum}. ${seg1} ${seg2}`);
            } else {
              formattedLines.push(`${lineNum}. ${seg1}`);
            }
          }
          let finalOutput = `[Event "${counter}"]\n` + formattedLines.join('\n');
          if (comment) {
            finalOutput += formattedLines.length > 0 ? `\n{${comment}}` : `{${comment}}`;
          }
          finalOutput += '\n\n';
          titleOutput.value = finalOutput;

          // Increment and save counter
          counter++;
          localStorage.setItem('puzzle_counter', counter.toString());

          try {
            await navigator.clipboard.writeText(finalOutput);
            // Visual feedback could be added here if needed, but we already have micro-animations.
          } catch (clipError) {
            console.error('Failed to copy to clipboard:', clipError);
          }
        } else {
          titleOutput.value = 'No <move> tags found with text.';
        }

        // Add a micro-animation feedback
        titleOutput.style.transform = 'scale(1.01)';
        setTimeout(() => {
          titleOutput.style.transform = 'scale(1)';
        }, 150);
      } else {
        titleOutput.value = 'Error: No active tab found.';
      }
    } catch (error) {
      console.error('Error getting title:', error);
      titleOutput.value = 'Error: ' + error.message;
    }
  });

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      counter = 1;
      localStorage.setItem('puzzle_counter', '1');
      titleOutput.value = 'Counter reset to 1';

      // Visual feedback
      resetBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        resetBtn.style.transform = 'scale(1)';
      }, 150);
    });
  }
});

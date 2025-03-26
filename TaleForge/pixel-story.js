document.addEventListener('DOMContentLoaded', function() {
    // Get story from localStorage
    const story = localStorage.getItem('generatedStory');
    const originalStory = localStorage.getItem('originalStory');
    const storyContent = document.getElementById('storyContent');
    const toggleButton = document.getElementById('toggleOriginal');
    
    let showingOriginal = false;

    // Display story
    if (story) {
        storyContent.textContent = story;
    } else {
        storyContent.textContent = 'No story found. Please generate one first.';
        toggleButton.style.display = 'none';
    }

    // Toggle between original and modified story
    toggleButton.addEventListener('click', function() {
        showingOriginal = !showingOriginal;
        storyContent.textContent = showingOriginal ? originalStory : story;
        toggleButton.textContent = showingOriginal ? 'SHOW MODIFIED' : 'SHOW ORIGINAL';
    });

    // Typewriter effect for story display
    function typeWriter(element, text, speed = 10) {
        let i = 0;
        element.textContent = '';
        function typing() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typing, speed);
            }
        }
        typing();
    }

    // Apply typewriter effect
    if (story) {
        const fullText = storyContent.textContent;
        storyContent.textContent = '';
        typeWriter(storyContent, fullText);
    }
});
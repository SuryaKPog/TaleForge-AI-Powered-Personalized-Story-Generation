document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generateBtn');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateStory);
    }

    // Add event listeners for Enter key
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateStory();
            }
        });
    });
});

async function generateStory() {
    const genre = document.getElementById('genre').value || 'Fantasy';
    const setting = document.getElementById('setting').value || 'Space';
    const character = document.getElementById('character').value || 'Hero';
    const keywords = document.getElementById('keywords').value || 'Magic';
    const sentiment = document.getElementById('sentiment').value || 'Happy';

    // Show loading state
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.textContent = 'GENERATING...';

    try {
        const response = await fetch('http://localhost:5000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                genre: genre,
                setting: setting,
                character: character,
                keywords: keywords,
                sentiment: sentiment
            })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            localStorage.setItem('generatedStory', data.story);
            localStorage.setItem('originalStory', data.original_story);
            window.location.href = 'story.html';
        } else {
            throw new Error(data.message || 'Failed to generate story');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating story: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'GENERATE STORY';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    // ================ DOM ELEMENTS ================
    const storyContent = document.getElementById('storyContent');
    const toggleButton = document.getElementById('toggleOriginal');
    const generateArtBtn = document.getElementById('generateArtBtn');
    const artPreview = document.getElementById('artPreview');
    const artSection = document.getElementById('artSection');
    const createAnotherBtn = document.querySelector('.create-another');
    
    // ================ STATE VARIABLES ================
    const story = localStorage.getItem('generatedStory');
    const originalStory = localStorage.getItem('originalStory');
    let showingOriginal = false;
    let currentAnimation = null;
    let currentArtUrl = null;
    let isGeneratingArt = false;

    // ================ API CONFIGURATION ================
    const API_CONFIG = {
        KEY: 'OPEN-AI-KEY', // Your actual OpenAI API key
        ENDPOINT: "https://api.openai.com/v1/images/generations"
    };
    

    // ================ INITIALIZATION ================
    function initializePage() {
        if (!story) {
            handleMissingStory();
            return;
        }
        
        if (!API_CONFIG.KEY) {
            displayArtError(new Error("No OpenAI API key provided"));
            generateArtBtn.disabled = true;
        }
        
        displayStory(story);
        setupArtGeneration();
        setupEventListeners();
    }

    function handleMissingStory() {
        storyContent.textContent = 'NO STORY FOUND. PLEASE GENERATE ONE FIRST.';
        toggleButton.style.display = 'none';
        artSection.style.display = 'none';
    }

    // ================ STORY DISPLAY ================
    function displayStory(text, callback) {
        typeWriter(text, storyContent, 20, callback);
    }

    function typeWriter(text, element, speed = 20, callback) {
        clearExistingAnimation();
        
        let i = 0;
        element.textContent = '';
        
        function typing() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                currentAnimation = setTimeout(typing, speed);
            } else {
                currentAnimation = null;
                if (callback) callback();
            }
        }
        
        typing();
    }

    function clearExistingAnimation() {
        if (currentAnimation) {
            clearTimeout(currentAnimation);
            currentAnimation = null;
        }
    }

    function toggleStoryVersion() {
        showingOriginal = !showingOriginal;
        const textToShow = showingOriginal ? originalStory : story;
        
        displayStory(textToShow, () => {
            toggleButton.textContent = showingOriginal ? 'SHOW MODIFIED' : 'SHOW ORIGINAL';
        });
    }

    // ================ ART GENERATION ================
    function setupArtGeneration() {
        if (!originalStory) {
            toggleButton.style.display = 'none';
        }
        artSection.style.display = 'block';
    }

    async function generatePixelArt() {
        if (isGeneratingArt) return;
        
        isGeneratingArt = true;
        setLoadingState(true);
        
        try {
            if (!API_CONFIG.KEY) {
                throw new Error("API key not configured");
            }

            const artPrompt = createArtPrompt();
            console.log("Generating art for prompt:", artPrompt);
            
            const artData = await fetchPixelArt(artPrompt);
            
            if (artData.success) {
                currentArtUrl = artData.imageUrl;
                displayGeneratedArt(artData.imageUrl, artPrompt);
            } else {
                throw new Error(artData.error || 'Failed to generate art');
            }
        } catch (error) {
            console.error("Art generation error:", error);
            displayArtError(error);
        } finally {
            setLoadingState(false);
            isGeneratingArt = false;
        }
    }

    function createArtPrompt() {
        return `8-bit pixel art, NES style for: ${story.slice(0, 150)}` +
               `\nStyle: Retro video game, 16-bit colors` +
               `\nPalette: NES classic`;
    }

    async function fetchPixelArt(prompt) {
        try {
            console.log("Making API request to OpenAI...");
            const response = await fetch(API_CONFIG.ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_CONFIG.KEY}`
                },
                body: JSON.stringify({ 
                    prompt: `Pixel art version of: ${prompt}`,
                    n: 1,
                    size: "256x256",
                    response_format: "url"
                })
            });

            console.log("API response status:", response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API error details:", errorData);
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            console.log("API response data:", data);
            
            if (!data.data || !data.data[0]?.url) {
                throw new Error("Invalid response format from API");
            }

            return {
                success: true,
                imageUrl: data.data[0].url
            };
        } catch (error) {
            console.error("API call failed:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    function setLoadingState(isLoading) {
        generateArtBtn.disabled = isLoading;
        generateArtBtn.textContent = isLoading ? "GENERATING..." : "GENERATE PIXEL ART";
        
        if (isLoading) {
            artPreview.innerHTML = `
                <div class="pixel-art-loader"></div>
                <p class="generation-status">Rendering pixels...</p>
            `;
        }
    }

    function displayGeneratedArt(imageUrl, prompt) {
        artPreview.innerHTML = `
            <div class="pixel-art-wrapper">
                <img src="${imageUrl}" class="pixel-art-preview" 
                     alt="Generated pixel art" loading="eager">
                <span class="pixel-art-badge">AI ART</span>
            </div>
            <p class="art-prompt">"${prompt.split('\n')[0]}"</p>
            <button class="pixel-button save-btn">SAVE ART</button>
        `;
        
        // Force image load and handle errors
        const img = artPreview.querySelector('img');
        img.onload = () => console.log("Image loaded successfully");
        img.onerror = () => {
            console.error("Image failed to load");
            artPreview.querySelector('.pixel-error').textContent = "Image failed to load";
        };
        
        document.querySelector('.save-btn').addEventListener('click', saveArt);
    }

    function saveArt() {
        if (!currentArtUrl) return;
        
        try {
            const link = document.createElement('a');
            link.href = currentArtUrl;
            link.download = `taleforge-pixel-art-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(currentArtUrl);
            }, 100);
        } catch (error) {
            console.error("Error saving art:", error);
            alert("Couldn't save image. Please try right-clicking and saving manually.");
        }
    }

    function displayArtError(error) {
        console.error("Art generation failed:", error);
        artPreview.innerHTML = `
            <p class="pixel-error">⚠️ GENERATION FAILED</p>
            <p class="error-detail">${error.message || 'Please try again later'}</p>
            ${error.message.includes('API') ? '<p class="error-detail">Check your API key and connection</p>' : ''}
        `;
    }

    // ================ NAVIGATION ================
    function createScreenWipe() {
        const wipe = document.createElement('div');
        wipe.className = 'screen-wipe';
        document.body.appendChild(wipe);
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    }

    // ================ EVENT LISTENERS ================
    function setupEventListeners() {
        toggleButton.addEventListener('click', toggleStoryVersion);
        generateArtBtn.addEventListener('click', generatePixelArt);
        
        if (createAnotherBtn) {
            createAnotherBtn.addEventListener('click', function(e) {
                e.preventDefault();
                createScreenWipe();
            });
        }
    }

    // ================ START THE APPLICATION ================
    initializePage();
});

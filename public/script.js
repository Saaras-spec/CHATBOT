document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat');

    let chatHistory = [];

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    const appendMessage = (role, content, isWelcome = false) => {
        const messageDiv = document.createElement('div');
        let processedContent = content;
        let isAlert = false;

        // Check for the strict non-science prefix
        if (content.startsWith('[STRICT: NON-SCIENCE ALERT]')) {
            isAlert = true;
            processedContent = content.replace('[STRICT: NON-SCIENCE ALERT]', '⚠️ **NON-SCIENTIFIC QUERY DETECTED:**');
        }

        messageDiv.className = `message ${role} ${isWelcome ? 'welcome' : ''} ${isAlert ? 'alert' : ''}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Use marked.js for markdown rendering
        if (role === 'assistant') {
            contentDiv.innerHTML = marked.parse(processedContent);
        } else {
            contentDiv.textContent = processedContent;
        }

        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    const handleSendMessage = async () => {
        const prompt = userInput.value.trim();
        if (!prompt) return;

        // Clear input and reset height
        userInput.value = '';
        userInput.style.height = 'auto';

        // Append user message
        appendMessage('user', prompt);
        
        // Add to history
        chatHistory.push({ role: 'user', content: prompt });

        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.innerHTML = '<div class="typing-indicator"><i class="fas fa-circle-notch fa-spin"></i> Lab Assistant is analyzing...</div>';
        chatContainer.appendChild(typingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: chatHistory }),
            });

            const data = await response.json();

            // Remove typing indicator
            chatContainer.removeChild(typingDiv);

            if (data.error) {
                appendMessage('assistant', `⚠️ **Error:** ${data.error}`);
            } else {
                appendMessage('assistant', data.content);
                chatHistory.push({ role: 'assistant', content: data.content });
            }
        } catch (error) {
            chatContainer.removeChild(typingDiv);
            appendMessage('assistant', '⚠️ **Connection Error:** Could not reach the server. Make sure the backend is running.');
            console.error('Fetch error:', error);
        }
    };

    sendBtn.addEventListener('click', handleSendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    clearChatBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the chat history?')) {
            chatHistory = [];
            // Keep only the welcome message
            const welcome = chatContainer.querySelector('.welcome');
            chatContainer.innerHTML = '';
            if (welcome) chatContainer.appendChild(welcome);
        }
    });
});

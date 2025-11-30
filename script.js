// Configuration
const CONFIG = {
    MAX_MESSAGE_LENGTH: 1000,
    TYPING_INDICATOR_DELAY: 1000,
    AUTO_SCROLL_DELAY: 100
};

// DOM Elements
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatWindow = document.getElementById('chatWindow');
const chatbotIcon = document.getElementById('chatbotIcon');
const closeChat = document.getElementById('closeChat');
const flightInfoModal = document.getElementById('flightInfoModal');
const closeFlightModal = document.getElementById('closeFlightModal');
const flightModalBody = document.getElementById('flightModalBody');
const searchFlightsBtn = document.getElementById('searchFlights');

// Quick action elements
const quickActionCards = document.querySelectorAll('.quick-action-card');

// Initialize welcome message timestamp
document.getElementById('welcomeTime').textContent = getCurrentTime();

// Toggle chat window
chatbotIcon.addEventListener('click', () => {
    chatWindow.classList.add('active');
    userInput.focus();
});

closeChat.addEventListener('click', () => {
    chatWindow.classList.remove('active');
});

// Close flight modal
closeFlightModal.addEventListener('click', () => {
    flightInfoModal.classList.remove('active');
});

// Quick action handlers
quickActionCards.forEach(card => {
    card.addEventListener('click', () => {
        const action = card.getAttribute('data-action');
        handleQuickAction(action);
    });
});

// Search flights button handler
searchFlightsBtn.addEventListener('click', handleFlightSearch);

// Quick action handling
function handleQuickAction(action) {
    let message = '';
    
    switch(action) {
        case 'flight-status':
            message = "Can you check the status of flight NZ123?";
            break;
        case 'web-checkin':
            message = "I want to check in for my flight";
            break;
        case 'manage-booking':
            message = "I need to manage my booking";
            break;
        case 'flight-info':
            message = "Show me flights from Auckland to Delhi on December 29th";
            break;
    }
    
    if (message) {
        userInput.value = message;
        handleSendMessage();
    }
}

// Flight search handler
function handleFlightSearch() {
    const from = document.getElementById('fromInput').value || 'Auckland';
    const to = document.getElementById('toInput').value || 'Delhi';
    const date = document.getElementById('departureDate').value || '2024-12-29';
    
    const message = `Search flights from ${from} to ${to} on ${date}`;
    userInput.value = message;
    handleSendMessage();
}

// Send message to server
async function sendMessageToBot(message) {
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error('Error sending message:', error);
        return "Sorry, I'm having trouble connecting right now. Please try again shortly.";
    }
}

// Add message to chat
function addMessage(text, sender, showTime = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // Format flight information with better styling
    const formattedText = formatFlightInfo(text);
    messageDiv.innerHTML = formattedText;
    
    if (showTime) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = getCurrentTime();
        messageDiv.appendChild(timeDiv);
    }
    
    chatBox.appendChild(messageDiv);
    scrollToBottom();
    
    return messageDiv;
}

// Format flight information in messages
function formatFlightInfo(text) {
    // Format flight numbers (e.g., NZ123)
    text = text.replace(/([A-Z]{2}\d+)/g, '<strong>$1</strong>');
    
    // Format prices (e.g., NZ$1,299)
    text = text.replace(/(NZ\$\d+(?:,\d+)?)/g, '<span class="flight-price">$1</span>');
    
    // Format flight routes (e.g., AKL → DEL)
    text = text.replace(/([A-Z]{3})\s*→\s*([A-Z]{3})/g, '$1 → $2');
    
    // Add icons for common flight terms
    text = text.replace(/Depart:/g, '🛫 Depart:');
    text = text.replace(/Arrive:/g, '🛬 Arrive:');
    text = text.replace(/Duration:/g, '⏱️ Duration:');
    text = text.replace(/Aircraft:/g, '✈️ Aircraft:');
    text = text.replace(/Status:/g, '📊 Status:');
    text = text.replace(/Baggage:/g, '📦 Baggage:');
    text = text.replace(/Prices:/g, '💰 Prices:');
    
    // Convert line breaks to proper HTML
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Show flight details in modal
function showFlightDetails(flightData) {
    const flight = flightData.flight;
    flightModalBody.innerHTML = `
        <div class="flight-detail-modal">
            <div class="flight-header">
                <h4>${flight.flightNumber} - ${flight.airline}</h4>
                <span class="flight-status ${flight.status.toLowerCase()}">${flight.status}</span>
            </div>
            
            <div class="route-info">
                <div class="route-segment">
                    <div class="airport">${flight.departure.airport}</div>
                    <div class="time">${flight.departure.time}</div>
                    <div class="date">${formatDate(flight.departure.date)}</div>
                    <div class="terminal">Terminal ${flight.departure.terminal}</div>
                </div>
                
                <div class="route-duration">
                    <div class="duration">${flight.duration}</div>
                    <div class="route-line"></div>
                </div>
                
                <div class="route-segment">
                    <div class="airport">${flight.arrival.airport}</div>
                    <div class="time">${flight.arrival.time}</div>
                    <div class="date">${formatDate(flight.arrival.date)}</div>
                    <div class="terminal">Terminal ${flight.arrival.terminal}</div>
                </div>
            </div>
            
            <div class="flight-details-grid">
                <div class="detail-item">
                    <label>Aircraft</label>
                    <span>${flight.aircraft}</span>
                </div>
                <div class="detail-item">
                    <label>Travel Time</label>
                    <span>${flight.duration}</span>
                </div>
                <div class="detail-item">
                    <label>Baggage</label>
                    <span>${flight.baggage.carryOn} + ${flight.baggage.checked}</span>
                </div>
            </div>
            
            <div class="pricing-section">
                <h5>Fare Options</h5>
                <div class="fare-options">
                    <div class="fare-option economy">
                        <div class="fare-class">Economy</div>
                        <div class="fare-price">NZ$${flight.classes.economy.price}</div>
                        <button class="select-fare" data-fare="economy">Select</button>
                    </div>
                    <div class="fare-option premium">
                        <div class="fare-class">Premium Economy</div>
                        <div class="fare-price">NZ$${flight.classes.premiumEconomy.price}</div>
                        <button class="select-fare" data-fare="premium">Select</button>
                    </div>
                    <div class="fare-option business">
                        <div class="fare-class">Business</div>
                        <div class="fare-price">NZ$${flight.classes.business.price}</div>
                        <button class="select-fare" data-fare="business">Select</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    flightInfoModal.classList.add('active');
    
    // Add event listeners to fare selection buttons
    document.querySelectorAll('.select-fare').forEach(button => {
        button.addEventListener('click', (e) => {
            const fareClass = e.target.getAttribute('data-fare');
            handleFareSelection(flight.flightNumber, fareClass);
        });
    });
}

function handleFareSelection(flightNumber, fareClass) {
    const message = `I want to book ${flightNumber} in ${fareClass} class`;
    userInput.value = message;
    handleSendMessage();
    flightInfoModal.classList.remove('active');
}

function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-NZ', options);
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.id = 'typingIndicator';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    typingContent.innerHTML = 'Aria is typing <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    
    typingDiv.appendChild(typingContent);
    chatBox.appendChild(typingDiv);
    scrollToBottom();
    
    return typingDiv;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Get current time for message timestamp
function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Scroll to bottom of chat
function scrollToBottom() {
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, CONFIG.AUTO_SCROLL_DELAY);
}

// Validate message
function validateMessage(message) {
    if (!message.trim()) {
        return { isValid: false, error: "Message cannot be empty" };
    }
    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
        return { isValid: false, error: `Message too long (max ${CONFIG.MAX_MESSAGE_LENGTH} characters)` };
    }
    return { isValid: true };
}

// Handle send message
async function handleSendMessage() {
    const message = userInput.value.trim();
    const validation = validateMessage(message);
    
    if (!validation.isValid) {
        if (validation.error === "Message cannot be empty") {
            return;
        }
        addMessage(validation.error, 'bot');
        return;
    }

    // Disable input while processing
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Add user message
    addMessage(message, 'user');

    // Clear input
    userInput.value = '';

    // Show typing indicator after a short delay
    const typingIndicator = showTypingIndicator();

    try {
        // Get bot reply
        const reply = await sendMessageToBot(message);
        
        // Remove typing indicator and add bot message
        hideTypingIndicator();
        addMessage(reply, 'bot');
        
        // Check if the reply contains flight information that could be displayed in modal
        if (reply.includes('NZ') && reply.includes('Depart:') && reply.includes('Arrive:')) {
            // In a real app, you would parse the flight data and show detailed modal
            setTimeout(() => {
                addMessage("Would you like to see detailed information about any of these flights? Just ask about a specific flight number!", 'bot');
            }, 1000);
        }
        
    } catch (error) {
        hideTypingIndicator();
        addMessage("Sorry, something went wrong. Please try again.", 'bot');
        console.error('Error:', error);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendBtn.addEventListener('click', handleSendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
    }
});

userInput.addEventListener('input', () => {
    sendBtn.disabled = !userInput.value.trim();
});

// Auto-focus input when chat opens
chatbotIcon.addEventListener('click', () => {
    setTimeout(() => userInput.focus(), 300);
});

// Close chat when clicking outside (optional)
document.addEventListener('click', (e) => {
    if (!chatWindow.contains(e.target) && !chatbotIcon.contains(e.target) && chatWindow.classList.contains('active')) {
        chatWindow.classList.remove('active');
    }
});

// Close flight modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target === flightInfoModal) {
        flightInfoModal.classList.remove('active');
    }
});

// Initialize button state and set default dates
window.addEventListener('load', () => {
    sendBtn.disabled = !userInput.value.trim();
    
    // Set default dates for demo
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('departureDate').valueAsDate = tomorrow;
    document.getElementById('returnDate').valueAsDate = new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);
});
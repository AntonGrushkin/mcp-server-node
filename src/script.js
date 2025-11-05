let currentIndex = 0;
const greeting = document.getElementById('greeting');
const changeTextBtn = document.getElementById('changeTextBtn');
const greetings = [
    'Hello World!',
    'Привет, мир!',
    'Bonjour le monde!',
    'Hola Mundo!',
    '你好世界!',
    'مرحبا بالعالم!'
];
const isInChatGPT = typeof window.openai !== 'undefined';

function changeGreeting() {
    currentIndex = (currentIndex + 1) % greetings.length;
    greeting.style.opacity = '0';
    
    setTimeout(() => {
        greeting.textContent = greetings[currentIndex];
        greeting.style.opacity = '1';
        
        // Сохраняем состояние, если запущено в ChatGPT
        if (isInChatGPT) {
            window.openai.setWidgetState({ currentIndex });
        }
    }, 200);
}

greeting.style.transition = 'opacity 0.2s ease-in-out';

changeTextBtn.addEventListener('click', changeGreeting);

if (isInChatGPT) {
    console.log('Hello World App запущено в ChatGPT!');
    
    if (window.openai.toolOutput) {
        console.log('Received data from the server:', window.openai.toolOutput);
    }
    
    if (window.openai.widgetState && typeof window.openai.widgetState.currentIndex === 'number') {
        currentIndex = window.openai.widgetState.currentIndex;
        greeting.textContent = greetings[currentIndex];
    }
    
    const sendMessageBtn = document.createElement('button');
    sendMessageBtn.textContent = 'Send message to chat';
    sendMessageBtn.className = 'btn';
    sendMessageBtn.style.marginTop = '10px';
    sendMessageBtn.addEventListener('click', async () => {
        await window.openai.sendFollowupMessage({
            prompt: `Current greeting: ${greetings[currentIndex]}`
        });
    });
    
    const card = document.querySelector('.card');
    card.appendChild(sendMessageBtn);
} else {
    console.log('Hello World App loaded locally');
}
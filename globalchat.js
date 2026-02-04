(function () {
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    /* ================= FONT ================= */
    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);

    /* ================= HELPER: LANGUAGE DEFINITIONS ================= */
    // We define this outside to access it dynamically later
    const langContent = {
        ru: {
            code: 'ru',
            welcome: 'Здравствуйте! Я ваш персональный ассистент из Global Pay. Чем могу вам помочь?',
            launcher: 'Нужна помощь?'
        },
        uz: {
            code: 'uz',
            welcome: 'Assalomu alaykum! Men Global Pay shaxsiy yordamchisiman. Sizga qanday yordam bera olaman?',
            launcher: 'Yordam kerakmi?'
        },
        en: {
            code: 'en',
            welcome: 'Hello! I am your personal assistant from Global Pay. How can I help you?',
            launcher: 'Need help?'
        }
    };

    function getLanguageByUrl() {
        const path = window.location.pathname.toLowerCase();
        // Check strict paths or segments
        if (path.includes('/uz') || path === 'uz') return langContent.uz;
        if (path.includes('/en') || path === 'en') return langContent.en;
        return langContent.ru;
    }

    let currentLang = getLanguageByUrl();

    /* ================= HELPER: SESSION ID ================= */
    function generateSessionId() {
        if (window.crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    }

    /* ================= STYLES ================= */
    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        .chat-assist-widget {
            --chat-color-primary: var(--chat-widget-primary, #e9532f); 
            --chat-color-secondary: var(--chat-widget-secondary, #d1421f);
            --chat-color-border: rgba(233, 83, 47, 0.25);
            --chat-color-surface: #ffffff;
            --chat-shadow-lg: 0 10px 25px rgba(0,0,0,.18);
            --chat-radius-md: 12px;
            --chat-radius-lg: 16px; 
            --chat-radius-full: 9999px;
            font-family: 'Poppins', sans-serif;
        }

        .chat-window {
            position: fixed;
            bottom: 70px;
            right: 20px;
            width: 340px; 
            height: 480px;
            background: var(--chat-color-surface);
            border-radius: var(--chat-radius-lg);
            border: 1px solid var(--chat-color-border);
            box-shadow: var(--chat-shadow-lg);
            display: none;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px) scale(.95);
            transition: .3s ease-in-out;
            z-index: 1000;
        }

        .chat-window.visible {
            display: flex;
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .chat-header {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg,var(--chat-color-primary),var(--chat-color-secondary));
            color: #fff;
            position: relative;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            flex-shrink: 0;
        }

        .chat-header-logo {
            width: 24px;
            height: 24px;
            background: #fff;
            border-radius: 6px;
            padding: 3px;
        }
        
        .chat-header span {
            font-size: 14px;
            font-weight: 600;
        }

        .chat-close-btn {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,.2);
            border: none;
            color: #fff;
            width: 24px;
            height: 24px;
            border-radius: var(--chat-radius-full);
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .chat-close-btn:hover { background: rgba(255,255,255,.4); }

        .chat-body {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            background: #f9fafb;
        }

        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            scroll-behavior: smooth;
        }

        .chat-bubble {
            padding: 10px 14px;
            border-radius: var(--chat-radius-md);
            max-width: 85%;
            font-size: 13px;
            line-height: 1.4;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .user-bubble {
            align-self: flex-end;
            color: #fff;
            background: linear-gradient(135deg,var(--chat-color-primary),var(--chat-color-secondary));
            border-bottom-right-radius: 2px;
        }

        .bot-bubble {
            align-self: flex-start;
            background: #fff;
            border: 1px solid var(--chat-color-border);
            border-bottom-left-radius: 2px;
            color: #333;
        }

        .typing-bubble {
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 4px;
            width: fit-content;
        }
        .typing-dot {
            width: 5px;
            height: 5px;
            background: #888;
            border-radius: 50%;
            animation: typingBounce 1.4s infinite ease-in-out both;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typingBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        .chat-controls {
            padding: 12px;
            display: flex;
            gap: 8px;
            background: #fff;
            border-top: 1px solid rgba(0,0,0,0.05);
            flex-shrink: 0;
        }

        .chat-textarea {
            flex: 1;
            padding: 10px;
            border-radius: var(--chat-radius-md);
            border: 1px solid #e5e7eb;
            resize: none;
            outline: none;
            font-family: inherit;
            font-size: 13px;
            transition: border 0.2s;
        }
        .chat-textarea:focus { border-color: var(--chat-color-primary); }

        .chat-submit {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: var(--chat-radius-md);
            background: linear-gradient(135deg,var(--chat-color-primary),var(--chat-color-secondary));
            color: #fff;
            cursor: pointer;
            transition: transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        .chat-submit:active { transform: scale(0.95); }

        .chat-launcher {
            position: fixed;
            bottom: 20px;
            right: 20px;
            height: 40px; 
            padding: 0 20px; 
            border: none;
            border-radius: 10px; 
            background: var(--chat-color-primary); 
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 999;
            box-shadow: 0 4px 14px rgba(233, 83, 47, 0.4);
            font-weight: 500;
            font-size: 14px; 
            transition: transform 0.2s;
        }
        .chat-launcher:hover { transform: translateY(-2px); }

        @media (max-width: 768px) {
            .chat-window {
                width: 100%;
                height: 100%;
                bottom: 0;
                right: 0 !important;
                left: 0 !important;
                border-radius: 0;
                border: none;
            }
            .chat-launcher {
                bottom: 10px;
                right: 10px;
            }
        }
    `;
    document.head.appendChild(widgetStyles);

    /* ================= CONFIG ================= */
    const settings = window.ChatWidgetConfig || {
        webhook: { url: '', route: '' },
        branding: {
            logo: '',
            name: 'Global Pay UZ',
            welcomeText: currentLang.welcome 
        },
        style: { primaryColor: '#e9532f', secondaryColor: '#d1421f' }
    };

    let conversationId = null;
    let waiting = false;

    // DOM Creation
    const root = document.createElement('div');
    root.className = 'chat-assist-widget';
    root.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    root.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';

    chatWindow.innerHTML = `
        <div class="chat-header">
            <img class="chat-header-logo" src="${settings.branding.logo}" alt="GP">
            <span>${settings.branding.name}</span>
            <button class="chat-close-btn">×</button>
        </div>
        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <textarea class="chat-textarea" placeholder="..." rows="1"></textarea>
                <button class="chat-submit">➤</button>
            </div>
        </div>
    `;

    const launcher = document.createElement('button');
    launcher.className = 'chat-launcher';
    launcher.textContent = currentLang.launcher; // Init with current lang

    root.appendChild(chatWindow);
    root.appendChild(launcher);
    document.body.appendChild(root);

    // Elements
    const messages = chatWindow.querySelector('.chat-messages');
    const textarea = chatWindow.querySelector('.chat-textarea');
    const sendBtn = chatWindow.querySelector('.chat-submit');
    const closeBtn = chatWindow.querySelector('.chat-close-btn');

    // Scroll Helper
    function scrollToBottom() {
        messages.scrollTop = messages.scrollHeight;
    }

    // Typing Indicator Logic
    let typingBubble = null;

    function showTyping() {
        if (typingBubble) return;
        typingBubble = document.createElement('div');
        typingBubble.className = 'chat-bubble bot-bubble typing-bubble';
        typingBubble.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messages.appendChild(typingBubble);
        scrollToBottom();
    }

    function hideTyping() {
        if (typingBubble && typingBubble.parentNode) {
            typingBubble.parentNode.removeChild(typingBubble);
        }
        typingBubble = null;
    }

    // Initialize Chat Session (Auto-start)
    async function initSession() {
        if (!conversationId) conversationId = generateSessionId();
        
        showTyping(); 

        try {
            const res = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'loadPreviousSession',
                    sessionId: conversationId,
                    route: settings.webhook.route,
                    language: currentLang.code 
                })
            });
            const data = await res.json();
            hideTyping();
            
            const msg = document.createElement('div');
            msg.className = 'chat-bubble bot-bubble';
            msg.textContent = (data && data.output) ? data.output : currentLang.welcome;
            messages.appendChild(msg);
        } catch (err) {
            hideTyping();
            const msg = document.createElement('div');
            msg.className = 'chat-bubble bot-bubble';
            msg.textContent = currentLang.welcome;
            messages.appendChild(msg);
        }
        scrollToBottom();
    }

    // Send Message
    async function sendMessage(text) {
        if (waiting || !conversationId) return;
        waiting = true;

        const user = document.createElement('div');
        user.className = 'chat-bubble user-bubble';
        user.textContent = text;
        messages.appendChild(user);
        scrollToBottom();

        showTyping();

        try {
            const res = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sendMessage',
                    sessionId: conversationId,
                    route: settings.webhook.route,
                    chatInput: text,
                    language: currentLang.code
                })
            });

            const data = await res.json();
            hideTyping();

            const bot = document.createElement('div');
            bot.className = 'chat-bubble bot-bubble';
            bot.textContent = data?.output || 'Error.';
            messages.appendChild(bot);
            scrollToBottom();

        } catch (e) {
            hideTyping();
            const err = document.createElement('div');
            err.className = 'chat-bubble bot-bubble';
            err.textContent = 'Connection error.';
            messages.appendChild(err);
        }

        waiting = false;
    }

    // Event Listeners
    sendBtn.onclick = () => {
        const text = textarea.value.trim();
        if (!text) return;
        textarea.value = '';
        sendMessage(text);
    };

    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    launcher.onclick = () => {
        const isVisible = chatWindow.classList.contains('visible');
        if (!isVisible) {
            chatWindow.classList.add('visible');
            if (!conversationId) {
                initSession();
            }
        } else {
            chatWindow.classList.remove('visible');
        }
    };

    closeBtn.onclick = () => chatWindow.classList.remove('visible');

    /* =========================================================================
       SPA HANDLING: DETECT URL CHANGES AND UPDATE LANGUAGE LIVE
    ========================================================================= */
    function handleUrlChange() {
        const newLang = getLanguageByUrl();
        
        // Only update if language actually changed
        if (newLang.code !== currentLang.code) {
            currentLang = newLang;
            
            // 1. Update Launcher Button
            if (launcher) launcher.textContent = currentLang.launcher;

            // 2. Update Welcome Message (If chat is clean or only has the old welcome message)
            // We check if there is only 1 message and it's a bot bubble
            const bubbles = messages.querySelectorAll('.chat-bubble');
            if (bubbles.length === 1 && bubbles[0].classList.contains('bot-bubble')) {
                bubbles[0].textContent = currentLang.welcome;
            }
        }
    }

    // Hook into History API for PushState/ReplaceState (Standard SPA routing)
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        handleUrlChange();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        handleUrlChange();
    };

    // Hook into browser Back/Forward buttons
    window.addEventListener('popstate', handleUrlChange);
    
    // Also run once purely to ensure sync if script loaded late
    handleUrlChange();

})();

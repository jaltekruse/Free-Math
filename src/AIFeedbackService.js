
// AI Feedback Service for integrating with AI APIs
class AIFeedbackService {
    constructor() {
        this.apiKey = null;
        this.selectedProvider = 'openai'; // 'openai', 'anthropic', or 'google'
    }

    setApiKey(key, provider = 'openai') {
        this.apiKey = key;
        this.selectedProvider = provider;
        // Store in localStorage for session persistence
        localStorage.setItem('ai_api_key', key);
        localStorage.setItem('ai_provider', provider);
    }

    getStoredCredentials() {
        const key = localStorage.getItem('ai_api_key');
        const provider = localStorage.getItem('ai_provider') || 'openai';
        if (key) {
            this.apiKey = key;
            this.selectedProvider = provider;
        }
        return { key, provider };
    }

    async callOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful math tutor. Provide constructive feedback on student work, identify errors clearly, and suggest improvements. Be encouraging and educational.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropic(prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: `You are a helpful math tutor. ${prompt}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async getFeedback(mathSteps, problemNumber) {
        if (!this.apiKey) {
            throw new Error('No API key configured');
        }

        const prompt = `I am a high school math student. I used a tool to write out some step-by-step work that can export it as LaTeX. Can you take a look at my work and give me feedback?

Problem ${problemNumber || 'Number'}:
${mathSteps}

Please provide constructive feedback on my mathematical reasoning, identify any errors, and suggest improvements.`;

        try {
            let feedback;
            switch (this.selectedProvider) {
                case 'openai':
                    feedback = await this.callOpenAI(prompt);
                    break;
                case 'anthropic':
                    feedback = await this.callAnthropic(prompt);
                    break;
                default:
                    throw new Error('Unsupported AI provider');
            }
            return feedback;
        } catch (error) {
            console.error('AI Feedback Error:', error);
            throw error;
        }
    }
}

const aiFeedbackService = new AIFeedbackService();
export default aiFeedbackService;

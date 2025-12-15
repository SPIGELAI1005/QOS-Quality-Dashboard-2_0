/**
 * Generic LLM API client
 * Supports multiple providers through environment configuration
 */

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  error?: string;
  errorType?: 'api_key' | 'rate_limit' | 'network' | 'unknown';
  errorDetails?: {
    message: string;
    code?: string;
    statusCode?: number;
  };
}

/**
 * Generic LLM client interface
 */
export interface LLMClient {
  chat(request: LLMRequest): Promise<LLMResponse>;
}

/**
 * OpenAI-compatible client
 */
class OpenAICompatibleClient implements LLMClient {
  constructor(
    private apiKey: string,
    private baseUrl: string = 'https://api.openai.com/v1',
    private model: string = 'gpt-4o-mini'
  ) {}

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const body: Record<string, unknown> = {
        model: this.model,
        messages: request.messages,
        max_completion_tokens: request.maxTokens ?? 2000,
      };
      
      // Only add temperature if explicitly provided (some models don't support it)
      if (request.temperature !== undefined) {
        body.temperature = request.temperature;
      }
      
      console.log('[OpenAICompatibleClient] Making API call:', {
        baseUrl: this.baseUrl,
        model: this.model,
        messagesCount: request.messages.length,
        maxTokens: body.max_completion_tokens,
      });
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: { error?: { message?: string; code?: string; type?: string } } = {};
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // If parsing fails, use raw text
        }

        const errorMessage = errorData.error?.message || errorText;
        const errorCode = errorData.error?.code || errorData.error?.type;
        
        // Detect error type
        let errorType: 'api_key' | 'rate_limit' | 'network' | 'unknown' = 'unknown';
        if (response.status === 401 || errorCode === 'invalid_api_key' || errorMessage.toLowerCase().includes('api key')) {
          errorType = 'api_key';
        } else if (response.status === 429 || errorCode === 'rate_limit_exceeded') {
          errorType = 'rate_limit';
        } else if (response.status >= 500 || errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('timeout')) {
          errorType = 'network';
        }

        return {
          content: '',
          error: `API error (${response.status}): ${errorText}`,
          errorType,
          errorDetails: {
            message: errorMessage,
            code: errorCode,
            statusCode: response.status,
          },
        };
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      if (!content || content.trim().length === 0) {
        console.warn('[OpenAICompatibleClient] Empty content received from API');
        return {
          content: '',
          error: 'AI service returned empty content. The model may have failed to generate a response.',
          errorType: 'unknown',
          errorDetails: {
            message: 'Empty content from API response',
          },
        };
      }
      
      return {
        content,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: '',
        error: errorMessage,
        errorType: errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch') ? 'network' : 'unknown',
        errorDetails: {
          message: errorMessage,
        },
      };
    }
  }
}

/**
 * Anthropic-compatible client
 */
class AnthropicCompatibleClient implements LLMClient {
  constructor(
    private apiKey: string,
    private model: string = 'claude-3-5-sonnet-20241022'
  ) {}

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      console.log('[AnthropicCompatibleClient] Making API call:', {
        model: this.model,
        messagesCount: request.messages.length,
        maxTokens: request.maxTokens ?? 2000,
      });
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens ?? 2000,
          messages: request.messages.map((msg) => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.role === 'system' ? `System: ${msg.content}` : msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: { error?: { message?: string; code?: string; type?: string } } = {};
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // If parsing fails, use raw text
        }

        const errorMessage = errorData.error?.message || errorText;
        const errorCode = errorData.error?.code || errorData.error?.type;
        
        // Detect error type
        let errorType: 'api_key' | 'rate_limit' | 'network' | 'unknown' = 'unknown';
        if (response.status === 401 || errorCode === 'invalid_api_key' || errorMessage.toLowerCase().includes('api key')) {
          errorType = 'api_key';
        } else if (response.status === 429 || errorCode === 'rate_limit_exceeded') {
          errorType = 'rate_limit';
        } else if (response.status >= 500 || errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('timeout')) {
          errorType = 'network';
        }

        return {
          content: '',
          error: `API error (${response.status}): ${errorText}`,
          errorType,
          errorDetails: {
            message: errorMessage,
            code: errorCode,
            statusCode: response.status,
          },
        };
      }

      const data = await response.json();
      const content = data.content[0]?.text || '';
      
      if (!content || content.trim().length === 0) {
        console.warn('[AnthropicCompatibleClient] Empty content received from API');
        return {
          content: '',
          error: 'AI service returned empty content. The model may have failed to generate a response.',
          errorType: 'unknown',
          errorDetails: {
            message: 'Empty content from API response',
          },
        };
      }
      
      return {
        content,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: '',
        error: errorMessage,
        errorType: errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch') ? 'network' : 'unknown',
        errorDetails: {
          message: errorMessage,
        },
      };
    }
  }
}

/**
 * Create LLM client from environment variables
 */
export function createLLMClient(): LLMClient | null {
  const apiKey = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'openai';
  const model = process.env.AI_MODEL;
  const baseUrl = process.env.AI_BASE_URL;

  if (!apiKey) {
    return null;
  }

  switch (provider) {
    case 'openai':
      return new OpenAICompatibleClient(apiKey, baseUrl, model);
    case 'anthropic':
      return new AnthropicCompatibleClient(apiKey, model);
    default:
      // Default to OpenAI-compatible
      return new OpenAICompatibleClient(apiKey, baseUrl, model);
  }
}

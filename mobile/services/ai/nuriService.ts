import api from '../api';

export interface NuriContext {
  source?: 'home' | 'product';
  profile?: {
    id?: string;
    name?: string;
    relation?: string;
    allergies?: string[];
  };
  product?: {
    id?: string;
    name?: string;
    ingredients?: string[];
    suitabilityStatus?: string;
    expiryDate?: string;
  };
}

export interface NuriRequest {
  input: string;
  context?: NuriContext;
  isWelcome?: boolean;
}

export interface NuriResponse {
  success: boolean;
  message?: string;
  data?: {
    reply?: string;
    response?: string;
    text?: string;
  };
}

export async function sendMessageToNuri({
  input,
  context,
  isWelcome = false,
}: NuriRequest): Promise<string> {
  try {
    const response = await api.post<NuriResponse>('/nuri/analyze', {
      input,
      context,
      isWelcome,
    });

    const payload = response.data;
    return (
      payload?.data?.reply ||
      payload?.data?.response ||
      payload?.data?.text ||
      payload?.message ||
      "Hi, I'm Nuri. How can I help today?"
    );
  } catch (error) {
    if (isWelcome) {
      return "Hi, I'm Nuri. How can I help you with this product or your health today?";
    }
    return "I'm having trouble reaching the assistant service right now. Please try again shortly.";
  }
}

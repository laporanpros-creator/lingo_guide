
export enum Sender {
  User = 'user',
  Bot = 'bot'
}

export enum ScenarioType {
  FreeTalk = 'free_talk',
  JobInterview = 'job_interview',
  CoffeeShop = 'coffee_shop',
  RestaurantOrder = 'restaurant_order',
  HotelCheckIn = 'hotel_check_in',
  AirportCheckIn = 'airport_check_in',
  AskingDirections = 'asking_directions',
  DoctorVisit = 'doctor_visit',
  Shopping = 'shopping',
  MakingReservation = 'making_reservation',
  Immigration = 'immigration',
  TechSupport = 'tech_support'
}

export interface TutorNote {
  type: 'correction' | 'alternative' | 'praise';
  englishContent: string;
  indonesianExplanation: string;
  pronunciationTip?: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  tutorNote?: TutorNote;
  suggestedReplies?: string[];
  timestamp: number;
  isAudioMessage?: boolean;
}

export interface VoiceSettings {
  pitch: number; // 0 to 2 (1 is default)
  rate: number;  // 0.1 to 10 (1 is default)
}

export interface Scenario {
  id: ScenarioType;
  title: string;
  description: string;
  emoji: string;
  iconUrl: string;
  initialPrompt: string;
  systemRole: string;
  voiceSettings: VoiceSettings;
}

export interface GeminiResponseSchema {
  userTranscript?: string;
  roleplayResponse: string;
  tutorNote: TutorNote;
  suggestedReplies: string[];
}

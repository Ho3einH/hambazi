export const SPORTS = [
  { name: "Football", emoji: "⚽" },
  { name: "Volleyball", emoji: "🏐" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Ping Pong", emoji: "🏓" },
  { name: "Tennis", emoji: "🎾" },
  { name: "Badminton", emoji: "🏸" },
] as const;

export type Sport = (typeof SPORTS)[number]["name"];
export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "All levels";
export type AgeGroup = "Under 18" | "18–30" | "30–45" | "+45" | "All ages";
export type Access = "Public" | "Private";
export type MainTab = "Home" | "My Matches" | "Messages" | "More";
export type MatchesSubtab = "Upcoming" | "Requests" | "Hosted" | "Played" | "Saved matches";
export type Screen =
  | "onboarding"
  | "auth"
  | "profile-setup"
  | "home"
  | "more"
  | "matches"
  | "messages"
  | "chat"
  | "profile"
  | "other-profile"
  | "settings"
  | "faq"
  | "create-match"
  | "match-success"
  | "match-detail";

export interface Match {
  id: string;
  sport: Sport;
  title: string;
  format: "Players" | "Team";
  venue: string;
  address: string;
  city: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  players: number;
  fee: number;
  skillLevels: SkillLevel[];
  ageGroups: AgeGroup[];
  access: Access;
  description: string;
  host: string;
  hostHandle: string;
  hostAvatar?: string;
  status?: "upcoming" | "played";
}

export interface Profile {
  name: string;
  username: string;
  city: string;
  gender: string;
  ageGroup: AgeGroup;
  bio: string;
  sports: Sport[];
  skillBySport: Partial<Record<Sport, SkillLevel>>;
  avatar?: string;
}

export interface JoinRequest {
  id: string;
  matchId: string;
  direction: "incoming" | "outgoing";
  name: string;
  username: string;
  ageGroup: AgeGroup;
  skill: SkillLevel;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  mine: boolean;
  attachment?: string;
}

export interface Conversation {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  unread: boolean;
  matchTitle: string;
  messages: ChatMessage[];
}

export interface Preferences {
  essential: boolean;
  personalized: boolean;
  marketing: boolean;
  approximateLocation: boolean;
}

export interface PersistedAppData {
  hasStarted: boolean;
  profile: Profile;
  location: string;
  matches: Match[];
  requests: JoinRequest[];
  savedMatchIds: string[];
  hostedMatchIds: string[];
  acceptedMatchIds: string[];
  playedMatchIds: string[];
  blockedUsers: string[];
  conversations: Conversation[];
  preferences: Preferences;
}

export interface AppState extends PersistedAppData {
  screen: Screen;
  mainTab: MainTab;
  matchesTab: MatchesSubtab;
  selectedMatchId: string | null;
  editingMatchId: string | null;
  matchAction: "created" | "updated" | null;
  detailTab: "Venue" | "Details" | "Players";
  activeChatId: string | null;
  profileTarget: "mine" | "other";
  profileMatchId: string | null;
  profileConversationId: string | null;
  authNotice: string;
}

export type AppAction =
  | { type: "HYDRATE"; payload: PersistedAppData | null }
  | { type: "NAVIGATE"; screen: Screen }
  | { type: "SET_MAIN_TAB"; tab: MainTab }
  | { type: "SET_MATCH_TAB"; tab: MatchesSubtab }
  | { type: "SET_LOCATION"; city: string }
  | { type: "SET_DETAIL_TAB"; tab: AppState["detailTab"] }
  | { type: "OPEN_MATCH"; id: string }
  | { type: "OPEN_CHAT"; id: string }
  | {
      type: "START_CONVERSATION";
      id: string;
      name: string;
      username: string;
      matchTitle: string;
      avatar?: string;
    }
  | {
      type: "OPEN_PROFILE";
      target: "mine" | "other";
      matchId?: string;
      conversationId?: string;
    }
  | { type: "STARTED" }
  | { type: "SET_AUTH_NOTICE"; message: string }
  | { type: "UPDATE_PROFILE"; profile: Profile }
  | { type: "CREATE_MATCH"; match: Match }
  | { type: "OPEN_MATCH_CREATION" }
  | { type: "EDIT_MATCH"; id: string }
  | { type: "UPDATE_MATCH"; match: Match }
  | { type: "CANCEL_MATCH"; id: string }
  | { type: "TOGGLE_SAVED"; id: string }
  | { type: "REQUEST_TO_JOIN"; id: string; requestId: string }
  | { type: "CANCEL_REQUEST"; id: string }
  | { type: "RESPOND_TO_REQUEST"; id: string; accept: boolean }
  | { type: "LEAVE_MATCH"; id: string }
  | { type: "SEND_MESSAGE"; conversationId: string; message: ChatMessage }
  | { type: "UPDATE_PREFERENCE"; key: keyof Preferences; value: boolean }
  | { type: "BLOCK_USER"; username: string }
  | { type: "UNBLOCK_USER"; username: string }
  | { type: "RESET_TO_WELCOME" }
  | { type: "SIGN_OUT" };

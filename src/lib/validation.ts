import { z } from "zod";
import { SPORTS, type AgeGroup, type SkillLevel, type Sport } from "@/lib/domain";

const sportNames = SPORTS.map(({ name }) => name) as [Sport, ...Sport[]];

export const sportSchema = z.enum(sportNames);
export const skillLevelSchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "All levels",
] satisfies [SkillLevel, ...SkillLevel[]]);
export const ageGroupSchema = z.enum(["Under 18", "18–30", "30–45", "+45", "All ages"] satisfies [
  AgeGroup,
  ...AgeGroup[],
]);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().min(2).max(32),
  city: z.string().trim().min(1).max(80),
  gender: z.string().max(40),
  ageGroup: ageGroupSchema,
  bio: z.string().max(500),
  sports: z.array(sportSchema),
  skillBySport: z.record(z.string(), skillLevelSchema),
  avatar: z.string().optional(),
});

const matchSchema = z
  .object({
    id: z.string().min(1),
    sport: sportSchema,
    title: z.string().trim().min(2).max(70),
    format: z.enum(["Players", "Team"]),
    venue: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(180),
    city: z.string().trim().min(1).max(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    duration: z.number().int().min(30).max(240),
    capacity: z.number().int().min(2).max(30),
    players: z.number().int().min(1).max(30),
    fee: z.number().finite().min(0).max(500),
    skillLevels: z.array(skillLevelSchema).min(1),
    ageGroups: z.array(ageGroupSchema).min(1),
    access: z.enum(["Public", "Private"]),
    description: z.string().max(240),
    host: z.string().min(1).max(80),
    hostHandle: z.string().min(2).max(32),
    hostAvatar: z.string().optional(),
    status: z.enum(["upcoming", "played"]).optional(),
  })
  .refine((match) => match.players <= match.capacity, {
    message: "Joined players cannot exceed match capacity.",
    path: ["players"],
  });

const requestSchema = z.object({
  id: z.string().min(1),
  matchId: z.string().min(1),
  direction: z.enum(["incoming", "outgoing"]),
  name: z.string().min(1).max(80),
  username: z.string().min(2).max(32),
  ageGroup: ageGroupSchema,
  skill: skillLevelSchema,
  status: z.enum(["pending", "accepted", "declined", "cancelled"]),
});

const messageSchema = z.object({
  id: z.string().min(1),
  text: z.string().max(500),
  createdAt: z.string().min(1).max(40),
  mine: z.boolean(),
  attachment: z.string().max(180).optional(),
});

const conversationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  username: z.string().min(2).max(32),
  avatar: z.string().optional(),
  unread: z.boolean(),
  matchTitle: z.string().min(1).max(120),
  messages: z.array(messageSchema),
});

export const persistedAppDataSchema = z.object({
  hasStarted: z.boolean(),
  profile: profileSchema,
  location: z.string().min(1).max(80),
  matches: z.array(matchSchema),
  requests: z.array(requestSchema),
  savedMatchIds: z.array(z.string()),
  hostedMatchIds: z.array(z.string()),
  acceptedMatchIds: z.array(z.string()),
  playedMatchIds: z.array(z.string()),
  blockedUsers: z.array(z.string()),
  conversations: z.array(conversationSchema),
  preferences: z.object({
    essential: z.boolean(),
    personalized: z.boolean(),
    marketing: z.boolean(),
    approximateLocation: z.boolean(),
  }),
});

export const signInSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});

export const demoUserSchema = z.object({
  id: z.number(),
  username: z.string().min(1),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  image: z.string().optional(),
  accessToken: z.string().optional(),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80, "Your name is too long."),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Use at least 6 characters for your password.")
    .max(128, "Your password is too long."),
});

export const matchDraftSchema = z
  .object({
    sport: sportSchema,
    format: z.enum(["Players", "Team"]),
    title: z.string().trim().min(3, "Add a match name with at least 3 characters.").max(70),
    capacity: z.number().int().min(2).max(30),
    duration: z.number().int().min(30).max(240),
    fee: z.number().finite().min(0).max(500),
    venue: z.string().trim().min(2, "Choose a venue.").max(120),
    address: z.string().trim().min(3, "Add the venue address.").max(180),
    city: z.string().trim().min(1).max(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid start time."),
    skillLevels: z.array(skillLevelSchema).min(1, "Choose at least one skill level."),
    ageGroups: z.array(ageGroupSchema).min(1, "Choose at least one age group."),
    access: z.enum(["Public", "Private"]),
    description: z.string().max(240),
  })
  .superRefine((draft, context) => {
    const startsAt = new Date(`${draft.date}T${draft.time}`);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      context.addIssue({
        code: "custom",
        path: ["date"],
        message: "Choose a future date and time.",
      });
    }
  });

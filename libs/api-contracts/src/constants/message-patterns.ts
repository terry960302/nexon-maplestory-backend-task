export const MessagePatterns = {
  // AUTH
  AUTH_SIGNUP: "auth.signup", // POST /auth/signup
  AUTH_LOGIN: "auth.login", // POST /auth/login
  AUTH_VALIDATE_TOKEN: "auth.validateToken", // 내부 토큰 검증 등
  AUTH_REFRESH: "auth.refresh", // 토큰 갱신

  // EVENTS
  EVENTS_LIST: "events.list", // GET /events
  EVENTS_GET: "events.get", // GET /events/:id
  EVENTS_CREATE: "events.create", // POST /events
  EVENTS_UPDATE: "events.update",

  // REWARDS
  REWARDS_LIST: "rewards.list", // GET /events/:eventId/rewards
  REWARDS_ADD: "rewards.create", // POST /events/:eventId/rewards

  // REWARD REQUESTS
  REWARD_REQUESTS_CREATE: "rewardRequests.create", // POST /events/:eventId/reward-requests
  REWARD_REQUESTS_USER_LIST: "rewardRequests.userList", // GET /users/me/reward-requests
  REWARD_REQUESTS_EVENT_LIST: "rewardRequests.eventList", // GET /events/:eventId/reward-requests
  REWARD_REQUESTS_APPROVE: "rewardRequests.approve", // POST /reward-requests/:id/approve

  // USER_ACTIVITY
  USER_ACTIVITY_CREATE: "userActivity.create",

  // RATE_LIMIT_CHECK: 'rateLimit.check',   // 예: 분당 요청 한도 체크 등
  PING: "ping",
} as const;
